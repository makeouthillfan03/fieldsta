import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { track } from "@vercel/analytics/react";
import { ArrowRight, Loader2, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreRing } from "@/components/ScoreRing";
import SalesChatWidget from "@/components/SalesChatWidget";
import Triangle from "@/components/Triangle";
import ParticleSkyline from "@/components/ParticleSkyline";
import SiteHeader from "@/components/SiteHeader";
import { useIsDarkTheme } from "@/components/ThemeToggle";
import { getAttribution, reportFunnelEvent } from "@/lib/attribution.js";

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

// Conversion ID from LinkedIn Campaign Manager > Account Assets >
// Conversion Tracking (create a "Demo Completed" conversion there, not
// the same as the Insight Tag's Partner ID in index.html). No-ops until
// both the env var is set and the Insight Tag script has actually loaded
// -- window.lintrk won't exist yet if an ad blocker stripped the tag, or
// briefly during the tag's own async load.
const LINKEDIN_CONVERSION_ID = import.meta.env.VITE_LINKEDIN_CONVERSION_ID;
function fireLinkedInConversion() {
  if (!LINKEDIN_CONVERSION_ID || typeof window.lintrk !== "function") return;
  window.lintrk("track", { conversion_id: LINKEDIN_CONVERSION_ID });
}

const VERTICALS = [
  {
    value: "saas",
    label: "B2B / SaaS",
    sample:
      "We run paid ads for about a dozen contractor clients and generate maybe 400 leads a month between them. Honestly our follow-up is inconsistent — leads sit for hours before anyone calls. What does something like this cost?",
    sample2:
      "We're a smaller agency, maybe 150 leads a month across 4 clients. Our issue isn't volume, it's that whoever's free just wings the reply and it's inconsistent. Curious if this could plug into what we already use.",
  },
  {
    value: "home-services",
    label: "Home services",
    sample:
      "We had that big hailstorm come through last week and I'm seeing dented gutters and shingles in the yard. Insurance adjuster is coming Friday but I want a roofer's opinion before then. Can someone come take a look this week?",
    sample2:
      "Noticed a soft spot on the roof near the chimney after all that rain last week. Nothing's leaking yet but I'd rather get ahead of it. Could someone swing by sometime this week to take a look?",
  },
  {
    value: "legal",
    label: "Legal intake",
    sample:
      "I was rear ended on the highway last Tuesday. Other driver admitted fault to the officer but their insurance is already lowballing me. I have a police report and went to urgent care same day, still getting neck pain. Do you handle cases like this?",
    sample2:
      "Slipped on a wet floor at a grocery store two weeks ago, no warning sign was out. Hurt my wrist pretty bad, went to the ER same day and got an X-ray. Store manager took a report. Is this something you'd take on?",
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
  const dark = useIsDarkTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [vertical, setVertical] = useState("saas");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  // Edit-learning demo state: after the first result, the visitor can edit
  // the draft and run a second, different lead to see that correction
  // actually applied -- not just described in copy.
  const [editedDraft, setEditedDraft] = useState("");
  const [appliedEdit, setAppliedEdit] = useState(null); // {draft, edited} once used
  const [round, setRound] = useState(1);
  // A real agent run takes 20-40s with no intermediate progress events to
  // report -- a bare spinner over that long a wait reads as "probably
  // broken" to a visitor. This is a paced, honest-in-spirit fake: it eases
  // toward ~92% and never claims to be an exact measurement, then snaps to
  // 100% the moment the real response actually lands.
  const [progress, setProgress] = useState(0);
  const progressTimer = useRef(null);

  const active = VERTICALS.find((v) => v.value === vertical);

  useEffect(() => {
    if (status === "running") {
      setProgress(4);
      progressTimer.current = setInterval(() => {
        setProgress((p) => (p >= 92 ? p : p + (92 - p) * 0.06));
      }, 300);
    } else {
      clearInterval(progressTimer.current);
      if (status === "done") setProgress(100);
    }
    return () => clearInterval(progressTimer.current);
  }, [status]);

  // Vercel's bounce-rate metric counts only distinct PAGE VIEWS (real route
  // changes) per session, not engagement -- and this entire demo runs on
  // one URL with no navigation, so a visitor who fully ran it and left
  // still registered identically to one who left instantly. Vercel's own
  // analytics script already listens for SPA route changes (it works with
  // react-router elsewhere on this site), so a real -- if visually
  // invisible -- query-param change is what actually flips the bounce
  // math for a genuinely engaged session, not a workaround bolted on top
  // of it. `replace`, not `push`: this shouldn't add a real back-button
  // stop, and idempotent (checks the param first) so re-running the demo
  // doesn't keep appending it.
  function markVirtualPageview(step) {
    const params = new URLSearchParams(location.search);
    if (params.get("step") === step) return;
    params.set("step", step);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }

  async function run(e, overrides = {}) {
    e?.preventDefault?.();
    // An empty box is the common case for ad traffic, who arrive with no lead
    // in hand -- submitting anyway falls back to the vertical's sample and
    // fills the textarea so they can see exactly what got run, rather than
    // hitting a disabled button and leaving. Typing still wins over the sample.
    const usedSample = !(overrides.message ?? message).trim();
    const msg = usedSample ? active.sample : (overrides.message ?? message);
    if (!msg.trim() || status === "running") return;
    if (usedSample) setMessage(msg);
    setStatus("running");
    setError("");
    setResult(null);

    // round 1 (no priorEdit) is the actual funnel entry -- round 2 is a
    // bonus rerun of an already-engaged visitor, not a fresh attempt, so it
    // shouldn't inflate "how many people tried the demo" numbers.
    const attribution = getAttribution();
    if (!overrides.priorEdit) {
      track("demo_started", { ...attribution, vertical, usedSample });
      reportFunnelEvent("demo_started", { vertical, usedSample });
      markVirtualPageview("running");
    }

    try {
      const res = await fetch(`${AGENTS_BASE}/api/demo-qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical,
          message: msg,
          ...(overrides.priorEdit ? { priorEdit: overrides.priorEdit } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      setResult(data);
      setStatus("done");
      if (overrides.priorEdit) setAppliedEdit(overrides.priorEdit);
      if (!overrides.priorEdit) {
        track("demo_completed", { ...attribution, vertical, qualification: data.qualification || "unknown" });
        reportFunnelEvent("demo_completed", { vertical, qualification: data.qualification || "unknown" });
        fireLinkedInConversion();
        markVirtualPageview("completed");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus("error");
      if (!overrides.priorEdit) {
        track("demo_error", { ...attribution, vertical });
      }
    }
  }

  function runWithEdit() {
    if (!editedDraft.trim() || !result?.draftReply) return;
    const priorEdit = { draft: result.draftReply, edited: editedDraft.trim() };
    const nextMessage = active.sample2 || active.sample;
    setMessage(nextMessage);
    setRound(2);
    run(null, { message: nextMessage, priorEdit });
  }

  function resetDemo() {
    setResult(null);
    setMessage("");
    setEditedDraft("");
    setAppliedEdit(null);
    setRound(1);
    setStatus("idle");
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg)] font-body text-[var(--text)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(140%_95%_at_50%_0%,rgba(var(--text-rgb),0.06)_0%,rgba(var(--text-rgb),0.02)_28%,transparent_62%)]" />
        <ParticleSkyline className="absolute inset-0 h-full w-full opacity-60" dark={dark} />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(var(--bg-rgb),0.5)_55%,var(--bg)_100%)]" />
      </div>

      <SiteHeader />

      <div className="container relative z-10 max-w-3xl py-6 sm:py-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            Live demo
          </div>
          <h1 className="font-editorial text-3xl font-medium tracking-tight sm:text-4xl">
            Paste a real <span className="font-semibold text-[var(--accent)]">lead</span>. Watch it{" "}
            <span className="font-semibold text-[var(--accent)]">stop going cold</span>.
          </h1>
          <p className="max-w-lg text-sm text-[var(--text)] opacity-70">
            Same agent as the paying accounts. It will tell you no when the answer is no.
          </p>
        </div>

        {!result && status !== "running" && <SamplePeek />}

        <form onSubmit={run} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.18em] text-[var(--text)] opacity-60">
              What kind of business
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {VERTICALS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVertical(v.value)}
                  className={
                    "border-b-2 px-0.5 py-2 text-left transition-all duration-200 " +
                    (vertical === v.value
                      ? "border-[var(--accent)]"
                      : "border-transparent hover:border-[rgba(var(--text-rgb),0.2)]")
                  }
                >
                  <div
                    className={
                      "text-sm text-[var(--text)] transition-opacity duration-200 " +
                      (vertical === v.value ? "font-medium opacity-100" : "opacity-55")
                    }
                  >
                    {v.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="leadMessage"
              className="text-xs uppercase tracking-[0.18em] text-[var(--text)] opacity-60"
            >
              What the lead said
            </Label>
            <textarea
              id="leadMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="Paste or type what a lead sent you… (optional — leave blank to use an example)"
              className="w-full resize-none border-0 border-b border-[rgba(var(--text-rgb),0.15)] bg-transparent px-0 py-2.5 text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.3)] transition-colors duration-200 focus-visible:border-[rgba(var(--text-rgb),0.45)] focus-visible:outline-none focus-visible:ring-0"
            />
          </div>

          {/* The chat widget is fixed to the viewport's bottom-right, so a
              full-width CTA sitting inside the fold collides with it on
              mobile -- reserve the bubble's width rather than let it sit on
              top of the page's primary action. */}
          <Button
            type="submit"
            disabled={status === "running"}
            className="w-[calc(100%-4.5rem)] bg-[var(--text)] text-[var(--bg-deep)] transition-all duration-200 hover:opacity-90 sm:w-auto"
          >
            {status === "running" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Qualifying… {Math.round(progress)}%
              </>
            ) : message.trim() ? (
              "Run it"
            ) : (
              "Watch it run on an example lead"
            )}
          </Button>

          {status === "running" && (
            <div className="space-y-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(var(--text-rgb),0.1)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <RunSteps progress={progress} />
              <p className="text-xs text-[var(--text)] opacity-50">
                Same steps as a live account — 20–40 seconds start to finish.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-[#FF4438]/30 bg-[#FF4438]/10 px-3.5 py-3 text-sm text-[#FF4438]">
              {error}
            </div>
          )}
        </form>

        {result && (
          <Result
            result={result}
            round={round}
            appliedEdit={appliedEdit}
            editedDraft={editedDraft}
            setEditedDraft={setEditedDraft}
            onRunWithEdit={runWithEdit}
            onReset={resetDemo}
            running={status === "running"}
          />
        )}

        <div className="mt-16 border-t border-[rgba(var(--text-rgb),0.1)] pt-10 text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            Get started
          </div>
          <h2 className="mt-4 font-editorial text-2xl font-medium text-[var(--text)] sm:text-3xl">
            Start free — no card
          </h2>
          {/* Led with "$500/month" before the free pilot, which is the number
              that creates hesitation ahead of the one that removes it. The
              trial genuinely asks for a business name and an email and
              nothing else (see GetStarted's CheckoutCard, skipCheckout:
              true), so that's what goes first; the price still gets said,
              just after. */}
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text)] opacity-70">
            14 days on your own leads, no card required — just a name and an email. $500/month
            after that, cancel anytime.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href="/get-started" onClick={() => track("try_footer_cta")}>
              <Button size="lg" className="bg-[var(--accent)] font-bold text-white hover:bg-[var(--accent-hover)]">
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => window.dispatchEvent(new CustomEvent("fieldsta:open-chat"))}
              className="border-0 bg-transparent text-[var(--text)] opacity-70 transition-opacity hover:bg-transparent hover:opacity-100"
            >
              Talk to Harper
            </Button>
          </div>
          <p className="mt-3 text-xs text-[var(--text)] opacity-60">
            Or{" "}
            <Link to="/#demo" className="underline underline-offset-2 hover:opacity-100">
              tell us about your setup by email
            </Link>{" "}
            instead.
          </p>
        </div>
      </div>
      <SalesChatWidget />
    </div>
  );
}

// The run is a single opaque request -- the agents service reports no
// intermediate progress -- so these are paced off the same eased timer the
// bar uses, not real telemetry. They're the actual stages the Responder goes
// through, in order, which is why the finished result has a criteria
// breakdown and research notes in it; what's estimated is when each one
// lands, not whether it happens. A bar alone over 40 seconds reads as a hang,
// and this is the stretch where a visitor who just clicked has the least
// invested and the most reason to leave.
const RUN_STEPS = [
  "Reading the message",
  "Checking it against qualifying criteria",
  "Filling in what the message left out",
  "Drafting the reply",
];

function RunSteps({ progress }) {
  const activeStep = Math.min(RUN_STEPS.length - 1, Math.floor(progress / (100 / RUN_STEPS.length)));
  return (
    <ul className="space-y-2">
      {RUN_STEPS.map((step, i) => {
        const done = i < activeStep;
        const active = i === activeStep;
        return (
          <li
            key={step}
            className={
              "flex items-center gap-2.5 text-[13px] transition-opacity duration-300 " +
              (done ? "opacity-45" : active ? "opacity-100" : "opacity-25")
            }
          >
            <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-[var(--text)]" />
              )}
            </span>
            <span className="text-[var(--text)]">{step}</span>
          </li>
        );
      })}
    </ul>
  );
}

// A visitor who has never seen a result has no reason to spend 20-40 seconds
// waiting for one -- the page asked for the wait before showing what it buys.
// This is a static, clearly-labelled sample of the shape a real result comes
// back in, sized to stay compact enough that the primary CTA is still above
// the fold. It unmounts the moment a real run starts, so it never sits next
// to (or gets mistaken for) the visitor's own result.
function SamplePeek() {
  const { Icon } = VERDICT.qualified;
  return (
    <div className="animate-fade-up mt-6">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text)] opacity-50">
        What comes back — example
      </div>
      <div className="flex items-center gap-4">
        <ScoreRing score={88} size={52} stroke={4} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <Icon className="h-3 w-3" />
            {VERDICT.qualified.label}
          </span>
          <p className="truncate text-[13px] leading-relaxed text-[var(--text)] opacity-70">
            &ldquo;Thanks for reaching out — I can get someone out Thursday morning to take a
            look before your adjuster comes…&rdquo;
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--text)] opacity-55">
        Score, criteria checked, and a drafted reply — about 30 seconds.
      </p>
    </div>
  );
}

function ResultCta() {
  return (
    <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row sm:items-center">
      <a href="/get-started" onClick={() => track("try_result_cta")}>
        <Button
          size="lg"
          className="bg-[var(--accent)] font-bold text-white hover:bg-[var(--accent-hover)]"
        >
          Run this on your own leads
          <ArrowRight className="h-4 w-4" />
        </Button>
      </a>
      <p className="text-[13px] leading-relaxed text-[var(--text)] opacity-60">
        14 days free, no card — just your name and email.
      </p>
    </div>
  );
}

function Result({ result, round, appliedEdit, editedDraft, setEditedDraft, onRunWithEdit, onReset, running }) {
  const verdict = VERDICT[result.qualification] ?? VERDICT.needs_more_info;
  const { Icon } = verdict;
  // Approve/Reject is per-result: this component stays mounted across a
  // round-2 run, so without the reset the previous lead's decision would
  // still be showing under a brand new draft.
  const [decision, setDecision] = useState(null);
  useEffect(() => setDecision(null), [result]);

  return (
    <div className="animate-fade-up mt-10 space-y-4">
      {round === 2 && appliedEdit && (
        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/[0.06] px-4 py-3 text-sm text-[var(--text)]">
          <span className="text-base">✨</span>
          <span>
            <span className="font-semibold text-[var(--accent)]">That correction just applied itself.</span>{" "}
            This is a different lead, and it already knows what you fixed.
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {result.score && (
          <div className="flex items-center gap-3">
            <ScoreRing score={result.score.score} size={64} stroke={5} />
            <span className="max-w-[9rem] text-xs leading-snug text-[var(--text)] opacity-70">
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
          <span className="text-[11px] text-[var(--text)] opacity-60">Flagged for human review</span>
        )}
      </div>

      <div className="space-y-4 border-t border-[rgba(var(--text-rgb),0.1)] pt-5">
        <Block title={result.score ? `Why this scored ${result.score.score}, not 100` : "Why"}>
          <p>{result.reasoning}</p>
        </Block>

        {result.criteriaBreakdown?.length > 0 && (
          <Block title="Criteria checked">
            <ul className="space-y-2.5">
              {result.criteriaBreakdown.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CritMark met={c.met} />
                  <div>
                    <div className="font-medium text-[var(--text)]">{c.criterion}</div>
                    <div className="mt-0.5 text-[13px] text-[var(--text)] opacity-70">{c.evidence}</div>
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

        {result.researchNotes && (
          <Block title="Research Harper did">
            <p>{result.researchNotes}</p>
          </Block>
        )}

        {result.reviewReason && (
          <Block title="What a reviewer should check">
            <p>{result.reviewReason}</p>
          </Block>
        )}
      </div>

      <div className="space-y-3 border-t border-[rgba(var(--text-rgb),0.1)] pt-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text)] opacity-60">
          Drafted reply — nothing sends until a human approves it
        </div>
        {result.subject && (
          <div className="text-sm font-medium text-[var(--text)]">{result.subject}</div>
        )}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text)] opacity-80">
          {result.draftReply}
        </p>
      </div>

      {/* These are the highest-intent clicks on the page -- the visitor is
          reaching for the product, not reading about it. They used to do
          nothing at all (no handler), which reads as broken software at
          exactly the wrong moment. They can't really send anything from a
          demo, so they resolve into the honest version of what each choice
          means on a live account. */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => setDecision("approved")}
          aria-pressed={decision === "approved"}
          className={
            "flex-1 border-b-2 px-4 py-2 text-sm font-semibold text-emerald-400 transition-all " +
            (decision === "approved"
              ? "border-emerald-400 opacity-100"
              : "border-transparent opacity-70 hover:border-emerald-400/40 hover:opacity-100")
          }
        >
          ✓ Approve &amp; Send
        </button>
        <button
          type="button"
          onClick={() => setDecision("rejected")}
          aria-pressed={decision === "rejected"}
          className={
            "flex-1 border-b-2 px-4 py-2 text-sm font-semibold text-red-400 transition-all " +
            (decision === "rejected"
              ? "border-red-400 opacity-100"
              : "border-transparent opacity-70 hover:border-red-400/40 hover:opacity-100")
          }
        >
          ✕ Reject
        </button>
      </div>

      {decision && (
        <div
          role="status"
          className={
            "rounded-lg border px-4 py-3 text-sm leading-relaxed " +
            (decision === "approved"
              ? "border-emerald-400/30 bg-emerald-400/10 text-[var(--text)]"
              : "border-red-400/30 bg-red-400/10 text-[var(--text)]")
          }
        >
          {decision === "approved" ? (
            <>
              <span className="font-medium text-emerald-400">That&apos;s the whole loop.</span>{" "}
              On a live account this reply would be on its way to the lead within seconds of them
              writing in — no one waiting on a free moment to get to it.{" "}
              <span className="opacity-70">Nothing was sent from this demo.</span>
            </>
          ) : (
            <>
              <span className="font-medium text-red-400">Rejected — and that&apos;s the useful part.</span>{" "}
              On a live account nothing goes out, and if you fix the draft instead of binning it, that
              correction becomes the example it follows next time.{" "}
              {round === 1 ? (
                <span className="opacity-70">Try it in the box below.</span>
              ) : (
                <span className="opacity-70">Nothing was sent from this demo.</span>
              )}
            </>
          )}
        </div>
      )}

      {/* The result landing is the highest-intent moment on the site, and it
          used to be the furthest thing from an ask -- two explainer cards and
          an optional second 30s run sat between it and the only CTA, which
          was at the very bottom of the page. Leads with "no card required"
          rather than the price: /get-started asks for a name and an email and
          nothing else, which is the fact that actually unblocks a click. */}
      <ResultCta />

      {round === 1 ? (
        <div className="space-y-3 border-t border-[var(--accent)]/40 pt-5">
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
              Now watch it become yours
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--text)] opacity-80">
              Edit the reply below — tone, an offer to cut, anything a reviewer would actually
              change. Then run a different lead and watch that exact correction apply on its
              own. No retraining, no waiting for an update.
            </p>
          </div>
          <textarea
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            placeholder={result.draftReply}
            rows={4}
            className="w-full resize-none border-0 border-b border-[rgba(var(--text-rgb),0.15)] bg-transparent px-0 py-2.5 text-sm leading-relaxed text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.3)] transition-colors focus-visible:border-[var(--accent)]/60 focus-visible:outline-none focus-visible:ring-0"
          />
          <Button
            type="button"
            disabled={!editedDraft.trim() || running}
            onClick={onRunWithEdit}
            className="bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running a new lead with your edit…
              </>
            ) : (
              "Run a new lead with this edit"
            )}
          </Button>
        </div>
      ) : (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[var(--text)] opacity-70 underline underline-offset-2 hover:text-[var(--text)]"
          >
            Start over with a fresh lead
          </button>
        </div>
      )}

      {/* Was two cards of six and four bullets. Most of it restated what the
          visitor had just watched happen ("this same scoring, on every lead",
          "every correction becomes a rule") and pushed the ask further down
          the page. What's left is only what the demo genuinely can't show:
          where a real reply goes, and that a human gates every booking. */}
      <div className="space-y-2 pt-2 text-sm text-[var(--text)] opacity-70">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
          On a live account
        </div>
        <ul className="space-y-1.5">
          <li>→ Reply goes to {result.leadEmail || "the lead"} once approved</li>
          {/* verdict.label, not result.qualification -- the raw value is a
              snake_case enum, so this line read "Pushed to HubSpot as
              needs_more_info" on two of the three possible outcomes. */}
          <li>→ Pushed to HubSpot as {verdict.label}, your team notified in Slack</li>
          <li>→ A human reviews every booking before it&apos;s confirmed</li>
        </ul>
        <p className="pt-0.5 text-xs opacity-70">
          Nothing was sent, pushed, or notified here — no account is connected.
        </p>
      </div>
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
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text)] opacity-60">{title}</div>
      <div className="text-sm leading-relaxed text-[var(--text)] opacity-80">{children}</div>
    </div>
  );
}
