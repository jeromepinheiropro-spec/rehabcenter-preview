const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
const IMG_BASE = 'https://rehabcenter.lu/wp-content/uploads/';
const CACHE = new Map();
http.createServer((req, res) => {
  let p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  /* same-origin image proxy (needed so WebGL can sample the photos without CORS taint) */
  if (p.startsWith('/img/')) {
    const remote = IMG_BASE + p.slice(5).replace(/\.\./g, '');
    const hit = CACHE.get(remote);
    if (hit) { res.writeHead(200, { 'Content-Type': hit.type, 'Cache-Control': 'public,max-age=86400' }); return res.end(hit.buf); }
    fetch(remote).then((r) => {
      if (!r.ok) throw new Error('upstream ' + r.status);
      const type = r.headers.get('content-type') || 'image/jpeg';
      return r.arrayBuffer().then((ab) => {
        const buf = Buffer.from(ab);
        if (CACHE.size < 80) CACHE.set(remote, { buf, type });
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public,max-age=86400' });
        res.end(buf);
      });
    }).catch(() => { res.writeHead(502); res.end('proxy error'); });
    return;
  }
  const file = path.join(__dirname, path.normalize(p));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain' });
    res.end(data);
  });
}).listen(port, () => console.log('Rehab Center preview running on ' + port));
