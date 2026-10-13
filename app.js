const V=DATA.vocab,D=DATA.dictionary,A=DATA.audio,S=DATA.sentences;
let page=1,au=null,btn=null;
const total=6,$=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);

function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>e.classList.remove('show'),1400)}
function stop(){if(au){au.pause();try{au.currentTime=0}catch(e){}}if(btn)btn.classList.remove('playing');au=null;btn=null;if('speechSynthesis'in window)speechSynthesis.cancel()}
function fallback(k,b){b.classList.remove('playing');if(!('speechSynthesis'in window)){toast('Audio unavailable');return}const u=new SpeechSynthesisUtterance(k);u.lang='en-US';u.rate=.82;u.onend=()=>b.classList.remove('playing');b.classList.add('playing');speechSynthesis.cancel();speechSynthesis.speak(u)}
function play(k,b){stop();b.classList.add('playing');btn=b;if(!A[k]){speak(k,b);return}const u=new Audio(A[k]);au=u;u.onended=()=>{b.classList.remove('playing');au=null;btn=null};u.onerror=()=>fallback(k,b);u.play().catch(()=>fallback(k,b))}
function speak(text,b){stop();if(!('speechSynthesis'in window)){toast('Sentence audio unavailable');return}const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.78;u.pitch=1;btn=b;b.classList.add('playing');u.onend=()=>{b.classList.remove('playing');btn=null};u.onerror=()=>{b.classList.remove('playing');btn=null};speechSynthesis.speak(u)}

function build(L){
  const v=$('#v'+L),d=$('#d'+L),s=$('#s'+L);
  v.innerHTML='';
  d.innerHTML='<h3>قاموس<span>DICTIONARY</span></h3>';
  V[L].forEach(([w,e])=>{
    const c=document.createElement('div');c.className='card';
    c.innerHTML='<div class="emoji">'+e+'</div><div class="word"><span>'+w+'</span></div>';
    const b=document.createElement('button');b.className='play';b.textContent='🔊';b.setAttribute('aria-label','Play '+w);
    b.onclick=()=>play(w,b);c.querySelector('.word').appendChild(b);v.appendChild(c);
    const r=document.createElement('div');r.className='de';r.innerHTML='<span class="ar">'+D[L][w]+'</span><span class="en">'+w+'</span>';d.appendChild(r);
  });
  s.innerHTML='';
  S[L].forEach((item,i)=>{
    const row=document.createElement('div');row.className='sentenceRow';
    const highlighted=item.text.replace(new RegExp('\\b'+item.word+'\\b','i'),m=>'<mark>'+m+'</mark>');
    row.innerHTML='<span class="sentenceNo">'+(i+1)+'</span><p>'+highlighted+'</p>';
    const b=document.createElement('button');b.className='sentencePlay';b.textContent='🔊';b.setAttribute('aria-label','Play sentence');
    b.onclick=()=>speak(item.text,b);row.appendChild(b);s.appendChild(row);
  });
}
['A','B','C'].forEach(build);
$$('[data-audio]').forEach(b=>b.onclick=()=>play(b.dataset.audio,b));

function selectOption(button){
  const q=button.closest('.quizq');
  q.querySelectorAll('.options button').forEach(x=>x.classList.remove('selected'));
  button.classList.add('selected');
  q.dataset.selected=button.dataset.value;
  q.classList.remove('graded');
  q.querySelector('.qfeedback').textContent='';
}
$$('.options button').forEach(b=>b.addEventListener('click',()=>selectOption(b)));

function gradeQuiz(id){
  const list=document.querySelector('.quizList[data-quiz="'+id+'"]');
  const qs=[...list.querySelectorAll('.quizq')];
  let score=0;
  qs.forEach(q=>{
    const chosen=q.dataset.selected||'';
    const correct=q.dataset.answer;
    q.classList.add('graded');
    q.querySelectorAll('.options button').forEach(b=>{
      b.classList.remove('correct','wrong');
      if(b.dataset.value===correct)b.classList.add('correct');
      if(chosen && b.dataset.value===chosen && chosen!==correct)b.classList.add('wrong');
    });
    const fb=q.querySelector('.qfeedback');
    if(chosen===correct){score++;fb.innerHTML='<b>Correct • 1/1</b> — '+q.dataset.explain}
    else if(!chosen){fb.innerHTML='<b>Not answered • 0/1</b> — Correct answer: '+correct+'.'}
    else{fb.innerHTML='<b>Try again • 0/1</b> — '+q.dataset.explain}
  });
  $('#score'+id).textContent=score+' / '+qs.length;
  localStorage.setItem('foundation:quiz'+id,JSON.stringify({score,total:qs.length,answered:true}));
  toast('Score: '+score+' / '+qs.length);
}
function resetQuiz(id){
  const list=document.querySelector('.quizList[data-quiz="'+id+'"]');
  list.querySelectorAll('.quizq').forEach(q=>{
    delete q.dataset.selected;q.classList.remove('graded');
    q.querySelectorAll('.options button').forEach(b=>b.classList.remove('selected','correct','wrong'));
    q.querySelector('.qfeedback').textContent='';
  });
  $('#score'+id).textContent='— / '+list.querySelectorAll('.quizq').length;
  localStorage.removeItem('foundation:quiz'+id);
}
$$('.checkQuiz').forEach(b=>b.onclick=()=>gradeQuiz(b.dataset.target));
$$('.resetQuiz').forEach(b=>b.onclick=()=>resetQuiz(b.dataset.target));
['1','2'].forEach(id=>{try{const x=JSON.parse(localStorage.getItem('foundation:quiz'+id));if(x&&x.answered)$('#score'+id).textContent=x.score+' / '+x.total}catch(e){}});

function show(n){
  stop();page=Math.max(1,Math.min(total,n));
  $$('.page').forEach(p=>p.classList.toggle('active',Number(p.dataset.page)===page));
  $('#count').textContent=page+' / '+total;$('#prev').disabled=page===1;$('#next').disabled=page===total;
  localStorage.setItem('foundation:lastPage',page);history.replaceState(null,'','#'+page);scrollTo({top:0,behavior:'smooth'});
}
$('#prev').onclick=()=>show(page-1);$('#next').onclick=()=>show(page+1);
addEventListener('keydown',e=>{if(e.key==='ArrowRight')show(page+1);if(e.key==='ArrowLeft')show(page-1)});
const hp=Number(location.hash.slice(1)),sp=Number(localStorage.getItem('foundation:lastPage'))||1;show(hp||sp);

function net(){const e=$('#net');e.classList.toggle('off',!navigator.onLine);e.title=navigator.onLine?'Online':'Offline'}
addEventListener('online',net);addEventListener('offline',net);net();
$('#full').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){toast('Full screen unavailable')}};
let prompt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;$('#install').style.background='#e8f7f5'});
addEventListener('appinstalled',()=>{prompt=null;toast('Installed')});
$('#install').onclick=async()=>{if(prompt){prompt.prompt();await prompt.userChoice;prompt=null;return}const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);$('#helpText').innerHTML=ios?'Tap <b>Share</b> then <b>Add to Home Screen</b>.':'Open the browser menu and choose <b>Install app</b> or <b>Add to Home Screen</b>.';$('#help').hidden=false};
$('#closeHelp').onclick=()=>$('#help').hidden=true;$('#help').onclick=e=>{if(e.target.id==='help')e.currentTarget.hidden=true};

let x=null,y=null;
addEventListener('touchstart',e=>{if(e.target.closest('.options,.sentenceRow,.quizActions'))return;x=e.changedTouches[0].clientX;y=e.changedTouches[0].clientY},{passive:true});
addEventListener('touchend',e=>{if(x===null)return;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4)show(dx<0?page+1:page-1);x=y=null},{passive:true});
addEventListener('load',()=>setTimeout(()=>$('#splash').classList.add('hide'),350));
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});