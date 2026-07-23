import { useState } from "react";
import { Link } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/firebase";

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

export default function FindAPro() {
  const [mode, setMode] = useState("homeowner"); // "homeowner" | "contractor"

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/mascot.png" alt="" className="h-7 w-7" />
            <span className="font-semibold">Find a Pro — Perth Amboy</span>
          </div>
          {/* Existing Fieldsta account holders (trial/paid) still need a way
              in now that this page replaced the old marketing homepage. */}
          <Link to="/login" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Already have an account? Sign in
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Need work done at your house? Post what you need and a local pro will reach out. Are
          you a contractor? Sign up to get sent local jobs.
        </p>

        <div className="flex rounded-md border border-border bg-background p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("homeowner")}
            className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "homeowner" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            I need something done
          </button>
          <button
            type="button"
            onClick={() => setMode("contractor")}
            className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "contractor" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            I'm a contractor
          </button>
        </div>

        {mode === "homeowner" ? <HomeownerForm /> : <ContractorForm />}
      </div>
    </div>
  );
}

function HomeownerForm() {
  const [form, setForm] = useState(emptyLeadForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "marketplaceLeads"), {
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
      <Card>
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
    <Card>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
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

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const needsLicense = LICENSED_TRADES.has(form.trade);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
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
      <Card>
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
    <Card>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Submitting…" : "Sign up for jobs"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
