import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const fn=read("supabase/functions/step-course/index.ts");
const ui=read("step-grammar-student/index.html");
const student=read("step-grammar-student/student-experience.js");
const allowed=fn.indexOf('if(request.method==="GET"&&path==="/overview")');
const studentGate=fn.indexOf('if(studentAccount.is_active===false)');
const bankQuery=fn.indexOf('const requestedCourseCode=');
assert(studentGate>=0&&allowed>studentGate&&allowed<bankQuery,
  "Bulk overview must run only after real JWT + active student check");
assert(fn.includes('.eq("status","published").in("axis_code",["grammar","writing-analysis"])'),
  "Never use a draft or unapproved curriculum indicator");
assert(fn.includes("step_private_course_banks"),"Published bank availability must be checked privately");
assert(fn.includes("step_simulated_item_reviews")&&fn.includes("step_source_item_reviews"),
 "Writing simulation and source release checks must remain intact in overview");
assert(fn.includes("step_indicator_guides")&&fn.includes("step_lesson_content_edits"));
assert(fn.includes("exam")===true);
const overview=fn.slice(allowed,bankQuery);
assert(!overview.includes("questions:originalQuestions"),"No private answer key in response");
assert(overview.includes("sections:progress.sections.map"),"Only stage-level overview exposed");
assert(overview.includes("unavailable"));
assert(!overview.includes("send(200,{lessons:allBanks"),"Never return entire private bank");
assert(ui.includes('"/functions/v1/step-course/overview"'));
assert(ui.includes("Math.min(6,additional.length)"),"Constrain fallback concurrency");
assert(ui.includes("usedOverview")&&ui.includes("extraLessons:extraResults"));
for(const inline of ui.split("<script>").slice(1))new Script(inline.split("</script>")[0]);
assert(student.includes("extraLessons"),"Preserve current student experience contract");
console.log("PASS overview requires authenticated published bank + Writing audits and preserves fallback");
