import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import CompanySetup from "@/pages/CompanySetup";
import GrowthDashboard from "@/pages/GrowthDashboard";
import FindAPro from "@/pages/FindAPro";
import MarketplaceAdmin from "@/pages/MarketplaceAdmin";

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
// The live site is now just the Find a Pro marketplace concierge MVP
// (Perth Amboy pilot, see FindAPro.jsx/MarketplaceAdmin.jsx) — free for
// both homeowners and contractors, no subscription/billing anywhere.
// ---------------------------------------------------------------------

// The owner-only pages (growth stats, marketplace matchmaking list) only
// need "is this a signed-in Google account," full stop — the real access
// control happens server-side in the Cloud Functions themselves (locked to
// one email, see functions/index.js). No company/plan check anymore since
// there's no paywall left to gate.
function RequireAuthOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FindAPro />} />
      <Route path="/welcome" element={<FindAPro />} />
      <Route path="/find-a-pro" element={<FindAPro />} />
      <Route path="/login" element={<Login />} />

      {/* Kept around only so a signed-in owner without a companies/{id} doc
          yet doesn't get stuck — not part of the live product anymore. */}
      <Route
        path="/setup-company"
        element={
          <RequireAuthOnly>
            <CompanySetup />
          </RequireAuthOnly>
        }
      />

      <Route
        path="/growth"
        element={
          <RequireAuthOnly>
            <GrowthDashboard />
          </RequireAuthOnly>
        }
      />
      <Route
        path="/marketplace-admin"
        element={
          <RequireAuthOnly>
            <MarketplaceAdmin />
          </RequireAuthOnly>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
