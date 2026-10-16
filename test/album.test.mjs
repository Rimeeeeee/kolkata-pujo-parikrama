import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MemoryAlbum,ALBUM_LIMIT} from '../dist/memory-album.js';

const image='data:image/png;base64,aGVsbG8=';
const photo=(overrides={})=>({mode:'saptami',kind:'postcard',image,place:'The pandal',capturedAt:'2026-10-16T12:00:00Z',...overrides});
test('album keeps distinct days and outfits, serializes duplicate saves and preserves captions',async()=>{
 const album=new MemoryAlbum({indexedDB:null});const saved=await Promise.all([album.add(photo()),album.add(photo())]);assert.equal(saved[0].entry.id,saved[1].entry.id);assert(saved[1].duplicate);assert(!album.persistent);
 await album.setCaption(saved[0].entry.id,'  মায়ের কাছে · Pujo ❤️  ');await album.add(photo({mode:'ashtami'}));await album.add(photo({mode:'dashami',kind:'portrait',outfit:'dhoti',pose:'wave'}));
 const entries=await album.list();assert.equal(entries.length,3);assert.equal(entries[0].caption,'মায়ের কাছে · Pujo ❤️');assert.equal(entries[2].outfit,'dhoti');assert.equal(entries[2].pose,'wave');entries[0].caption='external mutation';assert.notEqual((await album.list())[0].caption,'external mutation');
});
test('removing and undoing a memory retains its day, original image, id and edited caption',async()=>{
 const album=new MemoryAlbum({indexedDB:null}),{entry}=await album.add(photo({mode:'navami',caption:'Dancing by the alpona'}));const removed=await album.remove(entry.id);assert.equal((await album.list()).length,0);await album.restore(removed);assert.deepEqual((await album.list())[0],entry);
 await assert.rejects(album.setCaption('missing','x'));assert.equal(await album.remove('missing'),null);
});
test('storage denial falls back to an explicitly temporary album; invalid images cannot enter',async()=>{
 const album=new MemoryAlbum({indexedDB:{open(){throw new Error('Storage denied');}}});await album.add(photo());assert(!album.persistent);assert.equal((await album.list()).length,1);
 for(const overrides of [{mode:'other'},{kind:'upload'},{image:'javascript:alert(1)'},{image:'data:image/svg+xml;base64,aGVsbG8='}])await assert.rejects(album.add(photo(overrides)));
 const {entry}=await album.add(photo({mode:'ashtami',caption:'a'.repeat(200)}));assert.equal(entry.caption.length,160);
});
test('album limits never silently evict an existing memory, and removal frees a slot',async()=>{
 const album=new MemoryAlbum({indexedDB:null});for(let i=0;i<ALBUM_LIMIT;i++)await album.add(photo({image:`data:image/png;base64,${btoa('photo-'+i)}`}));await assert.rejects(album.add(photo({image:'data:image/png;base64,bmV3'})),/24 memories/);assert.equal((await album.list()).length,24);
 await album.remove((await album.list())[0].id);await album.add(photo({image:'data:image/png;base64,bmV3'}));assert.equal((await album.list()).length,24);
});
test('a total image budget bounds memory even when individual pictures are unusually large',async()=>{
 const album=new MemoryAlbum({indexedDB:null}),large='data:image/png;base64,'+'A'.repeat(7_000_000);for(const mode of ['saptami','ashtami','navami','dashami'])await album.add(photo({mode,image:large}));await assert.rejects(album.add(photo({kind:'portrait',image:large})),/storage limit/);assert.equal((await album.list()).length,4);
});
test('a failed storage transaction never reports an unsaved memory as saved',async()=>{
 const album=new MemoryAlbum({indexedDB:null});await album.ready;album.db={transaction(){const tx={objectStore:()=>({put(){queueMicrotask(()=>tx.onabort());}})};return tx;}};
 await assert.rejects(album.add(photo()),/Device storage/);assert.equal((await album.list()).length,0);
});
