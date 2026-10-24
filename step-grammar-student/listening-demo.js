"use strict";
/**
 * Public, disposable Listening DEMO only. Source text/keys below are synthetic and
 * intentionally published; never reuse this adapter for secured exam content.
 * A real recording bank uses private Supabase Storage + server attempts instead.
 */
(function(){
  const script="Hello. This is a message from Greenfield Library. The library opens at nine o'clock from Sunday to Thursday. Today, the reading club starts at ten thirty in room four. Students should bring a notebook and their library card. Please arrive ten minutes early. Thank you.";
  const demoItems=[
    {id:"demo-open",text:"What time does the library open?",options:{
      A:"At nine o'clock",B:"At eight o'clock",C:"At ten thirty",D:"At eleven o'clock"},
      correct:"A",explanation:"المتحدث قال: The library opens at nine o'clock. إذن الساعة التاسعة.",
      wrongReasons:{B:"ما قالش 8 o'clock.",C:"10:30 هو موعد نادي القراءة، مش افتتاح المكتبة.",D:"ما ذكرش 11 o'clock."}},
    {id:"demo-room",text:"Where does the reading club meet?",options:{
      A:"In the main hall",B:"In room four",C:"In the cafeteria",D:"Outside the library"},
      correct:"B",explanation:"قال: in room four. يعني نادي القراءة هيكون في الغرفة رقم 4.",
      wrongReasons:{A:"ما ذكرش القاعة الرئيسية.",C:"المكان مش الكافتيريا.",D:"النادي داخل المكتبة في الغرفة الرابعة."}},
    {id:"demo-bring",text:"What should students bring?",options:{
      A:"A laptop and a pen",B:"A bottle of water",C:"A notebook and their library card",D:"A textbook only"},
      correct:"C",explanation:"قال: bring a notebook and their library card. يعني دفتر وبطاقة المكتبة.",
      wrongReasons:{A:"ما قالش يجيبوا لابتوب.",B:"ما طلبش زجاجة مياه.",D:"ما قالش كتاب فقط."}}
  ];
  const root=document.getElementById("listening-root");
  const config=document.getElementById("demo-config");
  const modeButtons=[...document.querySelectorAll("[data-mode]")];
  const countSelector=document.getElementById("question-count");
  const openButton=document.getElementById("open-demo");
  const speakerButton=document.getElementById("test-speakers");
  const status=document.getElementById("speaker-status");
  const guide=document.getElementById("demo-status");
  let mode="practice",session=null,adapter=null;

  function voiceAvailable(){return "speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;}
  function makeUtterance(text){
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang="en-US";utterance.rate=0.86;utterance.pitch=1;utterance.volume=1;
    const voices=window.speechSynthesis.getVoices?.()||[];
    const english=voices.find(v=>v.lang?.toLowerCase()==="en-us")||
      voices.find(v=>v.lang?.toLowerCase().startsWith("en"));
    if(english)utterance.voice=english;
    return utterance;
  }
  function announce(msg){status.textContent=msg;}
  function createVoiceAdapter(){
    const media=document.createElement("audio");
    let utterance=null,pending=null;
    const synth=window.speechSynthesis;
    const cancel=()=>{
      // Invalidating previous utterance avoids emitting "ended" on cancelled playback.
      utterance=null;
      if(pending){pending.resolveOnStart?.();pending=null;}
      synth.cancel();
    };
    media.play=()=>new Promise((resolve,reject)=>{
      if(!voiceAvailable()){reject(Error("speech synthesis unsupported"));return;}
      cancel();
      const thisUtterance=makeUtterance(script);
      utterance=thisUtterance;
      let settled=false;
      const timer=setTimeout(()=>{
        if(settled)return;
        settled=true;utterance=null;synth.cancel();
        reject(Error("Speech playback start blocked"));
      },4500);
      const accepted=()=>{
        if(settled)return;
        settled=true;clearTimeout(timer);pending=null;resolve();
      };
      thisUtterance.onstart=accepted;
      thisUtterance.onend=()=>{
        if(utterance!==thisUtterance)return;
        accepted();
        media.dispatchEvent(new Event("ended"));
      };
      thisUtterance.onerror=event=>{
        if(utterance!==thisUtterance)return;
        utterance=null;clearTimeout(timer);
        if(!settled){settled=true;pending=null;reject(Error(event.error||"Playback unavailable"));}
      };
      pending={resolveOnStart:()=>{if(!settled){settled=true;clearTimeout(timer);reject(Error("Playback cancelled"));}}};
      try{synth.speak(thisUtterance);}catch(e){
        if(!settled){settled=true;clearTimeout(timer);pending=null;reject(e);}
      }
    });
    media.pause=()=>{synth.pause();};
    media.stopVoice=cancel;
    return media;
  }
  function choose(next){
    if(session)return;
    mode=next;
    modeButtons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.mode===mode)));
    openButton.textContent=mode==="exam"?"افتح تجربة المحاكاة ←":"افتح تجربة التدريب ←";
    announce("");
  }
  modeButtons.forEach(button=>button.addEventListener("click",()=>choose(button.dataset.mode)));

  speakerButton.addEventListener("click",()=>{
    if(!voiceAvailable()){
      announce("المتصفح ده مش بيدعم النطق الآلي. جرّب Chrome أو Safari حديث.");
      return;
    }
    window.speechSynthesis.cancel();
    const u=makeUtterance("Speaker test. Can you hear this message?");
    u.rate=0.92;
    u.onstart=()=>announce("الرسالة التجريبية شغالة. لو سمعتها، السماعات جاهزة.");
    u.onerror=()=>announce("الصوت مش شغال. راجع صوت الجهاز أو جرّب متصفح تاني.");
    window.speechSynthesis.speak(u);
    announce("بنجرّب الصوت…");
  });

  openButton.addEventListener("click",()=>{
    if(!voiceAvailable()){
      announce("جهازك مش بيدعم الصوت التجريبي هنا. استخدم Chrome أو Safari حديث.");
      return;
    }
    window.speechSynthesis.cancel();
    if(session){session.destroy();adapter?.stopVoice?.();}
    adapter=createVoiceAdapter();
    root.replaceChildren();
    const number=Number(countSelector.value);
    const questions=demoItems.slice(0,number).map(({id,text,options})=>({id,text,options}));
    session=window.StepListeningUI.mount(root,{
      mode,questions,media:adapter,nativeControls:false,demo:true,
      unlockAudio:()=>window.speechSynthesis.resume(),
      grade:async(answers,runMode)=>{
        if(runMode==="exam")return {accepted:true};
        return {
          transcript:script,
          results:demoItems.slice(0,number).map(item=>({
            id:item.id,selected:answers[item.id],correct:item.correct,
            isCorrect:answers[item.id]===item.correct,
            explanation:item.explanation,
            wrongReason:item.wrongReasons[answers[item.id]]
          }))
        };
      }
    });
    // Intentionally a fresh disposable demo; not a real server-locked exam attempt.
    window.stepListeningDemoSession=session;
    guide.innerHTML='<p class="demo-flag" role="note">دي تجربة محلية مش محفوظة في حسابك. '+
      (mode==="exam"?'بمجرد ما تبدأ المحاكاة هيظهر السؤال والعداد، وبعد انتهاء الوقت هتسمع صوتًا مرة واحدة.':
      'ابدأ التدريب، اسمع الصوت براحتك، جاوب وبعدين افتح السكريبت والتصحيح.')+
      ' <button type="button" class="demo-button secondary" id="demo-reset">غيّر الوضع أو عدد الأسئلة ↻</button></p>';
    guide.querySelector("#demo-reset").addEventListener("click",()=>{
      session?.destroy();
      adapter?.stopVoice?.();
      session=null;adapter=null;
      root.replaceChildren();root.classList.add("demo-hidden");
      config.hidden=false;guide.replaceChildren();
      config.scrollIntoView({block:"start",behavior:"smooth"});
    });
    config.hidden=true;root.classList.remove("demo-hidden");
    root.scrollIntoView({behavior:"smooth",block:"start"});
  });
  window.addEventListener("pagehide",()=>{session?.destroy();adapter?.stopVoice?.();});
})();
