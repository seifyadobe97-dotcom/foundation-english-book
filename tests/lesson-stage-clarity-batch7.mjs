import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const bundles=["clarity-connectors-31.js","clarity-relative-32.js","clarity-zero-33.js","clarity-first-34.js","clarity-second-35.js"];
const ids={
"conjunctions-and-connectors":["reason","result","contrast","time","other"],
"relative-clauses":["who-subject","whom-object","which-that","whose-owner","where-when"],
"zero-conditional":["zero-truths","zero-habits","zero-vs-first"],
"first-conditional":["future-if","will-result","modal-conditional"],
"second-conditional":["unreal-were","past-form-if","would-result"]};
const context={window:{}};
for(const file of ["lesson-stage-clarity.js",...bundles])runInNewContext(readFileSync("step-grammar-student/"+file,"utf8"),context,{filename:file});
let n=0;
for(const [slug,expected] of Object.entries(ids)){
 const rows=context.window.StepStageClarity[slug];assert.equal(rows?.length,expected.length,"Stages "+slug);
 rows.forEach((row,i)=>{
  assert.equal(row.length,7,"Seven pedagogic fields "+slug+"/"+i);
  assert.equal(row[0],expected[i],"Database stage ID/order "+slug+"/"+i);
  assert(row[1].length>8&&row[2].length>70&&row[2].includes("خطأ شائع"),"Arabic concept, pattern and error "+slug+"/"+i);
  assert(row[3].length===3&&row[3].every(p=>p.length===2&&/[A-Za-z]/.test(p[0])&&/[\u0600-\u06ff]/.test(p[1])),"Three annotated sentence parts "+slug+"/"+i);
  assert(/[a-z]/i.test(row[4])&&/[\u0600-\u06ff]/.test(row[5]),"Translated LTR example "+slug+"/"+i);
  assert(row[6].length===3&&row[6][0].length>12&&row[6][1].trim().length>=1&&row[6][2].length>12,"Ungraded interactive self-check "+slug+"/"+i);
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key/i.test(JSON.stringify(row)),"No internal source codes "+slug+"/"+i);
  n++;
 });
}
assert.equal(n,19);
const builder=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const f of bundles)assert(builder.includes('"'+f+'"'),"Missing learner-safe script: "+f);
console.log("PASS: 19 beginner Arabic stages in Grammar 31–35 with stable source IDs, LTR/RTL, self-checks and private-bank safety");
