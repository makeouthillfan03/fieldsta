import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Customer Agreement + signature capture. This is the page jc sends a link
// to after a sales conversation closes — "here's the agreement, sign here."
// No self-serve signup exists yet, so this is a standalone page rather than
// part of an onboarding flow.
//
// "Signature" is a typed full legal name plus explicit checkbox consent,
// not a drawn squiggle — valid as an e-signature under the U.S. ESIGN Act,
// and typed text is what's actually searchable in an inbox later. The full
// legal terms live at /terms and /privacy and are incorporated by
// reference rather than repeated here — this page is the short order-form
// + signature that a real SaaS contract reduces to once the detailed terms
// are already published.
const PLANS = [
  { value: "starter", label: "Starter — $500/mo" },
  { value: "growth", label: "Growth — $1,500/mo" },
  { value: "pro", label: "Pro — $3,000/mo" },
  { value: "custom", label: "Custom (pricing agreed separately)" },
];

const TODAY = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function Agreement() {
  const [form, setForm] = useState({
    companyName: "",
    signerName: "",
    signerTitle: "",
    signerEmail: "",
    plan: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [errorMessage, setErrorMessage] = useState("");
  const [emailRecorded, setEmailRecorded] = useState(true);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const canSubmit =
    form.companyName.trim() &&
    form.signerName.trim() &&
    form.signerTitle.trim() &&
    form.signerEmail.trim() &&
    form.plan &&
    agreed &&
    status !== "submitting";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/sign-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, agreed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      // The agreement is validly signed either way (the checkbox + typed
      // name is the legal signature), but whether a record actually
      // reached an inbox is a separate fact worth showing honestly rather
      // than always displaying the same "a copy has been sent" message.
      setEmailRecorded(data.recorded !== false);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Signed</h1>
        <p className="text-sm text-muted-foreground">
          Thanks, {form.signerName.split(" ")[0]} — this agreement is now in effect for{" "}
          {form.companyName}.{" "}
          {emailRecorded
            ? `A copy has been sent to ${form.signerEmail} for your records.`
            : "The signature was recorded, but no confirmation email could be sent right now."}
        </p>
        {!emailRecorded && (
          <p className="text-xs font-medium text-destructive">
            Please email support@fieldsta.com to confirm this signature was received —
            our mail delivery isn't working at the moment.
          </p>
        )}
        <Link to="/" className="inline-block text-sm font-medium underline underline-offset-2">
          Back to Fieldsta
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 text-sm leading-relaxed text-foreground">
      <div>
        <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          ← Fieldsta
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Customer Agreement</h1>
        <p className="mt-1 text-xs text-muted-foreground">Effective as of the date signed below</p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <p>
          This Agreement is between Fieldsta and the company identified below ("Customer") for
          Fieldsta's AI-assisted lead response service. By signing, Customer agrees to the full{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          published at those links as of {TODAY}, which are incorporated into this Agreement by
          reference, together with the plan and pricing selected below.
        </p>
        <p className="text-xs text-muted-foreground">
          This page has not been reviewed by a licensed attorney and is provided as-is while
          Fieldsta is in early operation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Company / Customer legal name" htmlFor="companyName">
            <Input id="companyName" required placeholder="Acme Agency LLC" {...field("companyName")} />
          </FieldGroup>
          <FieldGroup label="Plan" htmlFor="plan">
            <select
              id="plan"
              required
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select a plan
              </option>
              {PLANS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup label="Signer full legal name" htmlFor="signerName">
            <Input id="signerName" required placeholder="Jane Doe" {...field("signerName")} />
          </FieldGroup>
          <FieldGroup label="Signer title" htmlFor="signerTitle">
            <Input id="signerTitle" required placeholder="Owner / CEO" {...field("signerTitle")} />
          </FieldGroup>
          <FieldGroup label="Signer email" htmlFor="signerEmail" className="sm:col-span-2">
            <Input
              id="signerEmail"
              type="email"
              required
              placeholder="jane@acmeagency.com"
              {...field("signerEmail")}
            />
          </FieldGroup>
        </div>

        <label htmlFor="agreeCheck" className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            id="agreeCheck"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border"
          />
          <span>
            I, the signer named above, am authorized to sign this Agreement on behalf of the
            Customer named above, and by typing my name here I am electronically signing this
            Agreement and agreeing to its terms, including the Terms of Service and Privacy Policy
            incorporated by reference.
          </span>
        </label>

        <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          Typing your name above and checking this box constitutes your electronic signature,
          dated {TODAY}. A record of this signature — including the plan selected and the IP
          address it was signed from — will be sent to Fieldsta and to you for your records.
        </div>

        {status === "error" && (
          <p className="text-xs font-medium text-destructive">{errorMessage}</p>
        )}

        <Button type="submit" disabled={!canSubmit} className="w-full">
          {status === "submitting" ? "Signing…" : "Sign agreement"}
        </Button>
      </form>
    </div>
  );
}

function FieldGroup({ label, htmlFor, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
