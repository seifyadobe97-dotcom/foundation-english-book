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
  await run('desktop full navigation 1 -> 118 -> 117 and ArrowRight',async()=>{
    assert.equal(await d.page.locator('#count').innerText(),'1 / 118');
    await d.page.locator('#next').click();
    assert.equal(await d.page.locator('#count').innerText(),'2 / 118');
    assert.equal(await d.page.locator('.page.active').count(),1);
    const final=await d.page.evaluate(()=>{
      for(let i=0;i<116;i++)document.querySelector('#next').click();
      return document.querySelector('#count').textContent;
    });
    assert.equal(final,'118 / 118');
    assert.equal(await d.page.locator('#next').isDisabled(),true);
    await d.page.locator('#prev').click();
    assert.equal(await d.page.locator('#count').innerText(),'117 / 118');
    await d.page.keyboard.press('ArrowRight');
    assert.equal(await d.page.locator('#count').innerText(),'118 / 118');
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
    assert.equal(await page.locator('#count').innerText(),'3 / 118');
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });


  await run('book cover jumps to Part Two contents',async()=>{
    const {page,errors}=await openPage(desktop,'#1');
    await page.locator('.phonicsJump').click();
    assert.equal(await page.locator('#count').innerText(),'50 / 118');
    await page.locator('[data-page="50"] .phonicsContents [data-page-jump="78"]').click();
    assert.equal(await page.locator('#count').innerText(),'78 / 118');
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

  await run('short vowel word playback, practice corrections and saved mastery',async()=>{
    const {page,errors}=await openPage(desktop,'#51');
    const block=page.locator('[data-page="51"] .phonicsPractice');
    assert.equal(await page.locator('[data-page="51"] .phonicsWord').count(),6);
    await page.locator('[data-page="51"] .phonicsAudio').first().click();
    await page.locator('[data-page="51"] .phonicsSlow').first().click();
    const questions=block.locator('.phonicsQ');
    assert.equal(await questions.count(),3);
    const first=questions.nth(0);
    const answer=await first.getAttribute('data-answer');
    const wrong=await first.locator('.phonicsOptions button').evaluateAll((buttons,correct)=>buttons.map(x=>x.dataset.value).find(v=>v!==correct),answer);
    await first.locator('.phonicsOptions button[data-value="'+wrong+'"]').click();
    assert.match(await first.locator('.phonicsFeedback').innerText(),/Try again/);
    for(const q of await questions.all()){
      const correct=await q.getAttribute('data-answer');
      await q.locator('.phonicsOptions button[data-value="'+correct+'"]').click();
    }
    assert.match(await page.locator('#phonicsScoreL1').innerText(),/3 \/ 3 ✓ Mastered/);
    await page.reload({waitUntil:'load'});
    assert.match(await page.locator('#phonicsScoreL1').innerText(),/3 \/ 3 ✓ Mastered/);
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

  await run('cumulative and vowel-team checkpoints are graded',async()=>{
    for(const [num,id] of [[46,19],[108,27]]){
      const {page,errors}=await openPage(desktop,'#'+num);
      const qs=page.locator('[data-page="'+num+'"] .quizq');
      assert.equal(await qs.count(),6);
      for(const q of await qs.all()){
        const answer=await q.getAttribute('data-answer');
        await q.locator('.options button[data-value="'+answer+'"]').click();
      }
      await page.locator('[data-page="'+num+'"] .checkQuiz').click();
      assert.equal((await page.locator('#score'+id).innerText()).trim(),'6 / 6');
      assert.equal(errors.length,0,errors.join('\n'));
      await page.close();
    }
  });

  await run('decodable sentences and final mini-story are readable and answerable',async()=>{
    for(const [num,id,lines] of [[109,'R1',5],[118,'S5',4]]){
      const {page,errors}=await openPage(desktop,'#'+num);
      assert.equal(await page.locator('[data-page="'+num+'"] .phonicsSentence').count(),lines);
      await page.locator('[data-page="'+num+'"] .phonicsRead').first().click();
      const qs=page.locator('[data-page="'+num+'"] .phonicsQ');
      assert.equal(await qs.count(),2);
      for(const q of await qs.all()){
        const answer=await q.getAttribute('data-answer');
        await q.locator('.phonicsOptions button[data-value="'+answer+'"]').click();
      }
      assert.match(await page.locator('#phonicsScore'+id).innerText(),/2 \/ 2 ✓ Mastered/);
      assert.equal(errors.length,0,errors.join('\n'));
      await page.close();
    }
  });


  await run('all ten vowel stories: placement, listening, bilingual glossary toggle and saved 3/3 mastery',async()=>{
    const storyPages=[52,54,56,58,60,86,88,90,92,94];
    const storyIDs=['VSA','VSE','VSI','VSO','VSU','VLA','VLE','VLI','VLO','VLU'];
    for(let i=0;i<storyPages.length;i++){
      const num=storyPages[i],id=storyIDs[i];
      const {page,errors}=await openPage(desktop,'#'+num);
      const section=page.locator('[data-page="'+num+'"]');
      assert.equal(await section.locator('.phonicsSentence').count(),5);
      assert.equal(await section.locator('.phonicsQ').count(),3);
      await section.locator('.storyListenAll').click();
      await section.locator('.storyStop').click();
      await section.locator('.phonicsRead').first().click();
      const dict=section.locator('.phonicsDictionary');
      assert.equal(await dict.locator('.de').count()>4,true);
      await dict.locator('.dictToggle').click();
      assert.match(await dict.getAttribute('class'),/hideArabic/);
      await dict.locator('.dictToggle').click();
      assert.doesNotMatch(await dict.getAttribute('class'),/hideArabic/);
      for(const q of await section.locator('.phonicsQ').all()){
        const answer=await q.getAttribute('data-answer');
        await q.locator('.phonicsOptions button[data-value="'+answer+'"]').click();
      }
      assert.match(await page.locator('#phonicsScore'+id).innerText(),/3 \/ 3 ✓ Mastered/);
      if(i===0){
        await page.reload({waitUntil:'load'});
        assert.match(await page.locator('#phonicsScore'+id).innerText(),/3 \/ 3 ✓ Mastered/);
      }
      assert.equal(errors.length,0,errors.join('\n'));
      await page.close();
    }
  });

  await run('all legacy A–Z and new phonics dictionaries retain Arabic show/hide',async()=>{
    for(const pageNumber of [2,51,53,62,68,78,85,100,109,114,118]){
      const {page,errors}=await openPage(desktop,'#'+pageNumber);
      const dictionary=page.locator('[data-page="'+pageNumber+'"] .dict');
      assert.equal(await dictionary.count(),1,'Missing bilingual dictionary '+pageNumber);
      await dictionary.locator('.dictToggle').click();
      assert.match(await dictionary.getAttribute('class'),/hideArabic/);
      await dictionary.locator('.dictToggle').click();
      assert.doesNotMatch(await dictionary.getAttribute('class'),/hideArabic/);
      assert.equal(errors.length,0,errors.join('\n'));
      await page.close();
    }
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
      assert.equal(await page.locator('#count').innerText(),'2 / 118');
      const info=await page.evaluate(()=>{
        const active=document.querySelector('.page.active');
        return {viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,pageWidth:active.getBoundingClientRect().width};
      });
      assert.ok(info.scrollWidth<=info.viewportWidth+3,'Horizontal overflow: '+JSON.stringify(info));
      assert.ok(info.scrollHeight>opts.viewport.height,'Letter page must naturally scroll: '+JSON.stringify(info));
      for(const num of [5,6,29,42,45,50,51,52,54,56,58,60,61,62,78,85,86,90,94,108,109,114,118]){
        await page.goto(base+'#'+num,{waitUntil:'domcontentloaded'});
        assert.equal(await page.locator('#count').innerText(),num+' / 118');
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
