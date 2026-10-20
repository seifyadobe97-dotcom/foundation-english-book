/**
 * Regression gate for QUDRAT STEP account, student and admin portals.
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
assert(reports.includes('api("/analytics")'),"Admin reports must load aggregated analytics");
assert(reports.includes('"/report"') || reports.includes('+"/report"'),"Per-student reports must be authenticated");
assert(reports.includes('reportCsvValue') || reports.includes('function download('),"Student report export");
assert(admin.includes('reports.html?student='),"Directory links to student reports");
assert(admin.includes('href="reports.html"'),"Admin has analytics navigation");
assert(adminServer.includes('path==="/analytics"'),"Server analytics endpoint");
assert(adminServer.includes('reportMatch'),"Server per-student report endpoint");
console.log("All STEP portal contracts validated.");
