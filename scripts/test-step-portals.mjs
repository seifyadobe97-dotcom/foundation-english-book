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
const lesson08Gate=readFileSync("supabase/migrations/20261023_step_lesson08_time_clauses_source_release.sql","utf8");
assert(lesson08Gate.includes("approved<>items")&&lesson08Gate.includes("step_source_item_reviews")&&lesson08Gate.includes("items<5"),
 "Lesson 08 only publishes audited original exam questions");
const lesson17Gate=readFileSync("supabase/migrations/20261023_step_lesson17_passive_tense_only_source_gate.sql","utf8");
assert(lesson17Gate.includes("total < 20")&&
 lesson17Gate.includes("future perfect has fewer than two")&&
 lesson17Gate.includes("step_source_item_reviews")&&
 lesson17Gate.includes("PSV-SUP01"),
 "Lesson17 stays draft until 20 independently verified tense originals and two future perfect items exist");
assert(studio.includes('value="ASGQPSVCORE"')&&
 studio.includes('"ASGQPSVCORE":"passive-voice-by-tense"')&&
 adminHome.includes('code:"ASGQPSVCORE"')&&
 adminServer.includes('path==="/passive-voice/audit"')&&
 readFileSync("step-grammar-admin/passive-voice-audit.html","utf8").includes("/step-admin/passive-voice/audit"),
 "Lesson17 protected source audit and owner-editable Studio route required");
const passiveAudit=readFileSync("curriculum/PASSIVE_VOICE_LESSON17_SOURCE_AUDIT_20261023.md","utf8");
assert(passiveAudit.includes("31 occurrences individually reviewed")&&
 passiveAudit.includes("19 source-approved tense originals")&&
 passiveAudit.includes("current")&&passiveAudit.includes("Future Perfect"),
 "Lesson17 must reconcile approved source occurrences and unpublishable tense practice");
const lesson18Gate=readFileSync("supabase/migrations/20261023_step_lesson18_modal_passive_source_gate.sql","utf8");
assert(lesson18Gate.includes("total<12")&&
 lesson18Gate.includes("perfect<3")&&
 lesson18Gate.includes("step_source_item_reviews")&&
 lesson18Gate.includes("source coverage incomplete")&&
 lesson18Gate.includes("overlaps another lesson bank"),
 "Lesson18 must retain the strict 12-item source, Modal Perfect, and dedup publication gate");
assert(studio.includes('value="ASGQMODPASSCORE"')&&
 studio.includes('"ASGQMODPASSCORE":"modal-passive"')&&
 adminHome.includes('code:"ASGQMODPASSCORE"')&&
 adminHome.includes('status:"draft"'),
 "Lesson18 must remain a clearly marked editable admin Studio draft");

const lesson21Gate=readFileSync("supabase/migrations/20261023_step_lesson21_degree_source_gate.sql","utf8");
assert(lesson21Gate.includes("total<12")&&
 lesson21Gate.includes("stages<>4")&&
 lesson21Gate.includes("step_source_item_reviews")&&
 lesson21Gate.includes("Lesson21 draft only"),
 "Lesson21 source shortage must keep Too/Enough/So-That a private draft");
assert(studio.includes('value="ASGQDEGREE"')&&
 studio.includes('"ASGQDEGREE":"quantity-degree"')&&
 adminHome.includes('code:"ASGQDEGREE"'),
 "Lesson21 owner must be able to edit all 4 private stages");
const lesson21Audit=readFileSync("curriculum/DEGREE_LESSON21_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson21Audit.includes("5 original degree items")&&
 lesson21Audit.includes("no additional original")&&
 lesson21Audit.includes("never publish"),
 "Lesson21 report must explicitly document lack of So ... That scored originals");
const lesson35Gate=readFileSync("supabase/migrations/20261023_step_lesson35_second_conditional_source_gate.sql","utf8");
assert(lesson35Gate.includes("total<12")&&
 lesson35Gate.includes("complete_stages!=3")&&
 lesson35Gate.includes("step_source_item_reviews")&&
 lesson35Gate.includes("overlap_count>0"),
 "Lesson35 requires independent source-original Second Conditional coverage and no cross-lesson duplicates");
assert(studio.includes('value="ASGQSECONDCORE"')&&
 studio.includes('"ASGQSECONDCORE":"second-conditional"')&&
 adminHome.includes('code:"ASGQSECONDCORE"'),
 "Lesson35 must be editable in admin Studio while protected as draft");
const lesson35Audit=readFileSync("curriculum/SECOND_CONDITIONAL_LESSON35_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson35Audit.includes("all 26 printed questions")&&
 lesson35Audit.includes("Individually approved independent source originals")&&
 lesson35Audit.includes("SCON-018")&&
 lesson35Audit.includes("DRAFT / HOLD"),
 "Lesson35 source review must reconcile 26 originals with 10 approved and three ambiguous holds");
const lesson41Gate=readFileSync("supabase/migrations/20261024_step_lesson41_so_neither_source_gate.sql","utf8");
assert(lesson41Gate.includes("total<12")&&
 lesson41Gate.includes("complete_stages!=5")&&
 lesson41Gate.includes("step_source_item_reviews")&&
 lesson41Gate.includes("cross_overlap>0"),
 "Lesson41 must reject a So-Neither release with incomplete original positive agreement source coverage");
assert(studio.includes('value="ASGQSONEITHERCORE"')&&
 studio.includes('"ASGQSONEITHERCORE":"so-neither-agreement"')&&
 adminHome.includes('code:"ASGQSONEITHERCORE"'),
 "Lesson41 must remain owner editable while held");
const lesson41Audit=readFileSync("curriculum/SO_NEITHER_LESSON41_SOURCE_AUDIT_20261024.md","utf8");
assert(lesson41Audit.includes("All fourteen printed occurrences reviewed")&&
 lesson41Audit.includes("5 approved, independently graded originals")&&
 lesson41Audit.includes("SN-005")&&
 lesson41Audit.includes("DRAFT — HOLD"),
 "Lesson41 source audit must account for all 14 originals and unsafe double negatives");
const lesson40Gate=readFileSync("supabase/migrations/20261024_step_lesson40_question_tags_source_gate.sql","utf8");
assert(lesson40Gate.includes("total<10")&&
 lesson40Gate.includes("complete_stages!=4")&&
 lesson40Gate.includes("step_source_item_reviews")&&
 lesson40Gate.includes("cross_overlap>0"),
 "Lesson40 release must be blocked until source-exact Question Tags have complete independent coverage");
assert(studio.includes('value="ASGQQTAGCORE"')&&
 studio.includes('"ASGQQTAGCORE":"question-tags"')&&
 adminHome.includes('code:"ASGQQTAGCORE"'),
 "Lesson40 Question Tags must be owner-editable as a guarded draft");
const lesson40Audit=readFileSync("curriculum/QUESTION_TAGS_LESSON40_SOURCE_AUDIT_20261024.md","utf8");
assert(lesson40Audit.includes("All seven original question occurrences individually reviewed")&&
 lesson40Audit.includes("4 approved original scored questions")&&
 lesson40Audit.includes("QTAG-001")&&
 lesson40Audit.includes("DRAFT — HOLD"),
 "Lesson40 source review must identify all seven originals, held ambiguous imperative and publishing restriction");
const lesson39Gate=readFileSync("supabase/migrations/20261024_step_lesson39_indirect_questions_source_gate.sql","utf8");
assert(lesson39Gate.includes("total<12")&&
 lesson39Gate.includes("full_stages!=5")&&
 lesson39Gate.includes("step_source_item_reviews")&&
 lesson39Gate.includes("overlap_count>0"),
 "Lesson39 must remain private without verified independent coverage of embedded WH, passive and if/whether");
assert(studio.includes('value="ASGQINDQCORE"')&&
 studio.includes('"ASGQINDQCORE":"indirect-questions"')&&
 adminHome.includes('code:"ASGQINDQCORE"'),
 "Lesson39 must be editable from existing owner Studio");
const lesson39Audit=readFileSync("curriculum/INDIRECT_QUESTIONS_LESSON39_SOURCE_AUDIT_20261024.md","utf8");
assert(lesson39Audit.includes("all **21** printed questions examined")&&
 lesson39Audit.includes("Approved, distinct original MCQs")&&
 lesson39Audit.includes("INDQ-018")&&
 lesson39Audit.includes("HOLD — OWNER DRAFT"),
 "Lesson39 audit must reconcile 21 original indirect questions with source holds and prevent non-skill grading");
const lesson38Gate=readFileSync("supabase/migrations/20261023_step_lesson38_reported_speech_source_gate.sql","utf8");
assert(lesson38Gate.includes("total<12")&&
 lesson38Gate.includes("full_stages!=4")&&
 lesson38Gate.includes("step_source_item_reviews")&&
 lesson38Gate.includes("cross_overlap>0"),
 "Lesson38 must hold release until 12 independent source-exact Reported Speech items and four scored skills exist");
assert(studio.includes('value="ASGQREPORTCORE"')&&
 studio.includes('"ASGQREPORTCORE":"reported-speech"')&&
 adminHome.includes('code:"ASGQREPORTCORE"'),
 "Lesson38 source-approved instruction must be editable in Studio");
const lesson38Audit=readFileSync("curriculum/REPORTED_SPEECH_LESSON38_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson38Audit.includes("all 17 printed original MCQs")&&
 lesson38Audit.includes("8 independently source-approved originals")&&
 lesson38Audit.includes("2 meaning/register ambiguity holds")&&
 lesson38Audit.includes("HOLD — OWNER DRAFT"),
 "Lesson38 audit must fully reconcile original source count and nonunique backshift keys");
const lesson37Gate=readFileSync("supabase/migrations/20261023_step_lesson37_wishes_unreal_source_gate.sql","utf8");
assert(lesson37Gate.includes("total<10")&&
 lesson37Gate.includes("complete_stages!=4")&&
 lesson37Gate.includes("step_source_item_reviews")&&
 lesson37Gate.includes("reused>0"),
 "Lesson37 must block Wishes and Unreal source shortfall and prevent cross-lesson reuse");
assert(studio.includes('value="ASGQWISHUNREAL"')&&
 studio.includes('"ASGQWISHUNREAL":"wishes-and-unreal-structures"')&&
 adminHome.includes('code:"ASGQWISHUNREAL"'),
 "Lesson37 must be owner-editable while draft");
const lesson37Audit=readFileSync("curriculum/WISHES_UNREAL_LESSON37_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson37Audit.includes("12 printed originals")&&
 lesson37Audit.includes("5 independently source-approved originals")&&
 lesson37Audit.includes("3 ambiguity holds")&&
 lesson37Audit.includes("HOLD, not published"),
 "Lesson37 report must reconcile all twelve originals and never force nonunique as-if/would-rather keys");
const lesson36Gate=readFileSync("supabase/migrations/20261023_step_lesson36_third_conditional_source_gate.sql","utf8");
assert(lesson36Gate.includes("total<18")&&
 lesson36Gate.includes("stages!=3")&&
 lesson36Gate.includes("step_source_item_reviews")&&
 lesson36Gate.includes("reused>0"),
 "Lesson36 requires 18 exact original Third Conditional MCQs and source-safe section coverage");
assert(studio.includes('value="ASGQTHIRDCORE"')&&
 studio.includes('"ASGQTHIRDCORE":"third-conditional"')&&
 adminHome.includes('code:"ASGQTHIRDCORE"'),
 "Lesson36 must be editable in owner Studio with administrative navigation");
const lesson36Audit=readFileSync("curriculum/THIRD_CONDITIONAL_LESSON36_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson36Audit.includes("all 29 printed original question occurrences")&&
 lesson36Audit.includes("18 exact-source scored originals")&&
 lesson36Audit.includes("TCON-028")&&
 lesson36Audit.includes("zero overlap"),
 "Lesson36 must reconcile all 29 audited original items and 18 independently approved source matches");
const lesson34Gate=readFileSync("supabase/migrations/20261023_step_lesson34_first_conditional_source_gate.sql","utf8");
assert(lesson34Gate.includes("total<16")&&
 lesson34Gate.includes("stages!=3")&&
 lesson34Gate.includes("step_source_item_reviews")&&
 lesson34Gate.includes("overlap_count>0"),
 "Lesson34 only publishes with 16 exact reviewed originals and all three scored conditions");
assert(studio.includes('value="ASGQFIRSTCORE"')&&
 studio.includes('"ASGQFIRSTCORE":"first-conditional"')&&
 adminHome.includes('code:"ASGQFIRSTCORE"'),
 "Lesson34 owner Studio and admin draft navigation must be wired");
const lesson34Audit=readFileSync("curriculum/FIRST_CONDITIONAL_LESSON34_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson34Audit.includes("23 individually selected source candidates")&&
 lesson34Audit.includes("16 original source-exact approved MCQs")&&
 lesson34Audit.includes("6 ambiguity holds")&&
 lesson34Audit.includes("not** a full audit"),
 "Lesson34 must document limited audit scope, six ambiguous options and 16 approved originals");
const lesson33Gate=readFileSync("supabase/migrations/20261023_step_lesson33_zero_conditional_source_gate.sql","utf8");
assert(lesson33Gate.includes("total<10")&&
 lesson33Gate.includes("complete_stages!=3")&&
 lesson33Gate.includes("step_source_item_reviews")&&
 lesson33Gate.includes("reused>0"),
 "Lesson33 must prevent a Zero Conditional release without 10 independent source originals across all three teaching skills");
assert(studio.includes('value="ASGQZEROCORE"')&&
 studio.includes('"ASGQZEROCORE":"zero-conditional"')&&
 adminHome.includes('code:"ASGQZEROCORE"'),
 "Lesson33 must remain editable from owner Studio even while protected draft");
const lesson33Audit=readFileSync("curriculum/ZERO_CONDITIONAL_LESSON33_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson33Audit.includes("all seven")&&
 lesson33Audit.includes("3 source-approved individually scored originals")&&
 lesson33Audit.includes("1 wrong-category rejection")&&
 lesson33Audit.includes("1 unsupported generalization hold"),
 "Lesson33 must reconcile all seven audited source occurrences without inflating near-clones");
const lesson32Gate=readFileSync("supabase/migrations/20261023_step_lesson32_relative_clauses_source_gate.sql","utf8");
assert(lesson32Gate.includes("n_items<18")&&
 lesson32Gate.includes("n_stages!=5")&&
 lesson32Gate.includes("step_source_item_reviews")&&
 lesson32Gate.includes("n_overlap>0"),
 "Lesson32 must remain protected until Relative Clauses including where/when have independent scored coverage");
assert(studio.includes('value="ASGQRELCORE"')&&
 studio.includes('"ASGQRELCORE":"relative-clauses"')&&
 adminHome.includes('code:"ASGQRELCORE"'),
 "Lesson32 must be owner-editable through the existing Studio");
const lesson32Audit=readFileSync("curriculum/RELATIVE_CLAUSES_LESSON32_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson32Audit.includes("19 individually selected and inspected source items")&&
 lesson32Audit.includes("16 individually approved originals")&&
 lesson32Audit.includes("1 wrong-key hold")&&
 lesson32Audit.includes("Where / When"),
 "Lesson32 report must acknowledge the held wrong key, missing where/when source coverage and exact review scope");
const lesson31Gate=readFileSync("supabase/migrations/20261023_step_lesson31_conjunctions_connectors_source_gate.sql","utf8");
assert(lesson31Gate.includes("n_items<20")&&
 lesson31Gate.includes("n_categories!=5")&&
 lesson31Gate.includes("step_source_item_reviews")&&
 lesson31Gate.includes("n_overlap>0"),
 "Lesson31 must require source-exact 20 original MCQs, 5 link categories and no cross-lesson overlaps");
assert(studio.includes('value="ASGQCONNLINK"')&&
 studio.includes('"ASGQCONNLINK":"conjunctions-and-connectors"')&&
 adminHome.includes('code:"ASGQCONNLINK"'),
 "Lesson31 must be editable in Studio with canonical owner route");
const lesson31Audit=readFileSync("curriculum/CONJUNCTIONS_CONNECTORS_LESSON31_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson31Audit.includes("20 individually selected and reviewed original MCQs")&&
 lesson31Audit.includes("five connector categories")&&
 lesson31Audit.includes("logical-connectors")&&
 lesson31Audit.includes("not a complete review"),
 "Lesson31 audit must bound review scope and prevent source doubling");
const lesson30Gate=readFileSync("supabase/migrations/20261023_step_lesson30_causatives_source_gate.sql","utf8");
assert(lesson30Gate.includes("count_questions<12")&&
 lesson30Gate.includes("n_complete!=4")&&
 lesson30Gate.includes("step_source_item_reviews")&&
 lesson30Gate.includes("n_overlap>0"),
 "Lesson30 must remain private until four causative skill groups have sufficient approved originals");
assert(studio.includes('value="ASGQCAUSCORE"')&&
 studio.includes('"ASGQCAUSCORE":"causatives"')&&
 adminHome.includes('code:"ASGQCAUSCORE"'),
 "Lesson30 must be editable via owner Studio and task-first admin navigation");
const lesson30Audit=readFileSync("curriculum/CAUSATIVES_LESSON30_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson30Audit.includes("exactly **two** distinct printed MCQs")&&
 lesson30Audit.includes("16 instructor-created examples")&&
 lesson30Audit.includes("HOLD / OWNER DRAFT"),
 "Lesson30 source audit must acknowledge precisely two original source questions and no fabricated scored coverage");
const lesson29Gate=readFileSync("supabase/migrations/20261023_step_lesson29_bare_infinitives_source_gate.sql","utf8");
assert(lesson29Gate.includes("total<12")&&
 lesson29Gate.includes("complete_stages!=4")&&
 lesson29Gate.includes("step_source_item_reviews")&&
 lesson29Gate.includes("reused>0"),
 "Lesson29 must block insufficient bare infinitive source coverage and any source overlap");
assert(studio.includes('value="ASGQBARECORE"')&&
 studio.includes('"ASGQBARECORE":"bare-infinitives"')&&
 adminHome.includes('code:"ASGQBARECORE"'),
 "Lesson29 must be editable via canonical owner Studio even while held draft");
const lesson29Audit=readFileSync("curriculum/BARE_INFINITIVES_LESSON29_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson29Audit.includes("14 printed occurrences individually reviewed")&&
 lesson29Audit.includes("10 approved exact original MCQs")&&
 lesson29Audit.includes("HOLD")&&
 lesson29Audit.includes("two or more"),
 "Lesson29 report must reconcile all 14 originals and its current source shortfall");
const lesson28Gate=readFileSync("supabase/migrations/20261023_step_lesson28_infinitives_source_gate.sql","utf8");
assert(lesson28Gate.includes("total<20")&&
 lesson28Gate.includes("full_stages!=4")&&
 lesson28Gate.includes("step_source_item_reviews")&&
 lesson28Gate.includes("overlap_count>0"),
 "Lesson28 release gate must source-verify 20 independent originals and four complete skills");
assert(studio.includes('value="ASGQINFINCORE"')&&
 studio.includes('"ASGQINFINCORE":"infinitives"')&&
 adminHome.includes('code:"ASGQINFINCORE"'),
 "Lesson28 source-audited To-Infinitive course must have owner Studio route");
const lesson28Audit=readFileSync("curriculum/INFINITIVES_LESSON28_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson28Audit.includes("45 printed original question occurrences")&&
 lesson28Audit.includes("20 reviewed original scored MCQs")&&
 lesson28Audit.includes("INF-018")&&
 lesson28Audit.includes("INF-042"),
 "Lesson28 must report all 45 originals, two ambiguous key holds, and 20 scored questions");
const lesson27Gate=readFileSync("supabase/migrations/20261023_step_lesson27_gerunds_source_gate.sql","utf8");
assert(lesson27Gate.includes("total<20")&&
 lesson27Gate.includes("stages!=4")&&
 lesson27Gate.includes("step_source_item_reviews")&&
 lesson27Gate.includes("overlapping>0"),
 "Lesson27 must require 20 independent source-exact original MCQs in four taught stages");
assert(studio.includes('value="ASGQGERUNDCORE"')&&
 studio.includes('"ASGQGERUNDCORE":"gerunds"')&&
 adminHome.includes('code:"ASGQGERUNDCORE"'),
 "Lesson27 Gerunds must be editable in owner Studio with admin navigation");
const lesson27Audit=readFileSync("curriculum/GERUNDS_LESSON27_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson27Audit.includes("41 printed question occurrences")&&
 lesson27Audit.includes("20 source-exact scored IDs")&&
 lesson27Audit.includes("participle/adverbial clause")&&
 lesson27Audit.includes("10")&&lesson27Audit.includes("5"),
 "Lesson27 source audit must reconcile 41 originals and distinguish true gerunds from reduced clauses");
const lesson26Gate=readFileSync("supabase/migrations/20261023_step_lesson26_word_formation_source_gate.sql","utf8");
assert(lesson26Gate.includes("question_count<12")&&
 lesson26Gate.includes("taxonomy.indicator_slug='word-formation'")&&
 lesson26Gate.includes("step_source_item_reviews")&&
 lesson26Gate.includes("complete_stages!=5"),
 "Lesson26 must refuse publication with no mapped source taxonomy and fewer than 12 audited MCQs");
assert(studio.includes('value="ASGQWORDFORM"')&&
 studio.includes('"ASGQWORDFORM":"word-formation"')&&
 adminHome.includes('code:"ASGQWORDFORM"')&&
 adminHome.includes('status:"draft"'),
 "Lesson26 must be an editable private draft, never an invented question bank");
const lesson26Audit=readFileSync("curriculum/WORD_FORMATION_LESSON26_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson26Audit.includes("Five teaching stages with 20 instructor-authored worked examples")&&
 lesson26Audit.includes("0 original questions")&&
 lesson26Audit.includes("DRAFT"),
 "Lesson26 must acknowledge absent source MCQs, while preserving book-grounded teaching");
const lesson25Gate=readFileSync("supabase/migrations/20261023_step_lesson25_collocations_source_gate.sql","utf8");
assert(lesson25Gate.includes("total<12")&&
 lesson25Gate.includes("stages!=4")&&
 lesson25Gate.includes("step_source_item_reviews")&&
 lesson25Gate.includes("overlaps_count>0"),
 "Lesson25 must prevent release with fewer than 12 unique reviewed source MCQs and complete stage coverage");
assert(studio.includes('value="ASGQCOLLOCPREP"')&&
 studio.includes('"ASGQCOLLOCPREP":"preposition-collocations"')&&
 adminHome.includes('code:"ASGQCOLLOCPREP"')&&
 adminHome.includes('code:"ASGQPREPTIME"'),
 "Lesson25 must be owner-editable and Lesson24 published navigation retained");
const lesson25Audit=readFileSync("curriculum/PREPOSITION_COLLOCATIONS_LESSON25_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson25Audit.includes("Five source-exact MCQs individually reviewed")&&
 lesson25Audit.includes("five original source-approved scored questions")&&
 lesson25Audit.includes("Publication decision: HOLD"),
 "Lesson25 review must explicitly hold insufficient independently scored collocations");
const lesson24Gate=readFileSync("supabase/migrations/20261023_step_lesson24_prepositions_time_place_source_gate.sql","utf8");
assert(lesson24Gate.includes("item_total<22")&&
 lesson24Gate.includes("n_prep<12 OR n_since<10")&&
 lesson24Gate.includes("step_source_item_reviews")&&
 lesson24Gate.includes("overlap_count>0"),
 "Lesson24 must require exact 22 original time/place/for-since items and no duplicates");
assert(studio.includes('value="ASGQPREPTIME"')&&
 studio.includes('"ASGQPREPTIME":"prepositions-of-time-and-place"')&&
 adminHome.includes('code:"ASGQPREPTIME"'),
 "Lesson24 private course must have direct Studio link and admin card");
const lesson24Audit=readFileSync("curriculum/PREPOSITIONS_TIME_PLACE_LESSON24_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson24Audit.includes("28 individually registered/reviewed source candidates")&&
 lesson24Audit.includes("22 independent approved originals")&&
 lesson24Audit.includes("3 duplicate holds")&&
 lesson24Audit.includes("3 editorial holds"),
 "Lesson24 source audit must reconcile 22 approved with six held source examples");
const lesson23Gate=readFileSync("supabase/migrations/20261023_step_lesson23_comparatives_superlatives_source_gate.sql","utf8");
assert(lesson23Gate.includes("total<18")&&
 lesson23Gate.includes("comp<12 OR sup<6")&&
 lesson23Gate.includes("step_source_item_reviews")&&
 lesson23Gate.includes("full_stages<>5"),
 "Lesson23 must source-verify 12 comparisons and 6 superlatives in five stages");
assert(studio.includes('value="ASGQCOMPSUP"')&&
 studio.includes('"ASGQCOMPSUP":"comparatives-superlatives"')&&
 adminHome.includes('code:"ASGQCOMPSUP"'),
 "Lesson23 must be editable and clearly mapped in the owner admin index");
const lesson23Audit=readFileSync("curriculum/COMPARATIVES_SUPERLATIVES_LESSON23_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson23Audit.includes("19 originals individually reviewed")&&
 lesson23Audit.includes("18 independently approved")&&
 lesson23Audit.includes("1 ambiguity hold")&&
 lesson23Audit.includes("superlative adverbs"),
 "Lesson23 must reconcile 19 original entries into 18 individually approved and one hold");
const lesson22Gate=readFileSync("supabase/migrations/20261023_step_lesson22_adjectives_adverbs_source_gate.sql","utf8");
assert(lesson22Gate.includes("total<22")&&
 lesson22Gate.includes("complete<>6")&&
 lesson22Gate.includes("step_source_item_reviews")&&
 lesson22Gate.includes("adjective coverage"),
 "Lesson22 publish gate must block insufficient adjective questions and repeated stems");
assert(studio.includes('value="ASGQADJADVCORE"')&&
 studio.includes('"ASGQADJADVCORE":"adjectives-and-adverbs"')&&
 adminHome.includes('code:"ASGQADJADVCORE"'),
 "Lesson22 must remain editable from the protected admin course studio");
const lesson22Audit=readFileSync("curriculum/ADJECTIVES_ADVERBS_LESSON22_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson22Audit.includes("26 individual bank originals")&&
 lesson22Audit.includes("18 source-approved independent originals")&&
 lesson22Audit.includes("4 ambiguous holds")&&
 lesson22Audit.includes("2 editorial holds"),
 "Lesson22 must reconcile 26 inspected items into 18 approved, eight held records");
const lesson20Gate=readFileSync("supabase/migrations/20261023_step_lesson20_articles_countability_source_gate.sql","utf8");
assert(lesson20Gate.includes("total<20")&&
 lesson20Gate.includes("articles<5 OR quantifiers<15")&&
 lesson20Gate.includes("step_source_item_reviews")&&
 lesson20Gate.includes("overlaps original questions"),
 "Lesson20 must require 20 reviewed original MCQs and at least 5 Article / 15 Countability questions");
assert(studio.includes('value="ASGQARTCOUNT"')&&
 studio.includes('"ASGQARTCOUNT":"articles-countability"')&&
 adminHome.includes('code:"ASGQARTCOUNT"')&&
 adminHome.includes('code:"ASGQPRONCORE"'),
 "Lessons19–20 must remain directly editable from Studio and admin navigation");
const lesson20Audit=readFileSync("curriculum/ARTICLES_COUNTABILITY_LESSON20_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson20Audit.includes("27 individually reviewed bank occurrences")&&
 lesson20Audit.includes("23 source-approved independent originals")&&
 lesson20Audit.includes("4 source holds")&&
 lesson20Audit.includes("Too / Enough"),
 "Lesson20 audit must retain 23 verified originals and 4 held underconstrained items");
const lesson19Gate=readFileSync("supabase/migrations/20261023_step_lesson19_pronouns_source_gate.sql","utf8");
assert(lesson19Gate.includes("total<20")&&
 lesson19Gate.includes("rec_count>0")&&
 lesson19Gate.includes("step_source_item_reviews")&&
 lesson19Gate.includes("overlaps other scored lessons")&&
 lesson19Gate.includes("count(DISTINCT r.original_category_code)"),
 "Lesson19 must require 20 source-exact graded originals and prohibit ambiguous reciprocal MCQs");
assert(studio.includes('value="ASGQPRONCORE"')&&
 studio.includes('"ASGQPRONCORE":"pronouns"')&&
 adminHome.includes('code:"ASGQPRONCORE"'),
 "Lesson19 Pronouns must appear in the owner-editable Studio and fallback admin navigation");
const lesson19Audit=readFileSync("curriculum/PRONOUNS_LESSON19_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson19Audit.includes("27 individually reviewed source items")&&
 lesson19Audit.includes("24 independently source-approved originals")&&
 lesson19Audit.includes("3 ambiguity holds")&&
 lesson19Audit.includes("unscored"),
 "Lesson19 review must explain 24 independently graded originals and unscored reciprocal content");
const lesson18Audit=readFileSync("curriculum/MODAL_PASSIVE_LESSON18_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson18Audit.includes("Total individually reviewed")&&
 lesson18Audit.includes("**11**")&&
 lesson18Audit.includes("**6**")&&
 lesson18Audit.includes("at least 12")&&
 lesson18Audit.includes("HOLD"),
 "Lesson18 must document actual six approved originals and deliberate publication hold");
const lesson16Gate=readFileSync("supabase/migrations/20261023_step_lesson16_modals_deduction_source_gate.sql","utf8");
assert(lesson16Gate.includes("total<6")&&lesson16Gate.includes("present_n<3")&&
 lesson16Gate.includes("past_n<3")&&lesson16Gate.includes("step_source_item_reviews"),
 "Lesson16 must block source-deficient grading across present and past deductions");
assert(studio.includes('value="ASGQMODDEDUCT"')&&
 studio.includes('"ASGQMODDEDUCT":"modals-of-deduction"')&&
 adminHome.includes('code:"ASGQMODDEDUCT"')&&
 adminServer.includes('path==="/modals-deduction/audit"')&&
 readFileSync("step-grammar-admin/modals-deduction-audit.html","utf8").includes("/step-admin/modals-deduction/audit"),
 "Lesson16 owner-only original-source review and private editor must be connected");
const lesson16Audit=readFileSync("curriculum/MODALS_DEDUCTION_LESSON16_ADMIN_DRAFT_20261023.md","utf8");
assert(lesson16Audit.includes("25 individually reviewed")&&
 lesson16Audit.includes("3 approved original")&&
 lesson16Audit.includes("deduction")&&
 lesson16Audit.includes("stays `draft`"),
 "Lesson16 editorial review and student access restriction must be explicit");
const lesson15Gate=readFileSync("supabase/migrations/20261023_step_lesson15_modals_fundamentals_source_guard.sql","utf8");
assert(lesson15Gate.includes("total<18")&&lesson15Gate.includes("obligation<8")&&
 lesson15Gate.includes("requests<3")&&lesson15Gate.includes("advice<5")&&
 lesson15Gate.includes("step_source_item_reviews"),"Lesson15 must require 18 source-exact items covering all Modal Fundamentals skills");
assert(studio.includes('value="ASGQMODCORE"')&&
 studio.includes('"ASGQMODCORE":"modals-fundamentals"')&&
 adminHome.includes('code:"ASGQMODCORE"')&&
 adminServer.includes('path==="/modals-fundamentals/audit"')&&adminServer.includes('permission.role!=="owner"')&&
 readFileSync("step-grammar-admin/modals-fundamentals-audit.html","utf8").includes("/step-admin/modals-fundamentals/audit"),
 "Lesson15 source evidence must remain owner-only with editable Studio stages");
const lesson15Audit=readFileSync("curriculum/MODALS_FUNDAMENTALS_LESSON15_SOURCE_AUDIT_20261023.md","utf8");
assert(lesson15Audit.includes("26 source candidate records")&&lesson15Audit.includes("18 approved independent")&&
 lesson15Audit.includes("53 original printed occurrences"),
 "Lesson15 must distinguish screened source occurrences from the 18 actually source-approved originals");
const lesson14Gate=readFileSync("supabase/migrations/20261023_step_lesson14_used_to_source_gate.sql","utf8");
assert(lesson14Gate.includes("past_n<3")&&lesson14Gate.includes("be_n<3")&&
 lesson14Gate.includes("get_n<3")&&lesson14Gate.includes("step_source_item_reviews"),
 "Lesson14 requires approved exact-source questions for all three used to constructions");
assert(studio.includes('value="ASGQUSED"')&&
 studio.includes('"ASGQUSED":"used-to-be-used-to-get-used-to"')&&
 adminHome.includes('code:"ASGQUSED"')&&
 adminServer.includes('path==="/used-to/audit"')&&adminServer.includes('permission.role!=="owner"')&&
 readFileSync("step-grammar-admin/used-to-audit.html","utf8").includes("/step-admin/used-to/audit"),
 "Lesson14 must be editable in owner Studio and source evidence must remain private");
const lesson13Gate=readFileSync("supabase/migrations/20261023_step_lesson13_future_forms_source_gate.sql","utf8");
assert(lesson13Gate.includes("total<6")&&lesson13Gate.includes("continuous_n<3")&&
 lesson13Gate.includes("perfect_n<3")&&lesson13Gate.includes("step_source_item_reviews"),
 "Lesson13 source-only gate needs six authentic questions, three from each Future tense");
assert(studio.includes('value="ASGQFUCOMBO"')&&
 studio.includes('"ASGQFUCOMBO":"future-continuous-future-perfect"')&&
 adminHome.includes('code:"ASGQFUCOMBO"')&&
 adminServer.includes('path==="/future-continuous-perfect/audit"')&&
 adminServer.includes('permission.role!=="owner"')&&
 readFileSync("step-grammar-admin/future-continuous-perfect-audit.html","utf8").includes("/step-admin/future-continuous-perfect/audit"),
 "Lesson13 must remain an editable admin-only draft with owner-authenticated source review");
const lesson12Gate=readFileSync("supabase/migrations/20261023_step_lesson12_past_perfect_continuous_source_gate.sql","utf8");
assert(lesson12Gate.includes("total<5")&&lesson12Gate.includes("step_source_item_reviews")
 &&lesson12Gate.includes("matches<>total"),"Lesson12 must block publication until five independently approved originals");
assert(studio.includes('value="ASGQPAPERCONT"')&&
 studio.includes('"ASGQPAPERCONT":"past-perfect-continuous"')&&
 adminHome.includes('code:"ASGQPAPERCONT"')&&
 adminServer.includes('path==="/past-perfect-continuous/audit"')&&
 readFileSync("step-grammar-admin/past-perfect-continuous-audit.html","utf8").includes("/step-admin/past-perfect-continuous/audit"),
 "Lesson12 draft must have a source-verified owner-only review and visual editor");
assert(courseServer.includes('data.status!=="published"'),"Unpublished lessons must be blocked by student API");
const pastPerfectAudit=readFileSync("curriculum/PAST_PERFECT_LESSON11_SOURCE_AUDIT_20261023.md","utf8");
assert(pastPerfectAudit.includes("19 occurrences")&&
 pastPerfectAudit.includes("6 approved unique")&&pastPerfectAudit.includes("PAP-T242"),
 "Past Perfect audit must document six genuine original questions without cloning ambiguous items");
assert(studio.includes('value="ASGQPAPER"')&&
 studio.includes('"ASGQPAPER":"past-perfect"')&&
 adminHome.includes('code:"ASGQPAPER"')&&
 adminServer.includes('path==="/past-perfect/audit"')&&
 readFileSync("step-grammar-admin/past-perfect-audit.html","utf8").includes("/step-admin/past-perfect/audit"),
 "Lesson 11 must have its own owner-editable Studio route and secured audit");
const presentPerfectContinuousGate=readFileSync("supabase/migrations/20261023_step_lesson10_present_perfect_continuous_source_gate.sql","utf8");
assert(presentPerfectContinuousGate.includes("total<13")&&
 presentPerfectContinuousGate.includes("exact<>total")&&
 presentPerfectContinuousGate.includes("step_source_item_reviews"),
 "Lesson 10 publication requires 13 unique, source-exact approved originals across 7 stages");
assert(studio.includes('value="ASGQPRPERCONT"')&&
 studio.includes('"ASGQPRPERCONT":"present-perfect-continuous"')&&
 adminHome.includes('code:"ASGQPRPERCONT"')&&
 adminServer.includes('path==="/present-perfect-continuous/audit"')&&
 readFileSync("step-grammar-admin/present-perfect-continuous-audit.html","utf8").includes("/step-admin/present-perfect-continuous/audit"),
 "Lesson 10 private audit and editable Studio must be wired without exposing original answers");
const presentPerfectGate=readFileSync("supabase/migrations/20261023_step_lesson09_present_perfect_source_release.sql","utf8");
assert(presentPerfectGate.includes("total<13")&&presentPerfectGate.includes("step_source_item_reviews")&&
 presentPerfectGate.includes("approved<>total"),
 "Lesson 09 release requires thirteen source-matched, independently reviewed questions");
assert(studio.includes('value="ASGQPRPER"')&&
 studio.includes('"ASGQPRPER":"present-perfect"')&&
 adminHome.includes('code:"ASGQPRPER"')&&
 adminServer.includes('path==="/present-perfect/audit"')&&
 readFileSync("step-grammar-admin/present-perfect-audit.html","utf8").includes("/step-admin/present-perfect/audit"),
 "Lesson 09 Studio and owner-only source audit are reachable without public exam keys");
assert(studio.includes('value="ASGQTIMCL"')&&studio.includes('"ASGQTIMCL":"time-clauses"')&&
 adminHome.includes('code:"ASGQTIMCL"')&&adminServer.includes('path==="/time-clauses/audit"')&&
 readFileSync("step-grammar-admin/time-clauses-audit.html","utf8").includes("/step-admin/time-clauses/audit"),
 "Lesson 08 appears in the existing editor and admin-only audit");
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
 logicalSequence.includes("`time-clauses` — position `108` — published")&&
 logicalSequence.includes("`present-perfect` — position `109` — published")&&
 logicalSequence.includes("`present-perfect-continuous` — position `110` — published")&&
 logicalSequence.includes("`past-perfect` — position `111` — published")&&
 logicalSequence.includes("`past-perfect-continuous` — position `112` — draft")&&
 logicalSequence.includes("`future-continuous-future-perfect` — position `113` — draft")&&
 logicalSequence.includes("`used-to-be-used-to-get-used-to` — position `114` — draft")&&
 logicalSequence.includes("`modals-fundamentals` — position `115` — published")&&
 logicalSequence.includes("`modals-of-deduction` — position `116` — draft")&&
 logicalSequence.includes("`passive-voice-by-tense` — position `117` — draft")&&
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
