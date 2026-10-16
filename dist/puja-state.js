export const PUJA_MODES={
 saptami:{title:'Saptamir sandhya',bn:'সপ্তমীর সন্ধ্যা',time:'SAPTAMI EVENING',daylight:false,fireworks:true,description:'The familiar evening, dhak and arati.'},
 ashtami:{title:'Ashtamir anjali',bn:'অষ্টমীর অঞ্জলি',time:'ASHTAMI MORNING',daylight:true,fireworks:false,description:'Morning light and three rounds of flower offerings.'},
 navami:{title:'Nabamir dhunuchi naach',bn:'নবমীর ধুনুচি নাচ',time:'NAVAMI EVENING',daylight:false,fireworks:true,description:'Ask the dhaki to begin, then join the dance circle.'},
 dashami:{title:'Dashamir sindoor khela',bn:'দশমীর সিঁদুর খেলা',time:'DASHAMI AFTERNOON',daylight:true,fireworks:false,description:'Meet Paromita-di and share the colours of Bijoya.'}
};
export function newPuja(mode='saptami'){return {mode:PUJA_MODES[mode]?mode:'saptami',phase:'idle',round:0,elapsed:0,started:false,joined:false,applied:0};}
export function nearXZ(a,b,radius=2.65){return !!a&&!!b&&Math.hypot(a.x-b.x,a.z-b.z)<=radius;}
export function transitionPuja(state,action,context={}){
 const s={...state};const allowed=context.entered&&!context.blocked;
 if(action==='start'&&allowed&&s.phase==='idle'){
  if(s.mode==='ashtami'&&context.nearPriest)return {...s,phase:'gathering',round:1,elapsed:0,started:true};
  if(s.mode==='navami'&&context.nearDhaki)return {...s,phase:'dancing',started:true,elapsed:0};
  if(s.mode==='dashami'&&context.nearHost)return {...s,phase:'playing',started:true,elapsed:0};
 }
 if(action==='perform'&&allowed){
  if(s.mode==='ashtami'&&s.phase==='ready'&&context.nearPriest)return {...s,phase:'offering',elapsed:0};
  if(s.mode==='navami'&&s.phase==='dancing'&&context.nearDancers)return {...s,phase:'joined',joined:true,elapsed:0};
  if(s.mode==='dashami'&&s.phase==='playing'&&context.nearWomen)return {...s,phase:'applying',joined:true,elapsed:0};
 }
 if(action==='leave'){
  if(s.mode==='navami'&&s.joined)return {...s,phase:'dancing',joined:false,elapsed:0};
  if(s.mode==='dashami')return {...s,phase:s.started?'playing':'idle',joined:false,elapsed:0};
  return newPuja(s.mode);
 }
 if(action==='tick'&&Number.isFinite(context.dt)&&context.dt>0){
  if(s.mode==='ashtami'&&s.started&&(context.nearPriest||s.phase==='offering')){
   const durations={gathering:1.1,receiving:1.5,chanting:2.8,offering:1.15};
   if(durations[s.phase]){s.elapsed+=Math.min(context.dt,.1);if(s.elapsed>=durations[s.phase]){s.elapsed=0;if(s.phase==='gathering')s.phase='receiving';else if(s.phase==='receiving')s.phase='chanting';else if(s.phase==='chanting')s.phase='ready';else if(s.round<3){s.round++;s.phase='receiving';}else s.phase='complete';}}
  }else if(s.mode==='dashami'&&s.phase==='applying'){if(!context.nearWomen)return {...s,phase:'playing',joined:false,elapsed:0};s.elapsed+=Math.min(context.dt,.1);if(s.elapsed>=1.8){s.phase='playing';s.joined=false;s.applied++;s.elapsed=0;}}
 }
 return s;
}
export function pujaControls(s,c){
 const available=c.entered&&!c.blocked;
 const startNear=s.mode==='ashtami'?c.nearPriest:s.mode==='navami'?c.nearDhaki:c.nearHost;
 return {start:available&&s.phase==='idle'&&!!startNear,perform:available&&(s.mode==='ashtami'?s.phase==='ready'&&c.nearPriest:s.mode==='navami'?s.phase==='dancing'&&c.nearDancers:s.phase==='playing'&&c.nearWomen)};
}
