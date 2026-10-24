import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
// Writing Analysis is a separate learner axis; these are instructor-created ungraded examples.
const files=["clarity-writing-punctuation-01.js","clarity-writing-capitalization-02.js","clarity-writing-sequencing-03.js","clarity-writing-logical-04.js","clarity-writing-errors-05.js","clarity-writing-combining-06.js","clarity-writing-completion-07.js","clarity-writing-spelling-08.js"];
const ids={
"punctuation":["full-stop","comma","appositive","colon","question-exclamation"],
"capitalization":["days-months","languages-subjects","people-titles","places"],
"sequencing":["opening","sequence-words","cause-effect","noun-before-pronoun","sentence-insertion"],
"logical-connectors":["reason","result","contrast","condition-purpose","context-choices"],
"error-recognition":["agreement","uncountable","prepositions","double-subject","verb-forms-time"],
"sentence-combining":["main-idea","remove-repetition","avoid-false-links","final-review"],
"logical-sentence-completion":["central-claim","consistency","best-answer"],
"spelling-word-recognition":["recognize-word","common-changes","meaning-context","verify-choice"]};
const c={window:{}};
for(const file of ["lesson-stage-clarity.js",...files])runInNewContext(readFileSync("step-grammar-student/"+file,"utf8"),c,{filename:file});
let count=0;
for(const [slug,expected] of Object.entries(ids)){
 const rows=c.window.StepStageClarity[slug];
 assert.equal(rows?.length,expected.length,"Writing stage count "+slug);
 rows.forEach((r,i)=>{
  assert.equal(r.length,7,"Seven teaching fields "+slug+"/"+i);
  assert.equal(r[0],expected[i],"Supabase writing stage identity/order "+slug+"/"+i);
  assert(r[1].length>8&&r[2].length>70&&r[2].includes("خطأ شائع"),"Complete Arabic explanation "+slug+"/"+i);
  assert(r[3].length===3&&r[3].every(pair=>pair.length===2&&/[A-Za-z]/.test(pair[0])&&/[\u0600-\u06ff]/.test(pair[1])),"LTR English parts / RTL Arabic roles");
  assert(/[A-Za-z]/.test(r[4])&&/[\u0600-\u06ff]/.test(r[5]),"Standalone bilingual teaching example");
  assert(r[6].length===3&&r[6][0].length>12&&r[6][1].trim().length>=1&&r[6][2].length>12,"Independent ungraded understanding question");
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key/i.test(JSON.stringify(r)),"No internal source identifiers");
  count++;
 });
}
assert.equal(count,35);
assert.equal(Object.keys(c.window.StepStageClarity).length,13,"Original five starter Grammar bundles plus eight Writing bundles");
assert.equal(Object.values(c.window.StepStageClarity).reduce((a,rows)=>a+rows.length,0),61,"Original 26 Grammar stages + 35 new Writing stages");
const build=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const filename of files)assert(build.includes('"'+filename+'"'),"Writing bundle not on explicit public allowlist "+filename);
console.log("PASS: 35 Writing Analysis beginner stage guides across 8 lessons, distinct axis, Arabic/LTR, self-check and bank privacy");
