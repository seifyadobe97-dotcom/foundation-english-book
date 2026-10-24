"use strict";
/**
 * STEP Listening UI. Consumes an authenticated group adapter:
 * {mode, questions, audioUrl, grade, attempt?, onNext?, unlockAudio?}.
 * Results and transcripts are NOT bundled in the HTML or exam payload.
 * Not linked in the published student catalogue until server data is approved.
 */
(function(global){
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const CHOICES=["A","B","C","D"];
  function mountListening(root,config){
    if(!root||!config)throw Error("Missing Listening container or config");
    const mode=config.mode;
    root.classList.add("step-listening");
    const view=document.createElement("div");
    view.className="listening-view";
    const media=config.media||document.createElement("audio");
    media.preload="auto";
    if(config.audioUrl)media.src=config.audioUrl;
    media.controls=mode==="practice";
    media.classList.add("listening-audio");
    media.setAttribute("aria-label","مقطع الاستماع");
    root.appendChild(view);
    root.appendChild(media);
    let working=false;
    const count=s=>s.questionCount;
    function card(q,i,s){
      const mayAnswer=s.mode==="practice"?
        ["answering"].includes(s.phase):["playing","answering"].includes(s.phase);
      const selection=s.answers[q.id];
      const result=s.mode==="practice"&&s.phase==="review"?
        s.review?.results?.find(item=>item.id===q.id):null;
      const options=CHOICES.map(letter=>{
        const correct=result?.correct===letter;
        const selected=selection===letter;
        return '<label class="listening-choice'+(correct?" is-correct":"")+
          (selected&&result&&!correct?" is-wrong":"")+'">'+
          '<input type="radio" name="q-'+esc(q.id)+'" value="'+letter+'" data-question="'+esc(q.id)+'"'+
          (selected?' checked':'')+(!mayAnswer?' disabled':'')+'>'+
          '<span class="listening-letter" dir="ltr">'+letter+'</span>'+
          '<span dir="ltr" lang="en">'+esc(q.options[letter])+'</span></label>';
      }).join("");
      return '<fieldset class="listening-question"><legend>'+
        '<span class="listening-number">Q'+(i+1)+'</span> <bdi dir="ltr" lang="en">'+
        esc(q.text)+'</bdi></legend><div class="listening-choices">'+options+'</div>'+
        (result?'<p class="listening-rationale">'+
          (result.isCorrect?'✓ إجابتك صحيحة. ':'✕ الإجابة الصحيحة: '+esc(result.correct)+'. ')+
          esc(result.explanation||"راجع النص المسجل.")+'</p>':"")+'</fieldset>';
    }
    function render(s){
      const title=s.mode==="exam"?"محاكاة الاستماع":"تدريب الاستماع";
      const explain=s.mode==="exam"?
        "اقرأ الأسئلة في الوقت المخصص، وبعدها هتسمع التسجيل مرة واحدة بس. مفيش إيقاف أو إعادة.":
        "اقرأ براحتك، واسمع المقطع كذا مرة. بعد التصحيح هتشوف الإجابات والسكريبت.";
      let phaseMessage="";
      if(s.mode==="exam"){
        if(s.phase==="ready")
          phaseMessage='<p class="listening-instruction">اعمل اختبار الصوت والسماعة قبل البداية. اضغط «ابدأ المحاكاة» لما تكون جاهز.</p>'+
            '<button type="button" class="listening-button" data-action="begin">ابدأ المحاكاة</button>';
        else if(s.phase==="reading")
          phaseMessage='<div class="listening-timer" role="timer" aria-live="off"><small>وقت قراءة الأسئلة قبل التسجيل</small>'+
            '<strong>'+s.secondsRemaining+'</strong><span>ثانية متبقية</span></div>'+
            '<p>السماعة جاهزة؟ التسجيل هيبدأ تلقائيًا عند انتهاء العداد.</p>';
        else if(s.phase==="starting")
          phaseMessage='<p role="status">بيبدأ تشغيل الصوت تلقائيًا…</p>';
        else if(s.phase==="blocked")
          phaseMessage='<div class="listening-alert" role="alert">'+esc(s.error)+'</div>'+
            '<button type="button" class="listening-button" data-action="unblock">شغّل الصوت الآن — مرة واحدة</button>';
        else if(s.phase==="playing")
          phaseMessage='<p class="listening-live" role="status">الصوت شغال دلوقتي لمرة واحدة. جاوب على الأسئلة أثناء الاستماع.</p>';
        else if(s.phase==="answering")
          phaseMessage='<p class="listening-live">انتهى التسجيل. كمّل الإجابات؛ مفيش إعادة للصوت.</p>';
        else if(s.phase==="finished")
          phaseMessage='<p class="listening-done" role="status">✓ تم حفظ إجابات المجموعة. التصحيح والسكريبت مش بيظهروا أثناء المحاكاة.</p>'+
            (typeof config.onNext==="function"?
              '<button type="button" class="listening-button" data-action="next">المجموعة التالية ←</button>':"");
      }else{
        phaseMessage=s.phase==="ready"?
          '<button type="button" class="listening-button" data-action="begin">ابدأ التدريب</button>':
          '<div class="listening-practice-tools"><button type="button" class="listening-button" data-action="play">'+
           (s.playCount?"اسمع من الأول تاني ↻":"شغّل التسجيل ▶")+'</button>'+
           '<button type="button" class="listening-button secondary" data-action="pause">إيقاف مؤقت</button>'+
           '<small>سمعت المقطع '+s.playCount+' مرة — مفيش حد للإعادة</small></div>';
      }
      const review=s.mode==="practice"&&s.phase==="review"?
        '<section class="listening-script"><h3>سكريبت التسجيل — بعد التصحيح</h3>'+
         '<p dir="ltr" lang="en">'+esc(s.review?.transcript||"السكريبت غير متاح بعد.")+'</p></section>':"";
      const maySubmit=(s.mode==="practice"&&s.phase==="answering")||
        (s.mode==="exam"&&["playing","answering"].includes(s.phase));
      const status=s.error&&s.phase!=="blocked"?
        '<p class="listening-alert" role="alert">'+esc(s.error)+'</p>':"";
      view.innerHTML='<div class="listening-header"><span class="listening-label">STEP · LISTENING</span>'+
        '<h1>'+title+'</h1><p>'+explain+'</p>'+
        '<span class="listening-group-count">'+count(s)+' '+(count(s)===1?"سؤال":"أسئلة")+
        ' على نفس المقطع'+(s.mode==="exam"?' · '+s.readingSeconds+' ثانية للقراءة':"")+'</span></div>'+
        '<div class="listening-phase">'+phaseMessage+'</div>'+
        '<div class="listening-questions">'+(s.mode==="exam"&&s.phase==="ready"?"":s.questions.map((q,i)=>card(q,i,s)).join(""))+'</div>'+
        (maySubmit?'<button type="button" class="listening-button submit" data-action="submit"'+
          (s.busy?' disabled':'')+'>'+(s.busy?"بنسجّل الإجابات…":"سلّم إجابات المجموعة ←")+'</button>':"")+
        status+review;
    }
    const session=new global.StepListeningSession({
      ...config,media,
      onChange:render
    });
    view.addEventListener("change",e=>{
      if(e.target.matches("input[data-question]"))
        session.answer(e.target.dataset.question,e.target.value);
    });
    view.addEventListener("click",async e=>{
      const button=e.target.closest("button[data-action]");
      if(!button||button.disabled||working)return;
      const action=button.dataset.action;
      if(action==="begin"){
        working=true;
        try{
          // Gesture unlock needs to start synchronously in the click handler.
          const gesture=config.unlockAudio?.();
          if(gesture&&typeof gesture.catch==="function")gesture.catch(()=>{});
          if(config.ensureAudioReady)await config.ensureAudioReady();
          session.start();
        }catch{
          const error=view.querySelector(".listening-alert");
          if(!error){
            const el=document.createElement("p");
            el.className="listening-alert";el.setAttribute("role","alert");
            el.textContent="التسجيل مش جاهز. اتأكد من الاتصال قبل بدء العداد.";
            view.querySelector(".listening-phase")?.appendChild(el);
          }
        }finally{working=false;}
      }
      if(action==="unblock")await session.resumeBlockedAudio();
      if(action==="play")await session.playPracticeAudio();
      if(action==="pause")session.pausePracticeAudio();
      if(action==="submit")await session.submit();
      if(action==="next")config.onNext?.();
    });
    return session;
  }
  global.StepListeningUI={mount:mountListening};
})(window);
