import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const root="step-grammar-student/";
const files=["clarity-degree-21.js","clarity-adverbs-22.js","clarity-comparatives-23.js","clarity-prepositions-24.js","clarity-collocations-25.js"];
const ids={
"quantity-degree":["too-excess","enough-after","too-to","so-that-contrast"],
"adjectives-and-adverbs":["adj-versus-adv","manner","degree-manner","flat-adverbs","certainty","participles-sentence"],
"comparatives-superlatives":["comparative-er","comparative-degree","equality","superlative-adj","superlative-adv"],
"prepositions-of-time-and-place":["in-calendar","on-days","at-night-location","in-at-place","for-duration","since-start"],
"preposition-collocations":["on-verbs","to-collocations","for-verb","contrast-practice"]};
const context={window:{}};
for(const file of ["lesson-stage-clarity.js",...files])runInNewContext(readFileSync(root+file,"utf8"),context,{filename:file});
const content=context.window.StepStageClarity;let total=0;
for(const [slug,required] of Object.entries(ids)){
 const stages=content[slug];assert(Array.isArray(stages)&&stages.length===required.length,"Stages missing "+slug);
 stages.forEach((row,i)=>{
  assert.equal(row.length,7,"Seven explanation fields "+slug+"/"+i);
  assert.equal(row[0],required[i],"Original stage ID/order "+slug+"/"+i);
  assert(row[1].length>8&&row[2].length>70&&row[2].includes("خطأ شائع"),"Relevant concept + warning "+slug+"/"+i);
  assert(row[3].length===3&&row[3].every(p=>p.length===2&&/[A-Za-z]/.test(p[0])&&/[\u0600-\u06ff]/.test(p[1])),"English parts plus Arabic roles "+slug+"/"+i);
  assert(/[A-Za-z]/.test(row[4])&&/[\u0600-\u06ff]/.test(row[5]),"Bilingual example "+slug+"/"+i);
  assert(row[6].length===3&&row[6][0].length>12&&row[6][1].trim().length>=1&&row[6][2].length>12,"Revealable ungraded check "+slug+"/"+i);
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key/i.test(JSON.stringify(row)),"No internal bank metadata "+slug+"/"+i);
  total++;
 });
}
assert.equal(total,25);
const builder=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const name of files)assert(builder.includes('"'+name+'"'),"Public allowlist "+name);
console.log("PASS: "+total+" stage-specific beginner teaching guides for Grammar 21–25, IDs, Arabic/English directions and safe release");
