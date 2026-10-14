const DATASET=window.DATA;
const ORDER=DATASET.order,V=DATASET.vocab,D=DATASET.dictionary,IPA=DATASET.ipa,A=DATASET.audio||{},OV=DATASET.sentenceOverrides||{};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let page=1,total=1,au=null,activeBtn=null;

const massWords=new Set(["gum","grass","hair","ink","jam","juice","milk","meat","money","oil","rice","soap","tea","water","yogurt"]);
const pluralWords=new Set(["pants","teeth"]);

function articleFor(word){return /^[aeiou]/i.test(word)?"an":"a"}
function makeExamples(word){
  if(OV[word]) return OV[word];
  if(pluralWords.has(word)) return ["These are "+word+".","I see "+word+".","The "+word+" are here."];
  if(massWords.has(word)) return ["This is "+word+".","I like "+word+".","The "+word+" is here."];
  const a=articleFor(word);
  return ["This is "+a+" "+word+".","I see "+a+" "+word+".","The "+word+" is here."];
}
function highlight(text,word){return text.replace(word,"<mark>"+word+"</mark>")}
function footer(n){
  return '<div class="footer"><span class="fl">FOUNDATION ENGLISH</span><img src="logo.svg" alt="Institute logo"><span class="pn">'+String(n).padStart(2,"0")+'</span></div>';
}
function lessonTheme(letter){
  const i=ORDER.indexOf(letter)%3;
  return i===0?"a":i===1?"b":"c";
}
function letterPage(letter,bookNo){
  const item=IPA[letter],symbol=item[0],type=item[1],example=item[2];
  return '<section class="page lesson" data-letter="'+letter+'">'+
    '<div class="head"><span class="chip">LETTERS</span><span class="series">FOUNDATION</span></div>'+
    '<div class="hero '+lessonTheme(letter)+'">'+
      '<div class="letter"><strong>'+letter+letter.toLowerCase()+'</strong><button class="play letterPlay" data-letter-audio="'+letter+'" aria-label="Play letter '+letter+'">🔊</button></div>'+
      '<div class="sound"><label>'+type+'</label><b>/'+symbol+'/</b><span class="badge">'+(type.includes("VOWEL")?"VOWEL":"CONSONANT")+'</span><small>as in <b>'+example+'</b></small></div>'+
    '</div>'+
    '<div class="section"><b>VOCABULARY</b><span>Tap 🔊 to hear the word and sentences</span></div>'+
    '<div class="content"><div id="v'+letter+'" class="vocab"></div><aside id="d'+letter+'" class="dict"></aside></div>'+
    footer(bookNo)+
  '</section>';
}
function cardHTML(word,emoji){
  const examples=makeExamples(word);
  const rows=examples.map((sentence,i)=>
    '<div class="cardExample"><span class="exNo">'+(i+1)+'</span><p>'+highlight(sentence,word)+'</p><button class="examplePlay" data-sentence="'+encodeURIComponent(sentence)+'" aria-label="Play example sentence">🔊</button></div>'
  ).join("");
  return '<div class="card">'+
    '<div class="emoji">'+emoji+'</div>'+
    '<div class="word"><span>'+word+'</span><button class="play wordPlay" data-word="'+word+'" aria-label="Play '+word+'">🔊</button></div>'+
    '<div class="cardExamples">'+rows+'</div>'+
  '</div>';
}
function buildLessonContent(letter){
  const v=$("#v"+letter),d=$("#d"+letter);
  v.innerHTML=V[letter].map(([w,e])=>cardHTML(w,e)).join("");
  d.innerHTML='<h3>قاموس<span>DICTIONARY</span></h3>'+V[letter].map(([w])=>
    '<div class="de"><span class="ar">'+D[letter][w]+'</span><span class="en">'+w+'</span></div>'
  ).join("");
}
function chunk(arr,size){const out=[];for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));return out}
function wordsForGroup(group){return group.flatMap(L=>V[L].map(([w,e])=>({letter:L,word:w,emoji:e})))}
function otherWords(pool,answer){
  const vals=[];for(const x of pool){if(x.word!==answer&&!vals.includes(x.word))vals.push(x.word);if(vals.length===2)break}return vals;
}
function rotateChoices(answer,others,seed){
  const all=[answer,...others].slice(0,3);
  while(all.length<3)all.push(ORDER[(seed+all.length)%ORDER.length].toLowerCase());
  const shift=seed%all.length;
  return all.slice(shift).concat(all.slice(0,shift));
}
function wordOptions(choices){return choices.map(v=>'<button data-value="'+v+'">'+v+'</button>').join("")}
function pictureOptions(choices,pool){
  return choices.map(v=>{const item=pool.find(x=>x.word===v);return '<button data-value="'+v+'" aria-label="'+v+'">'+(item?item.emoji:v)+'</button>'}).join("");
}
function lettersForGroup(group){
  if(group.length===3)return group;
  if(group.includes("Y"))return ["X","Y","Z"];
  return [group[0],group[1]||"Y","Z"];
}
function reviewQuizPage(group,quizId,bookNo){
  const pool=wordsForGroup(group),qs=[];
  const pictureIndexes=[0,Math.min(6,pool.length-1),Math.min(12,pool.length-1)];
  pictureIndexes.forEach((idx,i)=>{
    const item=pool[idx],choices=rotateChoices(item.word,otherWords(pool,item.word),i+1);
    qs.push({answer:item.word,explain:"The picture shows "+item.word+".",html:
      '<div class="quizPrompt"><span class="quizPic" aria-label="'+item.word+'">'+item.emoji+'</span><div class="qtop"><b>'+(i+1)+'. Choose the correct word.</b><span>1 point</span></div></div>'+
      '<div class="options">'+wordOptions(choices)+'</div>'
    });
  });
  group.forEach((L,idx)=>{
    const item=V[L][Math.min(idx+1,V[L].length-1)],word=item[0];
    const pos=L==="X"?word.toLowerCase().lastIndexOf("x"):0;
    const blank=word.slice(0,pos)+"_"+word.slice(pos+1);
    const letters=lettersForGroup(group);
    const choices=rotateChoices(L.toLowerCase(),letters.filter(x=>x!==L).map(x=>x.toLowerCase()),idx+2);
    const qn=qs.length+1;
    qs.push({answer:L.toLowerCase(),explain:(L==="X"?"The missing letter is X.":word+" begins with "+L+"."),html:
      '<div class="qtop"><b>'+qn+'. Complete: '+blank+'</b><span>1 point</span></div>'+
      '<div class="options letterOptions">'+choices.map(x=>'<button data-value="'+x+'">'+x.toUpperCase()+'</button>').join("")+'</div>'
    });
  });
  while(qs.length<6){
    const item=pool[qs.length%pool.length],L=item.letter,qn=qs.length+1,letters=lettersForGroup(group);
    const choices=rotateChoices(L.toLowerCase(),letters.filter(x=>x!==L).map(x=>x.toLowerCase()),qs.length);
    qs.push({answer:L.toLowerCase(),explain:item.word+" uses the target letter "+L+".",html:
      '<div class="qtop"><b>'+qn+'. Which target letter goes with '+item.word+'?</b><span>1 point</span></div>'+
      '<div class="options letterOptions">'+choices.map(x=>'<button data-value="'+x+'">'+x.toUpperCase()+'</button>').join("")+'</div>'
    });
  }
  return quizShell(group.join("–")+" Review","Use the pictures, words, and letters you learned.",quizId,qs,bookNo,"ACTIVITIES");
}
function listeningQuizPage(group,quizId,bookNo){
  const pool=wordsForGroup(group),qs=[];
  const idxs=[0,Math.min(7,pool.length-1),Math.min(13,pool.length-1),Math.min(3,pool.length-1),Math.min(10,pool.length-1),pool.length-1];
  idxs.forEach((idx,i)=>{
    const item=pool[idx],qn=i+1;
    if(i===1||i===4){
      const choices=rotateChoices(item.word,otherWords(pool,item.word),i+1);
      qs.push({answer:item.word,explain:"You heard the word "+item.word+".",html:
        '<div class="listenTop"><button class="listenQ" data-listen="'+item.word+'" aria-label="Play question audio">🔊 <span>Listen</span></button><div class="qtop"><b>'+qn+'. Choose the picture you hear.</b><span>1 point</span></div></div>'+
        '<div class="options pictureOptions">'+pictureOptions(choices,pool)+'</div>'
      });
    }else if(i===2||i===5){
      const letters=lettersForGroup(group);
      const choices=rotateChoices(item.letter.toLowerCase(),letters.filter(x=>x!==item.letter).map(x=>x.toLowerCase()),i+2);
      const wording=item.letter==="X"?"Which target letter is in the word you hear?":"Which letter does the word begin with?";
      qs.push({answer:item.letter.toLowerCase(),explain:item.word+" uses the target letter "+item.letter+".",html:
        '<div class="listenTop"><button class="listenQ" data-listen="'+item.word+'" aria-label="Play question audio">🔊 <span>Listen</span></button><div class="qtop"><b>'+qn+'. '+wording+'</b><span>1 point</span></div></div>'+
        '<div class="options letterOptions">'+choices.map(x=>'<button data-value="'+x+'">'+x.toUpperCase()+'</button>').join("")+'</div>'
      });
    }else{
      const choices=rotateChoices(item.word,otherWords(pool,item.word),i+3);
      qs.push({answer:item.word,explain:"You heard the word "+item.word+".",html:
        '<div class="listenTop"><button class="listenQ" data-listen="'+item.word+'" aria-label="Play question audio">🔊 <span>Listen</span></button><div class="qtop"><b>'+qn+'. Choose the word you hear.</b><span>1 point</span></div></div>'+
        '<div class="options">'+wordOptions(choices)+'</div>'
      });
    }
  });
  return quizShell(group.join("–")+" Listening","Tap Listen, hear the word, then choose your answer.",quizId,qs,bookNo,"LISTENING");
}
function quizShell(title,subtitle,quizId,questions,bookNo,chip){
  return '<section class="page practice quizPage '+(chip==="LISTENING"?"listeningPage":"")+'">'+
    '<div class="head"><span class="chip practice">'+chip+'</span><span class="series">FOUNDATION</span></div>'+
    '<div class="quizHeader"><div><span class="quizNum">'+quizId+'</span><div><h2>'+title+'</h2><p>'+subtitle+'</p></div></div><div class="scoreBox"><small>SCORE</small><strong id="score'+quizId+'">— / '+questions.length+'</strong></div></div>'+
    '<div class="quizList" data-quiz="'+quizId+'">'+questions.map(q=>
      '<div class="quizq" data-answer="'+q.answer+'" data-explain="'+q.explain.replace(/"/g,"&quot;")+'">'+q.html+'<div class="qfeedback"></div></div>'
    ).join("")+'</div>'+
    '<div class="quizActions"><button class="checkQuiz" data-target="'+quizId+'">Check answers</button><button class="resetQuiz" data-target="'+quizId+'">Try again</button></div>'+
    footer(bookNo)+
  '</section>';
}
function buildBook(){
  const book=$("#book");
  const groups=chunk(ORDER,3);
  let bookNo=1,quizId=1;
  groups.forEach(g=>{
    g.forEach(L=>book.insertAdjacentHTML("beforeend",letterPage(L,bookNo++)));
    book.insertAdjacentHTML("beforeend",reviewQuizPage(g,quizId++,bookNo++));
    book.insertAdjacentHTML("beforeend",listeningQuizPage(g,quizId++,bookNo++));
  });
  $(".page").forEach((p,i)=>p.dataset.page=i+1);
  total=$(".page").length;
  ORDER.forEach(buildLessonContent);
}
window.addEventListener("error",()=>{const s=document.querySelector("#splash");if(s)s.classList.add("hide")});
buildBook();

function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>e.classList.remove("show"),1400)}
function stop(){
  if(au){au.pause();try{au.currentTime=0}catch(e){}}
  if(activeBtn)activeBtn.classList.remove("playing");
  au=null;activeBtn=null;
  if("speechSynthesis" in window)speechSynthesis.cancel();
}
function speak(text,b,rate=.8){
  stop();
  if(!("speechSynthesis" in window)){toast("Audio unavailable");return}
  const u=new SpeechSynthesisUtterance(text);
  u.lang="en-US";u.rate=rate;u.pitch=1;
  activeBtn=b;b.classList.add("playing");
  u.onend=()=>{b.classList.remove("playing");activeBtn=null};
  u.onerror=()=>{b.classList.remove("playing");activeBtn=null};
  speechSynthesis.speak(u);
}
function playWord(key,b){
  stop();
  const url=A[key];
  if(!url){speak(key,b,key.length===1?.72:.8);return}
  b.classList.add("playing");activeBtn=b;
  const u=new Audio(url);au=u;
  u.onended=()=>{b.classList.remove("playing");au=null;activeBtn=null};
  u.onerror=()=>speak(key,b,key.length===1?.72:.8);
  u.play().catch(()=>speak(key,b,key.length===1?.72:.8));
}
$$(".letterPlay").forEach(b=>b.onclick=()=>playWord(b.dataset.letterAudio,b));
$$(".wordPlay").forEach(b=>b.onclick=()=>playWord(b.dataset.word,b));
$$(".examplePlay").forEach(b=>b.onclick=()=>speak(decodeURIComponent(b.dataset.sentence),b,.78));
$$(".listenQ").forEach(b=>b.onclick=()=>playWord(b.dataset.listen,b));

function selectOption(button){
  const q=button.closest(".quizq");
  q.querySelectorAll(".options button").forEach(x=>x.classList.remove("selected"));
  button.classList.add("selected");
  q.dataset.selected=button.dataset.value;
  q.classList.remove("graded");
  q.querySelector(".qfeedback").textContent="";
}
$$(".options button").forEach(b=>b.addEventListener("click",()=>selectOption(b)));

function gradeQuiz(id){
  const list=document.querySelector('.quizList[data-quiz="'+id+'"]');
  const qs=[...list.querySelectorAll(".quizq")];
  let score=0;
  qs.forEach(q=>{
    const chosen=q.dataset.selected||"",correct=q.dataset.answer;
    q.classList.add("graded");
    q.querySelectorAll(".options button").forEach(b=>{
      b.classList.remove("correct","wrong");
      if(b.dataset.value===correct)b.classList.add("correct");
      if(chosen&&b.dataset.value===chosen&&chosen!==correct)b.classList.add("wrong");
    });
    const fb=q.querySelector(".qfeedback");
    if(chosen===correct){score++;fb.innerHTML="<b>Correct • 1/1</b> — "+q.dataset.explain}
    else if(!chosen){fb.innerHTML="<b>Not answered • 0/1</b> — Correct answer: "+correct+"."}
    else{fb.innerHTML="<b>Try again • 0/1</b> — "+q.dataset.explain}
  });
  $("#score"+id).textContent=score+" / "+qs.length;
  localStorage.setItem("foundation:quiz"+id,JSON.stringify({score,total:qs.length,answered:true}));
  toast("Score: "+score+" / "+qs.length);
}
function resetQuiz(id){
  const list=document.querySelector('.quizList[data-quiz="'+id+'"]');
  list.querySelectorAll(".quizq").forEach(q=>{
    delete q.dataset.selected;q.classList.remove("graded");
    q.querySelectorAll(".options button").forEach(b=>b.classList.remove("selected","correct","wrong"));
    q.querySelector(".qfeedback").textContent="";
  });
  $("#score"+id).textContent="— / "+list.querySelectorAll(".quizq").length;
  localStorage.removeItem("foundation:quiz"+id);
}
$$(".checkQuiz").forEach(b=>b.onclick=()=>gradeQuiz(b.dataset.target));
$$(".resetQuiz").forEach(b=>b.onclick=()=>resetQuiz(b.dataset.target));
$$(".quizList").forEach(list=>{
  const id=list.dataset.quiz;
  try{
    const saved=JSON.parse(localStorage.getItem("foundation:quiz"+id));
    if(saved&&saved.answered)$("#score"+id).textContent=saved.score+" / "+saved.total;
  }catch(e){}
});

function show(n){
  stop();page=Math.max(1,Math.min(total,n));
  $$(".page").forEach(p=>p.classList.toggle("active",Number(p.dataset.page)===page));
  $("#count").textContent=page+" / "+total;
  $("#prev").disabled=page===1;$("#next").disabled=page===total;
  localStorage.setItem("foundation:lastPage",page);
  history.replaceState(null,"","#"+page);
  scrollTo({top:0,behavior:"smooth"});
}
$("#prev").onclick=()=>show(page-1);$("#next").onclick=()=>show(page+1);
addEventListener("keydown",e=>{if(e.key==="ArrowRight")show(page+1);if(e.key==="ArrowLeft")show(page-1)});
const hp=Number(location.hash.slice(1)),sp=Number(localStorage.getItem("foundation:lastPage"))||1;
show(hp||sp);

function net(){const e=$("#net");e.classList.toggle("off",!navigator.onLine);e.title=navigator.onLine?"Online":"Offline"}
addEventListener("online",net);addEventListener("offline",net);net();

$("#full").onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){toast("Full screen unavailable")}};
let installPrompt=null;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("#install").style.background="#e8f7f5"});
addEventListener("appinstalled",()=>{installPrompt=null;toast("Installed")});
$("#install").onclick=async()=>{
  if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  $("#helpText").innerHTML=ios?'Tap <b>Share</b> then <b>Add to Home Screen</b>.':'Open the browser menu and choose <b>Install app</b> or <b>Add to Home Screen</b>.';
  $("#help").hidden=false;
};
$("#closeHelp").onclick=()=>$("#help").hidden=true;
$("#help").onclick=e=>{if(e.target.id==="help")e.currentTarget.hidden=true};

let sx=null,sy=null;
addEventListener("touchstart",e=>{
  if(e.target.closest(".options,.cardExample,.quizActions,.listenQ"))return;
  sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY;
},{passive:true});
addEventListener("touchend",e=>{
  if(sx===null)return;
  const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
  if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4)show(dx<0?page+1:page-1);
  sx=sy=null;
},{passive:true});

addEventListener("load",()=>setTimeout(()=>$("#splash").classList.add("hide"),350));
if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("./service-worker.js").catch(()=>{});