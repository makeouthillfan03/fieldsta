import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DemoLanding from "@/pages/DemoLanding";
import LiveDemo from "@/pages/LiveDemo";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Agreement from "@/pages/Agreement";

// Login and /growth are the only two routes that touch Firebase (auth,
// the growth stats page) -- every other route here is the live product,
// which has nothing to do with it. Lazy-loading these three means
// AuthContext (and therefore the whole firebase package) is only ever
// fetched and executed for someone actually navigating to /login or
// /growth, not bundled into and run for every visitor of the live site.
const AuthProvider = lazy(() =>
  import("@/context/AuthContext").then((m) => ({ default: m.AuthProvider }))
);
const Login = lazy(() => import("@/pages/Login"));
const GrowthDashboard = lazy(() => import("@/pages/GrowthDashboard"));
const RequireAuthOnly = lazy(() => import("@/components/RequireAuthOnly"));

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
// Note: /growth (GrowthDashboard) only reports Find a Pro signup stats, so
// with the marketplace unrouted it'll just show zeros going forward — left
// in place since removing it wasn't asked for, but it has nothing left to
// track. The live "personal dashboard" for actual demo-request leads is
// the separate fieldsta-agents Railway service, not this route.
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
      <Route path="/try" element={<LiveDemo />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/agreement" element={<Agreement />} />
      <Route
        path="/login"
        element={
          <Suspense fallback={null}>
            <AuthProvider>
              <Login />
            </AuthProvider>
          </Suspense>
        }
      />

      <Route
        path="/growth"
        element={
          <Suspense fallback={null}>
            <AuthProvider>
              <RequireAuthOnly>
                <GrowthDashboard />
              </RequireAuthOnly>
            </AuthProvider>
          </Suspense>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
