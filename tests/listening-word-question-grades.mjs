import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const draft=read("supabase/migrations/20261025_stage_sad_listening_question.sql");
const api=read("supabase/functions/step-listening-live/index.ts");
const admin=read("step-grammar-admin/listening-audio.html");
const student=read("step-grammar-student/listening-live.html");
const player=read("step-grammar-student/listening-player.js");
const hub=read("step-grammar-student/curriculum-hub.js");
const main=read("step-grammar-student/index.html");
assert(draft.includes("record-3"),"Word SAD Listening question must be staged");
assert(draft.includes("It happens in dark months")&&draft.includes("'B'"),"Word SAD Q1 answer");
assert(draft.includes("reason for differences in SAD symptoms")&&draft.includes("'C'"),"Word SAD Q2 answer");
assert(draft.includes("light box treatment")&&draft.includes("'A'"),"Word SAD Q3 answer");
assert(draft.includes("'draft'"),"No missing audio question should publish");
assert(api.includes('["record-1","record-2","record-3"]'),"Uploader accepts all three audio questions");
assert(api.includes("items.data.length>10")&&!api.includes("items.data?.length!==2"),"Variable MCQ count");
assert(api.includes('"/admin/catalog"')&&api.includes('"/admin/grades"'),"Owner can manage prepared questions and scores");
assert(api.includes('"/progress"')&&api.includes('step_listening_responses'),"Student grades based on saved answer rows");
assert(admin.includes("question-catalog")&&admin.includes("grade-rows"),"Owner question bank and results panels");
assert(admin.includes("questionCount")&&admin.includes("duration(file)"),"Independent upload metadata is verified");
assert(student.includes("grade-history")&&student.includes("refreshProgress()"),"Student official grade history");
assert(main.includes("window.StepListeningProgressLoader"),"Dashboard Listening results supported");
assert(hub.includes("درجاتك في الاستماع"),"Main student hub shows Listening scores");
assert(!student.includes("مجموعة"),"Student should see Listening question naming");
assert(!player.includes("المجموعة"),"Player must not use group terminology");
assert(!student.includes('type="file"'),"Never request audio upload from student");
assert(!student.includes("correct_choice")&&!student.includes("SUPABASE_SERVICE_ROLE_KEY"));
for(const html of [admin,student,main]){
 for(const code of html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)){
   new Script(code[1]);
 }
}
console.log("PASS Word SAD draft, 3 graded MCQs, private owner upload, student Listening grade history");
