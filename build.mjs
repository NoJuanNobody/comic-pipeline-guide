#!/usr/bin/env node
// Builds index.html from ../article/building-a-comic-pipeline-with-ai.md. Run: node build.mjs
// SITE_URL is used only for the social-preview tags (og:url / og:image). Change it if the repo name changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';

const SITE_URL = process.env.SITE_URL || 'https://nojuannobody.github.io/comic-pipeline-guide';
const SRC = new URL('../article/building-a-comic-pipeline-with-ai.md', import.meta.url);
let md = readFileSync(SRC, 'utf8');

// --- pull out the title and the opening deck; they live in the page header ---
const title = md.match(/^# (.+)$/m)[1].trim();
md = md.replace(/^# .+\n+/, '');
const deck = md.split(/\n\n/)[0].trim();
md = md.slice(deck.length).trimStart();
const plain = (s) => s.replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
const description = plain(deck).slice(0, 280);

let body = marked.parse(md, { gfm: true });

// --- headings: ids + table of contents ---
const slug = (s) => plain(s.replace(/<[^>]+>/g, '')).toLowerCase().replace(/&amp;/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const toc = [];
const seen = new Set();
body = body.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, lvl, inner) => {
  let id = slug(inner), n = 2; while (seen.has(id)) id = `${slug(inner)}-${n++}`; seen.add(id);
  toc.push({ lvl: +lvl, id, text: inner.replace(/<[^>]+>/g, '') });
  return `<h${lvl} id="${id}"><a class="anchor" href="#${id}" aria-label="Link to this section">#</a>${inner}</h${lvl}>`;
});

// --- tables scroll on small screens ---
body = body.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, '</table></div>');

// --- diagrams: three standalone files, embedded where the article talks about them ---
const figure = (file, caption, h = 720) => `
<figure class="diagram">
  <div class="frame"><iframe src="diagrams/${file}" title="${caption}" loading="lazy" style="height:${h}px"></iframe></div>
  <figcaption>${caption} <a href="diagrams/${file}" target="_blank" rel="noopener">Open full size ↗</a></figcaption>
</figure>`;
const need = (cond, what) => { if (!cond) throw new Error(`build: could not place ${what}; the article text changed`); };

const ph = /<p>[^<]*embedded content[^<]*<\/p>/;
need(ph.test(body), 'the pipeline diagram (placeholder paragraph)');
body = body.replace(ph, figure('pipeline.html', 'The pipeline: three tracks meeting in one layer model.'));

const afterLayers = /(<p>Keep ink, colour and background on separate layers[\s\S]*?<\/p>)/;
need(afterLayers.test(body), 'the layer diagram');
body = body.replace(afterLayers, `$1${figure('panel-layers.html', 'One panel as layers, and who owns each.')}`);

const principles = /(<h2 id="principles-that-mattered">)/;
need(principles.test(body), 'the roadmap diagram');
body = body.replace(principles, `${figure('roadmap.html', 'Where each piece stands: done, next, waiting on the artist, later.', 780)}$1`);

// --- code blocks get a copy button (progressive: works without JS, just no button) ---
body = body.replace(/<pre><code/g, '<pre><button class="copy" type="button" aria-label="Copy code">Copy</button><code');

const tocHtml = toc.map((t) => `<li class="l${t.lvl}"><a href="#${t.id}">${t.text}</a></li>`).join('\n');
const year = new Date().getFullYear();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description.replace(/"/g, '&quot;')}">
<link rel="canonical" href="${SITE_URL}/">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
<meta property="og:url" content="${SITE_URL}/">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">
<meta name="twitter:image" content="${SITE_URL}/og.png">
<style>
:root{--bg:#f4f1ea;--paper:#fbfaf6;--ink:#17171a;--soft:#55524b;--line:#d9d4c6;--accent:#b42330;--code-bg:#15171b;--code-ink:#e6e8ea;--code-dim:#8b919a;--tint:#ebe6d8;--radius:10px}
@media (prefers-color-scheme:dark){:root{--bg:#121316;--paper:#17181c;--ink:#ecebe6;--soft:#a5a399;--line:#2a2c31;--accent:#ff6b76;--code-bg:#0c0d10;--code-ink:#e6e8ea;--tint:#1d1f24}}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:20px}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.65 ui-serif,Georgia,"Iowan Old Style","Times New Roman",serif;-webkit-text-size-adjust:100%}
a{color:var(--accent);text-underline-offset:3px}a:hover{text-decoration-thickness:2px}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:56px}
header.hero{max-width:1180px;margin:0 auto;padding:56px 20px 28px}
.eyebrow{font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}
h1{font:800 clamp(34px,6vw,64px)/1.04 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:-.02em;margin:14px 0 18px;max-width:18ch}
.deck{font-size:clamp(19px,2.4vw,23px);line-height:1.5;color:var(--soft);max-width:44em;margin:0 0 24px}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 6px}
.btn{display:inline-block;font:600 15px/1 ui-sans-serif,system-ui,sans-serif;padding:13px 18px;border-radius:999px;border:2px solid var(--ink);color:var(--ink);text-decoration:none}
.btn.primary{background:var(--ink);color:var(--bg)}.btn:hover{background:var(--accent);border-color:var(--accent);color:#fff}
nav.toc{position:sticky;top:20px;align-self:start;max-height:calc(100vh - 40px);overflow:auto;padding:4px 0 24px;font:14px/1.4 ui-sans-serif,system-ui,sans-serif}
nav.toc h2{font:700 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);margin:0 0 12px}
nav.toc ol{list-style:none;margin:0;padding:0}nav.toc li{margin:0}nav.toc a{display:block;padding:4px 0 4px 12px;color:var(--soft);text-decoration:none;border-left:2px solid var(--line)}
nav.toc li.l2 a{font-weight:600;color:var(--ink);margin-top:8px}nav.toc li.l3 a{padding-left:24px;font-size:13px}nav.toc a:hover,nav.toc a.on{color:var(--accent);border-left-color:var(--accent)}
main{min-width:0;padding-bottom:80px;max-width:760px}
main h2{font:800 clamp(26px,3.6vw,36px)/1.15 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.01em;margin:64px 0 14px;padding-top:28px;border-top:3px solid var(--ink)}
main h3{font:700 22px/1.25 ui-sans-serif,system-ui,sans-serif;margin:40px 0 8px}
main h2,main h3{position:relative}.anchor{position:absolute;left:-1.1em;color:var(--line);text-decoration:none;font-weight:400;opacity:0}h2:hover .anchor,h3:hover .anchor{opacity:1}
p,li{overflow-wrap:break-word}ul,ol{padding-left:1.3em}li{margin:.35em 0}
strong{font-weight:700}
code{font:0.86em/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--tint);padding:.1em .35em;border-radius:5px}
pre{position:relative;background:var(--code-bg);color:var(--code-ink);border-radius:var(--radius);padding:16px 18px;overflow:auto;font-size:14px;line-height:1.55;margin:20px 0}
pre code{background:none;padding:0;color:inherit;font-size:inherit;white-space:pre}
.copy{position:absolute;top:8px;right:8px;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;padding:6px 9px;border-radius:6px;border:1px solid #3a3d45;background:#1e2026;color:var(--code-dim);cursor:pointer}.copy:hover{color:#fff;border-color:#777}
.tw{overflow-x:auto;margin:22px 0;border:1px solid var(--line);border-radius:var(--radius);background:var(--paper)}
table{border-collapse:collapse;width:100%;font:15px/1.5 ui-sans-serif,system-ui,sans-serif;min-width:620px}
th{text-align:left;background:var(--tint);font-weight:700;white-space:nowrap}th,td{padding:10px 12px;vertical-align:top;border-bottom:1px solid var(--line)}tr:last-child td{border-bottom:0}
blockquote{margin:22px 0;padding:6px 18px;border-left:4px solid var(--accent);color:var(--soft);background:var(--paper)}
hr{border:0;border-top:1px solid var(--line);margin:40px 0}
figure.diagram{margin:30px -20px;padding:0}.frame{border:2px solid var(--ink);border-radius:var(--radius);overflow:hidden;background:#fff}
.frame iframe{display:block;width:100%;border:0}figcaption{font:14px/1.4 ui-sans-serif,system-ui,sans-serif;color:var(--soft);margin:10px 4px 0}
footer{max-width:1180px;margin:0 auto;padding:30px 20px 60px;border-top:1px solid var(--line);font:14px/1.5 ui-sans-serif,system-ui,sans-serif;color:var(--soft)}
@media (max-width:900px){.wrap{display:block}nav.toc{display:none}figure.diagram{margin-left:0;margin-right:0}body{font-size:17px}.anchor{display:none}}
@media print{nav.toc,.cta,.copy,figure.diagram{display:none}body{background:#fff}}
</style>
</head>
<body>
<header class="hero">
  <div class="eyebrow">A guide for humans and robots</div>
  <h1>${title}</h1>
  <p class="deck">${marked.parseInline(deck)}</p>
  <div class="cta">
    <a class="btn primary" href="#build-it-yourself-the-playbook">Build it yourself</a>
    <a class="btn" href="#the-interview">The artist interview</a>
    <a class="btn" href="guide.pdf">Download the PDF</a>
  </div>
</header>
<div class="wrap">
<nav class="toc" aria-label="Contents"><h2>Contents</h2><ol>
${tocHtml}
</ol></nav>
<main id="content">
${body}
</main>
</div>
<footer>Built ${new Date().toISOString().slice(0, 10)}. This page is a static copy of the guide; it was written by an AI agent working with an artist, and says plainly what was and was not verified.</footer>
<script>
(function(){
  document.querySelectorAll('pre .copy').forEach(function(b){b.addEventListener('click',function(){
    var t=b.parentNode.querySelector('code').innerText;
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1400)},function(){b.textContent='Press Ctrl+C';});
  });});
  var links=[].slice.call(document.querySelectorAll('nav.toc a')),map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l.classList.remove('on')});var a=map[e.target.id];if(a)a.classList.add('on')}})},{rootMargin:'-10% 0px -80% 0px'});
    document.querySelectorAll('main h2[id],main h3[id]').forEach(function(h){io.observe(h)});}
})();
</script>
</body>
</html>`;
writeFileSync(new URL('./index.html', import.meta.url), html);
console.log(`index.html: ${toc.length} sections, ${(html.length / 1024) | 0} KB, SITE_URL=${SITE_URL}`);
