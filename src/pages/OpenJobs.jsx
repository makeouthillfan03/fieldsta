import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Zap, Wrench, Snowflake, Hammer, Paintbrush, Leaf, Sparkles, Truck, MoreHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, listOpenLeads } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import MapView from "@/components/MapView";
import TermsAgreement from "@/components/TermsAgreement";
import GradientBackground from "@/components/GradientBackground";

// Public bidding view — contractors browse open jobs (no PII shown, see
// functions/index.js listOpenLeads) and submit a bid. Minimal by design,
// per chat: "remove any descriptions... less is more, show not tell."
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

export default function OpenJobs() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listOpenLeads()
      .then((res) => setJobs(res.data.leads))
      .catch((err) => setError(err.message || "Couldn't load jobs."));
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-lg space-y-3 px-4 py-6">
      <GradientBackground variant="corner" />
      <div className="flex items-center justify-between">
        <Link to="/find-a-pro" className="text-sm font-medium">
          ← Find a Pro
        </Link>
        <Link to="/account" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          My account
        </Link>
      </div>

      <MapView height={160} />

      {error && <p className="text-sm text-destructive">{error}</p>}
      {jobs === null && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
      {jobs && jobs.length === 0 && <p className="text-sm text-muted-foreground">No open jobs right now.</p>}

      <div className="space-y-2">
        {jobs?.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const Icon = TRADE_ICONS[job.trade] || MoreHorizontal;

  async function submitBid(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !amount || !agreed) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "marketplaceBids"), {
        leadId: job.id,
        // Denormalized copy of the (already-sanitized, no-PII) job info
        // onto the bid itself — see chat: Account.jsx's "My bids" was
        // showing raw leadId.slice(0,6), which is meaningless to look at.
        // Storing these here means that history doesn't need a second
        // fetch per bid to look up the job just to show what it even was.
        trade: job.trade,
        description: job.description,
        contractorName: name.trim(),
        contractorPhone: phone.trim(),
        contractorEmail: email.trim(),
        // Attach the signed-in contractor's uid (if any) so it shows up in
        // their /account "My bids" history — mirrors the uid attach already
        // done on FindAPro.jsx's HomeownerForm.
        contractorUid: user?.uid || null,
        amount: Number(amount),
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border-0 bg-white p-3 shadow-md ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{job.description || job.trade}</p>
          <p className="text-xs text-muted-foreground">{job.area}</p>
        </div>
        {!open && !done && (
          <Button size="sm" className="rounded-full bg-black text-white hover:bg-black/90" onClick={() => setOpen(true)}>
            Bid
          </Button>
        )}
        {done && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <Check className="h-3.5 w-3.5" /> Sent
          </span>
        )}
      </div>

      {open && !done && (
        <form onSubmit={submitBid} className="mt-3 flex flex-wrap gap-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="h-8 flex-1 text-sm" />
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 flex-1 text-sm" />
          <Input
            placeholder="Email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 flex-1 text-sm"
          />
          <Input
            placeholder="$"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 w-20 text-sm"
          />
          <div className="w-full">
            <TermsAgreement checked={agreed} onChange={setAgreed} id={`bidTermsAgree-${job.id}`} />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-8 rounded-full bg-black text-white hover:bg-black/90"
            disabled={saving || !agreed}
          >
            {saving ? "…" : "Send"}
          </Button>
        </form>
      )}
    </div>
  );
}
