import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { Copy, Plus, Trash2, X, Check, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { db, redeemReferralCredit } from "@/lib/firebase";
import { currency } from "@/lib/utils";

export default function Team() {
  const { companyId, company } = useAuth();
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("technician");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [bookingLinkCopied, setBookingLinkCopied] = useState(false);
  const [referralLinkCopied, setReferralLinkCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  useEffect(() => {
    if (!companyId) return;
    const membersQuery = query(collection(db, "users"), where("companyId", "==", companyId));
    const unsubMembers = onSnapshot(membersQuery, (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubInvites = onSnapshot(
      collection(db, "companies", companyId, "invites"),
      (snap) => setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubReferrals = onSnapshot(
      collection(db, "companies", companyId, "referrals"),
      (snap) => setReferrals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubMembers();
      unsubInvites();
      unsubReferrals();
    };
  }, [companyId]);

  async function handleRedeemCredit() {
    setRedeeming(true);
    setRedeemError("");
    try {
      await redeemReferralCredit();
    } catch (err) {
      setRedeemError(err.message || "Couldn't redeem your credit. Try again.");
    } finally {
      setRedeeming(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim() || !companyId) return;
    setSaving(true);
    setError("");
    try {
      const email = inviteEmail.trim().toLowerCase();
      await setDoc(doc(db, "companies", companyId, "invites", email), {
        email,
        role: inviteRole,
        createdAt: serverTimestamp(),
      });
      setInviteEmail("");
      setInviteRole("technician");
      setShowInvite(false);
    } catch (err) {
      setError(err.message || "Couldn't send that invite.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveInvite(email) {
    await deleteDoc(doc(db, "companies", companyId, "invites", email));
  }

  function copyCode() {
    navigator.clipboard.writeText(companyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function copyBookingLink() {
    navigator.clipboard.writeText(`${window.location.origin}/book/${companyId}`);
    setBookingLinkCopied(true);
    setTimeout(() => setBookingLinkCopied(false), 1500);
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(`${window.location.origin}/welcome?ref=${companyId}`);
    setReferralLinkCopied(true);
    setTimeout(() => setReferralLinkCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("team.title")}</h1>
        <Button size="sm" onClick={() => setShowInvite(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("team.invite")}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-medium">{t("team.companyCode")}</p>
          <p className="text-xs text-muted-foreground">
            {t("team.companyCodeHelp")}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-xs">
              {companyId}
            </code>
            <Button variant="secondary" size="icon" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-medium">{t("team.bookingLink") || "Online booking link"}</p>
          <p className="text-xs text-muted-foreground">
            {t("team.bookingLinkHelp") ||
              "Share this on your website, Google Business profile, or social media — customers can request an appointment without calling. Requests show up under Booking Requests for you to review."}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-xs">
              {`${window.location.origin}/book/${companyId}`}
            </code>
            <Button variant="secondary" size="icon" onClick={copyBookingLink}>
              {bookingLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Gift className="h-4 w-4 text-primary" />
            {t("team.referralTitle") || "Refer another contractor"}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("team.referralHelp") ||
              "Share your link — when a contractor you refer subscribes to Fieldsta, you get a free month credited automatically."}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-xs">
              {`${window.location.origin}/welcome?ref=${companyId}`}
            </code>
            <Button variant="secondary" size="icon" onClick={copyReferralLink}>
              {referralLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {company?.referralCreditsOwed > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
              <p className="text-xs">
                {t("team.creditsOwed", { count: company.referralCreditsOwed }) ||
                  `${company.referralCreditsOwed} free month${company.referralCreditsOwed === 1 ? "" : "s"} ready to redeem`}
              </p>
              <Button size="sm" onClick={handleRedeemCredit} disabled={redeeming}>
                {redeeming ? t("common.saving") || "Redeeming…" : t("team.redeem") || "Redeem"}
              </Button>
            </div>
          )}
          {redeemError && <p className="text-xs text-destructive">{redeemError}</p>}

          {referrals.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("team.referredCompanies") || "Companies you've referred"}
              </p>
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span>{r.companyName}</span>
                  <span className="text-muted-foreground">
                    {r.creditCents ? currency(r.creditCents / 100) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t("team.members")}</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("team.loading")}</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.name || m.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                    {m.role}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {invites.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t("team.pendingInvites")}</h2>
          <div className="space-y-2">
            {invites.map((inv) => (
              <Card key={inv.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">{inv.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveInvite(inv.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showInvite} onClose={() => setShowInvite(false)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t("team.inviteTitle")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowInvite(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="inviteEmail">{t("common.email")}</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inviteRole">{t("team.role")}</Label>
            <Select id="inviteRole" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              <option value="technician">{t("team.roleTechnician")}</option>
              <option value="admin">{t("team.roleAdmin")}</option>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? t("team.sending") : t("team.sendInvite")}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
