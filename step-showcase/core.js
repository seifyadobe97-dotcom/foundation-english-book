"use strict";
(function(){
 const seed=window.STEP_SHOWCASE_SEED;
 const cloned=()=>JSON.parse(JSON.stringify(seed));
 let db;try{db=JSON.parse(localStorage.getItem("step-seify-showcase-v1")||"null")}catch{}
 if(!db||db.version!==seed.version)db=cloned();
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const A=window.Showcase={
  seed,db,esc,
  ui:{role:"student",page:"dashboard",params:new URLSearchParams(),lessonAnswers:{},lessonResult:null,bankAnswers:{},bankResult:null,bankAxis:"grammar",bankMode:"practice",bankPage:0,examAnswers:{},examResult:null,audio:null},
  menus:{
   student:[["dashboard","لوحة الطالب"],["lesson","الدرس الأول"],["bank","بنك الأسئلة"],["exam","اختبار المحاكاة"],["subscription","اشتراكي"],["profile","حسابي وتقدمي"]],
   admin:[["dashboard","نظرة عامة"],["curriculum","إدارة الدرس"],["questions","بنك الأسئلة"],["accounts","الطلاب والحسابات"],["subscriptions","الاشتراكات والباقات"],["reports","الدرجات والتقارير"],["settings","إعدادات الديمو"]]
  },
  save(){try{localStorage.setItem("step-seify-showcase-v1",JSON.stringify(A.db))}catch{}},
  current(){return A.db.users.find(u=>u.id===A.db.selectedUser)||A.db.users[0]},
  plan(id){return A.db.plans.find(p=>p.id===id)},
  today(){return new Date().toISOString().slice(0,10)},
  addDays(d,from){const date=new Date((from||A.today())+"T12:00:00");date.setDate(date.getDate()+Number(d));return date.toISOString().slice(0,10)},
  allowed(user){return user.status==="active"&&(!A.db.settings.requireSubscription||(!!A.plan(user.plan)&&user.expiry>=A.today()))},
  progress(id){return A.db.progress[id]??=( {passed:{},final:null} )},
  done(id){return Object.keys(A.progress(id).passed).filter(k=>A.progress(id).passed[k]).length},
  unlocked(index,id){return index===0||!!A.progress(id).passed[index-1]},
  questions(axis,stage){return A.db.questions.filter(q=>q.status==="published"&&(!axis||q.axis===axis)&&(stage==null||q.stage===stage))},
  badge(label,tone=""){return '<span class="badge '+tone+'">'+esc(label)+'</span>'},
  percent(n,t){return t?Math.round(n*100/t):0},
  go(path,params={}){const q=new URLSearchParams(params);const hash="#/"+path+(q.size?"?"+q.toString():"");if(location.hash===hash)A.render();else location.hash=hash},
  head(title,subtitle=""){return '<div class="overview-top"><div><div class="eyebrow">STEP WITH SEIFY</div><h1>'+title+'</h1><p class="lead">'+subtitle+'</p></div></div>'},
  toast(message,error=false){const t=document.getElementById("toast");t.textContent=message;t.classList.toggle("error",error);t.hidden=false;clearTimeout(A.toastTimer);A.toastTimer=setTimeout(()=>t.hidden=true,3500)},
  log(text){A.db.log.unshift({action:text,date:new Date().toISOString()});A.db.log=A.db.log.slice(0,120);A.save()},
  cleanupAudio(){if(A.ui.audio?.timer)clearInterval(A.ui.audio.timer);try{speechSynthesis.cancel()}catch{}A.ui.audio=null}
 };
 window.STEP_SHOWCASE_CORE=true;
})();