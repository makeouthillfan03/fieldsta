# fieldsta (marketing site)

Vite/React SPA, deployed to Vercel, served at **fieldsta.com**. Public-facing only — the actual product (dashboard, login, agents, sending) lives in the sibling repo `/Users/jonathanchoi/fieldsta-agents`, served at studio.fieldsta.com.

## Live routes (`src/App.jsx`) — everything else in `src/pages/` is dead

```
/          DemoLanding.jsx   — homepage: hero, demo video, LeadReviewDemo, FAQ
/try       LiveDemo.jsx      — the "90 seconds, no signup" interactive demo referenced in every cold email
/terms, /privacy, /agreement
/login     — auth-gated, redirects into the real app at studio.fieldsta.com
/growth    GrowthDashboard.jsx — auth-gated
```

## Programmatic SEO surface (`seo/`, `scripts/generate-seo.mjs`)

`npm run build` runs `vite build`, then generates **static HTML** pages into `dist/` and validates them (`scripts/check-seo.mjs`, which fails the build). Content lives in `seo/verticals.mjs`. Currently 16 industry pages + 2 product hubs, at `/ai-lead-response/<vertical>` and `/ai-support-agent/<vertical>`, plus `sitemap.xml` and `robots.txt` (neither existed before).

These are **not** React routes, deliberately: the site is a client-rendered SPA where every route ships the same `<title>` and an empty `<div id="root">`, so nothing was indexable. The generated pages are real HTML with content in the initial response, load **neither** the app's JS bundle (React would mount and wipe them) nor its CSS bundle — theme tokens are lifted from `src/index.css` at build time and inlined instead.

Three constraints the validator enforces, each from a bug that actually shipped:
- **No near-duplicate pages.** One page per vertical on its *primary* product. Generating one page per (vertical × product) made the two pages for a trade 93% identical — the vertical research is a property of the trade, not the product — which is the doorway-page pattern Google demotes. The secondary product is cross-sold in-page instead.
- **No cross-product copy.** Support-agent pages once carried the lead product's "human review on every booking" and a `/try` link; both describe features that product doesn't have.
- **No invented statistics or guarantees**, same standing rule as the rest of the site.

`vercel.json`'s SPA catch-all rewrite has these prefixes carved out via negative lookahead — adding a product to `seo/verticals.mjs` means adding its `base` there too, or the pages serve the empty app shell.

`src/pages/` also contains ~25 other page components (Dashboard, DispatchBoard, JobDetail, PriceBook, Technicians, FindAPro, ProsDirectory, MarketplaceAdmin, CustomerPortal, etc.) — **leftover from an earlier HVAC-services-marketplace pivot.** Fieldsta is now solely the AI lead-response SaaS ($500/mo); none of these routes are wired into `App.jsx` and none are reachable. Left in place rather than deleted — don't assume something referenced there is live without checking `App.jsx` first.

## Demo video

`public/demo-video.mp4` — the user's own recorded walkthrough, embedded on the homepage. If a re-recorded version is ever dropped in: **remux with `ffmpeg -c copy -movflags +faststart` before deploying.** QuickTime Player exports commonly put the moov atom at the end of the file, which plays fine locally but renders blank/black in-browser (confirm via `mdls` showing `kMDItemStreamable = 0`). No ffmpeg on this machine by default — `pip install imageio-ffmpeg` gets a static binary if needed.

## PWA — deliberately removed

`vite-plugin-pwa` was removed (was serving a stale "Find a Pro — Perth Amboy" manifest from the old pivot). `main.jsx` actively unregisters any already-installed service worker + clears caches on load, so returning visitors' stale installs clean themselves up. Don't re-add PWA support without deliberately deciding to.

## Backend

None — this site calls the fieldsta-agents API directly (studio.fieldsta.com) for anything dynamic (`/try` demo, login). No API routes live in this repo.
