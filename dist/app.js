import {CAT_SPOT,canPetCat,CatSound} from './bench-cat.js';
import {PujoWorld} from './world.js';
import {PLACES} from './game-state.js';
import {CHARACTERS,STALL_MENUS} from './neighbourhood.js';
import {BALLOON_COLOURS,balloonChoice,newRangeRound,postcardName} from './fairground-state.js';
import {BalloonRange} from './balloon-range.js';
import {drawPostcard} from './postcard.js';
import {withinReach} from './interaction.js';
import {queueSnapshot} from './movement.js';
import {PHOTO_SPOT,drawPortraitCard} from './photo-booth.js';
import {mobileLayout,installJoystick} from './touch-controls.js';
import {PUJA_MODES} from './puja-state.js';
import {PujaRituals} from './puja-rituals.js';
import {MemoryAlbum,ALBUM_LIMIT} from './memory-album.js';
import {drawAlbumCollage} from './album-collage.js';
import {ART_SPOT,addMotif,drawDesign} from './alpona-corner.js';

const $=id=>document.getElementById(id);
const catSound=new CatSound();
const state={started:false,entered:false,queuing:false,sound:false,moments:new Set(),round:newRangeRound(),currentCharacter:null,place:'street',inputPaused:false,balloon:null,purchases:[],shop:null,watchingFireworks:false,pujaMode:'saptami'};
let world=null,range=null,joystick=null,rituals=null,lastRitualUI='',toastTimer=0,lastQueueNotice=0,voiceAudio=null,postcardSnapshot=null,portraitSnapshot=null;
const portraitOptions={outfit:'sari',pose:'namaskar'};
const album=new MemoryAlbum(),captionDrafts=new Map();
const albumSaveRevisions={postcard:0,portrait:0};
let postcardMoment=null,portraitMoment=null,albumFilter='all',lastRemovedMemory=null,collageRevision=0,collageBusy=false;
let artDraft=[],artWasCompleted=false;
let selectedBalloon=balloonChoice(BALLOON_COLOURS[0].hex,BALLOON_COLOURS[0].name);
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4300);}
function ready(){$('loading').classList.add('done');setTimeout(()=>$('loading').remove(),700);}
function fail(error){console.warn('3D unavailable',error);document.body.classList.add('fallback-mode');$('fallback').classList.remove('hidden');ready();}
function mark(moment){state.moments.add(moment);updateJourney();}
function updateJourney(){
 const n=state.moments.size;$('journey-count').textContent=`${n} / 5 moments`;$('progress').style.width=`${n/5*100}%`;
 let title,copy,button;
 if(!state.entered){title='First, follow the sound of dhak.';copy='Join the neighbours at the pandal entrance. Maa is waiting inside.';button='Join the pandal queue';}
 else if(state.pujaMode!=='saptami'){title=PUJA_MODES[state.pujaMode].title;copy=PUJA_MODES[state.pujaMode].description;button=state.pujaMode==='ashtami'?'Go to the purohit':state.pujaMode==='navami'?'Follow the dhak':'Meet Paromita-di';}
 else if(!state.moments.has('dhaki')){title='The heartbeat of the evening.';copy='Bimal-da is playing by the courtyard. Stay and say hello.';button='Meet the dhaki';}
 else if(!state.moments.has('tea')){title='Time for a little cha and adda.';copy='Haru-da has a warm clay cup waiting out on the lane.';button='Visit Haru-da’s tea shop';}
 else if(!state.moments.has('game')){title='Ready, aim, a little joy.';copy='Twelve corks. Ten moving balloons. How steady is your aim?';button='Visit the shooting range';}
 else if(!state.moments.has('greeting')){title='A familiar Puja greeting.';copy='Madhumita-di is out on the lane. Stop by and say hello.';button='Meet a neighbour';}
 else{title='A little evening to remember.';copy='Keep wandering, choose a balloon, or sign your own postcard.';button='Save a Puja postcard';}
 $('journey-title').textContent=title;$('journey-copy').textContent=copy;$('next-moment').innerHTML=`${button} <span>→</span>`;
}
function stopVoice(){if(voiceAudio){voiceAudio.pause();voiceAudio=null;}window.speechSynthesis?.cancel();$('dhak-audio').volume=.48;}
function stopChorus(){$('ritual-chorus').pause();$('ritual-chorus').currentTime=0;$('dhak-audio').volume=.48;}
function chant(){if(!state.sound)return;stopVoice();const audio=$('ritual-chorus');audio.currentTime=0;audio.volume=.8;$('dhak-audio').volume=.16;audio.onended=()=>{$('dhak-audio').volume=.48;};audio.play().catch(()=>{$('dhak-audio').volume=.48;});}
async function sound(on){
 state.sound=on;const audio=$('dhak-audio');audio.volume=.48;
 if(on){try{await audio.play();}catch{state.sound=false;toast('Tap Sound again to start the dhak.');}}else{audio.pause();stopVoice();stopChorus();catSound.stop();}
 $('sound').setAttribute('aria-label',state.sound?'Mute dhak sound':'Turn on dhak sound');$('sound').querySelector('span').textContent=state.sound?'Dhak on':'Sound off';$('sound').style.borderColor=state.sound?'#c9a36d':'';
}
function begin({audio=true}={}){
 if(state.started)return;state.started=true;document.body.classList.add('started');$('welcome').setAttribute('aria-hidden','true');$('welcome').inert=true;$('journey').classList.remove('hidden');
 updateTouchControls();
 if(world?.renderer){world.started=true;world.go(PLACES[0].position,PLACES[0].look);}if(audio)sound(true);updateJourney();
}
function stopWalking(){joystick?.reset();world?.stop();}
function pauseInput(){state.inputPaused=true;stopWalking();world?.cancelMove();updateJumpControl();}
function jumpAvailable(){return state.started&&!state.inputPaused&&!state.queuing&&!!world?.canJump?.();}
function updateJumpControl(){$('jump-button').disabled=!jumpAvailable();}
function requestJump(){if(!jumpAvailable())return false;const jumped=world.jump();updateJumpControl();return jumped;}
function updateTouchControls(){
 const layout=mobileLayout(innerWidth,innerHeight,matchMedia('(pointer: coarse)').matches),gate=$('landscape-modal');
 document.body.classList.toggle('touch-layout',layout.touch);joystick?.reset();range?.setPaused(layout.rotate);
 if(layout.rotate&&!gate.open){stopWalking();state.inputPaused=true;if(world)world.suspended=true;gate.showModal();}
 else if(!layout.rotate&&gate.open)gate.close();
 $('touch-controls').classList.toggle('hidden',!state.started||!layout.touch||layout.rotate);updateJumpControl();
}
addEventListener('resize',updateTouchControls);
function resumeInput(){state.inputPaused=state.queuing||!!world?.ritualLocked||!!document.querySelector('dialog[open]')||!$('dialogue').classList.contains('hidden');if(state.inputPaused)stopWalking();$('move-joystick').setAttribute('aria-disabled',String(state.inputPaused));if(world)world.suspended=!!document.querySelector('dialog[open]');updateJumpControl();}
function openModal(id){closeDialogue();pauseInput();if(world)world.suspended=true;const dialog=$(id);if(!dialog.open)dialog.showModal();}
function closeDialogue(){if(world)world.conversationId=null;$('dialogue').classList.add('hidden');stopVoice();resumeInput();}
async function speakCharacter(id,{explicit=false}={}){
 if((!state.sound&&!explicit)||!canInteract(id))return;const character=CHARACTERS[id];if(!character)return;stopVoice();
 const audio=new Audio(`./assets/voices-natural/${id}.mp3?v=shubho`);voiceAudio=audio;audio.volume=.95;$('dhak-audio').volume=.16;
 audio.onended=()=>{if(voiceAudio===audio){voiceAudio=null;$('dhak-audio').volume=.48;}};
 try{await audio.play();}catch{
  if(voiceAudio!==audio)return;$('dhak-audio').volume=.48;
  if(explicit)toast('Audio is unavailable here. The Bengali greeting and English translation are ready to read.');
 }
}
function personPosition(id){return world?.characterPosition?.(id)||CHARACTERS[id]?.position;}
function canInteract(id,{notify=false}={}){const c=CHARACTERS[id];if(!c||c.interactable===false||state.queuing)return false;if(!world?.renderer)return true;const anchor=personPosition(id);const allowed=anchor&&withinReach(world.camera.position,{x:anchor[0],z:anchor[2]},{entered:state.entered,queuing:state.queuing});if(!allowed&&notify)toast(`Walk closer to ${c.name.split(' · ')[0]} to talk or buy something.`);return !!allowed;}
async function approach(id){if(!world?.renderer)return;const a=personPosition(id);if(!a)return;const from=world.camera.position,dx=from.x-a[0],dz=from.z-a[2],n=Math.hypot(dx,dz)||1;await world.go([a[0]+dx/n*1.9,from.y,a[2]+dz/n*1.9],[a[0],a[1]-.3,a[2]]);}
function talk(id){
 if(!canInteract(id,{notify:true}))return;begin({audio:false});const c={...CHARACTERS[id]};if(id==='dhaki'&&state.pujaMode==='navami'){c.action=rituals?.state.started?'Go to the dance circle →':'Ask to start dhunuchi naach →';c.do=rituals?.state.started?'ritual-go':'ritual-start';}state.currentCharacter={...c,id};pauseInput();world?.greet?.(id);if(c.moment)mark(c.moment);
 $('dialogue-role').textContent=c.role;$('dialogue-name').textContent=c.name;$('dialogue-bn').textContent=c.bn;$('dialogue-en').textContent=c.en;$('dialogue-en').classList.add('hidden');$('translate').textContent='Translate to English ↗';
 $('dialogue-action').classList.toggle('hidden',!c.action);$('dialogue-action').textContent=c.action||'';$('dialogue').classList.remove('hidden');$('translate').focus({preventScroll:true});speakCharacter(id);
}
async function go(id){
 if(state.queuing)return;rituals?.leave();stopChorus();if(state.watchingFireworks){state.watchingFireworks=false;world?.stopFireworks?.();$('fireworks').setAttribute('aria-pressed','false');$('fireworks').querySelector('span').textContent='Fireworks';}begin({audio:false});closeDialogue();const p=PLACES.find(p=>p.id===id);if(!p)return;
 if(['inside','dhaki'].includes(id)&&!state.entered){await joinQueue();if(id==='dhaki'&&world?.renderer)await world.go(p.position,p.look);return;}
 state.place=id;$('location').textContent=p.title;
 const captions={street:['01 — THE PARA','Some streets feel like coming home.'],queue:['02 — THE ENTRANCE','Good things are worth a little wait.'],inside:['03 — THE MANDAP','Stay a moment. The arati has begun.'],dhaki:['04 — THE DHAK','A rhythm that brings everyone home.'],tea:['05 — CHA & ADDA','One cup. A hundred conversations.'],balloons:['06 — THE FAIRGROUND','A steady hand. A happy little pop.']};
 const caption=id==='inside'&&state.pujaMode!=='saptami'?[PUJA_MODES[state.pujaMode].time,PUJA_MODES[state.pujaMode].description]:captions[id]||['THE PARA’S LITTLE SHOPS','There is always room for one more stop.'];$('scene-caption').innerHTML=`<span>${caption[0]}</span><p>${caption[1]}</p>`;
 if(world?.renderer)await world.go(p.position,p.look);else{const character={street:'neighbour',queue:'volunteer',inside:'priest',balloons:'game'}[id]||id;if(id==='inside'){state.entered=true;mark('inside');}talk(character);}
}
async function joinQueue(){
 begin({audio:false});closeDialogue();if(state.queuing)return;if(state.entered){await go('inside');return;}
 state.queuing=true;pauseInput();if(world)world.locked=true;$('next-moment').disabled=true;$('next-moment').textContent='Following the queue…';toast('You’ve joined the queue. Arjun will guide you inside.');
 $('places').disabled=true;$('photo').disabled=true;$('album').disabled=true;$('fireworks').disabled=true;$('puja-mode').disabled=true;
 if(world?.renderer){const tail=queueSnapshot(0).player;await world.go([tail.x,1.9,tail.z],[tail.x,1.8,tail.z-3]);await world.joinQueue(snap=>{$('next-moment').textContent=snap.ahead?`${snap.ahead} people ahead · ${snap.moving?'Following the line…':'Waiting with the neighbours…'}`:'Your turn · stepping inside…';});}
 $('places').disabled=false;$('photo').disabled=false;$('album').disabled=false;$('fireworks').disabled=false;

 state.entered=true;state.queuing=false;if(world)world.locked=false;state.place='inside';mark('inside');$('next-moment').disabled=false;$('location').textContent='Inside the pandal';$('scene-caption').innerHTML=`<span>${PUJA_MODES[state.pujaMode].time}</span><p>${PUJA_MODES[state.pujaMode].description}</p>`;applyPujaUI();resumeInput();toast('শুভ শারদীয়া! Welcome inside the pandal.');
}
function openShop(shop){
 if(!canInteract(shop,{notify:true}))return;state.shop=shop;
 const menu=STALL_MENUS[shop];if(!menu)return;openModal('market-modal');$('market-bn').textContent=menu.bn;$('market-title').textContent=menu.title;$('market-menu').replaceChildren();$('market-message').textContent='What would you like?';
 for(const item of menu.items){const button=document.createElement('button');button.className='menu-item';button.innerHTML=`<span class="menu-icon">${item.icon}</span><span><strong>${item.name}</strong><small lang="bn">${item.bn}</small><p>${item.description}</p></span><b>₹${item.price}<i>Take it ↗</i></b>`;button.setAttribute('aria-label',`Take a virtual ${item.name} for ${item.price} pretend rupees`);button.onclick=()=>purchase(shop,item);$('market-menu').append(button);}
}
function purchase(shop,item){if(state.shop!==shop||!canInteract(shop,{notify:true}))return;if(world?.renderer&&!world.presentPurchase(shop,item))return;state.purchases.push({shop,id:item.id,name:item.name,price:item.price});if(shop==='tea')mark('tea');$('market-message').textContent=`${item.name} is yours. শুভ শারদীয়া! Enjoy your little Puja treat.`;$('carried-name').textContent=item.name;$('put-away').hidden=!world?.renderer;$('market-modal').close();toast(`${item.name} · ₹${item.price} in pretend rupees. Your serving is coming over.`);}
function selectBalloon(hex,name){if(state.queuing||state.balloon)return;const choice=balloonChoice(hex,name);if(!choice)return;selectedBalloon=choice;$('shop-balloon').style.setProperty('--chosen-balloon',choice.hex);$('colour-name').textContent=choice.name;$('custom-colour').value=choice.hex;document.querySelectorAll('.colour-swatch').forEach(button=>button.setAttribute('aria-pressed',button.dataset.hex===choice.hex?'true':'false'));}
function showCompanion(){if(state.balloon)world?.setCompanionBalloon?.(state.balloon.hex);}
function openBalloonShop(){if(!canInteract('seller',{notify:true}))return;if(state.balloon){toast('You already have your balloon. Its colour is fixed for this visit.');return;}begin({audio:false});openModal('balloon-modal');selectBalloon(selectedBalloon.hex,selectedBalloon.name);}
function buyBalloon(){if(state.balloon||!canInteract('seller',{notify:true}))return;state.balloon={...selectedBalloon};try{sessionStorage.setItem('pujo-balloon',JSON.stringify(state.balloon));}catch{}showCompanion();$('balloon-modal').close();toast(`Your ${state.balloon.name.toLowerCase()} balloon will float beside you. The colour is fixed for this visit.`);}
function resetBalloon(){state.balloon=null;world?.setCompanionBalloon?.(null);try{sessionStorage.removeItem('pujo-balloon');}catch{}clearTimeout(toastTimer);$('toast').classList.remove('show');selectBalloon(BALLOON_COLOURS[0].hex,BALLOON_COLOURS[0].name);}
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
 try{range??=new BalloonRange($('range-canvas'),{onUpdate:updateRange,onFinish:()=>mark('game'),onPop:()=>effect('pop'),onFire:()=>effect('fire')});range.start();range.setPaused($('landscape-modal').open);$('range-canvas').focus({preventScroll:true});}catch(error){console.warn('Shooting range unavailable',error);$('game-modal').close();toast('The 3D shooting range needs WebGL. Try a browser with graphics acceleration enabled.');}
}
function updatePostcard(){
 if(!postcardSnapshot)return;const name=postcardName($('postcard-name').value);const canvas=document.createElement('canvas');const data=drawPostcard(canvas,postcardSnapshot,name);$('postcard-image').src=data;$('download-postcard').href=data;$('download-postcard').download=name?`pujo-postcard-${name.replace(/[^\p{L}\p{M}\p{N}]+/gu,'-')}.png`:'a-kolkata-pujo-evening.png';
 resetAlbumSave('postcard');
}
function postcard(){
 if(state.queuing)return;
 begin({audio:false});if(!world?.renderer){toast('Postcards need the 3D view. You can still explore the neighbourhood stories.');return;}
 try{const source=world.screenshot();postcardMoment=memoryMoment();postcardSnapshot=document.createElement('canvas');postcardSnapshot.width=source.width;postcardSnapshot.height=source.height;postcardSnapshot.getContext('2d').drawImage(source,0,0);updatePostcard();openModal('postcard-modal');}catch(error){console.warn(error);toast('The postcard could not be saved in this browser. Try another view.');}
}
function nearArt(){return world?.renderer&&!state.queuing&&withinReach(world.camera.position,ART_SPOT,{entered:state.entered});}
function refreshArt(){const placed=world?.artStamps||[],changed=JSON.stringify(artDraft)!==JSON.stringify(placed);drawDesign($('art-canvas'),artDraft,{preview:true});$('art-undo').disabled=!artDraft.length;$('art-clear').disabled=!artDraft.length;$('art-complete').disabled=!changed;$('art-complete').textContent=artDraft.length?'Complete on the lane ↗':'Remove floor design ↗';$('art-photo').disabled=!placed.length||changed;$('art-message').textContent=changed?(artDraft.length?`${artDraft.length} / 24 motifs · Draft changes. Complete on the lane to apply them.`:'Draft cleared. Choose Remove floor design to erase the alpona already on the lane.'):placed.length?'Your completed alpona is on the lane. Edit it here, or photograph it with the pandal.':'The canvas and lane are clear. Add a motif to begin a new design.';}
async function openArt({walk=true}={}){if(state.queuing)return;begin({audio:false});if(!world?.renderer){toast('The alpona corner needs the 3D view.');return;}if(walk)await go('alpona');if(!nearArt()){toast('Walk closer to the alpona corner beside the entrance.');return;}artDraft=(world.artStamps||[]).map(s=>({...s}));if(!artDraft.length&&!artWasCompleted)addMotif(artDraft);refreshArt();openModal('art-modal');}
function stampArt(x=.5,y=.5){if(!nearArt()||!$('art-modal').open)return;const ok=addMotif(artDraft,{design:$('art-motif').value||'lotus',colour:$('art-colour').value||'rice',size:Number($('art-size').value||.7),x,y});refreshArt();if(!ok)$('art-message').textContent='The canvas holds 24 motifs. Undo one to make room.';}
function completeArt(){if(!nearArt()||!world.applyAlpona(artDraft))return;artWasCompleted=true;refreshArt();$('art-message').textContent=artDraft.length?'Your alpona is on the lane! Close this card to look, or photograph it with the pandal.':'The floor design is removed. Add a motif to start a new draft.';toast(artDraft.length?'Your alpona is ready beside the pandal entrance.':'Your floor design has been removed.');}
function photoArt(){if(!nearArt()||!world?.artStamps?.length||JSON.stringify(artDraft)!==JSON.stringify(world.artStamps))return;try{postcardSnapshot=world.captureAlpona();postcardMoment={...memoryMoment(),place:'My alpona by the pandal'};updatePostcard();$('art-modal').close();openModal('postcard-modal');}catch(error){console.warn('Alpona photograph unavailable',error);toast('The alpona photograph could not be rendered. Please try again.');}}
function nearPhotoBooth(){return world?.renderer&&withinReach(world.camera.position,{x:PHOTO_SPOT.camera[0],z:PHOTO_SPOT.camera[2]},{entered:state.entered,queuing:state.queuing});}
function updatePortraitCard(){if(!portraitSnapshot)return;const name=postcardName($('portrait-name').value),canvas=document.createElement('canvas');const url=drawPortraitCard(canvas,portraitSnapshot,name,portraitOptions.outfit);$('portrait-image').src=url;$('download-portrait').href=url;$('download-portrait').setAttribute('aria-disabled','false');$('download-portrait').download=`kolkata-pujo-${portraitOptions.outfit}${name?'-'+name.replace(/[^\p{L}\p{M}\p{N}]+/gu,'-'):''}.png`;resetAlbumSave('portrait');}
function takePortrait(){if(!nearPhotoBooth()){toast('Come closer to the camera to take your Puja portrait.');return;}portraitOptions.outfit=$('portrait-outfit').value||'sari';portraitOptions.pose=$('portrait-pose').value||'namaskar';try{portraitSnapshot=world.capturePortrait(portraitOptions);portraitMoment={...memoryMoment(),...portraitOptions};updatePortraitCard();$('portrait-message').textContent='Your portrait is ready. The pandal is behind you. Save it below.';}catch(error){portraitSnapshot=null;resetAlbumSave('portrait',true);$('portrait-image').removeAttribute('src');$('download-portrait').removeAttribute('href');$('download-portrait').setAttribute('aria-disabled','true');console.warn('Portrait unavailable',error);$('portrait-message').textContent='The portrait could not be rendered. Try again in a browser with graphics acceleration.';}}
async function openPhotoBooth({walk=true}={}){if(state.queuing)return;begin({audio:false});if(!world?.renderer){toast('Dress-up portraits need the 3D view.');return;}closeDialogue();if(walk){$('postcard-modal').close();await go('portrait');}if(!nearPhotoBooth()){toast('Walk up to the tripod camera in front of the pandal.');return;}openModal('portrait-modal');takePortrait();}
function memoryMoment(){return {mode:state.pujaMode,place:$('location').textContent||'The neighbourhood',capturedAt:new Date().toISOString()};}
function resetAlbumSave(kind,disabled=false){albumSaveRevisions[kind]++;$(`save-${kind}-album`).disabled=disabled;$(`save-${kind}-album`).textContent='Add to album +';$(`${kind}-album-message`).textContent='';}
function invalidateAlbumDownload(){collageRevision++;$('album-download').removeAttribute('href');$('album-collage-image').removeAttribute('src');$('album-collage').hidden=true;}
async function refreshAlbumCount(){const entries=await album.list();$('album-label').textContent=entries.length?`Album (${entries.length})`:'Album';$('album').setAttribute('aria-label',`Open Pujo memory album (${entries.length} ${entries.length===1?'memory':'memories'})`);}
async function saveMemory(kind){
 const button=$(`save-${kind}-album`),message=$(`${kind}-album-message`),moment=kind==='portrait'?portraitMoment:postcardMoment,image=$(`download-${kind}`).href,revision=albumSaveRevisions[kind];
 if(!moment||!(kind==='portrait'?portraitSnapshot:postcardSnapshot)||!image?.startsWith('data:image/png;base64,'))return;
 button.disabled=true;message.textContent='Adding your memory…';
 try{
  let thumbnail=null;const source=$(`${kind}-image`);if(source.complete&&source.naturalWidth){const c=document.createElement('canvas');c.width=360;c.height=Math.round(360*source.naturalHeight/source.naturalWidth);c.getContext('2d').drawImage(source,0,0,c.width,c.height);thumbnail=c.toDataURL('image/jpeg',.82);}
  const result=await album.add({...moment,kind,image,thumbnail});if(revision===albumSaveRevisions[kind]){button.textContent='Saved to album ✓';message.textContent=result.duplicate?'This picture is already in your album.':album.persistent?'Saved to your album in this browser.':'Saved for this page visit. Device storage is unavailable; download your album before leaving.';}invalidateAlbumDownload();await refreshAlbumCount();
 }catch(error){if(revision===albumSaveRevisions[kind])message.textContent=error.message;}finally{if(revision===albumSaveRevisions[kind])button.disabled=false;}
}
async function flushAlbumCaptions(){for(const [id,caption] of [...captionDrafts]){await album.setCaption(id,caption);if(captionDrafts.get(id)===caption)captionDrafts.delete(id);}}
async function openAlbum(){if(state.queuing)return;begin({audio:false});$('postcard-modal').close();$('portrait-modal').close();openModal('album-modal');albumFilter='all';$('album-status').textContent='Opening your memories…';await renderAlbum();}
async function renderAlbum(){
 const entries=await album.list();await refreshAlbumCount();if(!$('album-modal').open)return;
 const days=new Set(entries.map(e=>e.mode));$('album-summary').textContent=`${days.size} of 4 Puja days · ${entries.length} / ${ALBUM_LIMIT} memories`;
 $('album-storage').textContent=album.persistent?'Saved on this browser and device. Your photos and captions stay here; nothing is uploaded. Download a copy to keep or share.':'Device storage is unavailable. This album lasts for this page visit only. Download it before leaving.';
 $('album-undo').hidden=!lastRemovedMemory;
 const filters=$('album-filters');filters.replaceChildren();for(const mode of ['all',...Object.keys(PUJA_MODES)]){const button=document.createElement('button');button.className='album-filter';button.textContent=mode==='all'?'All memories':`${mode==='navami'?'Navami':mode[0].toUpperCase()+mode.slice(1)} (${entries.filter(e=>e.mode===mode).length})`;button.setAttribute('aria-pressed',String(albumFilter===mode));button.onclick=async()=>{try{await flushAlbumCaptions();albumFilter=mode;invalidateAlbumDownload();await renderAlbum();}catch(error){$('album-status').textContent=error.message;}};filters.append(button);}
 const visible=entries.filter(e=>albumFilter==='all'||e.mode===albumFilter),grid=$('album-grid');$('album-export').disabled=collageBusy||!visible.length;grid.replaceChildren();$('album-empty').hidden=!!visible.length;$('album-empty-copy').textContent=entries.length?'No memories from this day yet. Choose the day, then add a postcard or portrait.':'Your album starts with one little memory. Take a postcard, or dress up at the tripod camera.';
 for(const [index,entry] of visible.entries()){
  const card=document.createElement('article');card.className='album-card';const image=document.createElement('img');image.src=entry.thumbnail||entry.image;image.alt=`${PUJA_MODES[entry.mode].title} · ${entry.kind}${entry.outfit?' · '+entry.outfit:''}`;image.loading='lazy';image.decoding='async';card.append(image);
  const details=document.createElement('div');details.className='album-card-copy';const day=document.createElement('h3');day.textContent=PUJA_MODES[entry.mode].title;details.append(day);
  const description=document.createElement('p');description.textContent=`${entry.kind==='portrait'?(entry.outfit==='sari'?'Sari portrait':'Dhoti kurta portrait'):'Postcard'} · ${entry.place}`;details.append(description);
  const label=document.createElement('label');label.textContent=`Caption for ${PUJA_MODES[entry.mode].title} ${entry.kind} ${index+1}`;const input=document.createElement('input');input.type='text';input.maxLength=160;input.value=captionDrafts.get(entry.id)??entry.caption;input.placeholder='A little moment to remember…';label.append(input);details.append(label);
  input.oninput=()=>{captionDrafts.set(entry.id,input.value);invalidateAlbumDownload();};input.onchange=async()=>{try{await flushAlbumCaptions();$('album-status').textContent='Caption saved.';}catch(error){$('album-status').textContent=error.message;}};
  const actions=document.createElement('div');actions.className='album-card-actions';const download=document.createElement('a');download.className='text-button';download.textContent='Save PNG ↓';download.href=entry.image;download.download=`pujo-${entry.mode}-${entry.kind}-${index+1}.png`;actions.append(download);
  const remove=document.createElement('button');remove.className='text-button';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove ${PUJA_MODES[entry.mode].title} ${entry.kind} ${index+1}`);remove.onclick=async()=>{remove.disabled=true;try{await flushAlbumCaptions();lastRemovedMemory=await album.remove(entry.id);captionDrafts.delete(entry.id);invalidateAlbumDownload();await renderAlbum();$('album-status').textContent='Memory removed. You can undo the last removal.';}catch(error){$('album-status').textContent=error.message;remove.disabled=false;}};actions.append(remove);details.append(actions);card.append(details);grid.append(card);
 }
 $('album-status').textContent=entries.length?'Create a collage of the memories shown here, with your captions. Or save each full-size PNG below.':'Add a postcard or portrait to begin collecting all four days.';
}
async function downloadAlbum(){
 if(collageBusy)return;collageBusy=true;const button=$('album-export');button.disabled=true;invalidateAlbumDownload();const revision=collageRevision,filter=albumFilter;$('album-status').textContent='Arranging your photos and captions…';
 try{await flushAlbumCaptions();const entries=(await album.list()).filter(e=>filter==='all'||e.mode===filter),url=await drawAlbumCollage(document.createElement('canvas'),entries);if(revision!==collageRevision)return;const link=$('album-download');link.href=url;link.download='my-pujo-memory-collage.png';$('album-collage-image').src=url;$('album-collage').hidden=false;$('album-status').textContent=`Your collage is ready with ${entries.length} ${entries.length===1?'memory':'memories'}. Save the PNG below, or download individual pictures.`;}catch(error){if(revision===collageRevision)$('album-status').textContent=error.message;}finally{collageBusy=false;button.disabled=!(await album.list()).some(e=>albumFilter==='all'||e.mode===albumFilter);}
}
async function watchFireworks(){
 if(state.queuing||!PUJA_MODES[state.pujaMode].fireworks)return;if(world?.ritualLocked)leaveRitual();begin({audio:false});closeDialogue();
 if(!world?.renderer){toast('Fireworks need the 3D view.');return;}
 if(state.watchingFireworks){state.watchingFireworks=false;world.stopFireworks();$('fireworks').setAttribute('aria-pressed','false');$('fireworks').querySelector('span').textContent='Fireworks';await world.go(fireworksReturn.position,fireworksReturn.look);return;}
 const p=world.camera.position;fireworksReturn={position:[p.x,p.y,p.z],look:[p.x-Math.sin(world.yaw)*10,p.y+Math.sin(world.pitch)*10,p.z-Math.cos(world.yaw)*10]};state.watchingFireworks=true;$('fireworks').setAttribute('aria-pressed','true');$('fireworks').querySelector('span').textContent='Back to Puja';await world.go([0,2,24],[0,14,48]);if(state.watchingFireworks)world.startFireworks();
}
function ritualBlocked(){return state.queuing||!!world?.target||!!document.querySelector('dialog[open]')||!$('dialogue').classList.contains('hidden');}
function updatePujaCaption(){if(state.place==='inside'){$('location').textContent='Inside the pandal';const config=PUJA_MODES[state.pujaMode];$('scene-caption').innerHTML=`<span>${config.time}</span><p>${config.description}</p>`;}}
function applyPujaUI(){const config=PUJA_MODES[state.pujaMode];document.body.classList.toggle('daylight',config.daylight);$('puja-time-label').textContent=config.time;$('puja-mode-label').textContent=state.pujaMode==='navami'?'Navami':state.pujaMode[0].toUpperCase()+state.pujaMode.slice(1);$('puja-mode').disabled=state.queuing;$('fireworks').disabled=state.queuing||!config.fireworks;$('fireworks').title=config.fireworks?'Watch fireworks over the street':'Fireworks are off during daylight Puja';for(const id of Object.keys(PUJA_MODES))$('mode-'+id).setAttribute('aria-pressed',String(id===state.pujaMode));$('sindoor-veil').hidden=state.pujaMode!=='dashami'||!rituals?.state.applied;lastRitualUI='';updateJourney();updatePujaCaption();updateRitualUI();}
function switchPuja(mode){if(state.queuing||!PUJA_MODES[mode])return;closeDialogue();stopWalking();stopChorus();world?.stopFireworks?.();state.watchingFireworks=false;$('fireworks').setAttribute('aria-pressed','false');$('fireworks').querySelector('span').textContent='Fireworks';if(mode!==state.pujaMode)resetBalloon();state.pujaMode=mode;rituals?.setMode(mode);$('puja-modal').close();applyPujaUI();resumeInput();}
async function goRitual(){if(state.queuing||!rituals)return;const mode=state.pujaMode;begin({audio:false});closeDialogue();if(!state.entered)await joinQueue();if(state.pujaMode!==mode)return;if(world.ritualLocked)rituals.leave();resumeInput();world.stopFireworks();state.watchingFireworks=false;$('fireworks').setAttribute('aria-pressed','false');$('fireworks').querySelector('span').textContent='Fireworks';const target=rituals.target();state.place='inside';await world.go(target.position,target.look);applyPujaUI();}
function startRitual(){if(!rituals)return;closeDialogue();const blocked=ritualBlocked();if(!rituals.controls(state.entered,blocked).start)return;world?.cancelJump?.();if(rituals.action('start',state.entered,blocked)){stopWalking();updateRitualUI();}}
function performRitual(){if(!rituals)return;const blocked=ritualBlocked();if(!rituals.controls(state.entered,blocked).perform)return;world?.cancelJump?.();if(rituals.action('perform',state.entered,blocked)){stopWalking();resumeInput();updateRitualUI();}}
function leaveRitual(){rituals?.leave();stopChorus();resumeInput();lastRitualUI='';updateRitualUI();}
function updateRitualUI(){
 const hud=$('ritual-hud'),marker=$('ritual-marker');if(!rituals||!state.started||state.pujaMode==='saptami'){hud.classList.add('hidden');marker.hidden=true;return null;}
 hud.classList.remove('hidden');const s=rituals.state,c=rituals.context(state.entered,ritualBlocked()),controls=rituals.controls(state.entered,ritualBlocked()),anchor=rituals.marker(),point=anchor?world.project(anchor):null;
 marker.hidden=!(controls.start&&point?.visible&&!state.inputPaused);if(!marker.hidden){placeMarker(marker,{x:point.x,y:point.y-35});marker.textContent=s.mode==='ashtami'?'Join anjali ↗':s.mode==='navami'?'Ask for dhunuchi naach ↗':'Paromita-di · Sindoor khela ↗';}
 const key=JSON.stringify([s.mode,s.phase,s.round,s.applied,controls,state.entered,c.nearPriest,c.blocked]);if(key===lastRitualUI)return marker.hidden?null:point;lastRitualUI=key;$('ritual-go').disabled=state.queuing||!!world.target;
 $('ritual-title').textContent=PUJA_MODES[s.mode].bn;let status='';
 if(!state.entered)status='Join the pandal queue first, then walk to the ritual.';
 else if(s.mode==='ashtami'){const copy={idle:'Walk close to Sourav-babu to join three rounds of anjali.',gathering:'The neighbours are gathering around you.',receiving:`Round ${s.round} / 3 · Sourav-babu places flowers in your hands.`,chanting:`Round ${s.round} / 3 · জয় মা দুর্গা! · Joy Maa Durga!`,ready:`Round ${s.round} / 3 · Offer the flowers at Maa’s feet.`,offering:'Your flowers are travelling to Maa’s feet.',complete:'Three offerings complete. জয় মা দুর্গা!'};status=s.started&&!c.nearPriest&&s.phase!=='complete'?'Walk back close to the purohit to continue.':copy[s.phase];}
 else if(s.mode==='navami')status=!s.started?'Walk close to Bimal-da and ask him to begin.':s.joined?'You are dancing with the circle. Leave whenever you like.':controls.perform?'You are close enough. Join the dhunuchi dance.':'Walk close to a dancer around the alpona to join.';
 else status=!s.started?'Meet Paromita-di beside the purohit to begin.':s.phase==='applying'?'You offer sindoor; a neighbour colours your cheeks in return.':s.applied?(controls.perform?'Shubho Bijoya! Your cheeks carry the colours of sindoor.':'Shubho Bijoya! Walk close to the women to play again.'):controls.perform?'The women are playing. Apply and receive a little sindoor.':'Walk close to the women to play sindoor khela.';
 $('ritual-status').textContent=status;$('ritual-start').hidden=s.phase!=='idle';$('ritual-start').disabled=!controls.start;$('ritual-start').textContent=s.mode==='ashtami'?'Join anjali':s.mode==='navami'?'Ask to start naach':'Begin sindoor khela';
 $('ritual-perform').hidden=!s.started||s.phase==='complete';$('ritual-perform').disabled=!controls.perform;$('ritual-perform').textContent=s.mode==='ashtami'?`Throw flowers · ${s.round} / 3`:s.mode==='navami'?'Dance':'Play sindoor khela';$('ritual-go').hidden=s.mode==='navami'&&s.joined;$('ritual-go').textContent=s.mode==='ashtami'?'Go to purohit ↗':s.mode==='navami'?(s.started?'Go to dance circle ↗':'Go to dhaki ↗'):'Meet Paromita-di ↗';$('ritual-leave').hidden=!(s.mode==='ashtami'&&s.started||s.mode==='navami'&&s.joined);$('ritual-leave').textContent=s.mode==='navami'?'Leave dance':'Leave anjali';$('sindoor-veil').hidden=s.mode!=='dashami'||!s.applied;
 return marker.hidden?null:point;
}
let fireworksReturn=null;
$('begin').onclick=()=>begin();$('portrait-outfit').onchange=takePortrait;$('portrait-pose').onchange=takePortrait;$('take-portrait').onclick=takePortrait;$('portrait-name').oninput=updatePortraitCard;$('postcard-dress-up').onclick=()=>openPhotoBooth();$('fireworks').onclick=watchFireworks;$('sound').onclick=()=>sound(!state.sound);$('guide').onclick=()=>openModal('guide-modal');$('places').onclick=()=>openModal('places-modal');$('fallback-explore').onclick=()=>openModal('places-modal');$('references').onclick=()=>{$('guide-modal').close();openModal('credits-modal');};$('photo').onclick=postcard;
document.querySelector('.brand').onclick=e=>{e.preventDefault();go('street');};
$('puja-mode').onclick=()=>openModal('puja-modal');for(const mode of Object.keys(PUJA_MODES))$('mode-'+mode).onclick=()=>switchPuja(mode);$('ritual-go').onclick=goRitual;$('ritual-start').onclick=startRitual;$('ritual-perform').onclick=performRitual;$('ritual-leave').onclick=leaveRitual;$('ritual-marker').onclick=startRitual;
$('album').onclick=openAlbum;$('save-postcard-album').onclick=()=>saveMemory('postcard');$('save-portrait-album').onclick=()=>saveMemory('portrait');$('postcard-view-album').onclick=openAlbum;$('portrait-view-album').onclick=openAlbum;$('album-export').onclick=downloadAlbum;
$('album-undo').onclick=async()=>{try{if(lastRemovedMemory){await album.restore(lastRemovedMemory);lastRemovedMemory=null;invalidateAlbumDownload();await renderAlbum();$('album-status').textContent='Memory restored.';}}catch(error){$('album-status').textContent=error.message;}};
$('album-take-photo').onclick=()=>{$('album-modal').close();postcard();};$('album-choose-day').onclick=()=>{$('album-modal').close();openModal('puja-modal');};
$('album-modal').addEventListener('close',()=>{$('album-grid').replaceChildren();invalidateAlbumDownload();});refreshAlbumCount();
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{if(dialog.id==='game-modal')range?.stop();resumeInput();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});});
$('close-dialogue').onclick=closeDialogue;$('translate').onclick=()=>{const hidden=$('dialogue-en').classList.toggle('hidden');$('translate').textContent=hidden?'Translate to English ↗':'Hide English translation ↑';};$('listen').onclick=()=>speakCharacter(state.currentCharacter?.id,{explicit:true});
$('cat-marker').onclick=petBenchCat;
$('put-away').onclick=()=>{world?.putAwayPurchase();$('put-away').hidden=true;};
$('art-marker').onclick=()=>openArt({walk:false});
$('art-add').onclick=()=>{const [x,y]=({centre:[.5,.5],top:[.5,.18],bottom:[.5,.82],left:[.18,.5],right:[.82,.5]})[$('art-position').value||'centre'];stampArt(x,y);};
$('art-canvas').addEventListener('pointerdown',event=>{event.preventDefault();const r=$('art-canvas').getBoundingClientRect();stampArt((event.clientX-r.left)/r.width,(event.clientY-r.top)/r.height);});
$('art-canvas').addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();stampArt();}});
$('art-undo').onclick=()=>{artDraft.pop();refreshArt();};$('art-clear').onclick=()=>{artDraft=[];refreshArt();};$('art-complete').onclick=completeArt;$('art-photo').onclick=photoArt;
$('camera-marker').onclick=()=>openPhotoBooth({walk:false});
$('dialogue-action').onclick=()=>{const c=state.currentCharacter;if(!c)return;if(c.do==='queue')joinQueue();if(c.do==='shop')openShop(c.shop);if(c.do==='balloon')openBalloonShop();if(c.do==='game')openGame();if(c.do==='ritual-start')startRitual();if(c.do==='ritual-go')goRitual();};
$('next-moment').onclick=async()=>{if(!state.entered)return joinQueue();if(state.pujaMode!=='saptami')return goRitual();if(!state.moments.has('dhaki')){await go('dhaki');talk('dhaki');}else if(!state.moments.has('tea')){await go('tea');talk('tea');}else if(!state.moments.has('game')){await go('balloons');talk('game');}else if(!state.moments.has('greeting')){await go('street');await approach('neighbour');talk('neighbour');}else postcard();};
for(const place of PLACES){const button=document.createElement('button');button.className='place-card';button.innerHTML=`<span>${place.number} · ${place.bn}</span><i>↗</i><h3>${place.title}</h3><p>${place.description}</p>`;button.onclick=async()=>{$('places-modal').close();await go(place.id);if(place.id==='alpona'){await openArt({walk:false});return;}if(place.id==='portrait'){await openPhotoBooth({walk:false});return;}const character=place.id==='balloons'?'game':place.id==='queue'?'volunteer':place.id;if(CHARACTERS[character])talk(character);};$('place-grid').append(button);}
const markerButtons=[];for(const [id,c] of Object.entries(CHARACTERS)){if(c.interactable===false)continue;const button=document.createElement('button');button.className='marker';button.innerHTML=`<span>${c.icon}</span>Talk to ${c.name.split(' · ')[0]}<span>↗</span>`;button.style.display='none';button.setAttribute('aria-label',`${c.label}: ${c.name}`);button.onclick=()=>talk(id);$('markers').append(button);markerButtons.push({id,c,button});}
const nameTags=Object.entries(CHARACTERS).map(([id,c])=>({id,name:c.name}));nameTags.push({id:'sindoor-host',name:'Paromita-di · Sindoor khela'});
for(const tag of nameTags){tag.element=document.createElement('span');tag.element.className='person-name';tag.element.textContent=tag.name;tag.element.style.display='none';$('name-tags').append(tag.element);}
for(const colour of BALLOON_COLOURS){const button=document.createElement('button');button.className='colour-swatch';button.style.background=colour.hex;button.dataset.hex=colour.hex;button.setAttribute('aria-label',colour.name+' balloon');button.setAttribute('aria-pressed','false');button.onclick=()=>selectBalloon(colour.hex,colour.name);$('colour-swatches').append(button);}
$('custom-colour').oninput=e=>selectBalloon(e.target.value,'Your custom colour');$('buy-balloon').onclick=buyBalloon;
$('postcard-name').oninput=updatePostcard;$('restart-game').onclick=()=>{range?.restart();$('game-message').textContent='A fresh board. Take a breath and steady your aim.';};$('fire-cork').onclick=()=>range?.fire();
addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select'))return;const key=e.key.toLowerCase();if(key==='escape'){closeDialogue();return;}if(document.querySelector('dialog[open]'))return;if(key==='m'&&!state.queuing){e.preventDefault();openModal('places-modal');return;}if(state.inputPaused)return;
 if(key===' '&&state.started&&!state.queuing&&!e.target.closest?.('button,a,[role="button"],[contenteditable]:not([contenteditable="false"])')){e.preventDefault();if(!e.repeat)requestJump();return;}
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();if(state.started&&!state.queuing)world?.setKey(key,true);}
 if(key==='e'&&state.started){const visible=markerButtons.filter(m=>m.button.style.display!=='none').sort((a,b)=>Number(a.button.dataset.distance)-Number(b.button.dataset.distance));if(!$('cat-marker').hidden)petBenchCat();else if(!$('art-marker').hidden)openArt({walk:false});else if(!$('camera-marker').hidden)openPhotoBooth({walk:false});else if(visible[0])talk(visible[0].id);}
});
addEventListener('keyup',e=>world?.setKey(e.key.toLowerCase(),false));addEventListener('blur',stopWalking);
joystick=installJoystick($('move-joystick'),{onMove:(right,forward)=>world?.setMoveInput(right,forward),canMove:()=>state.started&&!state.inputPaused&&!state.queuing&&!world?.locked&&!world?.suspended});
$('jump-button').onclick=requestJump;
$('landscape-modal').addEventListener('cancel',event=>event.preventDefault());
document.addEventListener('visibilitychange',()=>{stopWalking();if(document.hidden){$('dhak-audio').pause();stopVoice();stopChorus();catSound.stop();}else if(state.sound)$('dhak-audio').play().catch(()=>sound(false));});
function placeMarker(button,p){const half=(button.offsetWidth||0)/2,height=button.offsetHeight||44,header=document.querySelector('.topbar')?.getBoundingClientRect(),footer=document.querySelector('.bottom-bar')?.getBoundingClientRect(),top=(header?.bottom||0)+8+height,bottom=(footer?.top??innerHeight)-8;button.style.left=`${Math.max(half+12,Math.min(innerWidth-half-12,p.x))}px`;button.style.top=`${Math.max(top,Math.min(bottom,p.y))}px`;}
function updateNameTags(position,occupied){
 const header=document.querySelector('.topbar')?.getBoundingClientRect(),footer=document.querySelector('.bottom-bar')?.getBoundingClientRect();
 for(const tag of nameTags){
  tag.element.style.display='none';if(state.inputPaused||state.queuing||world.renderCamera)continue;
  const host=tag.id==='sindoor-host'?world.rituals?.actors?.[0]:null;
  const anchor=tag.id==='sindoor-host'?(host?.active?[host.g.position.x,host.g.position.y+2.22,host.g.position.z]:null):personPosition(tag.id);
  if(!anchor||Math.hypot(position.x-anchor[0],position.z-anchor[2])>10)continue;
  const point=world.project(anchor);if(!point.visible)continue;
  if(markerButtons.some(m=>m.id===tag.id&&m.button.style.display!=='none'))continue;
  if(point.y<(header?.bottom||0)+36||point.y>(footer?.top??innerHeight)-12)continue;
  if(occupied.some(p=>Math.abs(p.x-point.x)<160&&Math.abs(p.y-point.y)<48))continue;
  tag.element.style.display='block';placeMarker(tag.element,point);occupied.push(point);
 }
}
function catOptions(){return {started:state.started,inputPaused:state.inputPaused,queuing:state.queuing,renderCamera:!!world?.renderCamera,travelling:!!world?.target||!!world?.jumpMotion?.active};}
function petBenchCat(){if(!world?.benchCat||!world.benchCat.pet(world.camera.position,catOptions(),performance.now()/1000))return;if(state.sound)catSound.meow();toast('You gently pet the para cat. It closes its eyes.');}
let catFrameTime=0;
function updateBenchCat(position,occupied){
 const button=$('cat-marker');if(!world.benchCat){button.hidden=true;return;}
 const now=performance.now()/1000,options=catOptions(),enabled=options.started&&!options.inputPaused&&!options.queuing&&!options.renderCamera&&!options.travelling&&!document.hidden;
 const meow=world.benchCat.update(position,Math.max(0,Math.min(.05,now-catFrameTime)),now,{enabled});catFrameTime=now;
 if(meow&&state.sound)catSound.meow();
 const point=world.project([CAT_SPOT.x,CAT_SPOT.y+.85,CAT_SPOT.z]);
 button.hidden=!(point.visible&&canPetCat(position,options));button.disabled=world.benchCat.petLeft>0;
 if(!button.hidden){placeMarker(button,point);occupied.push(point);}
 if(!enabled)catSound.stop();
}
function onFrame(position){
 if(!world?.renderer||!state.started)return;updateJumpControl();const occupied=[],ritualPoint=updateRitualUI();if(ritualPoint)occupied.push(ritualPoint);
 updateBenchCat(position,occupied);
 const artMarker=$('art-marker'),artPoint=world.project([ART_SPOT.x,1.1,ART_SPOT.z]);artMarker.hidden=!(artPoint.visible&&nearArt()&&!state.inputPaused&&!world.renderCamera);if(!artMarker.hidden){placeMarker(artMarker,artPoint);occupied.push(artPoint);}
 $('put-away').hidden=!world.purchase||world.purchase.prop?.visible===false||!!world.ritualLocked||!!world.renderCamera;
 const cameraMarker=$('camera-marker'),cameraPoint=world.project([PHOTO_SPOT.camera[0],2.45,PHOTO_SPOT.camera[2]]);cameraMarker.hidden=!(cameraPoint.visible&&nearPhotoBooth()&&!state.inputPaused&&!world.renderCamera);if(!cameraMarker.hidden){placeMarker(cameraMarker,cameraPoint);occupied.push(cameraPoint);}
 for(const m of markerButtons){const anchor=personPosition(m.id),p=world.project(anchor),d=Math.hypot(position.x-anchor[0],position.z-anchor[2]);let visible=!world.renderCamera&&p.visible&&canInteract(m.id);if(visible&&occupied.some(q=>Math.abs(q.x-p.x)<150&&Math.abs(q.y-p.y)<48))visible=false;if(visible)occupied.push(p);m.button.style.display=visible?'flex':'none';if(visible){placeMarker(m.button,p);m.button.dataset.distance=d;}}
 updateNameTags(position,occupied);
 if(state.currentCharacter&&!$('dialogue').classList.contains('hidden')&&!canInteract(state.currentCharacter.id))closeDialogue();

 if(!world.target&&!state.queuing)$('location').textContent=position.z<0?'Inside the pandal':position.x<-6?'The cha & street food lane':position.x>6?'The fairground & mishti corner':'The neighbourhood lane';
}
try{world=new PujoWorld($('world'),{onFrame,onMove:()=>{if(performance.now()-lastQueueNotice>7000){lastQueueNotice=performance.now();toast('Join the queue at the entrance to step inside the pandal.');}},onReady:ready,onFail:fail});if(world?.renderer)rituals=world.rituals=new PujaRituals(world,{onChant:chant});}catch(error){fail(error);}
addEventListener('pageshow',stopWalking);updateTouchControls();applyPujaUI();selectBalloon(selectedBalloon.hex,selectedBalloon.name);

try{const saved=JSON.parse(sessionStorage.getItem('pujo-balloon'));if(saved){const choice=balloonChoice(saved.hex,saved.name);if(choice){state.balloon=choice;showCompanion();}}}catch{}
