export const RANGE={shots:12,seconds:45,targetCount:10,planeZ:-7,radiusX:.29,radiusY:.39};
export function newRangeRound(){return {shots:RANGE.shots,score:0,popped:[],combo:0,hits:0,seconds:RANGE.seconds,started:false,lastResult:null,ended:false,won:false};}
export function balloonPosition(index,time=0,still=false){
 const col=index%5,row=Math.floor(index/5),phase=index*1.67;
 return {x:-1.9+col*.95+(still?0:Math.sin(time*1.3+phase)*.17),y:1.55+row*1.08+(still?0:Math.cos(time*1.1+phase)*.08),z:RANGE.planeZ};
}
export function segmentAtBoard(previous,next){
 if(previous.z<RANGE.planeZ||next.z>RANGE.planeZ||previous.z===next.z)return null;
 const k=(RANGE.planeZ-previous.z)/(next.z-previous.z);
 return {x:previous.x+(next.x-previous.x)*k,y:previous.y+(next.y-previous.y)*k,z:RANGE.planeZ};
}
export function hitAtPoint(point,time,popped=[],still=false){
 if(!point)return null;let closest=null;
 for(let i=0;i<RANGE.targetCount;i++){if(popped.includes(i))continue;const p=balloonPosition(i,time,still);const distance=Math.hypot((point.x-p.x)/RANGE.radiusX,(point.y-p.y)/RANGE.radiusY);if(distance<=1&&(!closest||distance<closest.distance))closest={index:i,distance,precision:1-distance};}
 return closest;
}
export function spendCork(round){if(round.ended||round.shots<=0)return round;return {...round,shots:round.shots-1,started:true};}
export function resolveCork(round,hit){
 if(round.ended)return round;if(!hit||round.popped.includes(hit.index))return {...round,combo:0,lastResult:'miss'};
 const combo=Math.min(5,round.combo+1),popped=[...round.popped,hit.index],won=popped.length===RANGE.targetCount;
 const points=10+Math.round(15*Math.max(0,Math.min(1,hit.precision)))+combo*5;
 return {...round,score:round.score+points+(won?Math.ceil(round.seconds)*2:0),popped,combo,hits:round.hits+1,lastResult:hit.precision>.8?'centre':'hit',won,ended:won};
}
export function tickRound(round,seconds,hasCorkInFlight=false){if(round.ended)return round;const left=Math.max(0,seconds);return {...round,seconds:left,ended:left===0||(round.shots===0&&!hasCorkInFlight)};}
export const BALLOON_COLOURS=[{name:'Vermilion',hex:'#cf4f44'},{name:'Sky blue',hex:'#539ec9'},{name:'Marigold',hex:'#efb43e'},{name:'Rose pink',hex:'#dd83ae'},{name:'Leaf green',hex:'#78a75c'},{name:'Lavender',hex:'#9b84c9'},{name:'Ivory',hex:'#f0dfb6'},{name:'Tangerine',hex:'#e68d42'}];
export function balloonChoice(hex,name='Your colour'){return /^#[0-9a-f]{6}$/i.test(hex)?{hex:hex.toLowerCase(),name:String(name).slice(0,30)}:null;}
export function postcardName(value){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,40);}
