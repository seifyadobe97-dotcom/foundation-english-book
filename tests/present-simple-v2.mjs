import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const dataset=JSON.parse(await readFile(path.join(root,"supabase/functions/step-course/lesson-data.json"),"utf8"));
const server=createServer(async(req,res)=>{
 const f=path.resolve(root,"."+decodeURIComponent(new URL(req.url,"http://localhost").pathname));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(f)).isFile())throw Error("No file");
  res.writeHead(200,{"Content-Type":f.endsWith(".html")?"text/html; charset=utf-8":f.endsWith(".css")?"text/css":"text/javascript"});
  res.end(await readFile(f));
 }catch{res.writeHead(404);res.end("No file");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port;
const fakeAuth='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"mock-token"}}})}}}};';
function course(passed=0){
 return {student:"Student",course:{titleAr:"المضارع البسيط",title:"Present Simple",totalQuestions:20},sections:dataset.sections.map((s,i)=>({
  index:i,titleAr:s.titleAr,locked:i>passed,passed:i<passed,questionCount:s.questionIds.length
 })),nextIndex:Math.min(passed,5),completed:passed===6,exam:{unlocked:passed===6,attempts:0,best:0}};
}
function part(i,passed){
 const s=dataset.sections[i];
 return {part:{titleAr:s.titleAr,passRequired:Math.ceil(s.questionIds.length*dataset.requiredPassRate),
  questions:s.questionIds.map((id,n)=>({id:"q"+(n+1),text:dataset.questions[id].text,options:dataset.questions[id].options}))},
 progress:course(passed)};
}
function setupRoutes(page,initialPassed=0){
 let passed=initialPassed;
 return Promise.all([
  page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:fakeAuth})),
  page.route("https://fonts.googleapis.com/**",r=>r.abort()),
  page.route("https://fonts.gstatic.com/**",r=>r.abort()),
  page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",route=>{
   const req=route.request(),url=new URL(req.url()).pathname.split("/step-course")[1];
   let payload;
   if(url==="/course")payload=course(passed);
   else if(/^\/parts\/\d+$/.test(url))payload=part(Number(url.split("/").at(-1)),passed);
   else if(/^\/parts\/\d+\/submit$/.test(url)){
    const index=Number(url.split("/")[2]),qs=part(index,passed).part.questions,answers=JSON.parse(req.postData()).answers;
    const result=qs.map((q,n)=>({id:q.id,correct:dataset.questions[dataset.sections[index].questionIds[n]].correct,
      selected:answers[q.id],isCorrect:answers[q.id]===dataset.questions[dataset.sections[index].questionIds[n]].correct,
      explanation:"الإجابة مرتبطة بالفاعل وزمن الجملة."}));
    const correctCount=result.filter(r=>r.isCorrect).length;
    const success=correctCount>=Math.ceil(qs.length*dataset.requiredPassRate);
    if(success)passed=Math.max(passed,index+1);
    payload={passed:success,correctCount,total:qs.length,results:result,progress:course(passed)};
   }else if(url==="/exam")payload={questions:part(0,passed).part.questions,total:3};
   else if(url==="/exam/submit"){
    const qs=part(0,passed).part.questions,answers=JSON.parse(req.postData()).answers;
    const results=qs.map((q,n)=>({id:q.id,correct:dataset.questions[dataset.sections[0].questionIds[n]].correct,
     selected:answers[q.id],isCorrect:true,explanation:"إجابة صحيحة."}));
    payload={result:{score:qs.length,total:qs.length,percentage:100},results,progress:course(6)};
   }else payload={error:"Unknown mock route "+url};
   return route.fulfill({status:payload.error?404:200,contentType:"application/json",body:JSON.stringify(payload)});
  })
 ]);
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const viewport of [{width:1280,height:850},{width:390,height:844}]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await setupRoutes(page);
  await page.goto(base+"/step-grammar-student/lesson-v2.html",{waitUntil:"domcontentloaded"});
  try { await page.locator(".lesson-title").waitFor({timeout:7000}); } catch(error){
    console.error("STEP V2 LOAD DEBUG",JSON.stringify({viewport,errors,location:page.url(),html: (await page.locator("body").innerText()).slice(0,1800),scripts:await page.locator("script[src]").evaluateAll(xs=>xs.map(x=>x.src))}));
    throw error;
  }
  assert.match(await page.locator(".lesson-title").innerText(),/استخدمه إمتى/);
  assert.equal(await page.locator(".path-button").count(),6);
  assert.equal(await page.locator(".example").count(),4);
  assert.match(await page.locator(".example-label").first().innerText(),/دي عادة/);
  assert.match(await page.locator(".example-label").nth(1).innerText(),/دي حقيقة/);
  assert.match(await page.locator(".example-label").nth(2).innerText(),/دي وظيفة/);
  assert.equal(await page.locator(".example-sentence mark").count()>=4,true);
  assert(!((await page.locator("body").innerText()).includes("bdi")),"No broken HTML tags");
  assert(!((await page.locator("body").innerText()).includes("ASGQ")),"No internal codes");
  assert(!((await page.locator("body").innerText()).includes("بنك الأسئلة")),"No source labels");
  const quick=page.locator(".check-option");
  assert.equal(await quick.count(),2);
  await quick.first().click();
  assert.match(await page.locator(".check-result").innerText(),/ممتاز/);
  assert.equal(await page.locator(".question").count(),3);
  assert.equal(await page.locator('#submit-practice').isDisabled(),true);
  const ids=dataset.sections[0].questionIds;
  for(const [i,id] of ids.entries())await page.locator(".question").nth(i).locator('[data-value="'+dataset.questions[id].correct+'"]').click();
  assert.equal(await page.locator('#submit-practice').isEnabled(),true);
  await page.locator('#submit-practice').click();
  await page.locator(".score").waitFor({timeout:10000});
  assert.match(await page.locator(".score").innerText(),/نجحت/);
  assert.equal(await page.locator('[data-action="continue"]').count(),1);
  assert.equal((await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)),true,"No horizontal overflow");
  assert.deepEqual(errors,[],"Unexpected client errors");
  console.log("PASS Present Simple V2 "+viewport.width+"px");
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
 await setupRoutes(page,5);
 await page.goto(base+"/step-grammar-student/lesson-v2.html?step=5",{waitUntil:"domcontentloaded"});
 await page.locator(".lesson-title").waitFor({timeout:15000});
 assert.match(await page.locator(".lesson-title").innerText(),/الكلمات الدالة/);
 assert.equal(await page.locator(".keyword").count(),6);
 assert.equal(await page.locator(".optional summary").count(),1);
 await page.locator(".optional summary").click();
 assert.equal(await page.locator(".optional .optional-content").isVisible(),true);
 await context.close();
 console.log("PASS Present Simple V2 final section");
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}