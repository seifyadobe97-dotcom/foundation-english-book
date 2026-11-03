"use strict";
(function(A){
 A.render=function(){
  const raw=location.hash.replace(/^#\/?/,"");
  const parts=raw.split("?"),path=parts[0].split("/");
  const role=path[0]==="admin"?"admin":"student";
  const page=path[1]||"dashboard";
  A.ui.role=role;A.ui.page=page;A.ui.params=new URLSearchParams(parts[1]||"");
  document.querySelectorAll("[data-role]").forEach(el=>el.setAttribute("aria-pressed",String(el.dataset.role===role)));
  document.getElementById("sideTitle").textContent=role==="admin"?"ADMIN CONTROL CENTER":"STUDENT EXPERIENCE";
  document.getElementById("sideNav").innerHTML=A.menus[role].map(([id,label])=>'<button class="side-link '+(id===page?'active':'')+'" data-go="'+role+'/'+id+'">'+A.esc(label)+'</button>').join("");
  document.getElementById("sideInfo").textContent=role==="admin"?"إدارة تجريبية معزولة عن الحسابات الحقيقية.":A.current().name+" · "+A.activeText();
  document.getElementById("root").innerHTML=role==="admin"?A.adminRender(page,A.ui.params):A.studentRender(page,A.ui.params);
 };

 document.addEventListener("click",event=>{
  const role=event.target.closest("[data-role]");
  if(role){A.cleanupAudio();A.go(role.dataset.role+"/dashboard");return;}
  const to=event.target.closest("[data-go]");
  if(to){A.cleanupAudio();A.go(to.dataset.go);return;}
  const el=event.target.closest("[data-act]");
  if(el)try{
   const run=A.ui.role==="admin"?A.adminAction:A.studentAction;
   run(el.dataset.act,el);
  }catch(err){A.toast(err.message,true);}
 });
 document.addEventListener("change",event=>{
  const el=event.target;
  if(el.matches("[data-answer-context]")){
   const c=el.dataset.answerContext;
   const target=c==="lesson"?A.ui.lessonAnswers:c==="bank"?A.ui.bankAnswers:A.ui.examAnswers;
   target[el.name]=Number(el.value);return;
  }
  const run=A.ui.role==="admin"?A.adminChange:A.studentChange;run?.(el);
 });
 document.addEventListener("submit",event=>{
  const form=event.target;if(!form.matches("form[data-demo-form]"))return;
  event.preventDefault();
  try{const submit=A.ui.role==="admin"?A.adminSubmit:A.studentSubmit;submit?.(form.dataset.demoForm,form)}
  catch(err){A.toast(err.message,true);}
 });
 window.addEventListener("hashchange",()=>{A.cleanupAudio();A.render();});
 document.getElementById("homeBrand").onclick=()=>A.go(A.ui.role+"/dashboard");
 document.addEventListener("DOMContentLoaded",()=>{
  if(!location.hash)location.hash="#/student/dashboard";
  A.render();A.save();window.STEP_SHOWCASE_READY=true;
 });
})(window.Showcase);