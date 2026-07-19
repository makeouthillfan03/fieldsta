import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { db, logout } from "@/lib/firebase";

export default function CompanySetup() {
  const { user, companyLoading, needsCompany } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [companyName, setCompanyName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [mode, setMode] = useState("create"); // "create" | "join"

  if (!companyLoading && !needsCompany) return <Navigate to="/" replace />;

  async function handleCreate(e) {
    e.preventDefault();
    if (!companyName.trim() || !user) return;
    setSaving(true);
    setError("");
    try {
      // These two writes are done sequentially (not as a batch) on purpose:
      // the security rule that lets a user create their own `users/{uid}`
      // doc with role "owner" needs to look up the company doc's ownerUid,
      // which only works if the company doc is already committed first.
      const code = accessCode.trim().toUpperCase();
      let accessCodeSnap = null;
      if (code) {
        accessCodeSnap = await getDoc(doc(db, "accessCodes", code));
        if (!accessCodeSnap.exists() || accessCodeSnap.data().active !== true) {
          setError(t("companySetup.invalidAccessCode") || "That access code isn't valid or has already been used.");
          setSaving(false);
          return;
        }
      }

      const companyRef = doc(collection(db, "companies"));
      const trialEndsAt = Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const companyDoc = {
        name: companyName.trim(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        // New companies start on a 3-day free trial, UNLESS a valid access
        // code was redeemed, in which case they start "comped" (free)
        // instead. `plan` otherwise only ever changes via the Stripe
        // webhook (payment) or a manual edit in the Firestore console —
        // see AuthContext.planActive for how this gates app access, and
        // firestore.rules for how both paths are locked down server-side.
        plan: code ? "comped" : "trial",
        trialEndsAt,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        ...(code ? { accessCodeUsed: code } : {}),
      };
      // These writes are sequential (not a batch) on purpose — see the
      // note above about rules needing the company doc already committed
      // before dependent checks (the users/{uid} create rule, and here
      // also the accessCodes/{code} spend-check) can see it.
      await setDoc(companyRef, companyDoc);
      await setDoc(doc(db, "users", user.uid), {
        companyId: companyRef.id,
        role: "owner",
        name: user.displayName || "",
        email: (user.email || "").toLowerCase(),
        createdAt: serverTimestamp(),
      });
      if (code) {
        // Spend the code so it can't be reused elsewhere. Not fatal if
        // this fails for some reason — the company is already comped.
        try {
          await updateDoc(doc(db, "accessCodes", code), { active: false, usedByCompanyId: companyRef.id });
        } catch {
          // ignore — company setup already succeeded
        }
      }
    } catch (err) {
      setError(err.message || "Couldn't create your company. Try again.");
      setSaving(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!inviteCode.trim() || !user) return;
    setSaving(true);
    setError("");
    try {
      const email = (user.email || "").toLowerCase();
      const companyId = inviteCode.trim();
      const inviteRef = doc(db, "companies", companyId, "invites", email);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) {
        setError("No pending invite found for your email at that company.");
        setSaving(false);
        return;
      }
      const invite = inviteSnap.data();
      // Create the user doc first (the security rule checks that this
      // invite still exists), then clean up the invite afterward.
      await setDoc(doc(db, "users", user.uid), {
        companyId,
        role: invite.role || "technician",
        name: user.displayName || "",
        email,
        createdAt: serverTimestamp(),
      });
      await deleteDoc(inviteRef);
    } catch (err) {
      setError(
        err.code === "permission-denied"
          ? "That invite code doesn't look right, or you're not on the invite list yet."
          : err.message || "Couldn't join that company. Try again."
      );
      setSaving(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
      <button
        type="button"
        onClick={() => setLang(lang === "en" ? "es" : "en")}
        className="absolute right-4 top-4 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent"
        aria-label="Switch language"
      >
        {t("lang.toggle")}
      </button>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <img src="/mascot.png" alt="" className="h-11 w-11" />
          </div>
          <h1 className="text-xl font-semibold">{t("companySetup.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("companySetup.subtitle")}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex rounded-md border border-border p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("create")}
                className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
                  mode === "create" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t("companySetup.create")}
              </button>
              <button
                type="button"
                onClick={() => setMode("join")}
                className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
                  mode === "join" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t("companySetup.join")}
              </button>
            </div>

            {mode === "create" ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="companyName">{t("companySetup.companyName")}</Label>
                  <Input
                    id="companyName"
                    placeholder={t("companySetup.companyNamePlaceholder")}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="accessCode">
                    {t("companySetup.accessCode") || "Access code (optional)"}
                  </Label>
                  <Input
                    id="accessCode"
                    placeholder={t("companySetup.accessCodePlaceholder") || "Have a free-access code?"}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? t("companySetup.creating") : t("companySetup.createButton")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="inviteCode">{t("companySetup.inviteCode")}</Label>
                  <Input
                    id="inviteCode"
                    placeholder={t("companySetup.inviteCodePlaceholder")}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("companySetup.inviteHelp", { email: user?.email })}
                  </p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? t("companySetup.joining") : t("companySetup.joinButton")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={() => logout()}
          className="mx-auto mt-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> {t("common.signOut")}
        </button>
      </div>
    </div>
  );
}
