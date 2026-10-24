import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
// Instructor-authored, ungraded learning checks only. No private STEP assessment content.
const root="step-grammar-student/";
const files=["clarity-wa-punctuation.js","clarity-wa-capitalization.js","clarity-wa-sequencing.js","clarity-wa-connectors.js","clarity-wa-errors.js","clarity-wa-combining.js","clarity-wa-completion.js","clarity-wa-spelling.js"];
const expected={
"punctuation":["full-stop","comma","appositive","colon","question-exclamation"],
"capitalization":["days-months","languages-subjects","people-titles","places"],
"sequencing":["opening","sequence-words","cause-effect","noun-before-pronoun","sentence-insertion"],
"logical-connectors":["reason","result","contrast","condition-purpose","context-choices"],
"error-recognition":["agreement","uncountable","prepositions","double-subject","verb-forms-time"],
"sentence-combining":["main-idea","remove-repetition","avoid-false-links","final-review"],
"logical-sentence-completion":["central-claim","consistency","best-answer"],
"spelling-word-recognition":["recognize-word","common-changes","meaning-context","verify-choice"]
};
const context={window:{}};
for(const file of ["lesson-stage-clarity.js",...files])runInNewContext(readFileSync(root+file,"utf8"),context,{filename:file});
const stages=context.window.StepStageClarity;
let count=0;
for(const [slug,ids] of Object.entries(expected)){
 const rows=stages[slug];
 assert.equal(rows?.length,ids.length,"Live Supabase stage count "+slug);
 rows.forEach((row,i)=>{
  assert.equal(row.length,7,"Seven teaching fields "+slug+"/"+i);
  assert.equal(row[0],ids[i],"Exact bank stage identity "+slug+"/"+i);
  assert(row[1].length>12&&row[2].length>70&&row[2].includes("خطأ شائع"),"Specific Arabic concept, structure and error "+slug+"/"+i);
  assert(row[3].length===3&&row[3].every(p=>p.length===2&&/[A-Za-z]/.test(p[0])&&/[\u0600-\u06ff]/.test(p[1])),"Three isolated English sentence chunks with Arabic roles "+slug+"/"+i);
  assert(/[a-z]/i.test(row[4])&&/[\u0600-\u06ff]/.test(row[5]),"English sentence and Arabic translation "+slug+"/"+i);
  assert(row[6].length===3&&row[6][0].length>12&&row[6][1].trim().length>=1&&row[6][2].length>12,"Ungraded independent question, reveal answer and reasoning "+slug+"/"+i);
  assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|private bank|question_id|correct_key|source_locator/i.test(JSON.stringify(row)),"No secret bank material "+slug+"/"+i);
  count++;
 });
}
assert.equal(count,35,"All eight published Writing Analysis lessons have 35 stages");
assert.equal(Object.keys(stages).length,13,"Five historical Grammar lessons plus eight Writing Analysis lessons loaded");
const b=readFileSync("scripts/build-step-public-site.mjs","utf8");
for(const filename of files)assert(b.includes('"'+filename+'"'),"Safe public build is missing "+filename);
const browser=readFileSync("tests/lesson-stage-clarity-browser.mjs","utf8");
for(const filename of files)assert(browser.includes('"'+filename+'"'),"Responsive browser audit missing "+filename);
const player=readFileSync(root+"lesson-player.js","utf8");
assert(player.includes('beginner-check')&&player.includes('reviewedStage()'),"Original separate reveal-check mechanism must remain");
console.log("PASS Writing Analysis: 8 lessons, 35 beginner teaching stages with exact Supabase IDs, Arabic/LTR chunks, responsive coverage, private-bank protection");
