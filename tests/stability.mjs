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

test('exact static 45-page sequence and stable branding', () => {
  assert.equal(pageList.length, 45);
  assert.deepEqual(pageList.map(x => Number(x[2])), Array.from({length:45}, (_,i) => i+1));
  assert.equal(pageList.filter(x=>x[1].includes('lesson')).length, 26);
  assert.equal(pageList.filter(x=>x[1].includes('quizPage')).length, 18);
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
  const blocks=[...html.matchAll(/<div class="quizq" data-answer="([^"]+)"[\s\S]*?<div class="options">([\s\S]*?)<\/div>/g)];
  assert.equal(blocks.length,108);
  const quizIds=[...html.matchAll(/<div class="quizList" data-quiz="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(quizIds,Array.from({length:18},(_,i)=>String(i+1)));
  for(const [i,q] of blocks.entries()){
    const choices=[...q[2].matchAll(/<button data-value="([^"]+)"/g)].map(m=>m[1]);
    assert.ok(choices.length>=2,'Question '+(i+1)+' must have at least two choices');
    assert.equal(new Set(choices).size,choices.length,'Duplicate choices in question '+(i+1));
    assert.equal(choices.filter(x=>x===q[1]).length,1,'Exactly one correct answer in question '+(i+1));
  }
  assert.equal(count(/class="checkQuiz"/g),18);
  assert.equal(count(/class="resetQuiz"/g),18);
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
  const examples=[...html.matchAll(/<p>([\s\S]*?)<\/p><button class="examplePlay" data-sentence="([^"]+)"/g)];
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
  const pages=Array.from({length:45},(_,i)=>el('page'+i));
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
  assert.equal(el('#count').textContent,'1 / 45');
  el('#next').onclick();
  assert.equal(el('#count').textContent,'2 / 45');
  el('#next').onclick();
  assert.equal(el('#count').textContent,'3 / 45');
  el('#prev').onclick();
  assert.equal(el('#count').textContent,'2 / 45');
  listeners.keydown({key:'ArrowRight'});
  assert.equal(el('#count').textContent,'3 / 45');
  for(let i=0;i<100;i++)el('#next').onclick();
  assert.equal(el('#count').textContent,'45 / 45');
  assert.equal(el('#next').disabled,true);
  assert.equal(pages.filter(p=>p.classList.contains('active')).length,1);
  assert.equal(storage.get('foundation:lastPage'),'45');
  for(let i=0;i<100;i++)el('#prev').onclick();
  assert.equal(el('#count').textContent,'1 / 45');
  assert.equal(el('#prev').disabled,true);
});
