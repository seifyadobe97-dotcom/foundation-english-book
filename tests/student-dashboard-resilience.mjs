import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

// Everything is synthetic. Do not use live protected question banks or student accounts.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const server=createServer(async(req,res)=>{
 const raw=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const p=path.resolve(root,"."+raw),filename=raw.endsWith("/")?path.join(p,"index.html"):p;
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(filename)).isFile())throw Error("Not found");
  const type=filename.endsWith(".html")?"text/html; charset=utf-8":
   filename.endsWith(".css")?"text/css":filename.endsWith(".svg")?"image/svg+xml":"text/javascript";
  res.writeHead(200,{"Content-Type":type});res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"synthetic"}}}),signOut:async()=>({})}}}};';
const lesson=(title,ar)=>({student:"طالب تجريبي",course:{title,titleAr:ar,subtitle:"شرح"},
 sections:[{index:0,title:"Basics",titleAr:"القاعدة",passed:false,locked:false}],
 nextIndex:0,exam:{best:0,unlocked:false}});
const grammar=lesson("Present Simple","المضارع البسيط");
const indicators=[
 {slug:"present-simple",axis_code:"grammar",title_en:"Present Simple",title_ar:"المضارع البسيط",position:102},
 {slug:"past-simple",axis_code:"grammar",title_en:"Past Simple",title_ar:"الماضي البسيط",position:104},
 {slug:"past-continuous",axis_code:"grammar",title_en:"Past Continuous",title_ar:"الماضي المستمر",position:105},
 {slug:"punctuation",axis_code:"writing-analysis",title_en:"Punctuation",title_ar:"علامات الترقيم",position:1001}
];
const catalog={axes:[
 {code:"grammar",title_ar:"الجرامر",title_en:"Grammar",position:1},
 {code:"writing-analysis",title_ar:"التحليل الكتابي",title_en:"Writing",position:2}
],indicators};
try{
 for(const width of [390,1280]){
  let recovered=false;
  const page=await browser.newPage({viewport:{width,height:890}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>
   r.fulfill({contentType:"text/javascript",body:sdk}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",r=>{
   const endpoint=new URL(r.request().url()).pathname.split("/step-course")[1];
   if(endpoint==="/followups")return r.abort("failed"); // Nonessential service outage
   const data={
    "/course":grammar,"/catalog":catalog,
    "/lesson/past-simple/course":lesson("Past Simple","الماضي البسيط"),
    "/lesson/past-continuous/course":recovered?lesson("Past Continuous","الماضي المستمر"):null,
    "/lesson/punctuation/course":recovered?lesson("Punctuation","علامات الترقيم"):null
   }[endpoint];
   return r.fulfill({status:data?200:503,contentType:"application/json",
    body:JSON.stringify(data||{error:"Synthetic temporary outage"})});
  });
  await page.goto(origin+"/step-grammar-student/",{waitUntil:"domcontentloaded"});
  await page.locator("#student-learning-path").waitFor();
  const warning=page.locator("#student-lessons-load-warning");
  assert(await warning.isVisible(),"Partial failure must be clearly announced");
  assert((await warning.innerText()).includes("2 درس"),"Show number of unavailable published lessons");
  assert((await warning.innerText()).includes("الدروس اللي اتحملت فقط"),
   "Progress metrics must explicitly disclose partial coverage");
  assert.equal(await page.locator("#student-learning-path .student-course-tile").count(),2,
   "Available approved courses stay usable");
  assert.equal(await page.locator("#writing-analysis-lessons").count(),0,
   "Failed protected Writing request must never be bypassed or linked");
  assert((await page.locator(".student-followups").innerText()).includes("تعذر تحميل خطة المتابعة"),
   "Optional follow-up outage must not prevent the dashboard from rendering");
  recovered=true;
  await warning.getByRole("button",{name:"إعادة تحميل الدروس"}).click();
  await warning.waitFor({state:"detached"});
  await page.locator("#writing-analysis-lessons").waitFor({state:"attached"});
  assert.equal(await page.locator("#student-learning-path .student-course-tile").count(),3,
   "Retry restores previously unavailable Grammar lesson");
  assert.equal(await page.locator("#writing-analysis-lessons .student-course-tile").count(),1,
   "Retry restores Writing only after successful authorized response");
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),
   "Student dashboard responsive at "+width+"px");
  assert.deepEqual(errors,[],"No JS errors on "+width+"px");
  await page.close();
  console.log("PASS dashboard resilience "+width+"px: partial outage, transparent totals, safe retry");
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
