(() => {
  "use strict";
  const questions = {
    grammar: [
      {id:"g1",stem:"The list of activities _____ on the noticeboard.",options:["are","is","have","were"],answer:1,why:"الفاعل الحقيقي هو The list (مفرد)، أما of activities فعبارة وصفية لا تغيّر الفاعل؛ نستخدم is."},
      {id:"g2",stem:"Each of the students _____ a notebook.",options:["have","has","are having","have had"],answer:1,why:"Each مفرد في هذا التركيب؛ لذلك نستخدم has، مهما كان الاسم داخل of جمعًا."},
      {id:"g3",stem:"The teacher, along with her assistants, _____ the plan every Monday.",options:["review","reviews","reviewing","are reviewing"],answer:1,why:"along with her assistants معلومة إضافية؛ الفاعل teacher مفرد، ومع every Monday نستخدم المضارع البسيط reviews."}
    ],
    reading: [
      {id:"r1",stem:"What is the main purpose of the passage?",options:["To explain why libraries should close earlier","To describe a library program designed for evening learners","To compare two school buildings","To announce a new entrance examination"],answer:1,why:"الفقرات الأربعة تشرح كيف نظمت المكتبة برنامج دعم للمتعلمين بعد ساعات العمل."},
      {id:"r2",stem:"According to paragraph 2, what time does the study room close on Tuesdays and Thursdays?",options:["At 6:00 p.m.","At 7:00 p.m.","At 9:00 p.m.","At 10:30 p.m."],answer:2,why:"تذكر الفقرة الثانية بوضوح أن قاعة الدراسة تستمر حتى التاسعة مساءً يومي الثلاثاء والخميس."},
      {id:"r3",stem:"What can be inferred about the librarians?",options:["They expect every learner to own a computer","They want to make support available to people with different schedules","They will stop lending books to evening visitors","They believe online resources are never useful"],answer:1,why:"فتح ساعات مسائية وتوفير الأجهزة يساعد أشخاصًا لا يستطيعون الحضور صباحًا، بغض النظر عن جدولهم أو امتلاكهم للحاسوب."},
      {id:"r4",stem:"In paragraph 3, the word 'available' is closest in meaning to _____ .",options:["accessible","expensive","required","temporary"],answer:0,why:"available in this context means that the computers can be used by learners, أي متاحة لهم."}
    ],
    writing: [
      {id:"w1",stem:"Which sentence is punctuated correctly?",options:["After the workshop ended, the students asked questions.","After the workshop ended the students, asked questions.","After, the workshop ended the students asked questions.","After the workshop ended the students asked, questions."],answer:0,why:"الفاصلة تأتي بعد جملة المقدمة After the workshop ended، وليس بين الفاعل والفعل."},
      {id:"w2",stem:"The first draft was clear. _____, it needed more evidence.",options:["Therefore","However","For example","Similarly"],answer:1,why:"الجملة الثانية تقدم نقطة مخالفة نسبيًا: المسودة واضحة لكنها تحتاج أدلة إضافية؛ الرابط المناسب However."},
      {id:"w3",stem:"Which sentence uses capital letters correctly?",options:["we visited Jeddah in march.","We visited jeddah in March.","We visited Jeddah in March.","We Visited Jeddah In March."],answer:2,why:"أول حرف في الجملة كبير، وJeddah اسم مدينة وMarch اسم شهر، بينما الكلمات العادية لا تبدأ بحروف كبيرة دون سبب."}
    ],
    listening: [
      {id:"l1",stem:"Where will the workshop take place?",options:["In the main hall","In Room 204","In the library cafe","In the training office"],answer:1,why:"التسجيل يقول in Room 204, not in the main hall."},
      {id:"l2",stem:"What should participants bring?",options:["A printed handout","A laptop","A notebook","An examination ticket"],answer:2,why:"التسجيل يطلب Please bring a notebook ويوضح أن الأوراق المطبوعة ستُوفَّر."}
    ]
  };
  const passage = [
    "The Riverside Community Library began an evening learning program after many local residents asked for classes that fit around work and family commitments. The program is open to adults who want to improve their reading, writing, or basic computer skills.",
    "On Tuesdays and Thursdays, the library keeps its study room open until 9:00 p.m. Volunteers lead short workshops, and librarians help visitors find materials suited to their goals. Participants can join one workshop or attend a series of sessions.",
    "Computers are available for learners who do not have a device at home. The library also lends headphones and provides printed guides. None of these services requires an additional fee, although visitors must register for workshops because space is limited.",
    "The program's organizers collect feedback at the end of each month. Several learners have asked for sessions on writing job applications, so the library plans to introduce a practical writing workshop next term. The organizers hope that flexible hours will continue to make learning easier to access."
  ];
  const listeningText = "Good morning, everyone. This is a reminder about Friday's reading workshop. It will begin at ten thirty in Room two hundred and four, not in the main hall. Please bring a notebook. Printed handouts will be provided, so you do not need to print anything at home. If you cannot attend, email the training office before Thursday afternoon. Thank you.";
  const modules = [
    {id:"grammar",num:"01",name:"Grammar",ar:"القواعد",subtitle:"Subject–Verb Agreement",details:"شرح عربي بسيط + 3 أسئلة تدريبية",icon:"Aa"},
    {id:"reading",num:"02",name:"Reading",ar:"استيعاب المقروء",subtitle:"A library that fits your schedule",details:"قطعة أصلية + 4 أسئلة مرتبطة بالنص",icon:"▤"},
    {id:"listening",num:"03",name:"Listening",ar:"الاستماع",subtitle:"Workshop announcement",details:"تدريب مرن ومحاكاة 15 ثانية لكل سؤال",icon:"♫"},
    {id:"writing",num:"04",name:"Writing Analysis",ar:"التحليل الكتابي",subtitle:"Punctuation, connectors and capitals",details:"3 أسئلة مع تفسير الإجابات",icon:"✎"}
  ];
  const state = {completed:{},answers:{},route:"home",listen:null};
  const app = document.getElementById("app");
  const message = document.getElementById("live");
  const letters = ["A","B","C","D"];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const moduleById = id => modules.find(m => m.id===id);
  function notify(text,bad=false){message.textContent=text;message.className=bad?"live live-error":"live";message.hidden=false;}
  function cleanListening(){if(state.listen?.timer)clearInterval(state.listen.timer);if("speechSynthesis" in window)try{window.speechSynthesis.cancel()}catch{};state.listen=null;}
  function navigate(id){if(!moduleById(id)&&id!=="home")id="home";if(location.hash!=="#"+id)location.hash=id;else render();}
  function menu(){
    const nav=document.getElementById("sections");
    nav.innerHTML='<button class="section-link" data-go="home">⌂ <span>الرئيسية</span></button>'+
      modules.map(m=>'<button class="section-link" data-go="'+m.id+'"><span class="nav-num">'+m.num+'</span><span>'+m.ar+'</span>'+(state.completed[m.id]?'<small>✓</small>':'')+'</button>').join("");
    nav.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>navigate(b.dataset.go));
    nav.querySelectorAll("[data-go]").forEach(b=>b.classList.toggle("current",b.dataset.go===state.route));
  }
  function home(){
    const done=modules.filter(m=>state.completed[m.id]).length;
    app.innerHTML='<div class="kicker">STEP WITH SEIFY · INTERACTIVE PREVIEW</div>'
     +'<div class="page-hero"><div><h1>اتعرّف على تجربة STEP التفاعلية</h1><p>أربع وحدات قصيرة تمثل طريقة الشرح والحل والمتابعة. اختار أي قسم وابدأ مباشرة، من غير تسجيل دخول.</p></div><div class="progress-mini"><strong>'+done+' / 4</strong><span>وحدات تمت تجربتها</span></div></div>'
     +'<div class="notice">الأسئلة والقطعة والتسجيل هنا أمثلة توضيحية <strong>مؤلَّفة للديمو</strong>، وليست نقلًا من التجميعات أو محاكاة امتحان رسمي مراقَب. لا تُرسل إجاباتك أو نتائجك لخادم.</div>'
     +'<div class="modules">'+modules.map(m=>'<button class="module-card" data-module="'+m.id+'"><span class="module-symbol">'+esc(m.icon)+'</span><span class="module-content"><span class="module-number">'+m.num+' / '+esc(m.name)+'</span><strong>'+esc(m.ar)+'</strong><span class="module-sub">'+esc(m.subtitle)+'</span><small>'+esc(m.details)+'</small></span><span class="module-open">'+(state.completed[m.id]?'تمت التجربة ✓':'ابدأ ←')+'</span></button>').join("")+'</div>';
    app.querySelectorAll("[data-module]").forEach(b=>b.onclick=()=>navigate(b.dataset.module));
  }
  function questionCards(id,disabled=false){
    return questions[id].map((q,i)=>'<fieldset class="question-card" data-q="'+q.id+'"><legend><span class="q-count">سؤال '+(i+1)+'</span> <span dir="ltr" class="english">'+esc(q.stem)+'</span></legend>'+
      q.options.map((o,j)=>'<label class="choice" dir="ltr"><input type="radio" name="'+q.id+'" value="'+j+'" '+(disabled?'disabled':'')+' '+(state.answers[id]?.[q.id]===j?'checked':'')+'><span class="letter">'+letters[j]+'</span><span>'+esc(o)+'</span></label>').join("")+'</fieldset>').join("");
  }
  function bindAnswers(id){
    const area=document.getElementById("exercise");
    area.querySelectorAll('input[type=radio]').forEach(input=>input.onchange=()=>{
      state.answers[id]??={};state.answers[id][input.name]=Number(input.value);
    });
  }
  function grade(id,{showDetails=true}={}){
    const a=state.answers[id]||{},qs=questions[id];
    if(qs.some(q=>!Number.isInteger(a[q.id]))){notify("اختار إجابة لكل سؤال قبل التصحيح.",true);return false;}
    const n=qs.filter(q=>a[q.id]===q.answer).length;
    state.completed[id]={score:n,total:qs.length};menu();
    const area=document.getElementById("exercise");
    area.querySelectorAll("input").forEach(i=>i.disabled=true);
    let html='<div class="result" id="feedback" tabindex="-1"><strong>نتيجتك: '+n+' / '+qs.length+'</strong><p>'+(n===qs.length?'ممتاز، كل الإجابات صحيحة.':'راجع سبب الإجابة الصحيحة وجرّب تاني لو حابب.')+'</p>';
    if(showDetails)html+='<div class="reasons">'+qs.map((q,i)=>'<p><b>سؤال '+(i+1)+': '+letters[q.answer]+'</b> — '+esc(q.why)+'</p>').join("")+'</div>';
    else html+='<p>وضع المحاكاة يعرض النتيجة فقط؛ النص المسموع محفوظ للتدريب.</p>';
    html+='</div><div class="actions"><button class="secondary" id="tryAgain">تجربة مرة تانية</button><button class="primary" id="nextModule">العودة للوحدات</button></div>';
    document.getElementById("assessmentFooter").innerHTML=html;
    document.getElementById("tryAgain").onclick=()=>{state.answers[id]={};if(id==="listening")renderListening();else renderLesson(id);};
    document.getElementById("nextModule").onclick=()=>navigate("home");
    document.getElementById("feedback").focus();
    return true;
  }
  function shell(id){
    const m=moduleById(id);
    return '<button class="back" id="goBack">← رجوع للأقسام</button><div class="lesson-label">'+m.num+' / '+esc(m.name)+'</div><h1>'+esc(m.ar)+'</h1><p class="subtitle" dir="ltr">'+esc(m.subtitle)+'</p>';
  }
  function renderLesson(id){
    const intro=id==="grammar"?'<div class="learning"><h2>افهم القاعدة ببساطة</h2><p>اختار الفاعل الحقيقي أولًا، وبعد كده حدّد هل هو مفرد ولا جمع. الكلمات الموجودة بين الفاعل والفعل مش بالضرورة تتحكم في الفعل.</p><div class="formula" dir="ltr">Singular subject → singular verb<br>Each + singular verb<br>along with ≠ and</div><p><b>مثال:</b> <span dir="ltr" class="english">The box of books <mark>is</mark> heavy.</span> لأن الفاعل الحقيقي هو box.</p></div>'
      :id==="reading"?'<div class="learning"><h2>اقرأ القطعة وحدد الدليل</h2><p>ابدأ بالفكرة العامة، ثم ارجع للفقرة المطلوبة عند سؤال التفاصيل. لا تعتمد على معلومات خارج النص.</p><article class="passage" lang="en" dir="ltr">'+passage.map((t,i)=>'<p><span class="para">( '+(i+1)+' )</span> '+esc(t)+'</p>').join("")+'</article></div>'
      :'<div class="learning"><h2>ركّز على تركيب الجملة والمعنى</h2><p><b>Punctuation:</b> الفاصلة بعد الجملة الافتتاحية. <b>Connectors:</b> اختار الرابط حسب العلاقة المنطقية. <b>Capitalization:</b> أول الجملة والأسماء العلم.</p><div class="formula" dir="ltr">After the lesson, we reviewed the notes.<br>The plan is useful. However, it needs evidence.</div></div>';
    app.innerHTML=shell(id)+intro+'<h2 class="exercise-title">تدرب بنفسك</h2><section id="exercise">'+questionCards(id)+'</section><div id="assessmentFooter" class="actions"><button class="primary" id="markAnswers">تصحيح الأسئلة</button></div>';
    document.getElementById("goBack").onclick=()=>navigate("home");
    document.getElementById("markAnswers").onclick=()=>grade(id);
    bindAnswers(id);
  }
  function countdownText(){const l=state.listen;const clock=document.getElementById("countdown");if(clock&&l)clock.textContent=l.remaining+" ثانية";}
  function listeningAudio(){
    const l=state.listen;
    if(!l||!l.started)return;
    if(l.mode==="exam"&&l.played)return;
    const status=document.getElementById("audioStatus");
    const synth=window.speechSynthesis;
    if(!synth||typeof SpeechSynthesisUtterance!=="function"){if(status)status.textContent="المتصفح لا يدعم تشغيل الصوت التجريبي. جرّب Chrome أو Edge.";return;}
    synth.cancel();
    const utter=new SpeechSynthesisUtterance(listeningText);
    utter.lang="en-US";utter.rate=.85;utter.pitch=1;
    const voices=synth.getVoices();const voice=voices.find(v=>/^en-US/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang));
    if(voice)utter.voice=voice;
    l.utter=utter;let began=false;
    utter.onstart=()=>{
      began=true;l.played=true;l.plays++;
      if(status)status.textContent=l.mode==="exam"?"التسجيل شغال الآن — التشغيل مرة واحدة.":"التسجيل شغال — تقدر تعيده في التدريب.";
      const q=document.getElementById("exercise");if(q)q.querySelectorAll("input").forEach(x=>x.disabled=false);
      const fallback=document.getElementById("audioFallback");if(fallback)fallback.hidden=true;
      const replay=document.getElementById("replayAudio");if(replay)replay.disabled=l.mode==="exam";
    };
    utter.onend=()=>{if(status)status.textContent=l.mode==="exam"?"انتهى التسجيل. جاوب على السؤالين.":"انتهى التسجيل. تقدر تسمع تاني أو تحل.";};
    utter.onerror=()=>{if(status)status.textContent="حصلت مشكلة في صوت الجهاز؛ جرّب تشغيله يدويًا."};
    synth.speak(utter);
    if(l.mode==="exam")window.setTimeout(()=>{
      if(state.listen===l&&!began&&!l.played){
        const fallback=document.getElementById("audioFallback");
        if(fallback)fallback.hidden=false;
        if(status)status.textContent="المتصفح منع التشغيل التلقائي؛ اضغط زر بدء التسجيل مرة واحدة دون إعادة العدّ.";
      }
    },1600);
  }
  function startListening(){
    const l=state.listen;
    if(!l||l.started)return;
    l.started=true;l.remaining=l.mode==="exam"?15*questions.listening.length:0;
    if(l.mode==="practice"){
      document.getElementById("setupListening").hidden=true;document.getElementById("listeningStage").hidden=false;
      document.getElementById("readTime").hidden=true;
      document.getElementById("replayAudio").disabled=false;
      listeningAudio();return;
    }
    document.getElementById("setupListening").hidden=true;document.getElementById("listeningStage").hidden=false;
    document.getElementById("exercise").querySelectorAll("input").forEach(x=>x.disabled=true);
    countdownText();
    l.timer=setInterval(()=>{
      if(state.listen!==l){clearInterval(l.timer);return;}
      l.remaining=Math.max(0,l.remaining-1);countdownText();
      if(!l.remaining){clearInterval(l.timer);l.timer=null;
        const time=document.getElementById("readTime");if(time)time.hidden=true;
        listeningAudio();
      }
    },1000);
  }
  function renderListening(){
    cleanListening();state.answers.listening={};
    state.listen={mode:"practice",started:false,remaining:0,played:false,plays:0,timer:null,utter:null};
    app.innerHTML=shell("listening")+'<div class="notice"><strong>التسجيل تجريبي بصوت الجهاز</strong> لشرح طريقة التشغيل. في المنصة الأساسية نستخدم ملفات صوتية معتمدة. محاكاة الاختبار هنا تعليمية وليست اختبارًا محميًا.</div>'
      +'<div id="setupListening" class="learning"><h2>اختار طريقة التدريب</h2><div class="mode-switch">'
      +'<label><input type="radio" name="mode" value="practice" checked> تدريب — إعادة غير محدودة، وتصحيح وسكريبت بعد الحل</label>'
      +'<label><input type="radio" name="mode" value="exam"> محاكاة — 15 ثانية قراءة لكل سؤال، ثم صوت واحد تلقائيًا</label></div>'
      +'<p>عدد الأسئلة: <b>2</b>. محاكاة القراءة قبل التشغيل: <b>30 ثانية</b>.</p>'
      +'<button class="primary" id="beginListening">ابدأ التجربة</button></div>'
      +'<div id="listeningStage" hidden><div class="learning"><h2>اسمع الإعلان وجاوب</h2>'
      +'<p id="readTime">وقت قراءة الأسئلة: <strong id="countdown">30 ثانية</strong> — التسجيل هيبدأ تلقائيًا بعد انتهاء الوقت.</p>'
      +'<p id="audioStatus" class="notice" role="status">جاهز لبدء الصوت.</p>'
      +'<div class="actions"><button id="replayAudio" class="secondary" disabled>▶ تشغيل / إعادة الاستماع</button><button id="audioFallback" class="secondary" hidden>▶ بدء التسجيل (مرة واحدة)</button></div>'
      +'</div><section id="exercise">'+questionCards("listening",true)+'</section><div id="assessmentFooter" class="actions"><button class="primary" id="submitListening">تسليم الإجابات</button></div></div>';
    document.getElementById("goBack").onclick=()=>navigate("home");
    document.querySelectorAll('input[name=mode]').forEach(r=>r.onchange=()=>state.listen.mode=r.value);
    document.getElementById("beginListening").onclick=startListening;
    document.getElementById("replayAudio").onclick=listeningAudio;
    document.getElementById("audioFallback").onclick=()=>{if(state.listen&&!state.listen.played){if("speechSynthesis" in window)window.speechSynthesis.cancel();listeningAudio();}};
    document.getElementById("submitListening").onclick=()=>{
      const l=state.listen;
      if(!l?.played){notify("شغّل التسجيل أولًا قبل تسليم الحل.",true);return;}
      if(grade("listening",{showDetails:l.mode==="practice"})){
        if(l.mode==="practice"){
          const out=document.getElementById("feedback");
          if(out)out.insertAdjacentHTML("beforeend",'<details class="script"><summary>عرض سكريبت الاستماع</summary><p lang="en" dir="ltr">'+esc(listeningText)+'</p></details>');
        }
        if("speechSynthesis" in window)window.speechSynthesis.cancel();
        const replay=document.getElementById("replayAudio");if(replay)replay.disabled=true;
      }
    };
    bindAnswers("listening");
  }
  function render(){
    const route=location.hash.replace(/^#/,'');
    const next=moduleById(route)?route:"home";
    cleanListening();message.hidden=true;state.route=next;
    menu();
    if(next==="home")home();
    else if(next==="listening")renderListening();
    else renderLesson(next);
    window.scrollTo(0,0);
  }
  window.addEventListener("hashchange",render);
  document.getElementById("resetDemo").onclick=()=>{
    cleanListening();state.completed={};state.answers={};notify("اتصفّرت بيانات التجربة المحلية.");navigate("home");
  };
  window.STEP_DEMO_READY=true;
  render();
})();
