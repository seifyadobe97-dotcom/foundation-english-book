import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const fn=read("supabase/functions/step-reading-live/index.ts");
const admin=read("step-grammar-admin/reading.html");
const student=read("step-grammar-student/reading-live.html");
assert(fn.includes("getUser(jwt)"),"Every request must validate user session server-side");
assert(fn.indexOf("getUser(jwt)")<fn.indexOf('if(path.startsWith("/admin/"))'),"Authentication precedes owner operations");
assert(fn.includes('if(!await isOwner())'),"Owner-only admin routes");
assert(fn.includes('if(!await isStudent())'),"Active student only");
assert(fn.includes('if(!jwt)return send(401'),"Missing tokens always denied");
assert(fn.includes('if(req.method==="OPTIONS")'),"Browser preflight explicitly supported");
assert(fn.includes('https://seifyadobe97-dotcom.github.io'));
assert(fn.includes('https://www.qdrat.edu.sa'));
assert(admin.includes("refreshSession()"),"Owner session is refreshed once after network/401 error");
assert(student.includes("refreshSession()"),"Student session is refreshed once after network/401 error");
assert(admin.includes('id="retry-reading"'),"Explicit admin retry");
for(const html of [admin,student]){
 for(const match of html.matchAll(/<script>([\s\S]*?)<\\/script>/g))new Script(match[1]);
}
console.log("PASS protected Reading network contract, owner and student session recovery, CORS");
