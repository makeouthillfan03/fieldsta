import { useState } from "react";
import { Link } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { CheckCircle2, ShieldCheck, Zap, Wrench, Snowflake, Hammer, Paintbrush, Leaf, Sparkles, Truck, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import MapView from "@/components/MapView";
import { useAuth } from "@/context/AuthContext";
import TermsAgreement from "@/components/TermsAgreement";

// Concierge MVP for the Perth Amboy marketplace pilot (see chat — this is
// deliberately NOT automated matching yet). Two forms feed two Firestore
// collections; a human (the founder) reads them via the owner-only
// getMarketplaceSubmissions callable and manually connects homeowners to
// contractors by phone/text. No bidding UI, no payments, no auth — the
// whole point is to prove people will actually use this before building
// any of that. See firestore.rules "Marketplace concierge MVP".
const TRADES = [
  "electrical",
  "plumbing",
  "hvac",
  "handyman",
  "painting",
  "landscaping",
  "cleaning",
  "movingHauling",
  "other",
];

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

const LICENSED_TRADES = new Set(["electrical", "plumbing", "hvac"]);

const emptyLeadForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  trade: "handyman",
  description: "",
};

const emptyContractorForm = {
  name: "",
  phone: "",
  email: "",
  trade: "handyman",
  licensed: "",
  licenseNumber: "",
  serviceArea: "",
  notes: "",
};

// Soft blue/white gradient swirl behind the whole page (see chat — matched
// to a reference image). Pure CSS, no images: a handful of large, blurred
// radial gradients layered on a white base and drifted very slowly so it
// doesn't feel static, but it's subtle enough not to fight with the forms.
function GradientBackground() {
  return (
    <>
      <style>{`
        @keyframes fap-drift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-3%, 2%) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .fap-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          background: #ffffff;
        }
        .fap-bg::before,
        .fap-bg::after {
          content: "";
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.65;
        }
        .fap-bg::before {
          top: -10%;
          right: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle at 40% 40%, #8fb8e8, #cfe1f5 60%, transparent 75%);
          animation: fap-drift 22s ease-in-out infinite;
        }
        .fap-bg::after {
          bottom: -15%;
          left: -10%;
          width: 55vw;
          height: 55vw;
          background: radial-gradient(circle at 60% 60%, #bcdcf7, #e9f3fc 60%, transparent 75%);
          animation: fap-drift 26s ease-in-out infinite reverse;
        }
      `}</style>
      <div className="fap-bg" aria-hidden="true" />
    </>
  );
}

// Phone verification UI scaffold — see chat: "add a phone number
// verification setup but dont complete it because i needa do twillo."
// This is deliberately NOT wired to anything real yet. Once a Twilio
// account/number is set up, "Send code" should call a Cloud Function that
// sends a real SMS via Twilio's Verify API and a second callable should
// confirm the code before the form is allowed to submit — same shape as
// the phone verification already built for the old Fieldsta signup (see
// lib/firebase.js sendPhoneVerificationCode, though that used Firebase's
// own phone auth, not Twilio — worth deciding which provider before
// wiring this up for real, since Firebase phone auth might be simpler).
// For now it's just a visible, honest "coming soon" so the concierge MVP
// doesn't silently pretend to verify something it isn't.
function PhoneVerifyStub() {
  const [phone, setPhone] = useState("");
  const [requested, setRequested] = useState(false);

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Phone verification (coming soon)
      </div>
      {!requested ? (
        <div className="flex gap-2">
          <Input
            placeholder="Your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!phone.trim()}
            onClick={() => setRequested(true)}
          >
            Send code
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          SMS verification isn't turned on yet — for now we'll just call or text you directly to
          confirm. This won't block your submission below.
        </p>
      )}
    </div>
  );
}

const STEPS = ["Post", "Match", "Done"];

export default function FindAPro() {
  const { user } = useAuth();
  const [mode, setMode] = useState("homeowner"); // "homeowner" | "contractor"

  return (
    <div className="min-h-screen px-4 py-6">
      <GradientBackground />
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Fieldsta</span>
          <Link
            to={user ? "/account" : "/login"}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {user ? "My account" : "Sign in"}
          </Link>
        </div>

        {/* Hero — city-specific but in our own voice, not a paraphrase of a
            competitor's homepage copy (see chat: "don't make it too similar
            with thumbtack they r a competitior"). Still minimal, no
            paragraph pitch. */}
        <div className="space-y-2 pt-2 text-center">
          <span className="inline-block rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Perth Amboy · testing
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Perth Amboy's own
            <br />
            job board. <span className="text-primary">Free.</span>
          </h1>
        </div>

        <MapView height={200} />

        {/* Trade grid — icon-over-label, wraps into rows instead of
            scrolling (see chat: "remove the horizontal scroll bar" — a
            fixed 4-column grid fits all 8 trades with no scroll at all,
            cleaner than a scroll strip for a set this small). */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {TRADES.filter((t) => t !== "other").map((t) => {
            const Icon = TRADE_ICONS[t];
            return (
              <div key={t} className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform hover:scale-105">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-center text-[11px] font-medium leading-tight text-foreground">
                  {TRADE_LABELS[t].split(" /")[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* How it works — numbers + one word each, no explanatory copy */}
        <div className="flex items-center justify-center gap-6">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                {i + 1}
              </div>
              <span className="text-xs font-medium">{step}</span>
              {i < STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>

        <div className="flex rounded-full border border-border bg-white p-1 text-sm shadow-sm">
          <button
            type="button"
            onClick={() => setMode("homeowner")}
            className={`flex-1 rounded-full px-3 py-2 font-medium transition-all ${
              mode === "homeowner" ? "bg-black text-white shadow" : "text-muted-foreground"
            }`}
          >
            I need something done
          </button>
          <button
            type="button"
            onClick={() => setMode("contractor")}
            className={`flex-1 rounded-full px-3 py-2 font-medium transition-all ${
              mode === "contractor" ? "bg-black text-white shadow" : "text-muted-foreground"
            }`}
          >
            I'm a contractor
          </button>
        </div>

        {mode === "homeowner" ? <HomeownerForm /> : <ContractorForm />}

        {mode === "contractor" && (
          <Link to="/open-jobs" className="block text-center text-xs font-medium underline underline-offset-2">
            Browse open jobs
          </Link>
        )}
      </div>
    </div>
  );
}

function HomeownerForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyLeadForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !agreed) return;
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "marketplaceLeads"), {
        ...(user ? { uid: user.uid } : {}),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        trade: form.trade,
        description: form.description.trim(),
        area: "Perth Amboy",
        status: "new",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Couldn't send your request. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-black/5">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <p className="font-medium">Got it!</p>
          <p className="text-sm text-muted-foreground">
            We'll text or call you shortly with a local pro who can help.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="text-base">What do you need done?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="leadName">Name *</Label>
            <Input id="leadName" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="leadPhone">Phone *</Label>
              <Input id="leadPhone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="leadEmail">Email</Label>
              <Input id="leadEmail" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="leadAddress">Address (Perth Amboy area)</Label>
            <Input id="leadAddress" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="leadTrade">What kind of work?</Label>
            <Select id="leadTrade" value={form.trade} onChange={(e) => update("trade", e.target.value)}>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {TRADE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="leadDescription">Tell us what's going on</Label>
            <Textarea
              id="leadDescription"
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <PhoneVerifyStub />
          <TermsAgreement checked={agreed} onChange={setAgreed} id="leadTermsAgree" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={saving || !agreed}>
            {saving ? "Sending…" : "Get matched with a pro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ContractorForm() {
  const [form, setForm] = useState(emptyContractorForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const needsLicense = LICENSED_TRADES.has(form.trade);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !agreed) return;
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "marketplaceContractors"), {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        trade: form.trade,
        licensed: needsLicense ? form.licensed : "n/a",
        licenseNumber: needsLicense ? form.licenseNumber.trim() : "",
        serviceArea: form.serviceArea.trim() || "Perth Amboy",
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Couldn't submit. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-black/5">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <p className="font-medium">You're on the list!</p>
          <p className="text-sm text-muted-foreground">
            We'll reach out by phone or text when a matching job comes in.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="text-base">Get sent local jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="contName">Name / business name *</Label>
            <Input id="contName" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="contPhone">Phone *</Label>
              <Input id="contPhone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contEmail">Email</Label>
              <Input id="contEmail" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="contTrade">What do you do?</Label>
            <Select id="contTrade" value={form.trade} onChange={(e) => update("trade", e.target.value)}>
              {TRADES.filter((t) => t !== "other").map((t) => (
                <option key={t} value={t}>
                  {TRADE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          {needsLicense && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contLicensed">Licensed in NJ?</Label>
                <Select id="contLicensed" value={form.licensed} onChange={(e) => update("licensed", e.target.value)}>
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">Not yet</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="contLicenseNumber">License #</Label>
                <Input
                  id="contLicenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => update("licenseNumber", e.target.value)}
                  disabled={form.licensed !== "yes"}
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="contArea">Service area</Label>
            <Input
              id="contArea"
              placeholder="Perth Amboy and nearby towns"
              value={form.serviceArea}
              onChange={(e) => update("serviceArea", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contNotes">Anything else? (years of experience, etc.)</Label>
            <Textarea id="contNotes" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
          <PhoneVerifyStub />
          <TermsAgreement checked={agreed} onChange={setAgreed} id="contTermsAgree" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={saving || !agreed}>
            {saving ? "Submitting…" : "Sign up for jobs"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
