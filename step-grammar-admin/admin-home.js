"use strict";
// The only public navigation map for the admin landing screen; no source/answer data is included.
window.StepAdminHome={
 async show({root,api,role,esc}){
  const lessons=[
   {n:"01",slug:"subject-verb-agreement",code:"ASGQAGREE",title:"Subject–Verb Agreement",ar:"تطابق الفاعل والفعل"},
   {n:"02",slug:"present-simple",code:"ASGQPRSIM",title:"Present Simple",ar:"المضارع البسيط"},
   {n:"03",slug:"present-continuous",code:"ASGQPRCONT",title:"Present Continuous",ar:"المضارع المستمر"},
   {n:"04",slug:"past-simple",code:"ASGQPASIM",title:"Past Simple",ar:"الماضي البسيط"},
   {n:"05",slug:"past-continuous",code:"ASGQPACONT",title:"Past Continuous",ar:"الماضي المستمر"},
   {n:"06",slug:"will-be-going-to",code:"ASGQWILLGO",title:"Will / Be Going To",ar:"المستقبل بـ Will و Going To",status:"published"},
   {n:"07",slug:"future-arrangements",code:"ASGQFUTARR",title:"Future Arrangements",ar:"ترتيبات المستقبل والجداول",status:"draft"},
   {n:"08",slug:"time-clauses",code:"ASGQTIMCL",title:"Future Time Clauses",ar:"الجمل الزمنية الدالة على المستقبل",status:"published"},
   {n:"09",slug:"present-perfect",code:"ASGQPRPER",title:"Present Perfect",ar:"المضارع التام",status:"published"},
   {n:"10",slug:"present-perfect-continuous",code:"ASGQPRPERCONT",title:"Present Perfect Continuous",ar:"المضارع التام المستمر",status:"published"},
   {n:"11",slug:"past-perfect",code:"ASGQPAPER",title:"Past Perfect",ar:"الماضي التام",status:"published"},
   {n:"12",slug:"past-perfect-continuous",code:"ASGQPAPERCONT",title:"Past Perfect Continuous",ar:"الماضي التام المستمر",status:"draft"},
   {n:"13",slug:"future-continuous-future-perfect",code:"ASGQFUCOMBO",title:"Future Continuous & Future Perfect",ar:"المستقبل المستمر والمستقبل التام",status:"draft"},
   {n:"14",slug:"used-to-be-used-to-get-used-to",code:"ASGQUSED",title:"Used To / Be Used To / Get Used To",ar:"العادة الماضية والتعود",status:"draft"},
   {n:"15",slug:"modals-fundamentals",code:"ASGQMODCORE",title:"Modals Fundamentals",ar:"أساسيات الأفعال الناقصة",status:"published"},
   {n:"16",slug:"modals-of-deduction",code:"ASGQMODDEDUCT",title:"Modals of Deduction & Possibility",ar:"أفعال الاستنتاج والاحتمال",status:"draft"},
   {n:"17",slug:"passive-voice-by-tense",code:"ASGQPSVCORE",title:"Passive Voice by Tense",ar:"المبني للمجهول حسب الزمن",status:"draft"},
   {n:"18",slug:"modal-passive",code:"ASGQMODPASSCORE",title:"Modal Passive & Modal Perfect Passive",ar:"المبني للمجهول مع الأفعال الناقصة",status:"draft"},
   {n:"19",slug:"pronouns",code:"ASGQPRONCORE",title:"Pronouns",ar:"الضمائر",status:"published"},
   {n:"20",slug:"articles-countability",code:"ASGQARTCOUNT",title:"Articles & Countability",ar:"الأدوات والمعدود وغير المعدود",status:"published"},
   {n:"21",slug:"quantity-degree",code:"ASGQDEGREE",title:"Too / Enough / So ... That",ar:"تراكيب الدرجة والكفاية",status:"draft"},
   {n:"22",slug:"adjectives-and-adverbs",code:"ASGQADJADVCORE",title:"Adjectives and Adverbs",ar:"الصفات والظروف",status:"draft"},
   {n:"23",slug:"comparatives-superlatives",code:"ASGQCOMPSUP",title:"Comparatives & Superlatives",ar:"المقارنة والتفضيل",status:"published"},
   {n:"24",slug:"prepositions-of-time-and-place",code:"ASGQPREPTIME",title:"Prepositions of Time and Place",ar:"حروف الجر للزمان والمكان",status:"published"},
   {n:"25",slug:"preposition-collocations",code:"ASGQCOLLOCPREP",title:"Preposition Collocations",ar:"تلازم الأفعال وحروف الجر",status:"draft"},
   {n:"26",slug:"word-formation",code:"ASGQWORDFORM",title:"Word Formation",ar:"الاشتقاقات وتكوين الكلمة",status:"draft"},
   {n:"27",slug:"gerunds",code:"ASGQGERUNDCORE",title:"Gerunds (-ing)",ar:"المصدر المنتهي بـ ing",status:"draft"},
   {n:"28",slug:"infinitives",code:"ASGQINFINCORE",title:"To-Infinitive",ar:"المصدر المسبوق بـ to",status:"draft"},
   {n:"29",slug:"bare-infinitives",code:"ASGQBARECORE",title:"Bare Infinitive & Make / Let",ar:"المصدر المجرد",status:"draft"},
   {n:"30",slug:"causatives",code:"ASGQCAUSCORE",title:"Causatives",ar:"السببية",status:"draft"}
  ];
  // Dashboard is driven by the same canonical index as Studio; new audited courses appear automatically.
  try{
   const catalog=await api("/studio/catalog");
   if(Array.isArray(catalog.courses)&&catalog.courses.length){
    lessons.splice(0,lessons.length,...catalog.courses.map((c,i)=>({
     n:String(i+1).padStart(2,"0"),slug:c.slug,code:c.code,
     title:c.title,ar:c.titleAr,status:c.status
    })));
   }
  }catch(error){/* Keep the known course cards if the live catalog is temporarily unavailable. */}
  const cards=lessons.map(x=>{
   const editor="studio.html?course="+encodeURIComponent(x.code);
   return '<article class="home-card"><div class="count">LESSON '+x.n+'</div>'+
    '<h3>'+esc(x.title)+'</h3><p>'+esc(x.ar)+'</p>'+
    '<div><span class="badge" id="home-status-'+x.n+'">جاري تحميل حالة الدرس</span></div>'+
    '<div class="home-actions"><a class="main" href="'+editor+'&tab=visual">تعديل الشرح</a>'+
    '<a href="'+editor+'&tab=questions">تعديل الأسئلة</a>'+
    '<a href="videos.html?indicator='+encodeURIComponent(x.slug)+'">إدارة الفيديوهات</a></div></article>';
  }).join("");
  root.innerHTML='<main class="shell admin-home"><section class="home-hero"><div>'+
   '<div class="eyebrow">STEP WITH SEIFY · ADMIN</div><h1>مركز إدارة STEP</h1>'+
   '<p>كل مهمة ليها مكان واضح. '+
   (role==="owner"?"تقدر تحفظ التعديلات وتنشرها بعد المراجعة.":"حسابك للعرض والمتابعة فقط.")+
   '</p></div><a id="nav-lessons" href="studio.html" class="btn">✎ افتح استوديو الدروس ←</a></section>'+
   '<section class="home-section"><h2>1. الدروس والمحتوى</h2>'+
   '<p>اختار الدرس واضغط تعديل الشرح أو الأسئلة مباشرة. الحفظ مسودة، والنشر قرار منفصل.</p>'+
   '<div class="home-grid">'+cards+'</div></section>'+
   '<section class="home-section"><h2>2. الطلاب والنتائج</h2>'+
   '<p>دليل الطلاب والتقارير منفصلين عن تحرير المحتوى.</p>'+
   '<div class="home-shortcuts">'+
   '<a href="./#students"><strong>إدارة الطلاب والحسابات ←</strong><small>بحث وتفعيل وإيقاف وتصدير، مع بيانات التواصل.</small></a>'+
   '<a href="reports.html"><strong>تقارير الأداء والاختبارات ←</strong><small>نتائج الدروس المنشورة، مهارات الطلاب، والتقارير الفردية.</small></a>'+
   '</div></section>'+
   '<section class="home-section"><h2>3. المنهج والجودة</h2>'+
   '<p>ترتيب الدروس وتدقيق المصادر وتجهيز الدروس القادمة.</p>'+
   '<div class="home-shortcuts">'+
   '<a href="curriculum.html"><strong>ترتيب المنهج والمؤشرات ←</strong><small>41 موضوعًا في الجرامر، ترتيب وحالة كل مؤشر وربط المصادر.</small></a>'+
   '<a href="sources.html"><strong>تدقيق بنك الأسئلة ←</strong><small>السجلات الأصلية والأسئلة المعتمدة والمستبعدة.</small></a>'+
   '<a href="courses.html"><strong>إضافة درس جديد كمسودة ←</strong><small>دي لإعداد الدروس القادمة، مش لتعديل الدروس المنشورة.</small></a>'+
   '<a href="../step-grammar-student/" target="_blank" rel="noopener noreferrer"><strong>فتح بوابة الطالب ↗</strong><small>تصفح المسار الظاهر للطلاب بحساب الطالب التجريبي.</small></a>'+
   '</div></section>'+
   '<div class="home-footnote">استوديو الدروس هو نقطة التحرير الوحيدة للمحتوى والأسئلة. أي تعديل جديد يُحفظ كمسودة؛ بيانات المحاولات القديمة لا تتغير.</div></main>';
  try{
   const response=await api("/indicators");
   const indicators=response.indicators||[];
   for(const l of lessons){
    const status=indicators.find(x=>x.slug===l.slug)?.status;
    const badge=document.getElementById("home-status-"+l.n);
    if(!badge)continue;
    badge.textContent=status==="published"?"منشور للطلاب":status==="draft"?"مسودة غير منشورة":status==="archived"?"مؤرشف":"حالة غير متاحة";
    badge.classList.toggle("live",status==="published");
   }
  }catch(e){
   for(const l of lessons){
    const badge=document.getElementById("home-status-"+l.n);
    if(badge)badge.textContent="تعذر تحديث الحالة";
   }
  }
 }
};
