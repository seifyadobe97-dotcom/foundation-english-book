import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const book=JSON.parse(await readFile(path.join(root,"supabase/functions/step-course/lesson-data.json"),"utf8"));
const guide=JSON.parse(await readFile(path.join(root,"curriculum/guides/present-simple.source.json"),"utf8"));
const server=createServer(async(req,res)=>{
 const p=decodeURIComponent(new URL(req.url,"http://localhost").pathname),f=path.resolve(root,"."+p);
 if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{if(!(await stat(f)).isFile())throw Error("missing");res.writeHead(200,{"Content-Type":f.endsWith(".html")?"text/html":"text/plain"});res.end(await readFile(f))}
 catch{res.writeHead(404);res.end("missing")}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const url="http://127.0.0.1:"+server.address().port+"/step-grammar-student/learn.html";
const auth='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"mock"}}}),signOut:async()=>({})}}}};';
function progress(passed=0){
 return {student:"Demo",course:{title:"Present Simple",titleAr:"المضارع البسيط",subtitle:"",totalQuestions:21},
  sections:book.sections.map((s,i)=>({index:i,titleAr:s.titleAr,short:s.short,locked:i>passed,passed:i<passed,questionCount:s.questionIds.length})),
  nextIndex:Math.min(passed,5),completed:passed===6,exam:{unlocked:passed===6,attempts:0,best:0}};
}
function part(index){
 const s=book.sections[index];
 const questions=s.questionIds.map(id=>({id,text:book.questions[id].text,options:book.questions[id].options}));
 return {part:{...s,questions,passRequired:Math.ceil(questions.length*book.requiredPassRate)},progress:progress(0)};
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const size of [{width:1320,height:880},{width:390,height:844}]){
  const ctx=await browser.newContext({viewport:size}),pg=await ctx.newPage(),errors=[];
  pg.on("pageerror",e=>errors.push(String(e)));
  await pg.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:auth}));
  await pg.route("https://fonts.googleapis.com/**",r=>r.abort());
  await pg.route("https://fonts.gstatic.com/**",r=>r.abort());
  await pg.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",route=>{
   const full=new URL(route.request().url()),p=full.pathname.split("/step-course")[1],method=route.request().method();
   let data;
   if(p==="/course")data=progress(0);
   else if(p==="/guide")data={guide};
   else if(p==="/parts/0")data=part(0);
   else if(p==="/parts/0/submit"&&method==="POST"){
    const answers=JSON.parse(route.request().postData()||"{}").answers||{};
    const ids=book.sections[0].questionIds;
    const feedback=ids.map(id=>({id,selected:answers[id],correct:book.questions[id].correct,isCorrect:answers[id]===book.questions[id].correct,explanation:book.questions[id].explanation}));
    data={passed:true,correctCount:ids.length,total:ids.length,results:feedback,progress:progress(1)};
   }
   else data={error:"Unknown mock route "+p};
   return route.fulfill({status:data.error?404:200,contentType:"application/json",body:JSON.stringify(data)});
  });
  await pg.goto(url,{waitUntil:"domcontentloaded"});
  await pg.locator(".coach-opt").first().waitFor({timeout:13000});
  assert.equal(await pg.locator(".map button").count(),6);
  assert.equal(await pg.locator(".quiz").count(),3);
  assert.equal(await pg.locator(".example").count()>0,true);
  assert.equal(await pg.locator(".coach-opt").count(),2);
  assert.equal(await pg.locator(".signal-card").count()>0,true,"Tap-to-reveal idea cards present");
  await pg.locator(".signal-card").first().click();
  assert.equal(await pg.locator(".signal-card").first().locator("small").isVisible(),true);

  await pg.locator(".coach-opt").first().click();
  assert.match(await pg.locator("#coach-feedback").innerText(),/ممتاز/);
  assert.equal(await pg.locator("#grade").isDisabled(),true);
  const ids=book.sections[0].questionIds;
  for(const [i,id] of ids.entries())await pg.locator('.quiz').nth(i).locator('[data-choice="'+book.questions[id].correct+'"]').click();
  assert.equal(await pg.locator("#grade").isEnabled(),true);
  await pg.locator("#grade").click();
  await pg.locator(".summary").first().waitFor({timeout:13000});
  assert.match(await pg.locator(".summary").first().innerText(),/أتقنت/);
  assert.equal(await pg.locator("#continue").count(),1);
  const dom=await pg.locator("body").innerText();
  assert(!dom.includes("ASGQ"),"question codes leaked into screen");
  assert(!dom.includes("بنك الأسئلة")&&!dom.includes("كتاب STEP"),"source attribution leaked into learner lesson");
  assert.deepEqual(errors,[],"Javascript errors on unified student page");
  console.log("PASS unified STEP student flow "+size.width+"px");
  await ctx.close();
 }
}finally{if(browser)await browser.close();await new Promise(done=>server.close(done))}
