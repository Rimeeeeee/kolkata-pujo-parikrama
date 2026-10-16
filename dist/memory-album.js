import {PUJA_MODES} from './puja-state.js';

export const ALBUM_LIMIT=24;
const ALBUM_IMAGE_BUDGET=32_000_000;
const cleanCaption=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,160);
function memory(input){
 if(!PUJA_MODES[input.mode]||!['postcard','portrait'].includes(input.kind)||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(input.image)||input.image.length>8_000_000)throw new Error('Choose a valid Pujo photo to add.');
 return {id:typeof input.id==='string'?input.id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`,mode:input.mode,kind:input.kind,image:input.image,thumbnail:/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(input.thumbnail)&&input.thumbnail.length<250_000?input.thumbnail:null,caption:cleanCaption(input.caption),place:String(input.place||'The neighbourhood').slice(0,100),outfit:input.outfit==='dhoti'?'dhoti':input.kind==='portrait'?'sari':null,pose:['namaskar','wave','relaxed'].includes(input.pose)?input.pose:null,capturedAt:Number.isFinite(Date.parse(input.capturedAt))?new Date(input.capturedAt).toISOString():new Date().toISOString()};
}
export class MemoryAlbum{
 constructor({indexedDB=globalThis.indexedDB}={}){this.entries=new Map();this.persistent=false;this.db=null;this.pending=Promise.resolve();this.ready=this.open(indexedDB);}
 async open(indexedDB){
  if(!indexedDB)return;
  try{
   this.db=await new Promise((resolve,reject)=>{const request=indexedDB.open('pujo-memory-album',1);request.onupgradeneeded=()=>request.result.createObjectStore('memories',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Storage is busy'));});
   const saved=await new Promise((resolve,reject)=>{const request=this.db.transaction('memories','readonly').objectStore('memories').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
   for(const entry of saved){try{const item=memory(entry);this.entries.set(item.id,item);}catch{/* Ignore a damaged record without discarding other memories. */}}
   this.persistent=true;this.db.onversionchange=()=>{this.db.close();this.db=null;this.persistent=false;};
  }catch{this.db?.close();this.db=null;}
 }
 run(action){const next=this.pending.then(()=>this.ready).then(action);this.pending=next.catch(()=>{});return next;}
 async write(action,entry){
  if(!this.db)return;
  await new Promise((resolve,reject)=>{const tx=this.db.transaction('memories','readwrite');tx.objectStore('memories')[action](entry);tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(new Error('Device storage is full or unavailable. Download a photo or remove a memory, then try again.'));});
 }
 list(){return this.run(()=>[...this.entries.values()].sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt)).map(entry=>({...entry})));}
 add(input){return this.run(async()=>{
  const item=memory(input),duplicate=[...this.entries.values()].find(e=>e.mode===item.mode&&e.kind===item.kind&&e.image===item.image);
  if(duplicate)return {entry:{...duplicate},duplicate:true};
  if(this.entries.size>=ALBUM_LIMIT)throw new Error(`Your album holds ${ALBUM_LIMIT} memories. Remove one before adding another.`);
  if([...this.entries.values()].reduce((n,e)=>n+e.image.length,0)+item.image.length>ALBUM_IMAGE_BUDGET)throw new Error('Your album has reached its storage limit. Download your collection and remove a memory before adding another.');
  await this.write('put',item);this.entries.set(item.id,item);return {entry:{...item},duplicate:false};
 });}
 setCaption(id,caption){return this.run(async()=>{const existing=this.entries.get(id);if(!existing)throw new Error('This memory is no longer in the album.');const item={...existing,caption:cleanCaption(caption)};await this.write('put',item);this.entries.set(id,item);return {...item};});}
 remove(id){return this.run(async()=>{const item=this.entries.get(id);if(!item)return null;await this.write('delete',id);this.entries.delete(id);return {...item};});}
 restore(input){return this.run(async()=>{const item=memory(input),existing=[...this.entries.values()].find(e=>e.id===item.id||e.mode===item.mode&&e.kind===item.kind&&e.image===item.image);if(existing)return {...existing};if(this.entries.size>=ALBUM_LIMIT||[...this.entries.values()].reduce((n,e)=>n+e.image.length,0)+item.image.length>ALBUM_IMAGE_BUDGET)throw new Error('Remove a memory to make room before restoring this one.');await this.write('put',item);this.entries.set(item.id,item);return {...item};});}
}

