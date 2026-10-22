const CACHE='foundation-az-v11';
const ASSETS=['./','./index.html','./style.css?v=10','./data.js?v=10','./app.js?v=10','./logo.svg','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // Paused foundation isn't part of the student release; don't serve previously cached copies.
  if(url.origin===location.origin&&url.pathname.includes('/step-grammar-student/foundation-sentence-elements')){
    e.respondWith(Promise.resolve(new Response('Foundation lessons are temporarily unavailable.',{
      status:410,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}
    })));
    return;
  }
  if(url.origin===location.origin && (url.pathname.endsWith('/app.js')||url.pathname.endsWith('/data.js')||url.pathname.endsWith('/style.css')||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/foundation-english-book/'))){
    e.respondWith(fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return resp}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return resp})));
});