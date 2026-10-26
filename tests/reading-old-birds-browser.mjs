import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {chromium} from "playwright";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
 const file=path.resolve(root,"."+name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{if(!(await stat(file)).isFile())throw Error("missing");
  res.writeHead(200,{"Content-Type":file.endsWith(".html")?"text/html; charset=utf-8":"text/javascript"});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
async function mockApi(page){
 await page.route("https://cdn.jsdelivr.net/**",route=>route.fulfill({status:200,contentType:"text/javascript",body:""}));
 await page.addInitScript(()=>{
  window.__calls=[];
  const questions=[1,3,4,5].map((number,i)=>({id:"mock-q-"+i,number,
    text:"What does the writer tell us in paragraph "+number+"?",
    options:{A:"One example",B:"Another example",C:"A giant bird",D:"A small bird"}}));
  const story={id:"mock-story",slug:"old-birds-srclh5q",title_en:"Old Birds",title_ar:"الطيور العملاقة القديمة",
   paragraphs:Array.from({length:8},(_,i)=>(i+1)+"- Evidence about extinct birds and paleontologists."),
   status:"approved",source_label:"Old Birds – SRCLH5Q.docx",exam_seconds:600,
   items:questions.map(q=>({id:q.id,position:q.number,question_text:q.text,options:q.options,
     correct_choice:"C",explanation_ar:"اختيار C لأن النص يذكر الأدلة",paragraph_number:1,
     review_state:"approved",editorial_notes:""})).concat([{id:"pending-q",position:2,
       question_text:"Original source question under review",options:{A:"A",B:"B",C:"C",D:"D"},
       correct_choice:"D",explanation_ar:"محتاج مراجعة",paragraph_number:5,review_state:"needs_review",editorial_notes:""}])};
  window.supabase={createClient:()=>({
   auth:{getSession:async()=>({data:{session:{access_token:"mock"}}})},
   rpc:async(name,args)=>{
     window.__calls.push({name,action:args.p_action,payload:args.p_payload});
     let value;
     if(args.p_action==="catalog")value={passages:[{slug:story.slug,title:story.title_en,titleAr:story.title_ar,questionCount:4,seconds:600}]};
     if(args.p_action==="progress")value={completed:0,correct:0,total:0,byMode:{
       practice:{attempts:0,correct:0,total:0},exam:{attempts:0,correct:0,total:0}},history:[]};
     if(args.p_action==="begin")value={attemptId:"test-"+args.p_payload.mode,title:story.title_en,
       titleAr:story.title_ar,paragraphs:story.paragraphs,questions,mode:args.p_payload.mode,
       dueAt:args.p_payload.mode==="exam"?new Date(Date.now()+600000).toISOString():null,examSeconds:600};
     if(args.p_action==="submit")value={saved:true,correct:4,total:4,mode:"practice",
       review:questions.map(q=>({id:q.id,number:q.number,selected:"C",correct:"C",
         isCorrect:true,explanation:"الإجابة مذكورة في النص",paragraph:1}))};
     if(args.p_action==="admin_catalog")value={passages:[story]};
     if(args.p_action==="admin_grades")value={students:[],completed:0};
     if(args.p_action==="admin_review")value={saved:true,status:"needs_review"};
     return value?{data:value,error:null}:{data:null,error:{message:"unknown action"}};
   }
  })};
 });
}
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[];
  page.on("pageerror",err=>errors.push(String(err)));
  await mockApi(page);
  await page.goto(origin+"/step-grammar-student/reading-v2.html",{waitUntil:"domcontentloaded"});
  await page.getByText("القطعة جاهزة.").waitFor();
  await page.getByRole("button",{name:"ابدأ الحل"}).click();
  await page.locator("#study:not([hidden])").waitFor();
  assert.equal(await page.locator("#passage p").count(),8);
  assert.equal(await page.locator("#questions fieldset").count(),4);
  assert.equal(await page.locator(".review").count(),0,"Answer keys must remain hidden before submitting");
  for(let i=0;i<4;i++)await page.locator('input[name="answer-mock-q-'+i+'"][value="C"]').check();
  await page.getByRole("button",{name:"تسليم الإجابات"}).click();
  await page.locator("#result:not([hidden])").waitFor();
  assert((await page.locator("#result").innerText()).includes("4 من 4"));
  assert.equal(await page.locator(".review").count(),4);
  assert((await page.evaluate(()=>window.__calls)).some(x=>x.action==="submit"&&Object.keys(x.payload.answers).length===4));
  await page.getByRole("button",{name:"اختيار قطعة أخرى"}).click();
  await page.locator('[data-mode="exam"]').click();
  await page.getByRole("button",{name:"ابدأ الحل"}).click();
  await page.locator("#timer:not([hidden])").waitFor();
  assert((await page.locator("#timer").innerText()).includes(":"));
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+4)),"No horizontal overflow");
  assert.deepEqual(errors,[]);
  await page.close();
  const admin=await browser.newPage({viewport:{width,height:850}}),adminErrors=[];
  admin.on("pageerror",err=>adminErrors.push(String(err)));
  await mockApi(admin);
  await admin.goto(origin+"/step-grammar-admin/reading-v2.html",{waitUntil:"domcontentloaded"});
  await admin.getByText("تم تحميل 1 قطعة بنجاح.").waitFor();
  assert.equal(await admin.locator("#bank fieldset").count(),5);
  assert.equal(await admin.getByText("بانتظار مراجعة السؤال قبل اعتماده").count(),1);
  assert((await admin.locator("#grade-status").innerText()).includes("مافيش محاولات"));
  await admin.getByRole("button",{name:"إعادة تحميل الأسئلة والدرجات"}).click();
  await admin.getByText("تم تحميل 1 قطعة بنجاح.").waitFor();
  assert.deepEqual(adminErrors,[]);
  await admin.close();
  console.log("PASS reconstructed STEP Reading student + admin browser flow "+width+"px");
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
