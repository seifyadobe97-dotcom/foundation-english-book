import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import {createServer} from "node:http";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {chromium} from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const mime=file=>file.endsWith(".html")?"text/html; charset=utf-8":file.endsWith(".css")?"text/css":file.endsWith(".svg")?"image/svg+xml":"text/javascript";
const server=createServer(async(req,res)=>{
 const requestedPath=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const safePath=path.resolve(root,"."+requestedPath);
 const filename=requestedPath.endsWith("/")?path.join(safePath,"index.html"):safePath;
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{if(!(await stat(filename)).isFile())throw Error();
  res.writeHead(200,{"Content-Type":mime(filename)});
  res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"mock-admin-jwt"}}}),signOut:async()=>({})}}}};';
const indicators=[
 {slug:"subject-verb-agreement",status:"published"},
 {slug:"present-simple",status:"published"},
 {slug:"present-continuous",status:"published"}
];
const lessonMeta={ASGQAGREE:"Subject–Verb Agreement",ASGQPRSIM:"Present Simple",ASGQPRCONT:"Present Continuous"};
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:sdk}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-admin/**",async route=>{
   const url=new URL(route.request().url()),endpoint=url.pathname.split("/step-admin")[1];
   let body={error:"Unknown mock route"},status=200;
   if(endpoint==="/me")body={role:"owner",username:"Mock admin"};
   else if(endpoint==="/indicators")body={indicators};
   else if(endpoint==="/students")body={students:[],total:0,page:1,page_size:25,role:"owner"};
   else if(endpoint==="/studio/catalog"){
     body={courses:[
      {slug:"subject-verb-agreement",code:"ASGQAGREE",title:"Subject–Verb Agreement",titleAr:"تطابق الفاعل والفعل",status:"published",position:101},
      {slug:"present-simple",code:"ASGQPRSIM",title:"Present Simple",titleAr:"المضارع البسيط",status:"published",position:102},
      {slug:"present-continuous",code:"ASGQPRCONT",title:"Present Continuous",titleAr:"المضارع المستمر",status:"published",position:103}
     ],can_edit:true};
    }else if(endpoint==="/studio"){
    const code=url.searchParams.get("course")||"ASGQAGREE";
    const units=code==="ASGQPRSIM"?6:5;
    body={course:{code,title:lessonMeta[code],titleAr:"درس تجريبي",subtitle:"",status:"published"},
     sections:Array.from({length:units},(_,i)=>({index:i,titleAr:"مرحلة "+(i+1),
      base:{titleAr:"مرحلة "+(i+1),subtitle:"",short:"",duration:"7 دقائق",
       description:"تعليم تجريبي",rule:[],alternativeRule:[],gold:{},mistake:{},examples:[],tiles:[]},
      draft:null,published:null,visual_draft:null,visual_published:null})),
     questions:[],can_edit:true};
   }else status=404;
   await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
  });
  await page.goto(origin+"/step-grammar-admin/",{waitUntil:"domcontentloaded"});
  await page.locator(".home-hero").waitFor({timeout:12000});
  assert.equal(await page.locator(".home-card").count(),3,"Only three published lessons have edit cards");
  assert.equal(await page.locator(".admin-global-nav a").count(),8,"Admin pages use eight unambiguous destinations");
  assert.equal(await page.locator('.admin-global-nav a[aria-current="page"]').innerText().then(x=>x.includes("الرئيسية")),true);
  const lesson3Link=page.locator('a[href="studio.html?course=ASGQPRCONT&tab=questions"]').first();
  assert.equal(await lesson3Link.count(),1,"Lesson 3 answer-edit button deep-links to the correct course");
  const links=await page.locator(".admin-global-nav a").evaluateAll(xs=>xs.map(x=>new URL(x.getAttribute("href"),location.href).pathname));
  assert(links.every(x=>x.includes("step-grammar-admin")),"All admin navigation stays inside admin workspace");
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),"Home layout does not overflow "+width+"px");
  await page.locator('.admin-global-nav a[href="./#students"]').click();
  await page.locator("#export-students").waitFor();
  assert.equal(await page.locator('.admin-global-nav a[aria-current="page"]').innerText().then(x=>x.includes("الطلاب")),true);
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQPRCONT&tab=questions",{waitUntil:"domcontentloaded"});
  await page.locator('#tabs [data-tab="questions"].active').waitFor({timeout:12000})
    .catch(async error=>{throw Error("Studio route failed; errors="+JSON.stringify(errors)+
      "; body="+(await page.locator("body").innerText()).slice(-500)+"; "+String(error));});
  assert.equal(await page.locator("#course").inputValue(),"ASGQPRCONT");
  assert.equal(await page.locator(".admin-global-nav a[aria-current='page']").innerText().then(x=>x.includes("تعديل الدروس")),true);
  await page.goto(origin+"/step-grammar-admin/sources.html",{waitUntil:"domcontentloaded"});
  await page.locator("#cards:not([hidden])").waitFor();
  assert.equal(await page.locator(".card").count(),3);
  assert.equal(await page.locator(".admin-global-nav a[aria-current='page']").innerText().then(x=>x.includes("تدقيق المصادر")),true);
  assert.deepEqual(errors,[],"No JavaScript errors at "+width+"px");
  console.log("PASS Admin navigation "+width+"px: home, students, studio deep link, source hub");
  await page.close();
 }
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
