import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DemoLanding from "@/pages/DemoLanding";
import LiveDemo from "@/pages/LiveDemo";
import ProductsPage from "@/pages/ProductsPage";
import GetStarted from "@/pages/GetStarted";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Agreement from "@/pages/Agreement";

// fieldsta.com/login used to be a Google/Firebase sign-in page for the old
// HVAC-marketplace pivot -- unconnected to how real customers actually log
// in today (email+password, created at checkout, on studio.fieldsta.com's
// own account system). Rather than fix a sign-in flow nobody uses, this
// sends anyone who lands here straight to the real one. window.location
// (not <Navigate>) because studio.fieldsta.com is a different origin --
// react-router can't route there.
function RedirectToStudioLogin() {
  useEffect(() => {
    window.location.replace("https://studio.fieldsta.com/login");
  }, []);
  return null;
}

// ---------------------------------------------------------------------
// The old Fieldsta HVAC/general-contractor SaaS tool (Dashboard, jobs,
// customers, dispatch, technicians, price book, estimates, billing/paywall,
// booking requests, the AI assistant, etc.) is intentionally no longer
// routed here — see chat: "no one is using regular fieldsta, just replace
// it completely and remove the fees." Every one of those page files is
// still sitting untouched in src/pages/, and functions/index.js and
// firestore.rules still have all their backing logic — nothing was
// deleted, it's just not live. If this ever needs to come back, it's a
// routing change here, not a rebuild.
//
// The Find a Pro marketplace concierge MVP (Perth Amboy pilot) has been
// unrouted the same way — see chat: "remove the findapro and perth amboy
// and marketplace everything." FindAPro.jsx, MarketplaceAdmin.jsx,
// BusinessPage.jsx, ProsDirectory.jsx, OpenJobs.jsx, ProfileSetup.jsx,
// Account.jsx, and CompanySetup.jsx are all still sitting untouched in
// src/pages/, and their backing Cloud Functions + Firestore rules are
// untouched too — nothing was deleted, it's just not reachable. Bringing
// any of it back is a routing change here, not a rebuild.
//
// With /growth unrouted (see below), nothing here imports Firebase auth
// any more — AuthContext, RequireAuthOnly and GrowthDashboard are all
// still in the tree, just unreachable, like the rest of the pivot pages.
//
// "/" is now the demo-request landing page (DemoLanding.jsx), ported over
// from the standalone fieldsta-lead-booker Vercel project, which was a
// deploy that wasn't supposed to exist as its own project — this app is
// the one and only place Fieldsta's HTML should live. The lead form posts
// to api/lead.js, which pushes qualified leads into Apollo.
// ---------------------------------------------------------------------

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DemoLanding />} />
      {/* Splat so /try/running and /try/completed keep the same element at
          the same position -- React Router reuses the instance, so the demo
          does not remount and lose its result mid-run. The nested paths exist
          purely so an engaged session registers: Vercel Analytics fires a
          pageview on pathname changes only, never on a search-param change,
          so the ?step= marker this used to set was invisible to it. */}
      <Route path="/try/*" element={<LiveDemo />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/get-started" element={<GetStarted />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/agreement" element={<Agreement />} />
      <Route path="/login" element={<RedirectToStudioLogin />} />

      {/* /growth removed 2026-08-10. It polled studio.fieldsta.com's
          /api/pipeline-progress cross-origin, and being cross-origin meant
          that endpoint could not require a session cookie -- so it was
          public, and its response embeds prospect-growth's live log,
          i.e. the literal Apollo queries that make up the target segment
          list. This page was a duplicate of /outbound/campaign in the
          dashboard, which shows the same growth status, is same-origin so
          the session cookie works, and also carries the generate-prospects
          control this page never had. GrowthDashboard.jsx is left in place
          like the other unrouted pages here. */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
