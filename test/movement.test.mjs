import {test} from 'node:test';import assert from 'node:assert/strict';
import {moveAmongPeople,crowdPath,clearSegment,queueSnapshot,QUEUE_GAP,JumpMotion} from '../dist/movement.js';

test('a jump has a bounded arc and lands without bouncing or airborne retriggers',()=>{
 const jump=new JumpMotion();assert(jump.start());let peak=0;
 for(let i=0;i<50;i++){peak=Math.max(peak,jump.step(.02));if(jump.active)assert(!jump.start());}
 assert(peak>.7&&peak<.8);assert.equal(jump.height,0);assert.equal(jump.velocity,0);assert(!jump.active);assert(jump.start());jump.step(.1);jump.reset();assert.equal(jump.height,0);assert(!jump.active);
});
test('jump physics is frame-rate independent and ignores invalid elapsed time',()=>{
 const a=new JumpMotion(),b=new JumpMotion();a.start();b.start();for(let i=0;i<30;i++)a.step(.01);for(let i=0;i<6;i++)b.step(.05);assert(Math.abs(a.height-b.height)<1e-10);assert(Math.abs(a.velocity-b.velocity)<1e-10);const height=a.height;for(const dt of [NaN,-1,0,Infinity])assert.equal(a.step(dt),height);
});

test('solid rotated counters stop long steps, permit sliding and route around the footprint',()=>{
 const rotation=.61,c=Math.cos(rotation),s=Math.sin(rotation),toWorld=(x,z)=>({x:x*c+z*s,z:-x*s+z*c}),toLocal=p=>({x:p.x*c-p.z*s,z:p.x*s+p.z*c});
 const counter={x:0,z:0,halfX:2.05,halfZ:.9,rotation},from=toWorld(0,3),end=toWorld(0,-3),stopped=moveAmongPeople(from,end,[counter]);
 assert(toLocal(stopped).z>=1.245-1e-8);assert(!clearSegment(from,end,[counter]));
 let p=stopped;for(let i=0;i<100;i++){const q=toLocal(p);p=moveAmongPeople(p,toWorld(q.x+.06,q.z-.03),[counter]);assert(clearSegment(p,p,[counter]));}assert(toLocal(p).x>3);
 const route=crowdPath(from,end,[counter]);assert(route.length>1);let previous=from;for(const q of route){assert(clearSegment(previous,q,[counter]));previous=q;}assert(Math.hypot(previous.x-end.x,previous.z-end.z)<.01);
});
test('walking cannot tunnel through a person and can slide around them',()=>{const people=[{x:0,z:0,radius:.3}];let p=moveAmongPeople({x:-3,z:0},{x:3,z:0},people);assert(p.x<-.62);for(let i=0;i<100;i++){p=moveAmongPeople(p,{x:p.x+.07,z:p.z+.035},people);assert(Math.hypot(p.x,p.z)>=.645-1e-6);}assert(p.x>1);});
test('guided route passes around people rather than crossing them',()=>{const people=[{x:0,z:0,radius:.3},{x:0,z:1,radius:.3}];const start={x:-3,z:0},path=crowdPath(start,{x:3,z:0},people);assert(path.length>1);let previous=start;for(const p of path){assert(clearSegment(previous,p,people));previous=p;}assert(Math.abs(previous.x-3)<.01);});
test('queue retains order, a stable following gap and counts actual admissions',()=>{let count=9;for(let t=0;t<24;t+=.04){const s=queueSnapshot(t);assert(s.ahead<=count);count=s.ahead;assert.equal(s.ahead,s.people.filter(p=>!p.admitted).length);const ahead=s.people.at(-1);assert(Math.abs(ahead.distance-s.playerDistance-QUEUE_GAP)<1e-9);assert(Math.hypot(ahead.x-s.player.x,ahead.z-s.player.z)>.65);for(let i=1;i<s.people.length;i++)assert(s.people[i-1].distance>s.people[i].distance);}assert.equal(count,0);});
