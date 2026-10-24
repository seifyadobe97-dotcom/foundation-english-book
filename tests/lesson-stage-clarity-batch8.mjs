import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const files=["clarity-third-36.js","clarity-wishes-37.js","clarity-reported-38.js","clarity-indirect-39.js","clarity-tags-40.js"];
const expected={
"third-conditional":["past-perfect","perfect-result","combined-modal-passive"],
"wishes-and-unreal-structures":["wish-present","wish-regret","as-if","would-rather"],
"reported-speech":["reported-yesno","reported-wh","backshift-goingto","future-in-past"],
"indirect-questions":["wh-subject-verb","nested-long-subject","be-location","passive-indirect","if-whether"],
"question-tags":["positive-main","negative-main","lets-shall","imperatives"]};
const c={window:{}};
for(const file of ["lesson-stage-clarity.js",...files])runInNewContext(readFileSync("step-grammar-student/"+file,"utf8"),c,{filename:file});
let n=0;
for(const [slug,ids] of Object.entries(expected)){
 const rows=c.window.StepStageClarity[slug];assert.equal(rows?.length,ids.length,"Lesson stage count "+slug);
 rows.forEach((r,i)=>{
  assert(r.length===7&&r[0]===ids[i],"Stage ID/order "+slug+"/"+i);
  assert(r[1].length>8&&r[2].length>70&&r[2].includes("خطأ شائع"),"Explanation and mistake "+slug+"/"+i);
  assert(r[3].length===3&&r[3].every(p=>p.length===2&&/[a-z]/i.test(p[0])&&/[\u0600-\u06ff]/.test(p[1])),"Three LTR parts with Arabic roles");
  assert(/[a-z]/i.test(r[4])&&/[\u0600-\u06ff]/.test(r[5]),"Bilingual example");
  assert(r[6].length===3&&r[6][0].length>12&&r[6][1].trim().length>=1&&r[6][2].length>12,"Revealable answer + reasoning");
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key/i.test(JSON.stringify(r)),"Safe public content");
  n++;
 });
}
assert.equal(n,20);
const build=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const x of files)assert(build.includes('"'+x+'"'),"Include safe file "+x);
console.log("PASS: 20 beginner stage-by-stage teaching units for Grammar 36–40");
