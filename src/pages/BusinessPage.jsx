import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Zap, Wrench, Snowflake, Hammer, Paintbrush, Leaf, Sparkles, Truck, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";

// Public contractor business page — see chat: "make a business page if u
// wanted to." Reads from marketplacePublicProfiles/{uid}, a separate
// no-phone/no-email document a contractor opts into from ProfileSetup.jsx
// or Account.jsx (see firestore.rules for why it's a separate doc, not
// just a "public: true" flag on the private profile). Nobody can contact
// this contractor directly from here on purpose — the CTA routes back
// into the normal Fieldsta flow (post a job / browse open jobs) rather
// than exposing a phone number to anyone who finds this URL, consistent
// with how listOpenLeads sanitizes contact info elsewhere.
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
  hvac: "HVAC / heating & cooling",
  handyman: "Handyman",
  painting: "Painting",
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  movingHauling: "Moving / hauling",
  other: "Other",
};

export default function BusinessPage() {
  const { uid } = useParams();
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    getDoc(doc(db, "marketplacePublicProfiles", uid))
      .then((snap) => setProfile(snap.exists() ? snap.data() : null))
      .catch(() => setProfile(null));
  }, [uid]);

  if (profile === undefined) {
    return <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-sm space-y-3 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">This business page doesn't exist or isn't public.</p>
        <Link to="/find-a-pro" className="text-sm font-medium underline underline-offset-2">
          ← Back to Fieldsta
        </Link>
      </div>
    );
  }

  const Icon = TRADE_ICONS[profile.trade] || MoreHorizontal;

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <Link to="/find-a-pro" className="text-xs font-medium text-muted-foreground hover:text-foreground">
        ← Fieldsta
      </Link>

      <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-black/5">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{profile.businessName || profile.name}</h1>
            <p className="text-sm text-muted-foreground">{TRADE_LABELS[profile.trade] || profile.trade}</p>
            <p className="text-xs text-muted-foreground">{profile.serviceArea || "Perth Amboy"}</p>
          </div>
          {profile.bio && <p className="text-sm text-foreground">{profile.bio}</p>}

          <Link to="/find-a-pro" className="w-full">
            <Button className="w-full bg-black text-white hover:bg-black/90">Post a job for this pro</Button>
          </Link>
          <p className="text-[11px] text-muted-foreground">
            Contact happens through Fieldsta, not directly — this keeps things safe for everyone.
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-muted-foreground">
        License/registration status is self-reported and not independently verified by Fieldsta. See{" "}
        <Link to="/terms" className="underline underline-offset-2">
          Terms
        </Link>
        .
      </p>
    </div>
  );
}
