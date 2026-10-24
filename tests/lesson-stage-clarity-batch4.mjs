import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
// Only instructor-authored content; no protected questions or keys.
const root="step-grammar-student/";
const files=["clarity-deduction-16.js","clarity-passive-17.js","clarity-modal-passive-18.js","clarity-pronouns-19.js","clarity-articles-20.js"];
const expected={
 "modals-of-deduction":["base-modal","present-possibility","negative-uncertainty","certainty","present-continuous","past-inference"],
 "passive-voice-by-tense":["active-vs-passive","present-simple","present-continuous","past-simple","past-continuous","present-perfect","past-perfect","future-simple","future-perfect"],
 "modal-passive":["intro","necessity","possibility","time-contrast","past-conditional","past-deduction"],
 "pronouns":["subject","object","possessive-adj","possessive-pron","reflexive","indefinite","demonstrative","reciprocal"],
 "articles-countability":["indefinite-article","definite-zero","much-many","some-any","few-little","lots-plenty"]
};
const ctx={window:{}};
for(const name of ["lesson-stage-clarity.js",...files])runInNewContext(readFileSync(root+name,"utf8"),ctx,{filename:name});
const data=ctx.window.StepStageClarity;let checked=0;
for(const [slug,ids] of Object.entries(expected)){
 const rows=data[slug];
 assert(Array.isArray(rows)&&rows.length===ids.length,"Count/order "+slug);
 rows.forEach((row,i)=>{
  assert.equal(row.length,7,"All teaching fields "+slug+"/"+i);
  assert.equal(row[0],ids[i],"Stage identity "+slug+"/"+i);
  assert(row[1].length>=13&&row[2].length>70,"Detailed Arabic explanation "+slug+"/"+i);
  assert(/[\u0600-\u06ff]/.test(row[2])&&/خطأ شائع/.test(row[2]),"Arabic + common pitfall "+slug+"/"+i);
  assert(row[3].length===3&&row[3].every(p=>p.length===2&&/[A-Za-z]/.test(p[0])&&/[\u0600-\u06ff]/.test(p[1])),"LTR English / Arabic role "+slug+"/"+i);
  assert(/[A-Za-z]/.test(row[4])&&/[\u0600-\u06ff]/.test(row[5]),"English sentence + Arabic translation "+slug+"/"+i);
  assert(row[6].length===3&&row[6][0].length>12&&row[6][1].trim().length>=1&&row[6][2].length>12,"Ungraded check + reasoning "+slug+"/"+i);
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key/i.test(JSON.stringify(row)),"Private bank safety "+slug+"/"+i);
  checked++;
 });
}
assert.equal(checked,35);
assert.equal(Object.keys(data).length,10);
assert.equal(Object.values(data).reduce((n,a)=>n+a.length,0),61);
const build=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const name of files)assert(build.includes('"'+name+'"'),"Bundle missing from public allowlist: "+name);
const html=readFileSync("step-grammar-student/lesson.html","utf8");
assert(!files.some(f=>html.includes(f)),"Bundle tags inserted only into built site");
console.log("PASS: 35 beginner stages across Grammar 16-20; source-aligned IDs, clear Arabic, checks, private-bank protection");
