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
console.log("PASS STEP pilot source checks: 6 steps, student privacy, safe JS, mobile styles");
