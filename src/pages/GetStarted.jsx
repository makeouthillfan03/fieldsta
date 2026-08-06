import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SalesChatWidget from "@/components/SalesChatWidget";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import Triangle from "@/components/Triangle";
import ParticleSkyline from "@/components/ParticleSkyline";
import { ThemeToggle, useIsDarkTheme } from "@/components/ThemeToggle";
import { track } from "@vercel/analytics/react";

// Landing spot for the pricing section's "Start your free pilot" CTA.
// There's no standalone Stripe-checkout endpoint to link straight to --
// the only thing that can actually mint a real checkout link is Harper's
// sales-chat agent (collect_payment in sales-agent.ts, which requires a
// pilot account from create_pilot_account first). So all three paths here
// route into real, existing infrastructure rather than new backend work:
// the "checkout now" card opens the same chat pre-primed to skip straight
// to the link, "have someone reach out" reuses the existing /api/lead
// form, and "talk to Harper" just opens the chat cold.
export default function GetStarted() {
  const dark = useIsDarkTheme();

  return (
    <div className="relative min-h-screen bg-[var(--bg)] font-body text-[var(--text)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(140%_95%_at_50%_0%,rgba(var(--text-rgb),0.06)_0%,rgba(var(--text-rgb),0.02)_28%,transparent_62%)]" />
        <ParticleSkyline className="absolute inset-0 h-full w-full opacity-60" dark={dark} />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(var(--bg-rgb),0.5)_55%,var(--bg)_100%)]" />
      </div>

      <div className="container relative z-10 max-w-3xl py-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text)] opacity-70 transition-colors hover:opacity-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Fieldsta
          </Link>
          <ThemeToggle />
        </div>

        <div className="mt-10 text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            Get started
          </div>
          <h1 className="mt-4 font-editorial text-3xl font-medium tracking-tight sm:text-4xl">
            Start your free pilot
          </h1>
        </div>

        <div className="mx-auto mt-14 grid divide-y divide-[rgba(var(--text-rgb),0.1)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <CheckoutCard />
          <TalkToHarperCard />
          <ReachOutCard />
        </div>
      </div>

      <SalesChatWidget />
    </div>
  );
}

function OptionShell({ title, blurb, children }) {
  return (
    <div className="flex h-full flex-col py-8 text-center sm:px-8 sm:py-0">
      <div className="flex justify-center">
        <Triangle className="mb-3" />
      </div>
      <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text)] opacity-70">{blurb}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

// Opens Harper primed to go straight for the Stripe link -- create_pilot_
// account only needs a business name, email, and what they sell, and
// everything else (qualifying criteria, voice, CRM) can be filled in
// afterward from the dashboard. This message says so explicitly so Harper
// doesn't spend the conversation gathering detail the visitor already
// said they'd rather skip.
const CHECKOUT_AUTO_MESSAGE =
  "I want to start the $500/month Starter plan and check out with Stripe right now. Just get me the essentials to set up the account and send the checkout link -- I'll fill in the rest of the details afterward.";

function CheckoutCard() {
  return (
    <OptionShell
      title="Check out now"
      blurb="Give Harper the bare minimum, get a real Stripe checkout link back in the same chat, fill in the rest of your setup after you've paid."
    >
      <Button
        onClick={() => {
          track("get_started_checkout_now");
          window.dispatchEvent(
            new CustomEvent("fieldsta:open-chat", { detail: { autoMessage: CHECKOUT_AUTO_MESSAGE } })
          );
        }}
        className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
      >
        Go to checkout
        <ArrowRight className="h-4 w-4" />
      </Button>
    </OptionShell>
  );
}

function TalkToHarperCard() {
  return (
    <OptionShell
      title="Talk to Harper"
      blurb="Ask questions, describe your business, and let the conversation decide whether that's a free pilot, a checkout link, or a call with a human."
    >
      <Button
        onClick={() => {
          track("get_started_talk_to_harper");
          window.dispatchEvent(new CustomEvent("fieldsta:open-chat"));
        }}
        className="w-full bg-[var(--text)] text-[var(--bg-deep)] hover:bg-white"
      >
        Open chat
        <ArrowRight className="h-4 w-4" />
      </Button>
    </OptionShell>
  );
}

function ReachOutCard() {
  return (
    <OptionShell
      title="Have us reach out"
      blurb="Leave your name and email -- a person on the team will follow up to set everything up with you directly."
    >
      <LeadCaptureForm
        compact
        source="get-started"
        ctaLabel="Request a call"
        onSuccess={() => track("get_started_reach_out")}
      />
    </OptionShell>
  );
}
