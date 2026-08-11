import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

// Hairline underline, no box, no fill -- the same field language /try and
// the get-started page use. This form renders in both places, so the style
// lives here rather than being overridden per-caller.
const fieldClass =
  "mt-1.5 rounded-none border-0 border-b border-[rgba(var(--text-rgb),0.15)] bg-transparent px-0 py-2.5 text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.35)] transition-colors focus-visible:border-[rgba(var(--text-rgb),0.45)] focus-visible:outline-none focus-visible:ring-0";

// One /api/lead form, two amounts of upfront detail depending on where the
// visitor already is in the funnel: `compact` (the /get-started "have us
// reach out" card, name+email only) vs the full homepage version (adds
// last name, CRM, and a "how'd you hear about us" dropdown). Used to be two
// separate copies of the same fetch/status handling.
export default function LeadCaptureForm({ compact = false, source, ctaLabel = "Get My Custom Automation Plan", onSuccess }) {
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const crmRef = useRef(null);
  const sourceRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setMessage(compact ? "" : "Submitting...");

    const payload = {
      firstName: firstNameRef.current.value,
      lastName: lastNameRef.current?.value ?? "",
      email: emailRef.current.value,
      crm: crmRef.current?.value ?? "",
      source: source ?? sourceRef.current?.value ?? "",
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Try again.");
        return;
      }
      setStatus("success");
      setMessage(data.message || (compact ? "Got it — we'll reach out shortly." : "Demo request received!"));
      e.target.reset();
      onSuccess?.();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (compact && status === "success") {
    return <p className="text-sm font-medium text-emerald-400">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2.5" : "space-y-4"}>
      <div>
        <Label htmlFor="firstName" className={compact ? "sr-only" : "text-[var(--text)]"}>
          First name
        </Label>
        <Input
          id="firstName"
          ref={firstNameRef}
          required
          placeholder={compact ? "First name" : undefined}
          className={fieldClass}
        />
      </div>

      {!compact && (
        <div>
          <Label htmlFor="lastName" className="text-[var(--text)]">
            Last Name
          </Label>
          <Input id="lastName" ref={lastNameRef} className={fieldClass} />
        </div>
      )}

      <div>
        <Label htmlFor="email" className={compact ? "sr-only" : "text-[var(--text)]"}>
          {compact ? "Business email" : "Business Email"}
        </Label>
        <Input
          id="email"
          type="email"
          ref={emailRef}
          required
          placeholder={compact ? "Business email" : undefined}
          className={fieldClass}
        />
      </div>

      {!compact && (
        <>
          <div>
            <Label htmlFor="crm" className="text-[var(--text)]">
              What CRM do you use?
            </Label>
            <Input
              id="crm"
              ref={crmRef}
              placeholder="e.g. HubSpot, Salesforce, none"
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="source" className="text-[var(--text)]">
              How did you hear about us?
            </Label>
            <Select id="source" ref={sourceRef} defaultValue="" className={fieldClass}>
              <option value="" className="bg-[var(--bg-deep)]">
                Select one
              </option>
              <option value="Referral" className="bg-[var(--bg-deep)]">
                Referral
              </option>
              <option value="Google Search" className="bg-[var(--bg-deep)]">
                Google Search
              </option>
              <option value="LinkedIn" className="bg-[var(--bg-deep)]">
                LinkedIn
              </option>
              <option value="Email/Cold Outreach" className="bg-[var(--bg-deep)]">
                Email / Cold Outreach
              </option>
              <option value="Other" className="bg-[var(--bg-deep)]">
                Other
              </option>
            </Select>
          </div>
        </>
      )}

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-none bg-[var(--text)] text-[var(--bg-deep)] hover:opacity-90"
        size={compact ? "default" : "lg"}
      >
        {status === "submitting" ? (compact ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submitting...") : ctaLabel}
      </Button>

      {message && !compact && (
        <div
          className={
            "rounded-lg p-4 text-center font-medium " +
            (status === "success"
              ? "bg-emerald-400/10 text-emerald-400"
              : status === "error"
              ? "bg-red-400/10 text-red-400"
              : "text-[var(--text)]")
          }
          role="status"
        >
          {message}
        </div>
      )}
      {message && compact && status === "error" && <p className="text-xs text-[#FF4438]">{message}</p>}
    </form>
  );
}
