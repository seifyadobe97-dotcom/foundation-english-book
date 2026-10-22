// Private administrative API for STEP Grammar, authenticated with Supabase JWT.
// The service-role key is available only inside this Edge Function, never in public HTML.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
// Question banks are resolved through service-role-only Supabase storage after admin auth.
type LessonData=any;
const url=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const allow=new Set(["https://seifyadobe97-dotcom.github.io","http://localhost:3000","http://127.0.0.1:3000"]);
const isUUID=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
type AnswerEvent={question_id:string;part_index:number|null;attempt_kind:string;is_correct:boolean;elapsed_ms:number|null;choice_changes:number|null;selected:string;recorded_at?:string};

const rate=(a:number,b:number)=>b?Math.round(100*a/b):null;
const seconds=(ms:number,n:number)=>n?Math.round(ms/100/n)/10:null;
function buildLearningInsights(items:AnswerEvent[],activeLesson:LessonData){
 const lessonSource=activeLesson.questions as Record<string,{text:string;options:Record<string,string>}>;
 const sectionForQuestion=new Map(activeLesson.sections.flatMap((sec,i)=>sec.questionIds.map(id=>[id,i] as const)));
 const groups=activeLesson.sections.map((section,index)=>{
  const records=items.filter(row=>sectionForQuestion.get(row.question_id)===index);
  const answered=records.length,correct=records.filter(row=>row.is_correct).length;
  const unique_questions=new Set(records.map(row=>row.question_id)).size;
  const min_questions=Math.min(3,section.questionIds.length);
  const times=records.map(r=>r.elapsed_ms).filter((n):n is number=>n!==null&&Number.isFinite(n));
  const accuracy=rate(correct,answered);
  let status="بيانات غير كافية",recommendation="حل أسئلة إضافية قبل تحديد مستوى المهارة.";
  if(answered>=5&&unique_questions>=min_questions){
   if(accuracy!==null&&accuracy<60){status="تحتاج متابعة";recommendation="راجع شرح "+section.titleAr+" ثم حل تدريبات مركزة واختبار قصير.";}
   else if(accuracy!==null&&accuracy<80){status="تحتاج تدريب";recommendation="حل أسئلة متنوعة في "+section.titleAr+" وراجع أسباب الاختيارات الغلط.";}
   else{status="مستوى جيد";recommendation="حافظ على مستواك بتدريب متباعد وتأكد من الثبات بمرور الوقت.";}
  }
  return {index,title:section.titleAr,answers:answered,correct,unique_questions,
   accuracy,avg_seconds:seconds(times.reduce((a,b)=>a+b,0),times.length),
   timed_answers:times.length,status,recommendation};
 });
 const questionGroups=new Map<string,AnswerEvent[]>();
 for(const event of items){
  if(!questionGroups.has(event.question_id))questionGroups.set(event.question_id,[]);
  questionGroups.get(event.question_id)!.push(event);
 }
 const questions=[...questionGroups.entries()].map(([id,rows])=>{
  const times=rows.map(r=>r.elapsed_ms).filter((n):n is number=>n!==null&&Number.isFinite(n));
  const counts=new Map<string,number>();
  for(const row of rows)if(!row.is_correct)counts.set(row.selected,(counts.get(row.selected)||0)+1);
  const selected=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]??null;
  return {section_index:sectionForQuestion.get(id)??null,
   question_text:lessonSource[id]?.text||"سؤال تم تحديثه",answers:rows.length,
   accuracy:rate(rows.filter(r=>r.is_correct).length,rows.length),
   avg_seconds:seconds(times.reduce((a,b)=>a+b,0),times.length),
   common_wrong:selected?{letter:selected,option:lessonSource[id]?.options?.[selected]||null}:null};
 }).sort((a,b)=>(a.accuracy??100)-(b.accuracy??100)||b.answers-a.answers).slice(0,25);
 const allTimes=items.map(r=>r.elapsed_ms).filter((n):n is number=>n!==null&&Number.isFinite(n));
 return {answers:items.length,correct:items.filter(x=>x.is_correct).length,
  accuracy:rate(items.filter(x=>x.is_correct).length,items.length),
  timed_answers:allTimes.length,
  avg_seconds:seconds(allTimes.reduce((a,b)=>a+b,0),allTimes.length),
  sections:groups,questions,
  priority:groups.filter(g=>g.status!=="بيانات غير كافية"&&g.accuracy!==null&&g.accuracy<80)
    .sort((a,b)=>(a.accuracy??100)-(b.accuracy??100)).map(g=>({title:g.title,status:g.status,action:g.recommendation})),
  note:"التحليل خاص بالمحاولات الجديدة المسجّلة بالتفصيل. أزمنة الإجابة تقديرية من جهاز الطالب، ولا تُستخدم للدرجات."
 };
}

type FollowupEvent={id:string;part_index:number;kind:string;assigned_at:string;cancelled_at:string|null};
function compareFollowups(tasks:FollowupEvent[],events:AnswerEvent[],activeLesson:LessonData){
 return tasks.filter(t=>!t.cancelled_at).map(task=>{
  const data=events.filter(e=>e.part_index===task.part_index&&e.attempt_kind==="practice"&&e.recorded_at);
  const before=data.filter(e=>e.recorded_at!<task.assigned_at);
  const after=data.filter(e=>e.recorded_at!>=task.assigned_at);
  const summarize=(rows:AnswerEvent[])=>({
   answers:rows.length,unique_questions:new Set(rows.map(r=>r.question_id)).size,
   correct:rows.filter(r=>r.is_correct).length,accuracy:rate(rows.filter(r=>r.is_correct).length,rows.length)
  });
  const a=summarize(before),b=summarize(after);
  const required=Math.min(3,activeLesson.sections[task.part_index]?.questionIds.length??3);
  const sufficient=a.answers>=5&&b.answers>=5&&a.unique_questions>=required&&b.unique_questions>=required;
  const change=sufficient&&a.accuracy!==null&&b.accuracy!==null?b.accuracy-a.accuracy:null;
  return {id:task.id,part_index:task.part_index,title:activeLesson.sections[task.part_index]?.titleAr||"مهارة",
   kind:task.kind,assigned_at:task.assigned_at,before:a,after:b,
   delta:change,
   status:change===null?"بيانات غير كافية":change>=10?"تحسن مبدئي":change<=-10?"تراجع يحتاج متابعة":"مستوى شبه ثابت",
   note:"مقارنة أولية لدقة الإجابات قبل التكليف وبعده؛ تكرار الأسئلة والاختلاف في الصعوبة قد يؤثران في النتيجة."};
 });
}
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
 const {data:bankRows,error:bankError}=await admin.from("step_private_course_banks")
  .select("course_code,payload");
 if(bankError)return reply(503,{error:"تعذر تحميل مصادر الأسئلة الخاصة"});
 const lesson=bankRows?.find(x=>x.course_code==="ASGQPRSIM")?.payload as LessonData|undefined;
 const agreementLesson=bankRows?.find(x=>x.course_code==="ASGQAGREE")?.payload as LessonData|undefined;
 const continuousLesson=bankRows?.find(x=>x.course_code==="ASGQPRCONT")?.payload as LessonData|undefined;
 const allCourseBanks=(bankRows||[]).map(x=>x.payload as LessonData)
  .filter(x=>x&&typeof x.code==="string"&&Array.isArray(x.sections)&&x.questions);
 if(!lesson||!agreementLesson||!continuousLesson||lesson.code!=="ASGQPRSIM"||agreementLesson.code!=="ASGQAGREE"||continuousLesson.code!=="ASGQPRCONT")
  return reply(503,{error:"محتوى الدروس الخاصة غير متاح"});
 let path=new URL(req.url).pathname.replace(/^\/(?:functions\/v1\/)?step-admin/,"")||"/";
 // Source and answer keys are available only to authenticated admin accounts.
 if(req.method==="GET"&&path==="/agreement/audit"){
  const [indicator,items]=await Promise.all([
   admin.from("step_curriculum_indicators").select("slug,title_ar,title_en,status,legacy_course_code")
    .eq("slug","subject-verb-agreement").maybeSingle(),
   admin.from("step_source_item_reviews")
    .select("candidate_id,document_key,pdf_page,printed_number,original_stem,original_options,printed_key,review_status,reviewer_notes")
    .or("original_category_code.eq.ASGQAGREE,candidate_id.in.(TAJ2026-177,TAJ2026-321,TAJ2026-355)").order("candidate_id")
  ]);
  if(indicator.error||items.error)return reply(500,{error:"تعذر تحميل سجل مراجعة المصادر"});
  const records=items.data||[];
  const included=new Set(Object.keys(agreementLesson.questions));
  const inCourse=records.filter(x=>included.has(x.candidate_id)&&x.review_status==="approved");
  const outOfCourse=records.filter(x=>included.has(x.candidate_id)&&x.review_status!=="approved");
  // Fail visibly on a future mismatch between the source ledger and the student course.
  return reply(200,{indicator:indicator.data,
   summary:{total:records.length,approved:records.filter(x=>x.review_status==="approved").length,
    withheld:records.filter(x=>x.review_status!=="approved").length,
    in_course:inCourse.length,invalid_in_course:outOfCourse.map(x=>x.candidate_id),
    missing_from_ledger:[...included].filter(id=>!records.some(x=>x.candidate_id===id))},
   items:records.map(x=>({...x,in_course:included.has(x.candidate_id)}))});
 }
 // Draft audit is admin-only; student routes enforce the publication gate.
 if(req.method==="GET"&&path==="/continuous/audit"){
  const [indicator,items]=await Promise.all([
   admin.from("step_curriculum_indicators").select("slug,title_ar,title_en,status,legacy_course_code")
    .eq("slug","present-continuous").maybeSingle(),
   admin.from("step_source_item_reviews")
    .select("candidate_id,document_key,pdf_page,printed_number,original_stem,original_options,printed_key,review_status,reviewer_notes")
    .eq("original_category_code","ASGQPRCONT").order("candidate_id")
  ]);
  if(indicator.error||items.error)return reply(500,{error:"تعذر تحميل سجل تدقيق المضارع المستمر"});
  const records=items.data||[];
  const included=new Set(Object.keys(continuousLesson.questions));
  const valid=records.filter(x=>included.has(x.candidate_id)&&x.review_status==="approved");
  return reply(200,{indicator:indicator.data,
   summary:{total:records.length,approved:records.filter(x=>x.review_status==="approved").length,
    withheld:records.filter(x=>x.review_status!=="approved").length,
    in_course:valid.length,invalid_in_course:records.filter(x=>included.has(x.candidate_id)&&x.review_status!=="approved").map(x=>x.candidate_id),
    missing_from_ledger:[...included].filter(id=>!records.some(x=>x.candidate_id===id))},
   items:records.map(x=>({...x,in_course:included.has(x.candidate_id)}))});
 }
 // Source-original Past Simple candidate register is only returned to authenticated admins.
 if(req.method==="GET"&&path==="/past/audit"){
  const pastLesson=allCourseBanks.find(x=>x.code==="ASGQPASIM");
  if(!pastLesson)return reply(404,{error:"بنك الماضي البسيط مش موجود"});
  const [indicator,reviewed]=await Promise.all([
   admin.from("step_curriculum_indicators").select("slug,title_ar,status,legacy_course_code").eq("slug","past-simple").maybeSingle(),
   admin.from("step_source_item_reviews").select("candidate_id,document_key,pdf_page,printed_number,original_stem,original_options,printed_key,review_status,reviewer_notes")
    .eq("original_category_code","ASGQPASIM").order("candidate_id")
  ]);
  if(indicator.error||reviewed.error)return reply(500,{error:"تعذر تحميل تدقيق الدرس الرابع"});
  const items=reviewed.data||[],ids=new Set(Object.keys(pastLesson.questions));
  return reply(200,{indicator:indicator.data,
   summary:{total:items.length,approved:items.filter(x=>x.review_status==="approved").length,
    withheld:items.filter(x=>x.review_status!=="approved").length,
    in_course:items.filter(x=>ids.has(x.candidate_id)&&x.review_status==="approved").length,
    invalid_in_course:items.filter(x=>ids.has(x.candidate_id)&&x.review_status!=="approved").map(x=>x.candidate_id),
    missing_from_ledger:[...ids].filter(id=>!items.some(x=>x.candidate_id===id))},
   items:items.map(x=>({...x,in_course:ids.has(x.candidate_id)}))});
 }
 // Lesson 5 source register is admin-only; no original source metadata leaks to student APIs.
 if(req.method==="GET"&&path==="/past-continuous/audit"){
  const lesson5=allCourseBanks.find(x=>x.code==="ASGQPACONT");
  if(!lesson5)return reply(404,{error:"بنك الماضي المستمر غير متاح"});
  const [indicator,reviewed]=await Promise.all([
   admin.from("step_curriculum_indicators").select("slug,title_ar,status,legacy_course_code").eq("slug","past-continuous").maybeSingle(),
   admin.from("step_source_item_reviews").select("candidate_id,document_key,pdf_page,printed_number,original_stem,original_options,printed_key,review_status,reviewer_notes")
    .eq("original_category_code","ASGQPACONT").order("candidate_id")
  ]);
  if(indicator.error||reviewed.error)return reply(500,{error:"تعذر تحميل تدقيق الدرس الخامس"});
  const items=reviewed.data||[],ids=new Set(Object.keys(lesson5.questions));
  return reply(200,{indicator:indicator.data,
   summary:{total:items.length,approved:items.filter(x=>x.review_status==="approved").length,
    withheld:items.filter(x=>x.review_status!=="approved").length,
    in_course:items.filter(x=>ids.has(x.candidate_id)&&x.review_status==="approved").length,
    invalid_in_course:items.filter(x=>ids.has(x.candidate_id)&&x.review_status!=="approved").map(x=>x.candidate_id),
    missing_from_ledger:[...ids].filter(id=>!items.some(x=>x.candidate_id===id))},
   items:items.map(x=>({...x,in_course:ids.has(x.candidate_id)}))});
 }
 let reportLesson=lesson;
 // All indicator reports are resolved by the server, never by client-supplied course codes.
 const indicatorReportRoute=path.match(/^\/indicators\/([a-z][a-z0-9-]{2,39})(?:\/(analytics|students\/([0-9a-f-]{36})\/report))?$/i);
 if(req.method==="GET"&&path==="/indicators"){
  const {data,error}=await admin.from("step_curriculum_indicators")
   .select("slug,axis_code,title_ar,title_en,status,position,legacy_course_code")
   .order("position");
  if(error){console.error("STEP indicator reports catalog failed",error);return reply(500,{error:"تعذر تحميل المؤشرات"});}
  return reply(200,{indicators:(data||[]).map(i=>({
   slug:i.slug,axis_code:i.axis_code,title_ar:i.title_ar,title_en:i.title_en,
   status:i.status,position:i.position,
   report_ready:i.status==="published"&&allCourseBanks.some(bank=>bank.code===i.legacy_course_code)
  }))});
 }
 if(req.method==="GET"&&indicatorReportRoute){
  const [_,slug,section,studentId]=indicatorReportRoute;
  const {data:indicator,error}=await admin.from("step_curriculum_indicators")
   .select("slug,title_ar,title_en,axis_code,status,legacy_course_code")
   .eq("slug",slug).maybeSingle();
  if(error){console.error("Indicator route lookup",error);return reply(500,{error:"تعذر تحميل المؤشر"});}
  if(!indicator)return reply(404,{error:"المؤشر غير موجود"});
  const selectedLesson=allCourseBanks.find(bank=>bank.code===indicator.legacy_course_code)||lesson;
  const ready=indicator.status==="published"&&indicator.legacy_course_code===selectedLesson.code
   &&allCourseBanks.some(bank=>bank.code===indicator.legacy_course_code);
  if(ready)reportLesson=selectedLesson;
  if(!section)return reply(200,{indicator:{...indicator,report_ready:ready}});
  if(!ready)return reply(200,{indicator:{...indicator,report_ready:false},available:false,
   message:"المؤشر لم ينشر له تدريب قابل للقياس بعد. لا توجد نتائج طلاب لهذا المؤشر."});
  if(section==="analytics")path="/analytics";
  else if(studentId&&isUUID(studentId))path="/students/"+studentId+"/report";
  else return reply(422,{error:"طلب تقرير الطالب غير صالح"});
 }


 // Optional video lessons are drafted per indicator and become visible to students only after publishing.
 const videoRoute=path==="/videos";
 const videoSaveRoute=path==="/videos/save";
 const safeVideoUrl=(raw:string)=>{
  if(!raw)return true;
  try{
   const u=new URL(raw);
   if(u.protocol!=="https:"||u.username||u.password||u.port)return false;
   const host=u.hostname.toLowerCase(),path=u.pathname,id=/^[a-zA-Z0-9_-]{11}$/;
   if(host==="youtu.be")return id.test(path.split("/")[1]||"");
   if(["youtube.com","www.youtube.com","m.youtube.com"].includes(host)){
    const code=path.startsWith("/shorts/")?path.split("/")[2]:u.searchParams.get("v");
    return Boolean(code&&id.test(code));
   }
   if(["tiktok.com","www.tiktok.com"].includes(host))
    return /\/video\/\d{12,22}(?:\/|$)/.test(path)||
     /^\/player\/v1\/\d{12,22}(?:\/|$)/.test(path);
   if(["vt.tiktok.com","vm.tiktok.com"].includes(host))
    return /^\/[a-zA-Z0-9_-]{5,40}\/?$/.test(path);
   return false;
  }catch{return false;}
 };
 if((req.method==="GET"&&videoRoute)||(req.method==="POST"&&videoSaveRoute)){
  if(req.method==="POST"&&permission.role!=="owner")return reply(403,{error:"إدارة نشر الفيديوهات متاحة لمدير المنصة فقط"});
  let body:Record<string,unknown>={};
  if(req.method==="POST"){
   try{const raw=await req.text();if(raw.length>2500)return reply(413,{error:"البيانات كبيرة جدًا"});body=JSON.parse(raw);}
   catch{return reply(400,{error:"بيانات الفيديو غير صالحة"});}
  }
  const indicatorSlug=req.method==="GET"?new URL(req.url).searchParams.get("indicator"):body.indicator_slug;
  if(typeof indicatorSlug!=="string"||!/^[a-z][a-z0-9-]{2,39}$/.test(indicatorSlug))
   return reply(422,{error:"اختار مؤشرًا صحيحًا"});
  const {data:indicator,error:indicatorError}=await admin.from("step_curriculum_indicators")
   .select("slug,title_ar,title_en,status,legacy_course_code").eq("slug",indicatorSlug).maybeSingle();
  if(indicatorError)return reply(500,{error:"تعذر التحقق من المؤشر"});
  if(!indicator)return reply(404,{error:"المؤشر غير موجود"});
  const slotLesson=allCourseBanks.find(bank=>bank.code===indicator.legacy_course_code)||lesson;
  const publishedCourse=indicator.status==="published"&&indicator.legacy_course_code===slotLesson.code
   &&allCourseBanks.some(bank=>bank.code===indicator.legacy_course_code);
  const slots=publishedCourse?slotLesson.sections.map((x,i)=>({part_index:i,title:x.titleAr})):
   [{part_index:0,title:"فيديو مقدمة المؤشر (يظهر عند تجهيز الدرس)"}];
  if(req.method==="GET"){
   const {data,error}=await admin.from("step_indicator_videos")
    .select("part_index,title,description,video_url,published,updated_at")
    .eq("indicator_slug",indicatorSlug).order("part_index");
   if(error)return reply(500,{error:"تعذر تحميل الفيديوهات"});
   return reply(200,{indicator,slots,videos:data||[],can_edit:permission.role==="owner"});
  }
  const part=body.part_index,title=body.title,description=body.description,videoUrl=body.video_url,published=body.published;
  if(!Number.isInteger(part)||!slots.some(x=>x.part_index===part)||
   typeof title!=="string"||title.length>120||
   typeof description!=="string"||description.length>300||
   typeof videoUrl!=="string"||videoUrl.length>600||!safeVideoUrl(videoUrl.trim())||
   typeof published!=="boolean"||(published&&!videoUrl.trim()))
   return reply(422,{error:"راجع بيانات الفيديو، ولا يمكن النشر بدون رابط YouTube أو TikTok صالح"});
  // Draft indicator videos stay unpublished until there is a live lesson to display them.
  if(published&&!publishedCourse)return reply(422,{error:"انشر الدرس واعتمد مؤشره قبل نشر الفيديو للطلاب"});
  const {data:updated,error:saveError}=await admin.from("step_indicator_videos")
   .upsert({indicator_slug:indicatorSlug,part_index:part,title:title.trim(),
    description:description.trim(),video_url:videoUrl.trim(),published,
    updated_at:new Date().toISOString(),updated_by:auth.user.id,
    published_at:published?new Date().toISOString():null},
    {onConflict:"indicator_slug,part_index"})
   .select("part_index,title,description,video_url,published,updated_at").single();
  if(saveError){console.error("Saving STEP video",saveError);return reply(500,{error:"تعذر حفظ الفيديو"});}
  return reply(200,{video:updated});
 }
 // Student Success Center: all write operations require the owner role, never JWT user_metadata.
 const assignmentMatch=path.match(/^\/students\/([0-9a-f-]{36})\/followups$/i);
 if(assignmentMatch&&(req.method==="GET"||req.method==="POST")){
  const target=assignmentMatch[1];
  if(!isUUID(target))return reply(422,{error:"معرّف الطالب غير صالح"});
  if(req.method==="POST"){
   if(permission.role!=="owner")return reply(403,{error:"إنشاء المتابعة متاح لمدير المنصة فقط"});
   let body:any;
   try{const raw=await req.text();if(raw.length>2500)return reply(413,{error:"حجم الطلب كبير"});body=JSON.parse(raw);}
   catch{return reply(400,{error:"بيانات التكليف غير صالحة"});}
   const part=body?.part_index,kind=body?.kind,note=body?.note??"";
   if(!Number.isInteger(part)||part<0||part>=lesson.sections.length||
     !["review","practice","video"].includes(kind)||typeof note!=="string"||note.length>350||
     (kind==="video"&&part!==2))return reply(422,{error:"حدد مهارة ونوع متابعة صالحين"});
   if(kind==="video"){
    const {data:ready,error:videoLookupError}=await admin.from("step_indicator_videos")
     .select("part_index").eq("indicator_slug","present-simple").eq("part_index",part)
     .eq("published",true).maybeSingle();
    if(videoLookupError)return reply(500,{error:"تعذر التحقق من نشر الفيديو"});
    if(!ready)return reply(422,{error:"فيديو المرحلة لسه مش منشور. اختار مراجعة الشرح أو تدريب لحد ما تضيف الفيديو."});
   }
   const due=body?.due_at;
   const dueDate=due==null||due===""?null:typeof due==="string"?new Date(due):new Date(NaN);
   if(dueDate&&(Number.isNaN(dueDate.getTime())||dueDate.getTime()<Date.now()-60000||
    dueDate.getTime()>Date.now()+366*86400000))return reply(422,{error:"موعد المتابعة غير صالح"});
   const {data:profile,error:profileError}=await admin.from("step_student_profiles")
    .select("user_id,is_active").eq("user_id",target).maybeSingle();
   if(profileError)return reply(500,{error:"تعذر التحقق من الطالب"});
   if(!profile||profile.is_active===false)return reply(404,{error:"الطالب غير موجود أو حسابه موقوف"});
   const {data:created,error}=await admin.from("step_student_followups")
    .insert({user_id:target,course_code:lesson.code,part_index:part,kind,
      note:note.trim(),due_at:dueDate?.toISOString()??null,assigned_by:auth.user.id})
    .select("id,part_index,kind,note,due_at,assigned_at").single();
   if(error||!created){console.error("STEP followup create failed",error);return reply(500,{error:"تعذر حفظ المتابعة"});}
   return reply(201,{followup:created});
  }
  try{
   const {data:rows,error}=await admin.from("step_student_followups")
    .select("id,part_index,kind,note,due_at,assigned_at,reviewed_at,cancelled_at")
    .eq("user_id",target).eq("course_code",lesson.code).order("assigned_at",{ascending:false}).limit(150);
   if(error)throw error;
   const since=(rows??[]).reduce((a,r)=>r.assigned_at<a?r.assigned_at:a,new Date().toISOString());
   const {data:passes,error:passError}=await admin.from("step_part_attempts")
    .select("part_index,attempted_at").eq("user_id",target).eq("course_code",lesson.code)
    .eq("passed",true).gte("attempted_at",since).order("attempted_at",{ascending:false}).limit(2000);
   if(passError)throw passError;
   return reply(200,{followups:(rows||[]).map(row=>{
    const verified=(passes||[]).some(p=>p.part_index===row.part_index&&p.attempted_at>=row.assigned_at);
    return {...row,title:lesson.sections[row.part_index]?.titleAr??"مهارة",status:row.cancelled_at?"cancelled":
      verified?"completed":row.reviewed_at?"reviewed":"pending"};
   })});
  }catch(e){console.error("STEP followup list failed",e);return reply(500,{error:"تعذر تحميل التكليفات"});}
 }
 const cancelMatch=path.match(/^\/followups\/([0-9a-f-]{36})\/cancel$/i);
 if(req.method==="POST"&&cancelMatch){
  if(permission.role!=="owner")return reply(403,{error:"إلغاء المتابعة متاح لمدير المنصة فقط"});
  const {data,error}=await admin.from("step_student_followups")
   .update({cancelled_at:new Date().toISOString(),cancelled_by:auth.user.id})
   .eq("id",cancelMatch[1]).eq("course_code",lesson.code).is("cancelled_at",null).select("id").maybeSingle();
  if(error)return reply(500,{error:"تعذر إلغاء التكليف"});
  if(!data)return reply(404,{error:"التكليف غير موجود أو تم إلغاؤه"});
  return reply(200,{ok:true});
 }

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
   if(reportLesson.code!==lesson.code){
    const [profiles,parts,exams,items]=await Promise.all([
     admin.from("step_student_profiles").select("user_id,is_active").limit(10000),
     admin.from("step_part_attempts").select("user_id,part_index,correct_count,total_questions,passed")
      .eq("course_code",reportLesson.code).limit(10000),
     admin.from("step_exam_attempts").select("user_id,correct_count,total_questions")
      .eq("course_code",reportLesson.code).limit(10000),
     admin.from("step_question_attempt_details")
      .select("question_id,part_index,attempt_kind,is_correct,elapsed_ms,choice_changes,selected")
      .eq("course_code",reportLesson.code).eq("attempt_kind","practice")
      .order("recorded_at",{ascending:false}).limit(5000)
    ]);
    if(profiles.error||parts.error||exams.error||items.error)
     throw(profiles.error||parts.error||exams.error||items.error);
    const attempts=parts.data||[],allExams=exams.data||[],users=profiles.data||[];
    const passes=new Map<string,Set<number>>();
    for(const row of attempts)if(row.passed){
     if(!passes.has(row.user_id))passes.set(row.user_id,new Set());
     passes.get(row.user_id)!.add(row.part_index);
    }
    const participants=new Map<string,{parts_passed:number;exam_best:number|null}>();
    for(const [id,set] of passes)participants.set(id,{parts_passed:set.size,exam_best:null});
    for(const exam of allExams){
     const x=participants.get(exam.user_id)||{parts_passed:0,exam_best:null};
     const pct=Math.round(100*exam.correct_count/exam.total_questions);
     x.exam_best=Math.max(x.exam_best??0,pct);participants.set(exam.user_id,x);
    }
    const totals=reportLesson.sections.map((section,i)=>{
     const matches=attempts.filter(a=>a.part_index===i),tried=new Set(matches.map(a=>a.user_id)),
      successful=new Set(matches.filter(a=>a.passed).map(a=>a.user_id));
     return {part_index:i,title:section.titleAr,students_tried:tried.size,
      students_passed:successful.size,attempts:matches.length,
      avg_score_percent:matches.length?
       Math.round(1000*matches.reduce((sum,a)=>sum+a.correct_count/a.total_questions,0)/matches.length)/10:null};
    });
    const insight=buildLearningInsights((items.data||[]) as AnswerEvent[],reportLesson);
    const examUsers=new Set(allExams.map(e=>e.user_id));
    return reply(200,{overview:{
      students_total:users.length,students_active:users.filter(x=>x.is_active).length,
      students_completed:[...passes.values()].filter(x=>x.size===reportLesson.sections.length).length,
      students_exam_taken:examUsers.size,practice_attempts:attempts.length,exam_attempts:allExams.length,
      avg_exam_percent:allExams.length?Math.round(1000*allExams.reduce((a,x)=>a+x.correct_count/x.total_questions,0)/allExams.length)/10:null
     },parts:totals,student_metrics:[...participants].map(([user_id,metric])=>({user_id,...metric})),
     learning:{sections:insight.sections,answers:insight.answers,timed_answers:insight.timed_answers,
       limited_to_latest:5000,note:insight.note}});
   }
   const [overview,parts]=await Promise.all([
     admin.from("step_admin_overview").select("*").single(),
     admin.from("step_admin_part_statistics").select("*").order("part_index")
   ]);
   if(overview.error||parts.error)throw(overview.error||parts.error);
   const {data:itemRows,error:itemError}=await admin.from("step_question_attempt_details")
    .select("question_id,part_index,attempt_kind,is_correct,elapsed_ms,choice_changes,selected")
    .eq("course_code",lesson.code).eq("attempt_kind","practice")
    .order("recorded_at",{ascending:false}).limit(5000);
   if(itemError)throw itemError;
   const cohort=buildLearningInsights((itemRows||[]) as AnswerEvent[],lesson);
   return reply(200,{overview:overview.data,parts:(parts.data||[]).map(s=>({
     ...s,title:lesson.sections[s.part_index]?.titleAr||"جزء "+(s.part_index+1)
   })),learning:{sections:cohort.sections,answers:cohort.answers,
     timed_answers:cohort.timed_answers,limited_to_latest:5000,
     note:cohort.note}});
  }catch(error){console.error("STEP analytics failed",error);return reply(500,{error:"تعذر تحميل إحصائيات المنصة"});}
 }
 const reportMatch=path.match(/^\/students\/([0-9a-f-]{36})\/report$/i);
 if(req.method==="GET"&&reportMatch){
  const studentId=reportMatch[1];
  if(!isUUID(studentId))return reply(422,{error:"معرّف الطالب غير صحيح"});
  try{
   const [profile,partRows,examRows,partCount,examCount,detailRows,detailCount,followupRows]=await Promise.all([
    admin.from("step_student_profiles").select("user_id,username,email,phone_e164,is_active,created_at").eq("user_id",studentId).maybeSingle(),
    admin.from("step_part_attempts").select("id,part_index,correct_count,total_questions,passed,attempted_at")
      .eq("user_id",studentId).eq("course_code",reportLesson.code).order("attempted_at",{ascending:false}).limit(300),
    admin.from("step_exam_attempts").select("id,correct_count,total_questions,attempted_at")
      .eq("user_id",studentId).eq("course_code",reportLesson.code).order("attempted_at",{ascending:false}).limit(150),
    admin.from("step_part_attempts").select("id",{count:"exact",head:true}).eq("user_id",studentId).eq("course_code",reportLesson.code),
    admin.from("step_exam_attempts").select("id",{count:"exact",head:true}).eq("user_id",studentId).eq("course_code",reportLesson.code),
    admin.from("step_question_attempt_details")
     .select("question_id,part_index,attempt_kind,is_correct,elapsed_ms,choice_changes,selected,recorded_at")
     .eq("user_id",studentId).eq("course_code",reportLesson.code)
     .order("recorded_at",{ascending:false}).limit(1500),
    admin.from("step_question_attempt_details").select("id",{count:"exact",head:true})
     .eq("user_id",studentId).eq("course_code",reportLesson.code),
    admin.from("step_student_followups").select("id,part_index,kind,assigned_at,cancelled_at")
     .eq("user_id",studentId).eq("course_code",reportLesson.code)
     .order("assigned_at",{ascending:false}).limit(50)
   ]);
   if(profile.error||partRows.error||examRows.error||partCount.error||examCount.error||detailRows.error||detailCount.error||followupRows.error)
     throw(profile.error||partRows.error||examRows.error||partCount.error||examCount.error||detailRows.error||detailCount.error||followupRows.error);
   if(!profile.data)return reply(404,{error:"الطالب غير موجود"});
   const attempts=partRows.data||[],exams=examRows.data||[];
   const sections=reportLesson.sections.map((s,index)=>{
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
    insights:{...buildLearningInsights((detailRows.data||[]) as AnswerEvent[],reportLesson),
     truncated:(detailCount.count||0)>(detailRows.data||[]).length},
    followup_impact:compareFollowups((followupRows.data||[]) as FollowupEvent[],
      (detailRows.data||[]) as AnswerEvent[],reportLesson),
    impact_history_limited:(detailCount.count||0)>(detailRows.data||[]).length,
    attempts:attempts.map(r=>({...r,percentage:Math.round(100*r.correct_count/r.total_questions),
      section_title:reportLesson.sections[r.part_index]?.titleAr||"جزء غير معروف"})),
    exams:exams.map(r=>({...r,percentage:Math.round(100*r.correct_count/r.total_questions)}))
   });
  }catch(error){console.error("STEP student report failed",error);return reply(500,{error:"تعذر تحميل تقرير الطالب"});}
 }
 if(req.method==="POST"&&path==="/student-status"){
  if(permission.role!=="owner")return reply(403,{error:"تعديل الحسابات متاح لمدير المنصة فقط"});
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


 // Unified visual studio: the original source banks remain immutable and owner edits are versioned.
 if(path==="/studio/catalog"&&req.method==="GET"){
  const {data:indicators,error}=await admin.from("step_curriculum_indicators")
   .select("slug,title_ar,title_en,position,status,legacy_course_code").eq("axis_code","grammar")
   .order("position");
  if(error)return reply(500,{error:"تعذر تحميل فهرس الدروس"});
  return reply(200,{courses:(indicators||[]).filter(i=>i.legacy_course_code&&
   allCourseBanks.some(b=>b.code===i.legacy_course_code)).map(i=>({
    slug:i.slug,code:i.legacy_course_code,titleAr:i.title_ar,title:i.title_en,
    position:i.position,status:i.status
   })),can_edit:permission.role==="owner"});
 }
 if(path==="/studio/history"&&req.method==="GET"){
  if(permission.role!=="owner")return reply(403,{error:"سجل النسخ خاص بمدير المنصة"});
  const course=new URL(req.url).searchParams.get("course")||"";
  if(!allCourseBanks.some(b=>b.code===course))return reply(422,{error:"الدرس غير موجود"});
  const {data,error}=await admin.from("step_studio_revision_history")
   .select("revision_id,occurred_at,entity_type,entity_id,operation,actor_id")
   .eq("course_code",course).order("occurred_at",{ascending:false}).limit(100);
  if(error)return reply(500,{error:"تعذر تحميل سجل النسخ"});
  const actors=[...new Set((data||[]).map(x=>x.actor_id).filter(Boolean))];
  let usernames=new Map<string,string>();
  if(actors.length){
   const {data:people}=await admin.from("step_student_profiles")
    .select("user_id,username").in("user_id",actors);
   usernames=new Map((people||[]).map(p=>[p.user_id,p.username]));
  }
  return reply(200,{history:(data||[]).map(x=>({
   ...x,actor_name:usernames.get(x.actor_id)||("حساب "+String(x.actor_id||"").slice(0,8))
  }))});
 }
 if(path==="/studio"&&req.method==="GET"){
  const requested=new URL(req.url).searchParams.get("course")||"ASGQAGREE";
  const bank=allCourseBanks.find(x=>x.code===requested);
  if(!bank)return reply(422,{error:"كود الدرس غير صحيح"});
  const [questionEdits,questionDrafts,unitEdits,sectionEdits,indicatorResult,metaDraftResult]=await Promise.all([
   admin.from("step_question_edits").select("id,part_index,question_text,options,correct,explanation,wrong_reasons,status").eq("course_code",requested),
   admin.from("step_question_editor_drafts").select("id,draft,updated_at").eq("course_code",requested),
   admin.from("step_teaching_unit_edits").select("part_index,draft,published,draft_updated_at,published_at").eq("course_code",requested),
   admin.from("step_lesson_content_edits").select("part_index,draft,published").eq("course_code",requested),
   admin.from("step_curriculum_indicators").select("slug,title_ar,title_en,description,status,position").eq("legacy_course_code",requested).maybeSingle(),
   admin.from("step_course_metadata_drafts").select("draft").eq("course_code",requested).maybeSingle()
  ]);
  const err=questionEdits.error||questionDrafts.error||unitEdits.error||sectionEdits.error||indicatorResult.error||metaDraftResult.error;
  if(err){console.error("STEP studio load",err);return reply(500,{error:"تعذر تحميل محرر الدروس"});}
  const partIds=new Map<string,number>();
  bank.sections.forEach((section:any,i:number)=>section.questionIds.forEach((id:string)=>partIds.set(id,i)));
  const edits=new Map((questionEdits.data||[]).map(x=>[x.id,x]));
  const drafts=new Map((questionDrafts.data||[]).map(x=>[x.id,x]));
  const questionIds=new Set([...Object.keys(bank.questions),...edits.keys(),...drafts.keys()]);
  const questions=[...questionIds].map(id=>{
   const original=bank.questions[id],edit=edits.get(id),draft=drafts.get(id)?.draft||null;
   const useEdit=edit?.status==="published";
   const visible=useEdit?{text:edit.question_text,options:edit.options,correct:edit.correct,
    explanation:edit.explanation,wrongReasons:edit.wrong_reasons||original?.wrongReasons||{}}:original;
   return {id,origin:original?"source":"custom",part_index:original?partIds.get(id):edit?.part_index??draft?.part_index,
    text:visible?.text||"",options:visible?.options||{},correct:visible?.correct||"A",
    explanation:visible?.explanation||"",wrongReasons:visible?.wrongReasons||{},
    published:!!useEdit,draft,archived:!original&&edit?.status==="archived"};
  });
  return reply(200,{course:{code:bank.code,title:bank.title,titleAr:bank.titleAr,subtitle:bank.subtitle||"",
   status:indicatorResult.data?.status||"draft",indicator:indicatorResult.data,
    metadata_draft:metaDraftResult.data?.draft||null},
   sections:bank.sections.map((section:any,i:number)=>({index:i,titleAr:section.titleAr,
    base:Object.fromEntries(Object.entries(section).filter(([key])=>key!=="questionIds")),
    draft:sectionEdits.data?.find(x=>x.part_index===i)?.draft||null,
    published:sectionEdits.data?.find(x=>x.part_index===i)?.published||null,
    visual_draft:unitEdits.data?.find(x=>x.part_index===i)?.draft||null,
    visual_published:unitEdits.data?.find(x=>x.part_index===i)?.published||null,
     visual_base:section.visual||{title:section.titleAr,detail:section.description||section.short||section.titleAr,
      tip:section.short||"",cards:[],examples:[],formulas:[],keywords:[],
      warning:{wrong:"",correct:"",why:""},table:{headers:[],rows:[]},
      extra:{heading:"",paragraphs:[]}}})),
   questions,can_edit:permission.role==="owner"});
 }
 if(path.startsWith("/studio/")&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"تعديل المنهج ونشر الأسئلة متاح لمدير المنصة فقط"});
  try{
   const raw=await req.text();
   if(raw.length>85000)return reply(413,{error:"حجم التعديل كبير"});
   const input=JSON.parse(raw);
   const course=String(input?.course||"");
   const bank=allCourseBanks.find(x=>x.code===course);
   if(!bank)return reply(422,{error:"اختار درسًا صحيحًا"});
   const part=Number(input.part_index);
   const currentPart=Number.isInteger(part)&&part>=0&&part<bank.sections.length;
   const time=new Date().toISOString();
   if(path==="/studio/history/restore"){
    const revision=String(input.revision_id||"");
    if(!/^[0-9a-f-]{36}$/i.test(revision))return reply(422,{error:"معرّف النسخة غير صحيح"});
    const {data:entry,error:entryError}=await admin.from("step_studio_revision_history")
     .select("course_code,entity_type").eq("revision_id",revision).maybeSingle();
    if(entryError||!entry||entry.course_code!==course)return reply(404,{error:"النسخة دي غير موجودة في الدرس"});
    const restoreProcedure=entry.entity_type==="course"?
     "step_restore_course_metadata_revision":"step_restore_studio_revision";
    const {data:restored,error:restoreError}=await admin.rpc(restoreProcedure,{
     p_revision_id:revision,p_actor_id:auth.user.id
    });
    if(restoreError){console.error("STEP restore failed",restoreError);
     return reply(500,{error:"تعذر استعادة النسخة"});}
    return reply(200,{ok:true,restored});
   }
   const allowedVisual=["title","detail","tip","cards","examples","keywords","warning","formulas","table","extra"];
   const allowedSection=["titleAr","subtitle","short","duration","description","rule",
    "alternativeRule","gold","mistake","examples","tiles"];
   const checkVisual=(v:any)=>{
    if(!v||typeof v!=="object"||Array.isArray(v))return false;
    if(Object.keys(v).some(k=>!allowedVisual.includes(k)))return false;
    if(typeof v.title!=="string"||!v.title.trim()||v.title.length>160
     ||typeof v.detail!=="string"||v.detail.trim().length<10||v.detail.length>6000
     ||(v.tip!==undefined&&(typeof v.tip!=="string"||v.tip.length>4000)))return false;
    if(v.cards!==undefined&&(!Array.isArray(v.cards)||v.cards.length>12))return false;
    if(v.examples!==undefined&&(!Array.isArray(v.examples)||v.examples.length>24))return false;
    if(v.formulas!==undefined&&(!Array.isArray(v.formulas)||v.formulas.length>12))return false;
    if([...(v.cards||[]),...(v.examples||[]),...(v.formulas||[])].some(row=>!Array.isArray(row)||
      row.length<2||row.length>5||row.some(x=>typeof x!=="string"||x.length>1500)))return false;
    if(v.keywords!==undefined&&(!Array.isArray(v.keywords)||v.keywords.length>30||
      v.keywords.some((row:any)=>!Array.isArray(row)||row.length!==2||row.some((x:any)=>typeof x!=="string"||x.length>400))))return false;
    if(v.warning&&(["wrong","correct","why"].some(k=>typeof v.warning[k]!=="string"||v.warning[k].length>2000)))return false;
    if(v.table&&(!Array.isArray(v.table.headers)||!Array.isArray(v.table.rows)||v.table.rows.length>40||
      v.table.rows.some((row:any)=>!Array.isArray(row)||row.length!==v.table.headers.length)))return false;
    if(v.extra&&(!Array.isArray(v.extra.paragraphs)||v.extra.paragraphs.length>18||
      v.extra.paragraphs.some((x:any)=>typeof x!=="string"||x.length>2500)))return false;
    return true;
   };
   if(path==="/studio/units/save"){
    if(!currentPart||!checkVisual(input.content))return reply(422,{error:"راجع بيانات الشرح والجداول والأمثلة"});
    const previous=await admin.from("step_teaching_unit_edits").select("published,published_at")
     .eq("course_code",course).eq("part_index",part).maybeSingle();
    if(previous.error)throw previous.error;
    const {error}=await admin.from("step_teaching_unit_edits").upsert({
     course_code:course,part_index:part,draft:input.content,
     published:previous.data?.published||null,published_at:previous.data?.published_at||null,
     draft_updated_at:time,updated_by:auth.user.id
    },{onConflict:"course_code,part_index"});
    if(error)throw error;
    return reply(200,{ok:true,status:"draft"});
   }
   if(path==="/studio/units/publish"||path==="/studio/units/reset"){
    if(!currentPart)return reply(422,{error:"رقم المرحلة غير صحيح"});
    const table=admin.from("step_teaching_unit_edits");
    if(path.endsWith("/reset")){
     const {error}=await table.delete().eq("course_code",course).eq("part_index",part);
     if(error)throw error;
     return reply(200,{ok:true,status:"original"});
    }
    const {data:existing,error:lookup}=await table.select("draft").eq("course_code",course).eq("part_index",part).maybeSingle();
    if(lookup)throw lookup;
    if(!existing?.draft)return reply(404,{error:"احفظ مسودة الشرح قبل النشر"});
    const {error}=await admin.from("step_teaching_unit_edits").update({
     published:existing.draft,published_at:time,draft:null,draft_updated_at:null,updated_by:auth.user.id
    }).eq("course_code",course).eq("part_index",part);
    if(error)throw error;
    return reply(200,{ok:true,status:"published"});
   }
   if(path==="/studio/sections/save"){
    if(!currentPart||!input.content||typeof input.content!=="object"||Array.isArray(input.content))
     return reply(422,{error:"بيانات المرحلة غير صحيحة"});
    const fields=Object.fromEntries(Object.entries(input.content).filter(([k])=>allowedSection.includes(k)));
    if(!fields.titleAr||typeof fields.titleAr!=="string"||fields.titleAr.length>150||
      typeof fields.description!=="string"||fields.description.length>6000)
     return reply(422,{error:"عنوان المرحلة وشرحها مطلوبان"});
    const previous=await admin.from("step_lesson_content_edits").select("published,published_at")
     .eq("course_code",course).eq("part_index",part).maybeSingle();
    if(previous.error)throw previous.error;
    const {error}=await admin.from("step_lesson_content_edits").upsert({
     course_code:course,part_index:part,draft:fields,published:previous.data?.published||null,
     published_at:previous.data?.published_at||null,draft_updated_at:time,updated_by:auth.user.id
    },{onConflict:"course_code,part_index"});
    if(error)throw error;
    return reply(200,{ok:true,status:"draft"});
   }
   if(path==="/studio/sections/publish"||path==="/studio/sections/reset"){
    if(!currentPart)return reply(422,{error:"رقم المرحلة غير صحيح"});
    if(path.endsWith("/reset")){
     const {error}=await admin.from("step_lesson_content_edits").delete()
      .eq("course_code",course).eq("part_index",part);
     if(error)throw error;
     return reply(200,{ok:true,status:"original"});
    }
    const {data:previous,error:lookup}=await admin.from("step_lesson_content_edits")
     .select("draft").eq("course_code",course).eq("part_index",part).maybeSingle();
    if(lookup)throw lookup;
    if(!previous?.draft)return reply(404,{error:"احفظ مسودة المرحلة الأول"});
    const {error}=await admin.from("step_lesson_content_edits").update({
     published:previous.draft,published_at:time,draft:null,draft_updated_at:null,updated_by:auth.user.id
    }).eq("course_code",course).eq("part_index",part);
    if(error)throw error;
    return reply(200,{ok:true,status:"published"});
   }
   if(path==="/studio/questions/save"){
    const id=String(input.id||"");
    const isOriginal=Object.hasOwn(bank.questions,id);
    const custom=!id||/^STEP-NEW-[0-9a-f-]{36}$/i.test(id);
    if(!isOriginal&&!custom)return reply(422,{error:"معرّف السؤال غير صحيح"});
    if(!currentPart)return reply(422,{error:"اختار مرحلة صحيحة"});
    if(isOriginal&&!bank.sections[part].questionIds.includes(id))
     return reply(422,{error:"معرّف سؤال المصدر مربوط بمرحلته الأصلية"});
    const q=input.content;
    const letters=["A","B","C","D"];
    if(!q||typeof q.text!=="string"||q.text.trim().length<8||q.text.length>2000||
     typeof q.explanation!=="string"||q.explanation.trim().length<4||q.explanation.length>2500||
     !q.options||typeof q.options!=="object"||!letters.includes(q.correct)||
     letters.some(k=>typeof q.options[k]!=="string"||!q.options[k].trim()||q.options[k].length>500)||
     !q.wrongReasons||typeof q.wrongReasons!=="object"||
     letters.some(k=>k!==q.correct&&(typeof q.wrongReasons[k]!=="string"||!q.wrongReasons[k].trim()||q.wrongReasons[k].length>1000)))
     return reply(422,{error:"اكتب السؤال والاختيارات الأربعة والشرح وسبب خطأ كل اختيار غير صحيح"});
    const questionId=id||"STEP-NEW-"+crypto.randomUUID();
    const draft={part_index:part,text:q.text.trim(),options:Object.fromEntries(letters.map(k=>[k,q.options[k].trim()])),
     correct:q.correct,explanation:q.explanation.trim(),
     wrongReasons:Object.fromEntries(letters.filter(k=>k!==q.correct).map(k=>[k,q.wrongReasons[k].trim()]))};
    const {error}=await admin.from("step_question_editor_drafts").upsert({
     course_code:course,id:questionId,draft,updated_at:time,updated_by:auth.user.id
    },{onConflict:"course_code,id"});
    if(error)throw error;
    return reply(200,{ok:true,id:questionId,status:"draft"});
   }
   if(path==="/studio/questions/publish"||path==="/studio/questions/reset"){
    const id=String(input.id||"");
    if(!Object.hasOwn(bank.questions,id)&&!/^STEP-NEW-[0-9a-f-]{36}$/i.test(id))
     return reply(422,{error:"معرّف السؤال غير صحيح"});
    if(path.endsWith("/reset")){
     const {error:dropError}=await admin.from("step_question_editor_drafts").delete()
      .eq("course_code",course).eq("id",id);
     if(dropError)throw dropError;
     if(Object.hasOwn(bank.questions,id)){
      const {error}=await admin.from("step_question_edits").delete().eq("course_code",course).eq("id",id);
      if(error)throw error;
     }else{
      const {error}=await admin.from("step_question_edits").update({status:"archived",updated_at:time})
       .eq("course_code",course).eq("id",id);
      if(error)throw error;
     }
     return reply(200,{ok:true,status:"original"});
    }
    const {data:existing,error:lookup}=await admin.from("step_question_editor_drafts")
     .select("draft").eq("course_code",course).eq("id",id).maybeSingle();
    if(lookup)throw lookup;
    if(!existing?.draft)return reply(404,{error:"احفظ مسودة السؤال الأول"});
    const d=existing.draft;
    // Extra questions must be independently verified in the original-source ledger.
    // Teacher-authored or unsourced drafts never enter a source-only STEP student bank.
    if(!Object.hasOwn(bank.questions,id)){
     const {data:review,error:reviewError}=await admin.from("step_source_item_reviews")
      .select("review_status,original_stem,original_options,printed_key")
      .eq("candidate_id",id).maybeSingle();
     if(reviewError)throw reviewError;
     if(!review||review.review_status!=="approved"||
       review.original_stem!==d.text||
       JSON.stringify(review.original_options)!==JSON.stringify(d.options)||
       review.printed_key!==d.correct)
      return reply(422,{error:"السؤال الجديد مسودة داخلية فقط حتى تدقيق نصه واختياراته وإجابته من المصدر الأصلي"});
    }
    if(!Number.isInteger(d.part_index)||d.part_index<0||d.part_index>=bank.sections.length)
     return reply(422,{error:"مرحلة السؤال غير صحيحة"});
    const {error}=await admin.from("step_question_edits").upsert({
     id,course_code:course,part_index:d.part_index,question_text:d.text,
     options:d.options,correct:d.correct,explanation:d.explanation,
     wrong_reasons:d.wrongReasons,status:"published",created_by:auth.user.id,updated_by:auth.user.id,updated_at:time
    },{onConflict:"id"});
    if(error)throw error;
    const {error:discard}=await admin.from("step_question_editor_drafts").delete()
     .eq("course_code",course).eq("id",id);
    if(discard)throw discard;
    return reply(200,{ok:true,id,status:"published"});
   }
   if(path==="/studio/course/save"){
    const titleAr=String(input.titleAr||"").trim(),title=String(input.title||"").trim(),
     subtitle=String(input.subtitle||"").trim();
    if(titleAr.length<3||titleAr.length>140||title.length<3||title.length>140||
     subtitle.length>350)return reply(422,{error:"راجع عناوين الدرس"});
    const {data:indicator,error:indicatorError}=await admin.from("step_curriculum_indicators")
     .select("slug").eq("legacy_course_code",course).maybeSingle();
    if(indicatorError||!indicator)return reply(409,{error:"ربط الدرس بالمؤشر غير صحيح"});
    const {error}=await admin.from("step_course_metadata_drafts").upsert({
     course_code:course,draft:{title,titleAr,subtitle},
     updated_by:auth.user.id,updated_at:time
    },{onConflict:"course_code"});
    if(error)throw error;
    return reply(200,{ok:true,status:"draft"});
   }
   if(path==="/studio/course/publish"){
    const {data:meta,error:metaError}=await admin.from("step_course_metadata_drafts")
     .select("draft").eq("course_code",course).maybeSingle();
    if(metaError)throw metaError;
    if(!meta?.draft)return reply(404,{error:"احفظ عناوين الدرس كمسودة قبل النشر"});
    const values=meta.draft;
    if(typeof values.title!=="string"||typeof values.titleAr!=="string"||
     values.title.length<3||values.titleAr.length<3)return reply(422,{error:"بيانات المسودة ناقصة"});
    const {data:indicator,error:indError}=await admin.from("step_curriculum_indicators")
     .select("slug").eq("legacy_course_code",course).maybeSingle();
    if(indError||!indicator)return reply(409,{error:"المؤشر غير مربوط بالدرس"});
    const {error:bankError}=await admin.from("step_private_course_banks").update({
     payload:{...bank,...values},updated_at:time,updated_by:auth.user.id
    }).eq("course_code",course);
    if(bankError)throw bankError;
    const {error:saveError}=await admin.from("step_curriculum_indicators").update({
     title_ar:values.titleAr,title_en:values.title,updated_at:time
    }).eq("slug",indicator.slug);
    if(saveError)throw saveError;
    const {error:dropError}=await admin.from("step_course_metadata_drafts").delete()
     .eq("course_code",course);
    if(dropError)throw dropError;
    return reply(200,{ok:true,status:"published"});
   }
   if(path==="/studio/course/reset"){
    const {error}=await admin.from("step_course_metadata_drafts").delete().eq("course_code",course);
    if(error)throw error;
    return reply(200,{ok:true,status:"original"});
   }
   return reply(404,{error:"عملية تحرير غير موجودة"});
  }catch(error){console.error("STEP studio write",error);return reply(500,{error:"تعذر حفظ التعديل"});}
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
   const [axisResult,indicatorResult,bankResult]=await Promise.all([
    admin.from("step_curriculum_axes").select("code,title_ar,title_en,position,content_model").order("position"),
    admin.from("step_curriculum_indicators")
     .select("id,axis_code,slug,title_ar,title_en,description,position,status,legacy_course_code,updated_at")
     .order("position").order("created_at"),
    admin.from("step_question_bank_classifications")
     .select("code,title_en,title_ar,first_page,indicator_slug,related_indicator_slug,mapping_status")
     .order("first_page").order("code")
   ]);
   if(axisResult.error||indicatorResult.error||bankResult.error)throw(axisResult.error||indicatorResult.error||bankResult.error);
   return reply(200,{axes:axisResult.data||[],indicators:indicatorResult.data||[],classifications:bankResult.data||[]});
  }catch(error){console.error("STEP curriculum admin",error);return reply(500,{error:"تعذر فتح المحاور والمؤشرات"});}
 }

 if(path==="/curriculum/classifications/link"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"ربط تصنيفات بنك الأسئلة متاح لمدير المنصة فقط"});
  try{
   const raw=await req.text();if(raw.length>1500)return reply(413,{error:"بيانات كبيرة جدًا"});
   const body=JSON.parse(raw),code=String(body?.code||""),slug=body?.indicator_slug;
   if(!/^ASGQ[A-Z0-9]+$/.test(code)||!(slug===null||typeof slug==="string"))
     return reply(422,{error:"كود التصنيف أو المؤشر غير صحيح"});
   if(typeof slug==="string"&&!/^[a-z][a-z0-9-]{2,39}$/.test(slug))
     return reply(422,{error:"كود المؤشر غير صحيح"});
   if(slug!==null){
    const linked=await admin.from("step_curriculum_indicators").select("slug").eq("slug",slug).maybeSingle();
    if(linked.error)throw linked.error;
    if(!linked.data)return reply(422,{error:"المؤشر المطلوب غير موجود"});
   }
   const result=await admin.from("step_question_bank_classifications")
    .update({indicator_slug:slug,related_indicator_slug:null,
      mapping_status:slug?"mapped":"needs_review",updated_at:new Date().toISOString()})
    .eq("code",code).select("code,indicator_slug,mapping_status").maybeSingle();
   if(result.error)throw result.error;
   if(!result.data)return reply(404,{error:"تصنيف بنك الأسئلة غير موجود"});
   return reply(200,{ok:true,classification:result.data});
  }catch(error){console.error("Bank classification link",error);return reply(500,{error:"تعذر حفظ ربط التصنيف"});}
 }
 if(path==="/curriculum/indicators/save"&&req.method==="POST"){
  if(permission.role!=="owner")return reply(403,{error:"تعديل المؤشرات متاح لمدير المنصة فقط"});
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
  if(permission.role!=="owner")return reply(403,{error:"تغيير حالة المؤشرات متاح لمدير المنصة فقط"});
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

 // Source-based instructional guides: draft/preview/publish per indicator.
 const guideRead=path.match(/^\/guides\/([a-z][a-z0-9-]{2,39})$/);
 if(req.method==="GET"&&guideRead){
  const slug=guideRead[1];
  try{
   const [ind,found]=await Promise.all([
    admin.from("step_curriculum_indicators").select("slug,title_ar,title_en,axis_code,status").eq("slug",slug).maybeSingle(),
    admin.from("step_indicator_guides").select("published,draft,published_at,draft_updated_at")
     .eq("indicator_slug",slug).maybeSingle()
   ]);
   if(ind.error||found.error)throw(ind.error||found.error);
   if(!ind.data)return reply(404,{error:"المؤشر غير موجود"});
   return reply(200,{indicator:ind.data,guide:found.data||{published:null,draft:null}});
  }catch(error){console.error("Admin guide read",error);return reply(500,{error:"تعذر تحميل شرح المؤشر"});}
 }
 const guideWrite=path==="/guides/save"||path==="/guides/publish"||path==="/guides/discard-draft";
 if(req.method==="POST"&&guideWrite){
  if(permission.role!=="owner")return reply(403,{error:"إدارة الشرح متاحة لمدير المنصة فقط"});
  try{
   const raw=await req.text();if(raw.length>95000)return reply(413,{error:"حجم الشرح كبير جدًا"});
   const input=JSON.parse(raw),slug=String(input?.indicator_slug||"");
   if(!/^[a-z][a-z0-9-]{2,39}$/.test(slug))return reply(422,{error:"كود المؤشر غير صالح"});
   const ind=await admin.from("step_curriculum_indicators").select("slug,axis_code")
    .eq("slug",slug).maybeSingle();
   if(ind.error)throw ind.error;
   if(!ind.data)return reply(404,{error:"المؤشر غير موجود"});
   const {data:previous,error:readError}=await admin.from("step_indicator_guides")
    .select("draft,published,published_at,draft_updated_at")
    .eq("indicator_slug",slug).maybeSingle();
   if(readError)throw readError;
   const when=new Date().toISOString();
   if(path==="/guides/save"){
    const rawGuide=input?.guide;
    if(!rawGuide||typeof rawGuide!=="object"||Array.isArray(rawGuide))
     return reply(422,{error:"محتوى الشرح غير صحيح"});
    const str=(v:unknown,field:string,min=1,max=600)=>{
      if(typeof v!=="string"||v.trim().length<min||v.trim().length>max)
       throw Error("راجع حقل "+field);
      return v.trim();
    };
    const sections=rawGuide.modules;
    if(!Array.isArray(sections)||sections.length<1||sections.length>16)
     return reply(422,{error:"أضف قسمًا واحدًا على الأقل وبحد أقصى 16 قسمًا"});
    const used=new Set<string>();
    const modules=sections.map((s:any,index:number)=>{
     const id=str(s?.id,"رقم القسم",2,40);
     if(!/^[a-z][a-z0-9-]*$/.test(id)||used.has(id))throw Error("راجع معرّفات أقسام الشرح");
     used.add(id);
     const page=Number(s.source_page);
     if(!Number.isInteger(page)||page<1||page>2000)throw Error("راجع صفحة المصدر");
     if(!Array.isArray(s.rules)||s.rules.length>18||!Array.isArray(s.examples)||s.examples.length>30
       ||!Array.isArray(s.keywords)||s.keywords.length>40)
       throw Error("راجع عدد القواعد والأمثلة والكلمات");
     return {id,title_ar:str(s.title_ar,"عنوان القسم",2,150),
       title_en:str(s.title_en,"عنوان القسم الإنجليزي",2,150),
       source_page:page,intro_ar:str(s.intro_ar,"شرح القسم",5,3200),
       rules:s.rules.map((r:any)=>({label_ar:str(r?.label_ar,"عنوان القاعدة",2,180),
         formula:str(r?.formula,"صيغة القاعدة",2,330)})),
       examples:s.examples.map((e:any)=>({en:str(e?.en,"نص المثال",3,500),
         tag:typeof e?.tag==="string"?e.tag.trim().slice(0,70):""})),
       keywords:s.keywords.map((v:any)=>({en:str(v?.en,"الكلمة الإنجليزية",1,100),
         ar:str(v?.ar,"المعنى العربي",1,140)}))
     };
    });
    const pages=rawGuide?.source?.pages;
    if(!Array.isArray(pages)||pages.length<1||pages.length>20||
      pages.some((p:unknown)=>!Number.isInteger(p)||p<1||p>2000))
      return reply(422,{error:"حدد صفحات المصدر بشكل صحيح"});
    const clean={schema_version:1,indicator_slug:slug,
     title_ar:str(rawGuide.title_ar,"عنوان الدرس",3,180),
     title_en:str(rawGuide.title_en,"عنوان الدرس الإنجليزي",3,180),
     source:{document:str(rawGuide?.source?.document,"اسم المرجع",3,230),pages},
     modules
    };
    const {error}=await admin.from("step_indicator_guides").upsert({
     indicator_slug:slug,draft:clean,published:previous?.published||null,
     published_at:previous?.published_at||null,draft_updated_at:when,updated_at:when,updated_by:auth.user.id
    },{onConflict:"indicator_slug"});
    if(error)throw error;
    return reply(200,{ok:true,status:"draft",indicator_slug:slug,sections:modules.length});
   }
   if(!previous)return reply(404,{error:"مفيش شرح محفوظ للمؤشر"});
   if(path==="/guides/publish"&&!previous.draft)
    return reply(422,{error:"احفظ المسودة قبل النشر"});
   if(path==="/guides/publish"&&ind.data.status!=="published")
    return reply(403,{error:"المؤشر نفسه غير منشور؛ لا يمكن نشر شرحه للطلاب الآن"});
   const fields=path==="/guides/publish"?
     {published:previous.draft,published_at:when,draft:null,draft_updated_at:null}:
     {draft:null,draft_updated_at:null};
   const {error}=await admin.from("step_indicator_guides").update({
     ...fields,updated_by:auth.user.id,updated_at:when
   }).eq("indicator_slug",slug);
   if(error)throw error;
   return reply(200,{ok:true,status:path==="/guides/publish"?"published":"draft-discarded"});
  }catch(error){
   console.error("Admin guide write",error);
   return reply(422,{error:error instanceof Error&&error.message.startsWith("راجع")?
     error.message:"تعذر حفظ أو نشر شرح المؤشر"});
  }
 }
 return reply(404,{error:"المسار غير موجود"});
});
