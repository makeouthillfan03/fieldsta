import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, MessageCircle, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SalesChatWidget from "@/components/SalesChatWidget";
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
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Start your free pilot</h1>
          <p className="mx-auto mt-3 max-w-lg text-[var(--text)] opacity-70">
            Starter is $500/month. Pick however you'd rather get moving — all three land on
            the same real account, not a lead-gen form.
          </p>
        </div>

        <div className="mx-auto mt-10 grid gap-5 sm:grid-cols-3">
          <CheckoutCard />
          <TalkToHarperCard />
          <ReachOutCard />
        </div>
      </div>

      <SalesChatWidget />
    </div>
  );
}

function OptionShell({ icon: Icon, title, blurb, children }) {
  return (
    <Card className="flex h-full flex-col border-[rgba(var(--text-rgb),0.15)] bg-[var(--text)]/[0.03] p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(var(--text-rgb),0.15)] bg-[rgba(var(--text-rgb),0.05)] text-[var(--text)]">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-1.5 flex-1 text-sm text-[var(--text)] opacity-70">{blurb}</p>
      <div className="mt-5">{children}</div>
    </Card>
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
      icon={CreditCard}
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
      icon={MessageCircle}
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
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName: "",
          email,
          crm: "",
          source: "get-started",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Try again.");
        return;
      }
      track("get_started_reach_out");
      setStatus("success");
      setMessage("Got it -- we'll reach out shortly.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (status === "success") {
    return (
      <OptionShell icon={Mail} title="Have us reach out" blurb="">
        <p className="text-sm font-medium text-emerald-400">{message}</p>
      </OptionShell>
    );
  }

  return (
    <OptionShell
      icon={Mail}
      title="Have us reach out"
      blurb="Leave your name and email -- a person on the team will follow up to set everything up with you directly."
    >
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <Label htmlFor="gs-firstName" className="sr-only">
            First name
          </Label>
          <Input
            id="gs-firstName"
            placeholder="First name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-[rgba(var(--text-rgb),0.15)] bg-[var(--text)]/[0.04] text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.7)]"
          />
        </div>
        <div>
          <Label htmlFor="gs-email" className="sr-only">
            Business email
          </Label>
          <Input
            id="gs-email"
            type="email"
            placeholder="Business email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-[rgba(var(--text-rgb),0.15)] bg-[var(--text)]/[0.04] text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.7)]"
          />
        </div>
        <Button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-[var(--text)] text-[var(--bg-deep)] hover:bg-white"
        >
          {status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request a call"}
        </Button>
        {status === "error" && <p className="text-xs text-[#FF4438]">{message}</p>}
      </form>
    </OptionShell>
  );
}
