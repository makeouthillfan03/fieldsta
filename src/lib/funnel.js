import { track } from "@vercel/analytics";

// Why this file exists: as of 2026-08-26 the site had 52 inbound clicks from
// cold email and zero trial signups, and no way to tell WHICH step lost them.
// Every existing track() call fires on a click — i.e. only on the actions of
// people who already decided to act. Nothing recorded the far more common
// outcome: someone lands, reads (or doesn't), and leaves. That made "clicks
// don't convert" a single opaque fact instead of a locatable leak.
//
// So these events deliberately measure ATTENTION, not intent:
//   page_view_start   — landed, with where they came from
//   scroll_depth      — 25/50/75/100%, once each
//   section_seen      — the named sections that carry the actual argument
//   dwell             — bucketed time on page, fired on the way out
//   video_play        — the demo video is the strongest asset; did anyone hit play
//
// Fires at most once per event per page load (the `fired` set): Vercel's
// free tier counts events, and a scroll handler that re-fires on every pixel
// would both blow the quota and make the numbers meaningless.
//
// No PII, ever. Bucketed dwell rather than raw seconds, no scroll positions,
// no identifiers — this answers "which step loses people", which needs
// aggregates, not individuals.

const fired = new Set();

function send(name, props) {
  try {
    track(name, props);
  } catch {
    // Analytics must never break the page. A blocked/failed tracker is a
    // missing datapoint, not a broken site.
  }
}

/** Vercel's <Analytics> component creates window.vaq when IT mounts, and a
 *  track() call made before that exists is silently dropped. Anything fired
 *  from a page's own mount effect therefore races it — page_view_start, the
 *  event every funnel rate is a denominator of, lost that race every time
 *  (caught in preview: scroll_* events queued, page_view_start never did).
 *  Waits for the queue rather than assuming it, and gives up after ~3s so a
 *  visitor with analytics blocked doesn't leave a poller running. */
function sendWhenReady(name, props) {
  let tries = 0;
  const attempt = () => {
    if (typeof window !== "undefined" && window.vaq) return send(name, props);
    if (++tries > 30) return;
    setTimeout(attempt, 100);
  };
  attempt();
}

function once(name, props, waitForQueue = false) {
  if (fired.has(name)) return;
  fired.add(name);
  if (waitForQueue) sendWhenReady(name, props);
  else send(name, props);
}

/** Bucketed so the aggregate is readable at low traffic: at ~50 visitors a
 *  month, a histogram of raw seconds says nothing, but "how many bounced
 *  under 5s vs read for a minute" is answerable. */
function dwellBucket(ms) {
  const s = Math.round(ms / 1000);
  if (s < 5) return "0-5s";
  if (s < 15) return "5-15s";
  if (s < 45) return "15-45s";
  if (s < 120) return "45-120s";
  return "120s+";
}

/** Where the visitor came from, coarsely. Cold-email clicks carry ?cid=,
 *  which is the population this whole instrument exists to understand;
 *  everything else is bucketed rather than recorded verbatim so this never
 *  becomes a log of individual referrer URLs. */
function source() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("cid")) return "cold_email";
  if (params.get("utm_source")) return `utm:${params.get("utm_source")}`;
  const ref = document.referrer;
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return "internal";
    if (/google|bing|duckduckgo|yahoo/.test(host)) return "search";
    return "referral";
  } catch {
    return "unknown";
  }
}

/**
 * Attaches the listeners for one page. Returns a cleanup function for
 * React's effect teardown — without it, a client-side route change would
 * leave the previous page's scroll/visibility handlers attached and firing.
 *
 * @param {string} page short page label, e.g. "home" | "support_agent"
 */
export function trackEngagement(page) {
  const started = Date.now();
  once("page_view_start", { page, source: source() }, true);

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = Math.round((window.scrollY / scrollable) * 100);
    for (const mark of [25, 50, 75, 100]) {
      if (pct >= mark) once(`scroll_${mark}`, { page });
    }
  };

  // Passive: this runs on every scroll frame, and a non-passive listener on
  // scroll blocks the main thread enough to be felt on mobile.
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // a short viewport may already satisfy 100% at load

  // Dwell on the way out. visibilitychange (not beforeunload) because
  // beforeunload is unreliable on mobile Safari, where a tab switch is the
  // normal way a session ends.
  const onHide = () => {
    if (document.visibilityState === "hidden") {
      once("dwell", { page, bucket: dwellBucket(Date.now() - started) });
    }
  };
  document.addEventListener("visibilitychange", onHide);

  return () => {
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onHide);
  };
}

/**
 * Marks one named section as seen when it enters the viewport. Applied only
 * to sections that carry a real argument (proof, pricing, the demo), so the
 * event list stays a story about persuasion rather than a firehose of every
 * div on the page.
 */
export function observeSection(node, name, page) {
  if (!node || typeof IntersectionObserver === "undefined") return () => {};
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        once(`section_${name}`, { page });
        observer.disconnect();
      }
    },
    { threshold: 0.4 }
  );
  observer.observe(node);
  return () => observer.disconnect();
}

/** Hook form: attaches to a ref'd element for the life of the component. */
export function useSectionTracking(ref, name, page) {
  if (typeof window === "undefined") return;
  return () => observeSection(ref.current, name, page);
}
