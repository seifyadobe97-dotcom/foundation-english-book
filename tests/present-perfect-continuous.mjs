import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import {createServer} from "node:http";
import {chromium} from "playwright";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const server=createServer(async(req,res)=>{
 const requested=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const full=path.resolve(root,"."+requested);
 if(!full.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 const p=requested.endsWith("/")?path.join(full,"index.html"):full;
 try{if(!(await stat(p)).isFile())throw Error();
  res.writeHead(200,{"Content-Type":p.endsWith(".html")?"text/html":p.endsWith(".css")?"text/css":"text/javascript"});res.end(await readFile(p));
 }catch{res.writeHead(404);res.end("Not Found")}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const local="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const teaching=Array.from({length:7},(_,i)=>({
 title:"Present Perfect Continuous — mock stage "+(i+1),detail:"Synthetic teacher explanation with [[have/has been + V-ing]]",
 cards:[["Have","have been working","since","1"],["Has","has been reading","for","2"],["-ing","have been learning","continuity","3"]],
 examples:[["Mock","I [[have been working]] since eight.","Duration"],["Mock","She [[has been learning]] for years.","Continuity"],
 ["Mock","We [[have been studying]] since Monday.","Time span"],["Mock","They [[have been running]] all morning.","Activity"]],
 tip:"Choose have/has been + V-ing",warning:{wrong:"He have been working.",correct:"He has been working.",why:"Use has + been + V-ing."},
 formulas:[["Affirmative","He","has been","working"],["Negative","They","haven't been","waiting"]],
 table:{headers:["Form","Example"],rows:[["Since","since Monday"],["For","for two months"]]},
 extra:{heading:"Remember",paragraphs:["No copied original STEP exam material"]}
}));
const course=()=>({student:"Mock student",teachingUnits:teaching,
 course:{title:"Present Perfect Continuous",titleAr:"المضارع التام المستمر",subtitle:"A published Lesson 10",totalQuestions:13},
 sections:teaching.map((u,i)=>({index:i,title:u.title,titleAr:u.title,short:"Mock",
 passed:false,locked:i>0})),nextIndex:0,completed:false,
 exam:{unlocked:false,best:0,attempts:0}});
const questions=Array.from({length:2},(_,i)=>({id:"q"+(i+1),text:"Synthetic Present Perfect Continuous item "+(i+1)+" (not from any source PDF)",options:{A:"alpha",B:"bravo",C:"charlie",D:"delta"}}));
const part=()=>({part:{index:0,title:"Mock lesson 10",questions,passRequired:2},
 progress:course()});
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",
   body:'window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"synthetic-student-token"}}})}}}};'}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/**",async r=>{
   const req=r.request(),url=new URL(req.url()),suffix=url.pathname.split("/step-course/lesson/present-perfect-continuous")[1];
   let body,status=200;
   if(suffix==="/course")body=course();
   else if(suffix==="/teaching")body={units:[]};
   else if(suffix==="/videos")body={videos:[]};
   else if(suffix==="/parts/0")body=part();
   else if(suffix==="/parts/0/submit"){
    const answers=JSON.parse(req.postData()).answers;
    const results=questions.map(q=>({id:q.id,selected:answers[q.id],correct:"A",isCorrect:answers[q.id]==="A",
      explanation:"Synthetic mock answer: choose alpha.",wrongReason:"Synthetic wrong choice",
      wrongReasons:{B:"Not bravo",C:"Not charlie",D:"Not delta"}}));
    body={results,correctCount:results.filter(x=>x.isCorrect).length,total:2,passed:false,progress:course()};
   }else{status=404;body={error:"Unknown synthetic mock"}}
   await r.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
  });
  await page.goto(local+"/step-grammar-student/lesson.html?slug=present-perfect-continuous",{waitUntil:"domcontentloaded"});
  await page.locator(".lesson-title").waitFor({timeout:12000});
  assert.equal(await page.locator(".path-button").count(),7,"Seven actual future teaching stages");
  assert.equal(await page.locator(".concept-card").count(),3,"Full explanation cards rendered");
  assert.equal(await page.locator(".example").count(),4,"Instructor teaching examples rendered");
  assert.equal(await page.locator(".agreement-table").count(),1);
  assert.equal(await page.locator(".question").count(),2,"Only synthetic mock source placeholders graded in CI");
  for(let i=0;i<2;i++)await page.locator('.q-answer[data-index="'+i+'"][data-value="'+(i===0?"B":"A")+'"]').click();
  await page.locator("#submit-practice").click();
  await page.locator(".answer-feedback").first().waitFor();
  assert.equal(await page.locator(".answer-feedback.is-wrong").count(),1);
  assert.equal(await page.locator(".feedback-distractors").count(),2);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),"No overflow on "+width+"px");
  assert.deepEqual(errors,[],"Browser JavaScript errors "+errors.join("; "));
  console.log("PASS Present Perfect Continuous Lesson 10 synthetic browser grading "+width+"px");
  await page.close();
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
