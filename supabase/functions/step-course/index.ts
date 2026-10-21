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
const originalQuestions=lesson.questions as Record<string,{id:string;text:string;options:Record<string,string>;correct:string;explanation:string;wrongReasons?:Record<string,string>}>;
type AnswerMap=Record<string,string>;
const reply=(origin:string,status:number,body:unknown)=>new Response(JSON.stringify(body),{
 status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
 "Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"https://seifyadobe97-dotcom.github.io",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
 "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",Vary:"Origin"}
});
const serializeQ=(id:string,questions:typeof originalQuestions,publicId:string)=>({id:publicId,text:questions[id].text,options:questions[id].options});
function randomIds(pool:string[]){const ids=[...pool];for(let i=ids.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}return ids.slice(0,defaultExamCount);}
function sectionStatus(attempts:{part_index:number;correct_count:number;passed:boolean}[],effectiveLesson:typeof lesson){
 const a=effectiveLesson.sections.map((s,i)=>{const list=attempts.filter(r=>r.part_index===i);
 return {index:i,id:s.id,title:s.title,titleAr:s.titleAr,tag:s.tag,short:s.short,duration:s.duration,questionCount:s.questionIds.length,
 required:Math.ceil(s.questionIds.length*effectiveLesson.requiredPassRate),
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
 const {data:studentAccount,error:studentError}=await admin.from("step_student_profiles").select("is_active").eq("user_id",user.id).maybeSingle();
 if(studentError||!studentAccount)return send(403,{error:"لا يوجد ملف طالب مرتبط بالحساب"});
 if(studentAccount.is_active===false)return send(403,{error:"الحساب موقوف مؤقتًا، تواصل مع إدارة المنصة"});
 const path=new URL(request.url).pathname.replace(/^\/(?:functions\/v1\/)?step-course/,"");
 const method=request.method;
 const courseCode=lesson.code;
 try{
  // Published edits are read at request-time. Drafts never affect student questions.
  const {data:editRows,error:editError}=await admin.from("step_question_edits")
    .select("id,part_index,question_text,options,correct,explanation,status")
    .eq("course_code",courseCode).limit(1000);
  if(editError)throw editError;
  const questions={...originalQuestions};
  const effectiveLesson={...lesson,sections:lesson.sections.map(s=>({...s,questionIds:[...s.questionIds]}))};
  // Apply only published owner-reviewed lesson content; never allow edits to
  // question IDs, section identifiers, pass thresholds or course routing.
  const {data:lessonEditRows,error:lessonEditError}=await admin.from("step_lesson_content_edits")
   .select("part_index,published").eq("course_code",courseCode).not("published","is",null);
  if(lessonEditError)throw lessonEditError;
  const editableKeys=["titleAr","subtitle","short","duration","description","rule",
    "alternativeRule","gold","mistake","examples","tiles"];
  for(const row of lessonEditRows||[]){
   if(!Number.isInteger(row.part_index)||!effectiveLesson.sections[row.part_index]
     ||!row.published||typeof row.published!=="object")continue;
   const base=effectiveLesson.sections[row.part_index];
   for(const key of editableKeys){
    if(Object.hasOwn(row.published,key))base[key]=row.published[key];
   }
  }
  for(const edit of editRows||[]){
   const canonical=Object.hasOwn(originalQuestions,edit.id);
   // Never reuse a distractor rationale if an admin has changed its question, options, or answer.
   const sameOriginal=canonical&&edit.question_text===originalQuestions[edit.id].text
     &&edit.correct===originalQuestions[edit.id].correct
     &&["A","B","C","D"].every(k=>edit.options?.[k]===originalQuestions[edit.id].options[k]);
   const entry={id:edit.id,text:edit.question_text,options:edit.options,correct:edit.correct,
     explanation:edit.explanation,wrongReasons:sameOriginal?originalQuestions[edit.id].wrongReasons:undefined};
   // Retain archived custom question text for exams started before it was archived.
   if(!canonical)questions[edit.id]=entry;
   if(edit.status!=="published")continue;
   if(canonical){questions[edit.id]=entry;continue;}
   const section=effectiveLesson.sections[edit.part_index];
   if(section&&!section.questionIds.includes(edit.id))section.questionIds.push(edit.id);
  }
  const activeQuestionIds=effectiveLesson.sections.flatMap(s=>s.questionIds);
  const showQuestions=(ids:string[])=>ids.map((id,i)=>serializeQ(id,questions,"q"+(i+1)));
  const {data:partRows,error:attemptError}=await admin.from("step_part_attempts")
   .select("part_index,correct_count,passed").eq("user_id",user.id).eq("course_code",courseCode);
  if(attemptError)throw attemptError;
  const status=sectionStatus(partRows??[],effectiveLesson);
  const getCourse=async()=>{
   const {data:exams,error}=await admin.from("step_exam_attempts")
     .select("correct_count,total_questions,attempted_at")
     .eq("user_id",user.id).eq("course_code",courseCode).order("attempted_at",{ascending:true});
   if(error)throw error;
   const attempts=(exams??[]).map(x=>({score:x.correct_count,total:x.total_questions,percentage:Math.round(x.correct_count/x.total_questions*100),date:x.attempted_at}));
   return {student:user.user_metadata?.username||"طالب STEP",
    course:{title:lesson.title,titleAr:lesson.titleAr,subtitle:lesson.subtitle,totalQuestions:activeQuestionIds.length},
    sections:status.sections,nextIndex:Math.min(status.next,total-1),completed:status.completed,
    exam:{unlocked:status.completed,attempts:attempts.length,best:Math.max(0,...attempts.map(x=>x.percentage)),last:attempts.at(-1)||null}};
  };
  if(method==="GET"&&path==="/catalog"){
   const [axes,indicators]=await Promise.all([
    admin.from("step_curriculum_axes")
     .select("code,title_ar,title_en,position,content_model").order("position"),
    admin.from("step_curriculum_indicators")
     .select("axis_code,slug,title_ar,title_en,description,position,legacy_course_code")
     .eq("status","published").order("position")
   ]);
   if(axes.error||indicators.error)throw(axes.error||indicators.error);
   return send(200,{axes:axes.data||[],indicators:(indicators.data||[]).map(i=>({
    axis_code:i.axis_code,slug:i.slug,title_ar:i.title_ar,title_en:i.title_en,
    position:i.position
   }))});
  }
  if(method==="GET"&&path==="/me")return send(200,{student:user.user_metadata?.username||"طالب STEP"});
  // Instructor source notes stay private; learners use the unified course page.
  if(method==="GET"&&path==="/guide")return send(410,{error:"شرح المؤشر موجود في الدرس التفاعلي الجديد"});
  if(method==="GET"&&path==="/course")return send(200,await getCourse());
  const partPath=path.match(/^\/parts\/([0-9]+)(\/submit)?$/);
  if(partPath){
   const index=Number(partPath[1]),s=effectiveLesson.sections[index];
   if(!s)return send(404,{error:"الجزء غير موجود"});
   if(index>status.next)return send(403,{error:"لازم تنجح في الأجزاء السابقة الأول"});
   const passRequired=Math.ceil(s.questionIds.length*effectiveLesson.requiredPassRate);
   if(method==="GET"&&!partPath[2]){const {questionIds:_privateIds,...studentPart}=s;return send(200,{part:{...studentPart,passRequired,questions:showQuestions(s.questionIds)},progress:await getCourse()});}
   if(method==="POST"&&partPath[2]){
    const input=await safeBody(request),answers=input?.answers as AnswerMap;
    if(!answers||s.questionIds.some((id:string,i:number)=>!["A","B","C","D"].includes(answers["q"+(i+1)]??answers[id])))return send(422,{error:"جاوب كل الأسئلة الأول"});
    const results=s.questionIds.map((id:string,i:number)=>{const q=questions[id],selected=answers["q"+(i+1)]??answers[id];return {id:"q"+(i+1),selected,correct:q.correct,isCorrect:selected===q.correct,
      wrongReason:selected===q.correct?null:(q.wrongReasons?.[selected]??null),explanation:q.explanation};});
    const correctCount=results.filter((x:{isCorrect:boolean})=>x.isCorrect).length,passed=correctCount>=passRequired;
    const {error}=await admin.from("step_part_attempts").insert({user_id:user.id,course_code:courseCode,part_index:index,correct_count:correctCount,total_questions:results.length,passed});
    if(error)throw error;
    // Update the in-memory status before computing the response.
    (partRows??[]).push({part_index:index,correct_count:correctCount,passed});
    const fresh=sectionStatus(partRows??[],effectiveLesson);
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
    ids=randomIds(activeQuestionIds);
    const {error:saveErr}=await admin.from("step_active_exams").upsert({user_id:user.id,course_code:courseCode,question_ids:ids},{onConflict:"user_id,course_code"});
    if(saveErr)throw saveErr;
   }
   return send(200,{questions:showQuestions(ids),total:ids.length});
  }
  if(path==="/exam/submit"&&method==="POST"){
   if(!status.completed)return send(403,{error:"الاختبار مقفول"});
   const {data:active,error}=await admin.from("step_active_exams").select("question_ids").eq("user_id",user.id).eq("course_code",courseCode).maybeSingle();
   if(error||!active)return send(403,{error:"افتح الاختبار الأول"});
   const ids=active.question_ids as string[],input=await safeBody(request),answers=input?.answers as AnswerMap;
   if(!answers||ids.some((id,i)=>!["A","B","C","D"].includes(answers["q"+(i+1)]??answers[id])))return send(422,{error:"جاوب كل الأسئلة"});
   const results=ids.map((id,i)=>{const q=questions[id],selected=answers["q"+(i+1)]??answers[id];return{id:"q"+(i+1),text:q.text,selected,correct:q.correct,isCorrect:selected===q.correct,
      wrongReason:selected===q.correct?null:(q.wrongReasons?.[selected]??null),explanation:q.explanation};});
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
