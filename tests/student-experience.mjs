import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const server=createServer(async(req,res)=>{
 const raw=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const f=path.resolve(root,"."+raw),filename=raw.endsWith("/")?path.join(f,"index.html"):f;
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(filename)).isFile())throw Error();
  const type=filename.endsWith(".html")?"text/html; charset=utf-8":
   filename.endsWith(".css")?"text/css":filename.endsWith(".svg")?"image/svg+xml":"text/javascript";
  res.writeHead(200,{"Content-Type":type});res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"demo"}}}),signOut:async()=>({})}}}};';
const statuses=[
 {index:0,titleAr:"التركيبة الأساسية",title:"Basics",short:"تدريب أساسي",passed:true,locked:false},
 {index:1,titleAr:"التطبيق",title:"Practice",short:"تدريب متابعة",passed:false,locked:false}
];
const makeCourse=(title,titleAr,passed=false)=>({
 student:"طالب STEP",course:{title,titleAr,subtitle:"شرح منظم بأسئلة من المصادر",totalQuestions:4},
 sections:passed?statuses.map(s=>({...s,passed:true})):statuses,nextIndex:1,
 completed:passed,exam:{best:passed?88:0,unlocked:passed}
});
const courseBySlug={
 "subject-verb-agreement":makeCourse("Subject–Verb Agreement","تطابق الفاعل والفعل",true),
 "present-simple":makeCourse("Present Simple","المضارع البسيط"),
 "present-continuous":makeCourse("Present Continuous","المضارع المستمر"),
 "past-simple":makeCourse("Past Simple","الماضي البسيط")
};
const catalog={axes:[
 {code:"reading-comprehension",position:1,title_ar:"القراءة",title_en:"Reading"},
 {code:"listening",position:2,title_ar:"الاستماع",title_en:"Listening"},
 {code:"grammar",position:3,title_ar:"الجرامر",title_en:"Grammar"},
 {code:"writing-analysis",position:4,title_ar:"التحليل الكتابي",title_en:"Writing Analysis"}
],indicators:Object.keys(courseBySlug).map((slug,i)=>({
 axis_code:"grammar",slug,title_ar:courseBySlug[slug].course.titleAr,
 title_en:courseBySlug[slug].course.title,position:i+101
}))};
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const failures=[];page.on("pageerror",error=>failures.push(String(error)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",route=>
   route.fulfill({contentType:"text/javascript",body:sdk}));
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  await page.route("https://fonts.gstatic.com/**",route=>route.abort());
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",route=>{
   const url=new URL(route.request().url());
   const api=url.pathname.split("/step-course")[1];
   let result=null;
   if(api==="/course")result=courseBySlug["present-simple"];
   if(api==="/agreement/course")result=courseBySlug["subject-verb-agreement"];
   if(api==="/continuous/course")result=courseBySlug["present-continuous"];
   if(api==="/lesson/past-simple/course")result=courseBySlug["past-simple"];
   if(api==="/catalog")result=catalog;
   if(api==="/followups")result={followups:[]};
   return route.fulfill({status:result?200:404,contentType:"application/json",
    body:JSON.stringify(result||{error:"Mock route not recognized"})});
  });
  await page.goto(origin+"/step-grammar-student/",{waitUntil:"domcontentloaded"});
  await page.locator(".student-learning-path").waitFor({timeout:15000});
  assert.equal(await page.locator(".student-course-tile").count(),4,
   "Every published source-approved lesson appears without hardcoded card edits");
  assert.equal(await page.locator(".course-card").count(),0,
   "Legacy duplicate course cards are replaced by the clear learning path");
  assert(await page.locator(".student-hero-cta").count()===1,"Prominent resume action exists");
  assert.equal(await page.locator('.student-course-tile').last().locator("h3").innerText(),"Past Simple");
  assert((await page.locator('.student-course-tile').last().locator("a").getAttribute("href"))
   .includes("lesson.html?slug=past-simple&step=1"),"New lesson opens via generic player with saved stage");
  assert.equal(await page.locator(".student-quicknav a").count(),2,
   "Only meaningful section shortcuts appear when no follow-up tasks exist");
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),
   "The learner dashboard must not overflow at width "+width);
  assert.deepEqual(failures,[],"No browser script errors at "+width+"px");
  console.log("PASS student dashboard "+width+"px: four dynamic lessons, resume, responsive skin");
  await page.close();
 }
}finally{
 await browser.close();await new Promise(ok=>server.close(ok));
}
