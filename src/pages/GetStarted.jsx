import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SalesChatWidget from "@/components/SalesChatWidget";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import Triangle from "@/components/Triangle";
import ParticleSkyline from "@/components/ParticleSkyline";
import { ThemeToggle, useIsDarkTheme } from "@/components/ThemeToggle";
import { track } from "@vercel/analytics/react";
import { reportFunnelEvent } from "@/lib/attribution.js";

// Landing spot for the pricing section's "Start free trial" CTA. The first
// card used to open Harper pre-primed with an auto-message and let the
// conversation produce a Stripe link -- replaced with a direct form against
// fieldsta-agents' POST /api/quick-checkout, which creates the pilot
// (14-day trial, capped at 3 leads/day -- see server.ts) with no LLM turn
// in the loop at all. Two buttons on that one form: "Start free trial"
// (skipCheckout: true) leaves it there, no card ever asked for -- the pilot
// is already fully live and usable at that point regardless, card entry
// was never actually gating trial access. "Go straight to checkout" does
// the identical signup plus an immediate Stripe redirect, for anyone who's
// already decided to pay. "Talk to Harper" and "have someone reach out" are
// unchanged -- chat is still the right tool for anyone who actually wants
// to ask something first.
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

function OptionShell({ title, badge, blurb, children }) {
  return (
    <div className="flex h-full flex-col py-8 text-center sm:px-8 sm:py-0">
      <div className="flex justify-center">
        <Triangle className="mb-3" />
      </div>
      <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
      {badge && (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)] opacity-80">
          {badge}
        </div>
      )}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text)] opacity-70">{blurb}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

const AGENTS_BASE = import.meta.env.VITE_AGENTS_BASE_URL || "https://studio.fieldsta.com";

const fieldClass =
  "border-[rgba(var(--text-rgb),0.15)] bg-[rgba(var(--text-rgb),0.04)] text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.5)] focus-visible:ring-[rgba(var(--text-rgb),0.4)]";

// Two submit buttons, one form: "Start free trial" creates the pilot with
// skipCheckout so no card is ever asked for (the pilot is fully live and
// usable either way -- see server.ts's /api/quick-checkout, which grants it
// before Stripe ever enters the picture), "Go to checkout" does the same
// signup but adds the immediate Stripe redirect for anyone who's already
// decided to pay. Sharing one form/one handler means the two paths can never
// drift apart on what counts as a valid business name/email.
function CheckoutCard() {
  const businessNameRef = useRef(null);
  const emailRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | "trial" | "checkout" | error
  const [message, setMessage] = useState("");

  async function handleSubmit(skipCheckout) {
    if (!businessNameRef.current.reportValidity() || !emailRef.current.reportValidity()) return;
    setStatus(skipCheckout ? "trial" : "checkout");
    setMessage("");

    try {
      const res = await fetch(`${AGENTS_BASE}/api/quick-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessNameRef.current.value,
          contactEmail: emailRef.current.value,
          skipCheckout,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Try again.");
        return;
      }

      track(skipCheckout ? "get_started_start_trial" : "get_started_checkout_now");
      if (data.checkoutUrl) {
        // cid-gated no-op for non-cold-email visits (see reportFunnelEvent's
        // own doc comment) -- ties a checkout-started event back to the
        // specific prospect record for cold-email-sourced signups, the same
        // way demo_started/demo_completed already do on LiveDemo.jsx. Only
        // fired on the real checkout path -- starting a free trial isn't a
        // checkout-started event.
        reportFunnelEvent("checkout_started");
        // Redirect rather than open in a new tab -- this is a real Stripe
        // Checkout session tied to the pilot account just created, not a
        // reference link; leaving this tab on a dead form after the
        // account already exists would be confusing.
        window.location.href = data.checkoutUrl;
        return;
      }

      // Pilot account is live either way (see server.ts's /api/quick-
      // checkout) even for the checkout path if Stripe itself wasn't
      // reachable -- only the redirect failed, not the signup.
      setStatus("idle");
      setMessage(data.message || "Your pilot is live — check your email to set your password.");
      businessNameRef.current.value = "";
      emailRef.current.value = "";
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  const submitting = status === "trial" || status === "checkout";

  return (
    <OptionShell
      title="Start free"
      badge="14-day free trial — no card required"
      blurb="Enter your business and it's live in seconds. Pay only if you go over 3 leads/day or want to keep it past 14 days."
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-2.5 text-left"
      >
        <Input
          ref={businessNameRef}
          required
          placeholder="Business name"
          disabled={submitting}
          className={fieldClass}
        />
        <Input
          ref={emailRef}
          type="email"
          required
          placeholder="Business email"
          disabled={submitting}
          className={fieldClass}
        />
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
        >
          {status === "trial" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          variant="ghost"
          className="w-full text-xs text-[var(--text)] opacity-60 hover:opacity-100"
        >
          {status === "checkout" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Already decided? Go straight to checkout"}
        </Button>
        {message && (
          <p className={"text-xs " + (status === "error" ? "text-[#FF4438]" : "text-emerald-400")}>{message}</p>
        )}
      </form>
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
