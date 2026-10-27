// Development must show the files actually served by the local server, never an
// apparently working old editor assembled from an incomplete offline cache.
const LOCAL=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const CACHE='bedrockmatika-v4-resources',SHELL=['./','index.html','style.css','app.js','favicon.svg','manifest.webmanifest','icon-192.png','icon-512.png','Bedrockmatika-World-Shell.zip'];
const isAsset=url=>/\.[a-z0-9]+$/i.test(url.pathname);
function usable(req,res){
 if(!res?.ok)return false;
 const pathname=new URL(req.url).pathname,type=res.headers.get('content-type')??'';
 if(/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(pathname))return /^image\//i.test(type);
 // A framework's 200 HTML fallback is not a schematic, ZIP, script or font.
 return !isAsset(new URL(req.url))||/\.html$/i.test(pathname)||!/^text\/html/i.test(type);
}
self.addEventListener('install',e=>{e.waitUntil((LOCAL?Promise.resolve():caches.open(CACHE).then(c=>c.addAll(SHELL))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('bedrockmatika-')&&(LOCAL||k!==CACHE)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url),same=url.origin===location.origin;
 if(!same||url.pathname.startsWith('/api/')||url.pathname.startsWith('/_next/')||url.pathname.startsWith('/@'))return;
 if(LOCAL){e.respondWith(fetch(req,{cache:'no-store'}));return;}
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const res=await fetch(req,{cache:'no-cache'});if(usable(req,res))await cache.put(req,res.clone());return res;}
  catch(error){const hit=await cache.match(req);if(usable(req,hit))return hit;
   if(req.mode==='navigate'&&!isAsset(url)){const page=await cache.match('index.html');if(page)return page;}
   throw error;
  }
 })());
});
