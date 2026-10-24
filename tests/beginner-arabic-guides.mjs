import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const file=readFileSync("step-grammar-student/beginner-teaching.js","utf8");
const context={window:{}};
runInNewContext(file,context,{filename:"beginner-teaching.js"});
const data=context.window.StepBeginnerTeaching;
assert(data?.lessons && data?.stages && data?.formulas);
const expected=("subject-verb-agreement present-simple present-continuous past-simple past-continuous will-be-going-to "+
"future-arrangements time-clauses present-perfect present-perfect-continuous past-perfect past-perfect-continuous "+
"future-continuous-future-perfect used-to-be-used-to-get-used-to modals-fundamentals modals-of-deduction "+
"passive-voice-by-tense modal-passive pronouns articles-countability quantity-degree adjectives-and-adverbs "+
"comparatives-superlatives prepositions-of-time-and-place preposition-collocations word-formation gerunds infinitives "+
"bare-infinitives causatives conjunctions-and-connectors relative-clauses zero-conditional first-conditional "+
"second-conditional third-conditional wishes-and-unreal-structures reported-speech indirect-questions question-tags "+
"so-neither-agreement advanced-conditionals question-formation question-words correct-word-order "+
"punctuation capitalization sequencing logical-connectors error-recognition sentence-combining "+
"logical-sentence-completion spelling-word-recognition").split(" ");
assert.equal(expected.length,53);
assert.deepEqual(Object.keys(data.lessons).sort(),expected.sort(),"Beginner guide must cover every published Grammar and Writing lesson");
for(const [slug,parts] of Object.entries(data.lessons)){
 assert(Array.isArray(parts)&&parts.length===5,"Guide must have meaning, pattern, English example, Arabic translation, warning: "+slug);
 for(const val of parts)assert(typeof val==="string"&&val.trim().length>8,slug+" has a missing beginner field");
 assert(/[\u0600-\u06FF]/.test(parts[0])&&/[\u0600-\u06FF]/.test(parts[3]),"Needs Arabic meaning and example translation: "+slug);
 assert(/[A-Za-z]/.test(parts[2]),"English example missing: "+slug);
 assert(!/ASGQ[A-Z0-9]+|TAJMEAAT|answer key|private source/i.test(parts.join(" ")),
  "No instructor source codes or internal provenance exposed: "+slug);
}
assert.equal(data.stages["first-conditional"].length,3,"All three First Conditional stages have teaching breakdowns");
for(const p of data.stages["first-conditional"])assert(p.length===7&&p.every(x=>x?.length>6));
assert.equal(Object.keys(data.formulas).length,9,"Every First Conditional 2-field formula gets a readable Arabic explanation");
for(const parts of Object.values(data.formulas))assert(parts.length===3&&parts.every(v=>v.length>7));
const player=readFileSync("step-grammar-student/lesson-player.js","utf8");
const html=readFileSync("step-grammar-student/lesson.html","utf8");
assert(html.indexOf('beginner-teaching.js')<html.indexOf('lesson-player.js'));
assert(html.includes('beginner-teaching.css'));
assert(player.includes('beginnerTeaching()')&&player.includes('function beginnerTeaching()'));
assert(player.includes('lessonSlug==="first-conditional"'));
console.log("PASS: 53 plain Arabic beginner guides, 3 conditional stages, 9 decoded formulas, correct load order");
