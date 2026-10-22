"use strict";
// Shared navigation for authenticated STEP administration pages. Never contains source questions or answer keys.
(()=> {
 const routes=[
  ["الرئيسية","./","home","⌂"],
  ["تعديل الدروس","studio.html","studio","✎"],
  ["الطلاب","./#students","students","♙"],
  ["التقارير","reports.html","reports","▤"],
  ["ترتيب المنهج","curriculum.html","curriculum","☷"],
  ["الفيديوهات","videos.html?indicator=subject-verb-agreement","videos","▷"],
  ["تدقيق المصادر","sources.html","sources","✓"],
  ["مسودات جديدة","courses.html","drafts","＋"]
 ];
 const current=()=>{
  const p=location.pathname.split("/").at(-1)||"index.html";
  if(p==="index.html")return location.hash==="#students"?"students":"home";
  if(p==="studio.html"||p==="continuous-preview.html")return "studio";
  if(p==="courses.html")return "drafts";
  if(p==="curriculum.html"||p==="guide.html")return "curriculum";
  if(p==="videos.html")return "videos";
  if(p==="reports.html")return "reports";
  if(["sources.html","agreement-audit.html","continuous-audit.html"].includes(p))return "sources";
  return "home";
 };
 function paint(){
  let nav=document.getElementById("admin-global-navigation");
  if(!nav){
   nav=document.createElement("nav");nav.id="admin-global-navigation";
   nav.className="admin-global-nav";nav.setAttribute("aria-label","التنقل الرئيسي في لوحة الأدمن");
   const header=document.querySelector("body > header");
   if(header)header.insertAdjacentElement("afterend",nav);
   else document.body.prepend(nav);
  }
  const active=current();
  nav.innerHTML='<div class="admin-global-nav__inner">'+routes.map(([label,url,id,symbol])=>
   '<a href="'+url+'"'+(active===id?' aria-current="page"':'')+'><span class="admin-global-nav__icon" aria-hidden="true">'+symbol+'</span>'+label+'</a>'
  ).join("")+'</div>';
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",paint);
 else paint();
 window.addEventListener("hashchange",paint);
})();
