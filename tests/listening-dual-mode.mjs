import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
import "../step-grammar-student/listening-session.js";

const Session=globalThis.StepListeningSession;
assert.equal(typeof Session,"function");
const questions=n=>Array.from({length:n},(_,i)=>({
  id:"q"+(i+1),text:"Synthetic question "+(i+1),
  options:{A:"alpha",B:"bravo",C:"charlie",D:"delta"},
  // Deliberately injected secrets must never be reflected to the student.
  correct:"A",transcript:"SECRET PRE-GRADE"
}));
function clock(){
  return {time:1000,jobs:new Map(),i:0,
    now(){return this.time},
    every(fn){const id=++this.i;this.jobs.set(id,fn);return id},
    stop(id){this.jobs.delete(id)},
    advance(ms){this.time+=ms;for(const fn of this.jobs.values())fn()}
  };
}
function media(){
  const listeners={};
  return {plays:0,controls:true,currentTime:123,playbackRate:1,
    addEventListener(name,cb){listeners[name]=cb},
    async play(){this.plays++},
    pause(){this.paused=true},
    end(){listeners.ended?.()}
  };
}
for(const count of [1,2,3]){
  const t=clock(),m=media(),events=[];
  const s=new Session({mode:"exam",questions:questions(count),clock:t,media:m,
    onEvent:n=>events.push(n),
    grade:async()=>({accepted:true,transcript:"SECRET",results:[{correct:"A"}]})});
  assert.equal(s.readingSeconds,15*count);
  assert.equal(s.snapshot().questions[0].correct,undefined,"No key in student-loaded questions");
  assert.equal(s.snapshot().questions[0].transcript,undefined,"No pre-grade script");
  assert.equal(s.start(),true);
  assert.equal(s.start(),false,"Refresh must not restart the same reading timer");
  assert.equal(s.secondsRemaining,15*count);
  t.advance(15*count*1000-1);
  assert.equal(m.plays,0,"Audio cannot start before exact 15 s per question");
  assert.equal(await s.playExamAudio(),false,"Direct playback before deadline is blocked");
  t.advance(1);
  await Promise.resolve();
  assert.equal(m.plays,1,"Audio starts exactly once at reading deadline");
  assert.equal(s.phase,"playing");
  assert.equal(await s.playExamAudio(),false,"No replay during clip");
  assert.equal(s.answer("q1","A"),true,"Students may answer while listening");
  m.end();
  assert.equal(s.phase,"answering");
  for(let i=2;i<=count;i++)s.answer("q"+i,"A");
  assert.equal(await s.submit(),true,"Group answers are submitted");
  assert.equal(s.phase,"finished");
  assert.equal(s.snapshot().review,null,"No transcript or answers during exam");
  assert.equal(await s.resumeBlockedAudio(),false,"No replay after submission");
  assert.deepEqual(events.includes("exam_audio_started"),true);
  assert.deepEqual(events.includes("answers_submitted"),true);
  const resumed=new Session({mode:"exam",questions:questions(count),media:media(),
    attempt:{audioStarted:true,readingEndsAtMs:t.now()-12000}});
  assert.equal(resumed.phase,"answering","Reload after started audio skips replay");
  assert.equal(resumed.playCount,1);
  const completed=new Session({mode:"exam",questions:questions(count),media:media(),
    attempt:{audioStarted:true,submitted:true}});
  assert.equal(completed.phase,"finished","Submitted attempt never restarts");
  s.destroy();resumed.destroy();completed.destroy();
  console.log("PASS exam count="+count+" reading="+15*count+"s, one playback, no script, resume protected");
}
{
  const t=clock(),m=media();
  const s=new Session({mode:"practice",questions:questions(2),clock:t,media:m,
    grade:async()=>({
      transcript:"I am planning a trip to Riyadh.",
      results:[{id:"q1",correct:"A",isCorrect:true,explanation:"Speaker said the right option."}]
    })});
  assert.equal(s.snapshot().review,null);
  assert.equal(s.start(),true);
  for(let i=0;i<3;i++)assert.equal(await s.playPracticeAudio(),true);
  assert.equal(m.plays,3,"Training allows unlimited replay");
  assert.equal(s.playCount,3);
  assert.equal(s.pausePracticeAudio(),true);
  assert.equal(m.paused,true);
  s.answer("q1","A");s.answer("q2","B");
  assert.equal(s.snapshot().review,null,"Training transcript concealed before grade");
  assert.equal(await s.submit(),true);
  assert.equal(s.phase,"review");
  assert.equal(s.snapshot().review.transcript,"I am planning a trip to Riyadh.");
  assert.equal(await s.playPracticeAudio(),true,"Replay remains enabled in review");
  s.destroy();
  console.log("PASS training unlimited replay, pause, transcript and explanations after submit");
}
{
  const t=clock(),m=media();
  m.play=async()=>{if(!m.once){m.once=true;throw Error("NotAllowedError")}m.plays++};
  const s=new Session({mode:"exam",questions:questions(2),clock:t,media:m,
    grade:async()=>({accepted:true})});
  s.start();t.advance(30000);await Promise.resolve();
  assert.equal(s.phase,"blocked","Browser autoplay prohibition must not silently fail");
  assert.equal(s.playCount,0);
  assert.equal(s.secondsRemaining,0,"Failed autoplay must never reset prep clock");
  assert.equal(await s.resumeBlockedAudio(),true,"User gesture may start the first play");
  assert.equal(m.plays,1);
  assert.equal(await s.resumeBlockedAudio(),false,"Autoplay fallback cannot be replayed");
  s.destroy();
  console.log("PASS autoplay fallback user gesture preserves one-play limit");
}

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const server=createServer(async(req,res)=>{
  const raw=decodeURIComponent(new URL(req.url,"http://local").pathname);
  const loc=path.resolve(root,"."+raw),file=raw.endsWith("/")?path.join(loc,"index.html"):loc;
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  try{
    if(!(await stat(file)).isFile())throw Error("not found");
    res.writeHead(200,{"Content-Type":file.endsWith(".html")?"text/html; charset=utf-8":
      file.endsWith(".css")?"text/css":"text/javascript"});
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
  for(const width of [390,1280]){
    const page=await browser.newPage({viewport:{width,height:860}});
    const errors=[];page.on("pageerror",error=>errors.push(String(error)));
    await page.goto(origin+"/tests/fixtures/listening-harness.html",{waitUntil:"domcontentloaded"});
    for(const n of [1,2,3]){
      await page.evaluate(n=>window.attachMock("exam",n),n);
      assert.equal(await page.locator(".listening-question").count(),0,
        "Exam questions must be hidden BEFORE starting timed reading");
      await page.getByRole("button",{name:"ابدأ المحاكاة"}).click();
      assert.equal(await page.locator(".listening-question").count(),n);
      assert.equal(await page.locator(".listening-timer strong").innerText(),String(15*n));
      assert.equal(await page.locator(".listening-choice input:disabled").count(),n*4,
        "During question-reading window no answers may be submitted");
      await page.evaluate(n=>window.mockClock.advance(n*15000),n);
      await page.waitForFunction(()=>window.plays===1);
      assert.equal(await page.locator(".listening-choice input:not([disabled])").count(),n*4);
      assert.equal(await page.locator("audio[controls]").count(),0,
        "Never show pause/seek/replay media controls in exam");
      assert.equal(await page.locator('[data-action="play"]').count(),0);
      for(let i=1;i<=n;i++)await page.locator('input[data-question="q'+i+'"][value="A"]').check();
      await page.getByRole("button",{name:"سلّم إجابات المجموعة"}).click();
      await page.locator(".listening-done").waitFor();
      assert.equal(await page.locator(".listening-script").count(),0);
      assert(!(await page.locator("body").innerText()).includes("SECRET EXAM TRANSCRIPT"));
      assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)));
    }
    await page.evaluate(()=>window.attachMock("practice",2));
    await page.getByRole("button",{name:"ابدأ التدريب"}).click();
    assert.equal(await page.locator("audio[controls]").count(),1,
      "Training includes ordinary unrestricted media controls");
    for(let i=0;i<3;i++)await page.locator('[data-action="play"]').click();
    assert.equal(await page.evaluate(()=>window.plays),3);
    assert.equal(await page.locator(".listening-script").count(),0,"No script before grading");
    await page.locator('input[data-question="q1"][value="A"]').check();
    await page.locator('input[data-question="q2"][value="B"]').check();
    await page.getByRole("button",{name:"سلّم إجابات المجموعة"}).click();
    await page.locator(".listening-script").waitFor();
    assert((await page.locator(".listening-script").innerText()).includes("The speaker said"));
    assert.equal(await page.locator(".listening-script p").getAttribute("dir"),"ltr");
    assert.deepEqual(errors,[],"Browser errors "+width+"px: "+errors.join("; "));
    await page.close();
    console.log("PASS Listening browser UI "+width+"px: 15/30/45, exams once, practice replay and script");
  }
}finally{
  await browser.close();
  await new Promise(done=>server.close(done));
}
