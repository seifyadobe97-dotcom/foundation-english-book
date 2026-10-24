import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const student=read("step-grammar-student/listening-live.html");
const admin=read("step-grammar-admin/listening-audio.html");
const hub=read("step-grammar-student/curriculum-hub.js");
const old=read("step-grammar-student/listening-samples.html");
const api=read("supabase/functions/step-listening-live/index.ts");
const sql=read("supabase/migrations/20261024_listening_student_recordings_catalog.sql");
assert.match(hub,/href="listening-live\.html"/);
assert(student.includes("step-listening-live/begin")||student.includes('api("/begin"'));
assert(student.includes('api("/submit"'));
assert(student.includes('api("/prepare"'));
assert(!student.includes('type="file"'),"Student never supplies audio");
assert(!student.includes("correct_choice"));
assert(!student.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert(!student.includes("transcript:"));
assert(admin.includes('type="file"'));
assert(admin.includes('id="rights"'),"Owner must attest to clip rights");
assert(api.includes('step_listening_attempts')&&api.includes('step_listening_responses'),"Tracked grading is required");
assert(api.includes('createSignedUrl')&&api.includes('owner'),"Private signed audio and owner upload required");
assert(api.includes('state:"submitted"'),"Submission must close attempts");
assert(sql.includes("'draft'")&&sql.includes("'record-1'")&&sql.includes("'record-2'"));
assert(old.includes('id="audio-source"'),"Keep previous opt-in local audio trial untouched as archive");
for(const page of [student,admin]){
 for(const script of page.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(script[1]);
}
console.log("PASS private Listening integration: student auto-audio, owner-only uploader, signed Storage, server grading, no public keys");
