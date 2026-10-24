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
const teaching=Array.from({length:3},(_,i)=>({
 title:"First Conditional — visual regression "+(i+1),
 detail:"افهم [[If + present simple]] وبعدها [[will + V1]] في النتيجة.",
 cards:[["Condition","[[If + present]]","شرط واقعي","1"],["Result","[[will + V1]]","النتيجة مستقبلية","2"],["Other","[[can / provided]]","طلب أو سماح","3"]],
 examples:[["مثال تعليمي","If she [[studies]], she will pass.","شرط حقيقي بنتيجة محتملة."],["مثال تعليمي","She will call if she gets home.","النتيجة ممكن تيجي في الأول."],["مثال تعليمي","If it rains, we may cancel.","may بدل will."],["مثال تعليمي","If you see him, tell him.","أسلوب الطلب."]],
 tip:"راجع زمن الشرط والنتيجة",warning:{wrong:"If she will call, I will answer.",correct:"If she calls, I will answer.",why:"بعد If نستخدم المضارع البسيط هنا."},
 formulas:[["If + present simple","طبقها بحسب معنى الجملة"],["Standard","If + present","will + V1","Result"]],
 table:{headers:["البناء","If clause","Main clause"],rows:[["Standard","If + present","will + V1"],["Negative","If + don't/doesn't V1","will + V1"]]},
 extra:{heading:"تدقيق البنك",paragraphs:["الأسئلة الأصلية من البنك الأصلي ASGQFIRSTCORE - لا تظهر للطلاب."]},
 keywords:[["if","لو"],["tomorrow","غدًا"]]
}));
const course=()=>({student:"Mock student",teachingUnits:teaching,
 course:{title:"First Conditional",titleAr:"الشرط الأول",subtitle:"A published Lesson 34",totalQuestions:20},
 sections:teaching.map((u,i)=>({index:i,title:u.title,titleAr:u.title,short:"Mock",
 passed:false,locked:i>0})),nextIndex:0,completed:false,
 exam:{unlocked:false,best:0,attempts:0}});
const questions=Array.from({length:2},(_,i)=>({id:"q"+(i+1),text:"Synthetic First Conditional item "+(i+1)+" (not from any source PDF)",options:{A:"alpha",B:"bravo",C:"charlie",D:"delta"}}));
const part=()=>({part:{index:0,title:"Mock lesson 34",questions,passRequired:2},
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
   const req=r.request(),url=new URL(req.url()),suffix=url.pathname.split("/step-course/lesson/first-conditional")[1];
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
  await page.goto(local+"/step-grammar-student/lesson.html?slug=first-conditional",{waitUntil:"domcontentloaded"});
  await page.locator(".lesson-title").waitFor({timeout:12000});
  assert.equal(await page.locator(".path-button").count(),3,"Three First Conditional teaching stages");
  assert.equal(await page.locator(".concept-card").count(),3,"Full explanation cards rendered");
  assert.equal(await page.locator(".example").count(),4,"Instructor teaching examples rendered");
  assert.equal(await page.locator(".agreement-table").count(),1);
  assert.equal(await page.locator(".beginner-rule").count(),1,"First Conditional rule displayed with a meaningful Arabic explanation");
  assert.equal(await page.locator(".beginner-rule-parts .beginner-rule-part").count(),2);
  assert.equal(await page.locator(".beginner-help").count(),1,"Beginner explanation must appear in every lesson");
  assert((await page.locator(".beginner-meaning").innerText()).includes("الشرط الأول"));
  assert((await page.locator(".beginner-structure").innerText()).includes("مضارع بسيط"));
  assert((await page.locator(".beginner-glossary").textContent()).includes("المضارع البسيط"));
  assert((await page.locator(".beginner-english").innerText()).includes("If you study"));
  assert((await page.locator(".beginner-arabic").innerText()).includes("لو ذاكرت"));
  assert.equal(await page.locator(".flow-rule").count(),0,"Use meaningful explanatory parts, not a bare unexplained rule");
  assert.equal(await page.locator(".flow-pieces").count(),1,"Four-field pattern renders as a three-part flow");
  assert.equal(await page.locator(".flow-pieces .flow-arrow").count(),2);
  assert.equal(await page.locator(".flow-pieces>span:empty").count(),0,"Never create empty formula boxes");
  assert.equal(await page.locator(".flow-subject .flow-piece-caption").innerText(),"الجزء الأول");
  assert.equal(await page.locator(".concept-card .concept-heading").first().innerText(),"الشرط\nCondition");
  assert((await page.locator(".agreement-table th").nth(1).textContent()).includes("جملة الشرط"),"Arabic meaning for If clause");
  assert((await page.locator(".agreement-table th").nth(2).textContent()).includes("جملة النتيجة"),"Arabic meaning for Main clause");
  assert((await page.locator(".agreement-table tbody tr").first().innerText()).includes("التركيب الأساسي"),"Standard table row explained in Arabic");
  assert.equal(await page.locator(".agreement-table").getAttribute("dir"),"ltr");
  assert.equal(await page.locator(".flow-pieces").getAttribute("dir"),"ltr");
  assert.equal(await page.locator(".flow-rule").getAttribute("dir"),"ltr");
  assert.equal(await page.locator(".optional").count(),0,"Teacher-only question audits must not be shown");

  assert.equal(await page.locator(".question").count(),2,"Only synthetic mock source placeholders graded in CI");
  for(let i=0;i<2;i++)await page.locator('.q-answer[data-index="'+i+'"][data-value="'+(i===0?"B":"A")+'"]').click();
  await page.locator("#submit-practice").click();
  await page.locator(".answer-feedback").first().waitFor();
  assert.equal(await page.locator(".answer-feedback.is-wrong").count(),1);
  assert.equal(await page.locator(".feedback-distractors").count(),2);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),"No overflow on "+width+"px");
  assert.deepEqual(errors,[],"Browser JavaScript errors "+errors.join("; "));
  console.log("PASS Teaching visual formats Arabic labels and LTR source-independent browser "+width+"px");
  await page.close();
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
