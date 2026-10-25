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
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{if(!(await stat(file)).isFile())throw Error("missing");
 res.writeHead(200,{"Content-Type":file.endsWith(".html")?"text/html; charset=utf-8":file.endsWith(".css")?"text/css":"text/javascript"});
 res.end(await readFile(file));}catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const address="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:860}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  const calls=[];
  await page.addInitScript(()=>{
    Object.defineProperty(HTMLMediaElement.prototype,"readyState",{configurable:true,get:()=>4});
    HTMLMediaElement.prototype.load=function(){};
    HTMLMediaElement.prototype.play=function(){return Promise.resolve()};
    HTMLMediaElement.prototype.pause=function(){};
  });
  await page.route("https://cdn.jsdelivr.net/**",route=>route.fulfill({
   status:200,contentType:"text/javascript",
   body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"TEST"}}})}})};'
  }));
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-listening-live**",async route=>{
   const req=route.request(),u=new URL(req.url()),name=u.pathname.split("/").pop(),body=req.method()==="POST"?req.postDataJSON():null;
   if(req.method()==="OPTIONS"){await route.fulfill({status:200,headers:{"Access-Control-Allow-Origin":address,"Access-Control-Allow-Headers":"apikey,authorization,content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}});return}
   calls.push({name,body});
   let result;
   if(name==="catalog")result={groups:[{sample:"record-1",title_ar:"موعد الاختبار",title_en:"Final Exam",questionCount:2},{sample:"record-2",title_ar:"العادات الغذائية",title_en:"Eating Habits",questionCount:2}]};
   else if(name==="progress")result={completed:1,correct:1,total:2,percentage:50,byMode:{practice:{attempts:0,correct:0,total:0},exam:{attempts:1,correct:1,total:2}},history:[]};
   else if(name==="begin")result={attemptId:"test-"+body.mode,audioUrl:address+"/step-grammar-student/listening-demo.html",secondsPerQuestion:15,questions:[
    {id:"q1",text:"What did the speaker say?",options:{A:"1",B:"2",C:"3",D:"4"}},
    {id:"q2",text:"How many units?",options:{A:"2",B:"5",C:"6",D:"26"}}
   ]};
   else if(name==="prepare")result={prepared:true,readingSeconds:30};
   else if(name==="play")result={accepted:true};
   else if(name==="submit")result={accepted:true,correct:2,total:2,transcript:"Teacher: A test tomorrow.",results:[
    {id:"q1",correct:"A",isCorrect:true,explanation:"معلومة من التسجيل"},
    {id:"q2",correct:"A",isCorrect:true,explanation:"آخر وحدتين"}
   ]};
   else result={error:"mock unknown route"};
   await route.fulfill({status:name==="unknown"?404:200,contentType:"application/json",headers:{"Access-Control-Allow-Origin":address,"Access-Control-Allow-Headers":"apikey,authorization,content-type"},body:JSON.stringify(result)});
  });
  await page.goto(address+"/step-grammar-student/listening-live.html",{waitUntil:"domcontentloaded"});
  await page.locator("#setup:not([hidden])").waitFor();
  assert.equal(await page.locator("#clips button").count(),2);
  await page.waitForFunction(()=>document.querySelector("#progress-message")?.textContent?.includes("مجموع درجات الاستماع"));
  assert.equal(await page.locator('input[type="file"]').count(),0);
  await page.locator("#launch").click();
  await page.getByRole("button",{name:"ابدأ التدريب"}).click();
  assert.equal(await page.locator(".listening-question").count(),2);
  await page.locator('input[data-question="q1"][value="A"]').check();
  await page.locator('input[data-question="q2"][value="A"]').check();
  await page.getByRole("button",{name:"سلّم إجابات سؤال الاستماع"}).click();
  await page.locator(".listening-script").waitFor();
  assert((await page.locator("#score").innerText()).includes("2 من 2"));
  assert(calls.some(v=>v.name==="submit"));
  assert(calls.some(v=>v.name==="progress"),"Scored Listening attempts must load in student account");
  await page.locator("#back").click();
  await page.locator('[data-mode="exam"]').click();
  await page.locator("#launch").click();
  assert.equal(await page.locator(".listening-question").count(),0);
  await page.getByRole("button",{name:"ابدأ المحاكاة"}).click();
  assert.equal(await page.locator(".listening-timer strong").innerText(),"30");
  assert.equal(await page.locator(".listening-question").count(),2);
  assert.equal(await page.locator(".listening-choice input:not([disabled])").count(),0);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)));
  assert.deepEqual(errors,[]);
  console.log("PASS Listening live "+width+"px: direct audio URL, authenticated server grading, two questions, 30s simulation");
  await page.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done))}
