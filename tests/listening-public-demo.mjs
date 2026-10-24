import assert from "node:assert/strict";
import {readFile,stat,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const root=path.join(project,".step-public-listening-lab");
execFileSync(process.execPath,[path.join(project,"scripts/build-step-public-site.mjs"),root]);
const server=createServer(async(req,res)=>{
 const raw=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
 const p=path.resolve(root,"."+raw),filename=raw.endsWith("/")?path.join(p,"index.html"):p;
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(filename)).isFile())throw Error("missing file");
  const type=filename.endsWith(".html")?"text/html; charset=utf-8":
    filename.endsWith(".css")?"text/css":filename.endsWith(".svg")?"image/svg+xml":"text/javascript";
  res.writeHead(200,{"Content-Type":type});res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:890}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.clock.install();
  await page.addInitScript(()=>{
   const synth={plays:0,last:null,getVoices:()=>[],cancel(){},pause(){},
    resume(){},speak(utterance){
     this.plays++;this.last=utterance;
     setTimeout(()=>utterance.onstart?.(),2);
    }};
   Object.defineProperty(window,"speechSynthesis",{configurable:true,value:synth});
  });
  await page.goto(base+"/step-grammar-student/listening-demo.html",{waitUntil:"domcontentloaded"});
  assert((await page.locator(".demo-flag").first().innerText()).includes("غير محسوبة"),
   "Pilot audio must be clearly labeled as ungraded synthetic voice");
  await page.getByRole("button",{name:"اختبر السماعات"}).click();
  await page.clock.runFor(5);
  assert((await page.locator("#speaker-status").innerText()).includes("السماعات جاهزة"),
   "Built-in voice test must provide feedback");
  for(const n of [1,2,3]){
   await page.locator("#question-count").selectOption(String(n));
   await page.getByRole("button",{name:"محاكاة الاختبار"}).click();
   await page.getByRole("button",{name:"افتح تجربة المحاكاة"}).click();
   assert.equal(await page.locator(".listening-question").count(),0,
     "Questions should remain hidden before exam Start to prevent unlimited preview");
   await page.getByRole("button",{name:"ابدأ المحاكاة"}).click();
   assert.equal(await page.locator(".listening-question").count(),n);
   assert.equal(await page.locator(".listening-timer strong").innerText(),String(15*n));
   assert.equal(await page.locator(".listening-choice input:not([disabled])").count(),0,
     "Reading period is exclusively for question preview");
   assert.equal(await page.locator("audio[controls]").count(),0,
     "Voice simulation cannot show native replay controls");
   const playsBefore=await page.evaluate(()=>window.speechSynthesis.plays);
   // Browser assertions take measurable time after Start. Measure against the
   // actual monotonic session deadline, not N*15s since the assertion began.
   const remaining=await page.evaluate(()=>window.stepListeningDemoSession.readingEndsAt-Date.now());
   assert(remaining>500,"The reading window must still be active before fast forward");
   await page.clock.fastForward(remaining-250);
   assert.equal(await page.evaluate(()=>window.speechSynthesis.plays),playsBefore,
     "Synthetic voice must not start before the session's actual reading deadline");
   await page.clock.fastForward(260);
   await page.clock.runFor(10);
   assert.equal(await page.evaluate(()=>window.speechSynthesis.plays),playsBefore+1);
   assert.equal(await page.locator(".listening-choice input:not([disabled])").count(),4*n);
   assert.equal(await page.locator('[data-action="play"]').count(),0);
   await page.evaluate(()=>window.speechSynthesis.last.onend?.());
   for(let i=0;i<n;i++){
    await page.locator('.listening-question').nth(i).locator('input[value="A"]').check();
   }
   await page.getByRole("button",{name:"سلّم إجابات المجموعة"}).click();
   assert((await page.locator(".listening-done").innerText()).includes("مش محفوظة"),
     "Demo must never claim persistence or real scoring");
   assert.equal(await page.locator(".listening-script").count(),0);
   assert.equal(await page.locator('[data-action="play"]').count(),0);
   await page.getByRole("button",{name:"غيّر الوضع أو عدد الأسئلة"}).click();
  }
  await page.locator("#question-count").selectOption("3");
  await page.getByRole("button",{name:"التدريب الحر"}).click();
  await page.getByRole("button",{name:"افتح تجربة التدريب"}).click();
  await page.getByRole("button",{name:"ابدأ التدريب"}).click();
  assert.equal(await page.locator(".listening-script").count(),0);
  for(let i=0;i<3;i++){
   const before=await page.evaluate(()=>window.speechSynthesis.plays);
   await page.getByRole("button",{name:/اسمع من الأول|شغّل التسجيل/}).click();
   await page.clock.runFor(10);
   assert.equal(await page.evaluate(()=>window.speechSynthesis.plays),before+1);
  }
  assert((await page.locator(".listening-practice-tools").innerText()).includes("3 مرة"),
   "Training demo should count repeated listens");
  const answers=["B","B","C"];
  for(let i=0;i<3;i++)await page.locator(".listening-question").nth(i).locator('input[value="'+answers[i]+'"]').check();
  await page.getByRole("button",{name:"سلّم إجابات المجموعة"}).click();
  const script=page.locator(".listening-script p");
  await script.waitFor();
  assert((await script.innerText()).includes("Greenfield Library"));
  assert.equal(await script.getAttribute("dir"),"ltr");
  const review=await page.locator(".listening-rationale").allInnerTexts();
  assert.equal(review.length,3,"Every synthetic question has training feedback");
  assert(review[0].includes("الإجابة الصحيحة: A"));
  assert(review[0].includes("ما قالش 8 o'clock."),"Wrong option should have Arabic teaching reason");
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),
   "Demo must not overflow on "+width+"px");
  assert.deepEqual(errors,[],"No Javascript errors: "+errors.join(" | "));
  await page.close();
  console.log("PASS Listening lab "+width+"px: audio test, 15/30/45, one-play trial, free replay, transcript and wrong-choice review");
 }
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
 await rm(root,{recursive:true,force:true});
}
