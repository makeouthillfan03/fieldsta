import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreRing } from "@/components/ScoreRing";
import SalesChatWidget from "@/components/SalesChatWidget";
import ParticleSkyline from "@/components/ParticleSkyline";

// Self-serve interactive demo — the prospect sees the product work on a lead
// they wrote themselves, without booking a call first. This calls the SAME
// Responder agent that runs for paying clients (POST /api/demo-qualify on the
// agents service), not a canned script or a recorded result: if the agent
// would disqualify their lead, the demo says so. That honesty is the point —
// a demo that qualifies everything proves nothing.
//
// It talks to the agents service directly rather than through a Vercel
// function, because a real agent run takes tens of seconds and Vercel's
// serverless timeout would cut it off.
const AGENTS_BASE = import.meta.env.VITE_AGENTS_BASE_URL || "https://studio.fieldsta.com";

const VERTICALS = [
  {
    value: "home-services",
    label: "Home services",
    sample:
      "We had that big hailstorm come through last week and I'm seeing dented gutters and shingles in the yard. Insurance adjuster is coming Friday but I want a roofer's opinion before then. Can someone come take a look this week?",
  },
  {
    value: "legal",
    label: "Legal intake",
    sample:
      "I was rear ended on the highway last Tuesday. Other driver admitted fault to the officer but their insurance is already lowballing me. I have a police report and went to urgent care same day, still getting neck pain. Do you handle cases like this?",
  },
  {
    value: "saas",
    label: "B2B / SaaS",
    sample:
      "We run paid ads for about a dozen contractor clients and generate maybe 400 leads a month between them. Honestly our follow-up is inconsistent — leads sit for hours before anyone calls. What does something like this cost?",
  },
];

const VERDICT = {
  qualified: {
    label: "Qualified",
    Icon: CheckCircle2,
    className: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  },
  needs_more_info: {
    label: "Needs more info",
    Icon: HelpCircle,
    className: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  },
  not_a_fit: {
    label: "Not a fit",
    Icon: XCircle,
    className: "text-[#FF4438] border-[#FF4438]/30 bg-[#FF4438]/10",
  },
};

export default function LiveDemo() {
  const [vertical, setVertical] = useState("home-services");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const active = VERTICALS.find((v) => v.value === vertical);

  async function run(e) {
    e.preventDefault();
    if (!message.trim() || status === "running") return;
    setStatus("running");
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${AGENTS_BASE}/api/demo-qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vertical, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="relative min-h-screen bg-[#060607] font-body text-[#F5F5F5]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(140%_95%_at_50%_0%,rgba(255,241,232,0.1)_0%,rgba(255,235,225,0.04)_28%,transparent_62%)]" />
        <ParticleSkyline className="absolute inset-0 h-full w-full opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,6,7,0.5)_55%,#060607_100%)]" />
      </div>

      <div className="container relative z-10 max-w-3xl py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#9A9A9E] transition-colors hover:text-[#F5F5F5]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Fieldsta
        </Link>

        <div className="mt-8 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Watch it qualify a real lead
          </h1>
        </div>

        <form onSubmit={run} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.18em] text-[#6F6F75]">
              What kind of business
            </Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {VERTICALS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVertical(v.value)}
                  className={
                    "rounded-lg border px-3 py-2.5 text-left transition-all duration-200 " +
                    (vertical === v.value
                      ? "border-[#F5F5F5]/40 bg-[#F5F5F5]/[0.06] scale-[1.02]"
                      : "border-[#F5F5F5]/10 hover:border-[#F5F5F5]/25 hover:bg-[#F5F5F5]/[0.02]")
                  }
                >
                  <div className="text-sm font-medium">{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="leadMessage"
                className="text-xs uppercase tracking-[0.18em] text-[#6F6F75]"
              >
                What the lead said
              </Label>
              <button
                type="button"
                onClick={() => setMessage(active.sample)}
                className="text-[11px] text-[#9A9A9E] underline underline-offset-2 hover:text-[#F5F5F5]"
              >
                Use an example
              </button>
            </div>
            <textarea
              id="leadMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Paste or type what a lead sent you…"
              className="w-full rounded-lg border border-[#F5F5F5]/15 bg-[#0d0d0f] px-3.5 py-3 text-[15px] leading-relaxed text-[#F5F5F5] placeholder:text-[#4A4A50] transition-colors duration-200 focus-visible:border-[#F5F5F5]/35 focus-visible:outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={!message.trim() || status === "running"}
            className="w-full bg-[#F5F5F5] text-[#0a0a0a] transition-all duration-200 hover:bg-white sm:w-auto"
          >
            {status === "running" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Qualifying…
              </>
            ) : (
              "Run it"
            )}
          </Button>

          {status === "running" && (
            <p className="text-xs text-[#6F6F75]">
              This takes 20–40 seconds — it's a real agent reading the lead, not a lookup.
            </p>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-[#FF4438]/30 bg-[#FF4438]/10 px-3.5 py-3 text-sm text-[#FF9A93]">
              {error}
            </div>
          )}
        </form>

        {result && <Result result={result} />}

        <div className="mt-12 border-t border-[#F5F5F5]/10 pt-8">
          <Card className="border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-[#F5F5F5] sm:text-2xl">Run this on your own leads</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#9A9A9E]">
              Same agent, pointed at your inbox — $500/month, free pilot to start, cancel
              anytime. Interested? Just ask Harper below to get set up.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("fieldsta:open-chat"))}
              className="mt-6 inline-block"
            >
              <Button size="lg" className="bg-[#F5F5F5] text-[#0a0a0a] hover:bg-white">
                Start your free pilot
                <ArrowRight className="h-4 w-4" />
              </Button>
            </button>
            <p className="mt-3 text-xs text-[#6F6F75]">
              Or{" "}
              <Link to="/#demo" className="underline underline-offset-2 hover:text-[#F5F5F5]">
                tell us about your setup by email
              </Link>{" "}
              instead.
            </p>
          </Card>
        </div>
      </div>
      <SalesChatWidget />
    </div>
  );
}

function Result({ result }) {
  const verdict = VERDICT[result.qualification] ?? VERDICT.needs_more_info;
  const { Icon } = verdict;

  return (
    <div className="mt-10 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {result.score && (
          <div className="flex items-center gap-3">
            <ScoreRing score={result.score.score} size={64} stroke={5} />
            <span className="max-w-[9rem] text-xs leading-snug text-[#9A9A9E]">
              {result.score.tierLabel}
            </span>
          </div>
        )}
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium " +
            verdict.className
          }
        >
          <Icon className="h-3.5 w-3.5" />
          {verdict.label}
        </span>
        {result.needsHumanReview && (
          <span className="text-[11px] text-[#6F6F75]">Flagged for human review</span>
        )}
      </div>

      <Card className="space-y-4 border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] p-5">
        <Block title="Why">
          <p>{result.reasoning}</p>
        </Block>

        {result.criteriaBreakdown?.length > 0 && (
          <Block title="Criteria checked">
            <ul className="space-y-2.5">
              {result.criteriaBreakdown.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CritMark met={c.met} />
                  <div>
                    <div className="font-medium text-[#F5F5F5]">{c.criterion}</div>
                    <div className="mt-0.5 text-[13px] text-[#9A9A9E]">{c.evidence}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {result.missingInfo?.length > 0 && (
          <Block title="Couldn't confirm">
            <ul className="list-disc space-y-1 pl-4">
              {result.missingInfo.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Block>
        )}

        {result.reviewReason && (
          <Block title="What a reviewer should check">
            <p>{result.reviewReason}</p>
          </Block>
        )}
      </Card>

      <Card className="space-y-3 border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#6F6F75]">
          Drafted reply — nothing sends until a human approves it
        </div>
        {result.subject && (
          <div className="text-sm font-medium text-[#F5F5F5]">{result.subject}</div>
        )}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#C8C8CC]">
          {result.draftReply}
        </p>
      </Card>

      <div className="flex gap-2 pt-2">
        <button className="flex-1 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/30">
          ✓ Approve & Send
        </button>
        <button className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/30">
          ✕ Reject
        </button>
      </div>

      <Card className="space-y-3 border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] p-5">
        <Block title="On a live account, this is what would happen next">
          <ul className="space-y-2 text-sm text-[#C8C8CC]">
            <li>→ Reply goes to {result.leadEmail || "lead@example.com"} once approved</li>
            <li>→ Pushed to HubSpot as {result.qualification}</li>
            <li>→ Notification posted to your team Slack</li>
            <li>→ Meeting link added if they accept</li>
          </ul>
          <p className="pt-1 text-xs text-[#C8C8CC]/70">
            Nothing was actually sent, pushed, or notified — this is a demo, and no account is connected.
          </p>
        </Block>
      </Card>

      <Card className="space-y-3 border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] p-5">
        <Block title="In this dashboard, you also get">
          <ul className="space-y-2 text-sm text-[#C8C8CC]">
            <li>Score breakdown for every lead (0-100)</li>
            <li>Customize what email replies come from</li>
            <li>Train the agent with your voice/style</li>
            <li>Connect HubSpot, Meta, Slack, Google Calendar</li>
            <li>See all integrations wired up</li>
            <li>Daily reports on meetings booked & replies sent</li>
          </ul>
        </Block>
      </Card>
    </div>
  );
}

const CRIT_STYLE = {
  yes: { mark: "✓", className: "text-emerald-400 border-emerald-400/40" },
  no: { mark: "✕", className: "text-[#FF4438] border-[#FF4438]/40" },
  unclear: { mark: "?", className: "text-amber-400 border-amber-400/40" },
};

function CritMark({ met }) {
  const s = CRIT_STYLE[met] ?? CRIT_STYLE.unclear;
  return (
    <span
      className={
        "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold " +
        s.className
      }
    >
      {s.mark}
    </span>
  );
}

function Block({ title, children }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#6F6F75]">{title}</div>
      <div className="text-sm leading-relaxed text-[#C8C8CC]">{children}</div>
    </div>
  );
}
