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
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const questions=Array.from({length:4},(_,i)=>({
 id:"item-"+(i+1),number:i+1,text:"What does paragraph "+(i+1)+" tell us?",
 options:{A:"It says A",B:"It says B",C:"It says C",D:"It says D"}
}));
const browser=await chromium.launch({headless:true});
try{
for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:850}});
 const errors=[],calls=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.route("https://cdn.jsdelivr.net/**",route=>route.fulfill({status:200,contentType:"text/javascript",
   body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"TEST"}}})}})};'
 }));
 await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-reading-live**",async route=>{
  const r=route.request(),url=new URL(r.url()),name=url.pathname.split("/").pop();
  if(r.method()==="OPTIONS"){await route.fulfill({status:200,
   headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"apikey,authorization,content-type"}});return;}
  const body=r.method()==="POST"?r.postDataJSON():null;
  calls.push({name,body});
  let result;
  if(name==="catalog")result={passages:[{slug:"old-birds-srclh5q",title_en:"Old Birds",title_ar:"الطيور العملاقة القديمة",questionCount:4,examSeconds:600}]};
  else if(name==="progress")result={completed:0,correct:0,total:0,
    byMode:{practice:{attempts:0,correct:0,total:0},exam:{attempts:0,correct:0,total:0}},history:[]};
  else if(name==="begin")result={attemptId:body.mode+"-test",mode:body.mode,slug:body.slug,
    title:"Old Birds",titleAr:"الطيور العملاقة القديمة",
    paragraphs:Array.from({length:8},(_,i)=>(i+1)+"- Some English evidence from paragraph "+(i+1)),
    questions,examSeconds:600,dueAt:body.mode==="exam"?new Date(Date.now()+600000).toISOString():null};
  else if(name==="submit")result={saved:true,correct:body.answers["item-1"]==="C"?3:2,total:4,mode:"practice",
    review:questions.map((q,i)=>({id:q.id,number:q.number,correct:"C",explanation:"الشرح بالعربي من الفقرة",
      paragraph:i+1,selected:body.answers[q.id],isCorrect:body.answers[q.id]==="C"}))};
  else result={error:"unknown"};
  await route.fulfill({status:200,contentType:"application/json",
    headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"apikey,authorization,content-type"},
    body:JSON.stringify(result)});
 });
 await page.goto(origin+"/step-grammar-student/reading-live.html",{waitUntil:"domcontentloaded"});
 await page.getByText("القطعة جاهزة للقراءة والحل.").waitFor();
 await page.getByRole("button",{name:"ابدأ حل القراءة"}).click();
 await page.locator("#session:not([hidden])").waitFor();
 assert.equal(await page.locator("#paragraphs p").count(),8);
 assert.equal(await page.locator("#questions fieldset").count(),4);
 assert.equal(await page.locator("#questions .review").count(),0,"Review hidden before submission");
 for(let i=0;i<4;i++)await page.locator('input[name="q-item-'+(i+1)+'"][value="C"]').check();
 await page.getByRole("button",{name:"سلّم الإجابات واحسب الدرجة"}).click();
 await page.locator("#result:not([hidden])").waitFor();
 assert.equal(await page.locator(".review").count(),4);
 assert((await page.locator("#result").innerText()).includes("3 من 4"));
 assert(calls.some(c=>c.name==="submit"&&Object.keys(c.body.answers).length===4));
 await page.getByRole("button",{name:"رجوع للقطع"}).click();
 await page.locator('[data-mode="exam"]').click();
 await page.getByRole("button",{name:"ابدأ حل القراءة"}).click();
 await page.locator("#clock:not([hidden])").waitFor();
 assert((await page.locator("#clock").innerText()).includes("09:")||(await page.locator("#clock").innerText()).includes("10:"));
 assert.equal(await page.locator("#questions .review").count(),0);
 assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+4)),"No mobile overflow");
 assert.deepEqual(errors,[]);
 console.log("PASS graded Old Birds Reading UI "+width+"px: full passage, 4 approved questions, server review, exam timer");
 await page.close();
}
}finally{await browser.close();await new Promise(done=>server.close(done));}
