import {PUJA_MODES} from './puja-state.js';

export function collageLayout(count){
 if(!Number.isInteger(count)||count<1||count>24)throw new Error('Choose between one and 24 memories for your collage.');
 const columns=count===1?1:count<=4?2:3,width=count===1?1200:1800,padding=48,gap=24,header=224,footer=72;
 const tileWidth=(width-padding*2-gap*(columns-1))/columns,photoHeight=Math.round(tileWidth*7/9),tileHeight=photoHeight+216,rows=Math.ceil(count/columns),height=header+rows*tileHeight+(rows-1)*gap+footer;
 const tiles=Array.from({length:count},(_,index)=>{const row=Math.floor(index/columns),rowCount=Math.min(columns,count-row*columns),rowWidth=rowCount*tileWidth+(rowCount-1)*gap;return {x:(width-rowWidth)/2+(index%columns)*(tileWidth+gap),y:header+row*(tileHeight+gap),width:tileWidth,height:tileHeight,photoHeight};});
 return {width,height,tiles,padding};
}
export function captionLines(context,text,width,maxLines=4){
 const characters=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].map(s=>s.segment):Array.from(text);
 const lines=[];let line='';
 for(const character of characters){
  if(line&&context.measureText(line+character).width>width){const space=line.lastIndexOf(' ');if(space>0){lines.push(line.slice(0,space));line=line.slice(space+1)+character;}else{lines.push(line);line=character;}}else line+=character;
 }
 if(line)lines.push(line.trimEnd());
 if(lines.length>maxLines){lines.length=maxLines;let last=lines[maxLines-1];while(last&&context.measureText(last+'…').width>width)last=Array.from(last).slice(0,-1).join('');lines[maxLines-1]=last.trimEnd()+'…';}
 return lines;
}
function loadPhoto(source){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('A saved photo could not be opened. Try creating the collage again.'));image.src=source;});}
export async function drawAlbumCollage(canvas,entries,{loadImage=loadPhoto}={}){
 const layout=collageLayout(entries.length);await globalThis.document?.fonts?.ready;canvas.width=layout.width;canvas.height=layout.height;const c=canvas.getContext('2d');
 c.fillStyle='#f2e5cc';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#8f5b3b';c.font='17px "DM Sans",sans-serif';c.fillText('PUJO PARIKRAMA  /  KOLKATA',48,65);
 c.fillStyle='#75402f';c.font='italic 76px "Cormorant Garamond",serif';c.fillText('My Pujo memories.',48,145);
 const days=new Set(entries.map(e=>e.mode)).size;c.font='23px "DM Sans",sans-serif';c.fillText(`${days} Puja ${days===1?'day':'days'} · ${entries.length} ${entries.length===1?'memory':'memories'}`,51,189);
 for(const [index,entry] of entries.entries()){
  const tile=layout.tiles[index],image=await loadImage(entry.image);
  try{
   c.fillStyle='#fff9ee';c.fillRect(tile.x,tile.y,tile.width,tile.height);c.strokeStyle='#d2b78c';c.lineWidth=1;c.strokeRect(tile.x+.5,tile.y+.5,tile.width-1,tile.height-1);
   const box={x:tile.x+12,y:tile.y+12,width:tile.width-24,height:tile.photoHeight-24},scale=Math.min(box.width/image.width,box.height/image.height),w=image.width*scale,h=image.height*scale;
   c.drawImage(image,box.x+(box.width-w)/2,box.y+(box.height-h)/2,w,h);
   const left=tile.x+22,top=tile.y+tile.photoHeight;c.fillStyle='#874a33';c.font='34px "Cormorant Garamond",serif';c.fillText(PUJA_MODES[entry.mode].title,left,top+38,tile.width-44);
   c.fillStyle='#96734f';c.font='16px "DM Sans",sans-serif';c.fillText(entry.kind==='portrait'?(entry.outfit==='dhoti'?'DHOTI KURTA PORTRAIT':'SARI PORTRAIT'):'A PUJO POSTCARD',left,top+65);
   c.fillStyle='#624735';c.font='23px "Noto Serif Bengali","DM Sans",sans-serif';const caption=entry.caption||entry.place||'A little Pujo memory.';captionLines(c,caption,tile.width-44).forEach((line,i)=>c.fillText(line,left,top+105+i*29));
  }finally{image.close?.();image.removeAttribute?.('src');}
 }
 c.fillStyle='#9b7b56';c.font='16px "DM Sans",sans-serif';c.fillText('PUJO PARIKRAMA  /  SHUBHO SHARODIYA',48,canvas.height-30);return canvas.toDataURL('image/png');
}
