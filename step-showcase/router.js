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
})(window.Showcase);