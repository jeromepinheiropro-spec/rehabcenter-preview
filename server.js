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
const FAVICON = Buffer.from('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', 'base64');

const ROUTES = {
  "/": {
    "title": "Kinésithérapeute à Esch-sur-Alzette | Rehab Center",
    "desc": "Cabinet de kinésithérapie à Esch-sur-Alzette : kiné du sport, rééducation post-opératoire, neurologique et séances à domicile. Prenez rendez-vous.",
    "h1": "Rehab Center — Kinésithérapeute à Esch-sur-Alzette",
    "intro": "Cabinet de kinésithérapie et de réathlétisation au 67 Rue de Belvaux, L-4025 Esch-sur-Alzette. Kiné du sport, rééducation post-opératoire, neurologique, thérapie manuelle et séances à domicile."
  },
  "/service/kinesitherapie-generale": {
    "title": "Kinésithérapie générale à Esch-sur-Alzette | Rehab Center",
    "desc": "Retrouver le mouvement, sans douleur. La kinésithérapie générale traite les douleurs, raideurs et troubles fonctionnels du quotidien grâce à des soins…",
    "h1": "Kinésithérapie générale — Rehab Center Esch-sur-Alzette",
    "intro": "La kinésithérapie générale traite les douleurs, raideurs et troubles fonctionnels du quotidien grâce à des soins personnalisés et des thérapies manuelles adaptées à chaque patient."
  },
  "/service/kine-du-sport": {
    "title": "Kiné du sport à Esch-sur-Alzette | Rehab Center",
    "desc": "De la blessure au retour à la performance. Une prise en charge dédiée aux sportifs de tous niveaux : traitement de la blessure, réathlétisation encadrée et…",
    "h1": "Kiné du sport — Rehab Center Esch-sur-Alzette",
    "intro": "Une prise en charge dédiée aux sportifs de tous niveaux : traitement de la blessure, réathlétisation encadrée et retour au sport testé et validé sur des données objectives."
  },
  "/service/kine-neurologique": {
    "title": "Kiné neurologique à Esch-sur-Alzette | Rehab Center",
    "desc": "Restaurer mobilité et autonomie. Un accompagnement spécialisé des pathologies neurologiques centré sur la récupération de la mobilité, de l'équilibre et de…",
    "h1": "Kiné neurologique — Rehab Center Esch-sur-Alzette",
    "intro": "Un accompagnement spécialisé des pathologies neurologiques centré sur la récupération de la mobilité, de l'équilibre et de l'autonomie au quotidien."
  },
  "/service/reeducation-post-operatoire": {
    "title": "Rééducation post-opératoire à Esch-sur-Alzette | Rehab…",
    "desc": "Une récupération guidée et progressive. Des protocoles adaptés après chirurgie (LCA, prothèses, épaule…) pour une récupération optimale, sécurisée et suivie…",
    "h1": "Rééducation post-opératoire — Rehab Center Esch-sur-Alzette",
    "intro": "Des protocoles adaptés après chirurgie (LCA, prothèses, épaule…) pour une récupération optimale, sécurisée et suivie sur des indicateurs objectifs."
  },
  "/service/kinesitherapie-a-domicile": {
    "title": "Kinésithérapie à domicile à Esch-sur-Alzette | Rehab Center",
    "desc": "La même expertise, chez vous. Pour les patients à mobilité réduite, nous assurons des séances de kinésithérapie directement à votre domicile, avec la même…",
    "h1": "Kinésithérapie à domicile — Rehab Center Esch-sur-Alzette",
    "intro": "Pour les patients à mobilité réduite, nous assurons des séances de kinésithérapie directement à votre domicile, avec la même exigence qu'au cabinet."
  },
  "/service/kine-vestibulaire": {
    "title": "Kiné vestibulaire à Esch-sur-Alzette | Rehab Center",
    "desc": "En finir avec les vertiges et les troubles de l'équilibre. La kinésithérapie vestibulaire traite les vertiges, le VPPB (vertige positionnel paroxystique…",
    "h1": "Kiné vestibulaire — Rehab Center Esch-sur-Alzette",
    "intro": "La kinésithérapie vestibulaire traite les vertiges, le VPPB (vertige positionnel paroxystique bénin), les instabilités et les troubles de l'équilibre. Grâce à des manœuvres spécifiques et à une rééducation progressive, la plupart des patients constatent une…"
  },
  "/service/kine-perineale": {
    "title": "Kiné périnéale à Esch-sur-Alzette | Rehab Center",
    "desc": "Rééducation du périnée, pour elle et pour lui. La rééducation périnéale renforce le plancher pelvien après un accouchement, une chirurgie ou en cas…",
    "h1": "Kiné périnéale — Rehab Center Esch-sur-Alzette",
    "intro": "La rééducation périnéale renforce le plancher pelvien après un accouchement, une chirurgie ou en cas d'incontinence. Une prise en charge discrète, respectueuse et efficace, pour les femmes comme pour les hommes."
  },
  "/service/kine-de-la-main": {
    "title": "Kiné de la main à Esch-sur-Alzette | Rehab Center",
    "desc": "Redonner force et précision à vos mains. La rééducation de la main et du poignet exige une précision particulière : fractures, tendons, tunnel carpien ou…",
    "h1": "Kiné de la main — Rehab Center Esch-sur-Alzette",
    "intro": "La rééducation de la main et du poignet exige une précision particulière : fractures, tendons, tunnel carpien ou doigts raides. Nous restaurons la mobilité fine, la force de préhension et la fonction au quotidien."
  },
  "/service/therapie-manuelle": {
    "title": "Thérapie manuelle à Esch-sur-Alzette | Rehab Center",
    "desc": "Des mains expertes contre la douleur. La thérapie manuelle regroupe des techniques spécifiques de mobilisation des articulations, des muscles et des tissus…",
    "h1": "Thérapie manuelle — Rehab Center Esch-sur-Alzette",
    "intro": "La thérapie manuelle regroupe des techniques spécifiques de mobilisation des articulations, des muscles et des tissus : une approche précise et fondée sur les preuves pour traiter la douleur et restaurer le mouvement."
  },
  "/service/kine-geriatrique": {
    "title": "Kiné gériatrique à Esch-sur-Alzette | Rehab Center",
    "desc": "Préserver l'autonomie, prévenir les chutes. La kinésithérapie gériatrique aide les seniors à conserver mobilité, force et équilibre. Objectif : prévenir les…",
    "h1": "Kiné gériatrique — Rehab Center Esch-sur-Alzette",
    "intro": "La kinésithérapie gériatrique aide les seniors à conserver mobilité, force et équilibre. Objectif : prévenir les chutes, maintenir l'autonomie et la qualité de vie, au cabinet ou à domicile."
  },
  "/service/laboratoire-ketterthill": {
    "title": "Laboratoire Ketterthill à Esch-sur-Alzette | Rehab Center",
    "desc": "Vos prises de sang, directement dans nos locaux. En partenariat avec les Laboratoires Ketterthill, un service de prélèvements sanguins est proposé…",
    "h1": "Laboratoire Ketterthill — Rehab Center Esch-sur-Alzette",
    "intro": "En partenariat avec les Laboratoires Ketterthill, un service de prélèvements sanguins est proposé directement au sein du Rehab Center : gagnez du temps en combinant vos analyses et votre séance de kiné, au même endroit."
  },
  "/service/consultations-chirurgie": {
    "title": "Consultations de chirurgie à Esch-sur-Alzette | Rehab Center",
    "desc": "Chirurgie vasculaire et gastrique : des spécialistes à Esch. Le Rehab Center accueille des consultations spécialisées : chirurgie vasculaire et chirurgie…",
    "h1": "Consultations de chirurgie — Rehab Center Esch-sur-Alzette",
    "intro": "Le Rehab Center accueille des consultations spécialisées : chirurgie vasculaire et chirurgie gastrique, assurées par le Dr Pr Moussavian et le Dr Ziemann. Un parcours de soin complet, du diagnostic à la rééducation post-opératoire, au même endroit."
  },
  "/blog": {
    "title": "Blog kiné — conseils de kinésithérapeutes | Rehab Center",
    "desc": "Mal de dos, entorse de cheville, vertiges VPPB, rééducation du LCA : les conseils des kinésithérapeutes du Rehab Center à Esch-sur-Alzette.",
    "h1": "Le blog kiné du Rehab Center",
    "intro": "Conseils et explications des kinésithérapeutes du Rehab Center à Esch-sur-Alzette, Luxembourg."
  },
  "/blog/mal-de-dos-exercices-kine": {
    "title": "Mal de dos : 7 exercices validés par nos kinés pour…",
    "desc": "Lombalgie, dos bloqué, douleurs au réveil ? Voici les exercices que nos kinésithérapeutes prescrivent chaque jour au cabinet : et quand consulter à…",
    "h1": "Mal de dos : 7 exercices validés par nos kinés pour soulager la lombalgie",
    "intro": "Lombalgie, dos bloqué, douleurs au réveil ? Voici les exercices que nos kinésithérapeutes prescrivent chaque jour au cabinet : et quand consulter à Esch-sur-Alzette."
  },
  "/blog/entorse-cheville-reeducation": {
    "title": "Entorse de cheville : combien de temps pour récupérer, et…",
    "desc": "Délais de récupération réels, protocole de rééducation étape par étape et critères de reprise du sport : le guide complet de nos kinés du sport.",
    "h1": "Entorse de cheville : combien de temps pour récupérer, et comment éviter la récidive ?",
    "intro": "Délais de récupération réels, protocole de rééducation étape par étape et critères de reprise du sport : le guide complet de nos kinés du sport."
  },
  "/blog/vertiges-vppb-kine-vestibulaire": {
    "title": "Vertiges et VPPB : comment la kiné vestibulaire vous en…",
    "desc": "Le vertige positionnel paroxystique bénin (VPPB) est la première cause de vertiges. Manœuvres libératoires, rééducation de l'équilibre : ce qui fonctionne…",
    "h1": "Vertiges et VPPB : comment la kiné vestibulaire vous en débarrasse, souvent en 1 à 3 séances",
    "intro": "Le vertige positionnel paroxystique bénin (VPPB) est la première cause de vertiges. Manœuvres libératoires, rééducation de l'équilibre : ce qui fonctionne vraiment."
  },
  "/blog/reeducation-lca-retour-sport": {
    "title": "Rééducation du ligament croisé (LCA) : les 5 phases du…",
    "desc": "De l'opération au retour sur le terrain : durées réelles, étapes clés et tests objectifs qui sécurisent la reprise après une ligamentoplastie du genou.",
    "h1": "Rééducation du ligament croisé (LCA) : les 5 phases du retour au sport, chiffres à l'appui",
    "intro": "De l'opération au retour sur le terrain : durées réelles, étapes clés et tests objectifs qui sécurisent la reprise après une ligamentoplastie du genou."
  },
  "/lexique": {
    "title": "Lexique de la kinésithérapie : 65 termes | Rehab Center",
    "desc": "Lombalgie, VPPB, BFR, proprioception, tendinopathie… le vocabulaire de la kinésithérapie expliqué par les kinés du Rehab Center, Esch-sur-Alzette.",
    "h1": "Lexique de la kinésithérapie",
    "intro": "65 termes de la kinésithérapie expliqués simplement par les kinés du Rehab Center."
  }
};

let INDEX = '';
try { INDEX = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'); } catch (e) { INDEX = '<!doctype html><title>Rehab Center</title>'; }

const esc = (s) => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const attr = (s) => esc(s).replace(/"/g,'&quot;');

function render(pathname) {
  const r = ROUTES[pathname] || ROUTES['/'];
  const url = HOST + (pathname === '/' ? '/' : pathname);
  let h = INDEX;
  h = h.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(r.title) + '</title>');
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, '$1' + attr(r.desc) + '$2');
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, '$1' + attr(r.title) + '$2');
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, '$1' + attr(r.desc) + '$2');
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*(")/, '$1' + attr(r.title) + '$2');
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*(")/, '$1' + attr(r.desc) + '$2');
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + url + '$2');
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, '$1' + url + '$2');
  h = h.replace(/<h1>[\s\S]*?<\/h1>/, '<h1>' + esc(r.h1) + '</h1>');
  h = h.replace(/(<p data-seo="intro">)[\s\S]*?(<\/p>)/, '$1' + esc(r.intro) + '$2');
  return h;
}

const ROBOTS = 'User-agent: *\nAllow: /\n\nSitemap: ' + HOST + '/sitemap.xml\n';
const SITEMAP = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
["/","/service/kinesitherapie-generale","/service/kine-du-sport","/service/kine-neurologique","/service/reeducation-post-operatoire","/service/kinesitherapie-a-domicile","/service/kine-vestibulaire","/service/kine-perineale","/service/kine-de-la-main","/service/therapie-manuelle","/service/kine-geriatrique","/service/laboratoire-ketterthill","/service/consultations-chirurgie","/blog","/blog/mal-de-dos-exercices-kine","/blog/entorse-cheville-reeducation","/blog/vertiges-vppb-kine-vestibulaire","/blog/reeducation-lca-retour-sport","/lexique"].map(function(u){ return '  <url><loc>' + HOST + u + '</loc><changefreq>weekly</changefreq><priority>' + (u === '/' ? '1.0' : '0.8') + '</priority></url>'; }).join('\n') +
  '\n</urlset>\n';

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
  let p = req.url.split('?')[0];
  let cp = p.replace(/\/+$/, '') || '/';

  if (cp === '/robots.txt') return send(req, res, Buffer.from(ROBOTS), types['.txt'], 'public,max-age=3600');
  if (cp === '/sitemap.xml') return send(req, res, Buffer.from(SITEMAP), types['.xml'], 'public,max-age=3600');
  if (cp === '/favicon.ico' || cp === '/favicon.png') { res.writeHead(200, { 'Content-Type':'image/png','Cache-Control':'public,max-age=604800' }); return res.end(FAVICON); }

  /* same-origin image proxy (WebGL needs textures without CORS taint) */
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

  /* home + all known SPA routes -> rendered index.html with per-route SEO */
  if (cp === '/' || cp === '/index.html') return send(req, res, Buffer.from(render('/')), types['.html'], 'public,max-age=300');
  if (ROUTES[cp]) return send(req, res, Buffer.from(render(cp)), types['.html'], 'public,max-age=300');

  /* real asset with an extension -> serve file */
  if (/\.[a-z0-9]+$/i.test(cp)) {
    const file = path.join(__dirname, path.normalize(cp));
    return fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      send(req, res, data, types[path.extname(file)] || 'text/plain', 'public,max-age=86400');
    });
  }

  /* unknown path without extension -> SPA fallback (app resolves client-side) */
  return send(req, res, Buffer.from(render('/')), types['.html'], 'public,max-age=300');
}).listen(port, () => console.log('Rehab Center preview running on ' + port));
