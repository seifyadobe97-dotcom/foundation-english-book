import assert from "node:assert/strict";
import {readFile,stat,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

// Published Pages artifact; 53 synthetic courses/263 mock stages. No real JWT or exam bank.
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const root=path.join(project,".step-public-full-catalog");
execFileSync(process.execPath,[path.join(project,"scripts/build-step-public-site.mjs"),root]);
const server=createServer(async(req,res)=>{
 const raw=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const p=path.resolve(root,"."+raw),f=raw.endsWith("/")?path.join(p,"index.html"):p;
 if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(f)).isFile())throw Error("Not a file");
  const type=f.endsWith(".html")?"text/html; charset=utf-8":
   f.endsWith(".css")?"text/css":f.endsWith(".svg")?"image/svg+xml":"text/javascript";
  res.writeHead(200,{"Content-Type":type});res.end(await readFile(f));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"synthetic"}}}),signOut:async()=>({})}}}};';
const grammarSlugs=["subject-verb-agreement","present-simple","present-continuous",
 ...Array.from({length:42},(_,i)=>"grammar-mock-"+String(i+4).padStart(2,"0"))];
const writingSlugs=Array.from({length:8},(_,i)=>"writing-mock-"+String(i+1).padStart(2,"0"));
const lessons=new Map();
for(let i=0;i<grammarSlugs.length;i++){
 const n=i<42?5:6;
 lessons.set(grammarSlugs[i],{axis:"grammar",count:n,ar:"قاعدة تجريبية "+(i+1),en:"Synthetic Grammar "+(i+1),position:101+i});
}
for(let i=0;i<writingSlugs.length;i++){
 const n=i<3?5:4;
 lessons.set(writingSlugs[i],{axis:"writing-analysis",count:n,ar:"تحليل تجريبي "+(i+1),en:"Synthetic Writing "+(i+1),position:1001+i});
}
assert.equal(grammarSlugs.reduce((a,s)=>a+lessons.get(s).count,0),228);
assert.equal(writingSlugs.reduce((a,s)=>a+lessons.get(s).count,0),35);
const catalog={axes:[
 {code:"grammar",title_ar:"الجرامر",title_en:"Grammar",position:1},
 {code:"writing-analysis",title_ar:"التحليل الكتابي",title_en:"Writing",position:2},
 {code:"reading-comprehension",title_ar:"القراءة",title_en:"Reading",position:3},
 {code:"listening",title_ar:"الاستماع",title_en:"Listening",position:4}],
 indicators:Array.from(lessons,([slug,v])=>({axis_code:v.axis,slug,title_ar:v.ar,title_en:v.en,position:v.position}))};
const course=slug=>{
 const v=lessons.get(slug);
 return {student:"طالب اختبار",course:{title:v.en,titleAr:v.ar,subtitle:"Synthetic learner data"},
  sections:Array.from({length:v.count},(_,i)=>({index:i,title:"Stage "+i,titleAr:"مرحلة تجريبية "+(i+1),
   passed:i===0,locked:false,short:"تدريب اصطناعي"})),
  nextIndex:1,completed:false,exam:{best:0,unlocked:false}};
};
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],requested=new Set();
  page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>
   r.fulfill({contentType:"text/javascript",body:sdk}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",async r=>{
   const endpoint=new URL(r.request().url()).pathname.split("/step-course")[1];
   const special={"/course":"present-simple","/agreement/course":"subject-verb-agreement",
    "/continuous/course":"present-continuous"};
   let body=null;
   if(endpoint==="/catalog")body=catalog;
   else if(endpoint==="/followups")body={followups:[]};
   else if(special[endpoint])body=course(special[endpoint]);
   else{
    const match=endpoint.match(/^\/lesson\/([a-z0-9-]+)\/course$/);
    if(match&&lessons.has(match[1])){requested.add(match[1]);body=course(match[1]);}
   }
   // Hold one response back long enough for progress UI to be meaningful.
   if(endpoint==="/lesson/grammar-mock-45/course")
    await new Promise(done=>setTimeout(done,400));
   await r.fulfill({status:body?200:404,contentType:"application/json",
    body:JSON.stringify(body||{error:"Synthetic endpoint not implemented"})});
  });
  await page.goto(origin+"/step-grammar-student/",{waitUntil:"domcontentloaded"});
  const loading=page.locator("#student-catalog-loading");
  await loading.waitFor();
  assert.equal(await loading.locator("progress").getAttribute("max"),"50",
   "Loading indicator accounts for 50 additional authenticated lessons");
  await page.locator("#student-learning-path .student-course-tile").first().waitFor();
  assert.equal(await page.locator("#student-learning-path .student-course-tile").count(),45);
  assert.equal(await page.locator("#writing-analysis-lessons .student-course-tile").count(),8);
  assert.equal(requested.size,50,"All 50 additional lessons require successful protected reads");
  assert.equal(await page.locator(".metrics .metric").first().locator("strong").innerText(),"53/263",
   "Student metrics account for 263 teaching stages across both published axes");
  assert.equal(await page.locator("#student-lessons-load-warning").count(),0);
  assert.equal(await loading.count(),0,"Loader disappears when the learner dashboard is ready");
  await page.locator('[data-curriculum-target="writing"]').click();
  assert(await page.locator("#writing-analysis-lessons").isVisible());
  assert.equal(new URL(page.url()).hash,"#writing-analysis-lessons");
  await page.locator("#search-writing-lessons").fill("Synthetic Writing 8");
  assert.equal(await page.locator("#writing-analysis-lessons .student-course-tile:visible").count(),1);
  await page.locator('[data-curriculum-target="grammar"]').click();
  await page.locator("#search-grammar-lessons").fill("Synthetic Grammar 45");
  assert.equal(await page.locator("#student-learning-path .student-course-tile:visible").count(),1);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),
   "53-course page must not overflow at "+width+"px");
  assert.deepEqual(errors,[],"Browser errors "+width+": "+errors.join(", "));
  console.log("PASS full STEP catalog "+width+"px: 45 Grammar, 8 Writing, 263 stages, 50 protected reads");
  await page.close();
 }
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
 await rm(root,{recursive:true,force:true});
}
