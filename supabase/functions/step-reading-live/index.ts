// Retired Reading V1 endpoint. All Reading work is now performed through
// authenticated PostgREST function public.step_reading_request.
// This endpoint deliberately exposes no student, owner, or answer-key data.
Deno.serve((request:Request)=>{
 const origin=request.headers.get("origin")||"";
 const allow=["https://seifyadobe97-dotcom.github.io","https://www.qdrat.edu.sa","https://qdrat.edu.sa"];
 const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":allow.includes(origin)?origin:allow[0],
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info","Cache-Control":"no-store","Vary":"Origin"};
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 return new Response(JSON.stringify({error:"Reading V1 retired; use authenticated step_reading_request RPC.",code:"READING_V1_RETIRED"}),{status:410,headers});
});