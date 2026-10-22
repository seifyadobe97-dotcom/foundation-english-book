/**
 * Regression gate for STEP with Seify account, student and admin portals.
 * Validates inline JavaScript and security-sensitive integration contracts.
 * Does not make any external requests or expose credentials.
 */
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import assert from "node:assert/strict";

const pages = [
  "step-grammar-account-preview/index.html",
  "step-grammar-student/index.html",
  "step-grammar-admin/index.html",
  "step-grammar-admin/reports.html",
  "step-grammar-admin/courses.html",
  "step-grammar-admin/curriculum.html",
  "step-grammar-admin/guide.html",
  "step-grammar-admin/videos.html",
  "step-grammar-student/guide.html",
];
for (const path of pages) {
  const html = readFileSync(path, "utf8");
  assert.match(html, /<html[^>]+lang="ar"/, path + " must declare Arabic language");
  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(match => !/\bsrc\s*=/.test(match[1]));
  assert(inlineScripts.length > 0, path + ": missing inline scripts");
  for (const [, , content] of inlineScripts) new Script(content, { filename:path });
  assert(!/service_role|SUPABASE_SERVICE_ROLE_KEY/.test(html), path + ": must not leak service-role credentials");
  console.log("Validated",path,"scripts:",inlineScripts.length);
}
const signup=readFileSync(pages[0],"utf8");
assert(signup.includes('initialCountry:"sa"'),"Saudi Arabia default country");
assert(signup.includes("iti.isValidNumber()"),"Country-specific phone validation");
assert(signup.includes("iti.getNumber()"),"E.164 phone number storage");
assert(signup.includes("whatsAppContactHtml()"),"WhatsApp contact button");
assert(signup.includes("resetPasswordForEmail"),"Password recovery");
assert(signup.includes("step-grammar-student/"),"Dashboard redirect");
assert(!signup.includes('phone-hint'),"No hint below the phone field");
assert(!signup.includes('small-note">'),"No signup footnotes");
const portal=readFileSync(pages[1],"utf8");
assert(portal.includes("/functions/v1/step-course/course"),"Dashboard must load real course");
assert(portal.includes("step-grammar-account-preview/"),"Dashboard link back to course");
const admin=readFileSync(pages[2],"utf8");
assert(admin.includes("/functions/v1/step-admin"),"Admin must authorize on server");
assert(admin.includes("/questions/save"),"Admin must save question draft");
assert(admin.includes("/questions/publish"),"Admin must publish question");
assert(admin.includes("/questions/archive"),"Admin must archive questions");
assert(admin.includes("export-students"),"Admin CSV export");
const adminServer=readFileSync("supabase/functions/step-admin/index.ts","utf8");
assert(adminServer.includes('permission.role!=="owner"'),"Owner authorization before edits");
const courseServer=readFileSync("supabase/functions/step-course/index.ts","utf8");
assert(courseServer.includes('edit.status!=="published"'),"Draft questions must not go live");
// Lesson content editing must be gated by owner authorization and
// must keep canonical IDs, questions and pass rates untouched.
assert(admin.includes('id="nav-lessons"'),"Admin lesson editor tab");
assert(admin.includes('function renderLessonEditor('),"Admin lesson editor form");
assert(admin.includes('/lessons/save'),"Admin lesson draft save");
assert(admin.includes('/lessons/publish'),"Admin lesson publish");
assert(admin.includes('/lessons/reset'),"Admin lesson original restore");
assert(adminServer.includes('path==="/lessons"'),"Server lesson editor routes");
assert(adminServer.includes('permission.role!=="owner"'),"Owner role required for writes");
assert(courseServer.includes('row.published'),"Only published lesson content is loaded");
assert(courseServer.includes('const editableKeys='),"Lesson edits cannot replace course identifiers");
assert(courseServer.includes('step_lesson_content_edits'),"Persisted published content");
const reports=readFileSync("step-grammar-admin/reports.html","utf8");
assert(reports.includes('"/indicators/"+encodeURIComponent(slug)+"/analytics"'),"Admin reports must load indicator-scoped analytics");
assert(reports.includes('"/report"') || reports.includes('+"/report"'),"Per-student reports must be authenticated");
assert(reports.includes('reportCsvValue') || reports.includes('function download('),"Student report export");
assert(admin.includes('reports.html?indicator=present-simple&student='),"Directory links to the specific published indicator report");
assert(admin.includes('href="reports.html"'),"Admin has analytics navigation");
assert(adminServer.includes('path==="/analytics"'),"Server analytics endpoint");
assert(adminServer.includes('reportMatch'),"Server per-student report endpoint");
const courses=readFileSync("step-grammar-admin/courses.html","utf8");
assert(courses.includes('/course-drafts/save'),"Course planning must save as draft");
assert(courses.includes('/course-drafts/status'),"Course planning must archive/restore drafts");
assert(courses.includes('غير متاحة للطلاب'),"Drafts must not claim to be published");
assert(admin.includes('href="courses.html"'),"Admin navigation must link course builder");
assert(adminServer.includes('path==="/course-drafts"'),"Server course draft route");
assert(adminServer.includes('permission.role!=="owner"'),"Only owner can create courses");
assert(courseServer.includes('const courseCode=lesson.code;'),"Student course remains safely pinned");
const curriculum=readFileSync("step-grammar-admin/curriculum.html","utf8");
assert(curriculum.includes('"/curriculum"'),"Admin curriculum must load axes from backend");
assert(curriculum.includes("/curriculum/indicators/save"),"Admin indicators must save to backend");
assert(curriculum.includes("/curriculum/indicators/status"),"Admin indicators must archive to backend");
const videoAdmin=readFileSync("step-grammar-admin/videos.html","utf8");
const videoMigration=readFileSync("supabase/migrations/20261022_step_indicator_videos.sql","utf8");
assert(videoAdmin.includes('/videos/save')&&videoAdmin.includes('data-save="publish"')&&videoAdmin.includes('data-save="draft"'),
 "Admin can save a private draft then publish a video");
assert(curriculum.includes('videos.html?indicator='),"Every indicator must link to video management");
assert(videoMigration.includes("enable row level security")&&videoMigration.includes("revoke all"),
 "Video drafts must be protected from direct public access");
assert(adminServer.includes('permission.role!=="owner"')&&adminServer.includes('path==="/videos/save"'),
 "Publishing videos requires server-side owner authorization");
assert(courseServer.includes('path==="/videos"')&&courseServer.includes('.eq("published",true)'),
 "Only approved video links may be shown to students");
assert(admin.includes('href="curriculum.html"'),"Admin navigation includes axes and indicators");
assert(adminServer.includes('path==="/curriculum"'),"Admin server includes authorized curriculum API");
assert(courseServer.includes('path==="/catalog"'),"Student service provides published curriculum catalog");
assert(portal.includes('step-course/catalog'),"Student portal loads backend catalog");
assert(portal.includes("محاور STEP الأربعة"),"Four axes shown on student dashboard");
assert(curriculum.includes('function bankSections('),"Bank category review visible in admin");
assert(curriculum.includes('/curriculum/classifications/link'),"Owner can link bank classifications");
assert(adminServer.includes('step_question_bank_classifications'),"Server exposes bank mappings behind auth");
assert(adminServer.includes('path==="/curriculum/classifications/link"'),"Bank linking API exists");
assert(adminServer.includes('if(permission.role!=="owner")'),"Owner role required for bank-link writes");
const writingAlignment=readFileSync("supabase/migrations/20261020_step_writing_book_alignment.sql","utf8");
assert(writingAlignment.includes("Sequencing"),"Writing indicator three follows STEP book");
assert(writingAlignment.includes("Logical Connectors"),"Writing indicator four follows STEP book");
assert(writingAlignment.includes("Error Recognition"),"Writing indicator five follows STEP book");
const taxonomy=readFileSync("supabase/migrations/20261020_step_bank_heading_normalization.sql","utf8");
assert(taxonomy.includes("ASGQPRSIM"),"Bank source preserves Present Simple code");
assert(taxonomy.includes("ASGQPARORDER"),"Bank source preserves Paragraph Ordering code");
const bankSchema=readFileSync("supabase/migrations/20261020_step_bank_classification_source_map.sql","utf8");
assert(bankSchema.includes("enable row level security"),"Bank categories cannot be listed by students");
// The student's live Present Simple experience is deliberately independent
// from instructor source notes, raw question-bank codes, and old HTML fragments.
const unified=readFileSync("step-grammar-student/learn.html","utf8");
const v2=readFileSync("step-grammar-student/present-simple-v2.js","utf8");
const v2Content=readFileSync("step-grammar-student/present-simple-v2-content.js","utf8");
const css=readFileSync("step-grammar-student/present-simple-v2.css","utf8");
const oldGuide=readFileSync("step-grammar-student/guide.html","utf8");
new Script(v2,{filename:"present-simple-v2.js"});
new Script(v2Content,{filename:"present-simple-v2-content.js"});
assert(portal.includes('href="learn.html"'),"Student dashboard opens one clear lesson");
assert(unified.includes("present-simple-v2.js")&&unified.includes("present-simple-v2-content.js"),
 "Student lesson must use only the redesigned study path");
assert(v2.includes("/parts/")&&v2.includes("/exam"),"Live practice and final assessment are integrated");
assert(!v2.includes('api("/guide")')&&!v2.includes('api("/guide"'),
 "Old source-specific guide is not rendered in rebuilt lesson");
assert(!v2Content.includes("vt.tiktok.com/ZSgyJoEnb"),"No temporary videos are hardcoded into lessons");
assert(v2.includes("lesson-video-pending")&&v2.includes('api("/videos")'),"A video placeholder is available in every stage");
assert(v2Content.includes("دي عادة")&&v2Content.includes("دي حقيقة")&&v2Content.includes("دي وظيفة"),
 "Learning examples are classified clearly in Arabic");
assert(v2Content.includes("فعل في المصدر")&&v2Content.includes("مفرد غائب"),
 "Arabic grammar conventions are used");
assert(v2.includes("mark(s)")||v2.includes("const mark="),"The lesson highlights important parts");
assert(v2.includes("step-course")&&v2.includes("data-action"),"Interactive practice stays authenticated");
assert(!unified.includes("ASGQ")&&!v2Content.includes("ASGQ")&&!v2.includes("ASGQ"),
 "No internal bank codes appear in student assets");
assert(css.includes("@media(max-width:480px)"),"Mobile layout is included");
assert(oldGuide.includes("learn.html"),"Old explanation links redirect into a single lesson");
assert(courseServer.includes('const showQuestions='),"API replaces internal question identifiers");

// The instructor follow-up table is private, and only an owner can mutate assignments.
const followupSchema=readFileSync("supabase/migrations/20261021204000_step_student_success_followups_v1.sql","utf8");
assert(followupSchema.includes("enable row level security")&&followupSchema.includes("revoke all"),
 "Student follow-up notes must never be readable via the public database API");
assert(adminServer.includes('permission.role!=="owner"')&&
 adminServer.includes('step_student_followups')&&adminServer.includes('cancelMatch'),
 "Only an owner can assign or cancel follow-ups");
assert(courseServer.includes('path==="/followups"')&&courseServer.includes('reviewMatch')&&
 courseServer.includes('.eq("user_id",user.id)'),
 "A student can only load or review their own follow-ups");
assert(reports.includes("indicatorLink(")&&reports.includes("openIndicator(")&&reports.includes("findIndicator("),
 "Admin reports must route by indicator slug and show drafts without scores");
assert(adminServer.includes('path==="/indicators"')&&adminServer.includes("indicatorReportRoute")&&
 adminServer.includes("indicator.legacy_course_code===lesson.code"),
 "Per-indicator report API must verify published course mapping on the server");
assert(readFileSync("step-grammar-admin/curriculum.html","utf8").includes('reports.html?indicator='),
 "Curriculum indicators must deep-link to separate reports");
assert(reports.includes("followupPanel(")&&reports.includes("wireFollowups("),
 "Admin report must manage a student's learning plan");
assert(portal.includes("followupCards(")&&portal.includes("markFollowupReviewed("),
 "Student dashboard must render and acknowledge assignments");

const brandedPages=[
 "step-grammar-account-preview/index.html","step-grammar-student/index.html",
 "step-grammar-student/learn.html","step-grammar-student/lesson-v2.html",
 "step-grammar-pilot/index.html","step-grammar-admin/index.html",
 "step-grammar-admin/reports.html","step-grammar-admin/courses.html",
 "step-grammar-admin/curriculum.html","step-grammar-admin/guide.html",
 "step-grammar-admin/videos.html"];
for(const page of brandedPages){
 const html=readFileSync(page,"utf8");
 assert(!/QUDRAT|TRAINING INSTITUTE|معهد القدرات|إدارة المعهد|مدير المعهد/i.test(html),page+" retains old branding");
 assert(html.includes("step-brand/logo.svg"),page+" is missing the STEP with Seify logo");
 assert(html.includes("step-brand/mark.svg"),page+" is missing STEP favicon");
}
assert(!/إدارة المعهد|مدير المعهد/.test(adminServer),"Admin messages must use STEP brand");
assert(!/إدارة المعهد/.test(courseServer),"Course messages must use STEP brand");
assert(courseServer.includes('const {questionIds:_privateIds'),"API removes raw question-ID arrays");
const book=readFileSync("step-grammar-account-preview/index.html","utf8");
assert(book.includes("step-grammar-student/learn.html"),"Legacy lesson also links to new lesson");
console.log("All STEP portal contracts validated.");
