"use strict";
// Progressive enhancement on top of the existing authenticated course dashboard.
// Published lessons come from the server catalog; drafts never become student cards.
window.StepStudentExperience={
 enhance(app,data,escapeHtml){
  const esc=escapeHtml;
  const published=(data.catalog?.indicators||[]).filter(i=>i.axis_code==="grammar")
   .slice().sort((a,b)=>Number(a.position)-Number(b.position));
  const legacy={
   "subject-verb-agreement":data.agreement,
   "present-simple":{course:data.course,sections:data.sections,exam:data.exam},
   "present-continuous":data.continuous
  };
  const additional=Object.fromEntries((data.extraLessons||[]).map(item=>[item.slug,item.data]));
  const rows=published.map(item=>({...item,data:legacy[item.slug]||additional[item.slug]}))
   .filter(item=>item.data&&Array.isArray(item.data.sections));
  if(!rows.length)return;
  const link=(slug,part)=>{
   const known={"subject-verb-agreement":"subject-verb-agreement.html",
    "present-simple":"learn.html","present-continuous":"present-continuous.html"};
   const base=known[slug]||"lesson.html?slug="+encodeURIComponent(slug);
   const joiner=base.includes("?")?"&":"?";
   return base+joiner+"step="+Math.max(0,part);
  };
  const progress=rows.map((item,index)=>{
   const stages=item.data.sections||[];
   const passed=stages.filter(s=>s.passed).length;
   const next=stages.find(s=>!s.passed&&!s.locked);
   const nextPosition=next?stages.indexOf(next):Math.min(Math.max(Number(item.data.nextIndex)||0,0),Math.max(0,stages.length-1));
   return {...item,index,passed,total:stages.length,ready:nextPosition,
    percent:stages.length?Math.round(passed/stages.length*100):0,
    finished:stages.length>0&&passed===stages.length};
  });
  const done=progress.reduce((sum,item)=>sum+item.passed,0);
  const total=progress.reduce((sum,item)=>sum+item.total,0);
  const percent=total?Math.round(100*done/total):0;
  const target=progress.find(item=>!item.finished)||progress[progress.length-1];
  const heading=Array.from(app.querySelectorAll(".section-head")).find(el=>el.textContent.includes("مؤشرات الجرامر"));
  const firstCard=app.querySelector(".course-card");
  if(!heading||!firstCard)return;
  const home=document.createElement("section");
  home.id="student-learning-path";home.className="student-learning-path";
  home.innerHTML='<div class="student-section-title"><div><span class="section-label">MY LEARNING PATH</span>'+
   '<h2>دروسي في الجرامر</h2><p>ابدأ من اللي يناسبك، وتقدمك بيتحفظ تلقائيًا بعد كل تدريب.</p></div>'+
   '<span class="student-count">'+progress.length+' دروس متاحة</span></div>'+
   '<div class="student-course-list">'+progress.map(item=>{
    const title=item.data.course?.title||item.title_en||"STEP Grammar";
    const ar=item.data.course?.titleAr||item.title_ar||"";
    const url=link(item.slug,item.ready);
    const stage=item.data.sections[item.ready];
    const button=item.finished?"راجع الدرس واختبار الإتقان":item.passed?"كمّل من مرحلتك":"ابدأ الدرس";
    return '<article class="student-course-tile '+(item.finished?"is-complete":"")+'">'+
     '<div class="student-course-number">LESSON '+String(item.index+1).padStart(2,"0")+'</div>'+
     '<div class="student-course-info"><div class="student-course-head"><h3>'+esc(title)+'</h3>'+
     '<span class="student-course-state">'+(item.finished?"✓ مكتمل":item.passed?"بدأت فيه":"جاهز تبدأ")+'</span></div>'+
     '<p class="student-course-ar">'+esc(ar)+'</p>'+
     '<div class="student-stage-meta">'+item.passed+' من '+item.total+' مراحل مكتملة'+
     (stage&&!item.finished?' · التالية: '+esc(stage.titleAr||stage.title||"المرحلة التالية"):"")+'</div>'+
     '<div class="student-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+item.percent+'" aria-label="تقدم '+esc(ar)+'"><span style="width:'+item.percent+'%"></span></div></div>'+
     '<div class="student-course-go"><strong>'+item.percent+'%</strong>'+
     '<a href="'+url+'" aria-label="'+esc(button+" في "+ar)+'">'+button+' <span aria-hidden="true">←</span></a></div>'+
     '</article>';
   }).join("")+'</div>';
  heading.replaceWith(home);
  for(const old of Array.from(app.querySelectorAll(".course-card")))old.remove();
  const metrics=app.querySelectorAll(".metric");
  if(metrics.length>=2){
   metrics[0].querySelector("strong").textContent=done+"/"+total;
   metrics[1].querySelector("strong").textContent=percent+"%";
  }
  const hero=app.querySelector(".hero");
  if(hero&&target){
   hero.classList.add("student-hero");
   const cta=document.createElement("a");cta.className="student-hero-cta";
   cta.href=link(target.slug,target.ready);
   cta.innerHTML='<span class="student-cta-label">'+(target.finished?"راجع اللي اتعلمته":"خطوتك الجاية")+'</span>'+
    '<strong>'+esc(target.data.course?.titleAr||target.title_ar||"كمّل درسك")+'</strong>'+
    '<span>ابدأ من هنا ←</span>';
   hero.appendChild(cta);
  }
  const shortcut=document.createElement("nav");shortcut.className="student-quicknav";
  shortcut.setAttribute("aria-label","تنقل بين أقسام رحلتك");
  shortcut.innerHTML='<a href="#student-learning-path" aria-label="انتقل لقائمة دروسي">دروسي</a>'+
   '<a href="#student-followups">خطة متابعتي</a><a href="#student-axes">محاور STEP</a>';
  hero?.insertAdjacentElement("beforebegin",shortcut);
  const tasks=app.querySelector(".student-followups");
  if(tasks){
   tasks.id="student-followups";
   // Keep the core lessons immediately after the welcome area;
   // follow-up tasks remain reachable without hiding or discarding them.
   home.insertAdjacentElement("afterend",tasks);
  }else shortcut.querySelector('a[href="#student-followups"]')?.remove();
  const axes=app.querySelector(".axis-grid");
  if(axes){
   const axesHead=Array.from(app.querySelectorAll(".section-head")).find(el=>el.textContent.includes("محاور STEP الأربعة"));
   const details=document.createElement("details");details.className="student-axes-disclosure";details.id="student-axes";
   details.innerHTML='<summary>استكشف محاور STEP الأربعة <span>عرض التفاصيل</span></summary>';
   axes.parentElement.insertBefore(details,axes);
   details.appendChild(axes);axesHead?.remove();
   home.insertAdjacentElement("afterend",details);
  }
  const stages=app.querySelector(".lesson-grid");
  if(stages){
   const stagesHead=Array.from(app.querySelectorAll(".section-head")).find(el=>el.textContent.includes("مراحل الدرس 2"));
   const details=document.createElement("details");details.className="student-stages-disclosure";
   details.innerHTML='<summary>تفاصيل مراحل المضارع البسيط <span>عرض المراحل</span></summary>';
   stages.parentElement.insertBefore(details,stages);details.appendChild(stages);stagesHead?.remove();
   // Keep the lesson library above both optional detail panels for a clear reading order.
  }
 }
};
