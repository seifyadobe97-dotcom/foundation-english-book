import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const html=readFileSync(new URL("../step-grammar-student/listening-samples.html",import.meta.url),"utf8");
const hub=readFileSync(new URL("../step-grammar-student/curriculum-hub.js",import.meta.url),"utf8");
const base=readFileSync(new URL("../step-grammar-student/listening-demo.html",import.meta.url),"utf8");
assert.equal((html.match(/data-clip="record-[12]"/g)||[]).length,2);
assert.equal((html.match(/id:"r[12]-q[12]"/g)||[]).length,4);
assert.match(html,/type="file" id="audio-source"/);
assert.match(html,/step-listening-samples/);
assert.match(html,/StepListeningUI\.mount/);
assert.match(html,/StepPreviewLocalAssets/);
assert.match(html,/StepPreviewOfflineGrade/);
assert.match(html,/15[\s\S]*30|30 ثانية/);
assert(!html.includes('correct:"A"')&&!html.includes('correct:"D"'),
 "Neither answer keys nor sample transcripts may be embedded in public HTML");
assert(!html.includes("Teacher: That's all for today"));
assert(!html.includes("Lecturer: Good morning all of you."));
assert(hub.includes('href="listening-samples.html"'),
 "Authenticated hub must expose the two-source preview");
assert(!hub.includes('ready:true,demo:true'),"Do not mark real Listening courses as published");
assert(base.includes("listening-demo.js"),"Preserve the prior standalone synthetic demo");
for(const block of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(block[1]);
console.log("PASS source Listening preview: two audio groups, local real-file adapter, 30s simulator, private server grading and student entry");
