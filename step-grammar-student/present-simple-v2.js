"use strict";
const LESSONS=window.PRESENT_SIMPLE_UNITS;
const ABC=["A","B","C","D"];
const state={course:null,part:null,index:0,answers:{},graded:null,quick:{},mode:"lesson",exam:null,examResult:null,busy:false};
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
 const r=await fetch(projectUrl+"/functions/v1/step-course"+path,{
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
  const requested=new URLSearchParams(location.search).get("step");
  const n=requested===null?NaN:Number(requested);
  const ix=Number.isInteger(n)&&n>=0&&n<6&&!state.course.sections[n]?.locked?n:state.course.nextIndex;
  await openPart(Math.min(5,Math.max(0,ix)),false);
 }catch(e){fail(e);}
}
async function openPart(i,scroll=true){
 if(state.busy||state.course?.sections?.[i]?.locked)return;
 state.busy=true;loading();
 try{
  const d=await api("/parts/"+i);
  state.course=d.progress;state.part=d.part;state.index=i;state.answers={};state.graded=null;
  state.mode="lesson";state.exam=null;state.examResult=null;
  draw();if(scroll)window.scrollTo({top:0,behavior:"smooth"});
 }catch(e){fail(e);}
 finally{state.busy=false;}
}
function renderLessonHeader(){
 const list=state.course.sections,passed=list.filter(s=>s.passed).length,pct=Math.round(passed/list.length*100);
 return '<section class="hero"><div><div class="kicker">STEP · GRAMMAR</div><h1>Present Simple</h1><p class="lead">افهم الفكرة ببساطة، شوف مثال، وجرب بنفسك.</p></div>'+
 '<div class="progress-block"><div class="progress-number">'+pct+'%</div><div class="progress-caption">تقدمك في الدرس</div><div class="progress-track"><span style="width:'+pct+'%"></span></div></div></section>'+
 '<nav class="path" aria-label="مراحل الدرس">'+LESSONS.map((m,i)=>{
 const done=list[i]?.passed,locked=list[i]?.locked,active=state.mode==="lesson"&&i===state.index;
 return '<button type="button" class="path-button '+(active?'active':done?'done':'')+'" data-action="part" data-index="'+i+'" '+
 (locked?'disabled title="اجتز المرحلة السابقة أولًا"':'')+' aria-current="'+(active?'step':'false')+'">'+
 '<span class="path-number">'+(done?'✓':i+1)+'</span><span class="path-label">'+escapeHtml(m.title)+'</span></button>';
 }).join("")+'</nav>';
}
function concepts(m){
 if(!m.cards?.length)return "";
 return '<h3 class="section-label">القاعدة ببساطة</h3><div class="simple-grid '+(m.cards.length===3?'three':'')+'">'+
 m.cards.map(([name,who,how,icon])=>'<div class="concept-card"><div class="concept-top"><span class="concept-icon" aria-hidden="true">'+escapeHtml(icon)+'</span>'+
 '<span class="concept-heading">'+escapeHtml(name)+'</span></div><div class="concept-formula">'+mark(who)+'</div><p>'+mark(how)+'</p></div>').join("")+'</div>';
}
function examples(m){
 return '<h3 class="section-label">شوفها في أمثلة</h3><div class="examples">'+m.examples.map(([category,text,desc])=>
 '<div class="example"><div class="example-label"><span class="pin"></span>'+escapeHtml(category)+'</div>'+
 '<div class="example-sentence" lang="en">'+mark(text)+'</div><div class="example-explain">'+escapeHtml(desc)+'</div></div>').join("")+'</div>';
}
function words(m){
 return m.keywords?'<h3 class="section-label">الكلمات الدالة</h3><div class="keywords">'+m.keywords.map(([en,ar])=>
 '<span class="keyword"><b class="en" lang="en">'+escapeHtml(en)+'</b><span>'+escapeHtml(ar)+'</span></span>').join("")+'</div>':'';
}
function quick(m){
 const picked=state.quick[state.index],done=picked!==undefined,correct=picked===m.quick.correct;
 const correctValue=m.quick.choices[m.quick.correct],letter=ABC[m.quick.correct];
 return '<section class="check"><div class="check-head">جرّبها بنفسك <span class="chip">QUICK CHECK</span></div>'+
 '<div class="check-desc" dir="ltr" lang="en">'+mark(m.quick.q)+'</div><div class="check-options" dir="ltr">'+m.quick.choices.map((v,i)=>
 '<button type="button" class="check-option '+(done?(i===m.quick.correct?'correct':i===picked?'incorrect':''):'')+
 '" data-action="mini" data-index="'+i+'" '+(done?'disabled':'')+'><span class="option-letter">'+ABC[i]+'</span><span dir="auto">'+escapeHtml(v)+'</span></button>').join("")+'</div>'+
 (done?'<div class="check-result '+(correct?'is-correct':'is-wrong')+'" role="status"><strong>'+
 (correct?'✓ إجابة صحيحة':'✕ إجابة غير صحيحة')+'</strong>'+
 (correct?'':'<p class="feedback-why"><b>ليه اختيارك غلط؟</b> '+clean(m.quick.wrongWhy?.[picked]||"الاختيار ده مش مناسب لمعنى الجملة.")+'</p>'+
 '<p class="feedback-correct"><b>الإجابة الصحيحة:</b> <span class="correct-choice">'+letter+' — <bdi dir="auto">'+escapeHtml(correctValue)+'</bdi></span></p>')+
 '<p class="feedback-explain"><b>ليه دي صح؟</b> '+clean(m.quick.why)+'</p></div>':'')+'</section>';
}
function warningExamples(m){
 if(!m.warning)return "";
 return '<div class="tip-examples"><div class="tip-case is-wrong"><span class="tip-case-label">✕ غلط</span>'+
 '<bdi dir="ltr" lang="en">'+escapeHtml(m.warning.wrong)+'</bdi></div>'+
 '<div class="tip-case is-correct"><span class="tip-case-label">✓ صح</span>'+
 '<bdi dir="ltr" lang="en">'+escapeHtml(m.warning.correct)+'</bdi></div></div>'+
 '<p class="tip-why">'+clean(m.warning.why)+'</p>';
}
function chapter(){
 const m=LESSONS[state.index],number=state.index+1;
 return '<div class="lesson-inner"><div class="eyebrow">المرحلة '+number+' من '+LESSONS.length+'</div>'+
 '<h2 class="lesson-title">'+escapeHtml(m.title)+'</h2><p class="explain">'+mark(m.detail)+'</p>'+
 concepts(m)+words(m)+examples(m)+
 '<div class="tip"><strong>خد بالك:</strong> '+mark(m.tip)+warningExamples(m)+'</div>'+
 (m.extra?'<details class="optional"><summary>'+escapeHtml(m.extra.heading)+'</summary><div class="optional-content">'+m.extra.paragraphs.map(p=>'<p>'+escapeHtml(p)+'</p>').join("")+'</div></details>':'')+
 quick(m)+'<div class="chapter-footer">'+(number>1?'<button class="button secondary" data-action="part" data-index="'+(number-2)+'">المرحلة السابقة</button>':'<span></span>')+
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
 '<p class="feedback-explain"><b>ليه دي صح؟</b> '+clean(feedback.explanation||"راجع القاعدة المرتبطة بالسؤال.")+'</p></div>':'')+'</article>';
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
 (r.passed?'<button class="button green" data-action="continue">'+(state.index===5?'اختبار الإتقان':'المرحلة التالية')+' ←</button>':'')+'</div>':
 '<button class="button" id="submit-practice" data-action="submit" '+(p.questions.some(q=>!state.answers[q.id])?'disabled':'')+'>صحّح إجاباتي ←</button>')+
 '</div></section>';
}
function examBanner(){
 const ready=state.course.completed;
 return '<section class="end-card"><div class="eyebrow">THE FINAL STEP</div><h2>اختبار الإتقان</h2>'+
 '<p>'+(ready?'جاهز تتأكد إنك فهمت القاعدة؟ نتيجتك هتتحفظ في حسابك.':'اختبار الإتقان بيتفتح بعد اجتياز المراحل الستة.')+'</p>'+
 '<button class="button '+(ready?'green':'secondary')+'" data-action="exam" '+(ready?'':'disabled')+'>ابدأ الاختبار ←</button></section>';
}
function examView(){
 const f=state.examResult;
 return '<section class="lesson"><div class="lesson-inner"><div class="eyebrow">FINAL ASSESSMENT</div>'+
 '<h2 class="lesson-title">اختبار الإتقان</h2><p class="explain">فكّر في معنى الجملة، وحدد الفاعل، وبعدين اختار.</p>'+
 (f?'<div class="score" role="status"><strong>نتيجتك: '+f.result.score+' من '+f.result.total+'</strong>'+
 '<p>'+f.result.percentage+'% · النتيجة محفوظة في حسابك.</p></div>':'')+
 state.exam.questions.map((q,i)=>question(q,i,f)).join("")+
 '<div class="practice-actions"><button class="button secondary" data-action="part" data-index="5">مراجعة الدرس</button>'+
 (f?'<button class="button green" data-action="exam">اختبار جديد ↻</button>':
 '<button class="button" id="submit-practice" data-action="submit-exam" '+(state.exam.questions.some(q=>!state.answers[q.id])?'disabled':'')+'>صحّح الاختبار ←</button>')+
 '</div></div></section>';
}
function draw(){
 if(!state.course||!state.part)return;
 root.innerHTML=renderLessonHeader()+(state.mode==="exam"?examView():'<article class="lesson">'+chapter()+practice()+'</article>'+examBanner())+
 '<div class="site-foot">QUDRAT · STEP ENGLISH MASTERY</div>';
}
async function submit(isExam){
 if(state.busy)return;
 const questions=isExam?state.exam.questions:state.part.questions;
 if(questions.some(q=>!state.answers[q.id]))return;
 state.busy=true;
 const button=document.getElementById("submit-practice");
 if(button){button.disabled=true;button.textContent="بنصحّح إجاباتك…";}
 try{
  const d=await api(isExam?"/exam/submit":"/parts/"+state.index+"/submit",{answers:state.answers});
  if(isExam){state.examResult=d;state.course=d.progress;}else{state.graded=d;state.course=d.progress;}
  draw();document.getElementById(isExam?"lesson-root":"practice")?.scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){alert(e.message);if(button){button.disabled=false;button.textContent="صحّح إجاباتي ←";}}
 finally{state.busy=false;}
}
async function openExam(){
 if(!state.course?.completed||state.busy)return;
 state.busy=true;loading("بنجهز اختبار الإتقان…");
 try{state.exam=await api("/exam");state.mode="exam";state.examResult=null;state.answers={};draw();window.scrollTo({top:0,behavior:"smooth"});}
 catch(e){fail(e);}
 finally{state.busy=false;}
}
root.addEventListener("click",async ev=>{
 const b=ev.target.closest("button[data-action]");
 if(!b||b.disabled)return;
 const action=b.dataset.action,n=Number(b.dataset.index);
 if(action==="reload"){init();return;}
 if(action==="part"){await openPart(n);return;}
 if(action==="practice"){document.getElementById("practice")?.scrollIntoView({behavior:"smooth"});return;}
 if(action==="mini"){state.quick[state.index]=n;draw();document.querySelector(".check")?.scrollIntoView({behavior:"smooth",block:"nearest"});return;}
 if(action==="answer"){
  const qs=state.mode==="exam"?state.exam.questions:state.part.questions;
  if((state.mode==="exam"?state.examResult:state.graded)||!qs[n])return;
  state.answers[qs[n].id]=b.dataset.value;draw();return;
 }
 if(action==="retry"){state.answers={};state.graded=null;draw();document.getElementById("practice")?.scrollIntoView({behavior:"smooth"});return;}
 if(action==="continue"){if(state.index===5)await openExam();else await openPart(state.index+1);return;}
 if(action==="submit"){await submit(false);return;}
 if(action==="submit-exam"){await submit(true);return;}
 if(action==="exam"){await openExam();}
});
init();