import assert from "node:assert/strict";
const origin="https://seifyadobe97-dotcom.github.io";
const base="https://funltjxavowlnnfibhpl.supabase.co/functions/v1/step-reading-live";
for(const path of ["/admin/catalog","/admin/grades","/catalog","/progress"]){
 const url=base+path;
 const res=await fetch(url,{method:"OPTIONS",headers:{"Origin":origin,
   "Access-Control-Request-Method":"GET","Access-Control-Request-Headers":"authorization,apikey"},
   signal:AbortSignal.timeout(15000)});
 assert.equal(res.status,200,"OPTIONS "+path+" must succeed");
 assert.equal(res.headers.get("access-control-allow-origin"),origin,"CORS origin "+path);
 assert(res.headers.get("access-control-allow-headers")?.includes("authorization"),"Authorization allowed");
}
for(const path of ["/admin/catalog","/admin/grades","/catalog","/progress"]){
 const res=await fetch(base+path,{method:"GET",headers:{"Origin":origin},
    signal:AbortSignal.timeout(15000)});
 assert.equal(res.status,401,"Unauthenticated "+path+" must be rejected");
 assert.equal(res.headers.get("access-control-allow-origin"),origin,"401 must carry browser-readable CORS header");
 const json=await res.json();
 assert(json.error,"401 returns helpful JSON");
}
console.log("PASS live STEP Reading CORS/preflight, all protected endpoints reject missing JWT with readable errors");
