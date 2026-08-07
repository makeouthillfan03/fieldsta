import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { track } from "@vercel/analytics/react";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreRing } from "@/components/ScoreRing";
import SalesChatWidget from "@/components/SalesChatWidget";
import Triangle from "@/components/Triangle";
import ParticleSkyline from "@/components/ParticleSkyline";
import { ThemeToggle, useIsDarkTheme } from "@/components/ThemeToggle";
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

  async function run(e, overrides = {}) {
    e?.preventDefault?.();
    const msg = overrides.message ?? message;
    if (!msg.trim() || status === "running") return;
    setStatus("running");
    setError("");
    setResult(null);

    // round 1 (no priorEdit) is the actual funnel entry -- round 2 is a
    // bonus rerun of an already-engaged visitor, not a fresh attempt, so it
    // shouldn't inflate "how many people tried the demo" numbers.
    const attribution = getAttribution();
    if (!overrides.priorEdit) {
      track("demo_started", { ...attribution, vertical });
      reportFunnelEvent("demo_started", { vertical });
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

        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            Live demo
          </div>
          <h1 className="font-editorial text-3xl font-medium tracking-tight sm:text-4xl">
            Paste a real lead. Watch it stop going cold.
          </h1>
          <p className="max-w-lg text-sm text-[var(--text)] opacity-70">
            Same agent running on paying accounts right now — not a script, not a recording. If
            your lead genuinely wouldn&apos;t qualify, this will say so.
          </p>
        </div>

        <form onSubmit={run} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.18em] text-[var(--text)] opacity-60">
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
                      ? "border-[rgba(var(--text-rgb),0.4)] bg-[rgba(var(--text-rgb),0.06)] scale-[1.02]"
                      : "border-[rgba(var(--text-rgb),0.1)] hover:border-[rgba(var(--text-rgb),0.25)] hover:bg-[rgba(var(--text-rgb),0.02)]")
                  }
                >
                  <div className="text-sm font-medium text-[var(--text)]">{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="leadMessage"
                className="text-xs uppercase tracking-[0.18em] text-[var(--text)] opacity-60"
              >
                What the lead said
              </Label>
              <button
                type="button"
                onClick={() => setMessage(active.sample)}
                className="text-[11px] text-[var(--text)] opacity-70 underline underline-offset-2 hover:opacity-100"
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
              className="w-full rounded-lg border border-[rgba(var(--text-rgb),0.15)] bg-[rgba(var(--text-rgb),0.04)] px-3.5 py-3 text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.35)] transition-colors duration-200 focus-visible:border-[rgba(var(--text-rgb),0.35)] focus-visible:outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={!message.trim() || status === "running"}
            className="w-full bg-[var(--text)] text-[var(--bg-deep)] transition-all duration-200 hover:opacity-90 sm:w-auto"
          >
            {status === "running" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Qualifying… {Math.round(progress)}%
              </>
            ) : (
              "Run it"
            )}
          </Button>

          {status === "running" && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(var(--text-rgb),0.1)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text)] opacity-60">
                Reading the message and checking it against qualifying criteria — the same steps
                as a live account, 20–40 seconds start to finish.
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
            Run this on your own leads
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text)] opacity-70">
            Every lead that isn&apos;t running through this right now is doing exactly what you just
            watched — except nobody&apos;s catching it. $500/month, free pilot to start, cancel anytime.
          </p>
          <Button
            size="lg"
            onClick={() => window.dispatchEvent(new CustomEvent("fieldsta:open-chat"))}
            className="mt-6 bg-[var(--text)] text-[var(--bg-deep)] hover:opacity-90"
          >
            Talk to Harper
            <ArrowRight className="h-4 w-4" />
          </Button>
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

      <Card className="space-y-4 border-[rgba(var(--text-rgb),0.1)] bg-[rgba(var(--text-rgb),0.03)] p-5">
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
      </Card>

      <Card className="space-y-3 border-[rgba(var(--text-rgb),0.1)] bg-[rgba(var(--text-rgb),0.03)] p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text)] opacity-60">
          Drafted reply — nothing sends until a human approves it
        </div>
        {result.subject && (
          <div className="text-sm font-medium text-[var(--text)]">{result.subject}</div>
        )}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text)] opacity-80">
          {result.draftReply}
        </p>
      </Card>

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
            "flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-emerald-400 transition-all " +
            (decision === "approved"
              ? "bg-emerald-500/30 ring-1 ring-emerald-400/50"
              : "bg-emerald-500/20 hover:bg-emerald-500/30")
          }
        >
          ✓ Approve &amp; Send
        </button>
        <button
          type="button"
          onClick={() => setDecision("rejected")}
          aria-pressed={decision === "rejected"}
          className={
            "flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-red-400 transition-all " +
            (decision === "rejected"
              ? "bg-red-500/30 ring-1 ring-red-400/50"
              : "bg-red-500/20 hover:bg-red-500/30")
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

      {round === 1 ? (
        <Card className="space-y-3 border-[var(--accent)]/40 bg-[var(--accent)]/[0.05] p-5 shadow-lg shadow-[var(--accent)]/5">
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
            className="w-full rounded-lg border border-[rgba(var(--text-rgb),0.15)] bg-[rgba(var(--text-rgb),0.04)] px-3.5 py-3 text-sm leading-relaxed text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.35)] focus-visible:border-[var(--accent)]/50 focus-visible:outline-none"
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
        </Card>
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

      <Card className="space-y-3 border-[rgba(var(--text-rgb),0.1)] bg-[rgba(var(--text-rgb),0.03)] p-5">
        <Block title="On a live account, this is what would happen next">
          <ul className="space-y-2 text-sm text-[var(--text)] opacity-80">
            <li>→ Reply goes to {result.leadEmail || "lead@example.com"} once approved</li>
            {/* verdict.label, not result.qualification -- the raw value is a
                snake_case enum, so this line read "Pushed to HubSpot as
                needs_more_info" on two of the three possible outcomes. */}
            <li>→ Pushed to HubSpot as {verdict.label}</li>
            <li>→ Notification posted to your team Slack</li>
            <li>→ Meeting link added if they accept</li>
          </ul>
          <p className="pt-1 text-xs text-[var(--text)] opacity-60">
            Nothing was actually sent, pushed, or notified — this is a demo, and no account is connected.
          </p>
        </Block>
      </Card>

      <Card className="space-y-3 border-[rgba(var(--text-rgb),0.1)] bg-[rgba(var(--text-rgb),0.03)] p-5">
        <Block title="Not a one-time trick — this is what every lead gets">
          <ul className="space-y-2 text-sm text-[var(--text)] opacity-80">
            <li>This same scoring and breakdown, on every lead that comes in — not just this one</li>
            <li>Every correction you make becomes a permanent rule, exactly like you just watched</li>
            <li>A human reviews every booking before it&apos;s confirmed</li>
            <li>Customize what email replies come from</li>
            <li>Connect HubSpot, Meta, Slack, Google Calendar</li>
            <li>Daily reports on meetings booked &amp; replies sent</li>
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
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text)] opacity-60">{title}</div>
      <div className="text-sm leading-relaxed text-[var(--text)] opacity-80">{children}</div>
    </div>
  );
}
