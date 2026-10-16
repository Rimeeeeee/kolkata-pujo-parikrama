export function mobileLayout(width,height,coarse=false){
 const touch=coarse||Math.min(width,height)<=600;
 return {touch,rotate:touch&&height>width};
}

// A small dead zone prevents drift; the circular limit keeps diagonals at walking speed.
export function joystickVector(dx,dy,radius){
 if(![dx,dy,radius].every(Number.isFinite)||radius<=0)return {x:0,y:0};
 const distance=Math.hypot(dx,dy),strength=Math.max(0,(Math.min(1,distance/radius)-.12)/.88);
 return strength>0?{x:dx/distance*strength,y:dy/distance*strength}:{x:0,y:0};
}

export function installJoystick(element,{onMove,canMove}){
 let pointer=null,origin=null;
 function reset(){
  const previous=pointer;pointer=null;origin=null;
  element.classList.remove('active');element.style.setProperty('--stick-x','0px');element.style.setProperty('--stick-y','0px');
  onMove(0,0);
  if(previous!==null&&element.hasPointerCapture(previous))element.releasePointerCapture(previous);
 }
 function move(event){
  if(event.pointerId!==pointer)return;
  if(!canMove()){reset();return;}
  event.preventDefault();const radius=Math.max(1,origin.width/2-24),v=joystickVector(event.clientX-origin.x,event.clientY-origin.y,radius);
  element.style.setProperty('--stick-x',`${v.x*radius}px`);element.style.setProperty('--stick-y',`${v.y*radius}px`);
  onMove(v.x,-v.y);
 }
 element.addEventListener('pointerdown',event=>{
  if(pointer!==null||event.button!==0||!canMove())return;
  event.preventDefault();const rect=element.getBoundingClientRect();origin={x:rect.left+rect.width/2,y:rect.top+rect.height/2,width:rect.width};
  pointer=event.pointerId;element.setPointerCapture(pointer);element.classList.add('active');move(event);
 });
 element.addEventListener('pointermove',move);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,event=>{if(event.pointerId===pointer)reset();});
 return {reset};
}
