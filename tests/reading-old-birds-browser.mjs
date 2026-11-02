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
  const stories=[story];
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
     if(args.p_action==="admin_catalog")value={passages:stories};
     if(name==="step_reading_admin"){
       const payload=args.p_payload;
       const target=stories.find(x=>x.id===payload.id);
       if(args.p_action==="create_passage"){
         const passage={id:"created-draft",slug:"reading-created",title_en:payload.title_en,
           title_ar:payload.title_ar,source_label:payload.source_label,paragraphs:payload.paragraphs,
           status:"draft",items:[],exam_seconds:600};
         stories.push(passage);
         value={saved:true,id:passage.id,status:"draft"};
       }else if(args.p_action==="update_passage"){
         Object.assign(target,{title_en:payload.title_en,title_ar:payload.title_ar,
          source_label:payload.source_label,paragraphs:payload.paragraphs});
         value={saved:true,status:"draft"};
       }else if(args.p_action==="add_question"){
         target.items.push({id:"created-q1",position:target.items.length+1,
          question_text:payload.question_text,options:payload.options,
          correct_choice:payload.correct_choice,explanation_ar:payload.explanation_ar,
          paragraph_number:payload.paragraph_number,review_state:"needs_review",
          editorial_notes:payload.editorial_notes});
         value={saved:true,status:"needs_review"};
       }else if(args.p_action==="publish_passage"){
         if(target.items.some(q=>q.review_state!=="approved"))return {data:null,error:{message:"Pending questions"}};
         target.status="approved";value={saved:true,status:"approved"};
       }
     }
     if(args.p_action==="admin_grades")value={students:[],completed:0};
     if(args.p_action==="admin_review"){
       for(const p of stories){
         const item=p.items.find(q=>q.id===args.p_payload.id);
         if(item){
           Object.assign(item,{...args.p_payload,review_state:args.p_payload.approve?"approved":"needs_review"});
         }
       }
       value={saved:true,status:args.p_payload.approve?"approved":"needs_review"};
     }
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
  await page.getByText("اختار القطعة اللي عايز تقرأها.").waitFor();
  assert.equal(await page.locator(".passage-tile").count(),1);
  assert.equal(await page.locator('[data-mode]').count(),0,"Ordinary Reading must not show listening-style modes");
  await page.getByRole("button",{name:"اقرأ القطعة وحل الأسئلة"}).click();
  await page.locator("#study:not([hidden])").waitFor();
  assert.equal(await page.locator("#passage p").count(),8);
  assert.equal(await page.locator("#questions fieldset").count(),4);
  assert(await page.evaluate(()=>document.querySelector(".reading").compareDocumentPosition(document.querySelector(".questions-sheet")) & Node.DOCUMENT_POSITION_FOLLOWING),"Entire passage is displayed before its questions");
  assert.equal(await page.locator("#timer").count(),0,"No timer on ordinary Reading");
  assert.equal(await page.locator(".review").count(),0,"Answer keys must remain hidden before submitting");
  for(let i=0;i<4;i++)await page.locator('input[name="answer-mock-q-'+i+'"][value="C"]').check();
  await page.getByRole("button",{name:"صحّح إجاباتي واحفظ الدرجة"}).click();
  try{await page.locator("#result:not([hidden])").waitFor({timeout:8000});}
  catch(err){
   const detail=await page.evaluate(()=>({
    answerError:document.getElementById("answer-error")?.textContent,
    answerErrorHidden:document.getElementById("answer-error")?.hidden,
    resultHidden:document.getElementById("result")?.hidden,
    submitHidden:document.getElementById("submit")?.hidden,
    answered:Array.from(document.querySelectorAll("#questions input:checked")).map(n=>n.name),
    calls:window.__calls,
    scriptsLoaded:typeof window.supabase
   }));
   throw new Error("Reading submit debug: "+JSON.stringify(detail)+"; "+err.message);
  }
  assert((await page.locator("#result").innerText()).includes("4 من 4"));
  assert.equal(await page.locator(".review").count(),4);
  assert((await page.evaluate(()=>window.__calls)).some(x=>x.action==="submit"&&Object.keys(x.payload.answers).length===4));
  await page.getByRole("button",{name:"كل قطع القراءة"}).click();
  await page.getByRole("button",{name:"اقرأ القطعة وحل الأسئلة"}).click();
  await page.locator("#study:not([hidden])").waitFor();
  assert.equal(await page.locator("#passage p").count(),8,"Passage can be reopened from its card");
  assert.equal(await page.locator("#questions fieldset").count(),4);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+4)),"No horizontal overflow");
  assert.deepEqual(errors,[]);
  await page.close();
  const admin=await browser.newPage({viewport:{width,height:850}}),adminErrors=[];
  admin.on("pageerror",err=>adminErrors.push(String(err)));
  await mockApi(admin);
  await admin.goto(origin+"/step-grammar-admin/reading-v2.html",{waitUntil:"domcontentloaded"});
  await admin.getByText("عدد القطع المحفوظة: 1.").waitFor();
  assert.equal(await admin.locator("#bank fieldset").count(),5);
  assert.equal(await admin.locator("#bank .passage-unit").count(),1);
  assert.equal(await admin.locator("#bank .passage-sheet p").count(),8,"Owner sees complete passage above grouped questions");
  assert.equal(await admin.locator("#bank .question-list fieldset").count(),5);
  assert.equal(await admin.getByText("بانتظار مراجعة السؤال قبل اعتماده").count(),1);
  assert((await admin.locator("#grade-status").innerText()).includes("مافيش محاولات"));
  await admin.getByRole("button",{name:"إعادة تحميل الأسئلة والدرجات"}).click();
  await admin.getByText("عدد القطع المحفوظة: 1.").waitFor();
  assert.equal(await admin.locator("#create-passage").count(),1,"Owner can create Reading passage drafts");
  await admin.locator("#new-title-en").fill("New Passage From Word");
  await admin.locator("#new-title-ar").fill("قطعة قراءة جديدة");
  await admin.locator("#new-source").fill("Uploaded sample file.docx");
  await admin.locator("#new-text").fill("First paragraph contains complete English text.\n\nSecond paragraph adds more details.");
  await admin.locator("#create-button").click();
  await admin.waitForFunction(()=>document.querySelectorAll("#bank .passage-unit").length===2);
  const draft=admin.locator("#bank .passage-unit").nth(1);
  assert((await draft.innerText()).includes("مسودة"));
  const editors=draft.locator("details.editor");
  assert.equal(await editors.count(),2,"Draft passage and question editors available");
  await editors.first().locator("summary").click();
  await editors.first().locator('input').first().fill("Revised Word Passage");
  await editors.first().getByRole("button",{name:"حفظ تعديلات القطعة"}).click();
  await admin.waitForFunction(()=>document.querySelector("#bank")?.textContent?.includes("Revised Word Passage"));
  const updated=admin.locator("#bank .passage-unit").nth(1);
  await updated.locator("details.editor").last().locator("summary").click();
  const newQuestion=updated.locator("details.editor").last();
  const textboxes=newQuestion.locator("textarea");
  assert.equal(await textboxes.count(),7);
  await textboxes.nth(0).fill("What does the first paragraph describe?");
  await textboxes.nth(1).fill("A first paragraph");
  await textboxes.nth(2).fill("A second paragraph");
  await textboxes.nth(3).fill("No paragraph at all");
  await textboxes.nth(4).fill("An unrelated detail");
  await textboxes.nth(5).fill("الإجابة الأولى مبنية على الفقرة الأولى من القطعة");
  await textboxes.nth(6).fill("Reviewed by owner after source comparison");
  await newQuestion.getByRole("button",{name:"حفظ السؤال للمراجعة"}).click();
  await admin.waitForFunction(()=>document.querySelectorAll("#bank .passage-unit")[1]?.querySelectorAll("fieldset").length===1);
  const draftWithQuestion=admin.locator("#bank .passage-unit").nth(1);
  assert.equal(await draftWithQuestion.getByRole("button",{name:"اعتماد ونشر القطعة"}).isDisabled(),true,
    "Publication blocked while MCQ remains under review");
  await draftWithQuestion.getByRole("button",{name:"اعتماد السؤال ونشره"}).click();
  await admin.waitForFunction(()=>document.querySelectorAll("#bank .passage-unit")[1]?.querySelector(".good")!==null);
  const approvedDraft=admin.locator("#bank .passage-unit").nth(1);
  await approvedDraft.getByRole("button",{name:"اعتماد ونشر القطعة"}).click();
  await admin.waitForFunction(()=>document.querySelectorAll("#bank .passage-unit")[1]?.textContent?.includes("الحالة: منشورة"));
  const adminCalls=await admin.evaluate(()=>window.__calls);
  assert(adminCalls.some(v=>v.name==="step_reading_admin"&&v.action==="create_passage"));
  assert(adminCalls.some(v=>v.name==="step_reading_admin"&&v.action==="update_passage"));
  assert(adminCalls.some(v=>v.name==="step_reading_admin"&&v.action==="add_question"));
  assert(adminCalls.some(v=>v.name==="step_reading_admin"&&v.action==="publish_passage"));
  assert.deepEqual(adminErrors,[]);
  await admin.close();
  console.log("PASS passage-first STEP Reading student + owner UX "+width+"px");
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
