"use strict";
/**
 * STEP Listening group-level player state machine.
 * No source audio, answers, transcripts or credentials are bundled here.
 * A server MUST authorize session creation, clip access, attempts and grading.
 *
 * Practice: unlimited replay; transcript + answer review only after grading.
 * Simulation: 15 s per visible question, automatic first play, no app replay.
 * Browser controls alone cannot prevent copying audio outside the web app.
 */
(function (global) {
  const CHOICES=["A","B","C","D"];
  const DEFAULT_CLOCK={
    now:()=>Date.now(),
    every:(fn,ms)=>setInterval(fn,ms),
    stop:id=>clearInterval(id)
  };
  class ListeningSession {
    constructor(options) {
      if(!options||!["practice","exam"].includes(options.mode))
        throw Error("Listening mode must be practice or exam");
      if(!Array.isArray(options.questions)||options.questions.length<1||options.questions.length>10)
        throw Error("A listening group needs 1-10 visible questions");
      if(!options.media||typeof options.media.play!=="function")
        throw Error("Listening player requires a media adapter");
      this.mode=options.mode;
      this.questions=options.questions.map(q=>({
        id:q.id,text:q.text,options:{A:q.options?.A,B:q.options?.B,C:q.options?.C,D:q.options?.D}
      }));
      const ids=this.questions.map(q=>q.id);
      if(ids.some(id=>!id)||new Set(ids).size!==ids.length||
        this.questions.some(q=>CHOICES.some(c=>typeof q.options[c]!=="string")))
        throw Error("Listening questions must have unique IDs and four choices");
      this.secondsPerQuestion=Number(options.secondsPerQuestion??15);
      if(!Number.isFinite(this.secondsPerQuestion)||this.secondsPerQuestion<=0)
        throw Error("Invalid reading duration");
      this.clock=options.clock||DEFAULT_CLOCK;
      this.media=options.media;
      this.onChange=options.onChange||(()=>{});
      this.onEvent=options.onEvent||(()=>{});
      this.grade=options.grade;
      this.phase="ready";
      this.playCount=0;
      this.answers={};
      this.review=null;
      this.readingEndsAt=null;
      this.timer=null;
      this.busy=false;
      this.error="";
      this.examPlaybackRequested=false;
      this.attempt=options.attempt||null;
      if(this.media.addEventListener)
        this.media.addEventListener("ended",()=>this.audioEnded());
      if(this.mode==="exam"){
        if("controls" in this.media)this.media.controls=false;
        if("playbackRate" in this.media)this.media.playbackRate=1;
        // Restoring an unfinished exam must never rewind a previously started clip.
        if(this.attempt?.submitted||this.attempt?.status==="submitted"){
          this.phase="finished";this.playCount=this.attempt.audioStarted?1:0;
        }else if(this.attempt?.audioStarted){
          this.phase="answering";this.playCount=1;
        }else if(Number.isFinite(this.attempt?.readingEndsAtMs)){
          this.readingEndsAt=this.attempt.readingEndsAtMs;
          this.phase="reading";
          this.scheduleCountdown();
        }
      }
      this.emit();
    }
    get readingSeconds(){return this.secondsPerQuestion*this.questions.length;}
    get secondsRemaining(){
      return this.phase==="reading"&&this.readingEndsAt!==null?
        Math.max(0,Math.ceil((this.readingEndsAt-this.clock.now())/1000)):0;
    }
    snapshot(){
      return {
        mode:this.mode,phase:this.phase,questionCount:this.questions.length,
        readingSeconds:this.readingSeconds,secondsRemaining:this.secondsRemaining,
        playCount:this.playCount,answers:{...this.answers},
        review:this.mode==="practice"&&this.phase==="review"?this.review:null,
        error:this.error,busy:this.busy,questions:this.questions.map(q=>({
          id:q.id,text:q.text,options:{...q.options}
        }))
      };
    }
    emit(){this.onChange(this.snapshot());}
    log(name){try{this.onEvent(name,this.snapshot());}catch{}}
    stopCountdown(){if(this.timer!==null){this.clock.stop(this.timer);this.timer=null;}}
    scheduleCountdown(){
      this.stopCountdown();
      this.timer=this.clock.every(()=>this.tick(),100);
    }
    // A real exam starts only after signed media is ready; the API controls persistence.
    start(){
      if(this.phase!=="ready")return false;
      if(this.mode==="practice"){
        this.phase="answering";
        this.log("practice_started");
      }else{
        this.readingEndsAt=this.clock.now()+this.readingSeconds*1000;
        this.phase="reading";
        this.log("reading_started");
        this.scheduleCountdown();
      }
      this.emit();
      return true;
    }
    tick(){
      if(this.phase!=="reading")return;
      if(this.clock.now()>=this.readingEndsAt){
        this.stopCountdown();
        this.playExamAudio();
      }else this.emit();
    }
    async playExamAudio(){
      if(this.mode!=="exam"||this.playCount>0||this.examPlaybackRequested||
        !["reading","blocked"].includes(this.phase))return false;
      if(this.phase==="reading"&&this.secondsRemaining>0)return false;
      this.examPlaybackRequested=true;
      this.phase="starting";this.error="";this.emit();
      try{
        await this.media.play();
        // The first *successful* play consumes the single allowed in-app play.
        this.playCount=1;
        this.phase="playing";
        this.log("exam_audio_started");
        this.emit();
        return true;
      }catch(error){
        this.examPlaybackRequested=false;
        this.phase="blocked";
        this.error="المتصفح منع تشغيل الصوت تلقائيًا. اضغط تشغيل الصوت مرة واحدة؛ العداد مش هيبدأ من جديد.";
        this.log("autoplay_blocked");
        this.emit();
        return false;
      }
    }
    // The fallback exists only when autoplay was blocked before any sound started.
    resumeBlockedAudio(){
      return this.phase==="blocked"&&this.playCount===0?this.playExamAudio():Promise.resolve(false);
    }
    async playPracticeAudio(){
      if(this.mode!=="practice"||!["answering","review"].includes(this.phase))return false;
      // Replay, seeking and pausing are intentionally permitted in training.
      try{
        if("currentTime" in this.media)this.media.currentTime=0;
        await this.media.play();
        this.playCount++;
        this.log("practice_audio_played");
        this.emit();
        return true;
      }catch{
        this.error="الصوت مش قادر يشتغل. اتأكد من الاتصال أو اضغط تشغيل مرة تانية.";
        this.emit();return false;
      }
    }
    pausePracticeAudio(){
      if(this.mode!=="practice"||!["answering","review"].includes(this.phase))return false;
      this.media.pause?.();this.emit();return true;
    }
    audioEnded(){
      if(this.mode==="exam"&&this.phase==="playing"){
        this.phase="answering";
        this.log("exam_audio_finished");
        this.emit();
      }
    }
    answer(id,choice){
      const allowed=this.mode==="practice"?["answering","review"]:["playing","answering"];
      if(!allowed.includes(this.phase)||!this.questions.some(q=>q.id===id)||!CHOICES.includes(choice)||
         this.phase==="review")return false;
      this.answers[id]=choice;this.emit();return true;
    }
    async submit(){
      if(!["playing","answering"].includes(this.phase)||this.busy)return false;
      if(this.questions.some(q=>!CHOICES.includes(this.answers[q.id]))){
        this.error="جاوب على كل الأسئلة الأول.";this.emit();return false;
      }
      if(typeof this.grade!=="function")throw Error("Authenticated grading adapter required");
      this.busy=true;this.error="";this.emit();
      try{
        const response=await this.grade({...this.answers},this.mode);
        if(this.mode==="practice"){
          // The server sends the transcript and explanations ONLY after marking.
          this.review={
            transcript:String(response?.transcript||""),
            results:Array.isArray(response?.results)?response.results:[]
          };
          this.phase="review";
        }else{
          // The exam endpoint must return only acceptance; no transcript, keys or hints.
          this.review=null;
          this.phase="finished";
        }
        this.log("answers_submitted");
        return true;
      }catch(e){
        this.error="تعذر تسجيل الإجابات. اتأكد من الاتصال قبل إعادة الإرسال.";
        return false;
      }finally{this.busy=false;this.emit();}
    }
    destroy(){this.stopCountdown();this.media.pause?.();}
  }
  global.StepListeningSession=ListeningSession;
  if(typeof module!=="undefined"&&module.exports)module.exports={ListeningSession};
})(typeof window!=="undefined"?window:globalThis);
