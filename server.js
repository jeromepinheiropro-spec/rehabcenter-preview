const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const port = process.env.PORT || 3000;
const HOST = 'https://rehabcenter-preview-production.up.railway.app';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.json':'application/json'};
const COMPRESSIBLE = /text|javascript|json|xml|svg/;
const IMG_BASE = 'https://rehabcenter.lu/wp-content/uploads/';
const CACHE = new Map();
const FAVICON = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAARvUlEQVR4nO1aeXxV1bX+9t7nnDvnZk7ITBJCwiSJDCKDIEitVarY9tUR51bK89VWUax1qPoQtEKtWofWaqkg1dqKD0GkAmGWQIJAIMGEIfN4c2/ucMa93x83N6Xv1b7X3+tN+lq+v87v7H32Xuvba6+91tqHCCHwzww63AIMN84TMNwCDDfOEzDcAgw3/m4IEELAME2ys/rYVNO0MFSH07ARwE3NGehsnG5qYQkABABZkoTLbmt7Z+uufyEE4JzHXY4hIeDcxRRCoPt0zXNtx7eFEqhvl6+94bqYIEIIVJQVnz10omH6mbZOOyEE8Y5ThoQAAkAM0GDpYTvUzntlmNBN8uu0/HHvRDsRWAMrPqE4f8v6jyqX/EMQoBkGberoKiaIKkNlu0bsKS93RFjb42v3ZNy9/JV/X/nGb34EAJQQAEBFWfHB6rrGuwCA0viKGNfRuRBQJIl/Vn96+pGTp7MIIaCUiaT8Cxcvfnmb/4X3d1/220/23Xu4/ux8AIQMEJCTntoZCIbdPf5+O4C4WkFcCSAgIIRgRvmYtW9v3r7WMEwiIEAhxNjC/KOZSQn6NdPHNf3qR/92Oc5xFXabwoOhEO/xBwD8qQ/5WyO+BBDAsji8bpfhdrl2btpdNZuAAITgp0vvuPm9hxYGHrhylCfUtM/X01p/dcwCOOeIqBrn1j/CKUCiJjx1XMl7W/ZVLxl8zw2a5SXOJLfD6XZ71yQnpx2IHXuBcNjBZFuKTZHFwBBxQ9wJoCS6DYpyR5xobGotN0yTAIBsd4cOtCtPPrepTvnl7o7KQ6d9ZszhNTa3pys2xZmW5I17OCTFewIMmHVygoczWcno7gs4R6QmhwDgjS2HJq37sBIjso68dsm4woPrVjw4CQB21xyfrzA0uJ0OPTpE/Gwg/gQMgDIqKJOc/aGIe0QqQgBw3/VX/DA/WVo4pqT0znnTJr0phAAhBFv313xn5sQxPwOi/iCeR2H8CRACIATBcET0h8JcYmywqTTZvPHxa8fCIspjptV9hpDkj8+0diT6VWPC1y+b9SsAgxYUL8TdB8Q2cXtXr9fnD5hpSd7uWFt3hNbUdhjc7s1eLTuTjgHA7praaYxbHWWFuV1CiMHgKF6IPwE8SkFNXeNFLptselwOK9Z2/ysb513x2Lt08csfl/kNWw8A7D9Wf+X44rwPAIDz+KeEcScg5sA+2nvo5vKywvUAYFpRDmZNHBUszU2r7w9FlHAkmhWeaemsKC8t+n306/gTEFcfIIQApQTBcIQebWj6+ur77xwHABJjMA1VXjQt9cobJn/Z8GSWPMvcmSEAhAMXFedmtQIAofE1f2AIcgEA2FVdO95hV4LTLyirjbUxJomjZ7pHGIJKqhpJFwAsy0JE1ToyUpLORHv9PycgZsF7Dh+bVZCZutWmyMI0o+ZfXXe68Js//sj+1eWbXEfarToCgFJKvC47FFkKAUOhfpy3AGNRfk+carlh2gWlLwkhBusCWalJLXMnZIeTElMPZSS5u3nU4/Nkb8LHqqZLADSB+JMwJIFQjz+gjC3K3xtNh6MqpblZ0i/umeeE7DSQmGLG3F1hTubJvmBoFICaWAwRTwxJRYhS6JmpSUEAg9sizOXOx9YeCL+65fMDqs6tWM4/acyodzu6fSMADElhdEgIsCsKvG4XO/ddWDWwvrLOXnWydQYhVMSOy8njSupMyyoE4psDxDAkW8DjdLnEwBKTgbg+IyVR3/Lk1w7lpnndkKKGIYSA1+2yJpYWbY6oGnPYbdZfGvdvgSE5BnNGpO7wBYKDyzlY4nKmP/DI2wcu2Xm4vuzcAmhpQU6D3abEXXkgzgTEFCoryN3b3RdwDTYMKOtILti35fBZPRxRnQAgBny+wNCYPxBnAmKJzPSJYzb3+AMVsfcE0Tg/NcGp3/7l6dc1trS7AQx6vaFRPYq4+oDYKhbnZfW0dvX4dcMkiiyJWJsQAsV52d2MUT8wNKHvf5Mx3hcPsSKHqukSpVQosmSd+77b57d7PW5Nltiw/KoSdwL+3jHst8PR8Hj4cN4ChluA4YbEOf8TE4zV8b8IFuf/Y58YhBDgQoD9haouF2IwXvjfjvu3xJ/dAkOQhH0hYqfDX4O/ZlH+K8jew8dn+vpDKZRQrihy57ii3Oq0JK92riCx577+kPLxgSNXTC4d+UlBVkbgi4SNvf/0aF3W2S7flGsumbKBUcr/XJ/jp5oyqmobpmalJ5+ZOXHMMUWWzL9ai/8DpBVr3q+srmtAZkoyevtDyExwdH/w/KPZXrdLtyyOWAlDohSdPT7vqne2/G7pN+ZNzs1IrbK4gCyxaFADgA/051xAkSVs2L7vS3vqml6/8uJyh5AklVAKRgg4j9YKN+8+OGfpS2s/4aYJgwtMKcnf8+YT984khHDOozMTkIGLkeh2ooSCcw4uonO3dfWmfbj/8F2XT5mwKjM1KSwEQCkBJWSwHyFk0EJi1iKEgBAANQ1DrSjOfWnj6h/YH7l14cXdYSP1s/pTZUC0oiMxBplFlaSUclOLqDZFDjDGoMjSoAWQc/orcjTAdNhsfYYaVu02my4xBjYwcawo8vP3Nj0pcaNhywuPuu6/7oprDzU0XVx3uiWZEDI4FmMUhEQjR0ajz4xRyFI0u25q78p79f3tTwZDEYlRConRQQUpHRiD0sHIM/ZMKY3OIQjskiz1pXg92uSxo467HXZTMwwVAHbV1JbUNjRNH5WftWvOpPEnAXDOuV03rPSNOw9IJhc5l08r32ZTZMMXCDp31dRWtHX1TiwvLXpv8thRrSbnjAD22sazow/Ufl44viivuqKsuDVm/j3+IC/MTu/KSksOT51QekLesAMdvX2irDAXO6uPjTre2DRj9MicyksqxjWomk521dSWlI8ubNp+8Ei5IivsqlmTd9oUOWhqEf0Pn9bMbmxtrwOhrKwgu6EgK0M7XH8qf/+Rupk5mWl1l06eUG1XZHNb1ZHSMSNzGk63dma2dPvGSQAgMTaQehKmW1xKcLmkV3+76Y5V72x5zckENMFww9wpN934lUs3quEwfrJ2w85gRIUvYqDq6Illj37r+meve+jZz1u6+0bYJAKN05+uXHzdpNRET0+3P4h/ffrl2jZfAIxJWPfkd7PGFRe0RS2MwLQ4E0LA7bD7F86a/GJJfnbwxbc/uPGlDdvXOAiHKiiuu3Ty926/+ksv3vPsL07kpSWG/cGIs1c18Vl9w93XzpuxPRwOKz9Z9/77NsUGxeXBD266anR7t8/6znNvfg5DhWoJjMlN37Vu+dI53//xa8cLsjK2Nba0z0n2ekEtw0D96eZrXlz/wb1P/HzdL9Jccn1pQU7ba7/dvGLa6Ly1B99aTRZcPP6e9Vt2renrD2VrhokLywqXfbrmOTZlVN77H++tXnzweMPYM92BEW8+uiSz6teriEL4iW1Vn90pS5LLtDheXHZ34pYXHvMKwNxdUzv7XCdEQTVCCEZmZ7Y8ctvCJVlpycZbmyt/OXNMwYqqt1aRBdMmrH7zP7Y+FoxEZF3X1AtGjXxy9xsrWUVh5rsfVh64LxxRk212O375+Pdy97zxDPvkpz+kV8+ZVv+zdzYu8cik7eBbq9jyb39z4vHmrhknTreMSvMmbKttbJr67jMPJW98/oeMgnN09/WP27j70HNVtQ1f9dhtTbLM/Lpp8AS3S2tobnNKTJI0zdBVTadOhx2zKsZvAMALczLWKw5n7uiCnOY3Hv7WXFmWbT9e87tv9/YH8zxOhxXRdCk3IwWlI3P7U5MSgh6nQwqrmvbnvLFpWlB1HUII2eFwSE6bva2huc3ptNn2GoalmhYXTJLs0yvGnKCU8hHpKU2UUQOAxSiFx+kIuZ0OThl1C4AGQ6rpUuSqUy0dNgGYQgiu6npafySS/eVpE18pzh3hc9hsXCKyjKkTRj+//ukH791zuDbvtqdeOVV58NjkjOSkw1s+/ezWk62dt/b6/CgtyD4FAioAWJw7on92WhBCcK/bpW7Yvm/e7qOf/2HS6PzXUhLcQd0wGfnj3RY1DBMDl51/EhVxcBsAHD/dNGrJyp+vW3nPTTdLwmrbtL9mdX1r1+r+UBgTRxftgxBECAFV0+1CCJiGZUM0kiUCgGlZBAAWPfZ84MbLZ47Nzkiu23rwxH2LV7waDkciSPO6dKfd5jdNztKSvIAQsLiARCmFsEQQAPd6XAGX3caF4AhGIikLZkz69QO3XLu4tceXFgiGPW6Ho5cxCQAsQgi4EJKwDLrtwOGL1m7dt+zd5d8vvLCs+NT8bz00VjdMDyGIFTs5iQJCgP9RecIJJRai3tXZ1uu/UNUMmymQsXD25O9+/6ZrX+/0BTw9ff4kmyJb0d+uKCeEgET1jrJLKWeMmQBwtrnVjERULRxRUwozk9771RPfXRSKqLamzt68nPTUetM0UywheDTSE6CMUJUyCiEELEswAa5LkgTBRZqu671JXk//xsr9E295ZFWNqulJEJZKCRkocBJOKVE7fX3zKaxwUc6IMwDQF9ZS7TY5oMiy5QtGdFXTJUWWREQ3dEWRBoswTkVSQiEtAQDp7gsQSggS3c5+VTdaDIPLyV5P/wc79s67ftnK7YZpMUqhEhq1KsaoQRnVCSFGRFVpOKImR924xG2KokiSREyLFyZ7PcHmjm7bLU+8sKexpX2s02lrppQOkicRRbEHgoE0Qgi4xSlVnHa7IgfmTatY/vYf9r/Qvmxl1v7axq/NqRizJjnR08FsTrtmmHYAiIQ1D5hiz89M/8jiZOnV9/6oKj05UY9wUqJqRlVY1RJNLpQbH352X0e3TzO5UKaMLfk0NvnCuTNWPbNu0/rZtz/Q19TVm5CenNg0oWRkY3lJ/oebq2qfaXpgxeVHzrTPveyiib9PcDlMQRW7rpseAAiGI6l9/eFxhTmZtRI3+V1PvXgqJy1pR0i3lPKyohZV1w/tffuj5V+776kdJ5s7ZiU7ZIzKyzrm6w+PC4e1A4MELLi4fCkj4lMAyEhNDNx02cUPZqWltD18xzdfSk1KtI6ePJW75BtX3H/XwvmrDNOkiy6f8WDZyJxTAPCl6RWVo4vyl067oKzy4VsXLqg+eXrK/CkT9vSH1USvyxnwuBynXA7HovwRaUd+v+PANbMrxjw3aWzJ6Vj+cdvV83/jcTnbKw8dmzl3annPDVdcsoYQwp/4zs33rNlUuaO24XTJHQsu/c1tC+a+ySjRb7/qkgfHFuftBoCvzJzyeklBzmdetyvy9tNL09Z8uH2RPxRJvXPh+CcKszMDeZlpWwXIgl3VxyaPLSrYsOiqS193OeyRRVdeurR8dOEBIBqL/NPXAyTTNMEtXVFsTp1bJjFNg8iKnUMIYkUDZsItnVHKhCTbLMvUKSGMU8ZgmToVoFySJFicg5sGEYJTWbFblmUSwU1KmWIRQsEFh8QYBLcoIZTHSuOWZQ2GqZQISqjEheCwTIMSJnMCEEqpsEyNCQEhybaB64ZobiBRQS0OHv0h0aIgjDPGIDgHF4AQFhHcIpJs49FvAGEZlFImKJME1fo75wo9nCMER8jXWmSpgXRCCPW11z+t9jbfLkkSNcK9+dyI2C1DS7SCrQ8ZaiDF0lVZ9bfeQoRFAYBRCiPiv1Dv77qKW7qkBjqv1Pq7ixijoDQax/uajy/T1eAEy9SJEQnY9IjfG/KdeYebaqql9ecLvXc2BCdGxD867Gu+nlFC9FDvHABQ/Z3zuRFJ4aYmWZHOn+ih3jEw1UQj1HUtuCWZan++GWxdYRkRN7dM4m8/voIxCi3YnRHuPftVwS2ihXxeAoFg95m7TS3owMBvu3bOzSQhOAGEJCAkCEEUm+uIroUrAHDJ5m6RbK4QAKKbQgjBkwQEoRBewS3ljwYlbBa3EogAgRAuIbgtVuUnEAAhPYKb/YAgnHPKJMUgArqph90glApLuITgBISGuGmlCm5RQDgIIZAdCU2yzd0vhAC3+AmAUABUgHsADkKoZFpoBgQMLZjNmK3N1MNeSiXTkZC+gzJJCM5lAkBw7hacu4DzNcHzNcHzBAy3AMON8wQMtwDDjX96Av4TK9TST7xII4EAAAAASUVORK5CYII=', 'base64');

const ROBOTS = 'User-agent: *\nAllow: /\n\nSitemap: ' + HOST + '/sitemap.xml\n';
const SITEMAP = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  '  <url><loc>' + HOST + '/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n' +
  '</urlset>\n';

function send(req, res, buf, type, cache) {
  const headers = { 'Content-Type': type };
  if (cache) headers['Cache-Control'] = cache;
  const ae = req.headers['accept-encoding'] || '';
  if (COMPRESSIBLE.test(type) && /\bgzip\b/.test(ae) && buf.length > 512) {
    const gz = zlib.gzipSync(buf);
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
    res.writeHead(200, headers);
    return res.end(gz);
  }
  res.writeHead(200, headers);
  res.end(buf);
}

http.createServer((req, res) => {
  let p = req.url === '/' ? '/index.html' : req.url.split('?')[0];

  if (p === '/robots.txt') return send(req, res, Buffer.from(ROBOTS), types['.txt'], 'public,max-age=3600');
  if (p === '/sitemap.xml') return send(req, res, Buffer.from(SITEMAP), types['.xml'], 'public,max-age=3600');
  if (p === '/favicon.ico' || p === '/favicon.png') { res.writeHead(200, { 'Content-Type':'image/png','Cache-Control':'public,max-age=604800' }); return res.end(FAVICON); }

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
    const type = types[path.extname(file)] || 'text/plain';
    const cache = path.extname(file) === '.html' ? 'public,max-age=300' : 'public,max-age=86400';
    send(req, res, data, type, cache);
  });
}).listen(port, () => console.log('Rehab Center preview running on ' + port));
