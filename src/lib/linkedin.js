// LinkedIn conversion tracking.
//
// The Insight Tag in index.html fires pageviews on its own, which is enough
// for retargeting but NOT enough for LinkedIn to optimize toward anything:
// its bidder can only optimize for conversions it's actually told about.
// Without these calls a campaign can only be optimized for clicks, which is
// how you end up buying traffic that reads well in a dashboard and never
// converts.
//
// URL-based conversions can't work here either — /try is an SPA and the
// meaningful moments (example read, demo run, pilot created) don't change
// the URL, so LinkedIn would never see them.
//
// IDs come from env rather than source so they can be set in Vercel without
// a deploy. VITE_LINKEDIN_CONVERSION_ID keeps its original meaning (demo
// completed) — it predates the other three and may already be set.
//
// TO ACTIVATE: in Campaign Manager → Analyze → Conversion tracking, create
// one "Event-specific" conversion per key below, then set the matching env
// var to its numeric ID. Anything unset is simply skipped — no errors, no
// half-tracked state, and the funnel keeps working regardless.
const CONVERSION_IDS = {
  /** Cold/ad visitor read the pre-answered example run. The right PRIMARY
   *  conversion for ad traffic: it's what the ad actually promises, and the
   *  only one a visitor with no lead text in hand can complete. */
  exampleRead: import.meta.env.VITE_LINKEDIN_CONVERSION_EXAMPLE_READ,
  /** Visitor pasted their own lead and ran it live — high intent. */
  demoStarted: import.meta.env.VITE_LINKEDIN_CONVERSION_DEMO_STARTED,
  /** That run finished and they saw the verdict. */
  demoCompleted: import.meta.env.VITE_LINKEDIN_CONVERSION_ID,
  /** Pilot account created on /get-started. The one that's actually revenue. */
  signup: import.meta.env.VITE_LINKEDIN_CONVERSION_SIGNUP,
};

/** Fires one LinkedIn conversion. Safe to call anywhere: no-ops when the ID
 *  isn't configured, when the Insight Tag hasn't loaded yet, or when an ad
 *  blocker removed it. Never throws into a caller — a tracking failure must
 *  not break the funnel it's measuring. */
export function trackLinkedInConversion(key) {
  try {
    const conversionId = CONVERSION_IDS[key];
    if (!conversionId) return;
    if (typeof window === "undefined" || typeof window.lintrk !== "function") return;
    window.lintrk("track", { conversion_id: conversionId });
  } catch {
    /* tracking is never worth an exception */
  }
}
