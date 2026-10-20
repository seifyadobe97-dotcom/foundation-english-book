// Chromium smoke tests for the source-based STEP explanation and editor.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const guide=JSON.parse(await readFile(path.join(root,"curriculum/guides/present-simple.source.json"),"utf8"));
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const dest=path.resolve(root,"."+pathname);
 if(!dest.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(dest)).isFile())throw Error("missing");
  res.writeHead(200,{"Content-Type":dest.endsWith(".html")?"text/html":"text/plain"});
  res.end(await readFile(dest));
 }catch{res.writeHead(404);res.end("Not Found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const authMock='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"test-session"}}})}}}};';
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const ctx=await browser.newContext({viewport:{width:1280,height:850}});
 async function setup(page){
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",route=>route.fulfill({contentType:"text/javascript",body:authMock}));
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  await page.route("https://fonts.gstatic.com/**",route=>route.abort());
 }
 for(const view of [{width:1280,height:850},{width:390,height:844}]){
  const context=await browser.newContext({viewport:view});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await setup(page);
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/guide",
    route=>route.fulfill({contentType:"application/json",body:JSON.stringify({guide})}));
  await page.goto(base+"/step-grammar-student/guide.html",{waitUntil:"domcontentloaded"});
  await page.locator(".unitbtn").first().waitFor({timeout:12000});
  assert.equal(await page.locator(".unitbtn").count(),5);
  await page.locator(".unitbtn").nth(1).click();
  assert.match(await page.locator(".chapter-top h2").innerText(),/التكوين/);
  assert.equal(await page.locator(".example").count(),3);
  await page.locator(".unitbtn").nth(4).click();
  assert.equal(await page.locator(".word").count(),5);
  assert.deepEqual(errors,[]);
  await context.close();
 }
 let draft=null,posted=null;
 const page=await ctx.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await setup(page);
 await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-admin/guides/**",route=>{
  const req=route.request();
  if(req.method()==="GET")return route.fulfill({contentType:"application/json",body:JSON.stringify({
   indicator:{slug:"present-simple",title_ar:"المضارع البسيط",title_en:"Present Simple",status:"published"},
   guide:{published:guide,draft}
  })});
  const data=JSON.parse(req.postData()||"{}");
  if(req.url().endsWith("/save")){draft=data.guide;posted=data;}
  return route.fulfill({contentType:"application/json",body:JSON.stringify({ok:true,status:"draft",sections:5})});
 });
 await page.goto(base+"/step-grammar-admin/guide.html?indicator=present-simple",{waitUntil:"domcontentloaded"});
 await page.locator(".module-edit").first().waitFor({timeout:12000});
 assert.equal(await page.locator(".module-edit").count(),5);
 await page.locator(".module-edit").first().locator(".module-intro").fill("شرح تم تغييره في مسودة اختبار المتصفح.");
 await page.locator("#save").click();
 await page.waitForFunction(()=>document.querySelector("#publish")!==null);
 assert.equal(posted?.indicator_slug,"present-simple");
 assert.equal(draft?.modules?.[0].intro_ar,"شرح تم تغييره في مسودة اختبار المتصفح.");
 assert.deepEqual(errors,[]);
 await ctx.close();
 console.log("PASS STEP guide: desktop and mobile pages, saved-only admin draft");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
