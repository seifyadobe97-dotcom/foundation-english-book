import assert from "node:assert/strict";
import {readFile,stat,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {createServer} from "node:http";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {chromium} from "playwright";
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const root=path.join(repoRoot,".step-public-stage-check");
execFileSync(process.execPath,[path.join(repoRoot,"scripts/build-step-public-site.mjs"),root],{stdio:"pipe"});
const bundles=["lesson-stage-clarity.js","clarity-future-06.js","clarity-arrangements-07.js","clarity-time-08.js","clarity-present-perfect-09.js","clarity-perfect-continuous-10.js","clarity-perfect-continuous-extra.js","clarity-perfect-continuous-finish.js","clarity-past-perfect-11.js","clarity-past-perfect-continuous-12.js","clarity-future-perfect-combo-13.js","clarity-used-to-14.js","clarity-modals-15.js"];
const lessonHtml=readFileSync(path.join(root,"step-grammar-student/lesson.html"),"utf8");
for(const filename of bundles)assert(lessonHtml.includes('src="'+filename+'"'),"Missing published script: "+filename);
const vm={window:{}};
for(const filename of bundles)runInNewContext(readFileSync(path.join(root,"step-grammar-student",filename),"utf8"),vm,{filename});
const sources=vm.window.StepStageClarity;
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,"http://localhost"),raw=decodeURIComponent(url.pathname),file=path.resolve(root,"."+raw);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{
  if(!(await stat(file)).isFile())throw Error("Not a file");
  res.writeHead(200,{"Content-Type":file.endsWith(".html")?"text/html; charset=utf-8":file.endsWith(".css")?"text/css":"text/javascript"});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const local="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const qs=[{id:"q1",text:"This is a synthetic grammar smoke question.",options:{A:"alpha",B:"beta",C:"gamma",D:"delta"}}];
const jwtMock='window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"synthetic"}}})}}}};';
let checked=0;
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:820}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**",r=>r.fulfill({contentType:"text/javascript",body:jwtMock}));
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  for(const [slug,rows] of Object.entries(sources)){
   const teaching=rows.map(r=>({title:r[1],detail:"افهم المرحلة وبعدين جرب سؤال التحقق.",
    tip:"حدد الفاعل أو الزمن قبل الإجابة.",cards:[],examples:[],formulas:[],keywords:[],
    warning:{wrong:"",correct:"",why:""},extra:{heading:"",paragraphs:[]}}));
   const course=()=>({student:"synthetic",course:{title:slug,titleAr:slug,subtitle:"reviewed lesson",axis_code:"grammar"},
    teachingUnits:teaching,sections:rows.map((r,i)=>({id:r[0],index:i,title:r[1],titleAr:r[1],
     passed:false,locked:false,short:"reviewed",questionCount:1})),
    nextIndex:0,completed:false,exam:{unlocked:false,best:0,attempts:0}});
   await page.route("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/lesson/"+slug+"/**",r=>{
    const suffix=new URL(r.request().url()).pathname.split("/step-course/lesson/"+slug)[1];
    let body;if(suffix==="/course")body=course();
    else if(suffix==="/teaching")body={units:[]};
    else if(suffix==="/videos")body={videos:[]};
    else if(/^\/parts\/\d+$/.test(suffix)){
     const ix=Number(suffix.split("/").at(-1));body={part:{index:ix,title:rows[ix][1],questions:qs,passRequired:1},progress:course()};
    }else body={error:"Unknown synthetic route"};
    return r.fulfill({status:body.error?404:200,contentType:"application/json",body:JSON.stringify(body)});
   });
   await page.goto(local+"/step-grammar-student/lesson.html?slug="+slug,{waitUntil:"domcontentloaded"});
   await page.locator(".beginner-help").waitFor();
   assert.equal(await page.locator(".path-button").count(),rows.length,"Path stages "+slug);
   for(let i=0;i<rows.length;i++){
    if(i>0)await page.locator(".path-button").nth(i).click();
    await page.locator(".beginner-check").waitFor();
    const expected=rows[i];
    assert((await page.locator(".beginner-stage").innerText()).includes(expected[1]),"Stage-specific lesson "+slug+"/"+i);
    assert.equal(await page.locator(".beginner-part").count(),3,"3 analyzed parts "+slug+"/"+i);
    assert.equal(await page.locator(".beginner-english").getAttribute("dir"),"ltr");
    assert.equal(await page.locator(".beginner-arabic").getAttribute("dir"),"rtl");
    assert((await page.locator(".beginner-english").innerText()).includes(expected[4]),"English example "+slug+"/"+i);
    assert((await page.locator(".beginner-arabic").innerText()).includes(expected[5]),"Arabic translation "+slug+"/"+i);
    assert.equal(await page.locator(".beginner-check-answer:visible").count(),0,"Self-check answer hidden initially");
    await page.locator(".beginner-check summary").click();
    assert.equal(await page.locator(".beginner-check-answer:visible").count(),1,"Self-check answer reveal");
    assert((await page.locator(".beginner-check").innerText()).includes(expected[6][1]));
    assert.equal(await page.locator(".question").count(),1,"Original practice area must stay");
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3)),"No overflow at "+width+" for "+slug+"/"+i);
    checked++;
   }
   await page.unroute("https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-course/lesson/"+slug+"/**");
  }
  assert.deepEqual(errors,[],"Browser errors "+width+": "+errors.join(" / "));
  await page.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true})}
assert.equal(checked,176);
console.log("PASS: "+checked+" real-browser stage renders (88 reviewed stages x mobile/desktop), Arabic/LTR, answer reveal and preserved question area");
