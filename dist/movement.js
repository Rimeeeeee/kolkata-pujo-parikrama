export const PLAYER_RADIUS=.32;
export const WALK_SPEED=4.2;
export const JUMP_SPEED=4.6;
export const JUMP_GRAVITY=14;
// Height is separate from walking/terrain so landing never changes eye level.
export class JumpMotion {
 constructor(){this.reset();}
 start(){if(this.active)return false;this.active=true;this.velocity=JUMP_SPEED;return true;}
 step(dt){
  if(!this.active||!Number.isFinite(dt)||dt<=0)return this.height;
  this.height+=this.velocity*dt-JUMP_GRAVITY*dt*dt/2;this.velocity-=JUMP_GRAVITY*dt;
  if(this.height<=0)this.reset();return this.height;
 }
 reset(){this.active=false;this.height=0;this.velocity=0;}
}
export const QUEUE_PATH=[{x:4.7,z:17.5},{x:4.7,z:2.5},{x:0,z:1},{x:0,z:-5.5}];
export const QUEUE_GAP=1.35;
export function pathLength(points){let total=0;for(let i=1;i<points.length;i++)total+=Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z);return total;}
export function pointOnPath(points,distance){
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(distance<=length){const k=Math.max(0,distance)/length;return {x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k,yaw:Math.atan2(b.x-a.x,b.z-a.z)};}distance-=length;}
 const a=points.at(-2),b=points.at(-1);return {...b,yaw:Math.atan2(b.x-a.x,b.z-a.z)};
}
export const QUEUE_ENTRY=pathLength(QUEUE_PATH.slice(0,3))+1;
export const QUEUE_END=pathLength(QUEUE_PATH);
export const QUEUE_DESTINATIONS=[[-4.6,-7],[4.5,-7],[-5.4,-9],[5.4,-9],[-4.5,-11.5],[4.5,-11.5],[-6.8,-14],[6.8,-14],[-3,-15.5]];
export function queueAdvance(seconds){const duration=1.18,move=.83,phase=seconds%duration,k=Math.min(1,phase/move);const eased=k*k*(3-2*k);return (Math.floor(seconds/duration)+eased)*QUEUE_GAP;}
export function queueSnapshot(seconds,count=9){
 const advance=queueAdvance(seconds),front=14,playerDistance=front-count*QUEUE_GAP+advance;
 const people=Array.from({length:count},(_,i)=>{const distance=front-i*QUEUE_GAP+advance;let point=pointOnPath(QUEUE_PATH,distance);if(distance>QUEUE_END){const [x,z]=QUEUE_DESTINATIONS[i%QUEUE_DESTINATIONS.length],k=Math.min(1,(distance-QUEUE_END)/6);const a=QUEUE_PATH.at(-1);point={x:a.x+(x-a.x)*k,z:a.z+(z-a.z)*k,yaw:Math.atan2(x-a.x,z-a.z)};}return {...point,distance,admitted:distance>=QUEUE_ENTRY};});
 return {people,player:pointOnPath(QUEUE_PATH,playerDistance),playerDistance,ahead:people.filter(p=>!p.admitted).length,total:count,done:playerDistance>=QUEUE_END-.45,moving:seconds%1.18<.83,settled:people.at(-1).distance>=QUEUE_END+6};
}
export function clearSegment(a,b,obstacles,radius=PLAYER_RADIUS){
 const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
 return obstacles.every(o=>{if(o.halfX!==undefined)return !rectIntersects(a,b,o,radius+.015);const t=den?Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.z-a.z)*dz)/den)):0;return Math.hypot(a.x+dx*t-o.x,a.z+dz*t-o.z)>radius+(o.radius??.32)+.015;});
}
function localPoint(p,o){const c=Math.cos(o.rotation||0),s=Math.sin(o.rotation||0),x=p.x-o.x,z=p.z-o.z;return {x:x*c-z*s,z:x*s+z*c};}
function worldPoint(p,o){const c=Math.cos(o.rotation||0),s=Math.sin(o.rotation||0);return {x:o.x+p.x*c+p.z*s,z:o.z-p.x*s+p.z*c};}
// Segment/slab test shares the same padded footprint used by walking and routing.
function rectIntersects(a,b,o,padding){
 const p=localPoint(a,o),q=localPoint(b,o);let lo=0,hi=1;
 for(const [axis,half] of [['x',o.halfX+padding],['z',o.halfZ+padding]]){
  const delta=q[axis]-p[axis];if(Math.abs(delta)<1e-10){if(Math.abs(p[axis])>half)return false;continue;}
  const t1=(-half-p[axis])/delta,t2=(half-p[axis])/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;
 }return true;
}
function slidePastRect(previous,next,o,padding){
 const p=localPoint(previous,o),q=localPoint(next,o),hx=o.halfX+padding,hz=o.halfZ+padding;
 if(Math.abs(q.x)>=hx||Math.abs(q.z)>=hz)return next;
 // Preserve the entry face, including long movement split into small substeps.
 if(Math.abs(p.x)>=hx-1e-8)q.x=Math.sign(p.x)*hx;
 else if(Math.abs(p.z)>=hz-1e-8)q.z=Math.sign(p.z)*hz;
 else if(hx-Math.abs(q.x)<hz-Math.abs(q.z))q.x=(Math.sign(q.x)||1)*hx;
 else q.z=(Math.sign(q.z)||1)*hz;
 return worldPoint(q,o);
}
// Small substeps prevent tunnelling; projecting only inward motion permits sliding.
export function moveAmongPeople(from,target,obstacles,radius=PLAYER_RADIUS){
 let p={...from};const distance=Math.hypot(target.x-from.x,target.z-from.z),steps=Math.max(1,Math.ceil(distance/.12)),dx=(target.x-from.x)/steps,dz=(target.z-from.z)/steps;
 for(let step=0;step<steps;step++){
  let next={x:p.x+dx,z:p.z+dz};
  for(let pass=0;pass<3;pass++)for(const o of obstacles){if(o.halfX!==undefined){next=slidePastRect(p,next,o,radius+.025);continue;}const separation=radius+(o.radius??.32)+.025,vx=next.x-o.x,vz=next.z-o.z,length=Math.hypot(vx,vz);if(length<separation){const sx=p.x-o.x,sz=p.z-o.z;const normalLength=Math.hypot(sx,sz)||1,nx=normalLength===1&&sx===0&&sz===0?1:sx/normalLength,nz=sz/normalLength;const mx=next.x-p.x,mz=next.z-p.z,inward=Math.min(0,mx*nx+mz*nz);next={x:next.x-inward*nx,z:next.z-inward*nz};const rx=next.x-o.x,rz=next.z-o.z,d=Math.hypot(rx,rz);if(d<separation)next={x:o.x+(d?rx/d:nx)*separation,z:o.z+(d?rz/d:nz)*separation};}}
  p=next;
 }return p;
}
export function crowdPath(start,goal,obstacles,walkable=()=>true,radius=PLAYER_RADIUS){
 const segment=(a,b)=>{const steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.25);for(let i=0;i<=steps;i++){const k=i/(steps||1);if(!walkable({x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k}))return false;}return clearSegment(a,b,obstacles,radius);};
 const clear=p=>walkable(p)&&clearSegment(p,p,obstacles,radius+.065);
 let end={...goal};if(!clear(end)){for(let radius=.45;radius<=1.8;radius+=.25){let found=false;for(let j=0;j<20;j++){const a=j*Math.PI/10,p={x:goal.x+Math.cos(a)*radius,z:goal.z+Math.sin(a)*radius};if(clear(p)){end=p;found=true;break;}}if(found)break;}}
 if(segment(start,end)&&walkable(end))return [end];
 const size=.65,key=(x,z)=>x+','+z,toCell=p=>({x:Math.round(p.x/size),z:Math.round(p.z/size)}),s=toCell(start);let g=toCell(end);const candidates=[];for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){const c={x:g.x+x,z:g.z+z},p={x:c.x*size,z:c.z*size};if(clear(p)&&segment(p,end))candidates.push({...c,d:Math.hypot(p.x-end.x,p.z-end.z)});}if(!candidates.length)return [];candidates.sort((a,b)=>a.d-b.d);g=candidates[0];const open=[{...s,cost:0,f:0}],costs=new Map([[key(s.x,s.z),0]]),parents=new Map();let last=null;
 for(let tries=0;open.length&&tries<4500;tries++){
  open.sort((a,b)=>a.f-b.f);const current=open.shift(),ck=key(current.x,current.z);if(current.x===g.x&&current.z===g.z){last=current;break;}
  const a=current.x===s.x&&current.z===s.z?start:{x:current.x*size,z:current.z*size};for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=current.x+dx,nz=current.z+dz,b={x:nx*size,z:nz*size};if(b.x<-10.7||b.x>10.7||b.z<-16.2||b.z>27||!clear(b)||!segment(a,b))continue;const k=key(nx,nz),cost=current.cost+Math.hypot(dx,dz);if(cost>=(costs.get(k)??Infinity))continue;costs.set(k,cost);parents.set(k,current);open.push({x:nx,z:nz,cost,f:cost+Math.hypot(g.x-nx,g.z-nz)});}
 }
 if(!last)return [];
 const route=[];while(last.x!==s.x||last.z!==s.z){route.push({x:last.x*size,z:last.z*size});last=parents.get(key(last.x,last.z));if(!last)return [];}
 route.reverse();route.push(end);const simplified=[];let a=start;for(let i=0;i<route.length;){let j=i;while(j+1<route.length&&segment(a,route[j+1]))j++;simplified.push(route[j]);a=route[j];i=j+1;}return simplified;
}
