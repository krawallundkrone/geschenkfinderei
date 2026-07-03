const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "public");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "content/site.json"), "utf8"));

const artikelDir = path.join(ROOT, "content/artikel");
const artikel = fs.readdirSync(artikelDir)
  .filter(f => f.endsWith(".json"))
  .map(f => JSON.parse(fs.readFileSync(path.join(artikelDir, f), "utf8")))
  .sort((a, b) => b.date.localeCompare(a.date));

const esc = s => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function layout({ title, desc, canonical, body, jsonld }) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${site.domain}${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${site.domain}${canonical}">
<meta property="og:site_name" content="${esc(site.name)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)}" href="${site.domain}/feed.xml">
<link rel="stylesheet" href="/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body>
<header class="site"><div class="wrap">
  <a class="logo" href="/">Geschenk<span>finderei</span></a>
  <nav class="main">
    <a href="/anlass/hochzeit">Hochzeit</a>
    <a href="/anlass/geburtstag">Geburtstag</a>
    <a href="/budget/15">Unter 15 €</a>
  </nav>
</div></header>
<main><div class="wrap">
${body}
</div></main>
<footer class="site"><div class="wrap">
  <a href="/impressum">Impressum</a>
  <a href="/datenschutz">Datenschutz</a>
  <p>${esc(site.footerNote)}</p>
  <p>© ${new Date().getFullYear()} ${esc(site.name)}</p>
</div></footer>
</body>
</html>`;
}

function card(a) {
  const tag = site.anlassLabels[a.anlass] || a.anlass;
  return `<a class="card" href="/geschenke/${a.slug}">
    <span class="tag">${esc(tag)}</span>
    <h3>${esc(a.title)}</h3>
    <p>${esc(a.teaser)}</p>
  </a>`;
}

function chips() {
  const c = [];
  for (const [k, v] of Object.entries(site.anlassLabels)) c.push(`<a href="/anlass/${k}">${esc(v)}</a>`);
  for (const [k, v] of Object.entries(site.budgetLabels)) c.push(`<a href="/budget/${k}">${esc(v)}</a>`);
  return `<div class="chips">${c.join("")}</div>`;
}

/* Startseite */
write("index.html", layout({
  title: `${site.name} – ${site.claim}`,
  desc: site.description,
  canonical: "/",
  body: `<div class="hero">
    <h1>Das passende Geschenk, ohne stundenlanges Suchen.</h1>
    <p class="claim">${esc(site.description)}</p>
    ${chips()}
  </div>
  <div class="grid">${artikel.map(card).join("\n")}</div>`
}));

/* Artikelseiten */
for (const a of artikel) {
  const anlassLabel = site.anlassLabels[a.anlass] || a.anlass;
  const budgetLabel = site.budgetLabels[a.budget] || a.budget;
  const items = a.items.map((it, i) => `<div class="item">
    <h3><span class="num">${i + 1}.</span>${esc(it.name)}</h3>
    <p>${esc(it.desc)}</p>
    <p class="preis">Preis: ${esc(it.preis)}</p>
    <a class="btn" href="${esc(it.url)}" rel="sponsored nofollow noopener" target="_blank">Bei Amazon ansehen <small>*</small></a>
  </div>`).join("\n");

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": a.title,
    "numberOfItems": a.items.length,
    "itemListElement": a.items.map((it, i) => ({
      "@type": "ListItem", "position": i + 1, "name": it.name
    }))
  };

  write(`geschenke/${a.slug}.html`, layout({
    title: `${a.title} | ${site.name}`,
    desc: a.teaser,
    canonical: `/geschenke/${a.slug}`,
    jsonld,
    body: `<h1>${esc(a.title)}</h1>
    <p class="teaser">${esc(a.teaser)}</p>
    <p class="meta">Anlass: <a href="/anlass/${a.anlass}">${esc(anlassLabel)}</a> · Budget: <a href="/budget/${a.budget}">${esc(budgetLabel)}</a> · Stand: ${esc(a.date)}</p>
    <p class="disclosure"><strong>Werbung</strong> · ${esc(site.disclosure.replace("Werbung · ", ""))}</p>
    <p>${esc(a.intro)}</p>
    ${items}
    <p class="meta">* Affiliate-Link (Werbung). Mehr dazu im <a href="/impressum">Impressum</a>.</p>`
  }));
}

/* Hub-Seiten */
function hub(prefix, key, labels) {
  const groups = {};
  for (const a of artikel) (groups[a[key]] = groups[a[key]] || []).push(a);
  for (const [val, list] of Object.entries(groups)) {
    const label = labels[val] || val;
    const title = key === "budget" ? `Geschenke ${label}` : `Geschenke: ${label}`;
    write(`${prefix}/${val}.html`, layout({
      title: `${title} | ${site.name}`,
      desc: `${title} – kuratierte Geschenkideen von ${site.name}.`,
      canonical: `/${prefix}/${val}`,
      body: `<h1>${esc(title)}</h1>${chips()}<div class="grid">${list.map(card).join("\n")}</div>`
    }));
  }
}
hub("anlass", "anlass", site.anlassLabels);
hub("fuer", "fuer", site.fuerLabels);
hub("budget", "budget", site.budgetLabels);

/* Impressum */
const imp = site.impressum;
write("impressum.html", layout({
  title: `Impressum | ${site.name}`,
  desc: `Impressum von ${site.name}.`,
  canonical: "/impressum",
  body: `<div class="legal">
  <h1>Impressum</h1>
  <p>Angaben gemäß § 5 DDG</p>
  <p>${esc(imp.name)}<br>${esc(imp.strasse)}<br>${esc(imp.ort)}</p>
  <h2>Kontakt</h2>
  <p>E-Mail: ${esc(site.email)}</p>
  <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
  <p>${esc(imp.name)}, ${esc(imp.strasse)}, ${esc(imp.ort)}</p>
  <h2>Hinweis zu Affiliate-Links (Werbung)</h2>
  <p>Diese Website finanziert sich über Affiliate-Links. Kaufst du ein Produkt über einen solchen Link, erhalten wir vom jeweiligen Anbieter eine Provision. Für dich entstehen dadurch keine Mehrkosten. Affiliate-Links sind auf dieser Website als Werbung gekennzeichnet.</p>
  </div>`
}));

/* Datenschutz */
write("datenschutz.html", layout({
  title: `Datenschutzerklärung | ${site.name}`,
  desc: `Datenschutzerklärung von ${site.name}.`,
  canonical: "/datenschutz",
  body: `<div class="legal">
  <h1>Datenschutzerklärung</h1>
  <h2>Verantwortlicher</h2>
  <p>${esc(imp.name)}, ${esc(imp.strasse)}, ${esc(imp.ort)}, E-Mail: ${esc(site.email)}</p>
  <h2>Hosting</h2>
  <p>Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Beim Aufruf der Website verarbeitet Vercel technisch notwendige Daten (insbesondere IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, Browser-Informationen) in Server-Logfiles. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der sicheren und zuverlässigen Bereitstellung der Website). Die Übermittlung in die USA erfolgt auf Grundlage der Standardvertragsklauseln der EU-Kommission bzw. des EU-US Data Privacy Framework.</p>
  <h2>Cookies und Tracking</h2>
  <p>Diese Website setzt keine Cookies und verwendet keine Analyse- oder Tracking-Dienste.</p>
  <h2>Affiliate-Links</h2>
  <p>Diese Website enthält Links zu externen Shops (z. B. Amazon). Erst mit dem Klick auf einen solchen Link verlässt du diese Website; ab dann gelten die Datenschutzbestimmungen des jeweiligen Anbieters.</p>
  <h2>Kontaktaufnahme</h2>
  <p>Bei Kontaktaufnahme per E-Mail werden die übermittelten Daten ausschließlich zur Beantwortung der Anfrage verarbeitet (Art. 6 Abs. 1 lit. b bzw. f DSGVO).</p>
  <h2>Deine Rechte</h2>
  <p>Du hast gegenüber dem Verantwortlichen das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung. Außerdem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.</p>
  <p>Stand: Juli 2026</p>
  </div>`
}));

/* robots.txt, sitemap.xml, feed.xml */
const urls = ["/", ...artikel.map(a => `/geschenke/${a.slug}`),
  ...Object.keys(site.anlassLabels).map(k => `/anlass/${k}`),
  ...Object.keys(site.fuerLabels).map(k => `/fuer/${k}`),
  ...Object.keys(site.budgetLabels).map(k => `/budget/${k}`),
  "/impressum", "/datenschutz"];

write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.domain}${u}</loc></url>`).join("\n")}
</urlset>`);

write("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(site.name)}</title>
<link>${site.domain}</link>
<description>${esc(site.description)}</description>
<language>de-de</language>
${artikel.map(a => `<item>
<title>${esc(a.title)}</title>
<link>${site.domain}/geschenke/${a.slug}</link>
<guid>${site.domain}/geschenke/${a.slug}</guid>
<pubDate>${new Date(a.date + "T08:00:00Z").toUTCString()}</pubDate>
<description>${esc(a.teaser)}</description>
</item>`).join("\n")}
</channel></rss>`);

/* Statische Assets kopieren */
for (const f of fs.readdirSync(path.join(ROOT, "static"))) {
  fs.copyFileSync(path.join(ROOT, "static", f), path.join(OUT, f));
}

console.log(`Build ok: ${artikel.length} Artikel, ${urls.length} URLs`);
