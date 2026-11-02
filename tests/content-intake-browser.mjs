import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import {createServer} from "node:http";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
import path from "node:path";
import {chromium} from "playwright";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const html=await readFile(path.join(root,"step-grammar-admin/content-intake.html"),"utf8");
const migration=await readFile(path.join(root,"supabase/migrations/20261102_step_content_intake_queue.sql"),"utf8");
const nav=await readFile(path.join(root,"step-grammar-admin/admin-nav.js"),"utf8");
assert(nav.includes('content-intake.html'),"Content Intake must be visible in admin nav");
assert(html.includes('id="json-text"')&&html.includes('id="question-form"'));
assert(migration.includes('step_content_internal.handle_intake'));
assert(migration.includes("not v_owner and not v_contributor"));
assert(migration.includes("revoke all on public.step_question_intake from public,anon,authenticated"));
assert(migration.includes("v_item.status<>'approved'"),"Only approved items can be transferred");
assert(migration.includes("status','transferred'")||migration.includes("status='transferred'"));
assert(!migration.includes("status='published'"),"Intake must not publish any student questions");
for(const part of html.split("<script>").slice(1)){
 const content=part.split("</script>")[0];
 if(content.trim().startsWith('"use strict"'))new Script(content);
}
const server=createServer(async(req,res)=>{
 const u=decodeURIComponent(new URL(req.url,"http://local").pathname);
 const p=path.resolve(root,"."+u),file=u.endsWith("/")?path.join(p,"index.html"):p;
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(file)).isFile())throw Error();
  res.writeHead(200,{"Content-Type":file.endsWith(".html")?"text/html":"text/javascript"});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const sdk='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"test-token"}}})},rpc:async(a,p)=>window.__mockRPC(a,p)}}}};';
try{
 for(const role of ["owner","contributor"]){
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:880}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.addInitScript(role=>{
   window.__mockRole=role;window.__intake=[];
   window.__mockRPC=async(name,args)=>{
    if(name!=="step_content_intake")throw Error("Unknown RPC");
    const action=args.p_action,payload=args.p_payload;
    const fail=msg=>({data:null,error:{message:msg}});
    const ok=data=>({data,error:null});
    if(action==="catalog")return ok({role:window.__mockRole,
     courses:[{axis:"grammar",code:"ASGQAGREE",title:"تطابق الفاعل والفعل",sections:5}],
     passages:[{axis:"reading-comprehension",code:"old-birds",title:"Old Birds",sections:8,status:"approved"}],
     clips:[{axis:"listening",code:"record-1",title:"Clip",sections:1}]});
    if(action==="list")return ok({role:window.__mockRole,items:window.__intake});
    if(action==="contributors")return window.__mockRole==="owner"?
      ok({contributors:[]}):fail("Denied");
    if(action==="submit_batch"){
     for(const item of payload.items)window.__intake.unshift({
      id:"11111111-1111-4111-8111-"+String(window.__intake.length+1).padStart(12,"0"),
      axis_code:item.axis,target_code:item.target,part_index:item.part_index,
      question_text:item.question,options:item.options,proposed_correct:item.correct,
      explanation_ar:item.explanation_ar,wrong_reasons:item.wrong_reasons,
      source_reference:item.source_reference,origin_kind:item.origin_kind,
      status:"pending_review",created_at:new Date().toISOString()});
     return ok({saved:payload.items.length,duplicates_skipped:0,status:"pending_review"});
    }
    if(window.__mockRole!=="owner"&&["grant","revoke","approve","reject","transfer"].includes(action))
     return fail("Forbidden");
    if(action==="approve"||action==="reject"){
     const target=window.__intake.find(i=>i.id===payload.id);
     if(!target||String(payload.note).length<8)return fail("Review note too short");
     target.status=action==="approve"?"approved":"rejected";
     target.review_note=payload.note;
     return ok({saved:true,status:target.status});
    }
    if(action==="transfer"){
     const target=window.__intake.find(i=>i.id===payload.id);
     if(!target||target.status!=="approved")return fail("Not approved");
     target.status="transferred";target.transferred_question_id="STEP-NEW-fake";
     return ok({saved:true,status:"transferred",draft_question_id:"STEP-NEW-fake",published:false});
    }
    if(action==="grant")return ok({saved:true,username:payload.username,access:"grant"});
    return fail("Unknown action "+action);
   };
  },role);
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:sdk}));
  await page.goto(base+"/step-grammar-admin/content-intake.html",{waitUntil:"domcontentloaded"});
  await page.locator("#question-form:visible").waitFor();
  assert.equal(await page.locator("#access").isVisible(),role==="owner");
  assert((await page.locator("#global-status").innerText()).includes("تم التحقق"));
  await page.locator("#source").fill("Example test source / page 1");
  await page.locator("#stem").fill("What is the subject in the given example sentence?");
  for(const [i,k] of ["A","B","C","D"].entries())
   await page.locator("#choice-"+k).fill("Choice "+k+" evidence "+i);
  await page.locator("#correct").selectOption("B");
  for(const k of ["A","C","D"])await page.locator("#reason-"+k).fill("الاختيار ده لا يطابق القاعدة الصحيحة المطلوبة");
  await page.locator("#explanation").fill("الاختيار B هو الصحيح لأن الفاعل الحقيقي موجود هنا");
  await page.locator("#save-one").click();
  await page.waitForFunction(()=>document.querySelectorAll("#items .item").length===1);
  assert((await page.locator("#items .item").first().innerText()).includes("تحت المراجعة"));
  assert.equal(await page.locator("#items .item").first().getByRole("button",{name:"اعتماد داخلي"}).count(),role==="owner"?1:0);
  if(role==="owner"){
   const notes=page.locator("#items .item").first().locator("textarea");
   await notes.fill("راجعت المصدر ومفتاح الإجابة والبدائل");
   await page.locator("#items .item").first().getByRole("button",{name:"اعتماد داخلي"}).click();
   await page.waitForFunction(()=>document.querySelector("#items .item")?.textContent?.includes("اعتمد داخليًا"));
   const btn=page.locator("#items .item").first().getByRole("button",{name:"نقل السؤال كمسودة إلى محرر القسم"});
   page.once("dialog",dialog=>dialog.accept());
   await btn.click();
   await page.waitForFunction(()=>document.querySelector("#items .item")?.textContent?.includes("اتنقل للمحرر"));
  }
  await page.locator("#example").click();
  await page.locator("#check-json").click();
  assert((await page.locator("#json-status").innerText()).includes("سؤال"));
  await page.locator("#upload-json").click();
  await page.waitForFunction(()=>document.querySelectorAll("#items .item").length===2);
  assert.deepEqual(errors,[],"No browser JS errors "+role+"/"+width+": "+errors.join("; "));
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),"No horizontal overflow "+width);
  await page.close();
  console.log("PASS STEP Content Entry "+role+" "+width+"px: manual, ChatGPT JSON, review and draft transfer");
 }
 }
}finally{
 await browser.close();await new Promise(ok=>server.close(ok));
}
