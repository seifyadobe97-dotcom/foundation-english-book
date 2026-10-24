import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const root="step-grammar-student/";
const names=["lesson-stage-clarity.js","clarity-future-06.js","clarity-arrangements-07.js",
"clarity-time-08.js","clarity-present-perfect-09.js","clarity-perfect-continuous-10.js",
"clarity-perfect-continuous-extra.js","clarity-perfect-continuous-finish.js",
"clarity-past-perfect-11.js","clarity-past-perfect-continuous-12.js",
"clarity-future-perfect-combo-13.js","clarity-used-to-14.js","clarity-modals-15.js"];
const context={window:{}};
for(const file of names)runInNewContext(readFileSync(root+file,"utf8"),context,{filename:file});
const expected={
 "past-perfect":["had-participle","after-clause","past-cause","shown-participle","reported-earlier","past-questions"],
 "past-perfect-continuous":["form","past-duration","waiting","since-for","compare"],
 "future-continuous-future-perfect":["future-cont-form","future-cont-scene","future-perfect-form","deadline","years","compare"],
 "used-to-be-used-to-get-used-to":["used-to-habit","used-to-be","past-time-markers","negatives-and-questions","be-used-to","get-used-to","compare-three"],
 "modals-fundamentals":["modal-form","present-obligation","past-obligation","no-obligation","polite-requests","ability","advice"]
};
const data=context.window.StepStageClarity;
let audited=0;
for(const [slug,ids] of Object.entries(expected)){
 const stages=data[slug];assert(Array.isArray(stages)&&stages.length===ids.length,"Missing or extra stages "+slug);
 for(const [i,row] of stages.entries()){
  assert(row[0]===ids[i],"Section ID/order mismatch "+slug+"/"+i);
  assert(row.length===7&&row[1].length>12&&row[2].length>70,"Explanation missing "+slug+"/"+i);
  assert(/[\u0600-\u06ff]/.test(row[2]),"Arabic explanation "+slug+"/"+i);
  assert(row[3].length===3&&row[3].every(part=>part.length===2&&/[A-Za-z]/.test(part[0])&&/[\u0600-\u06ff]/.test(part[1])),"English left-to-right pieces need Arabic roles "+slug+"/"+i);
  assert(/[A-Za-z]/.test(row[4])&&/[\u0600-\u06ff]/.test(row[5]),"Bilingual example "+slug+"/"+i);
  assert(row[6].length===3&&row[6][0].length>12&&row[6][1].length>=2&&row[6][2].length>12,"Answer plus explanation "+slug+"/"+i);
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key/i.test(JSON.stringify(row)),"Source confidentiality "+slug+"/"+i);
  audited++;
 }
}
assert.equal(audited,31);
assert.equal(Object.keys(data).length,15,"All first 15 lessons must remain reviewed");
assert.equal(Object.values(data).reduce((n,v)=>n+v.length,0),88);
const builder=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const bundle of names.slice(8))assert(builder.includes('"'+bundle+'"'),"Builder omits "+bundle);
console.log("PASS: 31 new beginner Arabic stages; 88 stages across 15 lessons; safe ordering, schema, and publishing bundle");
