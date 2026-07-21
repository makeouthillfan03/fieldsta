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
import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { auth, db, logout, sendPhoneVerificationCode, confirmPhoneVerificationCode } from "@/lib/firebase";

// Purely informational — not used to gate signup or change pricing. Lets us
// see, over time, what mix of trades and company sizes are actually signing
// up (e.g. how much of the base is HVAC vs general contracting), so we can
// prioritize trade-specific features and content instead of guessing. See
// Team page discussion in chat — this mirrors the "what trade are you in"
// question competitors ask during sales-assisted demo requests, but here
// it's a lightweight, skippable field on self-serve signup instead of a
// lead-qualification gate.
const TRADE_OPTIONS = [
  "hvac",
  "plumbing",
  "electrical",
  "generalContracting",
  "roofing",
  "landscaping",
  "handyman",
  "other",
];
const TEAM_SIZE_OPTIONS = ["justMe", "2to5", "6to15", "16plus"];

export default function CompanySetup() {
  const { user, companyLoading, needsCompany } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [companyName, setCompanyName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [trade, setTrade] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [mode, setMode] = useState("create"); // "create" | "join"

  // Real barrier to entry: a company can't be created (or joined) until the
  // signed-in Google account also has a verified phone number linked to it.
  // Costs a few seconds and a real SMS, which a throwaway/fake signup won't
  // bother with — and it doubles as the "who is who" phone record the owner
  // wanted on every account. See lib/firebase.js "Phone verification".
  const [phoneVerified, setPhoneVerified] = useState(!!auth.currentUser?.phoneNumber);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  if (!companyLoading && !needsCompany) return <Navigate to="/" replace />;

  function toE164(raw) {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    // Assume US/Canada if no country code was given — matches the primary
    // launch market; contractors outside it can type their own "+" prefix.
    return `+1${digits.replace(/\D/g, "")}`;
  }

  async function handleSendCode(e) {
    e.preventDefault();
    const formatted = toE164(phone);
    if (formatted.replace(/\D/g, "").length < 11) {
      setPhoneError(t("companySetup.phoneInvalid") || "Enter a valid phone number.");
      return;
    }
    setPhoneBusy(true);
    setPhoneError("");
    try {
      const result = await sendPhoneVerificationCode(formatted);
      setConfirmation(result);
    } catch (err) {
      setPhoneError(
        err.code === "auth/too-many-requests"
          ? "Too many attempts — wait a bit and try again."
          : err.code === "auth/invalid-phone-number"
          ? "That phone number doesn't look right."
          : err.message || "Couldn't send a code. Try again."
      );
    } finally {
      setPhoneBusy(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!confirmation || !otp.trim()) return;
    setPhoneBusy(true);
    setPhoneError("");
    try {
      await confirmPhoneVerificationCode(confirmation, otp.trim());
      setPhoneVerified(true);
    } catch (err) {
      setPhoneError(
        err.code === "auth/invalid-verification-code"
          ? "That code isn't right — check it and try again."
          : err.code === "auth/code-expired"
          ? "That code expired — request a new one."
          : err.message || "Couldn't verify that code."
      );
    } finally {
      setPhoneBusy(false);
    }
  }

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

      // Referral link (?ref=<companyId>), stashed in localStorage back on
      // Welcome/Login since it wouldn't otherwise survive the Google OAuth
      // redirect round-trip. Not validated here — a new user has no
      // company yet, so security rules won't even let them read an
      // arbitrary company doc to check it exists. Trusting the format is
      // fine: the referral only ever pays out via the Stripe webhook (Admin
      // SDK, see functions/index.js), which checks the referrer is real
      // before crediting anything, so a stale/bogus code just quietly does
      // nothing instead of blocking signup.
      const refCompanyId = localStorage.getItem("fieldsta_ref");
      localStorage.removeItem("fieldsta_ref");
      const referredBy = refCompanyId && refCompanyId !== "undefined" ? refCompanyId : null;

      const companyRef = doc(collection(db, "companies"));
      const trialEndsAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const companyDoc = {
        name: companyName.trim(),
        ownerUid: user.uid,
        ownerPhone: auth.currentUser?.phoneNumber || null,
        ...(referredBy ? { referredBy } : {}),
        createdAt: serverTimestamp(),
        // New companies start on a 7-day free trial, UNLESS a valid access
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
        // Optional, self-reported, never shown back to the user or used to
        // gate anything — just internal signal on who's signing up.
        ...(trade ? { trade } : {}),
        ...(teamSize ? { teamSize } : {}),
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
        phone: auth.currentUser?.phoneNumber || null,
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
        phone: auth.currentUser?.phoneNumber || null,
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

        <div id="recaptcha-container" />

        <Card className="shadow-sm">
          <CardContent className="space-y-4 p-5">
            {!phoneVerified ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {t("companySetup.phoneVerifyTitle") || "Verify your phone to continue"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("companySetup.phoneVerifySubtitle") ||
                    "One quick step before you can create or join a company — we'll text you a 6-digit code."}
                </p>

                {!confirmation ? (
                  <form onSubmit={handleSendCode} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="phone">{t("common.phone") || "Phone number"}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
                    <Button type="submit" className="w-full" disabled={phoneBusy}>
                      {phoneBusy
                        ? t("companySetup.sendingCode") || "Sending code…"
                        : t("companySetup.sendCode") || "Text me a code"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="otp">{t("companySetup.enterCode") || "Enter the 6-digit code"}</Label>
                      <Input
                        id="otp"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                    {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
                    <Button type="submit" className="w-full" disabled={phoneBusy}>
                      {phoneBusy ? t("companySetup.verifying") || "Verifying…" : t("companySetup.verify") || "Verify"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmation(null);
                        setOtp("");
                        setPhoneError("");
                      }}
                      className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                    >
                      {t("companySetup.useDifferentNumber") || "Use a different number"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="trade">{t("companySetup.trade") || "Trade (optional)"}</Label>
                    <Select id="trade" value={trade} onChange={(e) => setTrade(e.target.value)}>
                      <option value="">{t("companySetup.tradeChoose") || "Prefer not to say"}</option>
                      {TRADE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {t(`companySetup.trade.${opt}`) || opt}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="teamSize">{t("companySetup.teamSize") || "Team size (optional)"}</Label>
                    <Select id="teamSize" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                      <option value="">{t("companySetup.teamSizeChoose") || "Prefer not to say"}</option>
                      {TEAM_SIZE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {t(`companySetup.teamSize.${opt}`) || opt}
                        </option>
                      ))}
                    </Select>
                  </div>
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
              </>
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
