import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { Zap, Wrench, Snowflake, Hammer, Paintbrush, Leaf, Sparkles, Truck, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import GradientBackground from "@/components/GradientBackground";

// The missing piece flagged in chat: "its so incomplete and barebones" —
// BusinessPage.jsx (/pro/:uid) existed but nothing linked TO it unless
// someone already had the exact URL. This is that link: a public
// directory of every contractor who opted into a business page (see
// firestore.rules "marketplacePublicProfiles", public read by design).
const TRADE_ICONS = {
  electrical: Zap,
  plumbing: Wrench,
  hvac: Snowflake,
  handyman: Hammer,
  painting: Paintbrush,
  landscaping: Leaf,
  cleaning: Sparkles,
  movingHauling: Truck,
  other: MoreHorizontal,
};

const TRADE_LABELS = {
  electrical: "Electrical",
  plumbing: "Plumbing",
  hvac: "HVAC",
  handyman: "Handyman",
  painting: "Painting",
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  movingHauling: "Moving / hauling",
  other: "Other",
};

export default function ProsDirectory() {
  const [pros, setPros] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getDocs(query(collection(db, "marketplacePublicProfiles"), orderBy("updatedAt", "desc"), limit(100)))
      .then((snap) => setPros(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => setError(err.message || "Couldn't load pros."));
  }, []);

  const trades = pros ? [...new Set(pros.map((p) => p.trade).filter(Boolean))] : [];
  const visible = filter === "all" ? pros : pros?.filter((p) => p.trade === filter);

  return (
    <div className="mx-auto min-h-screen max-w-lg space-y-3 px-4 py-6">
      <GradientBackground variant="hero" />
      <div className="flex items-center justify-between">
        <Link to="/find-a-pro" className="text-sm font-medium">
          ← Find a Pro
        </Link>
        <Link to="/account" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          My account
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Pros in Perth Amboy</h1>

      {trades.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === "all" ? "bg-black text-white" : "bg-white text-muted-foreground ring-1 ring-black/5"
            }`}
          >
            All
          </button>
          {trades.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filter === t ? "bg-black text-white" : "bg-white text-muted-foreground ring-1 ring-black/5"
              }`}
            >
              {TRADE_LABELS[t] || t}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {pros === null && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
      {pros && pros.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No public business pages yet — contractors can add one from their account.
        </p>
      )}

      <div className="space-y-2">
        {visible?.map((pro) => {
          const Icon = TRADE_ICONS[pro.trade] || MoreHorizontal;
          return (
            <Link key={pro.id} to={`/pro/${pro.id}`}>
              <Card className="rounded-2xl border-0 bg-white shadow-md ring-1 ring-black/5 transition-transform hover:scale-[1.01]">
                <CardContent className="flex items-center gap-3 p-3">
                  {pro.photoURL ? (
                    <img src={pro.photoURL} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pro.businessName || pro.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {TRADE_LABELS[pro.trade] || pro.trade} · {pro.serviceArea || "Perth Amboy"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
