import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, serverTimestamp, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { db, logout } from "@/lib/firebase";

const ROLE_OPTIONS = [
  { value: "client", label: "I need work done" },
  { value: "contractor", label: "I do the work" },
  { value: "both", label: "Both" },
];

const TRADE_OPTIONS = [
  "electrical",
  "plumbing",
  "hvac",
  "handyman",
  "painting",
  "landscaping",
  "cleaning",
  "movingHauling",
];

// The real "profile + history" surface — see chat: "make it so i can make
// a profile... as well as seeing my history requests payments etc,
// everything that i need that uber or thumbtack usually has." Payments
// specifically are called out honestly below as not built yet: taking
// real marketplace payments (escrow/Stripe Connect payouts to
// contractors) is a bigger project than this pass covers, and I don't
// want to fake a number here that isn't real. Named Account.jsx (not
// Dashboard.jsx) on purpose — Dashboard.jsx is the old, retired SaaS
// tool's page and is being left untouched in memory.
function fmt(ts) {
  const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Account() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myLeads, setMyLeads] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!user) return;
    async function load() {
      const profSnap = await getDoc(doc(db, "marketplaceProfiles", user.uid));
      setProfile(profSnap.exists() ? profSnap.data() : null);

      const leadsSnap = await getDocs(
        query(collection(db, "marketplaceLeads"), where("uid", "==", user.uid), orderBy("createdAt", "desc"))
      );
      setMyLeads(leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const bidsSnap = await getDocs(
        query(collection(db, "marketplaceBids"), where("contractorUid", "==", user.uid), orderBy("createdAt", "desc"))
      );
      setMyBids(bidsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoadingData(false);
    }
    load();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!loadingData && !profile) return <Navigate to="/profile-setup" replace />;

  const roles = profile?.roles;
  const showClientHistory = roles === "client" || roles === "both";
  const showContractorHistory = roles === "contractor" || roles === "both";
  const editIsContractor = editForm && (editForm.roles === "contractor" || editForm.roles === "both");

  // Lets someone change whether they need work done, do the work, or both
  // — see chat: "add an option to be able to add or change if u do the
  // work or if u need the work or both in ur profile." "Both" already
  // covers wanting a single profile that's both a homeowner and a
  // contractor at once — no separate document needed, just this one
  // field, same as ProfileSetup.jsx uses when the profile is first
  // created.
  function startEditing() {
    setEditForm({
      name: profile.name || "",
      phone: profile.phone || "",
      roles: profile.roles || "client",
      trade: profile.trade || "handyman",
    });
    setSaveError("");
    setEditing(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.phone.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const isContractor = editForm.roles === "contractor" || editForm.roles === "both";
      const updated = {
        ...profile,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        roles: editForm.roles,
        trade: isContractor ? editForm.trade : null,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "marketplaceProfiles", user.uid), updated, { merge: true });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || "Couldn't save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Fieldsta</span>
        <button type="button" onClick={logout} className="text-xs font-medium text-muted-foreground">
          Sign out
        </button>
      </div>

      {profile && !editing && (
        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.phone}</p>
              {profile.trade && (roles === "contractor" || roles === "both") && (
                <p className="text-xs capitalize text-muted-foreground">{profile.trade}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {profile.roles}
              </Badge>
              <Button type="button" size="sm" variant="outline" onClick={startEditing}>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {profile && editing && (
        <Card className="border-border/60">
          <CardContent className="p-4">
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>I am</Label>
                <div className="flex gap-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, roles: opt.value }))}
                      className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium ${
                        editForm.roles === opt.value ? "border-black bg-black text-white" : "border-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="editName">Name</Label>
                  <Input
                    id="editName"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editPhone">Phone</Label>
                  <Input
                    id="editPhone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
              {editIsContractor && (
                <div className="space-y-1">
                  <Label htmlFor="editTrade">Trade</Label>
                  <select
                    id="editTrade"
                    value={editForm.trade}
                    onChange={(e) => setEditForm((f) => ({ ...f, trade: e.target.value }))}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    {TRADE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-black text-white hover:bg-black/90" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loadingData && <p className="text-sm text-muted-foreground">Loading…</p>}

      {showClientHistory && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm">My requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myLeads.length === 0 && <p className="text-sm text-muted-foreground">Nothing posted yet.</p>}
            {myLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <div>
                  <p className="font-medium">{lead.description || lead.trade}</p>
                  <p className="text-xs text-muted-foreground">{fmt(lead.createdAt)}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {lead.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showContractorHistory && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm">My bids</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myBids.length === 0 && <p className="text-sm text-muted-foreground">No bids yet.</p>}
            {myBids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <span>{bid.leadId.slice(0, 6)}</span>
                <span className="font-medium">${bid.amount}</span>
                <span className="text-xs text-muted-foreground">{fmt(bid.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed border-border/60 bg-muted/20">
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          Payments aren't built yet — for now, pay/get paid directly once you're matched. Real
          in-app payments are a bigger piece we'll add once matching is proven out.
        </CardContent>
      </Card>
    </div>
  );
}
