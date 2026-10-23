import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import {createServer} from "node:http";
import {chromium} from "playwright";
import {Script} from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const html=await readFile(path.join(root,"step-grammar-admin/studio.html"),"utf8");
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(x=>!x[1].includes("src="));
for(const script of scripts)new Script(script[2]);
const admin=await readFile(path.join(root,"supabase/functions/step-admin/index.ts"),"utf8");
const course=await readFile(path.join(root,"supabase/functions/step-course/index.ts"),"utf8");
assert(admin.includes('path==="/studio"')&&admin.includes('path==="/studio/units/publish"'));
assert(admin.includes('path==="/studio/questions/publish"')&&admin.includes('permission.role!=="owner"'));
assert(course.includes('path==="/teaching"')&&course.includes('step_teaching_unit_edits'));
for(const src of ["present-simple-v2.js","subject-verb-agreement.js","present-continuous.js"]){
 const text=await readFile(path.join(root,"step-grammar-student",src),"utf8");
 assert(text.includes('await api("/teaching")'),"Student lesson loads published changes: "+src);
}
const server=createServer(async(req,res)=>{
 const full=path.resolve(root,"."+decodeURIComponent(new URL(req.url,"http://local").pathname));
 if(!full.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{if(!(await stat(full)).isFile())throw Error("Not file");
  res.writeHead(200,{"Content-Type":full.endsWith(".html")?"text/html":full.endsWith(".css")?"text/css":"text/javascript"});
  res.end(await readFile(full));
 }catch{res.writeHead(404);res.end("Not Found");}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const fakeSupabase='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"test-owner-token"}}})}}}}';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const jsErrors=[];page.on("pageerror",e=>jsErrors.push(String(e)));
  page.on("dialog",dialog=>dialog.accept());
  let draft=null,published=null;
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:fakeSupabase}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-admin/**",async route=>{
   const req=route.request(),u=new URL(req.url()),endpoint=u.pathname.split("/step-admin")[1];
   const selected=u.searchParams.get("course")||"ASGQAGREE";
   const stages=selected==="ASGQPRSIM"||selected==="ASGQPAPER"||selected==="ASGQFUCOMBO"?6:selected==="ASGQWILLGO"||selected==="ASGQPRPER"||selected==="ASGQPRPERCONT"||selected==="ASGQUSED"?7:5;
   let data={error:"No mock"},status=200;
   if(endpoint==="/studio/catalog"){
    data={courses:[
     {slug:"subject-verb-agreement",code:"ASGQAGREE",title:"Agreement",titleAr:"تطابق الفاعل والفعل",position:101,status:"published"},
     {slug:"present-simple",code:"ASGQPRSIM",title:"Present Simple",titleAr:"المضارع البسيط",position:102,status:"published"},
     {slug:"present-continuous",code:"ASGQPRCONT",title:"Present Continuous",titleAr:"المضارع المستمر",position:103,status:"published"},
     {slug:"past-simple",code:"ASGQPASIM",title:"Past Simple",titleAr:"الماضي البسيط",position:104,status:"published"},
     {slug:"past-continuous",code:"ASGQPACONT",title:"Past Continuous",titleAr:"الماضي المستمر",position:105,status:"published"},
     {slug:"will-be-going-to",code:"ASGQWILLGO",title:"Will / Be Going To",titleAr:"المستقبل بـ Will و Going To",position:106,status:"published"},
     {slug:"future-arrangements",code:"ASGQFUTARR",title:"Future Arrangements",titleAr:"ترتيبات المستقبل والجداول",position:107,status:"draft"},
     {slug:"time-clauses",code:"ASGQTIMCL",title:"Future Time Clauses",titleAr:"الجمل الزمنية الدالة على المستقبل",position:108,status:"published"},
     {slug:"present-perfect",code:"ASGQPRPER",title:"Present Perfect",titleAr:"المضارع التام",position:109,status:"published"},
      {slug:"present-perfect-continuous",code:"ASGQPRPERCONT",title:"Present Perfect Continuous",titleAr:"المضارع التام المستمر",position:110,status:"published"},
      {slug:"past-perfect",code:"ASGQPAPER",title:"Past Perfect",titleAr:"الماضي التام",position:111,status:"published"},
      {slug:"past-perfect-continuous",code:"ASGQPAPERCONT",title:"Past Perfect Continuous",titleAr:"الماضي التام المستمر",position:112,status:"draft"},
      {slug:"future-continuous-future-perfect",code:"ASGQFUCOMBO",title:"Future Continuous & Future Perfect",titleAr:"المستقبل المستمر والمستقبل التام",position:113,status:"draft"},
      {slug:"used-to-be-used-to-get-used-to",code:"ASGQUSED",title:"Used To / Be Used To / Get Used To",titleAr:"العادة الماضية والتعود",position:114,status:"draft"}
    ],can_edit:true};
   }else if(endpoint==="/studio"){
    data={can_edit:true,course:{code:selected,title:"Test Lesson",titleAr:"الدرس التجريبي",subtitle:"Mock",status:selected==="ASGQFUTARR"||selected==="ASGQPAPERCONT"||selected==="ASGQFUCOMBO"||selected==="ASGQUSED"?"draft":"published"},
     sections:Array.from({length:stages},(_,i)=>({index:i,titleAr:"المرحلة "+(i+1),
      base:{titleAr:"المرحلة "+(i+1),subtitle:"مثال",short:"مثال",duration:"5 دقائق",description:"شرح بسيط"},
      draft:null,published:null,visual_base:{title:"شرح تجريبي",detail:"شرح تجريبي للقاعدة",tip:"بسيط",cards:[],examples:[],formulas:[],keywords:[]},visual_draft:draft,visual_published:published})),
     questions:[{id:"TEST-Q01",origin:"source",part_index:0,text:"Synthetic question placeholder",
      options:{A:"alpha",B:"bravo",C:"charlie",D:"delta"},correct:"A",
      explanation:"Synthetic grading example",wrongReasons:{B:"Reason B",C:"Reason C",D:"Reason D"},draft:null,published:false}]};
   }else if(endpoint==="/studio/units/save"){draft=JSON.parse(req.postData()).content;data={ok:true,status:"draft"};}
   else if(endpoint==="/studio/units/publish"){published=draft;draft=null;data={ok:true,status:"published"};}
   else if(endpoint==="/studio/units/reset"){draft=null;published=null;data={ok:true,status:"original"};}
   else status=404;
   await route.fulfill({status,contentType:"application/json",body:JSON.stringify(data)});
  });
  const local="http://127.0.0.1:"+server.address().port;
  await page.goto(local+"/step-grammar-admin/studio.html",{waitUntil:"domcontentloaded"});
  await page.locator("#v-title").waitFor({timeout:12000});
  assert.equal(await page.locator("aside button").count(),5);
  await page.locator("#v-title").fill("شرح جديد من الأدمن");
  assert.equal(await page.locator("#v-title").inputValue(),"شرح جديد من الأدمن","DOM title field must retain the text");
  await page.locator('[data-act="save"]').click();
  await page.getByText("اتحفظت المسودة").waitFor({timeout:12000});
  assert.equal(draft?.title,"شرح جديد من الأدمن","Actual saved draft was: "+JSON.stringify(draft));
  await page.locator('[data-act="publish"]').click({force:true});
  await page.getByText("التعديل اتنشر").waitFor({timeout:12000});
  assert.equal(published.title,"شرح جديد من الأدمن");
  await page.locator('[data-tab="questions"]').click();
  await page.locator("#q-text").waitFor();
  assert.equal(await page.locator("aside button").count(),2);
  await page.locator('[data-tab="sections"]').click();
  await page.locator("#s-title").waitFor();
  await page.locator('[data-tab="course"]').click();
  await page.locator("#c-ar").waitFor();
  await page.locator("#course").selectOption("ASGQPRSIM");
  await page.locator('[data-tab="visual"]').click();
  await page.locator("#v-title").waitFor();
  assert.equal(await page.locator("aside button").count(),6);
  await page.locator("#course").selectOption("ASGQWILLGO");
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQWILLGO");
  assert.match(await page.locator("#course-publication-note").innerText(),/المحتوى الأصلي|معرّفات الأسئلة/);
  await page.locator('[data-tab="questions"]').click();
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===2);
  assert.equal(await page.locator("aside button").count(),2,"Lesson 06 published Studio question editor supports safe synthetic fixture item");
  await page.locator("#course").selectOption("ASGQFUTARR");
  await page.locator('[data-tab="visual"]').click();
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===5);
  assert.equal(await page.locator("#course").inputValue(),"ASGQFUTARR");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);
  await page.locator("#course").selectOption("ASGQTIMCL");
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===5);
  assert.equal(await page.locator("#course").inputValue(),"ASGQTIMCL");
  await page.locator("#course").selectOption("ASGQPRPER");
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQPRPER");
  await page.locator("#course").selectOption("ASGQPRPERCONT");
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQPRPERCONT");
  await page.locator("#course").selectOption("ASGQPAPER");
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===6);
  assert.equal(await page.locator("#course").inputValue(),"ASGQPAPER");
  assert.match(await page.locator("#course-publication-note").innerText(),/المحتوى الأصلي|معرّفات الأسئلة/);
  await page.locator("#course").selectOption("ASGQPAPERCONT");
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===5);
  assert.equal(await page.locator("#course").inputValue(),"ASGQPAPERCONT");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);
  await page.locator("#course").selectOption("ASGQFUCOMBO");
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===6);
  assert.equal(await page.locator("#course").inputValue(),"ASGQFUCOMBO");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);
  await page.locator("#course").selectOption("ASGQUSED");
  await page.waitForFunction(()=>document.querySelectorAll("aside button").length===7);
  assert.equal(await page.locator("#course").inputValue(),"ASGQUSED");
  assert.match(await page.locator("#course-publication-note").innerText(),/مسودة داخلية غير ظاهرة للطلاب/);

  assert.deepEqual(jsErrors,[],"Admin browser errors "+jsErrors.join("; "));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert(!overflow,"Horizontal overflow at "+width);
  console.log("PASS Unified STEP admin studio",width+"px");
  await page.close();
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
