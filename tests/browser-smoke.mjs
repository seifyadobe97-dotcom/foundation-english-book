/**
 * Real browser smoke suite: desktop + Android/iPhone-sized touch viewports.
 * Run after npm install && npx playwright install chromium.
 * This uses Chromium emulation, NOT physical Android/iOS device testing.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  const pathnameDecoded=decodeURIComponent(pathname);
  const dest=path.resolve(root,'.'+(pathnameDecoded==='/'?'/index.html':pathnameDecoded));
  if(!dest.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try {
    const s=await stat(dest);
    if(!s.isFile()){res.writeHead(404);res.end();return;}
    const body=await readFile(dest);
    res.writeHead(200,{'Content-Type':mime[path.extname(dest)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
let browser, failures=0;
const tests=[];
const run=async(name,fn)=>{
  try{await fn();tests.push({name,result:'PASS'});console.log('PASS '+name);}
  catch(e){failures++;tests.push({name,result:'FAIL',message:String(e)});console.error('FAIL '+name,e.stack||String(e));}
};
async function openPage(ctx,hash='#1'){
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 // Audio network may be blocked in CI; an unavailable legacy MP3 should degrade gracefully to TTS.
 await page.route('https://storage.googleapis.com/**',route=>route.abort());
 await page.goto(base+hash,{waitUntil:'load'});
 await page.waitForSelector('.page.active',{timeout:12000});
 return {page,errors};
}
try {
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const desktop=await browser.newContext({viewport:{width:1280,height:850},locale:'en-US'});
  const d=await openPage(desktop);
  await run('desktop full navigation 1 -> 45 -> 44 and ArrowRight',async()=>{
    assert.equal(await d.page.locator('#count').innerText(),'1 / 45');
    await d.page.locator('#next').click();
    assert.equal(await d.page.locator('#count').innerText(),'2 / 45');
    assert.equal(await d.page.locator('.page.active').count(),1);
    const final=await d.page.evaluate(()=>{
      for(let i=0;i<43;i++)document.querySelector('#next').click();
      return document.querySelector('#count').textContent;
    });
    assert.equal(final,'45 / 45');
    assert.equal(await d.page.locator('#next').isDisabled(),true);
    await d.page.locator('#prev').click();
    assert.equal(await d.page.locator('#count').innerText(),'44 / 45');
    await d.page.keyboard.press('ArrowRight');
    assert.equal(await d.page.locator('#count').innerText(),'45 / 45');
    assert.equal(await d.page.locator('.page.active').count(),1);
    assert.equal(d.errors.length,0,d.errors.join('\n'));
  });
  await d.page.close();

  await run('review quiz scores and resets correctly',async()=>{
    const {page,errors}=await openPage(desktop,'#5');
    const questions=page.locator('[data-page="5"] .quizq');
    assert.equal(await questions.count(),6);
    for(const q of await questions.all()){
      const answer=await q.getAttribute('data-answer');
      await q.locator('.options button[data-value="'+answer+'"]').click();
    }
    await page.locator('[data-page="5"] .checkQuiz').click();
    assert.equal((await page.locator('#score1').innerText()).trim(),'6 / 6');
    await page.locator('[data-page="5"] .resetQuiz').click();
    assert.equal((await page.locator('#score1').innerText()).trim(),'— / 6');
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

  await run('quick check, mastery, dictionary toggle and audio controls',async()=>{
    const {page,errors}=await openPage(desktop,'#2');
    const q=page.locator('.micro[data-micro="A"] .microQ');
    assert.equal(await q.count(),2);
    for(const question of await q.all()){
      const answer=await question.getAttribute('data-answer');
      await question.locator('.microOptions button[data-value="'+answer+'"]').click();
    }
    assert.match(await page.locator('#microScoreA').innerText(),/2 \/ 2/);
    assert.match(await page.locator('#progress').innerText(),/1 \/ 26/);
    const dict=page.locator('[data-letter="A"] .dict');
    await page.locator('[data-letter="A"] .dictToggle').click();
    assert.match(await dict.getAttribute('class'),/hideArabic/);
    await page.locator('[data-letter="A"] .dictToggle').click();
    assert.doesNotMatch(await dict.getAttribute('class'),/hideArabic/);
    // Only ensure event handlers do not throw; real quality/phonetics require a listening QA pass.
    await page.locator('[data-letter="A"] .wordPlay').first().click();
    await page.locator('[data-letter="A"] .slowWord').first().click();
    await page.locator('[data-letter="A"] .examplePlay').first().click();
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

  await run('listening quiz buttons are interactive even without recorded audio',async()=>{
    const {page,errors}=await openPage(desktop,'#6');
    assert.equal(await page.locator('[data-page="6"] .quizq').count(),6);
    await page.locator('[data-page="6"] .listenQ').first().click();
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

  await run('navigation returns to stored page after reloading',async()=>{
    const {page,errors}=await openPage(desktop,'#3');
    await page.evaluate(()=>history.replaceState(null,'',location.pathname));
    await page.reload({waitUntil:'load'});
    assert.equal(await page.locator('#count').innerText(),'3 / 45');
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

  await desktop.close();

  for(const config of [
    {name:'Android-sized Chromium',viewport:{width:360,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:2},
    {name:'iPhone-sized Chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}
  ]){
    const {name,...opts}=config;
    const ctx=await browser.newContext({...opts,locale:'en-US'});
    await run(name+' page turning, natural scrolling and no page overflow',async()=>{
      const {page,errors}=await openPage(ctx,'#1');
      await page.locator('#next').tap();
      assert.equal(await page.locator('#count').innerText(),'2 / 45');
      const info=await page.evaluate(()=>{
        const active=document.querySelector('.page.active');
        return {viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,pageWidth:active.getBoundingClientRect().width};
      });
      assert.ok(info.scrollWidth<=info.viewportWidth+3,'Horizontal overflow: '+JSON.stringify(info));
      assert.ok(info.scrollHeight>opts.viewport.height,'Letter page must naturally scroll: '+JSON.stringify(info));
      for(const num of [5,6,29,42,45]){
        await page.goto(base+'#'+num,{waitUntil:'domcontentloaded'});
        assert.equal(await page.locator('#count').innerText(),num+' / 45');
        assert.equal(await page.locator('.page.active').count(),1);
        const width=await page.evaluate(()=>({window:innerWidth,document:document.documentElement.scrollWidth}));
        assert.ok(width.document<=width.window+3,'Horizontal overflow at page '+num+': '+JSON.stringify(width));
      }
      assert.equal(errors.length,0,errors.join('\n'));
      await page.close();
    });
    await ctx.close();
  }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
console.log(JSON.stringify({suite:'Foundation English browser smoke',results:tests,failed:failures},null,2));
if(failures)process.exitCode=1;
