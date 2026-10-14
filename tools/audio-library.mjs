#!/usr/bin/env node
/**
 * Foundation English — verified prerecorded voice library.
 * Voice: en-US-GuyNeural (single US English male Azure Speech neural voice).
 * No runtime synthesis and no isolated IPA-phoneme synthesis.
 *
 * node tools/audio-library.mjs --plan
 * node tools/audio-library.mjs --verify
 * AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=... node tools/audio-library.mjs --generate --letter A
 * AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=... node tools/audio-library.mjs --generate --all
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const corpusFile = path.join(root, 'audio/voice-corpus.json');
const manifestFile = path.join(root, 'audio/voice-manifest.json');
const corpus = JSON.parse(fs.readFileSync(corpusFile, 'utf8'));
const current = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const voice = 'en-US-GuyNeural';
const loc = 'en-US';
const args = new Set(process.argv.slice(2));
const letterOpt = process.argv.indexOf('--letter');
const chosenLetter = letterOpt < 0 ? null : process.argv[letterOpt + 1]?.toUpperCase();
const all = args.has('--all');
const generate = args.has('--generate');
const verify = args.has('--verify');
if (![generate, verify, args.has('--plan')].filter(Boolean).length || [generate, verify, args.has('--plan')].filter(Boolean).length !== 1)
  throw new Error('Choose exactly one of --plan, --verify, or --generate.');
if (chosenLetter && !/^[A-Z]$/.test(chosenLetter)) throw new Error('--letter must be A–Z.');
if (all && chosenLetter) throw new Error('Use either --all or --letter, not both.');
if (generate && !all && !chosenLetter) throw new Error('To limit synthesis costs, --generate requires --letter A or --all.');
if (current.schema !== 1 || corpus.schema !== 1 || current.voice !== voice || corpus.targetVoice !== voice)
  throw new Error('Corpus and manifest voice/schema mismatch.');

const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 20);
const wordKey = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-');
const tasks = [];
const scopedWordSet = new Set(corpus.wordPlacements.filter(x => all || !chosenLetter || x.letter === chosenLetter).map(x => x.word));
for (const x of corpus.letterNames) if (all || !chosenLetter || x.letter === chosenLetter)
  tasks.push({kind:'letter',name:x.letter,text:x.letter,rel:'audio/files/letters/'+x.letter.toLowerCase()+'.mp3'});
for (const word of corpus.vocabulary) if (scopedWordSet.has(word)) {
  for (const speed of ['normal','slow']) tasks.push({kind:'word',name:word,speed,text:word,rel:'audio/files/words/'+wordKey(word)+'-'+speed+'.mp3'});
}
// Select sentences by matching their exact static-HTML word cards, not by substring searches:
// The checked-in corpus includes a distinct sentence-to-letter association below.
const sPlacements = corpus.sentencePlacements || [];
if (!sPlacements.length) throw new Error('Corpus missing sentencePlacements. Re-export the speech corpus.');
const scopedSentences = new Set(sPlacements.filter(x => all || !chosenLetter || x.letter === chosenLetter).map(x => x.sentence));
for (const sentence of corpus.sentences) if (scopedSentences.has(sentence))
  tasks.push({kind:'sentence',name:sentence,text:sentence,rel:'audio/files/sentences/'+sha(sentence)+'.mp3'});

function isMp3(file) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 700) return false;
  const head = Buffer.alloc(3), fd = fs.openSync(file,'r');
  try {fs.readSync(fd,head,0,3,0);} finally {fs.closeSync(fd);}
  return head.toString('latin1') === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
}
const absolute = task => path.join(root,task.rel);
function registered(task, m) {
  if(task.kind==='letter') return m.letters[task.name] === task.rel;
  if(task.kind==='sentence') return m.sentences[task.name] === task.rel;
  return m.words[task.name]?.[task.speed] === task.rel;
}
function register(task,m) {
  if(task.kind==='letter') m.letters[task.name] = task.rel;
  else if(task.kind==='sentence') m.sentences[task.name] = task.rel;
  else { m.words[task.name] ||= {}; m.words[task.name][task.speed] = task.rel; }
}
const missing = tasks.filter(t => !isMp3(absolute(t)) || !registered(t,current));
const stats = {voice,scope:all?'all':chosenLetter||'all',expected:tasks.length,registeredAndPresent:tasks.length-missing.length,missing:missing.length,byType:Object.fromEntries(['letter','word','sentence'].map(k=>[k,tasks.filter(t=>t.kind===k).length]))};
if (args.has('--plan')) {console.log(JSON.stringify(stats,null,2));process.exit(0);}
if (verify) {
  console.log(JSON.stringify({...stats,missingSample:missing.slice(0,12).map(t=>t.rel)},null,2));
  if(missing.length)process.exitCode=1;
} else {
  const key=process.env.AZURE_SPEECH_KEY || process.env.SPEECH_KEY;
  const region=process.env.AZURE_SPEECH_REGION || process.env.SPEECH_REGION;
  if(!key || !region)throw new Error('Required: AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (secrets, never commit keys).');
  if(!/^[a-z0-9-]+$/.test(region))throw new Error('Invalid region name.');
  const m=structuredClone(current);
  const xml = x => x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  async function synth(task) {
    const content=task.kind==='letter' ? '<say-as interpret-as="characters">'+xml(task.text)+'</say-as>' : xml(task.text);
    const rate=task.speed==='slow' ? '-27%' : task.kind==='sentence' ? '-8%' : '0%';
    const ssml='<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="'+loc+'"><voice name="'+voice+'"><prosody rate="'+rate+'">'+content+'</prosody></voice></speak>';
    const endpoint='https://'+region+'.tts.speech.microsoft.com/cognitiveservices/v1';
    for (let attempt=1; attempt<=4; attempt++) {
      const response=await fetch(endpoint,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':key,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3','User-Agent':'foundation-english-student-book'},body:ssml,signal:AbortSignal.timeout(40000)});
      if(response.ok) {
        const buf=Buffer.from(await response.arrayBuffer());
        const file=absolute(task);fs.mkdirSync(path.dirname(file),{recursive:true});
        const part=file+'.part';fs.writeFileSync(part,buf);
        if(!isMp3(part)) {fs.rmSync(part,{force:true});throw new Error('Invalid MP3 from Azure: '+task.rel);}
        fs.renameSync(part,file);
        return;
      }
      if((response.status===429||response.status>=500)&&attempt<4) {
        await new Promise(resolve=>setTimeout(resolve,attempt*1500));continue;
      }
      throw new Error('Speech API HTTP '+response.status+' for '+task.rel+': '+(await response.text()).slice(0,160));
    }
  }
  let created=0, reused=0;
  for (const [i,task] of tasks.entries()) {
    if(!isMp3(absolute(task))) {await synth(task);created++;} else reused++;
    register(task,m);
    // Save manifest after each success; interruptions never register nonexistent files.
    fs.writeFileSync(manifestFile,JSON.stringify(m,null,2)+'\n');
    if((i+1)%20===0)console.log('Verified '+(i+1)+'/'+tasks.length+' clips');
  }
  console.log(JSON.stringify({created,reused,manifest:manifestFile,totalRegistered:tasks.length,voice},null,2));
}
