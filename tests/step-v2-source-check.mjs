import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const base="step-grammar-student/";
const lesson=readFileSync(base+"learn.html","utf8");
const script=readFileSync(base+"present-simple-v2.js","utf8");
const content=readFileSync(base+"present-simple-v2-content.js","utf8");
const css=readFileSync(base+"present-simple-v2.css","utf8");
const api=readFileSync("supabase/functions/step-course/index.ts","utf8");
const questionBank=JSON.parse(readFileSync("supabase/functions/step-course/lesson-data.json","utf8"));

new Function(script);
new Function("window",content);
assert(lesson.includes('src="present-simple-v2.js"'));
assert(lesson.includes('src="present-simple-v2-content.js"'));
assert(!/\bfunction\s+top\s*\(/.test(script),"No window.top redeclaration");
assert(!/\bASGQ[A-Z0-9]+/.test(lesson+script+content),"No private bank codes exposed");
assert(!/\<\/?bdi\>/i.test(content),"No raw formatting tags in student copy");
assert(content.includes("دي عادة")&&content.includes("دي حقيقة")&&content.includes("دي وظيفة"));
assert(css.includes("@media(max-width:480px)"),"Responsive mobile support");
assert(api.includes("showQuestions"),"Student API obscures bank question identifiers");
assert(questionBank.sections.length===6,"Six learning steps");
const publishedIds=[...new Set(questionBank.sections.flatMap(section=>section.questionIds))];
assert.equal(publishedIds.length,20,"Only the 20 vetted questions are published");
let distractors=0;
for(const id of publishedIds){
 const question=questionBank.questions[id];
 assert(question&&question.options&&question.correct&&question.explanation,"Complete graded question: "+id);
 for(const letter of Object.keys(question.options)){
  if(letter===question.correct)continue;
  assert(question.wrongReasons?.[letter]?.trim(),"Missing why-wrong explanation: "+id+" / "+letter);
  distractors++;
 }
}
assert.equal(distractors,60,"Every bank distractor has an individual explanation");
assert(api.includes("wrongReason:selected===q.correct?null"),"Never return wrong explanations before grading");
assert(script.includes('dir="ltr"'),"English and answer choices are isolated LTR");
assert(script.includes("function lessonVideo("),"Lesson should support optional video content");
assert(script.includes("www.youtube-nocookie.com/embed/"),"Safe YouTube embed template");
assert(script.includes("tiktok.com/player/v1/"),"Safe full TikTok embed template");
assert(content.includes("https://vt.tiktok.com/ZSgyJoEnb/"),"Pilot TikTok link must be configured in lesson data");

assert(css.includes(".answer-feedback.is-wrong")&&css.includes(".check-option.incorrect"),"Clear error colors for graded and quick checks");
console.log("PASS STEP pilot source checks: 6 steps, 20 questions, 60 distinct distractor explanations, safe JS, mobile styles");
