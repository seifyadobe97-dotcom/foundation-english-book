import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const files=["clarity-word-formation-26.js","clarity-gerunds-27.js","clarity-infinitives-28.js","clarity-bare-29.js","clarity-causatives-30.js"];
const expected={
"word-formation":["noun","adjective","adverb","verb","context"],
"gerunds":["verbs-gerund","preposition-gerund","reduced-ing","special-gerund"],
"infinitives":["verb-to","object-to","purpose-to","adj-to"],
"bare-infinitives":["make-base","let-base","modal-base","why-not-lets"],
"causatives":["have-get-object","make-let-person","get-person","help-optional-to"]
};
const c={window:{}};
for(const name of ["lesson-stage-clarity.js",...files])runInNewContext(readFileSync("step-grammar-student/"+name,"utf8"),c,{filename:name});
let count=0;
for(const [slug,ids] of Object.entries(expected)){
 const rows=c.window.StepStageClarity[slug];
 assert.equal(rows?.length,ids.length,"Course section count: "+slug);
 rows.forEach((r,i)=>{
  assert(r.length===7&&r[0]===ids[i],"Stage key/order "+slug+"/"+i);
  assert(r[1].length>8&&r[2].length>70&&r[2].includes("خطأ شائع"),"Meaning, construction, pitfall "+slug+"/"+i);
  assert(r[3].length===3&&r[3].every(x=>x.length===2&&/[a-z]/i.test(x[0])&&/[\u0600-\u06FF]/.test(x[1])),"Three LTR English parts and Arabic functions "+slug+"/"+i);
  assert(/[a-z]/i.test(r[4])&&/[\u0600-\u06FF]/.test(r[5]),"Bilingual example "+slug+"/"+i);
  assert(r[6].length===3&&r[6][0].length>12&&r[6][1].trim().length>=1&&r[6][2].length>12,"Ungraded check + explanation "+slug+"/"+i);
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key/i.test(JSON.stringify(r)),"Private bank confidentiality");
  count++;
 });
}
assert.equal(count,21);
const build=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const filename of files)assert(build.includes('"'+filename+'"'),"Public bundle allowlist "+filename);
console.log("PASS: all 21 distinct Arabic beginner teaching stages for Grammar lessons 26–30");
