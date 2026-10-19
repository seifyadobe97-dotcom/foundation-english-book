// STEP Present Simple learning API. Requires JWT from Supabase Auth.
// Only this function (service-role credentials) can write grades to database.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import lesson from "./lesson-data.json" with { type: "json" };

const allowedOrigins = new Set(["https://seifyadobe97-dotcom.github.io","http://localhost:3000","http://127.0.0.1:3000"]);
const supaUrl=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const apiKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
const total=lesson.sections.length;
const defaultExamCount=10;
const questions=lesson.questions as Record<string,{id:string;text:string;options:Record<string,string>;correct:string;explanation:string}>;
type AnswerMap=Record<string,string>;
const reply=(origin:string,status:number,body:unknown)=>new Response(JSON.stringify(body),{
 status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
 "Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"https://seifyadobe97-dotcom.github.io",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
 "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",Vary:"Origin"}
});
const serializeQ=(id:string)=>({id,text:questions[id].text,options:questions[id].options});
function randomIds(){const ids=Object.keys(questions);for(let i=ids.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}return ids.slice(0,defaultExamCount);}
function sectionStatus(attempts:{part_index:number;correct_count:number;passed:boolean}[]){
 const a=lesson.sections.map((s,i)=>{const list=attempts.filter(r=>r.part_index===i);
 return {index:i,id:s.id,title:s.title,titleAr:s.titleAr,tag:s.tag,short:s.short,duration:s.duration,questionCount:s.questionIds.length,
 required:Math.ceil(s.questionIds.length*lesson.requiredPassRate),
 locked:false,passed:list.some(r=>r.passed),best:Math.max(0,...list.map(r=>r.correct_count)),attempts:list.length};});
 let next=0;while(next<a.length&&a[next].passed)next++;
 return {sections:a.map(s=>({...s,locked:s.index>next})),next,completed:next===a.length};
}
const safeBody=async(r:Request)=>{const txt=await r.text();if(txt.length>16000)throw Error("request too large");return JSON.parse(txt)};
Deno.serve(async(request)=>{
 const origin=request.headers.get("origin")??"";
 const send=(status:number,value:unknown)=>reply(origin,status,value);
 if(request.method==="OPTIONS")return send(200,{ok:true});
 if(!allowedOrigins.has(origin))return send(403,{error:"Origin not allowed"});
 if(!supaUrl||!serviceKey||!apiKey)return send(503,{error:"Backend not configured"});
 const bearer=request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!bearer)return send(401,{error:"سجّل دخولك الأول"});
 const admin=createClient(supaUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:userData,error:authError}=await admin.auth.getUser(bearer);
 const user=userData?.user;
 if(authError||!user)return send(401,{error:"انتهت الجلسة. سجّل دخولك مرة تانية"});
 const path=new URL(request.url).pathname.replace(/^\/(?:functions\/v1\/)?step-course/,"");
 const method=request.method;
 const courseCode=lesson.code;
 try{
  const {data:partRows,error:attemptError}=await admin.from("step_part_attempts")
   .select("part_index,correct_count,passed").eq("user_id",user.id).eq("course_code",courseCode);
  if(attemptError)throw attemptError;
  const status=sectionStatus(partRows??[]);
  const getCourse=async()=>{
   const {data:exams,error}=await admin.from("step_exam_attempts")
     .select("correct_count,total_questions,attempted_at")
     .eq("user_id",user.id).eq("course_code",courseCode).order("attempted_at",{ascending:true});
   if(error)throw error;
   const attempts=(exams??[]).map(x=>({score:x.correct_count,total:x.total_questions,percentage:Math.round(x.correct_count/x.total_questions*100),date:x.attempted_at}));
   return {student:user.user_metadata?.username||"طالب STEP",
    course:{title:lesson.title,titleAr:lesson.titleAr,code:courseCode,subtitle:lesson.subtitle,totalQuestions:Object.keys(questions).length},
    sections:status.sections,nextIndex:Math.min(status.next,total-1),completed:status.completed,
    exam:{unlocked:status.completed,attempts:attempts.length,best:Math.max(0,...attempts.map(x=>x.percentage)),last:attempts.at(-1)||null}};
  };
  if(method==="GET"&&path==="/me")return send(200,{student:user.user_metadata?.username||"طالب STEP"});
  if(method==="GET"&&path==="/course")return send(200,await getCourse());
  const partPath=path.match(/^\/parts\/([0-9]+)(\/submit)?$/);
  if(partPath){
   const index=Number(partPath[1]),s=lesson.sections[index];
   if(!s)return send(404,{error:"الجزء غير موجود"});
   if(index>status.next)return send(403,{error:"لازم تنجح في الأجزاء السابقة الأول"});
   const passRequired=Math.ceil(s.questionIds.length*lesson.requiredPassRate);
   if(method==="GET"&&!partPath[2])return send(200,{part:{...s,passRequired,questions:s.questionIds.map(serializeQ)},progress:await getCourse()});
   if(method==="POST"&&partPath[2]){
    const input=await safeBody(request),answers=input?.answers as AnswerMap;
    if(!answers||s.questionIds.some((id:string)=>!["A","B","C","D"].includes(answers[id])))return send(422,{error:"جاوب كل الأسئلة الأول"});
    const results=s.questionIds.map((id:string)=>{const q=questions[id];return {id,selected:answers[id],correct:q.correct,isCorrect:answers[id]===q.correct,explanation:q.explanation};});
    const correctCount=results.filter((x:{isCorrect:boolean})=>x.isCorrect).length,passed=correctCount>=passRequired;
    const {error}=await admin.from("step_part_attempts").insert({user_id:user.id,course_code:courseCode,part_index:index,correct_count:correctCount,total_questions:results.length,passed});
    if(error)throw error;
    // Update the in-memory status before computing the response.
    (partRows??[]).push({part_index:index,correct_count:correctCount,passed});
    const fresh=sectionStatus(partRows??[]);
    const progress=await getCourse();
    progress.sections=fresh.sections;progress.nextIndex=Math.min(fresh.next,total-1);progress.completed=fresh.completed;progress.exam.unlocked=fresh.completed;
    return send(200,{passed,correctCount,total:results.length,required:passRequired,results,progress});
   }
  }
  if(path==="/exam"&&method==="GET"){
   if(!status.completed)return send(403,{error:"الاختبار مقفول لحد ما تنجح في كل الأجزاء"});
   const {data:active,error}=await admin.from("step_active_exams").select("question_ids").eq("user_id",user.id).eq("course_code",courseCode).maybeSingle();
   if(error)throw error;
   let ids=active?.question_ids as string[]|undefined;
   if(!ids){
    ids=randomIds();
    const {error:saveErr}=await admin.from("step_active_exams").upsert({user_id:user.id,course_code:courseCode,question_ids:ids},{onConflict:"user_id,course_code"});
    if(saveErr)throw saveErr;
   }
   return send(200,{questions:ids.map(serializeQ),total:ids.length});
  }
  if(path==="/exam/submit"&&method==="POST"){
   if(!status.completed)return send(403,{error:"الاختبار مقفول"});
   const {data:active,error}=await admin.from("step_active_exams").select("question_ids").eq("user_id",user.id).eq("course_code",courseCode).maybeSingle();
   if(error||!active)return send(403,{error:"افتح الاختبار الأول"});
   const ids=active.question_ids as string[],input=await safeBody(request),answers=input?.answers as AnswerMap;
   if(!answers||ids.some(id=>!["A","B","C","D"].includes(answers[id])))return send(422,{error:"جاوب كل الأسئلة"});
   const results=ids.map(id=>{const q=questions[id];return{id,text:q.text,selected:answers[id],correct:q.correct,isCorrect:answers[id]===q.correct,explanation:q.explanation};});
   const score=results.filter(x=>x.isCorrect).length;
   const record={score,total:results.length,percentage:Math.round(score/results.length*100),date:new Date().toISOString()};
   const {error:saveErr}=await admin.from("step_exam_attempts").insert({user_id:user.id,course_code:courseCode,correct_count:score,total_questions:results.length});
   if(saveErr)throw saveErr;
   await admin.from("step_active_exams").delete().eq("user_id",user.id).eq("course_code",courseCode);
   return send(200,{result:record,results,progress:await getCourse()});
  }
  return send(404,{error:"المسار غير موجود"});
 }catch(error){console.error("STEP course API error",error);return send(500,{error:"تعذر إكمال العملية، حاول مرة أخرى"});}
});
