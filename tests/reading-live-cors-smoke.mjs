import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../step-grammar-student/reading-v2.html",import.meta.url),"utf8");
const key=html.match(/KEY="([^"]+)"/)?.[1];
assert(key,"Public client key available");
const origin="https://seifyadobe97-dotcom.github.io";
const endpoint="https://funltjxavowlnnfibhpl.supabase.co/rest/v1/rpc/step_reading_request";
const preflight=await fetch(endpoint,{method:"OPTIONS",headers:{
 Origin:origin,"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"apikey,authorization,content-type"},
 signal:AbortSignal.timeout(20000)});
assert(preflight.ok,"PostgREST preflight must not block browser");
assert(["*",origin].includes(preflight.headers.get("access-control-allow-origin")),"Preflight CORS origin allowed");
const res=await fetch(endpoint,{method:"POST",headers:{
 Origin:origin,apikey:key,authorization:"Bearer "+key,"content-type":"application/json"},
 body:JSON.stringify({p_action:"admin_catalog",p_payload:{}}),signal:AbortSignal.timeout(20000)});
assert([401,403,404].includes(res.status),"Anon must never access private Reading data. Got "+res.status);
assert(["*",origin].includes(res.headers.get("access-control-allow-origin")),"PostgREST errors must be browser-readable");
const response=await res.text();
assert(!response.includes("paragraphs")&&!response.includes("correct_choice"),"No passage data/answer keys leak");
console.log("PASS live Supabase REST CORS; anonymous access denied to Reading owner data");
