import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {firefox} from "playwright";
const html=readFileSync(new URL("../step-grammar-student/reading-v2.html",import.meta.url),"utf8");
const key=html.match(/KEY="([^"]+)"/)?.[1];
assert(key,"Public client key must be available");
const browser=await firefox.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:800}});
 await page.goto("https://seifyadobe97-dotcom.github.io/foundation-english-book/",{waitUntil:"domcontentloaded",timeout:35000});
 const outcome=await page.evaluate(async key=>{
  const url="https://funltjxavowlnnfibhpl.supabase.co/rest/v1/rpc/step_reading_request";
  try{
   const r=await fetch(url,{method:"POST",headers:{
    "apikey":key,"authorization":"Bearer "+key,"content-type":"application/json"},
    body:JSON.stringify({p_action:"admin_catalog",p_payload:{}})});
   return {status:r.status,body:await r.text()};
  }catch(error){return {error:String(error)};}
 },key);
 assert(!outcome.error,"Firefox real-origin Reading RPC request failed CORS/network: "+outcome.error);
 assert([401,403,404].includes(outcome.status),"Anonymous user must be denied: "+JSON.stringify(outcome));
 assert(!outcome.body?.includes("correct_choice"),"No private answer keys in error responses");
 console.log("PASS Firefox real GitHub Pages origin can reach rebuilt Reading REST API, and anon is denied");
 await page.close();
}finally{await browser.close();}
