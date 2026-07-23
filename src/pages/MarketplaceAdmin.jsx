import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMarketplaceSubmissions } from "@/lib/firebase";

// Not linked from any nav — reachable only by typing /marketplace-admin
// directly. Real access control is server-side (getMarketplaceSubmissions
// is locked to one account by email — see functions/index.js), so this is
// the working list you'd use to actually call/text people and broker a
// match by hand, per the concierge MVP plan.
function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MarketplaceAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketplaceSubmissions()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || "Couldn't load submissions."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="p-6 text-sm text-destructive">{error}</p>;
  if (!data) return null;

  const { leads, contractors } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-lg font-semibold">Perth Amboy — Find a Pro</h1>
      <p className="text-sm text-muted-foreground">
        Manual matchmaking list. Call/text a homeowner's request to a matching contractor below.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Job requests ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leads.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{lead.name}</span>
                <Badge variant="secondary">{lead.trade}</Badge>
              </div>
              <p className="text-muted-foreground">{lead.phone} {lead.email && `· ${lead.email}`}</p>
              {lead.address && <p className="text-muted-foreground">{lead.address}</p>}
              {lead.description && <p className="mt-1">{lead.description}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{fmt(lead.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contractor signups ({contractors.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contractors.length === 0 && <p className="text-sm text-muted-foreground">No signups yet.</p>}
          {contractors.map((c) => (
            <div key={c.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.name}</span>
                <Badge variant="secondary">{c.trade}</Badge>
              </div>
              <p className="text-muted-foreground">{c.phone} {c.email && `· ${c.email}`}</p>
              <p className="text-muted-foreground">{c.serviceArea}</p>
              {c.licensed && c.licensed !== "n/a" && (
                <p className="text-xs">
                  Licensed: {c.licensed}{c.licenseNumber ? ` (#${c.licenseNumber})` : ""}
                </p>
              )}
              {c.notes && <p className="mt-1">{c.notes}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{fmt(c.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
