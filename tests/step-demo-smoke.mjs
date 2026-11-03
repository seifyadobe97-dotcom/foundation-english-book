import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const demo=path.join(root,"step-demo");
for(const file of ["index.html","app.js","style.css"])
  assert((await stat(path.join(demo,file))).isFile(),file+" missing");
const app=await readFile(path.join(demo,"app.js"),"utf8");
const index=await readFile(path.join(demo,"index.html"),"utf8");
assert(!/https?:\/\/funltjxavowlnnfibhpl|SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(app),"Demo must not contain production API secrets");
assert(index.includes("connect-src 'none'"),"Demo must not make external network requests");
assert(app.includes("15*questions.listening.length"),"Listening exam preview must use 15 seconds per visible question");
const server=createServer(async (req,res)=>{
 const requestPath=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
 const file=path.resolve(root,"."+requestPath+(requestPath.endsWith("/")?"index.html":""));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  if(!(await stat(file)).isFile())throw Error("Missing file");
  const type=file.endsWith(".html")?"text/html; charset=utf-8":file.endsWith(".css")?"text/css":file.endsWith(".svg")?"image/svg+xml":"text/javascript";
  res.writeHead(200,{"Content-Type":type});res.end(await readFile(file));
 }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const errors=[];
const browser=await chromium.launch({headless:true});
async function run(width,height){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:"reduce"});
 const page=await context.newPage();
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(!r.url().startsWith(base+"/"))errors.push("External demo request: "+r.url());});
 await page.addInitScript(()=>{
  const mock={plays:0,utter:null,
   cancel(){if(this.utter?.onend)this.utter.onend();this.utter=null;},
   getVoices(){return [{lang:"en-US",name:"Mock English"}];},
   speak(u){this.plays++;this.utter=u;setTimeout(()=>u.onstart?.(),5);setTimeout(()=>u.onend?.(),100);}
  };
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:mock});
  window.SpeechSynthesisUtterance=function(text){this.text=text;this.lang="en-US";this.rate=1;};
 });
 await page.goto(base+"/step-demo/",{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>window.STEP_DEMO_READY===true);
 assert.equal(await page.locator(".module-card").count(),4,"Four independent demo sections");
 const wide=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
 assert(!wide,"Home must be mobile responsive");
 // Lesson: grammar with three correct answers.
 await page.locator('[data-module="grammar"]').click();
 await page.waitForURL(/#grammar/);
 assert.equal(await page.locator("fieldset.question-card").count(),3);
 for(const name of ["g1","g2","g3"])await page.locator('input[name="'+name+'"][value="1"]').check();
 await page.locator("#markAnswers").click();
 assert.match(await page.locator("#feedback").innerText(),/3\s*\/\s*3/);
 // Lesson: source-independent reading text, four questions.
 await page.locator("#goBack").click();
 await page.locator('[data-module="reading"]').click();
 assert.equal(await page.locator(".passage p").count(),4);
 for(const [name,v] of [["r1",1],["r2",2],["r3",1],["r4",0]])
   await page.locator('input[name="'+name+'"][value="'+v+'"]').check();
 await page.locator("#markAnswers").click();
 assert.match(await page.locator("#feedback").innerText(),/4\s*\/\s*4/);
 // Writing Analysis, three question rationales.
 await page.locator("#goBack").click();
 await page.locator('[data-module="writing"]').click();
 for(const [name,v] of [["w1",0],["w2",1],["w3",2]])
   await page.locator('input[name="'+name+'"][value="'+v+'"]').check();
 await page.locator("#markAnswers").click();
 assert.match(await page.locator("#feedback").innerText(),/3\s*\/\s*3/);
 // Practice can replay, but the transcript appears only after submission.
 await page.locator("#goBack").click();
 await page.locator('[data-module="listening"]').click();
 await page.locator("#beginListening").click();
 await page.waitForFunction(()=>window.speechSynthesis.plays>=1);
 assert.equal(await page.locator(".script").count(),0,"No transcript before grading");
 await page.locator("#replayAudio").click();
 await page.waitForFunction(()=>window.speechSynthesis.plays>=2);
 for(const [name,v] of [["l1",1],["l2",2]])
   await page.locator('input[name="'+name+'"][value="'+v+'"]').check();
 await page.locator("#submitListening").click();
 assert.match(await page.locator("#feedback").innerText(),/2\s*\/\s*2/);
 assert.equal(await page.locator(".script").count(),1,"Transcript released after practice grading");
 // Exam must preview 15 s × 2, then start exactly one audio playback; no transcript.
 await page.locator("#goBack").click();
 await page.locator('[data-module="listening"]').click();
 await page.clock.install();
 await page.locator('input[name="mode"][value="exam"]').check();
 await page.locator("#beginListening").click();
 assert.match(await page.locator("#countdown").innerText(),/30\s*ثانية/);
 assert.equal(await page.locator('input[name="l1"]:not(:disabled)').count(),0,"Answers locked before play");
 const before=await page.evaluate(()=>window.speechSynthesis.plays);
 await page.clock.runFor(30100);
 await page.waitForFunction((before)=>window.speechSynthesis.plays>before,before);
 await page.waitForFunction(()=>document.querySelectorAll('input[name="l1"]:not(:disabled)').length===4);
 const after=await page.evaluate(()=>window.speechSynthesis.plays);
 assert.equal(after,before+1,"Exactly one exam playback");
 assert(await page.locator("#replayAudio").isDisabled(),"Exam replay button disabled");
 for(const [name,v] of [["l1",1],["l2",2]])
   await page.locator('input[name="'+name+'"][value="'+v+'"]').check();
 await page.locator("#submitListening").click();
 assert.equal(await page.locator(".script").count(),0,"Never release transcript in demo exam");
 assert.match(await page.locator("#feedback").innerText(),/2\s*\/\s*2/);
 await context.close();
}
try{
 await run(1350,830);
 await run(390,844);
 assert.deepEqual(errors,[],"No client errors or external requests");
 console.log("PASS standalone STEP demo: 4 modules, navigation, grading, practice replay, 30s one-play exam, transcript boundary, responsive widths.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
