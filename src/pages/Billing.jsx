import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { CheckCircle2, CreditCard, Gift, Clock, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { db, requestSubscriptionCheckout } from "@/lib/firebase";

function daysLeft(trialEndsAt) {
  const ms = trialEndsAt?.toMillis ? trialEndsAt.toMillis() : trialEndsAt ? new Date(trialEndsAt).getTime() : null;
  if (!ms) return null;
  return Math.max(0, Math.ceil((ms - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function Billing() {
  const { companyId, isAdmin, company, plan, planActive } = useAuth();
  const { t } = useLanguage();
  const [seatCount, setSeatCount] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "users"), where("companyId", "==", companyId));
    const unsub = onSnapshot(q, (snap) => setSeatCount(snap.size));
    return unsub;
  }, [companyId]);

  const extraSeats = seatCount != null ? Math.max(0, seatCount - 2) : null;
  const trialDaysLeft = daysLeft(company?.trialEndsAt);

  async function handleUpgrade() {
    setError("");
    setStarting(true);
    try {
      const res = await requestSubscriptionCheckout();
      const url = res?.data?.url;
      if (url) window.location.href = url;
      else setError(t("billing.checkoutError") || "Couldn't start checkout. Try again.");
    } catch (err) {
      setError(err.message || t("billing.checkoutError") || "Couldn't start checkout. Try again.");
    } finally {
      setStarting(false);
    }
  }

  async function handleRedeemCode(e) {
    e.preventDefault();
    const code = accessCode.trim().toUpperCase();
    if (!code || !companyId) return;
    setRedeemError("");
    setRedeeming(true);
    try {
      const codeSnap = await getDoc(doc(db, "accessCodes", code));
      if (!codeSnap.exists() || codeSnap.data().active !== true) {
        setRedeemError(t("billing.invalidAccessCode") || "That access code isn't valid or has already been used.");
        return;
      }
      await updateDoc(doc(db, "companies", companyId), {
        plan: "comped",
        accessCodeUsed: code,
      });
      try {
        await updateDoc(doc(db, "accessCodes", code), { active: false, usedByCompanyId: companyId });
      } catch {
        // ignore — company is already comped, this is just bookkeeping
      }
      setRedeemSuccess(true);
      setAccessCode("");
    } catch (err) {
      setRedeemError(
        err.code === "permission-denied"
          ? t("billing.accessCodeNotEligible") ||
              "This account isn't eligible to redeem a code (only accounts still on a trial can)."
          : err.message || t("billing.invalidAccessCode") || "That access code isn't valid or has already been used."
      );
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">{t("billing.title") || "Billing"}</h1>

      {plan === "comped" && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t("billing.compedTitle") || "You have free access"}</p>
              <p className="text-sm text-muted-foreground">
                {t("billing.compedBody") ||
                  "This account (and your whole team) has been given free access to Fieldsta. No payment needed."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {plan === "active" && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t("billing.activeTitle") || "Subscription active"}</p>
              <p className="text-sm text-muted-foreground">
                {t("billing.activeBody") || "Thanks for subscribing to Fieldsta."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {plan === "trial" && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">
                {trialDaysLeft != null
                  ? (t("billing.trialTitle", { days: trialDaysLeft }) || `${trialDaysLeft} days left in your free trial`)
                  : t("billing.trialTitleNoDate") || "You're on a free trial"}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("billing.trialBody") || "Subscribe any time to keep using Fieldsta after your trial ends."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(plan === "past_due" || !planActive) && plan !== "comped" && (
        <Card className="border-destructive/50">
          <CardContent className="p-4">
            <p className="font-medium text-destructive">
              {t("billing.inactiveTitle") || "Your access is currently paused"}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("billing.inactiveBody") || "Subscribe below to restore access for your whole team."}
            </p>
          </CardContent>
        </Card>
      )}

      {plan !== "comped" && isAdmin && (
        <Card>
          <CardContent className="space-y-2 p-4">
            {redeemSuccess ? (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Gift className="h-4 w-4" /> {t("billing.accessCodeApplied") || "Access code applied — you now have free access."}
              </p>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Ticket className="h-4 w-4 text-primary" />
                  {t("billing.haveAccessCode") || "Have an access code?"}
                </p>
                <form onSubmit={handleRedeemCode} className="flex gap-2">
                  <Input
                    placeholder={t("companySetup.accessCodePlaceholder") || "Have a free-access code?"}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                  />
                  <Button type="submit" variant="outline" disabled={redeeming || !accessCode.trim()}>
                    {redeeming ? t("billing.redeeming") || "Applying..." : t("billing.redeem") || "Apply"}
                  </Button>
                </form>
                {redeemError && <p className="text-sm text-destructive">{redeemError}</p>}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {plan !== "comped" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("billing.pricingTitle") || "Pricing"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-medium">{t("billing.basePlan") || "Base plan"}</p>
                <p className="text-sm text-muted-foreground">
                  {t("billing.basePlanDesc") || "Owner + 1 teammate included"}
                </p>
              </div>
              <p className="font-semibold">$49/mo</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-medium">{t("billing.seatPlan") || "Additional teammates"}</p>
                <p className="text-sm text-muted-foreground">
                  {t("billing.seatPlanDesc") || "Per teammate beyond the first 2"}
                </p>
              </div>
              <p className="font-semibold">+$15/mo {t("billing.perSeat") || "each"}</p>
            </div>

            {seatCount != null && (
              <p className="text-sm text-muted-foreground">
                {t("billing.currentTeamSize", { count: seatCount }) ||
                  `Your team: ${seatCount} ${seatCount === 1 ? "person" : "people"}`}
                {extraSeats > 0 &&
                  ` — ${t("billing.estimatedTotal", { total: 49 + extraSeats * 15 }) || `estimated $${49 + extraSeats * 15}/mo`}`}
              </p>
            )}

            {isAdmin ? (
              <Button className="w-full" onClick={handleUpgrade} disabled={starting}>
                <CreditCard className="mr-1.5 h-4 w-4" />
                {starting
                  ? t("billing.starting") || "Starting checkout..."
                  : plan === "active"
                  ? t("billing.manageBilling") || "Manage billing"
                  : t("billing.subscribeButton") || "Subscribe"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("billing.adminOnly") || "Only your company owner or admin can manage billing."}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
