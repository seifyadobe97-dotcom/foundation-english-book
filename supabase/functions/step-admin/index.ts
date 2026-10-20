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

 if(req.method==="GET"&&path==="/analytics"){
  try{
   const [overview,parts]=await Promise.all([
     admin.from("step_admin_overview").select("*").single(),
     admin.from("step_admin_part_statistics").select("*").order("part_index")
   ]);
   if(overview.error||parts.error)throw(overview.error||parts.error);
   return reply(200,{overview:overview.data,parts:(parts.data||[]).map(s=>({
     ...s,title:lesson.sections[s.part_index]?.titleAr||"جزء "+(s.part_index+1)
   }))});
  }catch(error){console.error("STEP analytics failed",error);return reply(500,{error:"تعذر تحميل إحصائيات المعهد"});}
 }
 const reportMatch=path.match(/^\/students\/([0-9a-f-]{36})\/report$/i);
 if(req.method==="GET"&&reportMatch){
  const studentId=reportMatch[1];
  if(!isUUID(studentId))return reply(422,{error:"معرّف الطالب غير صحيح"});
  try{
   const [profile,partRows,examRows,partCount,examCount]=await Promise.all([
    admin.from("step_student_profiles").select("user_id,username,email,phone_e164,is_active,created_at").eq("user_id",studentId).maybeSingle(),
    admin.from("step_part_attempts").select("id,part_index,correct_count,total_questions,passed,attempted_at")
      .eq("user_id",studentId).eq("course_code",lesson.code).order("attempted_at",{ascending:false}).limit(300),
    admin.from("step_exam_attempts").select("id,correct_count,total_questions,attempted_at")
      .eq("user_id",studentId).eq("course_code",lesson.code).order("attempted_at",{ascending:false}).limit(150),
    admin.from("step_part_attempts").select("id",{count:"exact",head:true}).eq("user_id",studentId).eq("course_code",lesson.code),
    admin.from("step_exam_attempts").select("id",{count:"exact",head:true}).eq("user_id",studentId).eq("course_code",lesson.code),
   ]);
   if(profile.error||partRows.error||examRows.error||partCount.error||examCount.error)
     throw(profile.error||partRows.error||examRows.error||partCount.error||examCount.error);
   if(!profile.data)return reply(404,{error:"الطالب غير موجود"});
   const attempts=partRows.data||[],exams=examRows.data||[];
   const sections=lesson.sections.map((s,index)=>{
    const matching=attempts.filter(r=>r.part_index===index);
    return {index,title:s.titleAr,source_questions:s.questionIds.length,
      attempts:matching.length,passed:matching.some(r=>r.passed),
      best_percent:matching.length?Math.max(...matching.map(r=>Math.round(100*r.correct_count/r.total_questions))):null,
      latest_attempt:matching[0]?.attempted_at||null};
   });
   const passed=sections.filter(s=>s.passed).length;
   return reply(200,{
    student:{user_id:profile.data.user_id,username:profile.data.username,email:profile.data.email||"",
      phone:profile.data.phone_e164||"",active:profile.data.is_active,joined:profile.data.created_at},
    summary:{passed_parts:passed,total_parts:sections.length,
      practice_attempts:partCount.count||0,exam_attempts:examCount.count||0,
      best_exam_percent:exams.length?Math.max(...exams.map(e=>Math.round(100*e.correct_count/e.total_questions))):null,
      part_history_truncated:(partCount.count||0)>attempts.length,
      exam_history_truncated:(examCount.count||0)>exams.length},
    sections,
    attempts:attempts.map(r=>({...r,percentage:Math.round(100*r.correct_count/r.total_questions),
      section_title:lesson.sections[r.part_index]?.titleAr||"جزء غير معروف"})),
    exams:exams.map(r=>({...r,percentage:Math.round(100*r.correct_count/r.total_questions)}))
   });
  }catch(error){console.error("STEP student report failed",error);return reply(500,{error:"تعذر تحميل تقرير الطالب"});}
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

 // Editing course text is independent from question-bank changes and exam scores.
 if(path==="/lessons"&&req.method==="GET"){
  try{
   const {data,error}=await admin.from("step_lesson_content_edits")
    .select("part_index,draft,published,draft_updated_at,published_at")
    .eq("course_code",lesson.code);
   if(error)throw error;
   const changes=new Map((data||[]).map(x=>[x.part_index,x]));
   return reply(200,{course:lesson.title,sections:lesson.sections.map((original,i)=>{
    const change=changes.get(i);
    const {questionIds,...content}=original;
    return {index:i,base:content,draft:change?.draft||null,published:change?.published||null,
      draft_updated_at:change?.draft_updated_at||null,published_at:change?.published_at||null};
   })});
  }catch(error){console.error("admin lessons list",error);return reply(500,{error:"تعذر فتح محرر الدروس"});}
 }
 if(path==="/lessons/save"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"تعديل الدروس متاح للمدير فقط"});
  try{
   const raw=await req.text();if(raw.length>48000)return reply(413,{error:"حجم الدرس كبير جدًا"});
   const input=JSON.parse(raw);
   const i=Number(input.part_index),base=lesson.sections[i];
   if(!Number.isInteger(i)||!base)return reply(422,{error:"رقم الجزء غير صحيح"});
   const d=input.content;
   if(!d||typeof d!=="object"||Array.isArray(d))return reply(422,{error:"بيانات الدرس غير صحيحة"});
   const take=(v:unknown,label:string,min=1,max=2500)=>{
    if(typeof v!=="string"||v.trim().length<min||v.trim().length>max)throw Error("راجع حقل "+label);
    return v.trim();
   };
   const tokens=(v:unknown,label:string)=>{
    if(!Array.isArray(v)||v.length<1||v.length>14)return null;
    return v.map((t,index)=>take(t,label+" "+(index+1),1,140));
   };
   const mainRule=tokens(d.rule,"القاعدة");
   if(!mainRule)return reply(422,{error:"القاعدة الأساسية مطلوبة"});
   let altRule:null|string[]=null;
   if(base.alternativeRule){
    altRule=tokens(d.alternativeRule,"القاعدة البديلة");
    if(!altRule)return reply(422,{error:"القاعدة البديلة مطلوبة"});
   }
   if(!d.gold||!d.mistake||!Array.isArray(d.examples)||!Array.isArray(d.tiles)
     ||d.examples.length!==base.examples.length||d.tiles.length!==base.tiles.length)
      return reply(422,{error:"راجع عدد الأمثلة والبطاقات"});
   const content={
    titleAr:take(d.titleAr,"عنوان الجزء",3,110),
    subtitle:take(d.subtitle,"العنوان الفرعي",3,180),
    short:take(d.short,"وصف مختصر",2,180),
    duration:take(d.duration,"المدة",2,35),
    description:take(d.description,"الشرح",15,4500),
    rule:mainRule,
    ...(altRule?{alternativeRule:altRule}:{}),
    gold:{title:take(d.gold.title,"عنوان القاعدة الذهبية",3,120),
      body:take(d.gold.body,"القاعدة الذهبية",5,2200)},
    mistake:{wrong:take(d.mistake.wrong,"مثال الخطأ",2,300),
      right:take(d.mistake.right,"التصحيح",2,300),
      why:take(d.mistake.why,"سبب التصحيح",5,950)},
    examples:d.examples.map((e,j)=>({en:take(e?.en,"المثال الإنجليزي "+(j+1),3,500),
      ar:take(e?.ar,"معنى المثال "+(j+1),2,500)})),
    tiles:d.tiles.map((e,j)=>({icon:base.tiles[j].icon,
      label:take(e?.label,"عنوان البطاقة "+(j+1),1,100),
      text:take(e?.text,"نص البطاقة "+(j+1),2,300)}))
   };
   const stamp=new Date().toISOString();
   // Select previous state to retain any version already published to students.
   const {data:previous,error:readError}=await admin.from("step_lesson_content_edits")
    .select("published,published_at").eq("course_code",lesson.code).eq("part_index",i).maybeSingle();
   if(readError)throw readError;
   const {error}=await admin.from("step_lesson_content_edits").upsert({
    course_code:lesson.code,part_index:i,draft:content,
    published:previous?.published||null,published_at:previous?.published_at||null,
    draft_updated_at:stamp,updated_by:auth.user.id
   },{onConflict:"course_code,part_index"});
   if(error)throw error;
   return reply(200,{ok:true,part_index:i,status:"draft"});
  }catch(error){console.error("lesson save",error);return reply(422,{error:error instanceof Error&&error.message.startsWith("راجع")?error.message:"تعذر حفظ مسودة الدرس"});}
 }
 if(path==="/lessons/publish"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"النشر متاح للمدير فقط"});
  try{
   const raw=await req.text();if(raw.length>1000)return reply(413,{error:"Request too large"});
   const {part_index}=JSON.parse(raw),i=Number(part_index);
   if(!Number.isInteger(i)||i<0||i>=lesson.sections.length)return reply(422,{error:"رقم الجزء غير صحيح"});
   const {data:entry,error:readError}=await admin.from("step_lesson_content_edits")
    .select("draft").eq("course_code",lesson.code).eq("part_index",i).maybeSingle();
   if(readError||!entry?.draft)return reply(404,{error:"احفظ مسودة الدرس الأول"});
   const {error}=await admin.from("step_lesson_content_edits").update({
    published:entry.draft,published_at:new Date().toISOString(),
    draft:null,draft_updated_at:null,updated_by:auth.user.id
   }).eq("course_code",lesson.code).eq("part_index",i);
   if(error)throw error;
   return reply(200,{ok:true,part_index:i,status:"published"});
  }catch(error){console.error("lesson publish",error);return reply(500,{error:"تعذر نشر الدرس"});}
 }
 if(path==="/lessons/reset"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"استعادة النسخة الأصلية متاحة للمدير فقط"});
  try{
   const raw=await req.text();if(raw.length>1000)return reply(413,{error:"Request too large"});
   const {part_index}=JSON.parse(raw),i=Number(part_index);
   if(!Number.isInteger(i)||i<0||i>=lesson.sections.length)return reply(422,{error:"رقم الجزء غير صحيح"});
   const {error}=await admin.from("step_lesson_content_edits").delete()
    .eq("course_code",lesson.code).eq("part_index",i);
   if(error)throw error;
   return reply(200,{ok:true,part_index:i,status:"original"});
  }catch(error){console.error("lesson reset",error);return reply(500,{error:"تعذر استعادة النسخة الأصلية"});}
 }

 // Draft course catalog: these records are NOT exposed as student lessons.
 if(path==="/course-drafts"&&req.method==="GET"){
  try{
   const {data,error}=await admin.from("step_course_drafts")
    .select("id,slug,title_en,title_ar,description,position,status,updated_at,created_at")
    .order("position",{ascending:true}).order("created_at",{ascending:true}).limit(500);
   if(error)throw error;
   return reply(200,{courses:data||[],existing_course:{
    code:lesson.code,title_en:lesson.title,title_ar:lesson.titleAr,parts:lesson.sections.length,
    status:"published",immutable:true
   }});
  }catch(error){console.error("course drafts list",error);return reply(500,{error:"تعذر تحميل قائمة الدروس"});}
 }
 if(path==="/course-drafts/save"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"إدارة الدروس الجديدة متاحة للمدير فقط"});
  try{
   const raw=await req.text();if(raw.length>4500)return reply(413,{error:"البيانات طويلة جدًا"});
   const input=JSON.parse(raw);
   if(!input||typeof input!=="object")return reply(422,{error:"البيانات غير صحيحة"});
   const slug=String(input.slug||"").trim().toLowerCase(),
    title_en=String(input.title_en||"").trim(),
    title_ar=String(input.title_ar||"").trim(),
    description=String(input.description||"").trim(),
    position=Number(input.position);
   if(!/^[a-z][a-z0-9-]{2,39}$/.test(slug)||slug==="present-simple")
     return reply(422,{error:"اختار كود درس إنجليزي فريد مثل present-continuous"});
   if(title_en.length<3||title_en.length>140||title_ar.length<3||title_ar.length>140
    ||description.length>1500||!Number.isInteger(position)||position<1||position>9999)
      return reply(422,{error:"راجع عنوان الدرس والوصف والترتيب"});
   const payload={slug,title_en,title_ar,description,position,updated_at:new Date().toISOString()};
   let row:any,error:any;
   if(input.id){
    if(!isUUID(input.id))return reply(422,{error:"معرّف الدرس غير صحيح"});
    const result=await admin.from("step_course_drafts")
      .update(payload).eq("id",input.id).select("id,slug,status").maybeSingle();
    row=result.data;error=result.error;
   }else{
    const result=await admin.from("step_course_drafts")
      .insert({...payload,created_by:auth.user.id,status:"draft"}).select("id,slug,status").single();
    row=result.data;error=result.error;
   }
   if(error){
    if(error.code==="23505")return reply(409,{error:"كود الدرس مستخدم بالفعل"});
    throw error;
   }
   if(!row)return reply(404,{error:"الدرس غير موجود"});
   return reply(200,{ok:true,course:row});
  }catch(error){console.error("save course draft",error);return reply(500,{error:"تعذر حفظ الدرس"});}
 }
 if(path==="/course-drafts/status"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"إدارة الدروس متاحة للمدير فقط"});
  try{
   const raw=await req.text();if(raw.length>1300)return reply(413,{error:"البيانات طويلة"});
   const body=JSON.parse(raw);
   if(!isUUID(body?.id)||typeof body?.archived!=="boolean")return reply(422,{error:"البيانات غير صحيحة"});
   const {data,error}=await admin.from("step_course_drafts")
    .update({status:body.archived?"archived":"draft",updated_at:new Date().toISOString()})
    .eq("id",body.id).select("id,status").maybeSingle();
   if(error)throw error;
   if(!data)return reply(404,{error:"الدرس غير موجود"});
   return reply(200,{ok:true,course:data});
  }catch(error){console.error("course status",error);return reply(500,{error:"تعذر تحديث حالة الدرس"});}
 }

 // Four-axis STEP curriculum and indicator administration.
 if(path==="/curriculum"&&req.method==="GET"){
  try{
   const [axisResult,indicatorResult]=await Promise.all([
    admin.from("step_curriculum_axes").select("code,title_ar,title_en,position,content_model").order("position"),
    admin.from("step_curriculum_indicators")
     .select("id,axis_code,slug,title_ar,title_en,description,position,status,legacy_course_code,updated_at")
     .order("position").order("created_at")
   ]);
   if(axisResult.error||indicatorResult.error)throw(axisResult.error||indicatorResult.error);
   return reply(200,{axes:axisResult.data||[],indicators:indicatorResult.data||[]});
  }catch(error){console.error("STEP curriculum admin",error);return reply(500,{error:"تعذر فتح المحاور والمؤشرات"});}
 }
 if(path==="/curriculum/indicators/save"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"تعديل المؤشرات متاح لمدير المعهد فقط"});
  try{
   const raw=await req.text();
   if(raw.length>5000)return reply(413,{error:"البيانات كبيرة جدًا"});
   const input=JSON.parse(raw);
   const axisCode=String(input?.axis_code||"");
   const slug=String(input?.slug||"").trim().toLowerCase();
   const titleAr=String(input?.title_ar||"").trim();
   const titleEn=String(input?.title_en||"").trim();
   const description=String(input?.description||"").trim();
   const position=Number(input?.position);
   if(!["grammar","writing-analysis"].includes(axisCode))
     return reply(422,{error:"المؤشرات متاحة لمحوري الجرامر والتحليل الكتابي فقط"});
   if(!/^[a-z][a-z0-9-]{2,39}$/.test(slug)||slug==="present-simple")
     return reply(422,{error:"اكتب كود مؤشر فريد مثل present-continuous"});
   if(titleAr.length<3||titleAr.length>140||titleEn.length<3||titleEn.length>140||
      description.length>1500||!Number.isInteger(position)||position<1||position>9999)
     return reply(422,{error:"راجع بيانات المؤشر والترتيب"});
   const updates={axis_code:axisCode,slug,title_ar:titleAr,title_en:titleEn,
    description,position,updated_at:new Date().toISOString()};
   let saved:any,error:any;
   if(input.id){
    if(!isUUID(input.id))return reply(422,{error:"المعرّف غير صحيح"});
    const {data:existing,error:lookupError}=await admin.from("step_curriculum_indicators")
      .select("status,legacy_course_code").eq("id",input.id).maybeSingle();
    if(lookupError)throw lookupError;
    if(!existing)return reply(404,{error:"المؤشر غير موجود"});
    if(existing.status==="published"||existing.legacy_course_code)
      return reply(403,{error:"مؤشر المضارع البسيط المنشور مرتبط بدرجات الطلاب ولا يمكن نقله من هنا"});
    const res=await admin.from("step_curriculum_indicators").update(updates)
      .eq("id",input.id).in("status",["draft","archived"])
      .select("id,slug,status,axis_code").maybeSingle();
    saved=res.data;error=res.error;
   }else{
    const res=await admin.from("step_curriculum_indicators").insert({
      ...updates,status:"draft",created_by:auth.user.id,legacy_course_code:null
    }).select("id,slug,status,axis_code").single();
    saved=res.data;error=res.error;
   }
   if(error?.code==="23505")return reply(409,{error:"كود المؤشر مستخدم بالفعل"});
   if(error)throw error;
   if(!saved)return reply(404,{error:"تعذر العثور على المؤشر"});
   return reply(200,{ok:true,indicator:saved});
  }catch(error){console.error("STEP indicator save",error);return reply(500,{error:"تعذر حفظ المؤشر"});}
 }
 if(path==="/curriculum/indicators/status"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"تغيير حالة المؤشرات متاح لمدير المعهد فقط"});
  try{
   const raw=await req.text();if(raw.length>1000)return reply(413,{error:"البيانات كبيرة"});
   const body=JSON.parse(raw);
   if(!isUUID(body?.id)||typeof body?.archived!=="boolean")
    return reply(422,{error:"بيانات المؤشر غير صحيحة"});
   const {data,error}=await admin.from("step_curriculum_indicators")
    .update({status:body.archived?"archived":"draft",updated_at:new Date().toISOString()})
    .eq("id",body.id).in("status",["draft","archived"])
    .is("legacy_course_code",null)
    .select("id,status").maybeSingle();
   if(error)throw error;
   if(!data)return reply(403,{error:"لا يمكن أرشفة المؤشر المنشور أو تعديله من هنا"});
   return reply(200,{ok:true,indicator:data});
  }catch(error){console.error("STEP indicator status",error);return reply(500,{error:"تعذر تحديث حالة المؤشر"});}
 }
 return reply(404,{error:"المسار غير موجود"});
});
