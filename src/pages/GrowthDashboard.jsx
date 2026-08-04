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
  const [pipeline, setPipeline] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getGrowthStats().then((res) => setStats(res.data)),
      fetch("https://studio.fieldsta.com/api/pipeline-progress")
        .then((r) => r.json())
        .then((d) => setPipeline(d))
        .catch(() => {}),
    ])
      .catch((err) => setError(err.message || "Couldn't load stats."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!pipeline?.growth?.running && !pipeline?.tailor?.running) return;
    const timer = setInterval(() => {
      fetch("https://studio.fieldsta.com/api/pipeline-progress")
        .then((r) => r.json())
        .then((d) => setPipeline(d))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [pipeline?.growth?.running, pipeline?.tailor?.running]);

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

      {pipeline && (
        <>
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-sm">Prospect Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipeline.growth && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Discovery (Apollo)</span>
                    <span className="text-muted-foreground">
                      {pipeline.growth.totalAdded}/{pipeline.growth.targetNew} added
                    </span>
                  </div>
                  {pipeline.growth.running && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Iteration {pipeline.growth.iteration}/{pipeline.growth.maxIterations}
                    </div>
                  )}
                  {!pipeline.growth.running && pipeline.growth.totalAdded >= pipeline.growth.targetNew && (
                    <p className="text-xs text-green-600">✓ Target reached</p>
                  )}
                  {!pipeline.growth.running && pipeline.growth.totalAdded < pipeline.growth.targetNew && (
                    <p className="text-xs text-amber-600">
                      {pipeline.growth.error ? `Error: ${pipeline.growth.error}` : "Finished short"}
                    </p>
                  )}
                </div>
              )}

              {pipeline.tailor && (
                <div className="space-y-2 border-t border-amber-200 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Hook Writer</span>
                    <span className="text-muted-foreground">
                      {pipeline.tailor.withHook} tailored, {pipeline.tailor.withoutHook} pending
                    </span>
                  </div>
                  {pipeline.tailor.running && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      {pipeline.tailor.processed} / {pipeline.tailor.processed + pipeline.tailor.withoutHook}
                    </div>
                  )}
                  {!pipeline.tailor.running && pipeline.tailor.withHook > 0 && (
                    <p className="text-xs text-green-600">✓ {pipeline.tailor.fitConcerns} fit concerns flagged</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

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
