import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const read=path=>readFileSync(path,"utf8");
const migration=read("supabase/migrations/20261024_step_writing_analysis_source_skill_expansion.sql");
const admin=read("step-grammar-admin/curriculum.html");
const student=read("step-grammar-student/index.html");
const edge=read("supabase/functions/step-admin/index.ts");
const prior=read("supabase/migrations/20261024_step_writing_analysis_taxonomy_separation.sql");

const mapping=[
 ["ASGQINSERT","sequencing"],
 ["ASGQCOMBINE","sentence-combining"],
 ["ASGQLOGCOMP","logical-sentence-completion"],
 ["ASGQSPELL","spelling-word-recognition"]
];
for(const [code,slug] of mapping){
 assert(migration.includes("code='"+code+"'"),code+" must be mapped from verified source");
 assert(migration.includes("indicator_slug='"+slug+"'"),slug+" must be the intended skill");
}
assert(!/WHERE code='ASGQWOR'/.test(migration),"Grammar word order must remain unchanged");
assert(prior.includes("'ASGQLINKCAUSE'")&&prior.includes("indicator_slug='logical-connectors'"),
 "The earlier primary Writing connector correction must be preserved");
assert(migration.includes("status,legacy_course_code")&&migration.includes("'draft',null"),
 "Writing skills must stay draft, not impersonate published courses");
assert(!/\b(?:UPDATE|DELETE\s+FROM)\s+public\.step_(?:part_attempts|exam_attempts|question_attempt_details|private_course_banks)\b/i.test(migration),
 "Never rewrite question or student progress tables during taxonomy correction");
assert(migration.includes("ENABLE ROW LEVEL SECURITY")&&migration.includes("REVOKE ALL")&&migration.includes("service_role"),
 "Change ledger must be private");
assert(migration.includes("SECURITY INVOKER")&&migration.includes("FOR UPDATE")&&migration.includes("INSERT INTO public.step_curriculum_classification_changes"),
 "Taxonomy changes must be atomic and audit-logged");
assert(edge.includes('permission.role!=="owner"')&&edge.includes('admin.rpc("step_reassign_classification"'),
 "Taxonomy edits must be owner gated through the transactional RPC");
assert(admin.includes("[data-remap-code]")&&admin.includes("mappingReason(")&&admin.includes("protectedCodes"),
 "Admin must offer reasoned reclassification and protect published courses");
assert(admin.includes("writingReviewCodes=new Set([])"),
 "Grammar sentence-correction review must not be mislabeled as Writing");
// The owner retained eight skills: exactly five from the book and three from audited bank sources.
const eightDecision=read("curriculum/WRITING_ANALYSIS_EIGHT_SKILLS_OWNER_DECISION_20261024.md");
const fiveBook=["punctuation","capitalization","sequencing","logical-connectors","error-recognition"];
const threeBank=["sentence-combining","logical-sentence-completion","spelling-word-recognition"];
assert(admin.includes('const writingBookSkills=new Set('+JSON.stringify(fiveBook)+')'),
 "Admin must retain the source book's five units in their original order");
assert(admin.includes('const writingBankSkills=new Set('+JSON.stringify(threeBank)+')'),
 "Admin must label all three additional bank-derived skills");
assert(admin.includes('id="writing-eight-summary"')&&admin.includes("8 مهارات"),
 "Admin must display the approved 8=5+3 curriculum decision");
assert(admin.includes("توسعة بنك الأسئلة")&&admin.includes("من الكتاب"),
 "Editor must distinguish the original five units from the bank extensions");
for(const slug of [...fiveBook,...threeBank]){
 assert(eightDecision.includes('('+String.fromCharCode(96)+slug+String.fromCharCode(96)+')'),
  "Internal approval record is missing "+slug);
}

assert(student.includes('data-axis-code=')&&student.includes("axis-feedback")&&student.includes("المحتوى قيد الإعداد"),
 "Student axis selection must describe the actual published readiness");
for(const path of ["step-grammar-admin/curriculum.html","step-grammar-student/index.html"]){
 for(const match of read(path).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
  if(match[1].trim())new Script(match[1],{filename:path});
 }
}
console.log("PASS Writing Analysis taxonomy: verified mappings, private audit, owner workflow, safe student navigation");
