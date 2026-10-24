import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const read=f=>readFileSync(f,"utf8");
const api=read("supabase/functions/step-course/index.ts");
const adminApi=read("supabase/functions/step-admin/index.ts");
const studio=read("step-grammar-admin/studio.html");
const curriculum=read("step-grammar-admin/curriculum.html");
const student=read("step-grammar-student/index.html");
const studentUx=read("step-grammar-student/student-experience.js");
const player=read("step-grammar-student/lesson-player.js");
const report=read("curriculum/WRITING_ANALYSIS_PRIVATE_BANK_STAGING_20261024.md");
const codes=["ASGQWAPUN01","ASGQWACAP01","ASGQWASEQ01","ASGQWALINK01",
 "ASGQWAERR01","ASGQWACOMB01","ASGQWALCOMP01","ASGQWASPELL01"];
assert(api.includes('.in("axis_code",["grammar","writing-analysis"])'),
 "Published Writing indicators must use explicit allowed axes");
assert(api.includes('data.status!=="published"')&&!api.includes('status==="draft"||'),
 "No dynamic lesson route may accept draft status");
assert(api.includes('guideResult.data?.published')&&api.includes('simResult.data')&&
 api.includes('r.approval_status!=="approved"')&&api.includes('sourceItems')&&
 api.includes('r.review_status!=="approved"'),
 "Source, simulated and published teaching content must pass release gates");
assert(api.includes("publishedWritingModules")&&api.includes("guideModules.length!==lesson.sections.length")&&api.includes("fromGuide")&&api.includes("guide.intro_ar"),
 "Published Writing explanations and source-labeled guide examples must reach the student lesson player");
assert(api.includes("editorialMarker")&&api.includes('["مثال توضيحي",e.en'),
 "Public Writing teaching must not disclose internal source labels or PDF anchors");
assert(api.includes('question_text!==q.text')&&api.includes('r.correct!==q.correct'),
 "Simulated review must match canonical stem and key");
assert(adminApi.includes('.in("axis_code",["grammar","writing-analysis"])')&&
 adminApi.includes("axis_code:i.axis_code"),
 "Studio must list linked, private Writing and Grammar banks");
assert(curriculum.includes("محرر بنك الأسئلة (مسودة)")&&
 curriculum.includes("item.legacy_course_code"),"The Admin editor must link to the bank");
assert(student.includes('["grammar","writing-analysis"].includes(i.axis_code)')&&
 student.includes('app.querySelector("#writing-analysis-lessons")'),
 "Student catalog must load and navigate only the published Writing courses");
assert(studentUx.includes('i.axis_code==="writing-analysis"')&&
 studentUx.includes("writing-analysis-lessons")&&studentUx.includes('additional[item.slug]'),
 "Student writing tiles must depend on authenticated published catalog and API data");
assert(player.includes('state.course.course?.axis_code==="writing-analysis"'),
 "Dynamic lesson player must label Writing lessons correctly");
for(const code of codes){assert(studio.includes(code),code+" must be an admin Studio fallback");assert(report.includes(code),code+" must be documented");}
for(const path of ["step-grammar-admin/studio.html","step-grammar-admin/curriculum.html","step-grammar-student/index.html"]){
 for(const m of read(path).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())new Script(m[1],{filename:path});
}
new Script(studentUx,{filename:"student-experience.js"});
new Script(player,{filename:"lesson-player.js"});
console.log("PASS: eight linked Writing banks are owner editable and student access remains review gated");
