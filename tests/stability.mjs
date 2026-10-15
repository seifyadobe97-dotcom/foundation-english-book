import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../audio/voice-manifest.json', import.meta.url), 'utf8'));
const corpus = JSON.parse(readFileSync(new URL('../audio/voice-corpus.json', import.meta.url), 'utf8'));
const count = expression => [...html.matchAll(expression)].length;
const inline = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const pageList = [...html.matchAll(/<section class="page ([^"]+)"[^>]*data-page="(\d+)"(?:[^>]*)>/g)];

test('exact static 151-page sequence, original 45-page A–Z preserved, and stable branding', () => {
  assert.equal(pageList.length, 151);
  assert.deepEqual(pageList.map(x => Number(x[2])), Array.from({length:151}, (_,i) => i+1));
  assert.equal(pageList.filter(x=>x[1].includes('lesson')).length, 26);
  assert.equal(pageList.filter(x=>x[1].includes('quizPage')).length, 27);
  assert.equal(pageList.filter(x=>x[1].includes('phonicsPage')).length,97);
  assert.equal(pageList.filter(x=>x[1].includes('cover')).length, 1);
  assert.equal(count(/data-letter="[A-Z]"/g),26);
  assert.equal(count(/class="emoji" aria-label="/g),149);
  assert.equal(count(/class="cardExample"/g),447);
  assert.match(html,/logo\.svg/);
  for(const color of ['#479599','#474444'])assert.ok(css.includes(color));
  assert.match(css,/@media\s*\(max-width:\s*760px\)/);
  assert.ok(!/<script[^>]+\bsrc="(?:app|data)\.js/.test(html),'static HTML must be source of truth');
  assert.ok(html.includes('getRegistrations().then(rs=>rs.forEach(r=>r.unregister()))'),'SW must stay unregistered');
});

test('review and listening questions all have valid, unique correct answers', () => {
  const blocks=[...html.matchAll(/<div class="quizq" data-answer="([^"]+)"[\s\S]*?<div class="options(?: [^"]+)?"[^>]*>([\s\S]*?)<\/div>/g)];
  assert.equal(blocks.length,162);
  const quizIds=[...html.matchAll(/<div class="quizList" data-quiz="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(quizIds,Array.from({length:27},(_,i)=>String(i+1)));
  for(const [i,q] of blocks.entries()){
    const choices=[...q[2].matchAll(/<button data-value="([^"]+)"/g)].map(m=>m[1]);
    assert.ok(choices.length>=2,'Question '+(i+1)+' must have at least two choices');
    assert.equal(new Set(choices).size,choices.length,'Duplicate choices in question '+(i+1));
    assert.equal(choices.filter(x=>x===q[1]).length,1,'Exactly one correct answer in question '+(i+1));
  }
  assert.equal(count(/class="checkQuiz"/g),27);
  assert.equal(count(/class="resetQuiz"/g),27);
});

test('every quick check is soundly answerable',()=>{
  const blocks=[...html.matchAll(/<div class="microQ" data-answer="([^"]+)"[\s\S]*?<div class="microOptions">([\s\S]*?)<\/div>/g)];
  assert.equal(blocks.length,52);
  assert.equal(count(/data-micro="[A-Z]"/g),26);
  for(const [i,q] of blocks.entries()){
    const choices=[...q[2].matchAll(/<button data-value="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(choices.length,3,'Micro question '+(i+1));
    assert.equal(choices.filter(c=>c===q[1]).length,1,'Micro answer missing or duplicated at '+(i+1));
  }
});

test('audio mappings are internally consistent, without claiming assets exist',()=>{
  assert.equal(count(/class="play wordPlay"/g),149);
  assert.equal(count(/class="slowWord"/g),149);
  assert.equal(count(/class="examplePlay"/g),447);
  assert.equal(count(/class="play letterPlay"/g),26);
  assert.equal(corpus.letterNames.length,26);
  assert.equal(corpus.vocabulary.length,148);
  assert.equal(corpus.sentences.length,442);
  assert.equal(corpus.sentencePlacements.length,447);
  assert.equal(corpus.expected.total,764);
  assert.equal(manifest.voice,'en-US-GuyNeural');
  assert.ok(manifest.words && manifest.letters && manifest.sentences);
  const examples=[...html.matchAll(/<div class="cardExample"><span class="exNo">[123]<\/span><p>([\s\S]*?)<\/p><button class="examplePlay" data-sentence="([^"]+)"/g)];
  const decode=s=>s.replace(/<\/?mark>/g,'').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'");
  assert.equal(examples.length,447);
  for(const x of examples)assert.equal(decode(x[1]),decode(x[2]),'Visible sentence must match pronunciation text');
});

test('main runtime parses and initializes in a simulated DOM; navigation persists and clamps',async()=>{
  assert.ok(inline,'Missing inline script');
  new vm.Script(inline);
  const storage = new Map(), listeners={};
  const nodeMap=new Map();
  function el(id){
    if(nodeMap.has(id))return nodeMap.get(id);
    const c=new Set();
    const value={
      id,disabled:false,hidden:false,textContent:'',dataset:{},
      classList:{add:x=>c.add(x),remove:x=>c.delete(x),toggle:(x,force)=>{
        if(force===true)c.add(x);else if(force===false)c.delete(x);else if(c.has(x))c.delete(x);else c.add(x);
        return c.has(x);
      },contains:x=>c.has(x)},
      addEventListener:(type,handler)=>{(value.handlers??={})[type]=handler},
      closest:()=>value,querySelectorAll:()=>[],querySelector:s=>el(id+' '+s)
    };
    nodeMap.set(id,value);return value;
  }
  const pages=Array.from({length:151},(_,i)=>el('page'+i));
  const context={
    document:{
      querySelector:s=>el(s),
      querySelectorAll:s=>s==='.page'?pages:[]
    },
    localStorage:{
      getItem:k=>storage.get(k)||null,
      setItem:(k,v)=>storage.set(k,String(v)),
      removeItem:k=>storage.delete(k)
    },
    history:{replaceState:()=>{}},location:{hash:''},
    fetch:()=>Promise.resolve({ok:false}),
    scrollTo:()=>{},
    addEventListener:(event,fn)=>{listeners[event]=fn},
    navigator:{userAgent:'Android Chrome'},
    window:{},
    Audio:function(){},
    console
  };
  const sandbox=vm.createContext(context);
  new vm.Script(inline).runInContext(sandbox);
  assert.equal(el('#count').textContent,'1 / 151');
  el('#next').onclick();
  assert.equal(el('#count').textContent,'2 / 151');
  el('#next').onclick();
  assert.equal(el('#count').textContent,'3 / 151');
  el('#prev').onclick();
  assert.equal(el('#count').textContent,'2 / 151');
  listeners.keydown({key:'ArrowRight'});
  assert.equal(el('#count').textContent,'3 / 151');
  for(let i=0;i<160;i++)el('#next').onclick();
  assert.equal(el('#count').textContent,'151 / 151');
  assert.equal(el('#next').disabled,true);
  assert.equal(pages.filter(p=>p.classList.contains('active')).length,1);
  assert.equal(storage.get('foundation:lastPage'),'151');
  for(let i=0;i<160;i++)el('#prev').onclick();
  assert.equal(el('#count').textContent,'1 / 151');
  assert.equal(el('#prev').disabled,true);
});

test('phonics curriculum pages, sound-symbol safety and practice answer integrity',()=>{
  const plan=JSON.parse(readFileSync(new URL('../curriculum/phonics-course.json',import.meta.url),'utf8'));
  assert.equal(plan.lessons.length,43);
  assert.equal(plan.readings.length,5);
  assert.equal(plan.stories.length,5);
  assert.equal(plan.reviews.length,4);
  assert.equal(plan.checkpoints.length,5);
  assert.equal(count(/data-module="/g),106);
  assert.equal(count(/class="phonicsQ"/g),278);
  assert.equal(count(/class="phonicsPractice"/g),96);
  assert.equal(count(/class="phonicsContents"/g),1);
  assert.equal(count(/data-page-jump=/g),10);
  const blocks=[...html.matchAll(/<div class="phonicsQ" data-answer="([^"]+)"[\s\S]*?<div class="phonicsOptions">([\s\S]*?)<\/div>/g)];
  assert.equal(blocks.length,278);
  for(const [i,q] of blocks.entries()){
    const opts=[...q[2].matchAll(/<button data-value="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(opts.length,3,'Three choices required: '+i);
    assert.equal(new Set(opts).size,3,'Duplicate phonics choice: '+i);
    assert.equal(opts.filter(x=>x===q[1]).length,1,'Unanswerable phonics exercise: '+i);
  }
  assert.ok(!html.includes('class="phonemeAudio"'),'no synthetic isolated phoneme buttons');
  for(const unit of ['SHORT VOWELS','CVC BLENDING','WORD FAMILIES','CONSONANT DIGRAPHS','LONG VOWELS','VOWEL TEAMS — UNIT 2','VOWEL TEAMS — UNIT 3']){
    assert.ok(html.includes('data-module="'+unit+'"'),'Missing unit '+unit);
  }
  const sourceWords=[['sh','fish,shop,ship,wash'],['ch','chick,cherry,bench,branch'],
    ['th','math,bath,tooth,teeth'],['th','this,father,mother,brother'],
    ['wh','wheat,whale,white,wheel'],['ph','dolphin,elephant,phone,photo']];
  for(const [i,entry] of plan.lessons.filter(x=>x.unit==='CONSONANT DIGRAPHS').entries()){
    assert.equal(entry.pattern,sourceWords[i][0]);
    assert.equal(entry.words.join(','),sourceWords[i][1]);
  }
});

test('ten interleaved vowel stories have whole-story audio, Arabic toggles and 30 valid checks',()=>{
 const stories=JSON.parse(readFileSync(new URL('../curriculum/vowel-stories.json',import.meta.url),'utf8')).stories;
 const gloss=JSON.parse(readFileSync(new URL('../curriculum/phonics-glossary.json',import.meta.url),'utf8'));
 assert.equal(stories.length,10);
 assert.equal(Object.keys(gloss.wordTranslations).length,142);
 assert.equal(count(/class="dict phonicsDictionary"/g),96);
 assert.equal(count(/class="storyListenAll"/g),48);
 assert.equal(count(/class="storyStop"/g),48);
 assert.equal(count(/class="page phonicsPage vowelStoryPage"/g),10);
 assert.equal(count(/class="dictToggle"/g),122); // 26 letter pages plus 63 phonics/reading/story dictionaries
 for(const entry of stories){
  assert.equal(entry.lines.length,5);
  assert.equal(entry.questions.length,3);
  assert.ok(Object.values(entry.glossary).every(x=>Boolean(x)));
  const code=(entry.kind==='short'?'VS':'VL')+entry.vowel.toUpperCase();
  const block=html.match(new RegExp('<section class="page phonicsPage vowelStoryPage"[^>]*data-story-id="'+code+'"([\\s\\S]*?)(?=<section class="page |</main>)'))?.[1];
  assert.ok(block,'No story page '+code);
  assert.equal((block.match(/class="phonicsSentence"/g)||[]).length,5,'five sentences '+code);
  assert.equal((block.match(/class="phonicsQ"/g)||[]).length,3,'three assessments '+code);
  assert.ok(block.includes('class="dictToggle"'),'dictionary toggle '+code);
  assert.ok(block.includes('class="storyListenAll"'),'complete story listening '+code);
  const full=block.match(/class="storyListenAll"[^>]*data-word="([^"]+)"/)?.[1];
  assert.ok(full && full.length>60 && full.includes(entry.lines[0]),'full text audio '+code);
 }
 const spots=[[51,52,'Short a'],[53,54,'Short e'],[55,56,'Short i'],[57,58,'Short o'],[59,60,'Short u'],
 [106,107,'Long a'],[108,109,'Long e'],[110,111,'Long i'],[112,113,'Long o'],[114,115,'Long u']];
 for(const [lesson,story,title] of spots){
  assert.ok(html.includes('data-page="'+lesson+'" data-module="'+(title.startsWith('Short')?'SHORT VOWELS':'LONG VOWELS')+'"'),'vowel lesson '+title);
  assert.ok(html.includes('data-page="'+story+'" data-module="'+(title.startsWith('Short')?'SHORT VOWEL STORY':'LONG VOWEL STORY')+'"'),'vowel story follows '+title);
 }
});

test('all 43 phonics pattern lessons are followed immediately by 43 answerable short stories',()=>{
 const old=JSON.parse(readFileSync(new URL('../curriculum/vowel-stories.json',import.meta.url),'utf8')).stories;
 const extra=JSON.parse(readFileSync(new URL('../curriculum/sound-stories.json',import.meta.url),'utf8')).stories;
 const lessons=JSON.parse(readFileSync(new URL('../curriculum/phonics-course.json',import.meta.url),'utf8')).lessons;
 assert.equal(old.length,10);
 assert.equal(extra.length,33);
 assert.equal(lessons.length,43);
 assert.equal(count(/class="page phonicsPage soundStoryPage"/g),33);
 assert.equal(count(/class="storyListenAll"/g),48);
 assert.equal(count(/class="dict phonicsDictionary"/g),96);
 assert.equal(count(/class="phonicsQ"/g),278);
 const sections=[...html.matchAll(/<section class="page ([^"]+)" data-page="(\d+)"([^>]*)>([\s\S]*?)(?=<section class="page |<\/main>)/g)];
 assert.equal(sections.length,151);
 const ids=new Set();
 const escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 for(const entry of extra){
   assert.equal(entry.lines.length,5,entry.title);
   assert.equal(entry.questions.length,3,entry.title);
   assert.ok(Object.keys(entry.glossary).length>=5,entry.title+' missing focused Arabic dictionary');
   assert.ok(Object.values(entry.glossary).every(x=>x.trim()),entry.title+' empty Arabic glossary value');
   const targetIndex=sections.findIndex(m=>m[4].includes('<h2>'+entry.after+'</h2>'));
   assert.ok(targetIndex>=0,'Missing phonics lesson '+entry.after);
   const next=sections[targetIndex+1];
   assert.ok(next && next[1].includes('soundStoryPage'),'Story not immediately after '+entry.after);
   assert.ok(next[3].includes('data-after-lesson="'+entry.after+'"'),'Wrong story sequencing '+entry.after);
   const id=next[3].match(/data-story-id="(SP\d{2})"/)?.[1];
   assert.ok(id&&!ids.has(id),'Missing or duplicate story ID '+entry.title);
   ids.add(id);
   const body=next[4];
   assert.ok(body.includes('<h2>'+escapeHtml(entry.title)+'</h2>'),'Story title mismatch '+entry.title);
   assert.equal((body.match(/class="phonicsSentence"/g)||[]).length,5,entry.title+' sentence lines');
   assert.equal((body.match(/class="phonicsRead"/g)||[]).length,5,entry.title+' sentence audio');
   assert.equal((body.match(/class="phonicsQ"/g)||[]).length,3,entry.title+' practice questions');
   assert.ok(body.includes('class="storyListenAll"')&&body.includes('class="storyStop"'),entry.title+' playback controls');
   assert.ok(body.includes('class="dictToggle"'),entry.title+' dictionary toggle');
   assert.ok(body.includes('data-phonics="'+id+'"'),entry.title+' saved mastery ID');
   for(const sentence of entry.lines)assert.ok(body.includes('<p>'+escapeHtml(sentence)+'</p>'),entry.title+' missing source sentence: '+sentence);
   for(const q of entry.questions){
      assert.ok(q.options.includes(q.answer),entry.title+' invalid answer');
   }
 }
 assert.equal(ids.size,33);
 assert.deepEqual(extra.map(x=>x.after),lessons.filter(x=>!['SHORT VOWELS','LONG VOWELS'].includes(x.unit)).map(x=>x.title));
});
