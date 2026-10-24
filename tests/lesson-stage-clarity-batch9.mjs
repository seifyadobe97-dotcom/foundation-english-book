import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const files=["clarity-so-neither-41.js","clarity-advanced-42.js","clarity-questions-43.js","clarity-wh-44.js","clarity-order-45.js"];
const expected={
"so-neither-agreement":["neither-nor-subjects","neither-nor-objects","negative-agree-do","negative-agree-perfect","positive-agree-so"],
"advanced-conditionals":["mixed-past-now","inverted-had","inverted-should"],
"question-formation":["present-do","past-did","wh-order","perfect-echo"],
"question-words":["who-subject","which-choice","whose-whom","what-how"],
"correct-word-order":["embedded","svo","sequence","requests"]
};
const c={window:{}};
for(const file of ["lesson-stage-clarity.js",...files])runInNewContext(readFileSync("step-grammar-student/"+file,"utf8"),c,{filename:file});
let count=0;
for(const [slug,stageIds] of Object.entries(expected)){
 const stages=c.window.StepStageClarity[slug];assert.equal(stages?.length,stageIds.length,"Expected stages "+slug);
 stages.forEach((r,i)=>{
  assert(r.length===7&&r[0]===stageIds[i],"Stage ID, ordering "+slug+"/"+i);
  assert(r[1].length>8&&r[2].length>70&&r[2].includes("خطأ شائع"),"Explanation and pitfall "+slug+"/"+i);
  assert(r[3].length===3&&r[3].every(p=>p.length===2&&/[a-z]/i.test(p[0])&&/[\u0600-\u06ff]/.test(p[1])),"English parts and Arabic explanation "+slug+"/"+i);
  assert(/[a-z]/i.test(r[4])&&/[\u0600-\u06ff]/.test(r[5]),"Example and translation "+slug+"/"+i);
  assert(r[6].length===3&&r[6][0].length>12&&r[6][1].trim().length>=1&&r[6][2].length>12,"Ungraded check and answer reasoning "+slug+"/"+i);
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key/i.test(JSON.stringify(r)),"No private source metadata");
  count++;
 });
}
assert.equal(count,20);
const build=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const filename of files)assert(build.includes('"'+filename+'"'),"Public allowlist excludes "+filename);
console.log("PASS: 20 complete stage-specific Arabic teaching units for final Grammar 41–45");
