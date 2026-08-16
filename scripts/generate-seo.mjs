// Emits the programmatic SEO surface into dist/ after `vite build`.
//
// WHY STATIC HTML AND NOT REACT ROUTES: fieldsta.com is a client-rendered
// SPA served from a single index.html, so every route ships the same
// <title> and description and the crawler's first look at any page is an
// empty <div id="root">. Google can execute JS, but "can" is doing heavy
// lifting — render is queued separately and unreliable, and Bing and every
// LLM crawler are worse. These pages exist to be indexed, so they are real
// HTML with real content in the initial response and no JS dependency at
// all.
//
// They deliberately load NEITHER the app's JS bundle (React would mount and
// replace the static content with the SPA) nor its CSS bundle — see the
// theme-token comment below for why the CSS link was removed. Everything
// they need is inlined.
//
// Run automatically from `npm run build`. Nothing here needs a key, an
// account, or a human.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, PRODUCTS, VERTICALS, pagePairs, secondaryProduct } from "../seo/verticals.mjs";
import { COMPARISONS } from "../seo/comparisons.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

if (!existsSync(DIST)) {
  console.error("[seo] dist/ does not exist — run vite build first.");
  process.exit(1);
}

// Theme tokens are lifted from src/index.css at build time and inlined,
// rather than linking the app's CSS bundle.
//
// Linking the bundle was the first approach and it failed quietly in the
// worst way: the regex that picked "the stylesheet" out of dist/index.html
// matched the leaflet CDN link instead of the hashed local bundle, so the
// pages loaded with no theme variables at all — every var(--accent)
// resolved to nothing and the call-to-action button rendered white on
// white. The build succeeded, the HTML was valid, and the only symptom was
// visual. Inlining removes the coupling entirely: these pages use none of
// the bundle's Tailwind (the JIT only emits classes it saw in src/, so
// utility classes here were never safe anyway), so linking it meant
// shipping ~50KB to style nothing while creating a way to lose the colors.
// Reading the tokens from source keeps them from drifting instead.
const indexCss = await readFile(path.join(ROOT, "src", "index.css"), "utf-8");
function themeBlock(selector) {
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`);
  const body = indexCss.match(re)?.[1];
  if (!body || !body.includes("--accent")) {
    console.error(`[seo] could not lift theme tokens for "${selector}" out of src/index.css.`);
    process.exit(1);
  }
  return `${selector}{${body.trim()}}`;
}
const THEME_TOKENS = [themeBlock(":root"), themeBlock('\\[data-theme="dark"\\]').replace(/\\/g, "")].join("\n");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const PAGE_CSS = `
${THEME_TOKENS}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:44rem;margin:0 auto;padding:3rem 1.25rem 5rem}
a{color:inherit}
.eyebrow{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;opacity:.6;margin:0 0 1rem}
h1{font-family:"Source Serif 4",Georgia,serif;font-weight:500;font-size:2rem;line-height:1.2;letter-spacing:-.02em;margin:0 0 1rem}
h2{font-family:"Source Serif 4",Georgia,serif;font-weight:500;font-size:1.25rem;margin:2.75rem 0 .75rem}
h3{font-size:.95rem;font-weight:600;margin:1.5rem 0 .35rem}
p{margin:0 0 1rem;opacity:.8}
.lede{font-size:1.05rem;opacity:.9}
.rule{height:1px;background:rgba(var(--text-rgb),.08);border:0;margin:2.5rem 0}
.cta{display:inline-block;background:var(--accent);color:#fff;font-weight:700;text-decoration:none;padding:.7rem 1.15rem;border-radius:.5rem;font-size:.9rem}
.cta:hover{background:var(--accent-hover)}
.cta-row{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;margin:1.5rem 0}
.cta-alt{font-size:.875rem;text-decoration:underline;text-underline-offset:3px;opacity:.75}
.price{font-size:.875rem;opacity:.6}
.note{font-size:.875rem;opacity:.65;border-left:2px solid rgba(var(--text-rgb),.15);padding-left:.9rem;margin:1.25rem 0}
.faq{border-top:1px solid rgba(var(--text-rgb),.08);padding:1.15rem 0}
.faq p{margin:.35rem 0 0;font-size:.925rem}
.links{display:flex;flex-wrap:wrap;gap:.5rem 1.1rem;font-size:.875rem;margin:.75rem 0 0;padding:0;list-style:none}
.links a{opacity:.75;text-decoration:underline;text-underline-offset:3px}
.foot{margin-top:3.5rem;padding-top:1.5rem;border-top:1px solid rgba(var(--text-rgb),.08);font-size:.8rem;opacity:.55}
.foot a{text-decoration:underline;text-underline-offset:3px}
@media(min-width:640px){h1{font-size:2.5rem}.wrap{padding-top:4rem}}
`.trim();

// Same theme bootstrap the app uses, so a dark-mode visitor arriving from
// search doesn't get flashed a white page.
const THEME_SCRIPT = `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})();`;

function shell({ title, description, canonical, jsonLd, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${esc(canonical)}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<script>${THEME_SCRIPT}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&display=swap" />
<style>${PAGE_CSS}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
</head>
<body>
<div class="wrap">
${body}
<div class="foot">
  <a href="/">Fieldsta</a> · <a href="/products">Products</a> · <a href="/get-started">Get started</a> · <a href="/help">Help</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
</div>
</div>
</body>
</html>
`;
}

async function emit(relPath, html) {
  const full = path.join(DIST, relPath, "index.html");
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, html, "utf-8");
}

const urls = [];
function track(loc, priority, changefreq = "monthly") {
  urls.push({ loc, priority, changefreq });
}

// ---------------------------------------------------------------- pages

const pairs = pagePairs();

for (const { vertical: v, product: p } of pairs) {
  const rel = `${p.base}/${v.slug}`;
  const canonical = `${SITE}/${rel}`;
  const title = `${p.name} for ${v.name} — Fieldsta`;
  const description = `${p.blurb} Built for how a ${v.noun} actually receives inbound. ${p.priceLine}.`;

  // Cross-links to the OTHER product for this same vertical, plus a few
  // sibling verticals — internal linking is how these get crawled at all,
  // since nothing else on the site points at them yet.
  const secondary = secondaryProduct(v);
  const others = VERTICALS.filter((o) => o.slug !== v.slug && o.products[0] === p.key).slice(0, 6);
  const comparisons = COMPARISONS.filter((c) => c.forProduct === p.key);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: v.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Fieldsta", item: SITE },
          { "@type": "ListItem", position: 2, name: p.name, item: `${SITE}/${p.base}` },
          { "@type": "ListItem", position: 3, name: v.name, item: canonical },
        ],
      },
    ],
  };

  const body = `
<p class="eyebrow">${esc(p.name)}</p>
<h1>${esc(p.name)} for ${esc(v.name)}</h1>
<p class="lede">${esc(p.blurb)}</p>
<div class="cta-row">
  <a class="cta" href="/get-started">Get started</a>
  <a class="cta-alt" href="${esc(p.demoHref)}">${esc(p.demoLabel)}</a>
</div>
<p class="price">${esc(p.priceLine)} · ${esc(p.assurance)}</p>

<hr class="rule" />

<h2>What inbound actually looks like at a ${esc(v.noun)}</h2>
<p>${esc(v.todayReality)}</p>
<h3>What comes in</h3>
<p>${esc(v.whatComesIn)}</p>
<h3>Who answers it today</h3>
<p>${esc(v.whoAnswersNow)}</p>

<h2>Why the slow reply costs you the job</h2>
<p>${esc(v.stakes)}</p>

<h2>Where Fieldsta fits</h2>
<p>${esc(v.fitNotes)}</p>
<div class="note"><strong>What it will not do.</strong> ${esc(v.limits)}</div>

<h2>See it on your own site first</h2>
<p>Before deciding anything: run the free check. It reads one public page of your site the way a customer would and tells you what they can actually see — how many ways they can reach you, and what happens if they land there at 9pm. No signup, and the result shows in full.</p>
<div class="cta-row"><a class="cta" href="/grader">Check my site free</a></div>

<h2>Questions</h2>
${v.faqs
  .map((f) => `<div class="faq"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`)
  .join("\n")}

<div class="cta-row">
  <a class="cta" href="/get-started">Get started</a>
  <a class="cta-alt" href="/products">Compare products</a>
</div>

<hr class="rule" />
${
  secondary
    ? `<h3>The other half of this</h3>
<p>Plenty of ${esc(v.name.toLowerCase())} run ${esc(secondary.name)} alongside it — ${esc(secondary.blurb.charAt(0).toLowerCase() + secondary.blurb.slice(1))} ${esc(secondary.priceLine)}.</p>
<ul class="links"><li><a href="/${esc(secondary.base)}">${esc(secondary.name)}</a></li><li><a href="/products">Compare both</a></li></ul>`
    : ""
}
${
  comparisons.length
    ? `<h3>How ${esc(p.name)} compares</h3>
<ul class="links">
${comparisons.map((c) => `<li><a href="/${esc(p.base)}/vs/${esc(c.slug)}">vs ${esc(c.name)}</a></li>`).join("\n")}
</ul>`
    : ""
}
<h3>${esc(p.name)} for other businesses</h3>
<ul class="links">
${others.map((o) => `<li><a href="/${esc(p.base)}/${esc(o.slug)}">${esc(o.name)}</a></li>`).join("\n")}
<li><a href="/${esc(p.base)}">All industries</a></li>
</ul>
`;

  await emit(rel, shell({ title, description, canonical, jsonLd, body }));
  track(canonical, "0.8");
}

// ------------------------------------------------------ comparison pages
//
// Nested under the product's own base ("/ai-lead-response/vs/<slug>") so
// they fall inside the SAME vercel.json negative-lookahead prefix already
// carved out for vertical pages -- no rewrite-config change needed, and
// no way to forget one (the exact bug class CLAUDE.md already warns about
// for this file). Compares against an APPROACH (doing nothing, hiring
// someone, a generic chatbot), never a named competitor -- see
// comparisons.mjs for why.

for (const c of COMPARISONS) {
  const p = PRODUCTS[c.forProduct];
  const rel = `${p.base}/vs/${c.slug}`;
  const canonical = `${SITE}/${rel}`;
  const title = `Fieldsta vs ${c.name} — ${p.name}`;
  const description = `How Fieldsta's ${p.name.toLowerCase()} compares to ${c.name}: what each is actually good at, where it falls short, and where Fieldsta fits. ${p.priceLine}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: c.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Fieldsta", item: SITE },
          { "@type": "ListItem", position: 2, name: p.name, item: `${SITE}/${p.base}` },
          { "@type": "ListItem", position: 3, name: `vs ${c.name}`, item: canonical },
        ],
      },
    ],
  };

  const otherComparisons = COMPARISONS.filter((o) => o.forProduct === c.forProduct && o.slug !== c.slug);

  const body = `
<p class="eyebrow">${esc(p.name)} · Comparison</p>
<h1>Fieldsta vs ${esc(c.name)}</h1>
<p class="lede">${esc(p.blurb)}</p>
<div class="cta-row">
  <a class="cta" href="/get-started">Get started</a>
  <a class="cta-alt" href="${esc(p.demoHref)}">${esc(p.demoLabel)}</a>
</div>
<p class="price">${esc(p.priceLine)} · ${esc(p.assurance)}</p>

<hr class="rule" />

<h2>What ${esc(c.name)} actually is</h2>
<p>${esc(c.whatItIs)}</p>

<h2>Where it genuinely wins</h2>
<p>${esc(c.whereItWins)}</p>

<h2>Where it falls short</h2>
<p>${esc(c.whereItFalls)}</p>

<h2>Where Fieldsta fits</h2>
<p>${esc(c.fieldstaFit)}</p>
<div class="note"><strong>What it will not do.</strong> ${esc(c.limits)}</div>

<h2>See it on your own site first</h2>
<p>Before deciding anything: run the free check. It reads one public page of your site the way a customer would and tells you what they can actually see — how many ways they can reach you, and what happens if they land there at 9pm. No signup, and the result shows in full.</p>
<div class="cta-row"><a class="cta" href="/grader">Check my site free</a></div>

<h2>Questions</h2>
${c.faqs.map((f) => `<div class="faq"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("\n")}

<div class="cta-row">
  <a class="cta" href="/get-started">Get started</a>
  <a class="cta-alt" href="/products">Compare products</a>
</div>

<hr class="rule" />
${
  otherComparisons.length
    ? `<h3>More comparisons</h3>
<ul class="links">
${otherComparisons.map((o) => `<li><a href="/${esc(p.base)}/vs/${esc(o.slug)}">vs ${esc(o.name)}</a></li>`).join("\n")}
<li><a href="/${esc(p.base)}">All industries</a></li>
</ul>`
    : `<h3>See it by industry</h3>
<ul class="links"><li><a href="/${esc(p.base)}">All industries</a></li></ul>`
}
`;

  await emit(rel, shell({ title, description, canonical, jsonLd, body }));
  track(canonical, "0.6");
}

// ------------------------------------------------------- product hubs

for (const p of Object.values(PRODUCTS)) {
  const list = VERTICALS.filter((v) => v.products[0] === p.key);
  const hubComparisons = COMPARISONS.filter((c) => c.forProduct === p.key);
  const canonical = `${SITE}/${p.base}`;
  const body = `
<p class="eyebrow">Fieldsta</p>
<h1>${esc(p.name)}, by industry</h1>
<p class="lede">${esc(p.blurb)}</p>
<div class="cta-row">
  <a class="cta" href="/get-started">Get started</a>
  <a class="cta-alt" href="${esc(p.demoHref)}">${esc(p.demoLabel)}</a>
</div>
<p class="price">${esc(p.priceLine)} · ${esc(p.assurance)}</p>
<hr class="rule" />
<h2>Pick your industry</h2>
<p>Each page describes how inbound actually arrives in that business, and what the agent will and won't do there.</p>
<ul class="links">
${list.map((v) => `<li><a href="/${esc(p.base)}/${esc(v.slug)}">${esc(v.name)}</a></li>`).join("\n")}
</ul>
${
  hubComparisons.length
    ? `<h3>How it compares</h3>
<ul class="links">
${hubComparisons.map((c) => `<li><a href="/${esc(p.base)}/vs/${esc(c.slug)}">vs ${esc(c.name)}</a></li>`).join("\n")}
</ul>`
    : ""
}
<h3>Other products</h3>
<ul class="links">
${Object.values(PRODUCTS)
  .filter((o) => o.key !== p.key)
  .map((o) => `<li><a href="/${esc(o.base)}">${esc(o.name)}</a></li>`)
  .join("\n")}
<li><a href="/products">Compare everything</a></li>
</ul>
`;
  await emit(p.base, shell({
    title: `${p.name} by industry — Fieldsta`,
    description: `${p.blurb} ${p.priceLine}.`,
    canonical,
    jsonLd: null,
    body,
  }));
  track(canonical, "0.9");
}

// ------------------------------------------------- sitemap + robots

// The SPA's own public routes. Private/app routes are deliberately absent —
// a sitemap is a crawl invitation, and /login or a dashboard has nothing to
// offer a search engine.
for (const [loc, pri] of [["/", "1.0"], ["/products", "0.9"], ["/get-started", "0.8"], ["/help", "0.6"], ["/try", "0.7"], ["/privacy", "0.3"], ["/terms", "0.3"]]) {
  track(`${SITE}${loc}`, pri, loc === "/" ? "weekly" : "monthly");
}

urls.sort((a, b) => Number(b.priority) - Number(a.priority) || a.loc.localeCompare(b.loc));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${esc(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>
`;
await writeFile(path.join(DIST, "sitemap.xml"), sitemap, "utf-8");

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
await writeFile(path.join(DIST, "robots.txt"), robots, "utf-8");

console.log(
  `[seo] ${pairs.length} vertical pages + ${Object.keys(PRODUCTS).length} hubs + ${COMPARISONS.length} comparison pages, ${urls.length} URLs in sitemap.xml, robots.txt written.`
);
