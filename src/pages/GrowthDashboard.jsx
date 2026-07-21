import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGrowthStats } from "@/lib/firebase";

// Not linked from any nav — reachable only by typing /growth directly. Real
// access control is server-side (see functions/index.js getGrowthStats,
// locked to one account by email), so there's nothing sensitive exposed by
// the route existing; it just quietly errors for anyone else who finds it.
const TRADE_LABELS = {
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  generalContracting: "General contracting",
  roofing: "Roofing",
  landscaping: "Landscaping",
  handyman: "Handyman",
  other: "Other",
  unspecified: "Not given",
};

const TEAM_SIZE_LABELS = {
  justMe: "Just me",
  "2to5": "2-5 people",
  "6to15": "6-15 people",
  "16plus": "16+ people",
  unspecified: "Not given",
};

function Bar({ label, count, max }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function GrowthDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGrowthStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message || "Couldn't load stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="p-6 text-sm text-destructive">{error}</p>;
  if (!stats) return null;

  const { total, byDay, byTrade, byTeamSize, welcomeVisits } = stats;

  const last30 = Object.entries(byDay || {})
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-30);
  const maxDay = Math.max(1, ...last30.map(([, n]) => n));

  const tradeEntries = Object.entries(byTrade || {}).sort(([, a], [, b]) => b - a);
  const maxTrade = Math.max(1, ...tradeEntries.map(([, n]) => n));

  const teamSizeEntries = Object.entries(byTeamSize || {}).sort(([, a], [, b]) => b - a);
  const maxTeamSize = Math.max(1, ...teamSizeEntries.map(([, n]) => n));

  const visitToSignup = welcomeVisits > 0 ? ((total / welcomeVisits) * 100).toFixed(1) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-lg font-semibold">Growth</h1>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{total}</p>
            <p className="text-xs text-muted-foreground">Companies signed up</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{welcomeVisits}</p>
            <p className="text-xs text-muted-foreground">Welcome page visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{visitToSignup != null ? `${visitToSignup}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">Visit → signup</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Signups by day (last 30)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {last30.length === 0 && <p className="text-sm text-muted-foreground">No signups yet.</p>}
          {last30.map(([day, count]) => (
            <Bar key={day} label={day} count={count} max={maxDay} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Trade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tradeEntries.map(([key, count]) => (
            <Bar key={key} label={TRADE_LABELS[key] || key} count={count} max={maxTrade} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Team size</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {teamSizeEntries.map(([key, count]) => (
            <Bar key={key} label={TEAM_SIZE_LABELS[key] || key} count={count} max={maxTeamSize} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
