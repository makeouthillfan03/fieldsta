import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SalesChatWidget from "@/components/SalesChatWidget";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import Triangle from "@/components/Triangle";
import ParticleSkyline from "@/components/ParticleSkyline";
import { ThemeToggle, useIsDarkTheme } from "@/components/ThemeToggle";
import { track } from "@vercel/analytics/react";
import { trackLinkedInConversion } from "@/lib/linkedin.js";

// Landing spot for the pricing section's "Start free trial" CTA. The first
// card used to open Harper pre-primed with an auto-message and let the
// conversation produce a Stripe link -- replaced with a direct form against
// fieldsta-agents' POST /api/quick-checkout (skipCheckout: true), which
// creates the pilot (14-day trial, capped at 3 leads/day -- see server.ts)
// with no card asked for and no LLM turn in the loop at all -- the pilot is
// fully live and usable at that point regardless, card entry was never
// actually gating trial access; paying is a Billing-settings action once
// someone's in the dashboard, not a choice made on this page. "Talk to
// Harper" and "have someone reach out" are unchanged -- chat is still the
// right tool for anyone who actually wants to ask something first.
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
          {/* Two fields really is the entire signup (the pilot goes live
              before Stripe is ever involved — quick-checkout's skipCheckout
              branch), so the page can promise this without hedging. */}
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--text)] opacity-60">
            The whole signup is a name and an email — your dashboard is live in
            about two minutes, and connecting your lead source is a few clicks
            from there. No card, no call.
          </p>
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

// Every column gets the same three slots — mark, title, one quiet line —
// so the action row lands at the same height by content instead of being
// pushed there by a stretched empty spacer. Two of the three used to have
// nothing between the title and the button, which is what left the middle
// of the row visibly hollow.
function OptionShell({ title, note, accentNote, children }) {
  return (
    <div className="flex h-full flex-col py-10 text-center sm:px-8 sm:py-0">
      <div className="flex justify-center">
        <Triangle className="mb-3" />
      </div>
      <h2 className="font-editorial text-2xl font-medium tracking-tight text-[var(--text)]">{title}</h2>
      {note && (
        <div
          className={
            "mx-auto mt-3 max-w-[24ch] text-[13px] leading-relaxed " +
            (accentNote ? "text-[var(--accent)]" : "text-[var(--text)] opacity-55")
          }
        >
          {note}
        </div>
      )}
      <div className="mt-8 flex-1" />
      <div>{children}</div>
    </div>
  );
}

const AGENTS_BASE = import.meta.env.VITE_AGENTS_BASE_URL || "https://studio.fieldsta.com";

// Hairline-underline fields and squared buttons — the same language /try
// and the homepage hero already speak. The boxed, rounded, tinted-fill
// inputs this page used before were the only place on the site that drew a
// container around an input, which is what made the signup step read as a
// heavier, more generic form than everything leading up to it.
const fieldClass =
  "rounded-none border-0 border-b border-[rgba(var(--text-rgb),0.15)] bg-transparent px-0 py-2.5 text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.35)] transition-colors focus-visible:border-[rgba(var(--text-rgb),0.45)] focus-visible:outline-none focus-visible:ring-0";

const primaryBtnClass =
  "w-full rounded-none bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]";
const secondaryBtnClass =
  "w-full rounded-none bg-[var(--text)] text-[var(--bg-deep)] hover:opacity-90";

// One button, matching TalkToHarperCard/ReachOutCard's shape exactly (a
// single full-width solid button, no secondary link) -- creates the pilot
// with skipCheckout so no card is ever asked for. The pilot is fully live
// and usable at that point regardless (see server.ts's /api/quick-checkout,
// which grants it before Stripe ever enters the picture) -- paying is
// something to do later from the dashboard's Billing settings once someone
// actually wants to, not a second choice to make on this page.
function CheckoutCard() {
  const businessNameRef = useRef(null);
  const emailRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [message, setMessage] = useState("");
  // The link that finishes setup, handed back by /api/quick-checkout so this
  // page can offer it directly. Signing up used to end at "check your email":
  // the pilot was already live, but the only way in was to leave the site,
  // find a message and come back, which spends a new signup's enthusiasm on
  // their inbox at precisely the moment it's highest.
  const [setupUrl, setSetupUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(`${AGENTS_BASE}/api/quick-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessNameRef.current.value,
          contactEmail: emailRef.current.value,
          skipCheckout: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Try again.");
        return;
      }

      track("get_started_start_trial");
      trackLinkedInConversion("signup");
      setStatus("idle");
      setSetupUrl(data.setupUrl || "");
      setMessage(data.message || "Your 14-day pilot is live.");
      e.target.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  return (
    <OptionShell title="Start free" note="14-day pilot. No card required." accentNote>
      <form onSubmit={handleSubmit} className="text-left">
        <div className="space-y-4">
          <Input
            ref={businessNameRef}
            required
            placeholder="Business name"
            disabled={status === "submitting"}
            className={fieldClass}
          />
          <Input
            ref={emailRef}
            type="email"
            required
            placeholder="Business email"
            disabled={status === "submitting"}
            className={fieldClass}
          />
        </div>
        <Button type="submit" disabled={status === "submitting"} className={primaryBtnClass + " mt-6"}>
          {status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start free trial"}
        </Button>
        {message && (
          <p className={"mt-3 text-xs " + (status === "error" ? "text-[#FF4438]" : "text-emerald-400")}>{message}</p>
        )}
        {setupUrl && (
          <>
            <a href={setupUrl} onClick={() => track("get_started_open_dashboard")} className="mt-3 block">
              <Button className={primaryBtnClass + " font-bold"}>Set a password &amp; open your dashboard</Button>
            </a>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text)] opacity-60">
              Sent to your email too, in case you want to finish on another device.
            </p>
          </>
        )}
      </form>
    </OptionShell>
  );
}

function TalkToHarperCard() {
  return (
    <OptionShell title="Talk to Harper" note="Ask anything first — it's the same agent you'd be buying.">
      <Button
        onClick={() => {
          track("get_started_talk_to_harper");
          window.dispatchEvent(new CustomEvent("fieldsta:open-chat"));
        }}
        className={secondaryBtnClass}
      >
        Open chat
      </Button>
    </OptionShell>
  );
}

function ReachOutCard() {
  return (
    <OptionShell title="Have us reach out" note="Leave your details and we'll call you back.">
      <LeadCaptureForm
        compact
        source="get-started"
        ctaLabel="Request a call"
        onSuccess={() => track("get_started_reach_out")}
      />
    </OptionShell>
  );
}
