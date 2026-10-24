import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sampleRate=12000;
const samples=sampleRate*2;
const pcm=Buffer.alloc(44+samples*2);
pcm.write("RIFF",0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write("WAVEfmt ",8);
pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);
pcm.writeUInt32LE(sampleRate,24);pcm.writeUInt32LE(sampleRate*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write("data",36);
pcm.writeUInt32LE(samples*2,40);
for(let i=0;i<samples;i++)pcm.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*460/sampleRate)*2600),44+i*2);
const server=createServer(async(req,res)=>{
 const raw=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
 const loc=path.resolve(root,"."+raw),p=raw.endsWith("/")?path.join(loc,"index.html"):loc;
 if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{if(!(await stat(p)).isFile())throw Error("not found");
 res.writeHead(200,{"Content-Type":p.endsWith(".html")?"text/html; charset=utf-8":p.endsWith(".css")?"text/css":"text/javascript"});
 res.end(await readFile(p));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:880}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/**",route=>route.fulfill({status:200,contentType:"text/javascript",body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"FAKE"}}})}})};'}));
  await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-listening-samples",async route=>{
   const request=route.request().postDataJSON();
   const items=request.sample==="record-1"?["r1-q1","r1-q2"]:["r2-q1","r2-q2"];
   const keys=request.sample==="record-1"?["D","A"]:["B","A"];
   const results=items.map((id,i)=>({id,correct:keys[i],isCorrect:request.answers[id]===keys[i],explanation:"شرح عربي للاختيار"}));
   await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(request.mode==="exam"?{accepted:true}:{results,transcript:"Teacher: Test script."})});
  });
  await page.goto(origin+"/step-grammar-student/listening-samples.html",{waitUntil:"domcontentloaded"});
  assert.equal(await page.locator("[data-clip]").count(),2);
  assert(await page.locator("#launch").isDisabled(),"Never start without real local audio");
  await page.locator("#audio-source").setInputFiles({name:"real-recording.wav",mimeType:"audio/wav",buffer:pcm});
  assert(await page.locator("#launch").isEnabled());
  await page.locator("#launch").click();
  await page.getByRole("button",{name:"ابدأ التدريب"}).click();
  assert.equal(await page.locator(".listening-question").count(),2);
  await page.locator('input[data-question="r1-q1"][value="D"]').check();
  await page.locator('input[data-question="r1-q2"][value="A"]').check();
  await page.getByRole("button",{name:"سلّم إجابات المجموعة"}).click();
  await page.locator(".listening-script").waitFor();
  assert((await page.locator(".listening-script").innerText()).includes("Test script"));
  await page.locator("#reset").click();
  await page.locator('[data-clip="record-2"]').click();
  await page.locator('[data-mode="exam"]').click();
  await page.locator("#audio-source").setInputFiles({name:"second.wav",mimeType:"audio/wav",buffer:pcm});
  await page.locator("#launch").click();
  assert.equal(await page.locator(".listening-question").count(),0);
  await page.getByRole("button",{name:"ابدأ المحاكاة"}).click();
  assert.equal(await page.locator(".listening-timer strong").innerText(),"30");
  assert.equal(await page.locator(".listening-question").count(),2);
  assert.equal(await page.locator("audio[controls]").count(),0);
  assert.equal(await page.locator(".listening-choice input:not([disabled])").count(),0);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)));
  assert.deepEqual(errors,[]);
  console.log("PASS source Listening browser "+width+"px: local audio selection, two questions, server practice review, 30-second exam start, mobile layout");
  await page.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
