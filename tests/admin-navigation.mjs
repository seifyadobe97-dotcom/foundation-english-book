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
 {slug:"present-continuous",status:"published"},
  {slug:"past-simple",status:"published"},
  {slug:"past-continuous",status:"published"},
 {slug:"will-be-going-to",status:"published"},
 {slug:"future-arrangements",status:"draft"},
 {slug:"time-clauses",status:"published"},
 {slug:"present-perfect",status:"published"},
 {slug:"present-perfect-continuous",status:"published"},
 {slug:"past-perfect",status:"published"},
 {slug:"past-perfect-continuous",status:"draft"},
 {slug:"future-continuous-future-perfect",status:"draft"},
  {slug:"used-to-be-used-to-get-used-to",status:"draft"},
  {slug:"modals-fundamentals",status:"published"},
  {slug:"modals-of-deduction",status:"draft"}
];
const lessonMeta={ASGQAGREE:"Subject–Verb Agreement",ASGQPRSIM:"Present Simple",ASGQPRCONT:"Present Continuous",ASGQPASIM:"Past Simple",ASGQPACONT:"Past Continuous",ASGQWILLGO:"Will / Be Going To",ASGQFUTARR:"Future Arrangements",ASGQTIMCL:"Future Time Clauses",ASGQPRPER:"Present Perfect",ASGQPRPERCONT:"Present Perfect Continuous",ASGQPAPER:"Past Perfect",ASGQPAPERCONT:"Past Perfect Continuous",ASGQFUCOMBO:"Future Continuous & Future Perfect",ASGQUSED:"Used To / Be Used To / Get Used To",ASGQMODCORE:"Modals Fundamentals",ASGQMODDEDUCT:"Modals of Deduction & Possibility"};
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
      {slug:"present-continuous",code:"ASGQPRCONT",title:"Present Continuous",titleAr:"المضارع المستمر",status:"published",position:103},
       {slug:"past-simple",code:"ASGQPASIM",title:"Past Simple",titleAr:"الماضي البسيط",status:"published",position:104},
       {slug:"past-continuous",code:"ASGQPACONT",title:"Past Continuous",titleAr:"الماضي المستمر",status:"published",position:105},
       {slug:"will-be-going-to",code:"ASGQWILLGO",title:"Will / Be Going To",titleAr:"المستقبل بـ Will و Going To",status:"published",position:106},
       {slug:"future-arrangements",code:"ASGQFUTARR",title:"Future Arrangements",titleAr:"ترتيبات المستقبل والجداول",status:"draft",position:107},
       {slug:"time-clauses",code:"ASGQTIMCL",title:"Future Time Clauses",titleAr:"الجمل الزمنية الدالة على المستقبل",status:"published",position:108},
       {slug:"present-perfect",code:"ASGQPRPER",title:"Present Perfect",titleAr:"المضارع التام",status:"published",position:109},
        {slug:"present-perfect-continuous",code:"ASGQPRPERCONT",title:"Present Perfect Continuous",titleAr:"المضارع التام المستمر",status:"published",position:110},
        {slug:"past-perfect",code:"ASGQPAPER",title:"Past Perfect",titleAr:"الماضي التام",status:"published",position:111},
        {slug:"past-perfect-continuous",code:"ASGQPAPERCONT",title:"Past Perfect Continuous",titleAr:"الماضي التام المستمر",status:"draft",position:112},
        {slug:"future-continuous-future-perfect",code:"ASGQFUCOMBO",title:"Future Continuous & Future Perfect",titleAr:"المستقبل المستمر والمستقبل التام",status:"draft",position:113},
        {slug:"used-to-be-used-to-get-used-to",code:"ASGQUSED",title:"Used To / Be Used To / Get Used To",titleAr:"العادة الماضية والتعود",status:"draft",position:114},
        {slug:"modals-fundamentals",code:"ASGQMODCORE",title:"Modals Fundamentals",titleAr:"أساسيات الأفعال الناقصة",status:"published",position:115},
        {slug:"modals-of-deduction",code:"ASGQMODDEDUCT",title:"Modals of Deduction & Possibility",titleAr:"أفعال الاستنتاج والاحتمال",status:"draft",position:116}
     ],can_edit:true};
    }else if(endpoint==="/studio"){
    const code=url.searchParams.get("course")||"ASGQAGREE";
    const units=code==="ASGQPRSIM"||code==="ASGQPAPER"||code==="ASGQFUCOMBO"||code==="ASGQMODDEDUCT"?6:code==="ASGQWILLGO"||code==="ASGQPRPER"||code==="ASGQPRPERCONT"||code==="ASGQUSED"||code==="ASGQMODCORE"?7:5;
    body={course:{code,title:lessonMeta[code],titleAr:"درس تجريبي",subtitle:"",status:code==="ASGQFUTARR"||code==="ASGQPAPERCONT"||code==="ASGQFUCOMBO"||code==="ASGQUSED"||code==="ASGQMODDEDUCT"?"draft":"published"},
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
  assert.equal(await page.locator(".home-card").count(),16,"Sixteen lessons, with 07,12,13,14,16 private");
  assert.match(await page.locator("#home-status-16").innerText(),/مسودة غير منشورة/);
  assert.match(await page.locator("#home-status-15").innerText(),/منشور للطلاب/);
  assert.match(await page.locator("#home-status-14").innerText(),/مسودة غير منشورة/);
  assert.match(await page.locator("#home-status-13").innerText(),/مسودة غير منشورة/);
  assert.match(await page.locator("#home-status-12").innerText(),/مسودة غير منشورة/);
  assert.match(await page.locator("#home-status-11").innerText(),/منشور للطلاب/);
  assert.match(await page.locator("#home-status-10").innerText(),/منشور للطلاب/);
  assert.match(await page.locator("#home-status-09").innerText(),/منشور للطلاب/);
  assert.match(await page.locator("#home-status-08").innerText(),/منشور للطلاب/);
  assert.match(await page.locator("#home-status-07").innerText(),/مسودة غير منشورة/,"Lesson 07 must not appear as published");
  assert.match(await page.locator("#home-status-06").innerText(),/منشور للطلاب/,"Lesson 06 must be clearly marked as published");
  assert.equal(await page.locator(".admin-global-nav a").count(),8,"Admin pages use eight unambiguous destinations");
  assert.equal(await page.locator('.admin-global-nav a[aria-current="page"]').innerText().then(x=>x.includes("الرئيسية")),true);
  const lesson3Link=page.locator('a[href="studio.html?course=ASGQPRCONT&tab=questions"]').first();
  assert.equal(await page.locator('a[href="studio.html?course=ASGQPASIM&tab=questions"]').count(),1,"Past Simple has its own Studio editing button");
  assert.equal(await lesson3Link.count(),1,"Lesson 3 answer-edit button deep-links to the correct course");
  assert.equal(await page.locator('a[href="studio.html?course=ASGQWILLGO&tab=visual"]').count(),1,"Lesson 06 has a direct Studio route");
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
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQWILLGO&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQWILLGO");
  assert.match(await page.locator("#course-publication-note").innerText(),/مفتاح|المحتوى الأصلي|معرّفات الأسئلة/);
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQFUTARR&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===5);
  assert.equal(await page.locator("#course").inputValue(),"ASGQFUTARR");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQTIMCL&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===5);
  assert.equal(await page.locator("#course").inputValue(),"ASGQTIMCL");
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQPRPER&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQPRPER");
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQPRPERCONT&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQPRPERCONT");
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQPAPER&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===6);
  assert.equal(await page.locator("#course").inputValue(),"ASGQPAPER");
  assert.match(await page.locator("#course-publication-note").innerText(),/المحتوى الأصلي|معرّفات الأسئلة/);
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQPAPERCONT&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===5);
  assert.equal(await page.locator("#course").inputValue(),"ASGQPAPERCONT");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQFUCOMBO&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===6);
  assert.equal(await page.locator("#course").inputValue(),"ASGQFUCOMBO");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQUSED&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQUSED");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQMODCORE&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQMODCORE");
  assert.match(await page.locator("#course-publication-note").innerText(),/المحتوى الأصلي|معرّفات الأسئلة/);
  await page.goto(origin+"/step-grammar-admin/studio.html?course=ASGQMODDEDUCT&tab=visual",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelectorAll("#work aside button").length===6);
  assert.equal(await page.locator("#course").inputValue(),"ASGQMODDEDUCT");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);


  assert.equal(await page.locator(".admin-global-nav a[aria-current='page']").innerText().then(x=>x.includes("تعديل الدروس")),true);
  await page.goto(origin+"/step-grammar-admin/sources.html",{waitUntil:"domcontentloaded"});
  await page.locator("#cards:not([hidden])").waitFor();
  assert.equal(await page.locator(".card").count(),16,"Sixteen source audit cards including private Lesson 16");
  assert.equal(await page.locator('a[href="modals-deduction-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="modals-fundamentals-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="used-to-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="future-continuous-perfect-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="past-perfect-continuous-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="past-perfect-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="present-perfect-continuous-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="present-perfect-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="time-clauses-audit.html"]').count(),1);
  assert.equal(await page.locator('a[href="studio.html?course=ASGQFUTARR&tab=visual"]').count(),1,"Lesson 07 has a visual-editor link");
  assert.equal(await page.locator('a[href="studio.html?course=ASGQWILLGO&tab=questions"]').count(),1,"Lesson 06 source intake uses the unified Studio");
  assert.equal(await page.locator('a[href="past-continuous-audit.html"]').count(),1,"Lesson 5 protected review available");
  assert.equal(await page.locator('a[href="past-audit.html"]').count(),1,"Lesson 4 private audit route is linked");
  assert.equal(await page.locator(".admin-global-nav a[aria-current='page']").innerText().then(x=>x.includes("تدقيق المصادر")),true);
  assert.deepEqual(errors,[],"No JavaScript errors at "+width+"px");
  console.log("PASS Admin navigation "+width+"px: home, students, studio deep link, source hub");
  await page.close();
 }
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
