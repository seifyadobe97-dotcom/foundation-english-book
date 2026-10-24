import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const names=["clarity-future-06.js","clarity-arrangements-07.js","clarity-time-08.js","clarity-present-perfect-09.js","clarity-perfect-continuous-10.js","clarity-perfect-continuous-extra.js","clarity-perfect-continuous-finish.js"];
const context={window:{}};
for(const file of ["lesson-stage-clarity.js",...names]){
 runInNewContext(readFileSync("step-grammar-student/"+file,"utf8"),context,{filename:file});
}
const data=context.window.StepStageClarity;
const expected={
 "will-be-going-to":["will-form","will-uses","going-to-form","going-to-uses","contrast","about-to","step-strategy"],
 "future-arrangements":["arrangement-form","arrangement-negatives-questions","future-form-contrast","official-timetables","step-future-strategy"],
 "time-clauses":["when-third-person","before-main-clause","when-plural","when-the-term","until-present-perfect"],
 "present-perfect":["form","experience","questions","just-already","yet-still","repeated-superlative","since-for"],
 "present-perfect-continuous":["structure","since","for","repeated","result","ongoing-task","context"]
};
let count=0;
for(const [slug,ids] of Object.entries(expected)){
 const rows=data[slug];assert(Array.isArray(rows)&&rows.length===ids.length,"Missing stage in "+slug);
 for(const [i,row] of rows.entries()){
  assert(row.length===7 && row[0]===ids[i],"Stage identity/order: "+slug+"/"+i);
  assert(row[1].length>12&&row[2].length>70,"Too little explanation in "+slug+"/"+i);
  assert(/[\u0600-\u06FF]/.test(row[2]),"Missing Arabic explanation "+slug+"/"+i);
  assert(Array.isArray(row[3])&&row[3].length===3,"Sentence breakdown: "+slug+"/"+i);
  for(const pair of row[3])assert(pair.length===2&&/[A-Za-z]/.test(pair[0])&&/[\u0600-\u06FF]/.test(pair[1]),"Arabic role missing "+slug+"/"+i);
  assert(/[A-Za-z]/.test(row[4])&&/[\u0600-\u06FF]/.test(row[5]),"Bilingual example "+slug+"/"+i);
  assert(row[6].length===3&&row[6][0].length>12&&row[6][1].length>=2&&row[6][2].length>12,"Explanation of self-check "+slug+"/"+i);
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|question_id|correct_key|private bank/i.test(JSON.stringify(row)),"Protect internal source metadata "+slug);
  count++;
 }
}
assert.equal(count,31);
assert.equal(Object.keys(data).length,10,"Five earlier reviewed lessons preserved alongside five new lessons");
console.log("PASS: 31 new Arabic stage reviews, 10 fully reviewed lessons total; IDs, bilingual directions and source privacy");
