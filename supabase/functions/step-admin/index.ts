// Private administrative API for STEP Grammar, authenticated with Supabase JWT.
// The service-role key is available only inside this Edge Function, never in public HTML.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import lesson from "./lesson-data.json" with { type: "json" };
const url=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const allow=new Set(["https://seifyadobe97-dotcom.github.io","http://localhost:3000","http://127.0.0.1:3000"]);
const isUUID=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin")??"";
 const cors={"Access-Control-Allow-Origin":allow.has(origin)?origin:"https://seifyadobe97-dotcom.github.io",
  "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods":"GET,POST,OPTIONS","Vary":"Origin","Cache-Control":"no-store",
  "Content-Type":"application/json; charset=utf-8"};
 const reply=(code:number,obj:unknown)=>new Response(JSON.stringify(obj),{status:code,headers:cors});
 if(req.method==="OPTIONS")return reply(200,{ok:true});
 if(!allow.has(origin))return reply(403,{error:"Origin not allowed"});
 if(!url||!serviceKey)return reply(503,{error:"Service unavailable"});
 const token=req.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return reply(401,{error:"سجل دخولك الأول"});
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error:authError}=await admin.auth.getUser(token);
 if(authError||!auth?.user)return reply(401,{error:"الجلسة غير صالحة"});
 const {data:permission,error:roleError}=await admin.from("step_admin_accounts").select("role")
  .eq("user_id",auth.user.id).maybeSingle();
 if(roleError)return reply(500,{error:"تعذر فحص الصلاحيات"});
 if(!permission)return reply(403,{error:"الحساب الحالي غير مخوّل لفتح لوحة الأدمن"});
 const path=new URL(req.url).pathname.replace(/^\/(?:functions\/v1\/)?step-admin/,"")||"/";
 if(req.method==="GET"&&path==="/me"){
  return reply(200,{role:permission.role,username:auth.user.user_metadata?.username||"Admin"});
 }
 if(req.method==="GET"&&path==="/students"){
  const u=new URL(req.url);
  const page=Math.max(1,Math.min(10000,Number.parseInt(u.searchParams.get("page")||"1")||1));
  const size=25,offset=(page-1)*size;
  const search=(u.searchParams.get("q")||"").trim().slice(0,48).replace(/[^a-zA-Z0-9_@.+-]/g,"");
  try{
   let query=admin.from("step_student_profiles")
    .select("user_id,username,email,phone_e164,is_active,created_at",{count:"exact"})
    .order("created_at",{ascending:false});
   if(search)query=query.or("username.ilike.%"+search+"%,email.ilike.%"+search+"%,phone_e164.ilike.%"+search+"%");
   const {data:students,count,error}=await query.range(offset,offset+size-1);
   if(error)throw error;
   const ids=(students||[]).map(x=>x.user_id as string);
   let parts:any[]=[],exams:any[]=[];
   if(ids.length){
    const [partResult,examResult]=await Promise.all([
     admin.from("step_part_attempts").select("user_id,part_index,passed,attempted_at")
      .eq("course_code","ASGQPRSIM").in("user_id",ids).order("attempted_at",{ascending:false}).limit(10000),
     admin.from("step_exam_attempts").select("user_id,correct_count,total_questions,attempted_at")
      .eq("course_code","ASGQPRSIM").in("user_id",ids).order("attempted_at",{ascending:false}).limit(10000)
    ]);
    if(partResult.error||examResult.error)throw(partResult.error||examResult.error);
    parts=partResult.data||[];exams=examResult.data||[];
   }
   const rows=(students||[]).map(p=>{
    const pass=new Set(parts.filter(x=>x.user_id===p.user_id&&x.passed).map(x=>x.part_index));
    const scores=exams.filter(x=>x.user_id===p.user_id).map(x=>Math.round(x.correct_count*100/x.total_questions));
    const moments=[...parts.filter(x=>x.user_id===p.user_id).map(x=>x.attempted_at),
      ...exams.filter(x=>x.user_id===p.user_id).map(x=>x.attempted_at)];
    moments.sort((a,b)=>b.localeCompare(a));
    return {user_id:p.user_id,username:p.username,email:p.email||"",phone:p.phone_e164||"",
      active:p.is_active,created_at:p.created_at,parts_passed:pass.size,
      exam_best:scores.length?Math.max(...scores):null,
      exam_attempts:scores.length,last_activity:moments[0]||null};
   });
   return reply(200,{students:rows,total:count||0,page,page_size:size,role:permission.role});
  }catch(error){console.error("STEP admin list failed",error);return reply(500,{error:"تعذر تحميل بيانات الطلاب"});}
 }
 if(req.method==="POST"&&path==="/student-status"){
  if(permission.role!=="owner")return reply(403,{error:"تعديل الحسابات متاح لمدير المعهد فقط"});
  try{
   const raw=await req.text();if(raw.length>1500)return reply(413,{error:"Invalid request"});
   const payload=JSON.parse(raw);
   if(!isUUID(payload.user_id)||typeof payload.active!=="boolean")return reply(422,{error:"بيانات غير صحيحة"});
   // Never suspend an admin account, including the current owner.
   const {data:targetAdmin}=await admin.from("step_admin_accounts").select("user_id")
    .eq("user_id",payload.user_id).maybeSingle();
   if(targetAdmin)return reply(403,{error:"لا يمكن إيقاف حساب أدمن من هذه الصفحة"});
   const {data:student,error}=await admin.from("step_student_profiles")
    .update({is_active:payload.active}).eq("user_id",payload.user_id).select("user_id,is_active").maybeSingle();
   if(error||!student)return reply(404,{error:"الطالب غير موجود"});
   const {error:auditError}=await admin.from("step_admin_audit_log").insert({
     admin_user_id:auth.user.id,student_user_id:student.user_id,action:payload.active?"activate":"suspend"});
   if(auditError)console.error("STEP audit recording failed",auditError);
   return reply(200,{ok:true,active:student.is_active});
  }catch(error){console.error("STEP admin status failed",error);return reply(500,{error:"تعذر تعديل الحساب"});}
 }

 // Question-editor API. Public students never access these admin routes.
 if(path==="/questions"&&req.method==="GET"){
  try{
   const {data:edits,error}=await admin.from("step_question_edits").select("*").eq("course_code",lesson.code).limit(1000);
   if(error)throw error;
   const sectionIds=new Map<string,number>();
   lesson.sections.forEach((s,index)=>s.questionIds.forEach(id=>sectionIds.set(id,index)));
   const base=Object.values(lesson.questions).map(q=>({
    id:q.id,part_index:sectionIds.get(q.id),text:q.text,options:q.options,correct:q.correct,
    explanation:q.explanation,status:"published",origin:"source",
    source:q.source||null,has_edit:false
   }));
   const all=new Map(base.map(q=>[q.id,q]));
   for(const e of edits||[]){
    const canonical=all.get(e.id);
    all.set(e.id,{...(canonical||{}),id:e.id,part_index:e.part_index,text:e.question_text,
     options:e.options,correct:e.correct,explanation:e.explanation,status:e.status,
     origin:canonical?"source":"custom",source:canonical?.source||null,has_edit:true});
   }
   return reply(200,{
    sections:lesson.sections.map((s,i)=>({index:i,title:s.titleAr,english:s.title})),
    questions:Array.from(all.values()),total:all.size,
   });
  }catch(error){console.error("admin questions",error);return reply(500,{error:"تعذر تحميل بنك الأسئلة"});}
 }
 if(path==="/questions/save"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"تحرير الأسئلة متاح للمدير فقط"});
  try{
   const raw=await req.text();if(raw.length>18000)return reply(413,{error:"المدخلات طويلة جدًا"});
   const a=JSON.parse(raw);
   const part=Number(a.part_index);
   const isExisting=typeof a.id==="string"&&Object.hasOwn(lesson.questions,a.id);
   if(!Number.isInteger(part)||part<0||part>=lesson.sections.length)return reply(422,{error:"اختار جزءًا صحيحًا"});
   if(isExisting&&!lesson.sections[part].questionIds.includes(a.id))return reply(422,{error:"لا يمكن نقل سؤال المصدر إلى جزء آخر"});
   const title=String(a.text||"").trim(),exp=String(a.explanation||"").trim();
   if(title.length<8||title.length>2000||exp.length>2500)return reply(422,{error:"راجع طول نص السؤال والشرح"});
   const options=a.options;
   if(!options||typeof options!=="object"||["A","B","C","D"].some(x=>typeof options[x]!=="string"||options[x].trim().length<1||options[x].trim().length>500))return reply(422,{error:"اكتب الاختيارات الأربعة"});
   if(!["A","B","C","D"].includes(a.correct))return reply(422,{error:"اختار الإجابة الصحيحة"});
   let id:string;
   if(isExisting)id=a.id;
   else if(typeof a.id==="string"&&a.id.startsWith("STEP-NEW-")){
    // Only allow updates to existing custom rows, not caller-chosen new IDs.
    const {data:existing}=await admin.from("step_question_edits").select("id").eq("id",a.id).eq("course_code",lesson.code).maybeSingle();
    if(!existing)return reply(404,{error:"السؤال غير موجود"});
    id=a.id;
   }else if(!a.id) id="STEP-NEW-"+crypto.randomUUID();
   else return reply(422,{error:"معرّف السؤال غير صحيح"});
   const payload={id,course_code:lesson.code,part_index:part,question_text:title,
    options:{A:options.A.trim(),B:options.B.trim(),C:options.C.trim(),D:options.D.trim()},
    correct:a.correct,explanation:exp,status:"draft",created_by:auth.user.id,updated_at:new Date().toISOString()};
   const {error}=await admin.from("step_question_edits").upsert(payload,{onConflict:"id"});
   if(error)throw error;
   return reply(200,{ok:true,id,status:"draft"});
  }catch(error){console.error("question save",error);return reply(500,{error:"تعذر حفظ السؤال"});}
 }
 if(path==="/questions/publish"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"النشر متاح للمدير فقط"});
  try{
   const payload=JSON.parse(await req.text());
   const id=String(payload.id||"");
   if(id.length>100)return reply(422,{error:"معرّف غير صحيح"});
   const {data:existing,error:findError}=await admin.from("step_question_edits").select("id,part_index").eq("id",id).eq("course_code",lesson.code).maybeSingle();
   if(findError||!existing)return reply(404,{error:"احفظ السؤال كمسودة الأول"});
   const {error}=await admin.from("step_question_edits").update({status:"published",updated_at:new Date().toISOString()}).eq("id",id).eq("course_code",lesson.code);
   if(error)throw error;
   return reply(200,{ok:true,id,status:"published"});
  }catch(error){console.error("question publish",error);return reply(500,{error:"تعذر نشر السؤال"});}
 }
 if(path==="/questions/archive"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"الأرشفة متاحة للمدير فقط"});
  try{
   const payload=JSON.parse(await req.text()),id=String(payload.id||"");
   if(!id.startsWith("STEP-NEW-")||id.length>100)return reply(422,{error:"لا يمكن أرشفة أسئلة المصدر الأصلية"});
   const {error}=await admin.from("step_question_edits").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",id).eq("course_code",lesson.code);
   if(error)throw error;
   return reply(200,{ok:true,id,status:"archived"});
  }catch(error){console.error("question archive",error);return reply(500,{error:"تعذر أرشفة السؤال"});}
 }
 return reply(404,{error:"المسار غير موجود"});
});
