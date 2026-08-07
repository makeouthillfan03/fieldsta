// Captures ?utm_source / ?utm_campaign / ?ref / ?cid off the URL a visitor
// lands with (e.g. a link in a cold email) and keeps it around for the rest
// of the browser session, so later custom Vercel Analytics events (demo
// started, demo completed) can be tied back to the email that sent them —
// this site is an SPA, so those params are only present on the first
// pageload, not on the /try route the visitor clicks through to next.
const STORAGE_KEY = "fieldsta_attribution";
const PARAM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "ref", "cid"];

export function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const found = {};
  for (const key of PARAM_KEYS) {
    const value = params.get(key);
    if (value) found[key] = value;
  }
  if (Object.keys(found).length > 0) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    return found;
  }
  return getAttribution();
}

export function getAttribution() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

const AGENTS_BASE = import.meta.env.VITE_AGENTS_BASE_URL || "https://studio.fieldsta.com";

// Mirrors the same event to studio.fieldsta.com's campaign dashboard (not
// just Vercel Analytics) so click-through and demo completion show up next
// to the actual prospect record, not only in a separate analytics tool. A
// no-op when there's no cid -- only cold-email-sourced visits are tied to a
// campaign prospect at all, so there's nothing to attach a non-cid visit to.
export function reportFunnelEvent(event, extra = {}) {
  const attribution = getAttribution();
  if (!attribution.cid) return;
  fetch(`${AGENTS_BASE}/api/track/funnel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cid: attribution.cid, event, ...extra }),
    keepalive: true,
  }).catch(() => {});
}
