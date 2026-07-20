import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [companyId, setCompanyId] = useState(null);
  const [role, setRole] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setCompanyId(null);
        setRole(null);
        setCompanyLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    setCompanyLoading(true);
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCompanyId(data.companyId || null);
          setRole(data.role || null);
        } else {
          setCompanyId(null);
          setRole(null);
        }
        setCompanyLoading(false);
      },
      () => {
        setCompanyId(null);
        setRole(null);
        setCompanyLoading(false);
      }
    );
    return unsub;
  }, [user]);

  // Track the company doc itself (not just companyId/role) so we can gate
  // access on subscription/trial/comp status. Kept separate from the
  // users/{uid} listener above since companyId can change independently.
  useEffect(() => {
    if (!companyId) {
      setCompany(null);
      setPlanLoading(false);
      return;
    }
    setPlanLoading(true);
    const unsub = onSnapshot(
      doc(db, "companies", companyId),
      (snap) => {
        setCompany(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setPlanLoading(false);
      },
      () => {
        setCompany(null);
        setPlanLoading(false);
      }
    );
    return unsub;
  }, [companyId]);

  const isAdmin = role === "owner" || role === "admin";
  const needsCompany = !!user && !companyLoading && !companyId;

  // A company has access to the app if: comped (free forever), an active
  // paid subscription, or still inside its 3-day trial window. Anything
  // else (trial expired, canceled, past_due) blocks access and routes to
  // /billing. Companies created before this feature shipped have no `plan`
  // field at all — treat that as "trial" so nobody already using the app
  // gets locked out unexpectedly; the trial clock only starts once someone
  // actually visits (see CompanySetup for new companies, which set it
  // explicitly at creation time).
  const trialEndsAtMs = company?.trialEndsAt?.toMillis
    ? company.trialEndsAt.toMillis()
    : company?.trialEndsAt
    ? new Date(company.trialEndsAt).getTime()
    : null;
  const plan = company?.plan || (company ? "trial" : null);
  const planActive =
    plan === "comped" ||
    plan === "active" ||
    (plan === "trial" && (!trialEndsAtMs || trialEndsAtMs > Date.now()));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        companyId,
        role,
        companyLoading,
        needsCompany,
        isAdmin,
        company,
        plan,
        planActive,
        planLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
