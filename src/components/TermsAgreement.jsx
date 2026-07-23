import { Link } from "react-router-dom";

// Required-agreement checkbox used on every form that lets someone post a
// job, bid on one, or create an account — see chat: "there needs to be a
// terms and conditions because the insurance company says... make it clear
// in the start before signing up." Every submit button that touches
// marketplaceLeads/marketplaceContractors/marketplaceBids/marketplaceProfiles
// should render this and stay disabled until `checked` is true, so nobody
// can post/bid/sign up without having actually agreed. Not styled as a
// buried footer link — it's inline, right above the submit button, so it's
// genuinely seen before signing up rather than technically-present.
export default function TermsAgreement({ checked, onChange, id = "termsAgree" }) {
  return (
    <label htmlFor={id} className="flex items-start gap-2 text-xs text-muted-foreground">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border"
      />
      <span>
        I've read and agree to the{" "}
        <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
          Terms &amp; Conditions
        </Link>
        , including that Fieldsta doesn't carry insurance covering any work performed and isn't
        responsible for pricing, quality, damages, or injury.
      </span>
    </label>
  );
}
