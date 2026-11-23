import {questions,memories,dinnerPrompts} from './content.mjs?v=chapter10c';
import {initialState,restore,answer,visit,canOpenLetter,score} from './core.mjs?v=chapter10c';
import {initScene} from './scene.mjs?v=scene11d';
import {startGame} from './game.mjs';
import {createQuizAdvance} from './quiz-flow.mjs?v=chapter10c';
import {optionArt,quizScene} from './quiz-art.mjs?v=chapter10c';
const $=s=>document.querySelector(s);let state=initialState(),photos=[],localPhotos=[],lastFocus,cleanup,view='';
const storageKey='franklin-save-v1';try{state=restore(localStorage.getItem(storageKey));}catch{}
const modal=$('#modal'),content=$('#modal-content');
let activeScreen='cover',quizAuto=true;
function goScreen(name){
 const next=document.querySelector('[data-screen="'+name+'"]');if(!next)return;
 document.querySelectorAll('[data-screen]').forEach(el=>el.hidden=el!==next);activeScreen=name;
 document.querySelectorAll('[data-go]').forEach(el=>el.setAttribute('aria-current',el.dataset.go===name?'page':'false'));
 $('#screen-position').textContent=({cover:'HOME / NEW SAVE FOUND',chapters:'SELECT YOUR MEMORY',journey:'CHAPTER 2 / MEMORY MAP',album:'OUR PHOTO COLLECTION',finale:'FRIENDSHIP CONTINUES'})[name];
 const title=next.querySelector('h1,h2');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
}
$('#home-btn').onclick=()=>goScreen('cover');
for(const b of document.querySelectorAll('[data-go]'))b.onclick=()=>goScreen(b.dataset.go);
$('#hub-game').onclick=()=>$('#game-open').click();
let toastTimer;
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));$('#save-label').textContent='进度已存到本机';}catch{$('#save-label').textContent='本次会话存档';}update();}
function update(){let n=Object.keys(state.answers).length;$('#quiz-progress').textContent=n===questions.length?`回忆已解锁 · ${score(state)} / ${questions.length} 题答对`:`回忆挑战 · ${n} / ${questions.length}`;$('#start-label').textContent=n&&n<questions.length?'CONTINUE · 继续挑战':n===questions.length?'REPLAY · 重温挑战':'PRESS START · 开始回忆';$('#memory-progress').textContent=`旅途印章 · ${state.visited.length} / 3`;
 $('#letter-status').textContent=`回忆挑战 ${n}/${questions.length} · 旅途印章 ${state.visited.length}/3`;$('#letter-label').textContent=canOpenLetter(state)?'打开最后这封信':'查看解锁进度';
 document.querySelectorAll('[data-memory]').forEach(el=>el.classList.toggle('visited',state.visited.includes(el.dataset.memory)));$('#stamp-row').innerHTML=memories.map(m=>`<span class="${state.visited.includes(m.id)?'collected':''}" title="${m.title}${state.visited.includes(m.id)?'已收集':'待收集'}">${m.stamp}</span>`).join('');}
function disposeView(){cleanup?.();cleanup=null;}
function open(html,eyebrow='OUR LITTLE SAVE FILE',kind=''){disposeView();lastFocus=modal.open?lastFocus:document.activeElement;content.innerHTML=html;$('#modal-eyebrow').textContent=eyebrow;view=kind;modal.classList.toggle('memory-case-mode',kind==='memory-case');modal.classList.toggle('lightbox-mode',kind==='lightbox');modal.classList.toggle('quiz-mode',kind==='quiz');if(!modal.open)modal.showModal();modal.scrollTop=0;requestAnimationFrame(()=>{const focus=kind==='quiz'?content.querySelector('#quiz-question'):content.querySelector('button,input');(focus||$('#modal-close')).focus({preventScroll:true});});}
function close(){disposeView();modal.close();}
$('#modal-close').onclick=close;modal.addEventListener('cancel',disposeView);modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});modal.addEventListener('close',()=>{disposeView();view='';modal.classList.remove('quiz-mode');lastFocus?.focus({preventScroll:true});});
function openQuiz(){const idx=questions.findIndex(q=>!Object.hasOwn(state.answers,q.id));if(idx<0)showResult();else showQuestion(idx);}
function showQuestion(i){
 const q=questions[i],done=Object.hasOwn(state.answers,q.id),level=score(state);
 open(`<div class="quiz-play">${quizScene(level,Object.keys(state.answers).length)}<div class="question-pane"><div class="quiz-controls"><span class="question-count">QUESTION ${String(i+1).padStart(2,'0')} / ${String(questions.length).padStart(2,'0')}</span><button class="auto-toggle" id="auto-toggle" aria-pressed="${quizAuto}">自动继续：${quizAuto?'开':'关'}</button></div><div class="quiz-top"><span>你真的认识舅子吗？</span><div class="progress-track"><span style="width:${i/questions.length*100}%"></span></div></div><h2 class="question" id="quiz-question" tabindex="-1">${q.prompt}</h2><div class="quiz-options" role="group" aria-labelledby="quiz-question">${q.options.map((o,c)=>`<button class="option quiz-card-option ${done?(c===q.correct?'correct':c===state.answers[q.id]?'wrong':''):''}" data-choice="${c}" aria-pressed="false" ${done?'disabled':''}>${optionArt(q.id,c)}<span class="option-caption"><small>${c?'B':'A'}</small><span>${o}</span><i class="option-check" aria-hidden="true">✓</i></span></button>`).join('')}</div><div id="quiz-feedback" aria-live="polite">${done?feedback(q):'<p class="center quiz-hint">选一张图卡，看看你们有多默契。<br><span>也可以按键盘 1 / 2 作答</span></p>'}</div><div class="quiz-next-wrap" id="quiz-next" ${done?'':'hidden'}><button class="btn primary" id="next-question">${i===questions.length-1?'收下这一份默契':'下一题'}</button><div id="quiz-auto-bar" class="auto-countdown" hidden><span></span><small>3.5 秒后继续 · 可点上方暂停</small></div></div></div></div>`,'CHAPTER 1 · FRIENDSHIP CHALLENGE','quiz');
 const flow=createQuizAdvance({enabled:quizAuto,advance:()=>i===questions.length-1?showResult():showQuestion(i+1)});cleanup=()=>flow.dispose();
 const autoVisual=()=>{const bar=$('#quiz-auto-bar');bar.hidden=!flow.enabled||!Object.hasOwn(state.answers,q.id);bar.classList.remove('running');requestAnimationFrame(()=>{if(bar.isConnected&&!bar.hidden)bar.classList.add('running');});};
 $('#auto-toggle').onclick=()=>{quizAuto=flow.toggle();$('#auto-toggle').textContent='自动继续：'+(quizAuto?'开':'关');$('#auto-toggle').setAttribute('aria-pressed',String(quizAuto));autoVisual();};
 content.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
  if(!flow.answer())return;const choice=+b.dataset.choice,correct=choice===q.correct;state=answer(state,q.id,choice);persist();
  content.querySelectorAll('[data-choice]').forEach(el=>{el.disabled=true;el.classList.toggle('correct',+el.dataset.choice===q.correct);el.classList.toggle('wrong',+el.dataset.choice===choice&&!correct);el.classList.toggle('chosen',el===b);el.setAttribute('aria-pressed',String(el===b));});
  const stage=$('#quiz-stage'),newLevel=score(state);stage.classList.add(correct?'answer-right':'answer-wrong');$('#quiz-token').style.setProperty('--rise',newLevel/questions.length*62.4+'%');$('#quiz-token').style.setProperty('--rise-small',newLevel/questions.length*36+'%');$('#water-level').textContent='默契水位 '+newLevel+' / '+questions.length;stage.querySelectorAll('.level-rail span').forEach((e,n)=>e.classList.toggle('lit',n<newLevel));
  $('#host-bubble').textContent=correct?'默契 +1！不愧是队友。':'又多认识舅子一点啦。';$('#side-bubble').textContent=correct?'排球升一格！':'这题记住啦，下次一定。';
  if(correct)$('#quiz-confetti').innerHTML=Array.from({length:22},(_,n)=>`<i style="--x:${12+(n*17)%76}%;--drift:${(n%2?1:-1)*(20+n*4)}px;--delay:${n%5*.05}s;--turn:${n*41}deg;background:${['#f4c995','#dc7b87','#bfd8bc','#f8f4db'][n%4]}"></i>`).join('');
  $('#quiz-feedback').innerHTML=feedback(q);$('#quiz-next').hidden=false;autoVisual();$('#next-question').focus({preventScroll:true});
 });
 $('#next-question').onclick=flow.next;
 if(done)flow.answer();
}
function feedback(q){return `<div class="feedback"><strong>${state.answers[q.id]===q.correct?'默契 +1，队友认证成功。':'原来如此，又多认识舅子一点。'}</strong><p>${q.note}</p></div>`;}
function showResult(){open(`<div class="result-icon">✳</div><h2 class="center">友情认证，通关成功。</h2><p class="center">${score(state)} / ${questions.length} 题答对。<br>有些答案今天才知道，也没有关系。</p><div class="modal-actions"><button class="btn primary" id="to-map">继续收集旅途印章</button><button class="text-btn" id="retry-quiz">再玩一遍</button></div><p class="source-note center">答题不决定友情等级。所有完成的玩家都会收到同一封信。</p>`,'CHAPTER COMPLETE','result');$('#to-map').onclick=()=>{close();goScreen('journey');};$('#retry-quiz').onclick=()=>{state={...state,answers:{}};persist();showQuestion(0);};}
$('#start-btn').onclick=openQuiz;$('#quiz-card').onclick=openQuiz;$('#explore-btn').onclick=()=>goScreen('chapters');
const tripCases={
 singapore:{color:'#a9474a',subtitle:'相遇，从这里开始',photos:[24,35],captions:['我们故事的第一天','一起看过的烟花'],ticket:'交换生活 · 新加坡',ticketText:'在新加坡国庆那天，我们一起看烟花，也从那天开始认识舅子。',symbol:'✺',object:'一朵烟花',objectText:'把一起看过的烟花，装进这一学期的行李箱。'},
 malaysia:{color:'#526f67',subtitle:'去马来西亚算西天取经吗',photos:[1,42],captions:['在马来西亚，集合！','把大家装进九宫格'],ticket:'第一次 Recess Week',ticketText:'去马来西亚算西天取经吗',symbol:'🧭',object:'旅行指南针',objectText:'目的地是马来西亚，同行的人是我们。'},
 indonesia:{color:'#b77742',subtitle:'下一站，还是这群人',photos:[],captions:['另一张地图','同一群队友'],ticket:'第二次 Recess Week',ticketText:'第二次 Recess Week，我们一起去了印度尼西亚。',symbol:'🐚',object:'一枚旅行贝壳',objectText:'把这一站也收进行李箱。下一张地图，记得喊我们组队。'}
};
function openMemory(id,animate=true){
 const m=memories.find(m=>m.id===id),trip=tripCases[id];if(!m||!trip)return;
 const cards=[0,1].map(i=>{const photo=photos.find(p=>p.id===trip.photos[i]);return `<button class="case-photo case-photo-${i}" data-case-item="photo-${i}" aria-label="打开回忆：${trip.captions[i]}">${photo?`<img src="${photo.src}" alt="${escapeHTML(trip.captions[i])}">`:`<span class="case-postcard" aria-hidden="true"><span>☀</span><b>${i?'SAME TEAM':'NEXT CHAPTER'}</b><i>≈ ≈ ≈</i></span>`}<span>${trip.captions[i]}</span></button>`;}).join('');
 open(`<section class="trip-case ${animate?'case-arriving':''}" style="--case-color:${trip.color}"><div class="case-heading"><div><span class="case-kicker">UNPACK OUR MEMORIES / ${m.stamp}</span><h2>${m.title}，打开这一站。</h2><p>${trip.subtitle}</p></div><span class="case-country-tag">${m.stamp}</span></div><div class="suitcase"><div class="case-handle" aria-hidden="true"></div><div class="case-lid"><div class="case-lid-pocket"><span>FRANKLIN'S TRAVEL ARCHIVE</span><strong>${m.english}</strong><small>每一件小东西，都藏着一段回忆。</small></div><span class="case-lid-sticker">WE WERE HERE</span></div><div class="case-hinge" aria-hidden="true"></div><div class="case-base"><div class="case-lining" aria-hidden="true"></div>${cards}<button class="case-ticket" data-case-item="ticket" aria-label="翻开${m.title}回忆票"><span>MEMORY TICKET</span><strong>${m.stamp}</strong><span>${trip.ticket}</span><small>FRANKLIN & FRIENDS</small><i aria-hidden="true"></i></button><button class="case-keepsake" data-case-item="object" aria-label="查看${trip.object}"><span aria-hidden="true">${trip.symbol}</span><strong>${trip.object}</strong><small>点一下，找回这段回忆</small></button><span class="case-lock lock-left" aria-hidden="true"></span><span class="case-lock lock-right" aria-hidden="true"></span></div></div><div class="case-footer"><p>点开照片、回忆票或小物件，翻一翻这一站。</p><button class="btn primary" id="case-stamp" ${state.visited.includes(id)?'disabled':''}>${state.visited.includes(id)?`${m.stamp} · 印章已收藏`:'盖下这一站的印章'}</button><span class="case-stamp-mark ${state.visited.includes(id)?'is-stamped':''}" aria-hidden="true">${m.stamp}<small>MEMORY SAVED</small></span></div></section>`,'CHAPTER 2 · 行李箱里的回忆','memory-case');
 content.querySelectorAll('[data-case-item]').forEach(b=>b.onclick=()=>openCaseItem(id,b.dataset.caseItem));
 $('#case-stamp').onclick=()=>{state=visit(state,id);persist();const b=$('#case-stamp');b.disabled=true;b.textContent=`${m.stamp} · 印章已收藏`;content.querySelector('.case-stamp-mark').classList.add('is-stamped');toast(`${m.title}印章已加入背包${canOpenLetter(state)?'，最后那封信已解锁。':'。'}`);};
}
function openCaseItem(id,item){
 const m=memories.find(m=>m.id===id),trip=tripCases[id];if(!m||!trip)return;
 let html,title;
 if(item.startsWith('photo-')){const i=Number(item.slice(-1)),p=photos.find(p=>p.id===trip.photos[i]);title=trip.captions[i];html=p?`<figure class="case-memory-photo"><img src="${p.src}" alt="${escapeHTML(title)}"><figcaption>${title}</figcaption></figure>`:`<div class="case-memory-postcard"><span>☀</span><h2>${title}</h2><p>${trip.subtitle}</p><strong>INDONESIA · ${m.stamp}</strong></div>`;}
 else if(item==='ticket'){title='这一站的回忆票';html=`<div class="case-memory-ticket"><span>MEMORY TICKET · ${m.stamp}</span><h2>${m.title}</h2><p>${trip.ticket}</p><div class="case-ticket-rule"></div><p>${trip.ticketText}</p><small>TRAVELLERS / FRANKLIN & FRIENDS</small></div>`;}
 else{title=trip.object;html=`<div class="case-memory-object"><span aria-hidden="true">${trip.symbol}</span><h2>${title}</h2><p>${trip.objectText}</p></div>`;}
 open(`<article class="case-item-detail"><button class="back-btn" id="back-to-case">收回行李箱</button>${html}<button class="text-btn" id="case-next-item">再翻一件回忆</button></article>`,`${m.title} · ${title}`,'memory-case');
 $('#back-to-case').onclick=()=>openMemory(id,false);
 const order=['photo-0','photo-1','ticket','object'];$('#case-next-item').onclick=()=>openCaseItem(id,order[(order.indexOf(item)+1)%order.length]);
}

document.querySelectorAll('[data-memory]').forEach(el=>el.onclick=()=>openMemory(el.dataset.memory));
const addendumStorageKey='franklin-memory-addendum-v1';
let memoryAddenda=[];
try{const savedAddenda=JSON.parse(localStorage.getItem(addendumStorageKey)||'[]');if(Array.isArray(savedAddenda))memoryAddenda=savedAddenda.filter(m=>m&&typeof m.text==='string').slice(-50);}catch{}
function renderMemoryAddenda(){
 const saved=$('#memory-saved');if(!saved)return;
 const latest=memoryAddenda[memoryAddenda.length-1];
 $('#memory-addendum-count').textContent=memoryAddenda.length?'已补进 '+memoryAddenda.length+' 段回忆':'等你补进一段回忆';
 $('#memory-compose-open').textContent=memoryAddenda.length?'＋ 再补充一段':'＋ 补充一段回忆';
 saved.hidden=!latest;
 if(latest){
  const time=Date.parse(latest.createdAt||'');
  const date=Number.isFinite(time)?new Date(time).toLocaleDateString('zh-CN',{year:'numeric',month:'numeric',day:'numeric'}):'';
  saved.innerHTML='<span class="memory-saved-kicker">LATEST MEMORY ADDENDUM</span><blockquote>'+escapeHTML(latest.text)+'</blockquote><div class="memory-saved-meta"><span>'+escapeHTML(latest.name||'一位队友')+'</span>'+(date?'<time>'+date+'</time>':'')+'</div>';
 }
}
function openMemoryAddendum(){
 open('<section class="memory-addendum"><div class="memory-addendum-intro"><span class="memory-file-label">FRANKLIN · MEMORY FILE</span><h2>你还记得 Franklin 的什么？</h2><p>一个习惯、一句话，或一起经历的小事……想到什么，就把它补进这份存档。</p></div><div class="memory-addendum-action"><span id="memory-addendum-count">FRANKLIN · MEMORY FILE</span><button class="btn primary" id="memory-compose-open" type="button">＋ 补充一段回忆</button></div><form class="memory-addendum-form" id="memory-form" hidden><label for="memory-text">补充一件你记得的事</label><textarea id="memory-text" name="memory" maxlength="500" rows="5" required placeholder="比如某个瞬间、习惯、口头禅，或只有你们记得的小事……"></textarea><div class="memory-author-field"><label for="memory-author">署名（选填）</label><input id="memory-author" name="author" maxlength="40" autocomplete="nickname" placeholder="不署名也可以"></div><div class="memory-form-actions"><button class="text-btn" id="memory-cancel" type="button">暂时不补充</button><button class="btn primary" type="submit">补进 Franklin 的存档</button></div></form><article class="memory-saved" id="memory-saved" hidden></article><div class="memory-addendum-next"><div><strong>把记得的细节收好，再一起走向下一页。</strong><p>每一段共同经历，都是这份存档的一部分。</p></div><div class="memory-addendum-next-actions"><button class="text-btn" id="memory-certificate" type="button">领取通关证书</button><button class="btn primary" id="memory-to-finale" type="button">去看结尾页 →</button></div></div></section>','CHAPTER 3 · Franklin 的记忆补充','memory-addendum');
 renderMemoryAddenda();
 $('#memory-compose-open').onclick=()=>{$('#memory-form').hidden=false;$('#memory-compose-open').hidden=true;$('#memory-text').focus();};
 $('#memory-cancel').onclick=()=>{$('#memory-form').hidden=true;$('#memory-compose-open').hidden=false;$('#memory-compose-open').focus();};
 $('#memory-to-finale').onclick=()=>{close();goScreen('finale');};
 $('#memory-certificate').onclick=showCertificate;
}
$('#dinner-card').onclick=openMemoryAddendum;
content.addEventListener('submit',e=>{
 const form=e.target.closest('#memory-form');if(!form)return;
 e.preventDefault();
 const text=$('#memory-text').value.trim();if(!text){$('#memory-text').focus();toast('先写下一段你记得的事吧。');return;}
 const name=$('#memory-author').value.trim();
 memoryAddenda.push({text,name,createdAt:new Date().toISOString()});
 if(memoryAddenda.length>50)memoryAddenda=memoryAddenda.slice(-50);
 let saved=true;try{localStorage.setItem(addendumStorageKey,JSON.stringify(memoryAddenda));}catch{saved=false;}
 renderMemoryAddenda();form.reset();form.hidden=true;$('#memory-compose-open').hidden=false;$('#memory-compose-open').focus();
 toast(saved?'这段回忆已经补进 Franklin 的存档。':'回忆已补进本次存档，但浏览器无法保存到下次访问。');
});
function allPhotos(){return [...photos,...localPhotos];}
function filteredPhotos(){return allPhotos().filter(p=>albumFilter==='all'||p.category===albumFilter);}
function renderDome(){
 const stage=$('#dome-stage'),layer=$('#dome-photos');if(!stage||!layer)return;
 const list=filteredPhotos();
 $('#photo-count').textContent=allPhotos().length+' 张';$('#dome-total').textContent=allPhotos().length;
 $('#dome-visible-count').textContent=list.length+' 张'+(albumFilter==='all'?'共同回忆':'照片');
 $('#dome-empty').hidden=list.length>0;layer.innerHTML='';
 $('#dome-filters').querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===albumFilter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.hidden=b.dataset.filter==='local'&&!allPhotos().some(p=>p.category==='local');});
 if(!list.length)return;
 const latitudes=[-54,-20,20,54],weights=latitudes.map(d=>Math.cos(d*Math.PI/180)),weightTotal=weights.reduce((a,b)=>a+b,0);
 const counts=weights.map(w=>Math.floor(list.length*w/weightTotal));
 let remainder=list.length-counts.reduce((a,b)=>a+b,0);
 const order=weights.map((w,i)=>({i,frac:list.length*w/weightTotal-Math.floor(list.length*w/weightTotal)})).sort((a,b)=>b.frac-a.frac);
 for(let n=0;n<remainder;n++)counts[order[n%order.length].i]++;
 let cursor=0;
 latitudes.forEach((latitude,band)=>{
  const count=counts[band];
  for(let j=0;j<count;j++){
   const p=list[cursor++],yaw=(j*360/count+(band%2)*180/count)%360;
   const depth=Math.cos(latitude*Math.PI/180)*226,vertical=-Math.sin(latitude*Math.PI/180)*166;
   const button=document.createElement('button');button.className='dome-photo';button.type='button';button.dataset.photo=String(p.id);button.setAttribute('aria-label','打开照片：'+p.title);
   button.style.setProperty('--photo-yaw',yaw+'deg');button.style.setProperty('--photo-z',depth+'px');button.style.setProperty('--photo-y',vertical+'px');button.style.setProperty('--photo-order',String(Math.round(depth)));
    button.innerHTML='<span class="dome-polaroid"><span class="dome-photo-frame"><img src="'+escapeHTML(p.src)+'" alt="" loading="lazy" draggable="false"></span><span class="dome-photo-title">'+escapeHTML(p.title)+'</span></span>';
   layer.appendChild(button);
  }
 });
}
let albumFilter='all',lightboxList=[],lightboxIndex=0,albumYaw=-13,albumPitch=-5,albumVelocity=0,albumFrame=0,albumPointer=null,suppressDomeClickUntil=0;
function setDomeTransform(){const world=$('#dome-world');if(world){world.style.setProperty('--dome-yaw',albumYaw+'deg');world.style.setProperty('--dome-pitch',albumPitch+'deg');}}
function coastDome(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||Math.abs(albumVelocity)<.025){albumVelocity=0;return;}albumYaw+=albumVelocity;albumVelocity*=.91;setDomeTransform();albumFrame=requestAnimationFrame(coastDome);}
const domeStage=$('#dome-stage');
domeStage.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;if(albumFrame)cancelAnimationFrame(albumFrame);albumVelocity=0;albumPointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,lastT:performance.now(),moved:false,photo:e.target.closest('[data-photo]')};domeStage.setPointerCapture(e.pointerId);domeStage.classList.add('is-dragging');});
domeStage.addEventListener('pointermove',e=>{if(!albumPointer||albumPointer.id!==e.pointerId)return;const dx=e.clientX-albumPointer.lastX,dy=e.clientY-albumPointer.lastY;if(Math.abs(e.clientX-albumPointer.x)+Math.abs(e.clientY-albumPointer.y)>7)albumPointer.moved=true;if(albumPointer.moved){albumYaw+=dx*.42;albumPitch=Math.max(-19,Math.min(12,albumPitch+dy*.16));const now=performance.now(),elapsed=Math.max(8,now-albumPointer.lastT);albumVelocity=dx*.42*(16/elapsed);albumPointer.lastT=now;setDomeTransform();}albumPointer.lastX=e.clientX;albumPointer.lastY=e.clientY;});
function finishDomePointer(e){if(!albumPointer||albumPointer.id!==e.pointerId)return;const {moved,photo}=albumPointer;albumPointer=null;domeStage.classList.remove('is-dragging');if(moved){suppressDomeClickUntil=performance.now()+180;if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)albumFrame=requestAnimationFrame(coastDome);else albumVelocity=0;}else if(photo){suppressDomeClickUntil=performance.now()+400;const list=filteredPhotos(),index=list.findIndex(p=>String(p.id)===photo.dataset.photo);if(index>=0)openLightbox(list[index].id,list,index);}}
domeStage.addEventListener('pointerup',finishDomePointer);domeStage.addEventListener('pointercancel',finishDomePointer);
 domeStage.addEventListener('click',e=>{if(performance.now()<suppressDomeClickUntil)return;const photoButton=e.target.closest('[data-photo]');if(!photoButton)return;const list=filteredPhotos(),index=list.findIndex(p=>String(p.id)===photoButton.dataset.photo);if(index>=0)openLightbox(list[index].id,list,index);});
$('#dome-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;albumFilter=b.dataset.filter;renderDome();});
function openAlbum(filter='all'){albumFilter=filter;renderDome();if(modal.open)close();goScreen('album');}
function openLightbox(id,list=filteredPhotos(),index=-1){lightboxList=list;lightboxIndex=index>=0?index:Math.max(0,list.findIndex(p=>p.id===id));renderLightbox();}
function renderLightbox(){
 const p=lightboxList[lightboxIndex];if(!p)return;
 open('<section class="polaroid-viewer"><div class="polaroid-viewer-heading"><span>OUR PHOTO COLLECTION</span><span>'+String(lightboxIndex+1).padStart(2,'0')+' / '+String(lightboxList.length).padStart(2,'0')+'</span></div><div class="polaroid-viewer-row"><button class="polaroid-arrow" id="photo-prev" aria-label="上一张照片">←</button><article class="polaroid-card" id="polaroid-card"><span class="polaroid-tape" aria-hidden="true"></span><div class="polaroid-image"><img src="'+escapeHTML(p.src)+'" alt="'+escapeHTML(p.title)+'" draggable="false"></div><div class="polaroid-caption"><h2>'+escapeHTML(p.title)+'</h2><p>'+escapeHTML(p.dateLabel||'')+(p.category==='local'?' · 本机添加':'')+'</p></div></article><button class="polaroid-arrow" id="photo-next" aria-label="下一张照片">→</button></div><div class="polaroid-viewer-footer"><span>左右滑动或使用方向键，继续翻看</span><button class="btn primary" id="back-dome" type="button">返回穹顶</button></div></section>','SOME MOMENTS STAY','lightbox');
 $('#photo-prev').onclick=()=>{lightboxIndex=(lightboxIndex-1+lightboxList.length)%lightboxList.length;renderLightbox();};
 $('#photo-next').onclick=()=>{lightboxIndex=(lightboxIndex+1)%lightboxList.length;renderLightbox();};
 $('#back-dome').onclick=close;
 const card=$('#polaroid-card');let startX=0,startY=0;
 card.addEventListener('pointerdown',e=>{startX=e.clientX;startY=e.clientY;});
 card.addEventListener('pointerup',e=>{const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.15){lightboxIndex=(lightboxIndex+(dx<0?1:-1)+lightboxList.length)%lightboxList.length;renderLightbox();}});
}
$('#upload-btn').onclick=()=>$('#photo-upload').click();
$('#photo-upload').onchange=e=>{let count=0;for(const f of e.target.files){if(!f.type.startsWith('image/'))continue;if(f.size>20*1024*1024){toast('这张照片超过 20 MB，请先缩小后再添加。');continue;}localPhotos.push({id:1000+localPhotos.length,src:URL.createObjectURL(f),title:f.name,category:'local',dateLabel:'当前页面添加'});count++;}if(count){renderDome();toast('已在当前页面添加 '+count+' 张照片，未上传。');openAlbum('local');}e.target.value='';};
function showLetter(){open(`<article class="letter-paper"><div class="dear">Dear Franklin,</div><p>2026 年 11 月 24 日，你将离开新加坡，去往下一张地图。</p><p>在这里，你解锁了很多不同的身份：深夜排球选手、吉他持有者、麻酱爱好者，还有我们最熟悉的——舅子。</p><p>从国庆那天一起看烟花，到后来一起做饭、旅行，再到 11 月 23 日晚这顿散伙饭，我们真的攒下了不少共同回忆。</p><p>也许很多年后，我们会忘记某次出门的具体日期，但应该还会记得，大家一起笑得有多开心。</p><p>所以，把这些日子存起来吧。以后想起新加坡，想起这一群人，就回来翻一翻。</p><p class="highlight">地图可以更换，<br>队友不会因此消失。</p><p>下一次碰面，还要一起吃饭、一起出发，也一起创造新的笑话。</p><p class="sign">See you in the next chapter, Franklin.<br>—— 你的新加坡队友们</p></article><p class="letter-disclaimer">这封信依据原稿整理，是可继续修改的集体告别文案。</p><div class="modal-actions"><button class="btn primary" id="save-friendship">Save Our Friendship</button><button class="text-btn" id="letter-certificate">领取通关证书</button></div>`,'HIDDEN LETTER · 给舅子的最后一页','letter');$('#save-friendship').onclick=()=>openAlbum();$('#letter-certificate').onclick=showCertificate;}
$('#letter-btn').onclick=()=>{if(canOpenLetter(state))showLetter();else{open(`<div class="result-icon">▱</div><h2 class="center">有些话，想留到最后。</h2><p class="center">回忆挑战：${Object.keys(state.answers).length} / ${questions.length}<br>旅途印章：${state.visited.length} / 3<br>不用答对全部题目，完成就好。</p><div class="modal-actions"><button class="btn primary" id="unlock-next">${Object.keys(state.answers).length<questions.length?'继续回忆挑战':'去收集旅途印章'}</button></div>`,'A LITTLE SECRET','locked');$('#unlock-next').onclick=()=>{if(Object.keys(state.answers).length<questions.length)openQuiz();else{close();goScreen('journey');}};}};
$('#host-letter').onclick=showLetter;
function showCertificate(){if(!canOpenLetter(state)){toast('先完成 10 题与 3 站印章，再领取证书。');$('#letter-btn').click();return;}open(`<div class="certificate"><div class="cert-copy"><div class="cert-star">✳</div><span class="cert-title">CERTIFICATE OF FRIENDSHIP · 2026</span><h3>FRANKLIN</h3><p>新加坡交换章节 · 已存档</p><div class="cert-tags">传奇夜猫子 · 麻酱守护者 · 我们的舅子</div><time>2026.11.23 · SINGAPORE</time><div class="cert-line">地图可以更换，队友不会因此消失。</div></div><img class="cert-photo" src="assets/friendship-certificate.jpg" alt="Franklin 在离开新加坡时的夕阳背影"></div><div class="modal-actions"><button class="btn primary" id="download-cert">保存纪念证书</button><button class="text-btn" id="cert-letter">打开告别信</button></div>`,'EXCHANGE COMPLETED · FRIENDSHIP CONTINUES','certificate');$('#download-cert').onclick=downloadCertificate;$('#cert-letter').onclick=showLetter;}
function downloadCertificate(){const image=new Image();image.onload=()=>{const c=document.createElement('canvas');c.width=1500;c.height=1100;const ctx=c.getContext('2d');ctx.fillStyle='#f4f7ed';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#9aaf7e';ctx.lineWidth=2;ctx.strokeRect(55,55,1390,990);ctx.save();ctx.beginPath();ctx.rect(890,150,470,800);ctx.clip();const scale=Math.max(470/image.width,800/image.height),w=image.width*scale,h=image.height*scale;ctx.drawImage(image,890+(470-w)/2,150+(800-h)/2,w,h);ctx.restore();ctx.textAlign='left';ctx.fillStyle='#849e61';ctx.font='76px Georgia';ctx.fillText('✳',145,240);ctx.font='19px sans-serif';ctx.fillText('CERTIFICATE OF FRIENDSHIP · 2026',145,320);ctx.fillStyle='#294a37';ctx.font='82px Georgia';ctx.fillText('FRANKLIN',145,455);ctx.font='30px sans-serif';ctx.fillText('新加坡交换章节 · 已存档',145,540);ctx.fillStyle='#809268';ctx.font='23px sans-serif';ctx.fillText('传奇夜猫子 · 麻酱守护者',145,630);ctx.fillText('我们的舅子',145,674);ctx.font='20px sans-serif';ctx.fillText('2026.11.23 · SINGAPORE',145,760);ctx.fillStyle='#294a37';ctx.font='26px sans-serif';ctx.fillText('地图可以更换，',145,875);ctx.fillText('队友不会因此消失。',145,915);c.toBlob(b=>{if(!b)return toast('证书导出失败，请再试一次。');const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='Franklin-友情通关证书.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),10000);toast('纪念证书已生成，请查看浏览器下载。');},'image/png');};image.onerror=()=>toast('证书照片加载失败，请刷新后重试。');image.src='assets/friendship-certificate.jpg';}
$('#certificate-open').onclick=showCertificate;
$('#save-btn').onclick=()=>toast('答题和印章仅保存于此浏览器；共同相册已内置，新增照片不自动同步。');
$('#reset-btn').onclick=()=>{open('<h2>再走一遍这段回忆？</h2><p>会清空此浏览器里的答题与印章进度，相册仍然可以翻看。</p><div class="modal-actions"><button class="btn primary" id="confirm-reset">重新开始</button><button class="text-btn" id="cancel-reset">保留存档</button></div>','NEW GAME');$('#confirm-reset').onclick=()=>{state=initialState();persist();close();goScreen('cover');toast('新的回忆挑战，准备好了。');};$('#cancel-reset').onclick=close;};
$('#game-open').onclick=()=>{open('<h2 class="center">深夜排球 · 再接一球</h2><p class="center">移动队员接球，接住 5 次就算今晚热身成功。</p><div class="game-score" id="game-score">接球 0 / 5</div><div class="game-wrap"><canvas id="game" width="560" height="300" tabindex="0" aria-label="像素排球游戏，使用左右方向键或屏幕按钮移动"></canvas><div class="game-controls"><button id="move-left" aria-label="向左移动">左移</button><button id="game-restart">重玩</button><button id="move-right" aria-label="向右移动">右移</button></div></div><p class="source-note center">电脑用左右键，手机可拖动球场或按住左右按钮。小游戏不影响信件解锁。</p>','PIXEL SIDE QUEST','game');cleanup=startGame($('#game'),$('#game-score'));};
function escapeHTML(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
update();
try{const r=await fetch('photos.json?v=album43');if(!r.ok)throw Error('photos');photos=await r.json();renderDome();}catch{toast('相册暂未加载，请刷新页面或通过本地服务器打开。');}
try{initScene($('#scene'));}catch{ $('#scene').hidden=true;$('#scene-fallback').hidden=false;$('#scene-instruction').textContent='这张照片，也是一份出发存档。';$('#scene-reset').hidden=true;}
