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
function setupRoutes(page,initialPassed=0,record={}){
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
    const index=Number(url.split("/")[2]),qs=part(index,passed).part.questions,body=JSON.parse(req.postData()),answers=body.answers;
    record.practice=body;
    assert.deepEqual(Object.keys(body.timings||{}).sort(),qs.map(q=>q.id).sort(),"Practice sends item timings");
    assert(qs.every(q=>Number.isInteger(body.timings[q.id].ms)&&Number.isInteger(body.timings[q.id].changes)));
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
    const qs=examQuestions(),body=JSON.parse(req.postData()),answers=body.answers;
    record.exam=body;
    assert.deepEqual(Object.keys(body.timings||{}).sort(),qs.map(q=>q.id).sort(),"Exam sends item timings");
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
  const trace={};
  await setupRoutes(page,0,trace);
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
  assert.equal(Object.keys(trace.practice.timings).length,3);
  assert(trace.practice.timings.q1.ms>=0);
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
  try{await img.decode();return {ok:img.naturalWidth>=300,width:img.naturalWidth,complete:img.complete};}
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
 const finalTrace={};
 await setupRoutes(page,5,finalTrace);
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
 assert.equal(await page.locator('#exam-elapsed').count(),1);
 assert.match(await page.locator('#exam-elapsed').innerText(),/^\d{2}:\d{2}$/);
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
 assert.equal(Object.keys(finalTrace.exam.timings).length,10);
 assert(finalTrace.exam.timings.q1.ms>=0,"Exam captures approximate per-question duration");
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

 // Authorized admin report and cohort panels must render diagnostics without exposing raw data publicly.
 const adminContext=await browser.newContext({viewport:{width:390,height:844}}),adminPage=await adminContext.newPage(),adminErrors=[];
 adminPage.on("pageerror",error=>adminErrors.push(String(error)));
 await adminPage.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:fakeAuth}));
 await adminPage.route("https://fonts.googleapis.com/**",r=>r.abort());
 await adminPage.route("https://fonts.gstatic.com/**",r=>r.abort());
 const studentId="11111111-1111-4111-8111-111111111111";
 const sectionInsights=dataset.sections.map((sec,i)=>({
  index:i,title:sec.titleAr,answers:i===2?8:1,correct:i===2?3:1,
  unique_questions:i===2?3:1,accuracy:i===2?38:100,avg_seconds:i===2?43:18,
  timed_answers:i===2?8:1,status:i===2?"تحتاج متابعة":"بيانات غير كافية",
  recommendation:i===2?"راجع قاعدة s / es / ies":"نحتاج أسئلة أكثر"
 }));
 let adminFollowups=[];
 await adminPage.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-admin**",route=>{
  const path=new URL(route.request().url()).pathname;
  let data;
  if(path.endsWith("/me"))data={role:"owner",username:"Pilot Admin"};
  else if(path.endsWith("/indicators"))data={indicators:[
   {slug:"present-simple",axis_code:"grammar",title_ar:"المضارع البسيط",
    title_en:"Present Simple",status:"published",report_ready:true},
   {slug:"present-continuous",axis_code:"grammar",title_ar:"المضارع المستمر",
    title_en:"Present Continuous",status:"draft",report_ready:false},
   {slug:"punctuation",axis_code:"writing-analysis",title_ar:"علامات الترقيم",
    title_en:"Punctuation",status:"draft",report_ready:false}
  ]};
  else if(path.endsWith("/analytics"))data={
   overview:{students_total:2,students_active:2,students_completed:1,students_exam_taken:1,
    practice_attempts:16,exam_attempts:1,avg_exam_percent:80},
   parts:dataset.sections.map((sec,i)=>({part_index:i,title:sec.titleAr,students_tried:1,
    students_passed:1,attempts:2,avg_score_percent:80})),
   learning:{sections:sectionInsights,answers:13,timed_answers:13,note:"أزمنة الإجابة تقديرية"}
  };
  else if(path.endsWith("/students"))data={students:[],total:0,page:1,page_size:25};
  else if(path.endsWith("/followups")&&route.request().method()==="POST"){
   const p=route.request().postDataJSON();
   adminFollowups.unshift({...p,id:"22222222-2222-4222-8222-222222222222",
    title:dataset.sections[p.part_index].titleAr,assigned_at:new Date().toISOString(),
    reviewed_at:null,cancelled_at:null,status:"pending"});
   data={followup:adminFollowups[0]};
  }
  else if(path.endsWith("/followups"))data={followups:adminFollowups};
  else if(path.endsWith("/cancel")&&route.request().method()==="POST"){
   adminFollowups=adminFollowups.map(t=>({...t,status:"cancelled",cancelled_at:new Date().toISOString()}));data={ok:true};
  }
  else if(path.endsWith("/report"))data={
   student:{user_id:studentId,username:"Pilot",email:"",phone:"",active:true,joined:"2026-10-21T12:00:00Z"},
   summary:{passed_parts:2,total_parts:6,practice_attempts:3,exam_attempts:0,
    best_exam_percent:null,part_history_truncated:false,exam_history_truncated:false},
   sections:dataset.sections.map((sec,i)=>({index:i,title:sec.titleAr,attempts:0,
    best_percent:null,passed:false,latest_attempt:null})),
   attempts:[],exams:[],insights:{sections:sectionInsights,answers:13,correct:8,
    accuracy:62,timed_answers:13,avg_seconds:34,
    priority:[{title:"s / es / ies",status:"تحتاج متابعة",action:"راجع القاعدة"}],
    questions:[{question_text:"He ____ every day.",answers:4,accuracy:25,avg_seconds:45,
     common_wrong:{letter:"A",option:"go"}}],truncated:false,
    note:"هذا تحليل للمحاولات الجديدة فقط"},
   followup_impact:[{id:"44444444-4444-4444-8444-444444444444",
    part_index:2,title:"s / es / ies",assigned_at:"2026-10-21T18:00:00Z",
    before:{answers:6,correct:2,unique_questions:3,accuracy:33},
    after:{answers:6,correct:5,unique_questions:3,accuracy:83},
    delta:50,status:"تحسن مبدئي"}],impact_history_limited:false
  };
  else data={error:"Unknown admin route"};
  return route.fulfill({status:data.error?404:200,contentType:"application/json",body:JSON.stringify(data)});
 });
 await adminPage.goto(base+"/step-grammar-admin/reports.html",{waitUntil:"domcontentloaded"});
 await adminPage.locator(".indicator-card").first().waitFor({timeout:10000});
 assert.equal(await adminPage.locator(".indicator-card").count(),3,"All indicators have report entry cards");
 assert.equal(await adminPage.locator('.indicator-card[href*="present-simple"]').count(),1);
 await adminPage.locator('.indicator-card[href*="present-continuous"]').click();
 await adminPage.getByText(/المؤشر لسه مسودة/).waitFor({timeout:7000});
 assert.equal(await adminPage.locator("#skill-insights").count(),0,"A draft must not display another indicator's grades");
 await adminPage.goto(base+"/step-grammar-admin/reports.html?indicator=present-simple&student="+studentId,{waitUntil:"domcontentloaded"});
 await adminPage.locator("#skill-insights").waitFor({timeout:10000});
 assert.match(await adminPage.locator("h1").first().innerText(),/المضارع البسيط/);
 assert.match(await adminPage.locator("#followup-impact").innerText(),/تحسن مبدئي/);
 assert.match(await adminPage.locator("#skill-insights").innerText(),/تحليل المهارات وتوصيات المتابعة/);
 assert.match(await adminPage.locator("#skill-insights").innerText(),/تحتاج متابعة/);
 await adminPage.locator("#followup-form").waitFor();
 await adminPage.locator('#followup-form [name="part_index"]').selectOption("2");
 await adminPage.locator('#followup-form [name="kind"]').selectOption("video");
 await adminPage.locator('#followup-form [name="note"]').fill("راجع الفيديو ثم جرّب أسئلة s / es / ies");
 await adminPage.locator('#followup-form button[type="submit"]').click();
 await adminPage.locator('.followup-item').waitFor({timeout:7000});
 assert.match(await adminPage.locator('.followup-item').innerText(),/راجع الفيديو/);
 adminPage.on("dialog",d=>d.accept());
 await adminPage.locator("[data-cancel-followup]").click();
 await adminPage.getByText("ملغي").waitFor({timeout:7000});
 await adminPage.locator("#back").click();
 await adminPage.getByText("نظرة تعليمية على مهارات المجموعة").waitFor({timeout:10000});
 assert.equal(new URL(adminPage.url()).searchParams.get("indicator"),"present-simple");
 assert.match(await adminPage.locator("h1").first().innerText(),/المضارع البسيط/);
 assert.equal(await adminPage.locator(".insight-card").count()>=6,true);
 assert.equal(await adminPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,"Admin insights fit mobile");
 assert.deepEqual(adminErrors,[],"Admin report and cohort JS must not fail");
 await adminContext.close();
 console.log("PASS STEP admin skill insights, assignment and cancellation 390px");

 const studentContext=await browser.newContext({viewport:{width:390,height:844}}),
   studentPage=await studentContext.newPage(),studentErrors=[];
 studentPage.on("pageerror",e=>studentErrors.push(String(e)));
 await studentPage.route("https://cdn.jsdelivr.net/npm/@supabase/**",
  r=>r.fulfill({contentType:"text/javascript",body:fakeAuth}));
 await studentPage.route("https://fonts.googleapis.com/**",r=>r.abort());
 await studentPage.route("https://fonts.gstatic.com/**",r=>r.abort());
 let reviewed=false,reviewCalls=0;
 await studentPage.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",route=>{
  const u=new URL(route.request().url()).pathname,method=route.request().method();
  let data;
  if(u.endsWith("/course"))data=course(2);
  else if(u.endsWith("/catalog"))data={axes:[],indicators:[]};
  else if(u.endsWith("/followups")&&method==="GET")data={followups:[{
   id:"33333333-3333-4333-8333-333333333333",part_index:2,kind:"video",title:"s / es / ies",
   note:"ركز على قاعدة s مع Does",accessible:true,due_at:null,status:reviewed?"reviewed":"pending"
  }]};
  else if(u.endsWith("/review")&&method==="POST"){reviewCalls++;reviewed=true;data={ok:true};}
  else data={error:"Unknown student route"};
  return route.fulfill({status:data.error?404:200,contentType:"application/json",body:JSON.stringify(data)});
 });
 await studentPage.goto(base+"/step-grammar-student/index.html",{waitUntil:"domcontentloaded"});
 await studentPage.locator(".student-task").waitFor({timeout:10000});
 assert.match(await studentPage.locator(".student-task").innerText(),/ركز على قاعدة/);
 assert.equal(await studentPage.locator(".student-task a").getAttribute("href"),"learn.html?step=2");
 await studentPage.locator("[data-followup-review]").click();
 await studentPage.getByText("تمت المراجعة — منتظر التدريب").waitFor({timeout:7000});
 assert.equal(reviewCalls,1);
 assert.equal(await studentPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,"Student plan fits mobile");
 assert.deepEqual(studentErrors,[],"Student dashboard JS must not fail");
 await studentContext.close();
 console.log("PASS STEP student assigned follow-up and review 390px");
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}