// Validates the generated SEO surface in dist/. Runs as part of `npm run
// build`, so a broken page fails the build instead of being deployed and
// quietly ranking for nothing.
//
// The checks are shaped by what actually went wrong while building this:
// the pages rendered, the build passed, the HTML was valid — and the theme
// tokens were missing, so the call-to-action was white on white. "It
// generated" proves almost nothing here, which is why these assert on
// content and resolvability rather than on files existing.
//
//   node scripts/check-seo.mjs

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, PRODUCTS, VERTICALS, pagePairs } from "../seo/verticals.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

let failures = 0;
function check(name, fn) {
  try {
    fn();
  } catch (err) {
    failures++;
    console.error(`  FAIL ${name}\n       ${err.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const pairs = pagePairs();
const pages = [];
for (const { vertical, product } of pairs) {
  const rel = `${product.base}/${vertical.slug}`;
  const file = path.join(DIST, rel, "index.html");
  if (!existsSync(file)) {
    failures++;
    console.error(`  FAIL ${rel} was not generated`);
    continue;
  }
  pages.push({ rel, vertical, product, html: await readFile(file, "utf-8") });
}
for (const p of Object.values(PRODUCTS)) {
  const file = path.join(DIST, p.base, "index.html");
  if (!existsSync(file)) {
    failures++;
    console.error(`  FAIL hub ${p.base} was not generated`);
    continue;
  }
  pages.push({ rel: p.base, hub: true, product: p, html: await readFile(file, "utf-8") });
}

// --- the bug that shipped invisibly: no theme tokens, white-on-white CTA
for (const p of pages) {
  check(`${p.rel} defines its theme tokens`, () => {
    assert(/--accent:\s*#/.test(p.html), "no --accent value — every var(--accent) would resolve to nothing");
    assert(/--bg:\s*#/.test(p.html) && /--text:\s*#/.test(p.html), "missing --bg/--text tokens");
    assert(p.html.includes('[data-theme="dark"]'), "no dark-mode token block — dark-mode visitors get a white page");
  });
  check(`${p.rel} does not load the app bundle`, () => {
    // React mounting would replace the static content with the SPA.
    assert(!/<script[^>]+src="\/assets\/[^"]+\.js"/.test(p.html), "app JS bundle linked — React would wipe the content");
  });
}

// --- indexability basics
for (const p of pages) {
  check(`${p.rel} has a unique, non-empty title and description`, () => {
    const title = p.html.match(/<title>([^<]+)<\/title>/)?.[1];
    const desc = p.html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert(title && title.length > 15, "missing or stub <title>");
    assert(desc && desc.length > 60, "missing or too-short meta description");
  });
  check(`${p.rel} declares a canonical URL`, () => {
    const canon = p.html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert(canon === `${SITE}/${p.rel}`, `canonical is "${canon}", expected "${SITE}/${p.rel}"`);
  });
  check(`${p.rel} has exactly one h1`, () => {
    const n = (p.html.match(/<h1[\s>]/g) ?? []).length;
    assert(n === 1, `found ${n} h1 elements`);
  });
}

check("every title is distinct", () => {
  const titles = pages.map((p) => p.html.match(/<title>([^<]+)<\/title>/)?.[1]);
  const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
  assert(dupes.length === 0, `duplicate titles: ${[...new Set(dupes)].join(", ")}`);
});

// --- the doorway-page failure: many near-identical pages rank for nothing
check("vertical pages are not near-duplicates of each other", () => {
  const bodies = pages
    .filter((p) => !p.hub)
    .map((p) => ({
      rel: p.rel,
      // Compare the prose only, stripping tags, so shared chrome doesn't
      // mask thin content.
      words: new Set(
        p.html
          .replace(/<script[\s\S]*?<\/script>/g, "")
          .replace(/<style[\s\S]*?<\/style>/g, "")
          .replace(/<[^>]+>/g, " ")
          .toLowerCase()
          .match(/[a-z]{4,}/g) ?? []
      ),
    }));
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i].words;
      const b = bodies[j].words;
      const shared = [...a].filter((w) => b.has(w)).length;
      const jaccard = shared / (a.size + b.size - shared);
      assert(
        jaccard < 0.72,
        `${bodies[i].rel} and ${bodies[j].rel} share ${Math.round(jaccard * 100)}% of vocabulary — that reads as a doorway page`
      );
    }
  }
});

check("every vertical page carries substantive prose", () => {
  for (const p of pages.filter((x) => !x.hub)) {
    const words = (p.html.replace(/<[^>]+>/g, " ").match(/\S+/g) ?? []).length;
    assert(words > 320, `${p.rel} has only ~${words} words — too thin to rank`);
  }
});

// --- no fabricated claims (the site's standing rule)
check("no invented statistics or guarantees", () => {
  for (const p of pages) {
    const prose = p.html.replace(/<[^>]+>/g, " ");
    const stat = prose.match(/\b\d{1,3}(\.\d+)?\s?%/g);
    assert(!stat, `${p.rel} contains a percentage claim (${stat?.join(", ")}) — the site does not publish invented stats`);
    assert(
      !/\bguarantee(d|s)?\b/i.test(prose),
      `${p.rel} uses the word "guarantee" — response-time/outcome guarantees are off-limits`
    );
  }
});

// --- product copy must belong to the product the page is selling.
// The support-agent pages originally shipped the lead product's assurance
// line ("human review on every booking") and its demo link ("see it work on
// a real lead" -> /try). Both describe features the support agent does not
// have, on the page a buyer would land on from search.
check("no page promises another product's features", () => {
  for (const p of pages) {
    const prose = p.html.replace(/<[^>]+>/g, " ");
    if (p.product.key === "support") {
      assert(!/review on every booking/i.test(prose), `${p.rel}: support agent doesn't book anything`);
      assert(!/href="\/try"/.test(p.html), `${p.rel}: /try is the lead-response demo, not this product`);
    }
    assert(prose.includes(p.product.priceLine), `${p.rel} does not state its own price (${p.product.priceLine})`);
  }
});

// --- internal links must resolve, or the crawl budget is wasted on 404s
const SPA_ROUTES = new Set(["/", "/try", "/products", "/help", "/get-started", "/terms", "/privacy", "/agreement"]);
check("every internal link resolves", () => {
  const bad = [];
  for (const p of pages) {
    for (const m of p.html.matchAll(/href="(\/[^"#]*)"/g)) {
      const href = m[1];
      if (SPA_ROUTES.has(href)) continue;
      if (href.startsWith("/assets/") || /\.(png|svg|xml|txt|ico)$/.test(href)) continue;
      const target = path.join(DIST, href, "index.html");
      if (!existsSync(target)) bad.push(`${p.rel} -> ${href}`);
    }
  }
  assert(bad.length === 0, `dead internal links:\n       ${bad.join("\n       ")}`);
});

// --- sitemap & robots
check("sitemap lists every generated page and is well-formed", () => {
  const sm = path.join(DIST, "sitemap.xml");
  assert(existsSync(sm), "sitemap.xml missing");
});
const sitemap = existsSync(path.join(DIST, "sitemap.xml"))
  ? await readFile(path.join(DIST, "sitemap.xml"), "utf-8")
  : "";
check("every generated page is in the sitemap", () => {
  for (const p of pages) {
    assert(sitemap.includes(`${SITE}/${p.rel}<`), `${p.rel} is not listed in sitemap.xml`);
  }
});
check("robots.txt allows crawling and points at the sitemap", () => {
  const rf = path.join(DIST, "robots.txt");
  assert(existsSync(rf), "robots.txt missing");
});
if (existsSync(path.join(DIST, "robots.txt"))) {
  const robots = await readFile(path.join(DIST, "robots.txt"), "utf-8");
  check("robots.txt is not blocking the site", () => {
    assert(!/^Disallow:\s*\/\s*$/m.test(robots), "robots.txt disallows everything");
    assert(robots.includes(`${SITE}/sitemap.xml`), "robots.txt does not reference the sitemap");
  });
}

// --- the Vercel rewrite must not shadow these paths.
// vercel.json's catch-all sends everything to /index.html. Vercel checks
// the filesystem before applying rewrites (which is why /assets/*.js
// resolves at all), so these static pages would probably win regardless —
// but "probably" is carrying the entire organic channel, and if that
// ordering ever changed, every page here would silently start serving the
// empty SPA shell to crawlers with nothing failing loudly. The negative
// lookahead in the rewrite source makes it explicit; this check makes sure
// nobody adds a product to seo/verticals.mjs without adding its prefix
// there. (vercel.json is strict JSON with no comment support, hence this
// living here.)
const vercelRaw = await readFile(path.join(ROOT, "vercel.json"), "utf-8");
check("vercel.json carves the generated prefixes out of the SPA rewrite", () => {
  const vercel = JSON.parse(vercelRaw);
  const src = vercel.rewrites?.[0]?.source ?? "";
  for (const p of Object.values(PRODUCTS)) {
    assert(
      src.includes(p.base),
      `"${p.base}" is not excluded from the SPA rewrite in vercel.json — those pages would serve the empty app shell`
    );
  }
});

if (failures === 0) {
  console.log(`[seo] ✓ ${pages.length} pages validated (${pairs.length} vertical + ${Object.keys(PRODUCTS).length} hub).`);
} else {
  console.error(`\n[seo] ${failures} CHECK(S) FAILED — not shipping a broken SEO surface.`);
  process.exit(1);
}
