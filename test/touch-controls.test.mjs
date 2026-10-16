import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mobileLayout,joystickVector,installJoystick} from '../dist/touch-controls.js';

test('phones request landscape in portrait and retain touch controls after rotation',()=>{
 assert.deepEqual(mobileLayout(390,844),{touch:true,rotate:true});
 assert.deepEqual(mobileLayout(844,390),{touch:true,rotate:false});
 assert.deepEqual(mobileLayout(768,1024,true),{touch:true,rotate:true});
 assert.deepEqual(mobileLayout(1280,800),{touch:false,rotate:false});
});
test('joystick has a dead zone, proportional travel and a circular speed limit',()=>{
 assert.deepEqual(joystickVector(1,-1,32),{x:0,y:0});
 const half=joystickVector(0,-16,32);assert(half.y<0&&half.y>-.5);assert.equal(half.x,0);
 const full=joystickVector(0,-64,32);assert.equal(full.y,-1);
 const diagonal=joystickVector(100,-100,32);assert(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-10);
 assert.deepEqual(joystickVector(NaN,5,32),{x:0,y:0});
});
function fixture(){
 const events={},captured=new Set(),moves=[],style={setProperty(k,v){this[k]=v;}};let allowed=true;
 const element={style,classList:{add(){},remove(){}},addEventListener:(type,fn)=>events[type]=fn,getBoundingClientRect:()=>({left:10,top:20,width:112,height:112}),setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
 const joystick=installJoystick(element,{onMove:(x,y)=>moves.push({x,y}),canMove:()=>allowed});
 const event=(id,x=66,y=76)=>({pointerId:id,button:0,clientX:x,clientY:y,preventDefault(){}});
 return {events,moves,style,captured,joystick,event,block:()=>allowed=false};
}
test('dragging owns one finger, captures it and stops on release or interruption',()=>{
 for(const release of ['pointerup','pointercancel','lostpointercapture']){
  const f=fixture();f.events.pointerdown(f.event(1));f.events.pointermove(f.event(1,66,20));assert.deepEqual(f.moves.at(-1),{x:0,y:1});
  const count=f.moves.length;f.events.pointerdown(f.event(2,100,76));f.events.pointermove(f.event(2,100,76));f.events.pointerup(f.event(2));assert.equal(f.moves.length,count);assert(f.captured.has(1));
  f.events[release](f.event(1));assert.deepEqual(f.moves.at(-1),{x:0,y:0});assert(!f.captured.size);assert.equal(f.style['--stick-y'],'0px');
  f.events.pointermove(f.event(1,66,20));assert.deepEqual(f.moves.at(-1),{x:0,y:0});
 }
});
test('modal/queue blocking and explicit reset prevent a stuck joystick',()=>{
 const f=fixture();f.events.pointerdown(f.event(1,100,76));assert(f.moves.at(-1).x>0);f.block();f.events.pointermove(f.event(1,110,76));assert.deepEqual(f.moves.at(-1),{x:0,y:0});
 const count=f.moves.length;f.events.pointerdown(f.event(2,100,76));assert.equal(f.moves.length,count);
 const g=fixture();g.events.pointerdown(g.event(3,100,76));g.joystick.reset();assert.deepEqual(g.moves.at(-1),{x:0,y:0});assert(!g.captured.size);
});
