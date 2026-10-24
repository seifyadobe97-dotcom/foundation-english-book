import assert from "node:assert/strict";
import {readFile,stat,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

// Integrated learner path against the actual public Pages artifact, synthetic backend
// and mocked login only. No private bank, source PDF or production student is accessed.
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const root=path.join(repoRoot,".step-public-learner-journey");
execFileSync(process.execPath,[path.join(repoRoot,"scripts/build-step-public-site.mjs"),root]);
const server=createServer(async(req,res)=>{
 const raw=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const p=path.resolve(root,"."+raw),file=raw.endsWith("/")?path.join(p,"index.html"):p;
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(file)).isFile())throw Error("Missing");
  const mime=file.endsWith(".html")?"text/html; charset=utf-8":
   file.endsWith(".css")?"text/css":file.endsWith(".svg")?"image/svg+xml":"text/javascript";
  res.writeHead(200,{"Content-Type":mime});res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"synthetic"}}}),signOut:async()=>({})}}}};';
const teaching=[{title:"Synthetic basics",detail:"Understand the rule using fresh demo examples.",
 cards:[["Example","I worked yesterday","Simple past","1"]],
 examples:[["Example","We [[studied]] yesterday.","Past event"]],
 tip:"Find the correct verb form",warning:{wrong:"He go yesterday.",correct:"He went yesterday.",why:"Past simple needs V2."},
 formulas:[["Affirmative","I","worked","yesterday"]],
 table:{headers:["Verb","Past"],rows:[["work","worked"]]},
 extra:{heading:"Practice",paragraphs:["All questions below are synthetic."]}}];
const questions=Array.from({length:4},(_,i)=>({id:"synthetic-"+i,text:"Original mock practice "+i,
 options:{A:"correct",B:"wrong one",C:"wrong two",D:"wrong three"}}));
const stage=(passed=false)=>({index:0,title:"Basics",titleAr:"القاعدة الأساسية",
 short:"Synthetic",passed,locked:false});
const baseCourse=()=>({student:"طالب تجريبي",course:{title:"Present Simple",titleAr:"المضارع البسيط"},
 sections:[stage()],nextIndex:0,exam:{best:0,unlocked:false}});
const published=(slug,title,ar,axis,position)=>({slug,title_en:title,title_ar:ar,axis_code:axis,position});
const catalog={axes:[{code:"grammar",position:1,title_ar:"الجرامر",title_en:"Grammar"},
 {code:"writing-analysis",position:2,title_ar:"التحليل الكتابي",title_en:"Writing"}],
 indicators:[
  published("present-simple","Present Simple","المضارع البسيط","grammar",102),
  published("past-simple","Past Simple","الماضي البسيط","grammar",104),
  published("punctuation","Punctuation","علامات الترقيم","writing-analysis",1001)
 ]};
try{
 for(const width of [390,1280]){
  let pastPassed=false,submissions=0;
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on("pageerror",err=>errors.push(String(err)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>
   r.fulfill({contentType:"text/javascript",body:sdk}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",r=>{
   const url=new URL(r.request().url());
   const endpoint=url.pathname.split("/step-course")[1];
   const isPast=endpoint.startsWith("/lesson/past-simple/");
   const isWriting=endpoint.startsWith("/lesson/punctuation/");
   const course=(writing=false)=>({
    student:"Synthetic learner",
    course:{title:writing?"Punctuation":"Past Simple",titleAr:writing?"علامات الترقيم":"الماضي البسيط",
     axis_code:writing?"writing-analysis":"grammar"},
    teachingUnits:teaching,sections:[stage(!writing&&pastPassed)],
    nextIndex:0,completed:!writing&&pastPassed,exam:{best:0,unlocked:!writing&&pastPassed}
   });
   let response,status=200;
   if(endpoint==="/course")response=baseCourse();
   else if(endpoint==="/catalog")response=catalog;
   else if(endpoint==="/followups")response={followups:[]};
   else if(isPast||isWriting){
    const suffix=endpoint.split(isPast?"/lesson/past-simple":"/lesson/punctuation")[1];
    if(suffix==="/course")response=course(isWriting);
    else if(suffix==="/teaching")response={units:[]};
    else if(suffix==="/videos")response={videos:[]};
    else if(suffix==="/parts/0")response={part:{index:0,title:"Synthetic",questions,passRequired:3},progress:course(isWriting)};
    else if(suffix==="/parts/0/submit"&&!isWriting){
     const answers=JSON.parse(r.request().postData()||"{}").answers||{};
     assert.equal(Object.keys(answers).length,4,"All four practice questions submitted");
     pastPassed=true;submissions++;
     const results=questions.map(q=>({id:q.id,selected:answers[q.id],correct:"A",
      isCorrect:answers[q.id]==="A",explanation:"Mock explanation",
      wrongReason:"Synthetic reason",wrongReasons:{B:"Wrong",C:"Wrong",D:"Wrong"}}));
     response={results,correctCount:results.filter(x=>x.isCorrect).length,
      total:4,passed:true,progress:course(false)};
    }else status=404;
   }else status=404;
   return r.fulfill({status,contentType:"application/json",
    body:JSON.stringify(response||{error:"Synthetic route not configured"})});
  });
  await page.goto(base+"/step-grammar-student/",{waitUntil:"domcontentloaded"});
  await page.locator("#student-learning-path .student-course-tile").first().waitFor();
  assert.equal(await page.locator("#student-learning-path .student-course-tile").count(),2);
  await page.locator('#student-learning-path a[href*="slug=past-simple"]').click();
  await page.locator(".lesson-title").waitFor();
  assert.equal(new URL(page.url()).searchParams.get("slug"),"past-simple",
   "Authenticated dashboard opens the saved generic lesson");
  assert.equal(await page.locator(".question").count(),4,
   "Published lesson includes four synthetic practice items");
  for(let i=0;i<4;i++)await page.locator('.q-answer[data-index="'+i+'"][data-value="A"]').click();
  await page.locator("#submit-practice").click();
  await page.locator(".answer-feedback").first().waitFor();
  assert.equal(submissions,1,"Submitting practice calls protected grading endpoint once");
  await page.goto(base+"/step-grammar-student/",{waitUntil:"domcontentloaded"});
  await page.locator("#student-learning-path .student-course-tile").first().waitFor();
  assert((await page.locator('#student-learning-path .student-course-tile').last().innerText()).includes("مكتمل"),
   "Returning to dashboard reflects newly saved server-side progress");
  await page.locator('[data-curriculum-target="writing"]').click();
  await page.locator('#writing-analysis-lessons a[href*="slug=punctuation"]').click();
  await page.locator(".lesson-title").waitFor();
  assert.equal(new URL(page.url()).searchParams.get("slug"),"punctuation",
   "Writing analysis launches the existing protected lesson player");
  assert.equal(await page.locator(".question").count(),4);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),
   "Mobile/desktop student lesson must not overflow");
  assert.deepEqual(errors,[],"No browser script errors in student journey at "+width+"px");
  await page.close();
  console.log("PASS STEP integrated learner journey "+width+"px: dashboard -> grading -> progress -> Writing");
 }
}finally{
 await browser.close();
 await new Promise(done=>server.close(done));
 await rm(root,{recursive:true,force:true});
}
