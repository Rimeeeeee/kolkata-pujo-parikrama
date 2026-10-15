import {PujoWorld} from './world.js';
import {PLACES} from './game-state.js';
import {CHARACTERS,STALL_MENUS} from './neighbourhood.js';
import {BALLOON_COLOURS,balloonChoice,newRangeRound,postcardName} from './fairground-state.js';
import {BalloonRange} from './balloon-range.js';
import {drawPostcard} from './postcard.js';
import {withinReach} from './interaction.js';

const $=id=>document.getElementById(id);
const state={started:false,entered:false,queuing:false,sound:false,moments:new Set(),round:newRangeRound(),currentCharacter:null,place:'street',inputPaused:false,balloon:null,purchases:[],shop:null,watchingFireworks:false};
let world=null,range=null,toastTimer=0,lastQueueNotice=0,voiceAudio=null,postcardSnapshot=null;
let selectedBalloon=balloonChoice(BALLOON_COLOURS[0].hex,BALLOON_COLOURS[0].name);
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4300);}
function ready(){$('loading').classList.add('done');setTimeout(()=>$('loading').remove(),700);}
function fail(error){console.warn('3D unavailable',error);document.body.classList.add('fallback-mode');$('fallback').classList.remove('hidden');ready();}
function mark(moment){state.moments.add(moment);updateJourney();}
function updateJourney(){
 const n=state.moments.size;$('journey-count').textContent=`${n} / 5 moments`;$('progress').style.width=`${n/5*100}%`;
 let title,copy,button;
 if(!state.entered){title='First, follow the sound of dhak.';copy='Join the neighbours at the pandal entrance. Maa is waiting inside.';button='Join the pandal queue';}
 else if(!state.moments.has('dhaki')){title='The heartbeat of the evening.';copy='Bimal-da is playing by the courtyard. Stay and say hello.';button='Meet the dhaki';}
 else if(!state.moments.has('tea')){title='Time for a little cha and adda.';copy='Haru-da has a warm clay cup waiting out on the lane.';button='Visit Haru-da’s tea shop';}
 else if(!state.moments.has('game')){title='Ready, aim, a little joy.';copy='Twelve corks. Ten moving balloons. How steady is your aim?';button='Visit the shooting range';}
 else if(!state.moments.has('greeting')){title='A familiar Puja greeting.';copy='Madhumita-di is out on the lane. Stop by and say hello.';button='Meet a neighbour';}
 else{title='A little evening to remember.';copy='Keep wandering, choose a balloon, or sign your own postcard.';button='Save a Puja postcard';}
 $('journey-title').textContent=title;$('journey-copy').textContent=copy;$('next-moment').innerHTML=`${button} <span>→</span>`;
}
function stopVoice(){if(voiceAudio){voiceAudio.pause();voiceAudio=null;}window.speechSynthesis?.cancel();$('dhak-audio').volume=.48;}
async function sound(on){
 state.sound=on;const audio=$('dhak-audio');audio.volume=.48;
 if(on){try{await audio.play();}catch{state.sound=false;toast('Tap Sound again to start the dhak.');}}else{audio.pause();stopVoice();}
 $('sound').setAttribute('aria-label',state.sound?'Mute dhak sound':'Turn on dhak sound');$('sound').querySelector('span').textContent=state.sound?'Dhak on':'Sound off';$('sound').style.borderColor=state.sound?'#c9a36d':'';
}
function begin({audio=true}={}){
 if(state.started)return;state.started=true;document.body.classList.add('started');$('welcome').setAttribute('aria-hidden','true');$('welcome').inert=true;$('journey').classList.remove('hidden');
 if(matchMedia('(pointer: coarse)').matches)$('touch-controls').classList.remove('hidden');
 if(world?.renderer){world.started=true;world.go(PLACES[0].position,PLACES[0].look);}if(audio)sound(true);updateJourney();
}
function pauseInput(){state.inputPaused=true;world?.stop();world?.cancelMove();}
function resumeInput(){state.inputPaused=state.queuing||!!document.querySelector('dialog[open]')||!$('dialogue').classList.contains('hidden');if(world)world.suspended=!!document.querySelector('dialog[open]');}
function openModal(id){closeDialogue();pauseInput();if(world)world.suspended=true;const dialog=$(id);if(!dialog.open)dialog.showModal();}
function closeDialogue(){if(world)world.conversationId=null;$('dialogue').classList.add('hidden');stopVoice();resumeInput();}
async function speakCharacter(id,{explicit=false}={}){
 if((!state.sound&&!explicit)||!canInteract(id))return;const character=CHARACTERS[id];if(!character)return;stopVoice();
 const audio=new Audio(`./assets/voices-natural/${id}.mp3`);voiceAudio=audio;audio.volume=.95;$('dhak-audio').volume=.16;
 audio.onended=()=>{if(voiceAudio===audio){voiceAudio=null;$('dhak-audio').volume=.48;}};
 try{await audio.play();}catch{
  if(voiceAudio!==audio)return;$('dhak-audio').volume=.48;
  if(explicit)toast('Audio is unavailable here. The Bengali greeting and English translation are ready to read.');
 }
}
function personPosition(id){return world?.characterPosition?.(id)||CHARACTERS[id]?.position;}
function canInteract(id,{notify=false}={}){const c=CHARACTERS[id];if(!c||state.queuing)return false;if(!world?.renderer)return true;const anchor=personPosition(id);const allowed=anchor&&withinReach(world.camera.position,{x:anchor[0],z:anchor[2]},{entered:state.entered,queuing:state.queuing});if(!allowed&&notify)toast(`Walk closer to ${c.name.split(' · ')[0]} to talk or buy something.`);return !!allowed;}
async function approach(id){if(!world?.renderer)return;const a=personPosition(id);if(!a)return;const from=world.camera.position,dx=from.x-a[0],dz=from.z-a[2],n=Math.hypot(dx,dz)||1;await world.go([a[0]+dx/n*1.9,from.y,a[2]+dz/n*1.9],[a[0],a[1]-.3,a[2]]);}
function talk(id){
 if(!canInteract(id,{notify:true}))return;begin({audio:false});const c=CHARACTERS[id];if(!c)return;state.currentCharacter={...c,id};pauseInput();world?.greet?.(id);if(c.moment)mark(c.moment);
 $('dialogue-role').textContent=c.role;$('dialogue-name').textContent=c.name;$('dialogue-bn').textContent=c.bn;$('dialogue-en').textContent=c.en;$('dialogue-en').classList.add('hidden');$('translate').textContent='Translate to English ↗';
 $('dialogue-action').classList.toggle('hidden',!c.action);$('dialogue-action').textContent=c.action||'';$('dialogue').classList.remove('hidden');$('translate').focus({preventScroll:true});speakCharacter(id);
}
async function go(id){
 if(state.queuing)return;if(state.watchingFireworks){state.watchingFireworks=false;world?.stopFireworks?.();$('fireworks').setAttribute('aria-pressed','false');$('fireworks').querySelector('span').textContent='Fireworks';}begin({audio:false});closeDialogue();const p=PLACES.find(p=>p.id===id);if(!p)return;
 if(['inside','dhaki'].includes(id)&&!state.entered){await joinQueue();if(id==='dhaki'&&world?.renderer)await world.go(p.position,p.look);return;}
 state.place=id;$('location').textContent=p.title;
 const captions={street:['01 — THE PARA','Some streets feel like coming home.'],queue:['02 — THE ENTRANCE','Good things are worth a little wait.'],inside:['03 — THE MANDAP','Stay a moment. The arati has begun.'],dhaki:['04 — THE DHAK','A rhythm that brings everyone home.'],tea:['05 — CHA & ADDA','One cup. A hundred conversations.'],balloons:['06 — THE FAIRGROUND','A steady hand. A happy little pop.']};
 const caption=captions[id]||['THE PARA’S LITTLE SHOPS','There is always room for one more stop.'];$('scene-caption').innerHTML=`<span>${caption[0]}</span><p>${caption[1]}</p>`;
 if(world?.renderer)await world.go(p.position,p.look);else{const character={street:'neighbour',queue:'volunteer',inside:'priest',balloons:'game'}[id]||id;if(id==='inside'){state.entered=true;mark('inside');}talk(character);}
}
async function joinQueue(){
 begin({audio:false});closeDialogue();if(state.queuing)return;if(state.entered){await go('inside');return;}
 state.queuing=true;pauseInput();if(world)world.locked=true;$('next-moment').disabled=true;$('next-moment').textContent='Following the queue…';toast('You’ve joined the queue. Arjun will guide you inside.');
 $('places').disabled=true;$('photo').disabled=true;$('fireworks').disabled=true;
 if(world?.renderer){const tail=PLACES.find(p=>p.id==='queue');await world.go(tail.position,tail.look);await world.joinQueue(snap=>{$('next-moment').textContent=snap.ahead?`${snap.ahead} people ahead · ${snap.moving?'Following the line…':'Waiting with the neighbours…'}`:'Your turn · stepping inside…';});}
 $('places').disabled=false;$('photo').disabled=false;$('fireworks').disabled=false;

 state.entered=true;state.queuing=false;if(world)world.locked=false;state.place='inside';mark('inside');$('next-moment').disabled=false;$('location').textContent='Inside the pandal';$('scene-caption').innerHTML='<span>03 — THE MANDAP</span><p>Stay a moment. The arati has begun.</p>';resumeInput();toast('শুভ শারদীয়া! Welcome inside. Stay a little and watch the arati.');
}
function openShop(shop){
 if(!canInteract(shop,{notify:true}))return;state.shop=shop;
 const menu=STALL_MENUS[shop];if(!menu)return;openModal('market-modal');$('market-bn').textContent=menu.bn;$('market-title').textContent=menu.title;$('market-menu').replaceChildren();$('market-message').textContent='What would you like?';
 for(const item of menu.items){const button=document.createElement('button');button.className='menu-item';button.innerHTML=`<span class="menu-icon">${item.icon}</span><span><strong>${item.name}</strong><small lang="bn">${item.bn}</small><p>${item.description}</p></span><b>₹${item.price}<i>Take it ↗</i></b>`;button.setAttribute('aria-label',`Take a virtual ${item.name} for ${item.price} pretend rupees`);button.onclick=()=>purchase(shop,item);$('market-menu').append(button);}
}
function purchase(shop,item){if(state.shop!==shop||!canInteract(shop,{notify:true}))return;state.purchases.push({shop,id:item.id,name:item.name,price:item.price});if(shop==='tea')mark('tea');$('market-message').textContent=`${item.name} is yours. শুভ শারদীয়া! Enjoy your little Puja treat.`;toast(`${item.name} · ₹${item.price} in pretend rupees. শুভ শারদীয়া!`);}
function selectBalloon(hex,name){if(state.queuing||state.balloon)return;const choice=balloonChoice(hex,name);if(!choice)return;selectedBalloon=choice;$('shop-balloon').style.setProperty('--chosen-balloon',choice.hex);$('colour-name').textContent=choice.name;$('custom-colour').value=choice.hex;document.querySelectorAll('.colour-swatch').forEach(button=>button.setAttribute('aria-pressed',button.dataset.hex===choice.hex?'true':'false'));}
function showCompanion(){if(state.balloon)world?.setCompanionBalloon?.(state.balloon.hex);}
function openBalloonShop(){if(!canInteract('seller',{notify:true}))return;if(state.balloon){toast('You already have your balloon. Its colour is fixed for this visit.');return;}begin({audio:false});openModal('balloon-modal');selectBalloon(selectedBalloon.hex,selectedBalloon.name);}
function buyBalloon(){if(state.balloon||!canInteract('seller',{notify:true}))return;state.balloon={...selectedBalloon};try{sessionStorage.setItem('pujo-balloon',JSON.stringify(state.balloon));}catch{}showCompanion();$('balloon-modal').close();toast(`Your ${state.balloon.name.toLowerCase()} balloon will float beside you. The colour is fixed for this visit.`);}
let popContext=null;
function effect(type='pop'){
 if(!state.sound)return;try{popContext??=new (window.AudioContext||window.webkitAudioContext)();popContext.resume();const c=popContext,o=c.createOscillator(),g=c.createGain();o.type=type==='pop'?'triangle':'sine';o.frequency.setValueAtTime(type==='pop'?480:170,c.currentTime);o.frequency.exponentialRampToValueAtTime(55,c.currentTime+.1);g.gain.setValueAtTime(type==='pop'?.13:.07,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.12);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.13);}catch{}
}
function updateRange(round,meta){
 state.round=round;$('score').textContent=round.score;$('shots').textContent=`${round.shots} cork${round.shots===1?'':'s'} left`;$('range-time').textContent=`${Math.ceil(round.seconds)} seconds`;$('range-combo').textContent=round.combo?`${round.combo} hit streak`:'No streak yet';$('range-best').textContent=`Best: ${meta.best}`;
 $('range-reticle').style.left=`${meta.aim.x}%`;$('range-reticle').style.top=`${meta.aim.y}%`;$('fire-cork').disabled=round.ended||round.shots===0;$('range-result').classList.toggle('hidden',!round.ended);
 if(round.ended){$('range-result').textContent=round.won?`All ten! ${round.score} points`:`${round.popped.length} / 10 balloons · ${round.score} points`;$('game-message').textContent=round.won?'দারুণ নিশানা! Nimai-da is impressed. Play again to beat your best.':'Nice try! Aim slightly high and lead a moving balloon. Another round?';}
 else if(round.shots<12)$('game-message').textContent=round.lastResult==='miss'?'A little wide! Aim slightly high and lead the balloon.':round.lastResult==='centre'?'Centre hit! Keep that streak going.':round.combo>1?'Keep that streak! Centre hits earn more points.':'The cork drops as it flies. Aim just above the balloon’s centre.';
}
function openGame(){
 if(!canInteract('game',{notify:true}))return;
 begin({audio:false});openModal('game-modal');$('game-message').textContent='Take your time. Your first shot starts here.';
 try{range??=new BalloonRange($('range-canvas'),{onUpdate:updateRange,onFinish:()=>mark('game'),onPop:()=>effect('pop'),onFire:()=>effect('fire')});range.start();$('range-canvas').focus({preventScroll:true});}catch(error){console.warn('Shooting range unavailable',error);$('game-modal').close();toast('The 3D shooting range needs WebGL. Try a browser with graphics acceleration enabled.');}
}
function updatePostcard(){
 if(!postcardSnapshot)return;const name=postcardName($('postcard-name').value);const canvas=document.createElement('canvas');const data=drawPostcard(canvas,postcardSnapshot,name);$('postcard-image').src=data;$('download-postcard').href=data;$('download-postcard').download=name?`pujo-postcard-${name.replace(/[^\p{L}\p{M}\p{N}]+/gu,'-')}.png`:'a-kolkata-pujo-evening.png';
}
function postcard(){
 if(state.queuing)return;
 begin({audio:false});if(!world?.renderer){toast('Postcards need the 3D view. You can still explore the neighbourhood stories.');return;}
 try{const source=world.screenshot();postcardSnapshot=document.createElement('canvas');postcardSnapshot.width=source.width;postcardSnapshot.height=source.height;postcardSnapshot.getContext('2d').drawImage(source,0,0);updatePostcard();openModal('postcard-modal');}catch(error){console.warn(error);toast('The postcard could not be saved in this browser. Try another view.');}
}
async function watchFireworks(){
 if(state.queuing)return;begin({audio:false});closeDialogue();
 if(!world?.renderer){toast('Fireworks need the 3D view.');return;}
 if(state.watchingFireworks){state.watchingFireworks=false;world.stopFireworks();$('fireworks').setAttribute('aria-pressed','false');$('fireworks').querySelector('span').textContent='Fireworks';await world.go(fireworksReturn.position,fireworksReturn.look);return;}
 const p=world.camera.position;fireworksReturn={position:[p.x,p.y,p.z],look:[p.x-Math.sin(world.yaw)*10,p.y+Math.sin(world.pitch)*10,p.z-Math.cos(world.yaw)*10]};state.watchingFireworks=true;$('fireworks').setAttribute('aria-pressed','true');$('fireworks').querySelector('span').textContent='Back to Puja';await world.go([0,2,24],[0,14,48]);if(state.watchingFireworks)world.startFireworks();
}
let fireworksReturn=null;
$('begin').onclick=()=>begin();$('fireworks').onclick=watchFireworks;$('sound').onclick=()=>sound(!state.sound);$('guide').onclick=()=>openModal('guide-modal');$('places').onclick=()=>openModal('places-modal');$('fallback-explore').onclick=()=>openModal('places-modal');$('references').onclick=()=>{$('guide-modal').close();openModal('credits-modal');};$('photo').onclick=postcard;
document.querySelector('.brand').onclick=e=>{e.preventDefault();go('street');};
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{if(dialog.id==='game-modal')range?.stop();resumeInput();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});});
$('close-dialogue').onclick=closeDialogue;$('translate').onclick=()=>{const hidden=$('dialogue-en').classList.toggle('hidden');$('translate').textContent=hidden?'Translate to English ↗':'Hide English translation ↑';};$('listen').onclick=()=>speakCharacter(state.currentCharacter?.id,{explicit:true});
$('dialogue-action').onclick=()=>{const c=state.currentCharacter;if(!c)return;if(c.do==='queue')joinQueue();if(c.do==='shop')openShop(c.shop);if(c.do==='balloon')openBalloonShop();if(c.do==='game')openGame();};
$('next-moment').onclick=async()=>{if(!state.entered)return joinQueue();if(!state.moments.has('dhaki')){await go('dhaki');talk('dhaki');}else if(!state.moments.has('tea')){await go('tea');talk('tea');}else if(!state.moments.has('game')){await go('balloons');talk('game');}else if(!state.moments.has('greeting')){await go('street');await approach('neighbour');talk('neighbour');}else postcard();};
for(const place of PLACES){const button=document.createElement('button');button.className='place-card';button.innerHTML=`<span>${place.number} · ${place.bn}</span><i>↗</i><h3>${place.title}</h3><p>${place.description}</p>`;button.onclick=async()=>{$('places-modal').close();await go(place.id);const character=place.id==='balloons'?'game':place.id;if(CHARACTERS[character]&&place.id!=='queue')talk(character);};$('place-grid').append(button);}
const markerButtons=[];for(const [id,c] of Object.entries(CHARACTERS)){const button=document.createElement('button');button.className='marker';button.innerHTML=`<span>${c.icon}</span>Talk to ${c.name.split(' · ')[0]}<span>↗</span>`;button.style.display='none';button.setAttribute('aria-label',`${c.label}: ${c.name}`);button.onclick=()=>talk(id);$('markers').append(button);markerButtons.push({id,c,button});}
for(const colour of BALLOON_COLOURS){const button=document.createElement('button');button.className='colour-swatch';button.style.background=colour.hex;button.dataset.hex=colour.hex;button.setAttribute('aria-label',colour.name+' balloon');button.setAttribute('aria-pressed','false');button.onclick=()=>selectBalloon(colour.hex,colour.name);$('colour-swatches').append(button);}
$('custom-colour').oninput=e=>selectBalloon(e.target.value,'Your custom colour');$('buy-balloon').onclick=buyBalloon;
$('postcard-name').oninput=updatePostcard;$('restart-game').onclick=()=>{range?.restart();$('game-message').textContent='A fresh board. Take a breath and steady your aim.';};$('fire-cork').onclick=()=>range?.fire();
addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select'))return;const key=e.key.toLowerCase();if(key==='escape'){closeDialogue();return;}if(document.querySelector('dialog[open]'))return;if(key==='m'&&!state.queuing){e.preventDefault();openModal('places-modal');return;}if(state.inputPaused)return;
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();if(state.started&&!state.queuing)world?.setKey(key,true);}
 if(key==='e'&&state.started){const visible=markerButtons.filter(m=>m.button.style.display!=='none').sort((a,b)=>Number(a.button.dataset.distance)-Number(b.button.dataset.distance));if(visible[0])talk(visible[0].id);}
});
addEventListener('keyup',e=>world?.setKey(e.key.toLowerCase(),false));addEventListener('blur',()=>world?.stop());
for(const button of document.querySelectorAll('[data-walk]')){const release=()=>world?.setKey(button.dataset.walk,false);button.onpointerdown=e=>{e.preventDefault();if(!state.inputPaused&&!state.queuing){world?.setKey(button.dataset.walk,true);button.setPointerCapture(e.pointerId);}};button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;}
document.addEventListener('visibilitychange',()=>{world?.stop();if(document.hidden){$('dhak-audio').pause();stopVoice();}else if(state.sound)$('dhak-audio').play().catch(()=>sound(false));});
function onFrame(position){
 if(!world?.renderer||!state.started)return;const occupied=[];
 for(const m of markerButtons){const anchor=personPosition(m.id),p=world.project(anchor),d=Math.hypot(position.x-anchor[0],position.z-anchor[2]);let visible=p.visible&&canInteract(m.id);if(visible&&occupied.some(q=>Math.abs(q.x-p.x)<150&&Math.abs(q.y-p.y)<48))visible=false;if(visible)occupied.push(p);m.button.style.display=visible?'flex':'none';if(visible){m.button.style.left=`${p.x}px`;m.button.style.top=`${p.y}px`;m.button.dataset.distance=d;}}
 if(state.currentCharacter&&!$('dialogue').classList.contains('hidden')&&!canInteract(state.currentCharacter.id))closeDialogue();

 if(!world.target&&!state.queuing)$('location').textContent=position.z<0?'Inside the pandal':position.x<-6?'The cha & street food lane':position.x>6?'The fairground & mishti corner':'The neighbourhood lane';
}
try{world=new PujoWorld($('world'),{onFrame,onMove:()=>{if(performance.now()-lastQueueNotice>7000){lastQueueNotice=performance.now();toast('Join the queue at the entrance to step inside the pandal.');}},onReady:ready,onFail:fail});}catch(error){fail(error);}
addEventListener('pageshow',()=>world?.stop());updateJourney();selectBalloon(selectedBalloon.hex,selectedBalloon.name);

try{const saved=JSON.parse(sessionStorage.getItem('pujo-balloon'));if(saved){const choice=balloonChoice(saved.hex,saved.name);if(choice){state.balloon=choice;showCompanion();}}}catch{}
