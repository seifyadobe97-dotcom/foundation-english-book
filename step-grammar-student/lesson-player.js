"use strict";
let LESSONS=[];
const ABC=["A","B","C","D"];
const lessonSlug=new URLSearchParams(location.search).get("slug")||"";
if(!/^[a-z][a-z0-9-]{2,39}$/.test(lessonSlug)){
 document.getElementById("lesson-root").textContent="رابط الدرس غير صحيح";
 throw Error("Invalid lesson slug");
}
const API_PREFIX="/lesson/"+lessonSlug;
// Browser timings are advisory, not a grading or cheating-detection signal.
function newTiming(forExam=false){
 return {started:performance.now(),lastAction:forExam?performance.now():null,pauseMs:0,pausedAt:null,
  perQuestion:{},changes:{}};
}
function elapsedMs(){
 const t=state.timing;if(!t)return 0;
 const now=performance.now(),hidden=t.pausedAt==null?0:now-t.pausedAt;
 return Math.max(0,Math.round(now-t.started-t.pauseMs-hidden));
}
function timeLabel(ms){
 const seconds=Math.floor(ms/1000);
 return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
}
function recordAnswerTime(id,alreadyChosen){
 const t=state.timing;if(!t)return;
 const now=performance.now();
 t.perQuestion[id]=(t.perQuestion[id]||0)+Math.max(0,Math.round(t.lastAction===null?0:now-t.lastAction));
 if(alreadyChosen)t.changes[id]=(t.changes[id]||0)+1;
 t.lastAction=now;
}
document.addEventListener("visibilitychange",()=>{
 const t=state.timing;if(!t)return;
 const now=performance.now();
 if(document.hidden && t.pausedAt===null)t.pausedAt=now;
 else if(!document.hidden&&t.pausedAt!==null){
  t.pauseMs+=now-t.pausedAt;t.pausedAt=null;if(t.lastAction!==null)t.lastAction=now;
 }
});
let practiceObserver=null;
function monitorPracticeStart(){
 practiceObserver?.disconnect();
 if(state.mode!=="lesson"||state.timing?.lastAction!==null||!window.IntersectionObserver)return;
 const first=document.querySelector(".question");if(!first)return;
 const tracked=state.timing;
 practiceObserver=new IntersectionObserver(entries=>{
  if(tracked!==state.timing){practiceObserver?.disconnect();return;}
  if(entries.some(e=>e.isIntersecting)){
   if(tracked?.lastAction===null)tracked.lastAction=performance.now();
   practiceObserver?.disconnect();
  }
 },{threshold:0.15});
 practiceObserver.observe(first);
}
setInterval(()=>{
 const el=document.getElementById("exam-elapsed");
 if(el&&state.mode==="exam"&&!state.examResult)el.textContent=timeLabel(elapsedMs());
},1000);
const state={course:null,part:null,index:0,answers:{},graded:null,mode:"lesson",exam:null,examResult:null,busy:false,openedVideo:null,timing:null,videos:[]};
const root=document.getElementById("lesson-root");
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const mark=s=>escapeHtml(s).replace(/\[\[([\s\S]+?)\]\]/g,"<mark>$1</mark>");
// Escape editor copy first, then isolate English phrases so Arabic punctuation stays in place.
const clean=s=>String(s??"").replace(/<\/?bdi>/gi,"").replace(/\*\*/g,"")
 .split(/(`[^`]+`|[A-Za-z][A-Za-z0-9]*(?:[ '’.-]+[A-Za-z0-9]+)*)/g)
 .map(part=>/^`[^`]+`$/.test(part)||/^[A-Za-z]/.test(part)
  ?'<bdi class="en" dir="ltr">'+escapeHtml(part.replace(/^`|`$/g,""))+'</bdi>'
  :escapeHtml(part)).join("");
const projectUrl="https://funltjxavowlnnfibhpl.supabase.co";
const anonKey=document.querySelector('meta[name="step-anon-key"]').content;
const client=window.supabase.createClient(projectUrl,anonKey);
async function api(path,body){
 const {data:{session}}=await client.auth.getSession();
 if(!session){location.assign("../step-grammar-account-preview/");throw Error("سجّل دخولك علشان تكمل الدرس.");}
 const r=await fetch(projectUrl+"/functions/v1/step-course"+API_PREFIX+path,{
  method:body?"POST":"GET",
  headers:{"apikey":anonKey,"Authorization":"Bearer "+session.access_token,"Content-Type":"application/json"},
  body:body?JSON.stringify(body):undefined
 });
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.error||"تعذر تحميل الدرس");
 return d;
}
function loading(message="بنجهز المرحلة…"){root.innerHTML='<section class="lesson"><div class="lesson-inner">'+escapeHtml(message)+'</div></section>';}
function fail(e){root.innerHTML='<div role="alert" class="empty">'+escapeHtml(e.message||"حصلت مشكلة. حاول تاني.")+'</div><div class="chapter-footer"><a class="button secondary" href="../step-grammar-student/">رجوع لدروسي</a><button class="button" data-action="reload">إعادة المحاولة</button></div>';}
async function init(){
 loading("بنجهز درسك…");
 try{
  state.course=await api("/course");
  LESSONS=Array.isArray(state.course.teachingUnits)?state.course.teachingUnits:[];
  if(!LESSONS.length||LESSONS.length!==state.course.sections?.length)
   throw Error("شرح الدرس لسه مش جاهز للنشر");
  // Approved visual teaching edits are loaded from the server; local copy is the immutable fallback.
  const teaching=await api("/teaching").catch(()=>({units:[]}));
  for(const revision of teaching.units||[]){
   if(Number.isInteger(revision.index)&&revision.index>=0&&revision.index<LESSONS.length
      &&revision.content&&typeof revision.content==="object"&&!Array.isArray(revision.content)){
    const allowed=["title","detail","tip","cards","examples","keywords","warning",
     "formulas","table","extra"];
    const content={};
    for(const key of allowed)if(Object.hasOwn(revision.content,key))content[key]=revision.content[key];
    LESSONS[revision.index]={...LESSONS[revision.index],...content};
   }
  }
  // Optional media must never prevent a beginner from opening the lesson.
  state.videos=(await api("/videos").catch(()=>({videos:[]}))).videos||[];
  const requested=new URLSearchParams(location.search).get("step");
  const n=requested===null?NaN:Number(requested);
  const ix=Number.isInteger(n)&&n>=0&&n<LESSONS.length&&!state.course.sections[n]?.locked?n:state.course.nextIndex;
  await openPart(Math.min(LESSONS.length-1,Math.max(0,ix)),false);
 }catch(e){fail(e);}
}
async function openPart(i,scroll=true){
 if(state.busy||state.course?.sections?.[i]?.locked)return;
 state.busy=true;loading();
 try{
  const d=await api("/parts/"+i);
  state.course=d.progress;state.part=d.part;state.index=i;state.answers={};state.graded=null;
  state.mode="lesson";state.exam=null;state.examResult=null;state.openedVideo=null;state.timing=newTiming();
  draw();if(scroll)window.scrollTo({top:0,behavior:"smooth"});
 }catch(e){fail(e);}
 finally{state.busy=false;}
}
function renderLessonHeader(){
 const list=state.course.sections,passed=list.filter(s=>s.passed).length,pct=Math.round(passed/list.length*100);
 return '<section class="hero"><div><div class="kicker">STEP · '+(state.course.course?.axis_code==="writing-analysis"?"WRITING ANALYSIS":"GRAMMAR")+'</div><h1>'+escapeHtml(state.course.course?.title||"STEP Lesson")+'</h1><p class="lead">'+escapeHtml(state.course.course?.subtitle||"شرح خطوة بخطوة وتدريبات أصلية.")+'</p></div>'+
 '<div class="progress-block"><div class="progress-number">'+pct+'%</div><div class="progress-caption">تقدمك في الدرس</div><div class="progress-track"><span style="width:'+pct+'%"></span></div></div></section>'+
 '<nav class="path" aria-label="مراحل الدرس">'+LESSONS.map((m,i)=>{
 const done=list[i]?.passed,locked=list[i]?.locked,active=state.mode==="lesson"&&i===state.index;
 return '<button type="button" class="path-button '+(active?'active':done?'done':'')+'" data-action="part" data-index="'+i+'" '+
 (locked?'disabled title="اجتز المرحلة السابقة أولًا"':'')+' aria-current="'+(active?'step':'false')+'">'+
 '<span class="path-number">'+(done?'✓':i+1)+'</span><span class="path-label">'+escapeHtml((Array.isArray(window.StepStageClarity?.[lessonSlug]?.[i])&&window.StepStageClarity[lessonSlug][i][0]===state.course.sections[i]?.id?window.StepStageClarity[lessonSlug][i][1]:null)||(beginnerData().stages[lessonSlug]||[])[i]?.[0]||state.course.sections[i]?.titleAr||m.title)+'</span></button>';
 }).join("")+'</nav>';
}
// English examples, rules and arrows are always read left to right. Arabic explanations
// remain right to left. A two-field rule is NOT a three-field sentence diagram.
const arabicVisualLabel={
 "Condition":"الشرط","Result":"النتيجة","Other":"استخدامات أخرى","Negative":"النفي","Positive":"الإثبات",
 "Passive":"المبني للمجهول","Active":"المبني للمعلوم","Modal":"الفعل الناقص",
 "Verb":"الفعل","Noun":"الاسم","Adjective":"الصفة","Adverb":"الظرف","Tense":"الزمن",
 "Pattern":"التركيب","Check":"تأكد","Time":"الوقت","Past":"الماضي","Present":"المضارع",
 "Future":"المستقبل","Contrast":"التضاد","Duration":"المدة","Suggestion":"الاقتراح",
 "If":"الشرط","Sequence":"التسلسل","Meaning":"المعنى","Question":"السؤال",
 "Main clause":"جملة النتيجة","If clause":"جملة الشرط","Standard":"التركيب الأساسي",
 "Request":"طلب أو إذن","Provided":"بشرط أن","Comparison":"المقارنة",
 "Tense":"الزمن","First":"الأول","Second":"الثاني","Third":"الثالث",
 "Type":"النوع","Form":"الصيغة","Usage":"الاستخدام","Example":"المثال",
 "Answer":"الإجابة","Look":"لاحظ","Match":"التطابق","Place":"المكان",
 "Person":"الشخص","Direct":"مباشر","Indirect":"غير مباشر","Habit":"عادة",
 "Special":"حالة خاصة","Choice":"الاختيار","Why":"السبب","Core":"الأساس",
 "Rule":"القاعدة","Function":"الوظيفة","Past Simple":"الماضي البسيط",
 "will + V1":"المستقبل مع will","If + present":"جملة الشرط في المضارع",
 "Main Clause":"جملة النتيجة","If Clause":"جملة الشرط"
};
// Additional terminology used throughout the 45 Grammar skills.
Object.assign(arabicVisualLabel,{
 "Adverb / Verb":"الظرف أو الفعل","Human":"إنسان","Equality":"التساوي",
 "Ownership":"الملكية","Superlative":"التفضيل الأعلى","Comparative":"المقارنة",
 "Person":"الشخص","Thing":"الشيء","Past invert":"قلب الشرط في الماضي",
 "Future invert":"قلب الشرط للمستقبل","First":"الأول","Zero":"الشرط الصفري",
 "Variant":"صيغة بديلة","Mixed":"شرط مختلط","Adapting":"التعود التدريجي",
 "Familiar":"المعتاد","Regret":"الندم","Unreal":"افتراض غير واقعي",
 "State":"الحالة","Habit past":"عادة قديمة","Future Perfect":"المستقبل التام",
 "Present Wish":"تمنّي في الحاضر","Present Continuous":"المضارع المستمر",
 "Past Continuous":"الماضي المستمر","Duration":"المدة الزمنية",
 "Adverb / Verb":"الظرف أو الفعل","FOR":"استخدام for","TO":"استخدام to",
 "ON":"استخدام on","WH":"أدوات الاستفهام","Yes/No":"أسئلة نعم أو لا",
 "Embedded":"سؤال داخل جملة","Suggestion":"اقتراح","Purpose":"الغرض",
 "Deadline":"وقت نهائي","Enough":"الكفاية","Too":"زيادة عن الحد",
 "So...that":"النتيجة باستخدام so ... that","Prep + ing":"حرف جر + ing",
 "Verb + ing":"الفعل مع ing","Other -ing":"استخدامات أخرى لـ ing",
 "To Infinitive":"المصدر مع to","Get/Help":"أفعال المساعدة get / help",
 "Causative":"السببية","Pair":"عنصران متلازمان","Special cases":"حالات خاصة",
 "Conjunction":"أداة ربط","Sentence":"الجملة","Subject":"الفاعل",
 "Object":"المفعول به","Complement":"تكملة المعنى","Auxiliary":"الفعل المساعد",
 "Main verb":"الفعل الأساسي","Countable":"معدود","Uncountable":"غير معدود",
 "Rule":"القاعدة","Question word":"أداة الاستفهام","Time marker":"دلالة زمنية"
});
const labelArabic=(value)=>arabicVisualLabel[String(value||"").trim()]||"";
const plainText=(value)=>String(value??"").replace(/\[\[|\]\]/g,"").trim();
const isArabic=value=>/[\u0600-\u06FF]/.test(String(value||""));
function concepts(m){
 if(!Array.isArray(m.cards)||!m.cards.length)return "";
 const cards=m.cards.filter(row=>Array.isArray(row)&&row.some(x=>plainText(x)));
 if(!cards.length)return "";
 return '<h3 class="section-label">القاعدة ببساطة</h3><div class="simple-grid '+(cards.length===3?'three':'')+'">'+
 cards.map(([name,who,how,icon])=>{
  const arabic=labelArabic(name)|| (isArabic(name)?String(name):"الفكرة الأساسية");
  const english=!isArabic(name)?String(name||""):"";
  const detail=plainText(how);
  return '<div class="concept-card"><div class="concept-top">'+
   (plainText(icon)?'<span class="concept-icon" aria-hidden="true">'+escapeHtml(icon)+'</span>':"")+
   '<span class="concept-heading">'+escapeHtml(arabic)+
   (english?'<small class="concept-heading-en" dir="ltr" lang="en">'+escapeHtml(english)+'</small>':"")+
   '</span></div>'+
   (plainText(who)?'<div class="concept-formula" dir="ltr" lang="en">'+mark(who)+'</div>':"")+
   (detail?'<p dir="auto">'+mark(how)+'</p>':"")+
   '</div>';
 }).join("")+'</div>';
}
function examples(m){
 const list=Array.isArray(m.examples)?m.examples.filter(a=>Array.isArray(a)&&plainText(a[1])):[];
 if(!list.length)return "";
 return '<h3 class="section-label">شوفها في أمثلة</h3><div class="examples">'+list.map(([category,text,desc])=>
 '<div class="example"><div class="example-label"><span class="pin"></span>'+escapeHtml(category||"مثال")+'</div>'+
 '<div class="example-sentence" dir="ltr" lang="en">'+mark(text)+'</div>'+
 (plainText(desc)?'<div class="example-explain" dir="auto">'+escapeHtml(desc)+'</div>':"")+'</div>').join("")+'</div>';
}
function words(m){
 const keywords=Array.isArray(m.keywords)?m.keywords.filter(a=>Array.isArray(a)&&plainText(a[0])):[];
 return keywords.length?'<h3 class="section-label">الكلمات الدالة</h3><div class="keywords">'+keywords.map(([en,ar])=>
 '<span class="keyword"><b class="en" lang="en" dir="ltr">'+escapeHtml(en)+'</b><span dir="auto">'+escapeHtml(ar)+'</span></span>').join("")+'</div>':"";
}
function explainTable(m){
 const t=m.table;
 if(!t||!Array.isArray(t.headers)||!t.headers.length||!Array.isArray(t.rows)||!t.rows.length)return "";
 const headers=t.headers.map(h=>plainText(h));
 const rows=t.rows.filter(row=>Array.isArray(row)&&row.length===headers.length);
 if(!rows.length)return "";
 const heading=h=>labelArabic(h)||h;
 const localized=["If clause","Main clause"].every(h=>headers.includes(h));
 return '<section class="agreement-table-box" aria-label="جدول قواعد الدرس">'+
 '<h3 class="section-label">جدول للمقارنة والحفظ</h3><div class="agreement-table-scroll">'+
 '<table class="agreement-table" dir="ltr"><thead><tr>'+headers.map(h=>
 '<th dir="auto">'+escapeHtml(h==="البناء"&&localized?"نوع البناء":heading(h))+
 (labelArabic(h)?'<small class="table-heading-en" dir="ltr" lang="en">'+escapeHtml(h)+'</small>':"")+'</th>').join("")+'</tr></thead><tbody>'+
 rows.map(row=>'<tr>'+row.map((value,i)=>{
  const ar=i===0&&!isArabic(value)?labelArabic(value):"";
  const shown=ar?'<span dir="rtl" lang="ar">'+escapeHtml(ar)+'</span>'+
   '<small class="table-value-en" dir="ltr" lang="en">'+escapeHtml(value)+'</small>':
   '<span dir="'+(isArabic(value)?"rtl":"ltr")+'" lang="'+(isArabic(value)?"ar":"en")+'">'+escapeHtml(value)+'</span>';
  return '<td data-label="'+escapeHtml(heading(headers[i]))+'">'+shown+'</td>';
 }).join("")+'</tr>').join("")+
 '</tbody></table></div></section>';
}
function diagram(m){
 const rows=Array.isArray(m.formulas)?m.formulas.filter(row=>Array.isArray(row)&&row.some(x=>plainText(x))):[];
 if(!rows.length)return "";
 return '<section class="grammar-formulas" aria-label="قواعد وترتيب الجملة">'+
 '<h3 class="section-label">خريطة تكوين الجملة</h3>'+
 '<p class="formula-help">اقرأ التركيبات الإنجليزية من الشمال لليمين. شرح كل قاعدة مكتوب بالعربي تحتها.</p>'+
 '<div class="formula-list">'+rows.map(row=>{
  const parts=row.map(plainText);
  const [label,a,b,c]=parts;
  const plain=beginnerData().formulas[label];
  if(lessonSlug==="first-conditional"&&Array.isArray(plain)){
   return '<article class="agreement-flow rule-flow beginner-rule">'+
    '<div class="flow-label">'+escapeHtml(plain[0])+
    '<small dir="ltr" lang="en">'+escapeHtml(label)+'</small></div>'+
    '<div class="beginner-rule-parts">'+plain.slice(1).map(part=>
     '<div class="beginner-rule-part" dir="auto">'+escapeHtml(part)+'</div>').join("")+'</div></article>';
  }
  // Most of the bank's formulas are [rule, note]. Treat them as a full rule,
  // never as [label, subject, missing verb, missing complement].
  if(row.length<4||!b||!c){
   const hint=isArabic(a)?a:"";
   const pattern=hint?label:parts.filter(Boolean).join("  ·  ");
   const subtitle=labelArabic(label);
   return '<article class="agreement-flow rule-flow">'+
    '<div class="flow-label">'+escapeHtml(subtitle||"القاعدة والتطبيق")+
    (subtitle?'<small dir="ltr" lang="en">'+escapeHtml(label)+'</small>':"")+'</div>'+
    '<div class="flow-rule" dir="'+(isArabic(pattern)?"rtl":"ltr")+'" lang="'+(isArabic(pattern)?"ar":"en")+'">'+escapeHtml(pattern)+'</div>'+
    (hint&&hint!=="طبقها بحسب معنى الجملة"?'<div class="flow-explain" dir="rtl">'+escapeHtml(hint)+'</div>':"")+
    '</article>';
  }
  const explanation=labelArabic(label)|| (isArabic(label)?label:"تركيب الجملة");
  const names=["الجزء الأول","الجزء الثاني","الجزء الثالث"];
  return '<article class="agreement-flow"><div class="flow-label">'+escapeHtml(explanation)+
    (!isArabic(label)?'<small lang="en" dir="ltr">'+escapeHtml(label)+'</small>':"")+'</div>'+
   '<div class="flow-pieces" dir="ltr" lang="en">'+[a,b,c].map((part,i)=>
    (i?'<span class="flow-arrow" aria-hidden="true">→</span>':"")+
    '<span class="'+["flow-subject","flow-verb","flow-complement"][i]+'">'+
    '<small class="flow-piece-caption" lang="ar" dir="rtl">'+names[i]+'</small>'+
    escapeHtml(part)+'</span>').join("")+'</div></article>';
 }).join("")+'</div></section>';
}
function warningExamples(m){
 if(!m.warning||!plainText(m.warning.wrong)||!plainText(m.warning.correct))return "";
 return '<div class="tip-examples"><div class="tip-case is-wrong"><span class="tip-case-label">✕ غلط</span>'+
 '<bdi dir="ltr" lang="en">'+escapeHtml(m.warning.wrong)+'</bdi></div>'+
 '<div class="tip-case is-correct"><span class="tip-case-label">✓ صح</span>'+
 '<bdi dir="ltr" lang="en">'+escapeHtml(m.warning.correct)+'</bdi></div></div>'+
 '<p class="tip-why">'+clean(m.warning.why)+'</p>';
}
// Videos are supplementary: never block lesson navigation or grading if a provider is unavailable.
function videoSource(video){
 try{
  const url=new URL(video?.url||"");
  if(url.protocol!=="https:"||url.username||url.password)return null;
  const host=url.hostname.toLowerCase(),path=url.pathname;
  if(host==="youtube.com"||host==="www.youtube.com"||host==="m.youtube.com"||host==="youtu.be"){
   const id=host==="youtu.be"?path.split("/")[1]:path.startsWith("/shorts/")?path.split("/")[2]:url.searchParams.get("v");
   if(id&&/^[a-zA-Z0-9_-]{11}$/.test(id))return {type:"youtube",external:url.href,embed:"https://www.youtube-nocookie.com/embed/"+id+"?rel=0"};
  }
  if(host==="tiktok.com"||host==="www.tiktok.com"){
   const match=path.match(/\/video\/(\d{12,22})(?:\/|$)/)||path.match(/^\/player\/v1\/(\d{12,22})(?:\/|$)/);
   if(match)return {type:"tiktok",external:url.href,embed:"https://www.tiktok.com/player/v1/"+match[1]};
  }
  if(host==="vt.tiktok.com"||host==="vm.tiktok.com")return {type:"tiktok",external:url.href,embed:null};
 }catch(_){}
 return null;
}
function lessonVideo(m){
 const published=state.videos.find(v=>v.part_index===state.index);
 const video=published?{url:published.url,title:published.title,note:published.description}:null;
 const source=videoSource(video);
 if(!source)return '<section class="lesson-video lesson-video-pending" aria-label="مكان فيديو الشرح">'+
 '<div class="video-icon video-icon-pending" aria-hidden="true">▶</div>'+
 '<div class="video-copy"><span class="video-eyebrow">VIDEO LESSON</span>'+
 '<h3>شرح الفيديو — قريبًا</h3><p>هنضيف شرح Seify هنا لاحقًا. كمل الأمثلة والتدريبات عادي من غير فيديو.</p></div>'+
 '<span class="video-soon">قريبًا</span></section>';
 const open=source.embed&&state.openedVideo===state.index;
 return '<section class="lesson-video" aria-label="شرح الفيديو">'+
 '<div class="video-icon" aria-hidden="true">▶</div><div class="video-copy"><span class="video-eyebrow">VIDEO LESSON · '+(source.type==="tiktok"?"TIKTOK":"YOUTUBE")+'</span>'+
 '<h3>'+escapeHtml(video.title||"شوف الشرح بالفيديو")+'</h3><p>'+escapeHtml(video.note||"فيديو اختياري قبل ما تبدأ التدريب.")+'</p></div>'+
 '<div class="video-actions">'+
 (source.embed?'<button type="button" class="button video-play" data-action="video" aria-expanded="'+(open?"true":"false")+'">'+(open?"إخفاء الفيديو":"شغّل الفيديو هنا")+'</button>':"")+
 '<a class="button video-open" href="'+escapeHtml(source.external)+'" target="_blank" rel="noopener noreferrer">افتح الفيديو على '+(source.type==="tiktok"?"TikTok":"YouTube")+' ↗</a>'+
 '</div>'+
 (open?'<div class="video-frame"><iframe loading="lazy" title="'+escapeHtml(video.title||"فيديو الشرح")+'" src="'+escapeHtml(source.embed)+'" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>':"")+
 '</section>';
}
// Instructor source audits remain available in the protected admin, never in student copy.
function studentSafeExtra(extra){
 if(!extra||typeof extra!=="object"||!Array.isArray(extra.paragraphs)||!extra.paragraphs.length||!plainText(extra.heading))return false;
 const copy=[extra.heading,...extra.paragraphs].join(" ");
 return !/(?:ASGQ[A-Z0-9]+|البنك الأصلي|سجل المراجعة|مصادر الأسئلة|مصدر الأسئلة|التجميعات|المحاكي|المحاكاة|التدقيق|تدقيق|تصنيف المصدر|قيود المصدر|مصداقية بنك|مراجعة مصدرية|الأسئلة المعتمدة|تقييم المصدر)/i.test(copy);
}

const beginnerData=()=>window.StepBeginnerTeaching||{lessons:{},stages:{},formulas:{}};
const reviewedStage=()=>{
 const row=window.StepStageClarity?.[lessonSlug]?.[state.index];
 // Do not mislabel content if the published curriculum is ever reordered.
 if(!Array.isArray(row)||row.length!==7||row[0]!==state.course?.sections?.[state.index]?.id||
    !Array.isArray(row[3])||row[3].length!==3||!Array.isArray(row[6]))return null;
 return row;
};
const beginnerTerms=[
 [/present\s+simple/i,"present simple","المضارع البسيط: عادة أو حقيقة، والفعل غالبًا مصدر مع I/you/we/they"],
 [/past\s+simple/i,"past simple","الماضي البسيط: حدث انتهى في الماضي"],
 [/\bV1\b/i,"V1","المصدر: شكل الفعل الأساسي، زي play أو go"],
 [/\bV2\b/i,"V2","التصريف الثاني: ماضي الفعل، زي went"],
 [/\bV3\b/i,"V3","التصريف الثالث: زي gone أو played"],
 [/\bing\b/i,"-ing","نهاية بنضيفها للفعل في التراكيب المستمرة وبعض التراكيب الأخرى"],
 [/\bwill\b/i,"will","غالبًا علامة مستقبل، وبعدها الفعل في المصدر"],
 [/\bif\b/i,"if","أداة الشرط: معناها لو أو إذا"]
];
function beginnerTeaching(){
 const entry=beginnerData().lessons[lessonSlug];if(!Array.isArray(entry)||entry.length!==5)return "";
 const [meaning,structure,example,translation,tip]=entry;
 const review=reviewedStage();
 const stage=review?[review[1],review[2],...review[3].map(([en,ar])=>en+" = "+ar),review[4],review[5]]:beginnerData().stages[lessonSlug]?.[state.index];
 const terms=[structure,stage?.[1]||"",LESSONS[state.index]?.title||"",LESSONS[state.index]?.detail||"",...(LESSONS[state.index]?.formulas||[]).map(row=>row[0]||"")].join(" ");
 const activeTerms=beginnerTerms.filter(([match])=>match.test(terms)).slice(0,5);
 return '<section class="beginner-help" aria-label="شرح مبسط للمبتدئين">'+
  '<div class="beginner-head"><span class="beginner-icon" aria-hidden="true">★</span><div><h3>افهمها بالعربي الأول</h3>'+
  '<p>بص على المعنى وشكل الجملة قبل الحفظ.</p></div></div>'+
  '<div class="beginner-meaning"><strong>بنتعلم إيه وليه؟</strong><p>'+escapeHtml(meaning)+'</p></div>'+
  (stage?'<div class="beginner-stage"><strong>'+escapeHtml(stage[0])+'</strong>'+
    '<p>'+escapeHtml(stage[1])+'</p>'+
    '<div class="beginner-parts" dir="ltr">'+stage.slice(2,5).map((part,i)=>'<span class="beginner-part">'+
    '<small lang="ar" dir="rtl">'+(review?escapeHtml(review[3][i][1]):["الجزء الأول","الجزء الثاني","الجزء الثالث"][i])+'</small>'+
    (review?'<span dir="ltr" lang="en">'+escapeHtml(review[3][i][0])+'</span>':
      '<span dir="auto">'+escapeHtml(part)+'</span>')+'</span>').join("")+'</div></div>':"")+
  '<div class="beginner-structure"><strong>شكل الجملة ببساطة</strong>'+
  '<div class="beginner-pattern" dir="'+(review?"ltr":/^[^A-Za-z]*[\u0600-\u06FF]/.test(structure)?"rtl":"ltr")+'">'+escapeHtml(review?review[3].map(p=>p[0]).join("  →  "):structure)+'</div></div>'+
  '<div class="beginner-example"><strong>مثال واضح</strong><p class="beginner-english" dir="ltr" lang="en">'+
    escapeHtml(stage?.[5]||example)+'</p><p class="beginner-arabic" dir="rtl">'+
    escapeHtml(stage?.[6]||translation)+'</p></div>'+
  '<p class="beginner-reminder"><strong>خد بالك:</strong> '+escapeHtml(tip)+'</p>'+
  (review?'<div class="beginner-check" aria-label="تدريب فهم سريع">'+
     '<strong>فكّر قبل ما تحل أسئلة المرحلة</strong><p>'+escapeHtml(review[6][0])+'</p>'+
     '<details><summary>اكشف الإجابة واشرح السبب</summary>'+
     '<p class="beginner-check-answer" dir="auto"><strong>الإجابة: </strong>'+escapeHtml(review[6][1])+'</p>'+
     '<p class="beginner-check-why">'+escapeHtml(review[6][2])+'</p></details></div>':"")+
  (activeTerms.length?'<details class="beginner-glossary"><summary>الرموز الإنجليزية دي معناها إيه؟</summary>'+
    '<dl>'+activeTerms.map(([,name,description])=>'<div><dt dir="ltr" lang="en">'+escapeHtml(name)+
    '</dt><dd>'+escapeHtml(description)+'</dd></div>').join("")+'</dl></details>':"")+
  '</section>';
}

function chapter(){
 const m=LESSONS[state.index],number=state.index+1;
 return '<div class="lesson-inner"><div class="eyebrow">المرحلة '+number+' من '+LESSONS.length+'</div>'+
 '<h2 class="lesson-title">'+escapeHtml(m.title)+'</h2>'+beginnerTeaching()+'<p class="explain">'+mark(m.detail)+'</p>'+
 concepts(m)+diagram(m)+explainTable(m)+words(m)+examples(m)+
 lessonVideo(m)+
 '<div class="tip"><strong>خد بالك:</strong> '+mark(m.tip)+warningExamples(m)+'</div>'+
 (studentSafeExtra(m.extra)?'<details class="optional"><summary>'+escapeHtml(m.extra.heading)+'</summary><div class="optional-content">'+m.extra.paragraphs.map(p=>'<p>'+escapeHtml(p)+'</p>').join("")+'</div></details>':'')+
'<div class="chapter-footer">'+(number>1?'<button class="button secondary" data-action="part" data-index="'+(number-2)+'">المرحلة السابقة</button>':'<span></span>')+
 '<button class="button green" data-action="practice">جاهز؟ حل تدريبات المرحلة ↓</button></div></div>';
}
function question(q,i,result){
 const chosen=state.answers[q.id],feedback=result?.results?.find(x=>x.id===q.id);
 const selectedValue=feedback&&q.options?.[feedback.selected],correctValue=feedback&&q.options?.[feedback.correct];
 return '<article class="question"><div class="q-number">QUESTION '+String(i+1).padStart(2,"0")+'</div>'+
 '<h4 class="q-text" dir="ltr" lang="en">'+escapeHtml(q.text)+'</h4><div class="q-answers" dir="ltr">'+ABC.map(code=>{
 const value=q.options?.[code];if(value===undefined)return "";
 const tone=feedback?(code===feedback.correct?'good':code===feedback.selected?'bad':''):chosen===code?'chosen':'';
 return '<button type="button" class="q-answer '+tone+'" data-action="answer" data-index="'+i+'" data-value="'+code+'" '+(feedback?'disabled':'')+'>'+
 '<span class="letter">'+code+'</span><span dir="auto">'+escapeHtml(value)+'</span></button>';
 }).join("")+'</div>'+
 (feedback?'<div class="answer-feedback '+(feedback.isCorrect?'is-correct':'is-wrong')+'" role="status">'+
 '<strong>'+(feedback.isCorrect?'✓ إجابة صحيحة':'✕ إجابة غير صحيحة')+'</strong>'+
 (feedback.isCorrect?'':'<p class="feedback-why"><b>ليه اختيارك غلط؟</b> <span class="selected-choice">'+
 escapeHtml(feedback.selected)+' — <bdi dir="auto">'+escapeHtml(selectedValue??"")+'</bdi></span> · '+
 clean(feedback.wrongReason||"الاختيار ده مش مناسب للقاعدة المطلوبة في الجملة.")+'</p>'+
 '<p class="feedback-correct"><b>الإجابة الصحيحة:</b> <span class="correct-choice">'+
 escapeHtml(feedback.correct)+' — <bdi dir="auto">'+escapeHtml(correctValue??"")+'</bdi></span></p>')+
 '<p class="feedback-explain"><b>ليه دي صح؟</b> '+clean(feedback.explanation||"راجع القاعدة المرتبطة بالسؤال.")+'</p>'+
  (feedback.wrongReasons&&Object.keys(feedback.wrongReasons).length?
   '<details class="feedback-distractors"><summary>ليه باقي الاختيارات غلط؟</summary><ul>'+
   ABC.filter(code=>code!==feedback.correct).map(code=>
    '<li><bdi dir="ltr" lang="en">'+code+' — '+escapeHtml(q.options?.[code]||"")+'</bdi><span>'+
    clean(feedback.wrongReasons[code]||"غير مناسب للقاعدة في السؤال.")+'</span></li>'
   ).join("")+'</ul></details>':"")+
  '</div>':'')+'</article>';
}
function practice(){
 const p=state.part,r=state.graded;
 return '<section id="practice" class="practice"><div class="practice-head"><div><div class="eyebrow">PRACTICE</div>'+
 '<h3 class="practice-title">دلوقتي دورك</h3><p>حل الأسئلة، واعرف سبب كل إجابة بعد التصحيح.</p></div><span class="practice-count">'+p.questions.length+' أسئلة</span></div>'+
 (r?'<div class="score '+(r.passed?'':'needs-work')+'" role="status"><strong>'+
 (r.passed?'✓ أحسنت! نجحت في المرحلة.':'قربت! راجع التصحيح وحاول تاني.')+'</strong>'+
 '<p>درجتك '+r.correctCount+' من '+r.total+' · المطلوب '+p.passRequired+' إجابات صحيحة.</p></div>':'')+
 p.questions.map((q,i)=>question(q,i,r)).join("")+
 '<div class="practice-actions"><span class="practice-hint">'+(r?'شوف سبب كل إجابة فوق قبل ما تكمل.':'اختار إجابة واحدة لكل سؤال.')+'</span>'+
 (r?'<div class="practice-actions"><button class="button secondary" data-action="retry">حل مرة تانية</button>'+
 (r.passed?'<button class="button green" data-action="continue">'+(state.index===LESSONS.length-1?'اختبار الإتقان':'المرحلة التالية')+' ←</button>':'')+'</div>':
 '<button class="button" id="submit-practice" data-action="submit" '+(p.questions.some(q=>!state.answers[q.id])?'disabled':'')+'>صحّح إجاباتي ←</button>')+
 '</div></section>';
}
function examBanner(){
 const ready=state.course.completed;
 return '<section class="end-card"><div class="eyebrow">THE FINAL STEP</div><h2>اختبار الإتقان</h2>'+
 '<p>'+(ready?'جاهز تتأكد إنك فهمت القاعدة؟ نتيجتك هتتحفظ في حسابك.':'اختبار الإتقان بيتفتح بعد اجتياز جميع مراحل الدرس.')+'</p>'+
 '<button class="button '+(ready?'green':'secondary')+'" data-action="exam" '+(ready?'':'disabled')+'>ابدأ الاختبار ←</button></section>';
}
function examView(){
 const f=state.examResult;
 return '<section class="lesson"><div class="lesson-inner"><div class="eyebrow">FINAL ASSESSMENT</div>'+
 '<h2 class="lesson-title">اختبار الإتقان</h2><p class="explain">اقرأ السياق كويس، واختار الصيغة الصحيحة، وبعد التصحيح راجع سبب كل إجابة.</p>'+
 '<div class="exam-clock" role="timer" aria-live="off"><span>⏱ زمن الاختبار</span>'+
 '<strong id="exam-elapsed">'+timeLabel(state.examResult?.elapsedMs??elapsedMs())+'</strong>'+
 '<small>عداد تصاعدي مش حد زمني. الوقت تقديري ويتوقف لما تسيب التبويب.</small></div>'+
 (f?'<div class="score" role="status"><strong>نتيجتك: '+f.result.score+' من '+f.result.total+'</strong>'+
 '<p>'+f.result.percentage+'% · النتيجة محفوظة في حسابك.</p></div>':'')+
 state.exam.questions.map((q,i)=>question(q,i,f)).join("")+
 '<div class="practice-actions"><button class="button secondary" data-action="part" data-index="0">مراجعة الدرس</button>'+
 (f?'<button class="button green" data-action="exam">اختبار جديد ↻</button>':
 '<button class="button" id="submit-practice" data-action="submit-exam" '+(state.exam.questions.some(q=>!state.answers[q.id])?'disabled':'')+'>صحّح الاختبار ←</button>')+
 '</div></div></section>';
}
function draw(){
 if(!state.course||!state.part)return;
 root.innerHTML=renderLessonHeader()+(state.mode==="exam"?examView():'<article class="lesson">'+chapter()+practice()+'</article>'+examBanner())+
 '<div class="site-foot">STEP with Seify</div>';
 monitorPracticeStart();
}
async function submit(isExam){
 if(state.busy)return;
 const questions=isExam?state.exam.questions:state.part.questions;
 if(questions.some(q=>!state.answers[q.id]))return;
 state.busy=true;
 const button=document.getElementById("submit-practice");
 if(button){button.disabled=true;button.textContent="بنصحّح إجاباتك…";}
 try{
  const timings=Object.fromEntries(questions.map(q=>[q.id,{
   ms:Math.min(3600000,Math.max(0,state.timing?.perQuestion[q.id]||0)),
   changes:Math.min(100,state.timing?.changes[q.id]||0)}]));
  const elapsedBeforeSubmit=elapsedMs();
  const d=await api(isExam?"/exam/submit":"/parts/"+state.index+"/submit",{answers:state.answers,timings});
  if(isExam)d.elapsedMs=elapsedBeforeSubmit;
  if(isExam){state.examResult=d;state.course=d.progress;}else{state.graded=d;state.course=d.progress;}
  draw();document.getElementById(isExam?"lesson-root":"practice")?.scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){alert(e.message);if(button){button.disabled=false;button.textContent="صحّح إجاباتي ←";}}
 finally{state.busy=false;}
}
async function openExam(){
 if(!state.course?.completed||state.busy)return;
 state.busy=true;loading("بنجهز اختبار الإتقان…");
 try{state.exam=await api("/exam");state.mode="exam";state.examResult=null;state.answers={};state.timing=newTiming(true);draw();window.scrollTo({top:0,behavior:"smooth"});}
 catch(e){fail(e);}
 finally{state.busy=false;}
}
root.addEventListener("click",async ev=>{
 const b=ev.target.closest("button[data-action]");
 if(!b||b.disabled)return;
 const action=b.dataset.action,n=Number(b.dataset.index);
 if(action==="reload"){init();return;}
 if(action==="part"){await openPart(n);return;}
 if(action==="practice"){if(state.timing?.lastAction===null)state.timing.lastAction=performance.now();document.getElementById("practice")?.scrollIntoView({behavior:"smooth"});return;}
 if(action==="video"){
  if(!videoSource(state.videos.find(v=>v.part_index===state.index))?.embed)return;
  state.openedVideo=state.openedVideo===state.index?null:state.index;
  draw();document.querySelector(".lesson-video")?.scrollIntoView({behavior:"smooth",block:"nearest"});return;
 }
 if(action==="answer"){
  const qs=state.mode==="exam"?state.exam.questions:state.part.questions;
  if((state.mode==="exam"?state.examResult:state.graded)||!qs[n])return;
  recordAnswerTime(qs[n].id,Boolean(state.answers[qs[n].id]));
  state.answers[qs[n].id]=b.dataset.value;draw();return;
 }
 if(action==="retry"){state.answers={};state.graded=null;state.timing=newTiming();draw();document.getElementById("practice")?.scrollIntoView({behavior:"smooth"});return;}
 if(action==="continue"){if(state.index===LESSONS.length-1)await openExam();else await openPart(state.index+1);return;}
 if(action==="submit"){await submit(false);return;}
 if(action==="submit-exam"){await submit(true);return;}
 if(action==="exam"){await openExam();}
});
init();