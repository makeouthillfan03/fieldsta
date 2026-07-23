import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { db, logout } from "@/lib/firebase";

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

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Fieldsta</span>
        <button type="button" onClick={logout} className="text-xs font-medium text-muted-foreground">
          Sign out
        </button>
      </div>

      {profile && (
        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.phone}</p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {profile.roles}
            </Badge>
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
