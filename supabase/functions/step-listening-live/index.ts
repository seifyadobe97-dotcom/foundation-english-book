import {createClient} from "npm:@supabase/supabase-js@2.57.0";
const url=Deno.env.get("SUPABASE_URL")||"",serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const allowedOrigins=new Set(["https://seifyadobe97-dotcom.github.io","http://localhost:3000","http://127.0.0.1:3000"]);
const bucket="step-listening-private";
const allowedSamples=new Set(["record-1","record-2"]);
type Dict=Record<string,string>;
function response(origin:string,status:number,body:unknown){
 return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8",
 "Cache-Control":"no-store","Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"https://seifyadobe97-dotcom.github.io",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Vary":"Origin"}});
}
async function readBody(request:Request,max=6000){
 const raw=await request.text();if(raw.length>max)throw Error("Request too large");return JSON.parse(raw);
}
function validAnswers(ans:unknown,items:any[]):ans is Dict{
 return !!ans&&typeof ans==="object"&&!Array.isArray(ans)&&Object.keys(ans).length===items.length&&
 items.every(i=>["A","B","C","D"].includes((ans as Dict)[i.id]))&&
 Object.keys(ans).every(k=>items.some(i=>i.id===k));
}
Deno.serve(async request=>{
 const origin=request.headers.get("origin")||"";
 const send=(status:number,data:unknown)=>response(origin,status,data);
 if(request.method==="OPTIONS")return send(allowedOrigins.has(origin)?200:403,{ok:allowedOrigins.has(origin)});
 if(!allowedOrigins.has(origin))return send(403,{error:"Origin not allowed"});
 if(!url||!serviceKey)return send(503,{error:"Server unavailable"});
 const token=request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return send(401,{error:"سجل دخولك الأول"});
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const auth=await admin.auth.getUser(token),user=auth.data.user;
 if(auth.error||!user)return send(401,{error:"جلسة حسابك منتهية"});
 const path=new URL(request.url).pathname.replace(/^\/(?:functions\/v1\/)?step-listening-live/,"")||"/";
 try{
  if(request.method==="POST"&&path==="/upload"){
   const role=await admin.from("step_admin_accounts").select("role").eq("user_id",user.id).maybeSingle();
   if(role.error||role.data?.role!=="owner")return send(403,{error:"رفع الصوتيات متاح لصاحب المنصة فقط"});
   const sample=new URL(request.url).searchParams.get("sample")||"";
   if(!allowedSamples.has(sample))return send(400,{error:"التسجيل غير معروف"});
   const ctype=request.headers.get("content-type")||"";
   if(!["audio/mpeg","audio/mp3"].includes(ctype.split(";")[0].trim()))return send(415,{error:"مطلوب ملف MP3"});
   const length=Number(request.headers.get("content-length")||0);
   if(length>10000000)return send(413,{error:"ملف الصوت كبير"});
   const bytes=new Uint8Array(await request.arrayBuffer());
   if(bytes.length<2048||bytes.length>10000000)return send(400,{error:"ملف الصوت غير صالح"});
   const mp3=(bytes[0]===73&&bytes[1]===68&&bytes[2]===51)||(bytes[0]===255&&(bytes[1]&224)===224);
   if(!mp3)return send(415,{error:"صيغة MP3 غير صحيحة"});
   const check=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),x=>x.toString(16).padStart(2,"0")).join("");
   const existing=await admin.from("step_listening_clips").select("id,storage_path,review_state,duration_seconds").eq("sample_code",sample).single();
   if(existing.error||!existing.data)return send(404,{error:"بيانات المقطع غير موجودة"});
   if(existing.data.review_state==="approved"||existing.data.storage_path)return send(409,{error:"التسجيل معتمد بالفعل؛ التغيير يحتاج إصدارًا جديدًا"});
   const objectPath="approved-samples/"+sample+"-"+check.slice(0,12)+".mp3";
   const upload=await admin.storage.from(bucket).upload(objectPath,bytes,{contentType:"audio/mpeg",upsert:false,cacheControl:"3600"});
   if(upload.error)return send(503,{error:"تعذر رفع الصوت إلى مساحة التخزين الخاصة"});
   const clip=await admin.from("step_listening_clips").update({
      storage_path:objectPath,sha256:check,review_state:"approved",
      reviewer_id:user.id,reviewed_at:new Date().toISOString(),
      rights_notes:"Owner authorized student use via authenticated audio upload, 2026-10-24"
    }).eq("id",existing.data.id).eq("review_state","draft").select("id").single();
   if(clip.error){
    await admin.storage.from(bucket).remove([objectPath]);
    return send(503,{error:"فشل اعتماد ملف الصوت؛ لم يُفعّل للطلاب"});
   }
   const approved=await admin.from("step_listening_groups").update({review_state:"approved"})
      .eq("sample_code",sample).eq("review_state","draft").select("id").single();
   if(approved.error)return send(503,{error:"تم رفع الصوت ولكن اعتماده كدرس يحتاج مراجعة الإدارة"});
   return send(200,{ok:true,sample,sha256:check,ready:true});
  }
  const profile=await admin.from("step_student_profiles").select("is_active").eq("user_id",user.id).maybeSingle();
  if(profile.error||!profile.data||profile.data.is_active===false)return send(403,{error:"حساب الطالب غير نشط"});
  if(request.method==="GET"&&path==="/catalog"){
    const groups=await admin.from("step_listening_groups").select("id,sample_code,title_ar,title_en,seconds_per_question,clip_id")
      .eq("review_state","approved").in("sample_code",["record-1","record-2"]).order("sample_code");
    if(groups.error)return send(503,{error:"تعذر تحميل التسجيلات"});
    const listed=[];
    for(const g of groups.data||[]){
      const clip=await admin.from("step_listening_clips").select("storage_path,review_state").eq("id",g.clip_id).single();
      const items=await admin.from("step_listening_items").select("id").eq("group_id",g.id).eq("review_state","approved");
      if(clip.data?.review_state==="approved"&&clip.data?.storage_path&&items.data?.length===2)
        listed.push({sample:g.sample_code,title_ar:g.title_ar,title_en:g.title_en,questionCount:2});
    }
    return send(200,{groups:listed});
  }
  if(request.method==="GET"&&path==="/progress"){
    const attempts=await admin.from("step_listening_attempts").select("id,mode,submitted_at,group_id")
     .eq("user_id",user.id).not("submitted_at","is",null);
    return send(200,{completed:attempts.data?.length||0});
  }
  if(request.method==="POST"&&path==="/begin"){
   const b=await readBody(request),sample=String(b.sample||""),mode=b.mode;
   if(!allowedSamples.has(sample)||!["practice","exam"].includes(mode))return send(400,{error:"مجموعة غير متاحة"});
   const group=await admin.from("step_listening_groups").select("id,clip_id,seconds_per_question,review_state")
      .eq("sample_code",sample).maybeSingle();
   if(!group.data||group.data.review_state!=="approved")return send(403,{error:"التسجيل لم يُنشر بعد"});
   const clip=await admin.from("step_listening_clips").select("storage_path,review_state").eq("id",group.data.clip_id).single();
   if(!clip.data?.storage_path||clip.data.review_state!=="approved")return send(403,{error:"التسجيل الصوتي غير جاهز"});
   const items=await admin.from("step_listening_items").select("id,position,question_text,options,review_state")
     .eq("group_id",group.data.id).eq("review_state","approved").order("position");
   if(items.error||items.data?.length!==2)return send(503,{error:"أسئلة المجموعة تحتاج مراجعة"});
   const signed=await admin.storage.from(bucket).createSignedUrl(clip.data.storage_path,300);
   if(signed.error||!signed.data?.signedUrl)return send(503,{error:"تعذر تجهيز الملف الصوتي"});
   const attempt=await admin.from("step_listening_attempts")
    .insert({user_id:user.id,group_id:group.data.id,mode,state:"created"}).select("id").single();
   if(attempt.error)return send(503,{error:"تعذر إنشاء المحاولة"});
   return send(200,{attemptId:attempt.data.id,audioUrl:signed.data.signedUrl,
    questions:items.data.map(x=>({id:x.id,text:x.question_text,options:x.options})),
    secondsPerQuestion:group.data.seconds_per_question});
  }
  if(request.method==="POST"&&path==="/prepare"){
   const b=await readBody(request);if(typeof b.attemptId!=="string")return send(400,{error:"محاولة غير صحيحة"});
   const attempt=await admin.from("step_listening_attempts").select("id,state,mode,group_id")
      .eq("id",b.attemptId).eq("user_id",user.id).maybeSingle();
   if(!attempt.data||attempt.data.state!=="created")return send(409,{error:"المحاولة بدأت بالفعل"});
   const group=await admin.from("step_listening_groups").select("seconds_per_question").eq("id",attempt.data.group_id).single();
   const items=await admin.from("step_listening_items").select("id").eq("group_id",attempt.data.group_id).eq("review_state","approved");
   if(group.error||items.error||!items.data?.length)return send(503,{error:"تعذر تجهيز العدّاد"});
   const starts=new Date(),end=new Date(starts.getTime()+group.data.seconds_per_question*items.data.length*1000);
   const upd=await admin.from("step_listening_attempts").update({state:attempt.data.mode==="exam"?"reading":"answering",
     reading_started_at:starts.toISOString(),reading_ends_at:end.toISOString()})
     .eq("id",attempt.data.id).eq("state","created").select("id").maybeSingle();
   if(upd.error||!upd.data)return send(409,{error:"محاولة مكررة"});
   return send(200,{prepared:true,readingSeconds:group.data.seconds_per_question*items.data.length});
  }
  if(request.method==="POST"&&path==="/play"){
   const b=await readBody(request);
   const a=await admin.from("step_listening_attempts").select("id,mode,state,audio_started_at,reading_ends_at")
      .eq("id",b.attemptId).eq("user_id",user.id).maybeSingle();
   if(!a.data||a.data.state==="submitted")return send(409,{error:"محاولة منتهية"});
   if(a.data.mode==="exam"&&a.data.audio_started_at)return send(409,{error:"الصوت اتشغل بالفعل"});
   if(a.data.mode==="exam"&&a.data.reading_ends_at&&Date.now()<new Date(a.data.reading_ends_at).getTime()-700)
     return send(409,{error:"وقت قراءة السؤالين لم ينته"});
   const updated=await admin.from("step_listening_attempts").update({audio_started_at:new Date().toISOString(),state:"playing"})
      .eq("id",a.data.id).is("audio_started_at",null).select("id").maybeSingle();
   if(updated.error)return send(503,{error:"خطأ تسجيل بداية الصوت"});
   return send(200,{accepted:true});
  }
  if(request.method==="POST"&&path==="/submit"){
   const b=await readBody(request),attemptId=String(b.attemptId||"");
   const attempt=await admin.from("step_listening_attempts").select("id,mode,group_id,state,submitted_at,audio_started_at")
     .eq("id",attemptId).eq("user_id",user.id).maybeSingle();
   if(!attempt.data||attempt.data.submitted_at||attempt.data.state==="created"||attempt.data.state==="reading")
     return send(409,{error:"المحاولة مش جاهزة للتسليم أو اتسلمت قبل كده"});
   if(attempt.data.mode==="exam"&&!attempt.data.audio_started_at)return send(409,{error:"التسجيل لم يبدأ بعد"});
   const items=await admin.from("step_listening_items").select("id,correct_choice,explanation_ar,wrong_reasons_ar")
     .eq("group_id",attempt.data.group_id).eq("review_state","approved").order("position");
   if(items.error||!items.data||!validAnswers(b.answers,items.data))return send(400,{error:"جاوب على السؤالين الأول"});
   const answers=b.answers as Dict;
   const rows=items.data.map(i=>({attempt_id:attemptId,item_id:i.id,selected_choice:answers[i.id],
     is_correct:answers[i.id]===i.correct_choice}));
   const saved=await admin.from("step_listening_responses").insert(rows);
   if(saved.error)return send(503,{error:"تعذر حفظ الإجابات"});
   const complete=await admin.from("step_listening_attempts").update({state:"submitted",submitted_at:new Date().toISOString()})
      .eq("id",attemptId).is("submitted_at",null).select("id").maybeSingle();
   if(complete.error||!complete.data)return send(409,{error:"تم تسجيل المحاولة بالفعل"});
   const correct=rows.filter(i=>i.is_correct).length;
   if(attempt.data.mode==="exam")return send(200,{accepted:true,correct,total:items.data.length});
   const group=await admin.from("step_listening_groups").select("clip_id").eq("id",attempt.data.group_id).single();
   const clip=await admin.from("step_listening_clips").select("transcript").eq("id",group.data.clip_id).single();
   return send(200,{accepted:true,correct,total:items.data.length,transcript:clip.data?.transcript||"",
    results:items.data.map(i=>({id:i.id,correct:i.correct_choice,isCorrect:answers[i.id]===i.correct_choice,
      explanation:i.explanation_ar,wrongReason:i.wrong_reasons_ar?.[answers[i.id]]||"راجع المقطع الصوتي."}))});
  }
  return send(404,{error:"مسار غير موجود"});
 }catch(e){console.error("Listening service error",e);return send(500,{error:"حصل خطأ تقني، جرب تاني"});}
});