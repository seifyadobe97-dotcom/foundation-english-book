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
const adminHome=readFileSync("step-grammar-admin/admin-home.js","utf8");
const adminNav=readFileSync("step-grammar-admin/admin-nav.js","utf8");
const adminCss=readFileSync("step-grammar-admin/admin-nav.css","utf8");
const studio=readFileSync("step-grammar-admin/studio.html","utf8");
new Script(adminHome,{filename:"admin-home.js"});
new Script(adminNav,{filename:"admin-nav.js"});
assert(admin.includes("await loadOverview()")&&admin.includes('location.hash==="#students"'),
 "Admin must open a task-first home and keep students under their own route");
assert(admin.includes('src="admin-home.js"')&&adminHome.includes('id="nav-lessons"'),
 "Admin homepage must show one clearly labeled Studio link");
for(const code of ["ASGQAGREE","ASGQPRSIM","ASGQPRCONT","ASGQPASIM","ASGQPACONT"])
 assert(adminHome.includes(code)&&studio.includes('value="'+code+'"'),
  "Every published lesson must have its own direct editor route: "+code);
assert(studio.includes('value="ASGQFUTARR"')&&studio.includes('"ASGQFUTARR":"future-arrangements"')&&
 adminHome.includes('code:"ASGQFUTARR"')&&
 readFileSync("step-grammar-admin/sources.html","utf8").includes("studio.html?course=ASGQFUTARR&tab=visual"),
 "Lesson 07 draft and source limitations must be accessible in the unified admin interface");
assert(studio.includes('value="ASGQWILLGO"')&&studio.includes('"ASGQWILLGO":"will-be-going-to"'),
 "Lesson 06 draft must be selectable in the existing Studio without creating a second editor");
assert(adminHome.includes('code:"ASGQWILLGO"'),
 "Lesson 06 draft should have a fallback admin dashboard entry");
for(const tab of ["visual","sections","questions","course"])
 assert(studio.includes('data-tab="'+tab+'"')&&studio.includes('allowedTabs.includes(params.get("tab"))'),
  "Studio must open each editing tab directly");
for(const label of ["الرئيسية","تعديل الدروس","الطلاب","التقارير","ترتيب المنهج","الفيديوهات","تدقيق المصادر","مسودات جديدة"])
 assert(adminNav.includes(label),"Admin nav missing "+label);
assert(adminCss.includes("aria-current")&&adminNav.includes('aria-current="page"'),
 "Active admin page needs a clear selected state");
for(const pageName of ["index.html","studio.html","curriculum.html","reports.html","courses.html","videos.html","guide.html","agreement-audit.html","continuous-audit.html","continuous-preview.html","past-continuous-audit.html","sources.html"]){
 const adminPath="step-grammar-admin/"+pageName,html=readFileSync(adminPath,"utf8");
 assert(html.includes("admin-nav.js")&&html.includes("admin-nav.css"),adminPath+" must share navigation");
}
assert(adminServer.includes('path==="/future/audit"')&&adminServer.includes('WGO-%'),
 "Lesson 06 original stem/key ledger must only be accessible via the authenticated admin API");
assert(readFileSync("step-grammar-admin/future-audit.html","utf8").includes("/step-admin/future/audit")&&
 readFileSync("step-grammar-admin/sources.html","utf8").includes('href="future-audit.html"'),
 "Lesson 06 source review must have an explicit admin-only page");
assert(adminServer.includes('path==="/past-continuous/audit"')&&adminServer.includes('original_category_code","ASGQPACONT"'),
 "Original Lesson 5 question register must be admin-only");
assert(courseServer.includes("dynamicMatch")&&courseServer.includes('data.status!=="published"'),
 "Unpublished generic student lessons must remain inaccessible through the backend");
assert(readFileSync("step-grammar-admin/sources.html","utf8").includes('/functions/v1/step-admin/me'),
 "Source audit hub must require admin authentication");
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
assert(adminHome.includes('href="reports.html"'),"Admin home has analytics navigation");
assert(adminServer.includes('path==="/analytics"'),"Server analytics endpoint");
assert(adminServer.includes('reportMatch'),"Server per-student report endpoint");
const courses=readFileSync("step-grammar-admin/courses.html","utf8");
assert(courses.includes('/course-drafts/save'),"Course planning must save as draft");
assert(courses.includes('/course-drafts/status'),"Course planning must archive/restore drafts");
assert(courses.includes('غير متاحة للطلاب'),"Drafts must not claim to be published");
assert(adminHome.includes('href="courses.html"'),"Admin home links course drafts separately");
assert(adminServer.includes('path==="/course-drafts"'),"Server course draft route");
assert(adminServer.includes('permission.role!=="owner"'),"Only owner can create courses");
assert(courseServer.includes('const courseCode=lesson.code;'),"Student course remains safely pinned");
assert(courseServer.includes('requestedCourseCode')&&adminServer.includes('step_private_course_banks'),
 "Both authorized Edge Functions must resolve original question banks from private storage");
assert(courseServer.includes('const isContinuous=')&&
 courseServer.includes('isContinuous?"ASGQPRCONT"')&&
 courseServer.includes('if(isAgreement||isContinuous||dynamicIndicator)'),
 "Lesson 3 course API must be mapped and publication-gated before grades are exposed");
assert(adminServer.includes('path==="/continuous/audit"')&&
 adminServer.includes('continuousLesson'),
 "Lesson 3 source review and later instructor analytics must be admin-authorized");
assert(courseServer.includes("dynamicMatch")&&courseServer.includes('dynamicIndicator?.legacy_course_code'),
 "Generic authenticated lesson route must load future published lessons dynamically");
assert(adminServer.includes('path==="/past/audit"'),
 "Past Simple register must remain behind admin JWT and role authorization");
assert(readFileSync("step-grammar-admin/past-audit.html","utf8").includes("/past/audit"),
 "Past Simple instructor audit must use the private authenticated endpoint");
assert(readFileSync("step-grammar-admin/sources.html","utf8").includes("ASGQPASIM"),
 "Lesson 4 editorial draft and audit must be visible only from admin hub");
const studentSkin=readFileSync("step-grammar-student/student-experience.js","utf8");
const dynamicLesson=readFileSync("step-grammar-student/lesson-player.js","utf8");
const studentStyle=readFileSync("step-grammar-student/student-experience.css","utf8");
const studioPage=readFileSync("step-grammar-admin/studio.html","utf8");
new Script(studentSkin,{filename:"student-experience.js"});
new Script(dynamicLesson,{filename:"lesson-player.js"});
assert(portal.includes('src="student-experience.js"')&&portal.includes('extraLessons:extraLessons.filter(Boolean)'),
 "Student dashboard must render any future published grammar lesson automatically");
assert(studentSkin.includes('student-learning-path')&&studentSkin.includes('student-hero-cta')&&studentStyle.includes('@media(max-width:550px)'),
 "Learners must have a responsive, calm resume-and-progress experience");
assert(courseServer.includes('dynamicMatch=')&&courseServer.includes('teachingUnits:visuals'),
 "Server must accept source-approved future lessons and deliver non-sensitive teaching units");
assert(studioPage.includes('/studio/catalog')&&studioPage.includes('beforeunload')&&
 studioPage.includes('/studio/history/restore')&&studioPage.includes('معاينة قبل النشر'),
 "Studio must auto-list future lessons, protect unsaved changes, preview and restore revisions");
assert(adminServer.includes('/studio/history')&&adminServer.includes('step_studio_revision_history')&&
 adminServer.includes('step_restore_studio_revision'),
 "Revision history and restores must be owner-authorized and server-side");
const continuousContent=readFileSync("step-grammar-student/present-continuous-content.js","utf8");
const continuousHtml=readFileSync("step-grammar-student/present-continuous.html","utf8");
const continuousScript=readFileSync("step-grammar-student/present-continuous.js","utf8");
new Script(continuousContent,{filename:"present-continuous-content.js"});
new Script(continuousScript,{filename:"present-continuous.js"});
assert(continuousHtml.includes('src="present-continuous.js"')&&
 continuousHtml.includes('src="present-continuous-content.js"')&&
 continuousScript.includes('const API_PREFIX="/continuous"'),
 "Lesson 3 must load its own full interactive interface and server-only questions");
assert(!/PC-B0[1-9]|PC-C0[1-9]/.test(continuousHtml+continuousContent+continuousScript),
 "Source register IDs must never be embedded in the student-facing lesson");
const continuousFixture=JSON.parse(readFileSync("tests/fixtures/private-banks/continuous-data.json","utf8"));
assert(continuousFixture.code==="ASGQPRCONT"&&continuousFixture.sections.length===5&&
 continuousFixture.sections.flatMap(s=>s.questionIds).length===14,
 "Synthetic regression fixture must cover all five stages without copying real STEP MCQs");
assert(Object.values(continuousFixture.questions).every(q=>q.text.startsWith("Synthetic browser test")),
 "Browser test questions must be artificial, not source originals");
const previewPage=readFileSync("step-grammar-admin/continuous-preview.html","utf8");
const auditPage=readFileSync("step-grammar-admin/continuous-audit.html","utf8");
assert(previewPage.includes('/functions/v1/step-admin/me')&&
 auditPage.includes('/functions/v1/step-admin/continuous/audit'),
 "Lesson 3 instructor preview and original question audit must require admin credentials");

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
assert(adminHome.includes('href="curriculum.html"'),"Admin home links curriculum ordering");
assert(adminServer.includes('path==="/curriculum"'),"Admin server includes authorized curriculum API");
assert(courseServer.includes('path==="/catalog"'),"Student service provides published curriculum catalog");
assert(portal.includes('step-course/catalog'),"Student portal loads backend catalog");
assert(portal.includes("GRAMMAR · INDICATOR 01")&&portal.includes("GRAMMAR · INDICATOR 02"),
 "Learners must see Agreement and Present Simple as lessons 1 and 2");
const courseCardMarkup=portal.slice(portal.indexOf("app.innerHTML="));
assert(courseCardMarkup.indexOf("'+agreementCard+'")>=0&&
 courseCardMarkup.indexOf("'+agreementCard+'")<courseCardMarkup.indexOf("GRAMMAR · INDICATOR 02"),
 "Agreement must appear before Present Simple in the student dashboard");
assert(portal.includes("مراحل الدرس 2 — المضارع البسيط"),
 "Present Simple exercises must carry the revised lesson number");
assert(curriculum.includes("عاين الدرس الأول التفاعلي")&&
 curriculum.includes("state.indicators=(data.indicators||[]).slice().sort("),
 "Admin must display the revised lesson one preview and sort indicators by position");
const logicalSequence=readFileSync("curriculum/STEP_LOGICAL_GRAMMAR_SEQUENCE_20261022.md","utf8");
assert(logicalSequence.includes("lessons **01–06 are published**")&&
 logicalSequence.includes("`past-continuous` — position `105` — published")&&
 logicalSequence.includes("`will-be-going-to` — position `106` — published")&&
 logicalSequence.includes("`sentence-elements` stays **draft**")&&
 logicalSequence.includes("position `999`"),
 "Teaching sequence must keep Foundation deferred, publish lessons 01-06, and stage lesson 07");
const lesson06Migration=readFileSync("supabase/migrations/20261023_step_lesson06_private_draft_and_publish_gate.sql","utf8");
assert(lesson06Migration.includes("step_guard_lesson06_publication")&&
 lesson06Migration.includes("step_source_item_reviews")&&
 lesson06Migration.includes("approved_count <> items_count")&&
 lesson06Migration.includes("step_lesson06_publish_gate"),
 "Lesson 06 publication requires private audited source questions, not sample teaching examples");
const lesson06Release=readFileSync("supabase/migrations/20261023_step_lesson06_verified_eight_item_release.sql","utf8");
assert(lesson06Release.includes("IF items_count < 8 THEN")&&
 lesson06Release.includes("approved_count <> items_count")&&
 lesson06Release.includes("step_source_item_reviews")&&
 !lesson06Release.includes("IF items_count < 10 THEN"),
 "Lesson 06 release must preserve source-matched 8-item minimum and unambiguous private bank gate");
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

const foundationHtml=readFileSync("step-grammar-student/foundation-sentence-elements.html","utf8");
const foundationScript=readFileSync("step-grammar-student/foundation-sentence-elements.js","utf8");
const foundationData=readFileSync("step-grammar-student/foundation-sentence-elements-data.js","utf8");
const foundationCss=readFileSync("step-grammar-student/foundation-sentence-elements.css","utf8");
new Script(foundationScript,{filename:"foundation-sentence-elements.js"});
new Script(foundationData,{filename:"foundation-sentence-elements-data.js"});
const foundationWindow={};
new Function("window",foundationData)(foundationWindow);
const foundation=foundationWindow.STEP_FOUNDATION_STAGES;
assert.equal(foundation.length,7,"Foundation is scaffolded into seven brief stages");
assert.equal(foundation.reduce((n,g)=>n+g.checks.length,0),15,"Foundation has 15 source-linked MCQs");
// Foundation is paused, and source-authentic graded banks are never included in CI fixtures.
const stems=new Set();
for(const stage of foundation)for(const question of stage.checks){
 assert(!Object.hasOwn(question,"source")&&!Object.hasOwn(question,"bankId"),
  "Internal source locators must not appear in student foundation JS");
 assert(!stems.has(question.en),"Duplicate question inside paused foundation");
 stems.add(question.en);
 assert.equal(question.choices.length,4,"Paused foundation items retain four answer choices");
 assert(Number.isInteger(question.correct)&&question.correct>=0&&question.correct<4,
  "Paused foundation records must have a valid original answer index");
 assert(question.why&&question.wrong?.length===4,"Paused foundation rationale record must be complete");
}
const foundationMastery=readFileSync("step-grammar-student/foundation-sentence-elements-mastery.js","utf8");
new Script(foundationMastery,{filename:"foundation-sentence-elements-mastery.js"});
const masterWindow={};
new Function("window",foundationMastery)(masterWindow);
assert.deepEqual(Object.keys(masterWindow.STEP_FOUNDATION_MASTERY).sort(),foundation.map(g=>g.id).sort());
assert(masterWindow.STEP_FOUNDATION_MASTERY["verb-roles"].cards.length>=8,
 "BE/DO/HAVE must distinguish main and auxiliary usages with examples");
assert(masterWindow.STEP_FOUNDATION_MASTERY.build.modal.rows.length>=8,
 "Modal auxiliaries require a detailed explanation and usage table");
assert(foundationScript.includes("function deepDive(")&&foundationScript.includes("formula-flow")&&
 foundationScript.includes("class=\"model-sentence\""),
 "Student should see Arabic-first diagrams, LTR sentence sequences and colorful model sentences");
assert(!foundationScript.includes("sourceLabel(")&&!foundationScript.includes("question-source"),
 "Student UI must not expose instructor-only source locators");
assert(foundation.every(g=>g.map.length>=4&&g.examples.length>=3),"Every foundation step has an explanatory map and examples");
assert.equal(foundation.reduce((n,g)=>n+g.map.length,0),32,"All 32 teaching map cards are present");
for(const stage of foundation)for(const card of stage.map){
 assert.equal(card.length,5,"Map cards include code, English, Arabic title, Arabic explanation and separate English example");
 assert(card[2].trim()&&card[3].trim()&&card[4].trim(),"Every map card contains a beginner-friendly Arabic explanation and example");
 assert(/[\u0600-\u06ff]/.test(card[2])&&/[\u0600-\u06ff]/.test(card[3]),"Arabic title and explanation required on every card");
}
assert(foundationScript.includes('class="map-title"')&&foundationScript.includes('class="map-example-en" dir="ltr"'),
 "Maps must display Arabic-first headings and directionally isolated English examples");
assert(foundationCss.includes('.map-title{')&&foundationCss.includes('.map-example-en{'),
 "Arabic-first map typography must be styled");
for(const stage of foundation)for(const q of stage.checks){
 assert.equal(q.wrong.length,q.choices.length,"Reason is assigned per answer");
 assert(q.why.trim(),"Correct selection must also be explained");
 q.choices.forEach((_,i)=>{if(i!==q.correct)assert(q.wrong[i]?.trim(),"Missing wrong-choice reasoning");});
}
assert(foundationHtml.includes('lang="ar"')&&foundationHtml.includes('dir="rtl"'));
assert(foundationScript.includes('dir="ltr"')&&foundationScript.includes("localStorage"),"Bidi-safe choices and local practice memory");
assert(foundationHtml.includes("foundation-sentence-elements-data.js")&&foundationHtml.includes("foundation-sentence-elements.css"));
assert(foundationHtml.includes("foundation-sentence-elements-mastery.js"),"Extended course must load");
assert(foundationCss.includes(".feedback.wrong")&&foundationCss.includes(".option.correct"),"Clear color-coded feedback");
assert(!portal.includes('foundation-sentence-elements.html'),
 "Paused foundation must not be linked from the student dashboard");
assert(!unified.includes('foundation-sentence-elements.html'),
 "Paused foundation must not be linked from the live lesson");
assert(!readFileSync("step-grammar-student/lesson-v2.html","utf8").includes('foundation-sentence-elements.html'),
 "Paused foundation must not be linked from lesson preview");
assert(!readFileSync("step-grammar-admin/curriculum.html","utf8").includes('href="../step-grammar-student/foundation-sentence-elements.html"'),
 "Draft foundation must not be linked to publicly visible preview");
const releaseBuilder=readFileSync("scripts/build-step-public-site.mjs","utf8");
const releaseWorkflow=readFileSync(".github/workflows/pages.yml","utf8");
assert(releaseBuilder.includes('const forbidden=name=>')&&releaseBuilder.includes('dir!=="step-grammar-student"'),
 "Public artifact must not ship paused foundation files");
assert(releaseWorkflow.includes("node scripts/build-step-public-site.mjs")&&
 releaseWorkflow.includes('path: ${{ runner.temp }}/step-public'),
 "GitHub Pages must deploy allowlisted release output rather than full repository");
assert(readFileSync("service-worker.js","utf8").includes("status:410"),
 "Service worker must refuse cached copies of the archived foundation lesson");
assert(readFileSync("step-grammar-admin/curriculum.html","utf8").includes("موقوف عن عرض الطلاب مؤقتًا"),"Admin must display foundation as paused rather than offer a public preview");
assert(!foundationScript.includes("/exam/submit")&&!foundationScript.includes("/parts/"),"Foundation practice does not impersonate graded bank");

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
 adminServer.includes("indicator.legacy_course_code===selectedLesson.code")&&
 adminServer.includes("agreementLesson.code")&&
 adminServer.includes("reportLesson.code"),
 "Per-indicator report API must verify published course mapping on the server");
assert(readFileSync("step-grammar-admin/curriculum.html","utf8").includes('reports.html?indicator='),
 "Curriculum indicators must deep-link to separate reports");
const agreementData=JSON.parse(readFileSync("tests/fixtures/private-banks/agreement-data.json","utf8"));
assert.equal(agreementData.code,"ASGQAGREE");
assert.equal(agreementData.sections.length,5);
assert.equal(agreementData.sections.flatMap(s=>s.questionIds).length,17);
assert(courseServer.includes('const isAgreement=')&&courseServer.includes('step_private_course_banks'),
 "Student course endpoint routes independent agreement progress and grading");
assert(adminServer.includes('buildLearningInsights((detailRows.data||[]) as AnswerEvent[],reportLesson)'),
 "Per-indicator question timing and misconception reports need agreement-specific course data");
assert(portal.includes("subject-verb-agreement.html")&&curriculum.includes("subject-verb-agreement.html"),
 "Lesson 2 must be reachable from student portal and curriculum admin");
assert(readFileSync("step-grammar-student/subject-verb-agreement.html","utf8").includes('subject-verb-agreement.js'),
 "Agreement page must load interactive lesson UI");
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
