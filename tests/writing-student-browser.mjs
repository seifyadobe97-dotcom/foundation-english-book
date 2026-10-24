import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const server=createServer(async(req,res)=>{
 const raw=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const p=path.resolve(root,"."+raw);
 const filename=raw.endsWith("/")?path.join(p,"index.html"):p;
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{if(!(await stat(filename)).isFile())throw Error("Not file");
  res.writeHead(200,{"Content-Type":filename.endsWith(".html")?"text/html; charset=utf-8":filename.endsWith(".css")?"text/css":"text/javascript"});
  res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"synthetic"}}}),signOut:async()=>({})}}}}';
const item=(slug,title,ar,axis)=>({slug,title_en:title,title_ar:ar,axis_code:axis,position:axis==="grammar"?101:1001});
const axes=[
 {code:"reading-comprehension",title_ar:"القراءة",title_en:"Reading",position:1},
 {code:"listening",title_ar:"الاستماع",title_en:"Listening",position:2},
 {code:"grammar",title_ar:"الجرامر",title_en:"Grammar",position:3},
 {code:"writing-analysis",title_ar:"التحليل الكتابي",title_en:"Writing Analysis",position:4}
];
const grammar={course:{title:"Present Simple",titleAr:"المضارع البسيط",subtitle:"شرح"},student:"طالب",
 sections:[{index:0,titleAr:"القاعدة",title:"Basics",passed:false,locked:false,short:"Basics"}],nextIndex:0,completed:false,exam:{best:0,unlocked:false}};
const writing={...grammar,course:{title:"Punctuation",titleAr:"علامات الترقيم",subtitle:"شرح",axis_code:"writing-analysis"},
 sections:[{index:0,titleAr:"النقطة",title:"Full Stop",passed:false,locked:false,short:"Full stop"}]};
try{
 for(const available of [true,false]){
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:870}});
   const errors=[];page.on("pageerror",error=>errors.push(String(error)));
   await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:sdk}));
   await page.route("https://fonts.googleapis.com/**",r=>r.abort());
   await page.route("https://fonts.gstatic.com/**",r=>r.abort());
   await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",r=>{
    const path=new URL(r.request().url()).pathname.split("/step-course")[1];
    const results={"/course":grammar,"/catalog":{axes,indicators:[
     item("present-simple","Present Simple","المضارع البسيط","grammar"),
     ...(available?[item("punctuation","Punctuation","علامات الترقيم","writing-analysis")]:[])
    ]},"/followups":{followups:[]},"/lesson/punctuation/course":available?writing:null};
    const body=results[path];
    return r.fulfill({status:body?200:404,contentType:"application/json",body:JSON.stringify(body||{error:"Mock route absent"})});
   });
   await page.goto(base+"/step-grammar-student/",{waitUntil:"domcontentloaded"});
   await page.locator("#student-learning-path").waitFor();
   assert.equal(await page.locator("#writing-analysis-lessons").count(),available?1:0,
    "Writing tile visibility must require a published and successful authenticated course");
   if(available){
    assert.equal(await page.locator("#writing-analysis-lessons .student-course-tile").count(),1);
    assert((await page.locator("#writing-analysis-lessons a").first().getAttribute("href"))
      .includes("lesson.html?slug=punctuation&step=0"));
   }
   const cards=page.locator("#student-curriculum-hub .student-curriculum-card");
   assert.equal(await cards.count(),5,"Show four STEP axes plus a distinct mock exam section");
   assert.equal(await page.locator('#student-curriculum-hub [aria-disabled="true"]').count(),available?2:3,
    "Unavailable axes and Writing must not have dead active buttons");
   assert.equal(await page.locator("#student-exams a").count(),0,
    "Never invent an exam start link before a real exam system exists");
   await page.locator('[data-curriculum-target="exams"]').click();
   assert(await page.locator("#student-exams").isVisible(),"Mock exam placeholder must be reachable");
   assert.equal(new URL(page.url()).hash,"#student-exams","Exam section selection is bookmarkable");
   assert((await page.locator("#student-exams").innerText()).includes("قيد التجهيز"),
    "Reserved exam space must accurately disclose availability");
   assert(!(await page.locator("#student-learning-path").isVisible()),
    "Selecting exams must collapse the long Grammar lesson list");
   if(available){
    await page.locator('[data-curriculum-target="writing"]').click();
    assert(await page.locator("#writing-analysis-lessons").isVisible(),
     "Writing section must open directly");
    assert.equal(new URL(page.url()).hash,"#writing-analysis-lessons","Writing section selection persists in URL");
    await page.goBack();
    assert(await page.locator("#student-exams").isVisible(),"Browser Back restores exam section");
    await page.goForward();
    assert(await page.locator("#writing-analysis-lessons").isVisible(),"Browser Forward restores Writing section");
    const writingSearch=page.locator("#search-writing-lessons");
    await writingSearch.fill("Punctuation");
    assert.equal(await page.locator("#writing-analysis-lessons .student-course-tile:visible").count(),1,
     "Published Writing lessons can be found by name");
    await writingSearch.fill("not-a-step-lesson");
    assert.equal(await page.locator("#writing-analysis-lessons .student-course-tile:visible").count(),0,
     "Search must filter without disclosing draft content");
    await writingSearch.fill("");
   }
   await page.locator('[data-curriculum-target="grammar"]').click();
   assert(await page.locator("#student-learning-path").isVisible(),
    "Grammar section must open directly");
   assert.equal(new URL(page.url()).hash,"#student-learning-path","Grammar selection persists in URL");
   await page.reload({waitUntil:"domcontentloaded"});
   await page.locator("#student-learning-path").waitFor({state:"visible"});
   assert(await page.locator("#student-learning-path").isVisible(),"Reload restores chosen Grammar section");
   assert(await page.locator("#search-grammar-lessons").isVisible(),
    "Grammar lesson search should be accessible");
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),
    "Writing dashboard must fit "+width+"px");
   assert.deepEqual(errors,[],"No browser JS errors at "+width);
   await page.close();
   console.log("PASS writing dashboard "+width+"px: "+(available?"published only":"draft hidden"));
  }
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
