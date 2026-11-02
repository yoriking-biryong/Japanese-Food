importScripts('./offline-assets.js');
const PREFIX='ilsik-study-offline-',CACHE=PREFIX+self.STUDY_OFFLINE.version;
const paths=self.STUDY_OFFLINE.files.map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 for(let i=0;i<paths.length;i+=6)await Promise.all(paths.slice(i,i+6).map(async url=>{const r=await fetch(url,{cache:'reload'});if(!r.ok)throw Error('Offline resource unavailable');await cache.put(url,r);}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||u.pathname==='/__study-health'||u.pathname.endsWith('/offline-assets.js')||u.pathname.endsWith('/offline-sw.js'))return;
 const key=new URL(event.request.mode==='navigate'?(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname):u.pathname,self.location.origin).href;
 if(!paths.includes(key))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),1500);
  try{const response=await fetch(event.request,{signal:controller.signal});if(response.ok){await cache.put(key,response.clone());return response;}throw Error('Server unavailable');}
  catch{return await cache.match(key)||new Response('저장된 페이지가 없습니다. 사이트를 다시 연결해 주세요.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  finally{clearTimeout(timeout);}
 })());
});
