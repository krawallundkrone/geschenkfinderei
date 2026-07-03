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

function layout({ title, desc, canonical, body, jsonld, ogImage }) {
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
${ogImage ? `<meta property="og:image" content="${site.domain}${ogImage}">` : ""}
<meta name="p:domain_verify" content="c2d1e9c215f2524de7d57e93ce896bf7"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)}" href="${site.domain}/feed.xml">
<link rel="stylesheet" href="/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied',
    analytics_storage:'denied', functionality_storage:'denied',
    personalization_storage:'denied', security_storage:'granted', wait_for_update:500
  });
  try {
    if (localStorage.getItem('finderei_consent') === 'accepted') {
      gtag('consent', 'update', {
        ad_storage:'granted', ad_user_data:'granted', ad_personalization:'granted',
        analytics_storage:'granted', functionality_storage:'granted', personalization_storage:'granted'
      });
    }
  } catch(e){}
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-X457K426P6"></script>
<script>
  gtag('js', new Date());
  gtag('config', 'G-X457K426P6');
</script>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="logo" href="/">Geschenk<span>finderei</span></a>
  <nav class="main">
    <a href="/geschenkfuehrer">Geschenkführer</a>
    <a href="/anlass/geburtstag">Geburtstag</a>
    <a href="/anlass/hochzeit">Hochzeit</a>
    <a href="/fuer/frauen">Für Frauen</a>
    <a href="/fuer/maenner">Für Männer</a>
    <a href="/budget/15">Unter 15 €</a>
  </nav>
</div></header>
<main><div class="wrap">
${body}
</div></main>
<footer class="site"><div class="wrap">
  <a href="/impressum">Impressum</a>
  <a href="/datenschutz">Datenschutz</a>
  <a href="#" onclick="try{localStorage.removeItem('finderei_consent');}catch(e){}location.reload();return false;">Cookie-Einstellungen</a>
  <p>${esc(site.footerNote)}</p>
  <p>© ${new Date().getFullYear()} ${esc(site.name)}</p>
</div></footer>
<div id="consent" class="consent" style="display:none">
  <div class="consent-inner">
    <div class="consent-text">
      <strong>Wir respektieren deine Privatsphäre</strong>
      <p>Wir verwenden Cookies und Google Analytics, um zu verstehen, welche Geschenkführer wirklich helfen. Notwendige Cookies sind für den Betrieb der Seite nötig, Statistik-Cookies nur mit deiner Einwilligung. Mehr in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>
    </div>
    <div class="consent-btns">
      <button id="c-necessary" type="button">Nur notwendige</button>
      <button id="c-accept" type="button" class="primary">Alle akzeptieren</button>
    </div>
  </div>
</div>
<script>
(function(){
  var KEY='finderei_consent';
  var box=document.getElementById('consent');
  function hide(){ box.style.display='none'; }
  function show(){ box.style.display='block'; }
  function grant(){
    if(window.gtag){
      gtag('consent','update',{
        ad_storage:'granted', ad_user_data:'granted', ad_personalization:'granted',
        analytics_storage:'granted', functionality_storage:'granted', personalization_storage:'granted'
      });
      gtag('event','page_view');
    }
  }
  var c=null; try{ c=localStorage.getItem(KEY); }catch(e){}
  if(c!=='accepted' && c!=='necessary'){ show(); }
  var acc=document.getElementById('c-accept');
  var nec=document.getElementById('c-necessary');
  if(acc) acc.addEventListener('click',function(){ try{localStorage.setItem(KEY,'accepted');}catch(e){} grant(); hide(); });
  if(nec) nec.addEventListener('click',function(){ try{localStorage.setItem(KEY,'necessary');}catch(e){} hide(); });
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[rel~="sponsored"]');
    if(a&&window.gtag){
      var item=a.closest('.item');
      var name=item&&item.querySelector('h3')?item.querySelector('h3').textContent.replace(/^\\d+\\.\\s*/,'').trim():'';
      gtag('event','affiliate_click',{link_url:a.href,page_path:location.pathname,item_name:name});
    }
  });
})();
</script>
</body>
</html>`;
}

function card(a) {
  const tag = site.anlassLabels[a.anlass] || a.anlass;
  return `<a class="card" href="/geschenke/${a.slug}">
    ${a.image ? `<img src="${a.image}" alt="${esc(a.image_alt || a.title)}" loading="lazy">` : ""}
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

function chipsFuer() {
  const c = Object.entries(site.fuerLabels).map(([k, v]) => `<a href="/fuer/${k}">Geschenke für ${esc(v)}</a>`);
  return `<div class="chips">${c.join("")}</div>`;
}

function chipsBudget() {
  const c = Object.entries(site.budgetLabels).map(([k, v]) => `<a href="/budget/${k}">Geschenke ${esc(v)}</a>`);
  return `<div class="chips">${c.join("")}</div>`;
}

function anlassTile(key) {
  const a = artikel.find(x => x.anlass === key && x.image);
  const label = site.anlassLabels[key];
  return `<a class="tile" href="/anlass/${key}">
    ${a ? `<img src="${a.image}" alt="${esc(label)}" loading="lazy">` : ""}
    <span>${esc(label)}</span>
  </a>`;
}

/* Startseite */
write("index.html", layout({
  title: `Geschenkinspiration: Geschenkideen nach Anlass, Person und Budget | ${site.name}`,
  desc: "Geschenkinspiration, die wirklich hilft: kuratierte Geschenkideen nach Anlass, Person und Budget. Ehrlich ausgesucht, klar begründet, jede Woche neu.",
  canonical: "/",
  jsonld: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${site.domain}/#website`,
        "name": site.name,
        "url": site.domain,
        "description": site.description,
        "inLanguage": "de-DE",
        "publisher": { "@id": `${site.domain}/#organization` }
      },
      {
        "@type": "Organization",
        "@id": `${site.domain}/#organization`,
        "name": site.name,
        "url": site.domain,
        "logo": { "@type": "ImageObject", "url": `${site.domain}/favicon.svg` }
      }
    ]
  },
  ogImage: "/hero.jpg",
  body: `<section class="hero-banner">
    <img src="/hero.jpg" alt="Liebevoll verpackte Geschenke in Creme und Terracotta" fetchpriority="high">
    <div class="hero-card">
      <h1>Geschenkinspiration, die wirklich hilft</h1>
      <p>Kuratierte Geschenkideen nach Anlass, Person und Budget. Ehrlich ausgesucht, klar begründet, jede Woche neu.</p>
    </div>
  </section>

  <section>
    <h2>Geschenke nach Anlass</h2>
    <div class="tiles">${Object.keys(site.anlassLabels).map(anlassTile).join("\n")}</div>
  </section>

  <section>
    <h2>Neue Geschenkführer</h2>
    <div class="grid">${artikel.map(card).join("\n")}</div>
    <p class="more-link"><a href="/geschenkfuehrer">Alle Geschenkführer ansehen →</a></p>
  </section>

  <section>
    <h2>Für wen suchst du?</h2>
    ${chipsFuer()}
    <h2>Wie viel möchtest du ausgeben?</h2>
    ${chipsBudget()}
  </section>

  <section class="seo-block">
    <h2>Geschenkinspiration ohne stundenlanges Suchen</h2>
    <p>Ein gutes Geschenk beantwortet eine einfache Frage: Woran hat diese Person Freude, ohne dass sie es sich selbst kaufen würde? Genau dafür gibt es die Geschenkfinderei. Statt endloser Produktlisten bekommst du hier kuratierte Geschenkführer mit jeweils acht durchdachten Ideen, jede mit einer ehrlichen Begründung, für wen sie passt und worauf du beim Kauf achten solltest.</p>
    <h3>Geschenkideen für jeden Anlass</h3>
    <p>Ob <a href="/anlass/geburtstag">Geburtstagsgeschenke</a> für Menschen, die scheinbar schon alles haben, <a href="/anlass/hochzeit">Hochzeitsgeschenke</a>, die nach der Feier wirklich benutzt werden, oder <a href="/anlass/einzug">Geschenke zum Einzug</a>, die besser sind als Brot und Salz: Jeder Anlass hat seine eigene Logik, und unsere Geschenkführer nehmen sie ernst.</p>
    <h3>Vom kleinen Mitbringsel bis zum besonderen Stück</h3>
    <p>Gute Geschenke sind keine Preisfrage. Unsere Ideen <a href="/budget/15">unter 15 Euro</a> beweisen, dass eine durchdachte Kleinigkeit mehr Wirkung hat als ein teurer Verlegenheitskauf. Und wenn es etwas Besonderes sein darf, findest du Vorschläge <a href="/budget/50">bis 50 Euro</a>, die sich nach deutlich mehr anfühlen.</p>
    <h3>Ehrlich kuratiert statt endlos gelistet</h3>
    <p>Wir verlinken Produkte über Affiliate-Links, transparent als Werbung gekennzeichnet. Ausgewählt wird trotzdem redaktionell: Jede Idee steht im Geschenkführer, weil sie gut ist, nicht weil sie die höchste Provision bringt. Am Preis ändert sich für dich dabei nichts.</p>
  </section>`
}));

/* Geschenkführer-Übersicht */
write("geschenkfuehrer.html", layout({
  title: `Alle Geschenkführer | ${site.name}`,
  desc: "Alle Geschenkführer der Geschenkfinderei im Überblick: kuratierte Geschenkideen nach Anlass, Person und Budget, jede Woche neu.",
  canonical: "/geschenkfuehrer",
  body: `<h1>Alle Geschenkführer</h1>
  <p class="teaser">Jeder Führer bündelt acht durchdachte Geschenkideen zu einem Anlass oder einer Person, mit ehrlicher Begründung statt Verkaufsjargon.</p>
  ${chips()}
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

  const pageUrl = `${site.domain}/geschenke/${a.slug}`;
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        "headline": a.title,
        "description": a.teaser,
        "image": a.image ? [`${site.domain}${a.image}`] : undefined,
        "datePublished": a.date,
        "dateModified": a.date,
        "inLanguage": "de-DE",
        "mainEntityOfPage": pageUrl,
        "author": { "@type": "Organization", "name": site.name, "url": site.domain },
        "publisher": {
          "@type": "Organization", "name": site.name, "url": site.domain,
          "logo": { "@type": "ImageObject", "url": `${site.domain}/favicon.svg` }
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Start", "item": `${site.domain}/` },
          { "@type": "ListItem", "position": 2, "name": anlassLabel, "item": `${site.domain}/anlass/${a.anlass}` },
          { "@type": "ListItem", "position": 3, "name": a.title, "item": pageUrl }
        ]
      },
      {
        "@type": "ItemList",
        "name": a.title,
        "numberOfItems": a.items.length,
        "itemListElement": a.items.map((it, i) => ({
          "@type": "ListItem", "position": i + 1, "name": it.name
        }))
      }
    ]
  };

  write(`geschenke/${a.slug}.html`, layout({
    title: `${a.title} | ${site.name}`,
    desc: a.teaser,
    canonical: `/geschenke/${a.slug}`,
    jsonld,
    ogImage: a.image,
    body: `<h1>${esc(a.title)}</h1>
    <p class="teaser">${esc(a.teaser)}</p>
    <p class="meta">Anlass: <a href="/anlass/${a.anlass}">${esc(anlassLabel)}</a> · Budget: <a href="/budget/${a.budget}">${esc(budgetLabel)}</a> · Stand: ${esc(a.date)}</p>
    ${a.image ? `<img class="hero-img" src="${a.image}" alt="${esc(a.image_alt || a.title)}">` : ""}
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
  <h2>Cookies, lokale Speicherung und Webanalyse</h2>
  <p>Diese Website speichert deine Entscheidung zur Webanalyse (Einwilligung oder Ablehnung) im lokalen Speicher deines Browsers (localStorage). Diese Speicherung ist technisch notwendig, um deine Wahl zu respektieren, und enthält keine personenbezogenen Daten.</p>
  <h2>Google Analytics 4 (nur mit Einwilligung)</h2>
  <p>Sofern du über das Einwilligungs-Banner zustimmst, nutzen wir Google Analytics 4, einen Webanalysedienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland ("Google"). Google Analytics verwendet Cookies und ähnliche Technologien, um die Nutzung der Website zu analysieren (z. B. aufgerufene Seiten, Verweildauer, Klicks auf Affiliate-Links). Die IP-Adresse wird von Google Analytics 4 standardmäßig gekürzt und nicht dauerhaft gespeichert. Es kann zu einer Übermittlung von Daten in die USA kommen; diese erfolgt auf Grundlage des EU-US Data Privacy Framework bzw. der Standardvertragsklauseln.</p>
  <p>Wir setzen den Google Consent Mode v2 ein. Das bedeutet: Der Google-Tag wird zwar geladen, setzt aber vor deiner Einwilligung keine Analyse- oder Werbe-Cookies und überträgt keine für die Analyse nutzbaren personenbezogenen Daten (Standardzustand "denied"). Erst wenn du auf "Alle akzeptieren" klickst, werden Statistik-Cookies gesetzt und die Analyse aktiviert. Wählst du "Nur notwendige", bleibt die Analyse deaktiviert.</p>
  <p>Rechtsgrundlage der Verarbeitung ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen oder ändern, indem du im Fußbereich der Website auf "Cookie-Einstellungen" klickst; das Banner erscheint dann erneut.</p>
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
const urls = ["/", "/geschenkfuehrer", ...artikel.map(a => `/geschenke/${a.slug}`),
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

/* Statische Assets kopieren (rekursiv) */
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(path.join(ROOT, "static"), OUT);

console.log(`Build ok: ${artikel.length} Artikel, ${urls.length} URLs`);
