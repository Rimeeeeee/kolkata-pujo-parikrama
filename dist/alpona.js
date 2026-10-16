import * as THREE from './assets/three.module.js';

export const ALPONA_DESIGNS=['lotus','conch','sunburst','leaves','diamond','vine'];
// Six small shared textures keep the floor art crisp without adding model detail.
export function alponaMaterials(){
 return ALPONA_DESIGNS.map((design,index)=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  paintAlpona(canvas.getContext('2d'),design,{accent:['#f4bc55','#ef7254','#f7cc62','#78c6ac','#ee9471','#e6bd62'][index]});
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false,fog:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  material.name=`alpona-${design}`;return material;
 });
}

export function paintAlpona(c,design,{white='#ffffff',accent='#f4bc55'}={}){
 c.translate(256,256);c.lineCap='round';c.lineJoin='round';
  const stroke=(draw,color=white,width=5.2)=>{c.beginPath();c.strokeStyle=color;c.lineWidth=width;draw();c.stroke();};
  const circle=(r,color=white,width=5.2)=>stroke(()=>c.arc(0,0,r,0,Math.PI*2),color,width);
  const dot=(x,y,r=3.4,color=white)=>{c.beginPath();c.fillStyle=color;c.arc(x,y,r,0,Math.PI*2);c.fill();};
  const ringDots=(r,count)=>{for(let i=0;i<count;i++){const a=i*Math.PI*2/count;dot(Math.cos(a)*r,Math.sin(a)*r);}};
  const repeat=(count,draw)=>{for(let i=0;i<count;i++){c.save();c.rotate(i*Math.PI*2/count);draw(i);c.restore();}};
  const petal=(from,to,width,color=white)=>stroke(()=>{c.moveTo(0,from);c.bezierCurveTo(-width,from+20,-width,to-20,0,to);c.bezierCurveTo(width,to-20,width,from+20,0,from);},color);
  // A restrained warm under-line gives the white paint contrast on pale paving.
  circle(222,accent,7);circle(229);circle(213);ringDots(238,48);circle(34,accent,4);circle(23);dot(0,0,6,accent);
  if(design==='lotus'){
   repeat(12,()=>{petal(42,167,40);petal(164,206,13,accent);});circle(176);ringDots(190,36);
  }else if(design==='conch'){
   c.save();c.rotate(-.45);stroke(()=>{c.moveTo(13,-156);c.bezierCurveTo(146,-130,165,36,46,105);c.bezierCurveTo(-5,136,-22,145,-26,174);c.bezierCurveTo(-68,145,-78,111,-58,74);c.bezierCurveTo(-180,-34,-102,-160,13,-156);},white,4);
   stroke(()=>{c.moveTo(-36,66);c.bezierCurveTo(102,76,124,-77,25,-111);c.bezierCurveTo(-59,-147,-112,-31,-44,1);c.bezierCurveTo(15,31,62,-36,18,-56);c.bezierCurveTo(-7,-68,-27,-41,-8,-27);},accent,4);
   for(let i=0;i<4;i++)stroke(()=>{c.moveTo(-40-i*4,91+i*15);c.lineTo(17-i*8,108+i*11);});c.restore();
   repeat(8,()=>petal(179,205,9));
  }else if(design==='sunburst'){
   circle(80);circle(91,accent,4);repeat(20,()=>{petal(101,199,15);stroke(()=>{c.moveTo(0,38);c.lineTo(0,70);});dot(0,154,3,accent);});ringDots(60,20);
  }else if(design==='leaves'){
   repeat(8,()=>{stroke(()=>{c.moveTo(0,46);c.quadraticCurveTo(17,116,0,199);},accent,4);for(const y of [77,120,161])for(const side of [-1,1])stroke(()=>{c.moveTo(0,y);c.quadraticCurveTo(side*53,y-8,side*43,y+23);c.quadraticCurveTo(side*8,y+30,0,y);});});
  }else if(design==='diamond'){
   repeat(4,()=>{stroke(()=>{c.moveTo(0,48);c.lineTo(-57,112);c.lineTo(0,196);c.lineTo(57,112);c.closePath();},white,3.5);petal(74,155,21,accent);dot(0,173,4);});c.save();c.rotate(Math.PI/4);repeat(4,()=>petal(61,132,19));c.restore();
  }else{
   repeat(8,()=>{stroke(()=>{c.moveTo(0,42);c.bezierCurveTo(-80,89,76,151,0,201);},white,3.5);for(const [x,y] of [[-17,80],[17,125],[-10,170]]){stroke(()=>{c.moveTo(x,y);c.quadraticCurveTo(x+40,y-34,x+37,y-3);c.quadraticCurveTo(x+20,y+18,x,y);},accent,3);}});circle(55);ringDots(70,16);
  }
}
