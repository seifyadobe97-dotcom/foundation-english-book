"use strict";
// Student curriculum hub. All current lesson links are sourced from the authenticated
// published catalogue and successful protected lesson responses, not static course IDs.
// Mock exams are a reserved section only: never render a start link without a real backend.
window.StepCurriculumHub={
 mount(app,data,{progress,writing,home,hero,shortcut},esc){
  if(!home||!hero)return;
  const writingPanel=app.querySelector("#writing-analysis-lessons");
  const examPanel=document.createElement("section");
  examPanel.id="student-exams";
  examPanel.className="student-exams-panel";
  examPanel.setAttribute("aria-labelledby","student-exams-heading");
  examPanel.innerHTML='<div class="student-section-title"><div><span class="section-label">MOCK EXAMS</span>'+
   '<h2 id="student-exams-heading">الاختبارات المحاكية</h2><p>القسم المخصص للاختبارات الشاملة بنظام STEP.</p></div></div>'+
   '<div class="student-exams-empty"><span class="student-exam-symbol" aria-hidden="true">◇</span>'+
   '<div><h3>الاختبارات المحاكية قيد التجهيز</h3>'+
   '<p>هنحط هنا الاختبارات بعد إعدادها واعتمادها، مع وقت الاختبار والنتيجة والتقييم. '+
   'دلوقتي تقدر تتدرب من داخل كل درس، لكن مفيش اختبار شامل متاح لسه.</p></div>'+
   '<span class="student-exam-status">قريبًا</span></div>';
  (writingPanel||home).insertAdjacentElement("afterend",examPanel);
  const hub=document.createElement("section");
  hub.id="student-curriculum-hub";
  hub.className="student-curriculum-hub";
  hub.setAttribute("aria-labelledby","curriculum-heading");
  const cards=[
   {id:"grammar",number:"01",icon:"Aa",title:"القواعد",en:"GRAMMAR",count:progress.length,description:"دروس الجرامر والتدريبات",ready:true},
   {id:"writing",number:"02",icon:"✎",title:"التحليل الكتابي",en:"WRITING ANALYSIS",count:writing.length,description:"الترقيم والترتيب والمهارات الكتابية",ready:!!writingPanel},
   {id:"reading",number:"03",icon:"▤",title:"فهم المقروء",en:"READING",description:"المحتوى قيد الإعداد",ready:false},
   {id:"listening",number:"04",icon:"♫",title:"الاستماع",en:"LISTENING",description:"جرّب التدريب ومحاكاة الوقت بصوت تجريبي",ready:false,demo:true},
   {id:"exams",number:"05",icon:"◷",title:"الاختبارات المحاكية",en:"MOCK EXAMS",description:"مساحة للاختبارات القادمة",ready:true,upcoming:true}
  ];
  hub.innerHTML='<div class="student-section-title"><div><span class="section-label">YOUR STEP CURRICULUM</span>'+
   '<h2 id="curriculum-heading">منهجك متقسم قدامك</h2><p>اختار القسم، وادخل على الدرس اللي محتاجه مباشرة.</p></div></div>'+
   '<div class="student-curriculum-grid">'+cards.map(item=>{
    const text='<span class="student-curriculum-icon" aria-hidden="true">'+item.icon+'</span>'+
     '<span class="student-curriculum-index">'+item.number+' · '+item.en+'</span>'+
     '<strong>'+item.title+'</strong><span class="student-curriculum-desc">'+item.description+'</span>'+
     '<span class="student-curriculum-footer">'+(item.upcoming?'قريبًا · استكشف القسم':
      item.demo?"تجربة صوتية متاحة · غير محسوبة":item.ready?item.count+' درس متاح · افتح القسم':'قريبًا')+'</span>';
    return item.demo?'<a class="student-curriculum-card is-demo" href="listening-demo.html" aria-label="افتح تجربة الاستماع غير المحسوبة">'+text+'</a>':
     item.ready?'<button type="button" class="student-curriculum-card" data-curriculum-target="'+item.id+
     '" aria-pressed="false" aria-controls="'+(item.id==="grammar"?"student-learning-path":item.id==="writing"?"writing-analysis-lessons":"student-exams")+'">'+text+'</button>':
     '<div class="student-curriculum-card is-upcoming" aria-disabled="true">'+text+'</div>';
   }).join("")+'</div>';
  hero.insertAdjacentElement("afterend",hub);

  // Filter existing authenticated cards locally; no course progress or API data changes.
  const search=(panel,id,example)=>{
   const list=panel?.querySelector(".student-course-list");
   if(!list)return;
   const wrapper=document.createElement("div");
   wrapper.className="student-lesson-filter";
   wrapper.innerHTML='<label for="'+id+'">ابحث عن درس</label>'+
    '<input id="'+id+'" type="search" autocomplete="off" placeholder="'+example+'">'+
    '<p class="student-search-results" role="status" aria-live="polite"></p>';
   list.insertAdjacentElement("beforebegin",wrapper);
   const input=wrapper.querySelector("input"),label=wrapper.querySelector(".student-search-results");
   const tiles=Array.from(list.querySelectorAll(".student-course-tile"));
   input.addEventListener("input",()=>{
    const term=input.value.trim().toLocaleLowerCase();let visible=0;
    for(const tile of tiles){
     tile.hidden=!!term&&!tile.textContent.toLocaleLowerCase().includes(term);
     if(!tile.hidden)visible++;
    }
    label.textContent=term?(visible?visible+" درس مطابق للبحث":"مفيش درس بالاسم ده، جرّب كلمة تانية."):"";
   });
  };
  search(home,"search-grammar-lessons","مثال: Past Simple أو المضارع");
  search(writingPanel,"search-writing-lessons","مثال: Punctuation أو الترقيم");
  const stages=app.querySelector(".student-stages-disclosure");
  const axes=app.querySelector(".student-axes-disclosure");
  if(axes)axes.hidden=true; // Replaced by the five prominent cards, not deleted.
  const panels={grammar:home,writing:writingPanel,exams:examPanel};
  const hashes={grammar:"#student-learning-path",writing:"#writing-analysis-lessons",exams:"#student-exams"};
  const fromHash=()=>location.hash===hashes.exams?"exams":
   location.hash===hashes.writing?"writing":"grammar";
  const show=(target,scroll=true,updateAddress=false)=>{
   if(!panels[target])target="grammar";
   for(const [name,panel] of Object.entries(panels))if(panel)panel.hidden=name!==target;
   if(stages)stages.hidden=target!=="grammar";
   hub.querySelectorAll("[data-curriculum-target]").forEach(button=>
    button.setAttribute("aria-pressed",String(button.dataset.curriculumTarget===target)));
   // Shareable section URLs and Back/Forward must match the currently visible section.
   if(updateAddress&&location.hash!==hashes[target])history.pushState(null,"",hashes[target]);
   if(scroll)hub.scrollIntoView({behavior:"smooth",block:"start"});
  };
  hub.addEventListener("click",event=>{
   const button=event.target.closest("[data-curriculum-target]");
   if(button&&hub.contains(button))show(button.dataset.curriculumTarget,true,true);
  });
  shortcut?.querySelector('[data-curriculum-shortcut="exams"]')?.addEventListener("click",event=>{
   event.preventDefault();show("exams",true,true);
  });
  // Restore bookmarked sections on reload and when navigating browser history.
  window.addEventListener("popstate",()=>show(fromHash(),false));
  window.addEventListener("hashchange",()=>show(fromHash(),false));
  show(fromHash(),false);
 }
};
