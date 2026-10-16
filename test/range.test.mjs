import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import * as THREE from '../dist/assets/three.module.js';import {balloonPosition} from '../dist/fairground-state.js';
const storage=new Map();Object.assign(globalThis,{document:{hidden:false},devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},addEventListener(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
globalThis.MockRangeRenderer=class{setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}};
let source=await fs.readFile('dist/balloon-range.js','utf8');source=source.replace(/from '(\.\/[^']+)'/g,(_,url)=>'from '+JSON.stringify(pathToFileURL(path.resolve('dist',url)).href)).replace('new THREE.WebGLRenderer(','new globalThis.MockRangeRenderer(');const {BalloonRange}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let finished=0,pops=0;const rect={width:800,height:400};const canvas={addEventListener(){},getBoundingClientRect:()=>rect,setPointerCapture(){}};const range=new BalloonRange(canvas,{onFinish:()=>finished++,onPop:()=>pops++});let now=0;
function advance(frames=60){for(let i=0;i<frames;i++){now+=16;range.frame(now);}}
test('real Three.js shooting scene builds and waits for the first shot to start the clock',()=>{range.start();range.still=true;now=range.last;advance(100);assert.equal(range.clock,0);assert.equal(range.round.seconds,45);assert.equal(range.balloons.length,10);assert(range.popper.children.length>2);});
test('a ballistic cork aimed above a target flies, drops, and actually pops that target',()=>{const target=balloonPosition(7,0,true);const aim=new THREE.Vector3(target.x,target.y+.2,target.z).project(range.camera);range.aim.set(aim.x,aim.y);assert(range.fire());assert.equal(range.corks.length,1);assert.equal(range.round.shots,11);advance(60);assert(range.round.popped.includes(7));assert(range.round.score>20);assert.equal(range.balloons[7].visible,false);assert.equal(pops,1);assert(range.clock>0);});
test('an off-board cork uses ammunition, misses and resets the hit streak',()=>{range.aim.set(.9,.9);range.fire();advance(70);assert.equal(range.round.shots,10);assert.equal(range.round.hits,1);assert.equal(range.round.combo,0);assert.equal(range.round.lastResult,'miss');});
test('timeout ends once, remembers the best score, and blocks additional firing',()=>{range.clock=44.99;advance(10);assert(range.round.ended);assert.equal(finished,1);assert.equal(range.fire(),false);assert(Number(storage.get('pujo-range-best'))>=range.round.score);advance(10);assert.equal(finished,1);});
test('reopening starts a fresh round and keeps the whole board in a phone viewport',()=>{range.stop();range.start();now=range.last;assert.equal(range.round.score,0);assert.equal(range.round.shots,12);rect.width=320;rect.height=300;range.resize();advance(1);for(let i=0;i<10;i++){const p=range.balloons[i].position.clone().project(range.camera);assert(Math.abs(p.x)<.9);assert(Math.abs(p.y)<.9);}range.stop();assert(!range.active);});

test('range shortcuts preserve button and link activation while the focused canvas still fires',()=>{
 const keyboardRange=new BalloonRange(canvas);keyboardRange.start();
 const event=(key,interactive=false,repeat=false)=>({key,repeat,defaultPrevented:false,target:{closest:selector=>selector.split(',').includes(interactive)?{}:null},preventDefault(){this.defaultPrevented=true;}});
 for(const target of ['button','a','input','textarea','select','[role="button"]','[contenteditable]:not([contenteditable="false"])'])for(const key of ['Enter',' ','ArrowLeft']){
  const e=event(key,target);keyboardRange.keyHandler(e);assert(!e.defaultPrevented,`${target} must keep its native ${key} behaviour`);assert.equal(keyboardRange.round.shots,12);assert.equal(keyboardRange.aim.x,0);
 }
 const enter=event('Enter');keyboardRange.keyHandler(enter);assert(enter.defaultPrevented);assert.equal(keyboardRange.round.shots,11);assert.equal(keyboardRange.corks.length,1);
 keyboardRange.cooldown=0;const held=event('Enter',false,true);keyboardRange.keyHandler(held);assert.equal(keyboardRange.round.shots,11,'holding Enter must not repeat fire');
 const space=event(' ');keyboardRange.keyHandler(space);assert(space.defaultPrevented);assert.equal(keyboardRange.round.shots,10);
 const arrow=event('ArrowLeft');keyboardRange.keyHandler(arrow);assert(arrow.defaultPrevented);assert(keyboardRange.aim.x<0);keyboardRange.stop();
});

test('an orientation pause freezes the round and in-flight cork, then resumes without resetting',()=>{
 const game=new BalloonRange(canvas);game.start();assert(game.fire());game.frame(game.last+50);
 const cork=game.corks[0],position=cork.position.clone(),velocity=cork.velocity.clone(),round=game.round,clock=game.clock,motion=game.motion,life=cork.life,cooldown=game.cooldown;
 game.setPaused(true);for(let i=0;i<340;i++)game.frame(game.last+50);
 assert(game.active&&game.paused);assert.equal(game.round,round);assert.equal(game.clock,clock);assert.equal(game.motion,motion);assert.equal(game.cooldown,cooldown);assert.equal(game.corks[0],cork);assert.equal(cork.life,life);assert(cork.position.equals(position));assert(cork.velocity.equals(velocity));assert(!game.fire());
 const aim=game.aim.clone();game.keyHandler({key:'ArrowLeft',target:{},preventDefault(){assert.fail('A paused game must ignore gameplay keys');}});assert(game.aim.equals(aim));
 game.setPaused(false);game.frame(game.last+50);assert(Math.abs(game.clock-clock-.05)<1e-9);assert.equal(game.round.shots,11);assert.equal(game.corks[0],cork);assert(cork.life>life);game.stop();
});
