import {createClient} from "npm:@supabase/supabase-js@2.57.0";
const URL=Deno.env.get("SUPABASE_URL")||"",SECRET=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const origins=new Set(["https://seifyadobe97-dotcom.github.io","http://localhost:3000","http://127.0.0.1:3000"]);
const letters=["A","B","C","D"] as const;
type Answers=Record<string,string>;
function respond(origin:string,status:number,body:unknown){
 return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8",
 "cache-control":"no-store","access-control-allow-origin":origins.has(origin)?origin:"https://seifyadobe97-dotcom.github.io",
 "access-control-allow-methods":"GET,POST,OPTIONS",
 "access-control-allow-headers":"authorization,apikey,content-type,x-client-info","vary":"Origin"}});
}
function cleanOptions(value:any){
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const copy:Record<string,string>={};
 for(const key of letters){if(typeof value[key]!=="string"||value[key].trim().length<1||value[key].length>500)return null;copy[key]=value[key].trim();}
 return copy;
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"",send=(status:number,x:unknown)=>respond(origin,status,x);
 if(req.method==="OPTIONS")return send(origins.has(origin)?200:403,{ok:origins.has(origin)});
 if(!origins.has(origin))return send(403,{error:"Origin not allowed"});
 if(!URL||!SECRET)return send(503,{error:"Reading service not configured"});
 const jwt=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!jwt)return send(401,{error:"سجّل دخولك لحساب STEP الأول"});
 const db=createClient(URL,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});
 const userResult=await db.auth.getUser(jwt);
 const user=userResult.data.user;
 if(userResult.error||!user)return send(401,{error:"جلسة الدخول منتهية، سجّل دخولك تاني"});
 const path=new URL(req.url).pathname.replace(/^\/(?:functions\/v1\/)?step-reading-live/,"")||"/";
 const isOwner=async()=>{
  const r=await db.from("step_admin_accounts").select("role").eq("user_id",user.id).maybeSingle();
  return !r.error&&r.data?.role==="owner";
 };
 const isStudent=async()=>{
  const r=await db.from("step_student_profiles").select("is_active").eq("user_id",user.id).maybeSingle();
  return !r.error&&r.data?.is_active===true;
 };
 const read=async()=>{
  const raw=await req.text();if(raw.length>18000)throw Error("Payload too large");
  return JSON.parse(raw);
 };
 try{
  if(path.startsWith("/admin/")){
   if(!await isOwner())return send(403,{error:"إدارة القراءة لصاحب المنصة فقط"});
   if(req.method==="GET"&&path==="/admin/catalog"){
    const passages=await db.from("step_reading_passages").select("id,slug,title_en,title_ar,paragraphs,status,source_label,exam_seconds").order("created_at");
    if(passages.error)return send(503,{error:"تعذر تحميل القطع"});
    const collected=[];
    for(const passage of passages.data||[]){
     const items=await db.from("step_reading_items").select("id,position,question_text,options,correct_choice,explanation_ar,paragraph_number,review_state,editorial_notes")
      .eq("passage_id",passage.id).order("position");
     collected.push({...passage,items:items.data||[]});
    }
    return send(200,{passages:collected});
   }
   if(req.method==="POST"&&path==="/admin/review"){
    const v=await read(),id=typeof v.id==="string"?v.id:"";
    const current=await db.from("step_reading_items").select("id,review_state,passage_id").eq("id",id).maybeSingle();
    if(!current.data||current.data.review_state==="approved")return send(409,{error:"السؤال المعتمد لا يُعدل حفاظًا على درجات المحاولات القديمة"});
    const opts=cleanOptions(v.options);
    if(!opts||typeof v.question_text!=="string"||v.question_text.trim().length<12||
      typeof v.explanation_ar!=="string"||v.explanation_ar.trim().length<12||
      !letters.includes(v.correct_choice)||!Number.isInteger(v.paragraph_number)||v.paragraph_number<1||v.paragraph_number>100)
       return send(400,{error:"راجع السؤال والاختيارات الأربعة والإجابة والتفسير والفقرة"});
    const update=await db.from("step_reading_items").update({
      question_text:v.question_text.trim(),options:opts,correct_choice:v.correct_choice,
      explanation_ar:v.explanation_ar.trim(),paragraph_number:v.paragraph_number,
      editorial_notes:String(v.editorial_notes||"Owner reviewed source ambiguity").slice(0,1000),
      review_state:v.approve===true?"approved":"needs_review"
    }).eq("id",id).neq("review_state","approved").select("id,review_state").maybeSingle();
    if(update.error||!update.data)return send(503,{error:"تعذر حفظ مراجعة السؤال"});
    return send(200,{saved:true,status:update.data.review_state});
   }
   if(req.method==="GET"&&path==="/admin/grades"){
    const attempts=await db.from("step_reading_attempts").select("id,user_id,mode,correct_count,total_questions,submitted_at")
      .eq("state","submitted").order("submitted_at",{ascending:false}).limit(2000);
    if(attempts.error)return send(503,{error:"تعذر تحميل المحاولات"});
    const profiles=await db.from("step_student_profiles").select("user_id,username");
    const names=new Map((profiles.data||[]).map(p=>[p.user_id,p.username]));
    const byStudent=new Map<string,any>();
    for(const a of attempts.data||[]){
      const x=byStudent.get(a.user_id)||{username:names.get(a.user_id)||"طالب",attempts:0,practice:0,exam:0,correct:0,total:0};
      x.attempts++;x[a.mode]++;x.correct+=a.correct_count||0;x.total+=a.total_questions||0;byStudent.set(a.user_id,x);
    }
    return send(200,{students:[...byStudent.values()].map(x=>({...x,percent:x.total?Math.round(100*x.correct/x.total):0})),
       completed:attempts.data?.length||0});
   }
   return send(404,{error:"مسار الأدمن غير معروف"});
  }
  if(!await isStudent())return send(403,{error:"مطلوب حساب طالب مفعل"});
  if(req.method==="GET"&&path==="/catalog"){
   const ps=await db.from("step_reading_passages").select("id,slug,title_en,title_ar,exam_seconds")
      .eq("status","approved").order("created_at");
   if(ps.error)return send(503,{error:"تعذر تحميل قسم القراءة"});
   const entries=[];
   for(const p of ps.data||[]){
     const questions=await db.from("step_reading_items").select("id").eq("passage_id",p.id).eq("review_state","approved");
     if(questions.data?.length)entries.push({slug:p.slug,title_en:p.title_en,title_ar:p.title_ar,
       questionCount:questions.data.length,examSeconds:p.exam_seconds});
   }
   return send(200,{passages:entries});
  }
  if(req.method==="POST"&&path==="/begin"){
    const x=await read();
    if(typeof x.slug!=="string"||!["practice","exam"].includes(x.mode))return send(400,{error:"اختيار غير صحيح"});
    const p=await db.from("step_reading_passages")
      .select("id,title_en,title_ar,slug,paragraphs,status,exam_seconds")
      .eq("slug",x.slug).eq("status","approved").maybeSingle();
    if(p.error||!p.data)return send(404,{error:"قطعة القراءة مش منشورة"});
    const items=await db.from("step_reading_items").select("id,position,question_text,options")
      .eq("passage_id",p.data.id).eq("review_state","approved").order("position");
    if(items.error||!items.data?.length)return send(503,{error:"الأسئلة لسه تحت المراجعة"});
    const due=x.mode==="exam"?new Date(Date.now()+p.data.exam_seconds*1000).toISOString():null;
    const attempt=await db.from("step_reading_attempts").insert({user_id:user.id,passage_id:p.data.id,
      mode:x.mode,state:"in_progress",due_at:due}).select("id").single();
    if(attempt.error)return send(503,{error:"تعذر بدء محاولة القراءة"});
    return send(200,{attemptId:attempt.data.id,mode:x.mode,slug:p.data.slug,title:p.data.title_en,
      titleAr:p.data.title_ar,paragraphs:p.data.paragraphs,
      questions:items.data.map(q=>({id:q.id,number:q.position,text:q.question_text,options:q.options})),
      dueAt:due,examSeconds:p.data.exam_seconds});
  }
  if(req.method==="POST"&&path==="/submit"){
    const x=await read();
    const attempt=await db.from("step_reading_attempts")
      .select("id,mode,state,passage_id,due_at").eq("id",x.attemptId).eq("user_id",user.id).maybeSingle();
    if(!attempt.data||attempt.data.state!=="in_progress")return send(409,{error:"المحاولة منتهية أو مش بتاعتك"});
    const items=await db.from("step_reading_items").select("id,position,correct_choice,explanation_ar,paragraph_number")
      .eq("passage_id",attempt.data.passage_id).eq("review_state","approved").order("position");
    if(items.error||!items.data?.length)return send(503,{error:"تعذر تصحيح الأسئلة"});
    const answers=x.answers;
    if(!answers||typeof answers!=="object"||Array.isArray(answers))return send(400,{error:"إجابات غير صحيحة"});
    const keys=Object.keys(answers),ids=new Set(items.data.map(i=>i.id));
    if(keys.some(k=>!ids.has(k))||keys.some(k=>answers[k]!==null&&!letters.includes(answers[k])))
       return send(400,{error:"إجابة غير معروفة"});
    if(attempt.data.mode==="practice"&&items.data.some(i=>!letters.includes(answers[i.id])))
       return send(400,{error:"جاوب على كل الأسئلة الأربعة قبل التصحيح"});
    // Simulated timed exam: server enforces the deadline with a small network grace period.
    if(attempt.data.mode==="exam"&&attempt.data.due_at&&Date.now()>Date.parse(attempt.data.due_at)+30000)
      return send(409,{error:"انتهى وقت المحاكاة. ابدأ محاولة جديدة؛ المحاولة دي مش محسوبة"});
    const rows=items.data.map(i=>({attempt_id:attempt.data.id,item_id:i.id,
       selected_choice:letters.includes(answers[i.id])?answers[i.id]:null,
       correct_choice_snapshot:i.correct_choice,is_correct:answers[i.id]===i.correct_choice}));
    const saved=await db.from("step_reading_responses").insert(rows);
    if(saved.error)return send(409,{error:"المحاولة اتسلمت بالفعل أو تعذر حفظ الإجابات"});
    const correct=rows.filter(r=>r.is_correct).length;
    const finished=await db.from("step_reading_attempts")
       .update({state:"submitted",submitted_at:new Date().toISOString(),correct_count:correct,total_questions:rows.length})
       .eq("id",attempt.data.id).eq("state","in_progress").select("id").maybeSingle();
    if(finished.error||!finished.data)return send(503,{error:"الإجابات محفوظة لكن حالة المحاولة تحتاج مراجعة"});
    const basic={saved:true,correct,total:rows.length,mode:attempt.data.mode};
    if(attempt.data.mode==="exam")return send(200,basic);
    return send(200,{...basic,review:items.data.map(i=>({
       id:i.id,number:i.position,correct:i.correct_choice,explanation:i.explanation_ar,
       paragraph:i.paragraph_number,selected:answers[i.id],isCorrect:answers[i.id]===i.correct_choice}))});
  }
  if(req.method==="GET"&&path==="/progress"){
    const list=await db.from("step_reading_attempts").select("id,mode,correct_count,total_questions,submitted_at")
     .eq("user_id",user.id).eq("state","submitted").order("submitted_at",{ascending:false}).limit(200);
    if(list.error)return send(503,{error:"تعذر تحميل درجات القراءة"});
    const sum={practice:{attempts:0,correct:0,total:0},exam:{attempts:0,correct:0,total:0}};
    const history=(list.data||[]).map(a=>{
      const entry=sum[a.mode as "practice"|"exam"];
      entry.attempts++;entry.correct+=a.correct_count||0;entry.total+=a.total_questions||0;
      return {mode:a.mode,correct:a.correct_count,total:a.total_questions,at:a.submitted_at};
    });
    const correct=sum.practice.correct+sum.exam.correct,total=sum.practice.total+sum.exam.total;
    return send(200,{completed:history.length,correct,total,byMode:sum,history:history.slice(0,20)});
  }
  return send(404,{error:"مسار غير متاح"});
 }catch(e){console.error("STEP Reading request error",e);return send(500,{error:"حدث خطأ في خدمة القراءة"})}
});