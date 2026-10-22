"use strict";
(() => {
 const stages=window.STEP_FOUNDATION_STAGES;
 const mastery=window.STEP_FOUNDATION_MASTERY||{};
 const root=document.getElementById("foundation-root");
 if(!root||!Array.isArray(stages)||stages.length!==7){
  if(root)root.textContent="تعذر تحميل الدرس التأسيسي. حدّث الصفحة وجرب مرة تانية.";
  return;
 }
 const KEY="step-with-seify-foundation-private-v3",ABC=["A","B","C","D"];
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let answers={};
 try{
  const stored=JSON.parse(localStorage.getItem(KEY)||"{}");
  if(stored&&typeof stored==="object"&&!Array.isArray(stored))answers=stored;
 }catch{answers={}}
 const n=Number(new URLSearchParams(location.search).get("stage"));
 let current=Number.isInteger(n)&&n>=0&&n<stages.length?n:0;
 const total=stages.reduce((n,s)=>n+s.checks.length,0);
 const id=(index,q)=>stages[index].id+"#"+q;
 const isValid=(stageIndex,qi,choice)=>Number.isInteger(choice)&&choice>=0&&choice<stages[stageIndex].checks[qi].choices.length;
 function selected(stageIndex,qi){
  const value=answers[id(stageIndex,qi)];
  return isValid(stageIndex,qi,value)?value:null;
 }
 function count(stageIndex){
  return stages[stageIndex].checks.filter((_,q)=>selected(stageIndex,q)!==null).length;
 }
 function allCount(){return stages.reduce((sum,_,i)=>sum+count(i),0)}
 function store(){
  try{localStorage.setItem(KEY,JSON.stringify(answers));}catch{}
 }
 function progress(){
  const completed=allCount(),pct=Math.round(completed/total*100);
  return '<div class="progress-box"><strong>تقدمك في التدريب: '+completed+' من '+total+'</strong>'+
   '<div class="progress-track" role="progressbar" aria-valuenow="'+completed+'" aria-valuemin="0" aria-valuemax="'+total+'" aria-label="أسئلة التدريب اللي اتجاوبت"><span style="width:'+pct+'%"></span></div>'+
   '<small>'+pct+'% · محفوظ على الجهاز ده فقط</small></div>';
 }
 function side(){
  return '<aside class="sidebar" aria-label="محطات التأسيس"><h2>رحلة التأسيس · 7 محطات</h2>'+
   '<nav class="side-list">'+stages.map((m,i)=>{
    const done=m.checks.length>0&&count(i)===m.checks.length;
    return '<button type="button" class="stage-link '+(i===current?"active ":"")+(done?"done":"")+
      '" data-stage="'+i+'" '+(i===current?'aria-current="step"':'')+'>'+
      '<span class="stage-n">'+(done?"✓":i+1)+'</span><span>'+esc(m.title)+
      '<small>'+(m.checks.length?count(i)+' / '+m.checks.length+' أسئلة تدريب':'الشرح متاح')+'</small></span></button>';
   }).join("")+'</nav>'+
   '<div class="sidebar-note">الهدف إنك تفهم قبل ما تحفظ. مفيش وقت محدد ولا رسوب في التدريب ده.</div></aside>';
 }
 function mapCell(row){
  // Arabic explanation leads; English terminology and examples remain directionally isolated.
  return '<article class="map-cell" dir="rtl">'+
   '<div class="map-top"><span class="map-code" dir="ltr">'+esc(row[0])+'</span>'+
   '<div class="map-term"><h3 class="map-title">'+esc(row[2])+'</h3>'+
   '<span class="map-en" dir="ltr" lang="en">'+esc(row[1])+'</span></div></div>'+
   '<p class="map-ar">'+esc(row[3])+'</p>'+
   '<div class="map-example"><span class="map-example-label">مثال بالإنجليزي</span>'+
   '<div class="map-example-en" dir="ltr" lang="en">'+esc(row[4])+'</div></div></article>';
 }
 function teachText(value){
  // Instructor text supports highlighted keywords only, not arbitrary HTML.
  return String(value||"").split(new RegExp("(<mark>.*?</mark>)","g")).map(part=>
   part.startsWith("<mark>")&&part.endsWith("</mark>")?
    '<mark class="teaching-highlight">'+esc(part.slice(6,-7))+'</mark>':esc(part)).join("");
 }
 function sentence(tokens){
  if(!Array.isArray(tokens))return "";
  return '<div class="model-sentence" dir="ltr" lang="en" aria-label="الجملة الإنجليزية بالألوان">'+
   tokens.map(([role,word],i)=>{
    const known=["subject","main","link","aux","modal","neg","object","complement","time","punct"].includes(role)?role:"time";
    return (i&&role!=="punct"?" ":"")+'<span class="word role-'+known+'">'+esc(word)+'</span>';
   }).join("")+'</div>';
 }
 function formula(pattern){
  return '<article class="pattern-card"><h4>'+esc(pattern.title)+'</h4>'+
   '<div class="formula-flow" dir="ltr">'+pattern.parts.map(([role,en,ar],i)=>
    (i?'<span class="formula-plus" aria-hidden="true">+</span>':"")+
    '<div class="formula-piece role-'+esc(role)+'"><strong dir="ltr" lang="en">'+esc(en)+'</strong>'+
    '<small dir="rtl">'+esc(ar)+'</small></div>').join("")+'</div>'+
   sentence(pattern.tokens)+'<p>'+esc(pattern.note)+'</p></article>';
 }
 function teachingTable(data){
  if(!data)return "";
  return '<section class="reference-block"><h3>'+esc(data.title)+'</h3>'+
   '<div class="table-wrap"><table class="teaching-table"><thead><tr>'+
   data.headers.map(head=>'<th scope="col" dir="rtl">'+esc(head)+'</th>').join("")+'</tr></thead><tbody>'+
   data.rows.map(row=>'<tr>'+row.map((cell,i)=>{
    const parts=String(cell).split(" — ");
    const value=parts.length===2&&/[A-Za-z]/.test(parts[0])?
     '<span class="table-english" dir="ltr" lang="en">'+esc(parts[0])+'</span>'+
      '<span class="table-arabic" dir="rtl">'+esc(parts[1])+'</span>':
     '<span class="table-value" dir="auto">'+esc(cell)+'</span>';
    return '<td data-label="'+esc(data.headers[i])+'">'+value+'</td>';
   }).join("")+'</tr>').join("")+'</tbody></table></div></section>';
 }
 function contrasts(pitfalls){
  if(!pitfalls?.length)return "";
  return '<section class="reference-block"><h3>قارن بين الغلط والصح</h3><div class="contrast-list">'+
   pitfalls.map(item=>'<article class="contrast-card">'+
    '<div class="contrast-examples"><div class="contrast-case is-wrong"><b>✕ غلط</b>'+sentence(item.bad)+'</div>'+
    '<div class="contrast-case is-correct"><b>✓ صح</b>'+sentence(item.good)+'</div></div>'+
    '<p>'+esc(item.why)+'</p></article>').join("")+'</div></section>';
 }
 function deepDive(m){
  const d=mastery[m.id];if(!d)return "";
  return '<section class="panel mastery-panel" aria-label="شرح وتطبيق متقدم">'+
   '<div class="mastery-heading"><span class="eyebrow">UNDERSTAND THE RULE</span>'+
   '<h2 class="subhead">افهمها بنفسك — خطوة بخطوة</h2><p>'+esc(d.goal)+'</p></div>'+
   '<div class="color-legend" aria-label="دليل الألوان">'+
    '<span><i class="legend-dot role-subject"></i> الفاعل</span>'+
    '<span><i class="legend-dot role-link"></i> فعل ربط أساسي</span>'+ '<span><i class="legend-dot role-aux"></i> الفعل المساعد</span>'+
    '<span><i class="legend-dot role-main"></i> الفعل الأساسي</span>'+
    '<span><i class="legend-dot role-neg"></i> النفي</span>'+
    '<span><i class="legend-dot role-modal"></i> الفعل الناقص</span>'+
    '<span><i class="legend-dot role-object"></i> تكملة الجملة</span></div>'+
   '<div class="teaching-cards">'+d.cards.map((card,i)=>
    '<article class="teaching-card"><span class="teaching-num">'+String(i+1).padStart(2,"0")+'</span>'+
    '<h3>'+esc(card.title)+'</h3><p>'+teachText(card.body)+'</p>'+
    sentence(card.tokens)+'<small>'+esc(card.detail)+'</small></article>').join("")+'</div>'+
   '<section class="reference-block"><h3>تركيب الجملة من الشمال لليمين</h3>'+
   '<p class="formula-intro">اقرأ الترتيب الإنجليزي من <b>الشمال لليمين</b>، والشرح العربي تحت كل جزء.</p>'+
   '<div class="pattern-list">'+d.patterns.map(formula).join("")+'</div></section>'+
   teachingTable(d.table)+
   (d.modal?'<section class="modal-deep"><h3>'+esc(d.modal.title)+'</h3>'+
    '<p>'+esc(d.modal.intro)+'</p>'+teachingTable({title:"معاني الأفعال الناقصة واستخدامها",headers:d.modal.headers,rows:d.modal.rows})+
    '<div class="modal-rules">'+d.modal.rules.map((rule,i)=>'<div><span>'+String(i+1).padStart(2,"0")+'</span><p>'+esc(rule)+'</p></div>').join("")+'</div></section>':"")+
   contrasts(d.pitfalls)+'</section>';
 }
 function examples(m){
  return '<section class="panel" aria-labelledby="examples-title"><h2 class="subhead" id="examples-title">شوف أمثلة واضحة</h2>'+
   '<div class="example-grid">'+m.examples.map(ex=>
    '<article class="example-card"><span class="example-label">'+esc(ex[0])+'</span>'+
    '<div class="example-en" lang="en">'+esc(ex[1])+'</div><p class="example-reason">'+esc(ex[2])+'</p></article>'
   ).join("")+'</div></section>';
 }
 function feedback(q,picked){
  const correct=q.correct===picked;
  return '<div class="feedback '+(correct?"":"wrong")+'" role="status" tabindex="-1">'+
   '<strong>'+(correct?'✓ إجابة صحيحة — خلينا نثبت السبب':'✕ اختيار غير صحيح — تعالى نفهم ليه')+'</strong>'+
   (correct?'':'<p class="why-wrong"><b>ليه اختيارك غلط؟</b> '+esc(q.wrong[picked])+'</p>'+
    '<p><b>الاختيار الصحيح:</b> <span class="answer-is" dir="auto">'+
    ABC[q.correct]+' — '+esc(q.choices[q.correct])+'</span></p>')+
   '<p class="why-correct"><b>ليه دي صح؟</b> '+esc(q.why)+'</p>'+
   '<button type="button" class="retry" data-retry="1">أجرّب السؤال تاني</button></div>';
 }
 function questionCard(q,qi){
  const picked=selected(current,qi);
  return '<article class="question" data-question="'+qi+'">'+
   '<span class="q-number">PRACTICE '+String(qi+1).padStart(2,"0")+'</span>'+
   '<p class="q-label">اختار الإجابة الصحيحة</p>'+
   '<div class="q-english" dir="ltr" lang="en">'+esc(q.en)+'</div>'+
   '<div class="options" dir="ltr">'+q.choices.map((choice,idx)=>{
    const tone=picked===null?"":idx===q.correct?"correct":picked===idx?"wrong":"";
    return '<button class="option '+tone+'" type="button" data-answer="'+idx+'"'+(picked!==null?" disabled":"")+
     '><span class="letter">'+ABC[idx]+'</span><span class="choice" dir="auto">'+esc(choice)+'</span></button>';
   }).join("")+'</div>'+(picked===null?"":feedback(q,picked))+'</article>';
 }
 function practice(m){
  if(!m.checks.length)return '<section class="panel" id="practice">'+
   '<h2 class="subhead">اتعلم القاعدة الأول</h2>'+
   '<p class="source-pending">المحطة دي للشرح والفهم. راجع الخرائط والأمثلة وبعدها كمّل على المحطة التالية عشان تتدرّب على أسئلة الاختيار من متعدد.</p></section>';
  return '<section class="panel" id="practice" aria-labelledby="practice-title"><div class="quiz-head">'+
   '<h2 id="practice-title">جرّب حل سؤال STEP</h2><small>اختيار من 4 إجابات، وتصحيح يساعدك تفهم القاعدة</small></div>'+
   m.checks.map(questionCard).join("")+'</section>';
 }
 function stageContent(){
  const m=stages[current],done=count(current),size=m.checks.length;
  return '<div class="content" id="stage-content"><section class="panel">'+
   '<div class="stage-heading"><div><span class="eyebrow">FOUNDATION · STAGE '+String(current+1).padStart(2,"0")+'</span>'+
   '<h2>'+esc(m.title)+'</h2><span class="english">'+esc(m.english)+'</span>'+
   '<p class="subtitle">'+esc(m.subtitle)+'</p></div><span class="tag">تأسيس من الصفر</span></div>'+
   '<p class="explain">'+m.intro+'</p></section>'+
   '<section class="panel"><h2 class="subhead">الفكرة في خريطة بسيطة</h2><div class="map-grid">'+
   m.map.map(mapCell).join("")+'</div></section>'+
   deepDive(m)+examples(m)+'<section class="panel"><div class="tip"><strong>✦ افتكر:</strong> '+m.tip+'</div></section>'+
   practice(m)+
   '<nav class="stage-footer" aria-label="التنقل بين المحطات">'+
   '<button type="button" data-go="'+(current-1)+'" '+(current===0?"disabled":"")+'>→ المحطة السابقة</button>'+
   '<span class="stage-summary">'+(size?done+' من '+size+' أسئلة تدريب':'محطة شرح تأسيسي')+' · تدريب غير رسمي</span>'+
   '<button type="button" class="primary" data-go="'+(current+1)+'" '+(current===stages.length-1?"disabled":"")+'>'+
   'المحطة التالية ←</button></nav>'+
   '<p class="privacy">محتوى تأسيسي تجريبي. إجاباتك هنا للتعلّم فقط، ومش بتضاف لدرجات STEP أو تقرير الأدمن.</p></div>';
 }
 function render(){
  root.innerHTML=progress()+'<div class="workspace">'+side()+stageContent()+'</div>';
 }
 function go(index){
  if(!Number.isInteger(index)||index<0||index>=stages.length)return;
  current=index;
  const url=new URL(location.href);url.searchParams.set("stage",String(index));
  history.pushState({stage:index},"",url.pathname+url.search+url.hash);
  render();
  window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
 }
 root.addEventListener("click",e=>{
  const el=e.target.closest("button");
  if(!el||!root.contains(el))return;
  if(el.hasAttribute("data-stage"))return go(Number(el.dataset.stage));
  if(el.hasAttribute("data-go"))return go(Number(el.dataset.go));
  const article=el.closest("[data-question]");
  if(!article)return;
  const qi=Number(article.dataset.question),q=stages[current].checks[qi];
  if(!q)return;
  if(el.hasAttribute("data-retry")){
   delete answers[id(current,qi)];store();
  }else if(el.hasAttribute("data-answer")){
   const value=Number(el.dataset.answer);
   if(!isValid(current,qi,value)||selected(current,qi)!==null)return;
   answers[id(current,qi)]=value;store();
  }else return;
  // Replace only the current card so a learner never loses scroll position.
  article.outerHTML=questionCard(q,qi);
  const completed=allCount(),pct=Math.round(completed/total*100);
  const counter=root.querySelector(".progress-box strong");
  if(counter)counter.textContent="تقدمك في التدريب: "+completed+" من "+total;
  const meter=root.querySelector("[role=progressbar]");
  if(meter){meter.setAttribute("aria-valuenow",String(completed));meter.querySelector("span").style.width=pct+"%";}
  const progressText=root.querySelector(".progress-box small");
  if(progressText)progressText.textContent=pct+"% · محفوظ على الجهاز ده فقط";
  const active=root.querySelector('.stage-link[data-stage="'+current+'"] small');
  if(active)active.textContent=count(current)+" / "+stages[current].checks.length+" أسئلة تدريب";
  const summary=root.querySelector(".stage-summary");
  if(summary)summary.textContent=count(current)+" من "+stages[current].checks.length+" أسئلة تدريب · تدريب غير رسمي";
  const nextCard=root.querySelector('[data-question="'+qi+'"]');
  const focusTarget=nextCard?.querySelector(".feedback")||nextCard?.querySelector(".option:not(:disabled)");
  focusTarget?.focus?.({preventScroll:true});
 });
 addEventListener("popstate",()=>{
  const stage=Number(new URLSearchParams(location.search).get("stage"));
  current=Number.isInteger(stage)&&stage>=0&&stage<stages.length?stage:0;
  render();
 });
 render();
})();
