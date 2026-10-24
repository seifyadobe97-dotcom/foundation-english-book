import assert from "node:assert/strict";
import {readFile,stat,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

// Real public lesson player with a synthetic teaching-only stage.
// No protected STEP questions, real user accounts, or production submissions.
const baseDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const root=path.join(baseDir,".step-public-ungraded-stages");
execFileSync(process.execPath,[path.join(baseDir,"scripts/build-step-public-site.mjs"),root]);
const server=createServer(async(req,res)=>{
 const uri=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const p=path.resolve(root,"."+uri),file=uri.endsWith("/")?path.join(p,"index.html"):p;
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(file)).isFile())throw Error("no file");
  const type=file.endsWith(".html")?"text/html; charset=utf-8":
   file.endsWith(".css")?"text/css":file.endsWith(".svg")?"image/svg+xml":"text/javascript";
  res.writeHead(200,{"Content-Type":type});res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"synthetic"}}})}}}};';
const units=[
 {title:"فهم المبني للمجهول مع الأفعال الناقصة",detail:"القاعدة هي modal + be + V3",
  cards:[],examples:[["Synthetic","It can [[be repaired]].","راجع التكوين"]],formulas:[],
  warning:{wrong:"",correct:"",why:""}},
 {title:"مراجعة بعد الشرح",detail:"طبق القاعدة في السؤال الاصطناعي",
  cards:[],examples:[],formulas:[],warning:{wrong:"",correct:"",why:""}}
];
const qs=[{id:"q1",text:"A synthetic practice item (not from an exam)",
 options:{A:"can be fixed",B:"can fixed",C:"can fixing",D:"can been fixing"}}];
try{
 for(const width of [390,1280]){
  let passed=false,submissions=0;
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>
   r.fulfill({contentType:"text/javascript",body:sdk}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  const course=()=>({
   student:"طالب تجريبي",course:{title:"Modal Passive",titleAr:"المبني للمجهول مع الأفعال الناقصة"},
   teachingUnits:units,sections:[
    {id:"intro",index:0,title:"Intro",titleAr:"شرح بدون تقييم",passed,locked:false},
    {id:"practice",index:1,title:"Practice",titleAr:"تدريب بسيط",passed:false,locked:!passed}
   ],nextIndex:passed?1:0,completed:false,exam:{unlocked:false,best:0}
  });
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/lesson/modal-passive/**",r=>{
   const endpoint=new URL(r.request().url()).pathname.split("/lesson/modal-passive")[1];
   let result=null;
   if(endpoint==="/course")result=course();
   if(endpoint==="/teaching")result={units:[]};
   if(endpoint==="/videos")result={videos:[]};
   if(endpoint==="/parts/0")result={part:{index:0,title:"Intro",questions:[],passRequired:0},progress:course()};
   if(endpoint==="/parts/0/submit"){
    const body=JSON.parse(r.request().postData()||"{}");
    assert.deepEqual(body.answers,{},"No graded answers invented for teaching-only stage");
    passed=true;submissions++;
    result={correctCount:0,total:0,passed:true,results:[],progress:course()};
   }
   if(endpoint==="/parts/1")result={part:{index:1,title:"Practice",questions:qs,passRequired:1},progress:course()};
   return r.fulfill({status:result?200:404,contentType:"application/json",
    body:JSON.stringify(result||{error:"Synthetic route unavailable"})});
  });
  await page.goto(origin+"/step-grammar-student/lesson.html?slug=modal-passive",
   {waitUntil:"domcontentloaded"});
  const lesson=page.locator("#practice");
  await lesson.waitFor();
  assert((await lesson.innerText()).includes("مرحلة شرح من غير اختبار"),
   "Zero-item section explains it is ungraded, rather than displaying 0 questions");
  assert(!(await lesson.innerText()).includes("درجتك 0 من 0"),
   "Never show fake 0/0 score");
  assert.equal(await page.locator(".question").count(),0);
  await page.locator("#submit-practice").click();
  await page.getByText("اتسجّل إنك راجعت الشرح.").waitFor();
  assert.equal(submissions,1,"Teaching-only acknowledgement persists through protected endpoint once");
  assert((await lesson.innerText()).includes("مش هتتحسب لك درجة"),
   "The ungraded completion must be explained to beginner learners");
  await page.locator('#practice [data-action="continue"]').click();
  await page.locator(".question").waitFor();
  assert.equal(await page.locator(".question").count(),1,
   "Next real graded practice opens after explanation-only acknowledgement");
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),
   "Ungraded stage remains responsive at "+width+"px");
  assert.deepEqual(errors,[],"No runtime errors "+width+": "+errors.join(", "));
  await page.close();
  console.log("PASS zero-question beginner stage "+width+"px: ungraded copy, acknowledgement, next stage");
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
