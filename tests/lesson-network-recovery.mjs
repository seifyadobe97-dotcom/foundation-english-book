import assert from "node:assert/strict";
import {readFile,stat,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

// Browser regression against the public release artifact, with synthetic JWT and questions.
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const root=path.join(repoRoot,".step-public-lesson-retry");
execFileSync(process.execPath,[path.join(repoRoot,"scripts/build-step-public-site.mjs"),root]);
const server=createServer(async(req,res)=>{
 const raw=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const p=path.resolve(root,"."+raw),f=raw.endsWith("/")?path.join(p,"index.html"):p;
 if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(f)).isFile())throw Error("not file");
  const mime=f.endsWith(".html")?"text/html; charset=utf-8":
   f.endsWith(".css")?"text/css":f.endsWith(".svg")?"image/svg+xml":"text/javascript";
  res.writeHead(200,{"Content-Type":mime});res.end(await readFile(f));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"synthetic"}}})}}}};';
const unit={
 title:"Synthetic past-simple stage",detail:"راجع زمن الماضي البسيط",
 cards:[],examples:[],formulas:[],warning:{wrong:"",correct:"",why:""}
};
const course=()=>({student:"طالب تجريبي",
 course:{title:"Past Simple",titleAr:"الماضي البسيط",subtitle:"Synthetic"},
 teachingUnits:[unit],sections:[{index:0,id:"practice",title:"Past Simple",
  titleAr:"الماضي البسيط",short:"شرح تمهيدي",passed:false,locked:false}],
 nextIndex:0,exam:{unlocked:false,best:0}});
const q=[{id:"q1",text:"Synthetic question — choose a past form",
 options:{A:"walked",B:"walking",C:"walk",D:"walks"}}];
try{
 for(const width of [390,1280]){
  let courseCalls=0,partCalls=0;
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>
   r.fulfill({contentType:"text/javascript",body:sdk}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/lesson/past-simple/**",r=>{
   const endpoint=new URL(r.request().url()).pathname.split("/lesson/past-simple")[1];
   if(endpoint==="/course" && ++courseCalls===1)return r.abort("failed");
   if(endpoint==="/parts/0" && ++partCalls===1)return r.abort("failed");
   const data=endpoint==="/course"?course():
    endpoint==="/teaching"?{units:[]}:
    endpoint==="/videos"?{videos:[]}:
    endpoint==="/parts/0"?{part:{index:0,title:"Past Simple",questions:q,passRequired:1},progress:course()}:null;
   return r.fulfill({status:data?200:404,contentType:"application/json",
    body:JSON.stringify(data||{error:"Synthetic route unavailable"})});
  });
  await page.goto(origin+"/step-grammar-student/lesson.html?slug=past-simple",
   {waitUntil:"domcontentloaded"});
  const alert=page.locator('#lesson-root [role="alert"]');
  await alert.waitFor();
  assert((await alert.innerText()).includes("الاتصال اتقطع"),"Course failure uses actionable Arabic");
  assert.equal((await alert.innerText()).includes("Failed to fetch"),false);
  await page.locator('[data-action="reload"]').click();
  await alert.waitFor();
  assert((await alert.innerText()).includes("اضغط إعادة المحاولة"),
   "Part failure is retryable, too");
  await page.locator('[data-action="reload"]').click();
  await page.locator(".question").waitFor();
  assert.equal(await page.locator(".question").count(),1);
  assert.equal(courseCalls,3,"A full lesson retry re-authenticates each attempt");
  assert.equal(partCalls,2,"Part GET failure is retried without duplicate grading");
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),
   "Lesson retry fits "+width+"px");
  assert.deepEqual(errors,[],"No JS errors: "+errors.join(" / "));
  await page.close();
  console.log("PASS protected STEP lesson network retry "+width+"px: course outage, part outage, recovery");
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok));await rm(root,{recursive:true,force:true});}
