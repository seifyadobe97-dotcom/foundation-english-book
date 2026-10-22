import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createServer} from "node:http";
import {Script} from "node:vm";
import {chromium} from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const data=JSON.parse(await readFile(path.join(root,"tests/fixtures/private-banks/agreement-data.json"),"utf8"));
const front=await readFile(path.join(root,"step-grammar-student/subject-verb-agreement-content.js"),"utf8");
const script=await readFile(path.join(root,"step-grammar-student/subject-verb-agreement.js"),"utf8");
const html=await readFile(path.join(root,"step-grammar-student/subject-verb-agreement.html"),"utf8");
new Script(front);new Script(script);
assert.equal(data.code,"ASGQAGREE");
assert((await readFile(path.join(root,"supabase/functions/step-course/index.ts"),"utf8")).includes("step_private_course_banks"),"Canonical answer bank must stay server-only");assert.equal(data.sections.length,5);
const allIds=data.sections.flatMap(s=>s.questionIds),ids=new Set(allIds);
assert.equal(allIds.length,17);assert.equal(ids.size,17,"Unique source exercise IDs");
for(const id of ids){
 const q=data.questions[id];
 assert(q&&Object.keys(q.options).length===4,"Source MCQ has exactly A/B/C/D");
 assert.equal(Object.keys(q.wrongReasons).length,3,"Distinct reasons for every wrong option");
 assert(["A","B","C","D"].includes(q.correct));
 for(const choice of ["A","B","C","D"])if(choice!==q.correct)
   assert(q.wrongReasons[choice]?.trim(),"Missing reason for "+id+" option "+choice);
}
assert((await readFile(path.join(root,"supabase/functions/step-course/index.ts"),"utf8")).includes('release?.status!=="published"'),"Draft lesson is blocked by a server-side publication gate");
assert(!data.questions["AG-B11"]&&!data.questions["AG-B12"]&&!data.questions["AG-B13"],
 "Typo / misclassified / duplicate bank questions are withheld");
assert(!data.questions["AG-C02"]&&!data.questions["AG-C03"]&&!data.questions["AG-C06"],
 "Near-duplicate, duplicate and three-option source-book questions must remain withheld");
const adminAuditAPI=await readFile(path.join(root,"supabase/functions/step-admin/index.ts"),"utf8");
assert(adminAuditAPI.includes('candidate_id.in.(TAJ2026-177,TAJ2026-321,TAJ2026-355)'),
 "Private admin audit includes cross-document duplicated compilation candidates");
assert(adminAuditAPI.includes("missing_from_ledger")&&adminAuditAPI.includes("invalid_in_course"),
 "Internal release checklist detects any unreviewed or mismatched live question IDs");
assert(html.includes("subject-verb-agreement.js")&&html.includes("subject-verb-agreement-content.js"));
assert(script.includes('const API_PREFIX="/agreement"')&&script.includes("formula-flow")===false);
assert(script.includes('class="flow-pieces"')&&script.includes('dir="ltr"'));
assert(!front.includes("pdf_page")&&!front.includes("source_locator"),"No instructor references in the learner bundle");
const server=createServer(async(req,res)=>{
 const filepath=path.resolve(root,"."+decodeURIComponent(new URL(req.url,"http://local").pathname));
 if(!filepath.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{if(!(await stat(filepath)).isFile())throw Error();
  res.writeHead(200,{"Content-Type":filepath.endsWith(".html")?"text/html; charset=utf-8":filepath.endsWith(".css")?"text/css":"text/javascript"});
  res.end(await readFile(filepath));
 }catch{res.writeHead(404);res.end("Missing");}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const fakeAuth='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"test-access"}}})}}}};';
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const width of [1280,390]){
  let passed=0,answersViewed=0;
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:fakeAuth}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  const course=()=>({
   student:"Student",course:{title:"Subject–Verb Agreement",titleAr:"تطابق الفاعل والفعل",totalQuestions:17},
   sections:data.sections.map((s,i)=>({index:i,id:s.id,title:s.title,titleAr:s.titleAr,
    short:s.short,locked:i>passed,passed:i<passed,questionCount:s.questionIds.length,
    required:Math.ceil(s.questionIds.length*data.requiredPassRate),best:0,attempts:0})),
   nextIndex:Math.min(passed,4),completed:passed===5,
   exam:{unlocked:passed===5,attempts:0,best:0,last:null}
  });
  const publicQuestions=ids=>ids.map((id,i)=>({id:"q"+(i+1),text:data.questions[id].text,options:data.questions[id].options}));
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",async r=>{
   const req=r.request(),endpoint=new URL(req.url()).pathname.split("/step-course")[1];
   let value={error:"Missing mock"},status=200;
   if(endpoint==="/agreement/course")value=course();
   else if(endpoint==="/agreement/videos")value={videos:[]};
   else if(new RegExp("^/agreement/parts/[0-9]+$").test(endpoint)){
    const i=Number(endpoint.split("/").at(-1)),s=data.sections[i];
    value={part:{...s,questions:publicQuestions(s.questionIds),passRequired:Math.ceil(s.questionIds.length*.6)},progress:course()};
   }else if(new RegExp("^/agreement/parts/[0-9]+/submit$").test(endpoint)){
    const i=Number(endpoint.split("/")[3]),s=data.sections[i],body=JSON.parse(req.postData()||"{}");
    const graded=s.questionIds.map((id,n)=>{const q=data.questions[id],selected=body.answers["q"+(n+1)];
     return {id:"q"+(n+1),selected,correct:q.correct,isCorrect:selected===q.correct,
      wrongReason:selected===q.correct?null:q.wrongReasons[selected],wrongReasons:q.wrongReasons,explanation:q.explanation};
    });
    const hits=graded.filter(q=>q.isCorrect).length;
    if(hits>=Math.ceil(s.questionIds.length*.6))passed=Math.max(passed,i+1);
    value={results:graded,passed:hits>=Math.ceil(s.questionIds.length*.6),correctCount:hits,total:graded.length,
     required:Math.ceil(s.questionIds.length*.6),progress:course()};
    answersViewed++;
   }else if(endpoint==="/agreement/exam")value={questions:publicQuestions(allIds.slice(0,10)),total:10};
   else if(endpoint==="/agreement/exam/submit"){
    const body=JSON.parse(req.postData()||"{}");
    const scored=allIds.slice(0,10).map((id,n)=>{const q=data.questions[id],selected=body.answers["q"+(n+1)];
     return {id:"q"+(n+1),selected,correct:q.correct,isCorrect:selected===q.correct,
      wrongReason:selected===q.correct?null:q.wrongReasons[selected],wrongReasons:q.wrongReasons,explanation:q.explanation};});
    const hit=scored.filter(x=>x.isCorrect).length;
    value={result:{score:hit,total:10,percentage:hit*10,date:new Date().toISOString()},results:scored,progress:course()};
   }else status=404;
   await r.fulfill({status,contentType:"application/json",body:JSON.stringify(value)});
  });
  await page.goto(origin+"/step-grammar-student/subject-verb-agreement.html",{waitUntil:"domcontentloaded"});
  await page.locator(".question").first().waitFor({timeout:12000});
  assert.equal(await page.locator(".path-button").count(),5);
  assert.equal(await page.locator(".agreement-table").count(),1);
  assert.equal(await page.locator(".agreement-flow").count(),2);
  assert.equal(await page.locator(".flow-pieces").first().getAttribute("dir"),"ltr");
  assert.equal(await page.locator(".q-answers").first().getAttribute("dir"),"ltr");
  assert.equal(await page.locator(".q-answer").count(),data.sections[0].questionIds.length*4);
  assert(!/AG-C01|pdf_page|source_locator/.test(await page.locator("body").innerText()));
  let q0=data.questions[data.sections[0].questionIds[0]];
  for(let i=0;i<data.sections[0].questionIds.length;i++){
   const q=data.questions[data.sections[0].questionIds[i]],choice=i===0?["A","B","C","D"].find(k=>k!==q.correct):q.correct;
   await page.locator('.q-answer[data-index="'+i+'"][data-value="'+choice+'"]').click();
  }
  await page.locator('button[data-action="submit"]').click();
  await page.locator(".answer-feedback").first().waitFor({timeout:10000});
  assert.equal(await page.locator(".answer-feedback.is-wrong").count(),1);
  assert.match(await page.locator(".answer-feedback.is-wrong").innerText(),/ليه اختيارك غلط/);
  assert.match(await page.locator(".answer-feedback.is-wrong").innerText(),/الإجابة الصحيحة/);
  await page.locator(".feedback-distractors").first().locator("summary").click();
  assert.equal(await page.locator(".feedback-distractors").first().locator("li").count(),3);
  assert.equal(await page.locator(".feedback-distractors").first().locator("li span").count(),3);
  assert.equal(answersViewed,1);
  assert.equal(passed,1,"First stage passes with other correct answers");
  assert.equal(errors.length,0,"No JS errors: "+errors.join("; "));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert(!overflow,"No sideways page overflow at width "+width);
  results.push({width,stageCount:5,practiceQuestions:data.sections[0].questionIds.length,errorFeedback:true,overflow:false});
  await page.close();
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
for(const r of results)console.log("PASS Agreement lesson",JSON.stringify(r));
