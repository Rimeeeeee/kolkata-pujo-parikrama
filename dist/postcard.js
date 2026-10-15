import {postcardName} from './fairground-state.js';
export function drawPostcard(canvas,source,name=''){
 canvas.width=1440;canvas.height=1060;const ctx=canvas.getContext('2d');ctx.fillStyle='#f4e9d1';ctx.fillRect(0,0,1440,1060);
 const box={x:35,y:35,w:1370,h:790},ratio=Math.max(box.w/source.width,box.h/source.height),sw=box.w/ratio,sh=box.h/ratio;
 ctx.drawImage(source,(source.width-sw)/2,(source.height-sh)/2,sw,sh,box.x,box.y,box.w,box.h);
 ctx.fillStyle='#754031';ctx.font='italic 60px "Cormorant Garamond",serif';ctx.fillText('From Kolkata, with Pujo.',55,903);
 const clean=postcardName(name);if(clean){let size=32;const text=`With Puja love, ${clean}`;do{ctx.font=`${size}px "Noto Serif Bengali",serif`;if(ctx.measureText(text).width<1300)break;size-=1;}while(size>16);ctx.fillText(text,58,960);}
 ctx.font='14px "DM Sans",sans-serif';ctx.fillStyle='#8e7960';ctx.fillText('PUJO PARIKRAMA  /  A LITTLE EVENING TO REMEMBER',58,1016);return canvas.toDataURL('image/png');
}
