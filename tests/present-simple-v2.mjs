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
  res.writeHead(200,{"Content-Type":f.endsWith(".html")?"text/html; charset=utf-8":f.endsWith(".css")?"text/css":f.endsWith(".svg")?"image/svg+xml":f.endsWith(".webp")?"image/webp":"text/javascript"});
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
// Deterministic ten-question exam fixture: the production API selects ten random bank questions.
const examIds=dataset.sections.flatMap(s=>s.questionIds).slice(0,10);
function examQuestions(){
 return examIds.map((id,i)=>({id:"q"+(i+1),text:dataset.questions[id].text,options:dataset.questions[id].options}));
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
    const result=qs.map((q,n)=>{
     const item=dataset.questions[dataset.sections[index].questionIds[n]];
     const selected=answers[q.id];
     return {id:q.id,correct:item.correct,selected,isCorrect:selected===item.correct,
      wrongReason:selected===item.correct?null:item.wrongReasons?.[selected],
      explanation:item.explanation};
    });
    const correctCount=result.filter(r=>r.isCorrect).length;
    const success=correctCount>=Math.ceil(qs.length*dataset.requiredPassRate);
    if(success)passed=Math.max(passed,index+1);
    payload={passed:success,correctCount,total:qs.length,results:result,progress:course(passed)};
   }else if(url==="/exam")payload={questions:examQuestions(),total:examIds.length};
   else if(url==="/exam/submit"){
    const qs=examQuestions(),answers=JSON.parse(req.postData()).answers;
    const results=qs.map((q,n)=>{
     const correct=dataset.questions[examIds[n]].correct,selected=answers[q.id];
     return {id:q.id,correct,selected,isCorrect:selected===correct,
      wrongReason:selected===correct?null:dataset.questions[examIds[n]].wrongReasons?.[selected],
      explanation:dataset.questions[examIds[n]].explanation};
    });
    const score=results.filter(r=>r.isCorrect).length;
    payload={result:{score,total:qs.length,percentage:Math.round(score/qs.length*100)},results,progress:course(6)};
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
  assert.deepEqual(await page.locator(".option-letter").allInnerTexts(),["A","B"]);
  assert.equal(await page.locator(".check-desc").evaluate(el=>getComputedStyle(el).direction),"ltr");
  assert.equal(await page.locator(".check-options").evaluate(el=>getComputedStyle(el).direction),"ltr");
  const quickBoxes=await Promise.all([quick.first().boundingBox(),quick.nth(1).boundingBox()]);
  if(viewport.width>480)assert(quickBoxes[0].x<quickBoxes[1].x,"Quick answers should flow A then B from left to right");
  const wrongQuick=viewport.width<500;
  await quick.nth(wrongQuick?1:0).click();
  assert.match(await page.locator(".check-result").innerText(),wrongQuick?/إجابة غير صحيحة/:/إجابة صحيحة/);
  if(wrongQuick){
   assert.equal(await page.locator(".check-option.incorrect").count(),1);
   assert.equal(await page.locator(".check-option.correct").count(),1);
   assert.match(await page.locator(".feedback-why").first().innerText(),/every day/);
   assert.match(await page.locator(".feedback-correct").first().innerText(),/الإجابة الصحيحة/);
  }
  assert.equal(await page.locator(".question").count(),3);
  assert.equal(await page.locator('#submit-practice').isDisabled(),true);
  const ids=dataset.sections[0].questionIds;
  assert.equal(await page.locator(".q-answers").first().evaluate(el=>getComputedStyle(el).direction),"ltr");
  const optionBoxes=await Promise.all([
   page.locator(".question").first().locator(".q-answer").first().boundingBox(),
   page.locator(".question").first().locator(".q-answer").nth(1).boundingBox()
  ]);
  if(viewport.width>480)assert(optionBoxes[0].x<optionBoxes[1].x,"Bank options should flow A then B from left to right");
  let wrongCode;
  for(const [i,id] of ids.entries()){
   const q=dataset.questions[id],value=viewport.width<500&&i===0?(wrongCode=Object.keys(q.wrongReasons)[0]):q.correct;
   await page.locator(".question").nth(i).locator('[data-value="'+value+'"]').click();
  }
  assert.equal(await page.locator('#submit-practice').isEnabled(),true);
  await page.locator('#submit-practice').click();
  await page.locator(".score").waitFor({timeout:10000});
  assert.match(await page.locator(".score").innerText(),/نجحت/);
  assert.equal(await page.locator(".answer-feedback.is-correct").count(),viewport.width<500?2:3);
  if(viewport.width<500){
   const wrong=page.locator(".answer-feedback.is-wrong");
   assert.equal(await wrong.count(),1);
   assert.match(await wrong.innerText(),/ليه اختيارك غلط/);
   assert.match(await wrong.innerText(),/الإجابة الصحيحة/);
   assert.match(await wrong.innerText(),new RegExp(dataset.questions[ids[0]].wrongReasons[wrongCode].slice(0,12)));
   assert.equal(await page.locator(".q-answer.bad").count(),1);
   assert.equal(await page.locator(".q-answer.good").count(),3);
  }
  assert.equal(await page.locator('[data-action="continue"]').count(),1);
  assert.equal((await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)),true,"No horizontal overflow");
  assert.deepEqual(errors,[],"Unexpected client errors");
  console.log("PASS Present Simple V2 "+viewport.width+"px");
  await context.close();
 }
 const mediaContext=await browser.newContext({viewport:{width:390,height:844}}),mediaPage=await mediaContext.newPage();
 const mediaErrors=[];
 mediaPage.on("pageerror",error=>mediaErrors.push(String(error)));
 await setupRoutes(mediaPage,2);
 await mediaPage.goto(base+"/step-grammar-student/lesson-v2.html?step=2",{waitUntil:"domcontentloaded"});
 await mediaPage.locator(".lesson-title").waitFor({timeout:10000});
 assert.match(await mediaPage.locator(".lesson-title").innerText(),/s \/ es \/ ies/);
 const videoCard=mediaPage.locator(".lesson-video");
 assert.equal(await videoCard.count(),1,"Only the video-enabled stage has a video card");
 const tiktokLink=videoCard.locator("a.video-open");
 assert.equal(await tiktokLink.getAttribute("href"),"https://vt.tiktok.com/ZSgyJoEnb/");
 assert.equal(await tiktokLink.getAttribute("target"),"_blank");
 assert.equal(await tiktokLink.getAttribute("rel"),"noopener noreferrer");
 const logoStatus=await mediaPage.locator(".step-brand-image").evaluate(async img=>{
  try{await img.decode();return {ok:img.naturalWidth>400,width:img.naturalWidth,complete:img.complete};}
  catch(e){return {ok:false,width:img.naturalWidth,complete:img.complete,error:String(e)};}
 });
 assert.equal(logoStatus.ok,true,"STEP logo must decode in Chromium: "+JSON.stringify(logoStatus));
 const sources=await mediaPage.evaluate(()=>({
  youtube:videoSource({url:"https://youtu.be/dQw4w9WgXcQ"})?.embed,
  tiktok:videoSource({url:"https://www.tiktok.com/@seify/video/7333333333333333333"})?.embed,
  malicious:videoSource({url:"https://vt.tiktok.com.evil.example/ZSa/"})
 }));
 assert.equal(sources.youtube,"https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
 assert.equal(sources.tiktok,"https://www.tiktok.com/player/v1/7333333333333333333");
 assert.equal(sources.malicious,null,"Do not follow lookalike video hosts");

 assert.match(await tiktokLink.innerText(),/TikTok/);
 assert.equal(await videoCard.locator("iframe").count(),0,"Unresolved TikTok short links should not load a broken iframe");
 assert.equal(await mediaPage.locator(".question").count(),dataset.sections[2].questionIds.length,"Video does not replace practice");
 assert.equal((await mediaPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)),true,"Video must not create horizontal overflow");
 assert.deepEqual(mediaErrors,[],"Unexpected video lesson client errors");
 await mediaContext.close();
 console.log("PASS STEP optional TikTok link, video safety, and mobile layout");
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
 await setupRoutes(page,5);
 await page.goto(base+"/step-grammar-student/lesson-v2.html?step=5",{waitUntil:"domcontentloaded"});
 await page.locator(".lesson-title").waitFor({timeout:15000});
 assert.match(await page.locator(".lesson-title").innerText(),/الكلمات الدالة/);
 assert.equal(await page.locator(".keyword").count(),6);
 assert.equal(await page.locator(".optional summary").count(),1);
 await page.locator(".optional summary").click();
 assert.equal(await page.locator(".optional .optional-content").isVisible(),true);
 // Finish stage six and open the mastery exam without bypassing lesson navigation.
 const finalIds=dataset.sections[5].questionIds;
 assert.equal(await page.locator(".question").count(),finalIds.length);
 for(const [i,id] of finalIds.entries()){
  await page.locator(".question").nth(i).locator('[data-value="'+dataset.questions[id].correct+'"]').click();
 }
 await page.locator('#submit-practice').click();
 await page.locator('.score').waitFor({timeout:10000});
 assert.match(await page.locator('.score').innerText(),/نجحت/);
 await page.locator('[data-action="continue"]').click();
 await page.locator('.lesson-title').waitFor({timeout:10000});
 assert.match(await page.locator('.lesson-title').innerText(),/اختبار الإتقان/);
 assert.equal(await page.locator('.question').count(),10);
 assert.equal(await page.locator('#submit-practice').isDisabled(),true);
 // Intentionally miss one answer: the mock must grade it as wrong, not always 100%.
 for(let i=0;i<examIds.length;i++){
  const correct=dataset.questions[examIds[i]].correct;
  const choice=i===0?["A","B","C","D"].find(v=>v!==correct):correct;
  await page.locator('.question').nth(i).locator('[data-value="'+choice+'"]').click();
 }
 assert.equal(await page.locator('#submit-practice').isEnabled(),true);
 await page.locator('#submit-practice').click();
 await page.locator('.score').waitFor({timeout:10000});
 assert.match(await page.locator('.score').innerText(),/9 من 10/);
 assert.equal(await page.locator('.answer-feedback.is-wrong').count(),1);
 assert.equal(await page.locator('.answer-feedback.is-correct').count(),9);
 assert.match(await page.locator('.answer-feedback.is-wrong').innerText(),/ليه اختيارك غلط/);
 assert.match(await page.locator('.answer-feedback.is-wrong').innerText(),/الإجابة الصحيحة/);
 assert.equal(await page.locator('.q-answer.bad').count(),1);
 assert.equal(await page.locator('.q-answer.good').count(),10);
 assert.match(await page.locator('.score').innerText(),/النتيجة محفوظة/);
 assert(!((await page.locator('body').innerText()).includes("ASGQ")),"Exam never exposes bank codes");
 await context.close();
 console.log("PASS Present Simple V2 final section, mastery exam, and grading");
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}