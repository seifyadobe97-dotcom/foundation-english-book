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
  await run('desktop full navigation 1 -> 151 -> 150 and ArrowRight',async()=>{
    assert.equal(await d.page.locator('#count').innerText(),'1 / 151');
    await d.page.locator('#next').click();
    assert.equal(await d.page.locator('#count').innerText(),'2 / 151');
    assert.equal(await d.page.locator('.page.active').count(),1);
    const final=await d.page.evaluate(()=>{
      for(let i=0;i<149;i++)document.querySelector('#next').click();
      return document.querySelector('#count').textContent;
    });
    assert.equal(final,'151 / 151');
    assert.equal(await d.page.locator('#next').isDisabled(),true);
    await d.page.locator('#prev').click();
    assert.equal(await d.page.locator('#count').innerText(),'150 / 151');
    await d.page.keyboard.press('ArrowRight');
    assert.equal(await d.page.locator('#count').innerText(),'151 / 151');
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
    assert.equal(await page.locator('#count').innerText(),'3 / 151');
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });


  await run('book cover jumps to Part Two contents',async()=>{
    const {page,errors}=await openPage(desktop,'#1');
    await page.locator('.phonicsJump').click();
    assert.equal(await page.locator('#count').innerText(),'50 / 151');
    await page.locator('[data-page="50"] .phonicsContents [data-page-jump="93"]').click();
    assert.equal(await page.locator('#count').innerText(),'93 / 151');
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

  await run('short vowel word playback, practice corrections and saved mastery',async()=>{
    const {page,errors}=await openPage(desktop,'#51');
    const lesson=page.locator('[data-page="51"]');
    assert.equal(await lesson.locator('.phonicsPractice').count(),1);
    assert.equal(await lesson.locator('.phonicsWord').count(),6);
    await lesson.locator('.phonicsAudio').first().click();
    await lesson.locator('.phonicsSlow').first().click();
    const block=lesson.locator('.phonicsPractice[data-phonics="L1"]');
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
    await lesson.locator('.nextStoryCta button').click();
    assert.equal(await page.locator('#count').innerText(),'52 / 151');
    assert.equal(await page.locator('[data-page="52"] .phonicsPractice').count(),1);
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

  await run('cumulative and vowel-team checkpoints are graded',async()=>{
    for(const [num,id] of [[46,19],[141,27]]){
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
    for(const [num,id,lines] of [[142,'R1',5],[151,'S5',4]]){
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
    const storyPages=[52,54,56,58,60,107,109,111,113,115];
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
      for(const q of await section.locator('.phonicsPractice[data-phonics="'+id+'"] .phonicsQ').all()){
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
    for(const pageNumber of [2,51,53,62,74,93,106,125,142,147,151]){
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


  await run('all 33 new sound stories: immediate placement, audio, bilingual dictionary and graded mastery',async()=>{
    const sourceHtml=await readFile(path.join(root,'index.html'),'utf8');
    const newStories=[...sourceHtml.matchAll(/<section class="page phonicsPage soundStoryPage" data-page="(\d+)"[^>]*data-story-id="(SP\d{2})"[^>]*>/g)]
      .map(x=>({page:+x[1],id:x[2]}));
    assert.equal(newStories.length,33);
    const {page,errors}=await openPage(desktop,'#63');
    for(const entry of newStories){
      await page.goto(base+'#'+entry.page,{waitUntil:'load'});
      const story=page.locator('[data-story-id="'+entry.id+'"]');
      assert.equal(await story.locator('.phonicsSentence').count(),5,'Story '+entry.id);
      assert.equal(await story.locator('.phonicsQ').count(),3,'Story '+entry.id);
      await story.locator('.storyListenAll').click();
      await story.locator('.storyStop').click();
      await story.locator('.phonicsRead').first().click();
      const dict=story.locator('.dict');
      assert.equal(await dict.count(),1,'Missing dictionary '+entry.id);
      await dict.locator('.dictToggle').click();
      assert.match(await dict.getAttribute('class'),/hideArabic/);
      await dict.locator('.dictToggle').click();
      assert.doesNotMatch(await dict.getAttribute('class'),/hideArabic/);
      for(const q of await story.locator('.phonicsPractice[data-phonics="'+entry.id+'"] .phonicsQ').all()){
        const right=await q.getAttribute('data-answer');
        await q.locator('.phonicsOptions button[data-value="'+right+'"]').click();
      }
      assert.match(await page.locator('#phonicsScore'+entry.id).innerText(),/3 \/ 3 ✓ Mastered/);
    }
    await page.reload({waitUntil:'load'});
    const last=newStories.at(-1);
    assert.match(await page.locator('#phonicsScore'+last.id).innerText(),/3 \/ 3 ✓ Mastered/);
    assert.equal(errors.length,0,errors.join('\n'));
    await page.close();
  });

 
  await run('all 43 phonics lessons: graded quick checks precede direct story transitions',async()=>{
    const lessonPages=[51,53,55,57,59,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,
      93,95,97,99,101,103,106,108,110,112,114,117,119,121,123,125,127,129,131,133,135,137,139];
    assert.equal(lessonPages.length,43);
    const {page,errors}=await openPage(desktop,'#51');
    for(const [i,lessonNumber] of lessonPages.entries()){
      await page.goto(base+'#'+lessonNumber,{waitUntil:'domcontentloaded'});
      const lesson=page.locator('[data-page="'+lessonNumber+'"]');
      assert.equal(await page.locator('#count').innerText(),lessonNumber+' / 151');
      assert.equal(await lesson.locator('.phonicsWords').count(),1,'vocabulary page '+lessonNumber);
      assert.equal(await lesson.locator('.dict').count(),1,'lesson dictionary '+lessonNumber);
      const block=lesson.locator('.phonicsPractice');
      assert.equal(await block.count(),1,'lesson quick check '+lessonNumber);
      assert.equal(await block.getAttribute('data-phonics'),'L'+(i+1));
      const questions=block.locator('.phonicsQ');
      assert.equal(await questions.count(),3);
      for(const question of await questions.all()){
        const answer=await question.getAttribute('data-answer');
        await question.locator('.phonicsOptions button[data-value="'+answer+'"]').click();
      }
      assert.match(await lesson.locator('#phonicsScoreL'+(i+1)).innerText(),/3 \/ 3 ✓ Mastered/);
      await lesson.locator('.nextStoryCta button').click();
      assert.equal(await page.locator('#count').innerText(),(lessonNumber+1)+' / 151','story link '+lessonNumber);
      const story=page.locator('[data-page="'+(lessonNumber+1)+'"]');
      assert.equal(await story.locator('.phonicsPractice').count(),1,'story has independent check '+lessonNumber);
      assert.equal(await story.locator('.phonicsQ').count(),3,'three story questions '+lessonNumber);
    }
    await page.reload({waitUntil:'load'});
    assert.match(await page.locator('#phonicsScoreL43').innerText(),/3 \/ 3 ✓ Mastered/);
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
      assert.equal(await page.locator('#count').innerText(),'2 / 151');
      const info=await page.evaluate(()=>{
        const active=document.querySelector('.page.active');
        return {viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,pageWidth:active.getBoundingClientRect().width};
      });
      assert.ok(info.scrollWidth<=info.viewportWidth+3,'Horizontal overflow: '+JSON.stringify(info));
      assert.ok(info.scrollHeight>opts.viewport.height,'Letter page must naturally scroll: '+JSON.stringify(info));
      for(const num of [5,6,29,42,45,50,51,52,54,56,58,60,61,62,93,106,107,111,115,141,142,147,151]){
        await page.goto(base+'#'+num,{waitUntil:'domcontentloaded'});
        assert.equal(await page.locator('#count').innerText(),num+' / 151');
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
