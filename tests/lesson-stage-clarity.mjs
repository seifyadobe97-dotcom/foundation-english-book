import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const c={window:{}};
runInNewContext(readFileSync("step-grammar-student/lesson-stage-clarity.js","utf8"),c);
const items=c.window.StepStageClarity;
const expected={
 "subject-verb-agreement":["subject","singular-plural","tricky-subjects","be-agreement","does-base"],
 "present-simple":["uses","affirmative","spelling","negative","questions","practice"],
 "present-continuous":["now","speaking","changing","negative","arrangements"],
 "past-simple":["regular","irregular","be","story","negative"],
 "past-continuous":["formation","while","when","questions","plans"]
};
assert.deepEqual(Object.keys(items).sort(),Object.keys(expected).sort());
let total=0;
for(const [slug,ids] of Object.entries(expected)){
 const rows=items[slug];assert.equal(rows.length,ids.length,slug+" needs all stages");
 rows.forEach((r,i)=>{
  assert.equal(r.length,7);assert.equal(r[0],ids[i],"Do not mismatch bank stage order");
  assert(r[1].length>12&&r[2].length>70,slug+" weak explanation");
  assert(/[\u0600-\u06FF]/.test(r[2]),"Arabic explanation required");
  assert(Array.isArray(r[3])&&r[3].length===3);
  for(const pair of r[3]){
   assert.equal(pair.length,2);
   assert(/[a-z]/i.test(pair[0])&&/[\u0600-\u06FF]/.test(pair[1]),"Each English part needs Arabic function");
  }
  assert(/[a-z]/i.test(r[4])&&/[\u0600-\u06FF]/.test(r[5]),"Bilingual example");
  assert(Array.isArray(r[6])&&r[6].length===3&&r[6].every(x=>x.length>3),"Reveal check");
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|مصدر الأسئلة|original question bank/i.test(r.join(" ")));
  total++;
 });
}
assert.equal(total,26);
const p=readFileSync("step-grammar-student/lesson-player.js","utf8");
const html=readFileSync("step-grammar-student/lesson.html","utf8");
assert(p.includes("reviewedStage()")&&p.includes("row[0]!==state.course?.sections?.[state.index]?.id"),"Mismatch must safely fall back");
assert(p.includes('beginner-check')&&p.includes("اكشف الإجابة"));
assert(html.indexOf("beginner-teaching.js")<html.indexOf("lesson-stage-clarity.js"));
assert(html.indexOf("lesson-stage-clarity.js")<html.indexOf("lesson-player.js"));
console.log("PASS: "+total+" stage-specific Arabic beginner lessons, LTR part breakdowns and independent checks");
