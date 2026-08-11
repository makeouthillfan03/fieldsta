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
import SiteHeader from "@/components/SiteHeader";
import { getAttribution, reportFunnelEvent } from "@/lib/attribution.js";
import { trackLinkedInConversion } from "@/lib/linkedin.js";
import { getSampleRun, getWeakRun } from "@/data/sampleRuns.js";

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
    weakSample:
      "Hi! I'm a second-year student writing a paper on AI in sales and I found your site. Could you send over any documentation or whitepapers you have? Not looking to buy anything, just for my coursework.",
  },
  {
    value: "home-services",
    label: "Home services",
    sample:
      "We had that big hailstorm come through last week and I'm seeing dented gutters and shingles in the yard. Insurance adjuster is coming Friday but I want a roofer's opinion before then. Can someone come take a look this week?",
    sample2:
      "Noticed a soft spot on the roof near the chimney after all that rain last week. Nothing's leaking yet but I'd rather get ahead of it. Could someone swing by sometime this week to take a look?",
    weakSample:
      "hey do you guys sell gift cards? looking for something for my brother in law, he just bought a house. thanks",
  },
  {
    value: "legal",
    label: "Legal intake",
    sample:
      "I was rear ended on the highway last Tuesday. Other driver admitted fault to the officer but their insurance is already lowballing me. I have a police report and went to urgent care same day, still getting neck pain. Do you handle cases like this?",
    sample2:
      "Slipped on a wet floor at a grocery store two weeks ago, no warning sign was out. Hurt my wrist pretty bad, went to the ER same day and got an X-ray. Store manager took a report. Is this something you'd take on?",
    weakSample:
      "My landlord put my rent up by $40 a month and I don't think that's fair. Is that something you'd be able to help with?",
  },
];

const VERDICT = {
  qualified: {
    label: "Qualified",
    Icon: CheckCircle2,
    flatClassName: "text-emerald-400",
  },
  needs_more_info: {
    label: "Needs more info",
    Icon: HelpCircle,
    flatClassName: "text-amber-400",
  },
  not_a_fit: {
    label: "Not a fit",
    Icon: XCircle,
    flatClassName: "text-[#FF4438]",
  },
};

export default function LiveDemo() {
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
  // How long the run actually took. The page used to apologise for this
  // number ("20-40 seconds start to finish") when it's the thing being sold
  // -- the pitch is that a lead goes cold in minutes, so the elapsed time IS
  // the proof. Measured, not estimated: set from the real request duration.
  const [elapsedMs, setElapsedMs] = useState(null);
  // A captured run has no duration this visitor experienced, so the elapsed
  // line has to stay off for it -- showing "0 seconds" for a replay, next to
  // copy asking how long their process takes, would be the page's one
  // measured claim turned into a lie.
  const [resultIsCached, setResultIsCached] = useState(false);

  const active = VERTICALS.find((v) => v.value === vertical);

  // Grows to fit its content instead of scrolling. A fixed height can't win
  // here: tall enough for a pasted lead pushes the CTA under the fold on a
  // small phone, short enough to protect the fold makes the sample scroll
  // the moment it's filled in. Auto-sizing gets both -- compact while empty,
  // never a scrollbar once there's text.
  const messageRef = useRef(null);
  useEffect(() => {
    const el = messageRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

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
  // Registers an engaged session with Vercel Analytics, which is what keeps
  // it out of the bounce bucket. Two things had to be true and neither was:
  //
  //   1. It must change the PATHNAME. A search param does nothing -- probed
  //      in dev, pushState to /try?probe fired no [view], /try/probe fired one.
  //      This used to set ?step= only.
  //   2. It must go through pushState. replaceState fires nothing either,
  //      even to a new pathname -- and this used { replace: true } precisely
  //      so it wouldn't add a back-button stop.
  //
  // So every visitor who ran the demo still counted as a bounce, which is
  // the exact thing this was written to fix.
  //
  // Pushes once and only once, then falls back to replace: one pageview is
  // all it takes to stop being a bounce, and pushing every step would make
  // Back walk /try/completed -> /try/running -> /try before leaving the page.
  const hasPushedRef = useRef(false);
  function markVirtualPageview(step) {
    const target = `/try/${step}`;
    if (location.pathname === target) return;
    const replace = hasPushedRef.current;
    hasPushedRef.current = true;
    navigate({ pathname: target, search: location.search }, { replace });
  }



  // One request, timed from the moment it actually leaves. Split out of run()
  // so the round-2 prefetch can start the same call early and hand the
  // in-flight promise back in.
  function startQualify({ message: msg, priorEdit }) {
    const startedAt = Date.now();
    return fetch(`${AGENTS_BASE}/api/demo-qualify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vertical,
        message: msg,
        ...(priorEdit ? { priorEdit } : {}),
      }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      return { data, elapsedMs: Date.now() - startedAt };
    });
  }

  async function run(e, overrides = {}) {
    e?.preventDefault?.();
    // An empty box is the common case for ad traffic, who arrive with no lead
    // in hand -- submitting anyway falls back to the vertical's sample and
    // fills the textarea so they can see exactly what got run, rather than
    // hitting a disabled button and leaving. Typing still wins over the sample.
    const msg = (overrides.message ?? message).trim();
    if (!msg || status === "running") return;
    const usedSample = msg === active.sample;
    setStatus("running");
    setError("");
    setResult(null);

    // round 1 (no priorEdit) is the actual funnel entry -- round 2 is a
    // bonus rerun of an already-engaged visitor, not a fresh attempt, so it
    // shouldn't inflate "how many people tried the demo" numbers.
    const attribution = getAttribution();
    if (!overrides.priorEdit) {
      track("demo_started", { ...attribution, vertical, usedSample });
      trackLinkedInConversion("demoStarted");
      reportFunnelEvent("demo_started", { vertical, usedSample });
      markVirtualPageview("running");
    }

    try {
      const { data, elapsedMs: took } = await startQualify({
        message: msg,
        priorEdit: overrides.priorEdit,
      });
      setElapsedMs(took);
      setResultIsCached(false);
      setResult(data);
      setStatus("done");
      if (overrides.priorEdit) setAppliedEdit(overrides.priorEdit);
      if (!overrides.priorEdit) {
        track("demo_completed", { ...attribution, vertical, qualification: data.qualification || "unknown" });
        trackLinkedInConversion("demoCompleted");
        reportFunnelEvent("demo_completed", { vertical, qualification: data.qualification || "unknown" });
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

  // "It will tell you no when the answer is no" was an assertion with nothing
  // behind it -- every sample on the page is a lead that qualifies, so nobody
  // ever saw a refusal. Watching it turn something down does more for a
  // sceptical visitor than another success does, and it's the claim the page
  // already makes. Runs the same endpoint on a deliberately out-of-ICP lead;
  // the verdict is still whatever the agent genuinely returns.
  // With the captured run already on screen, "run the example" would spend
  // one of three hourly runs to recompute an answer the visitor is currently
  // looking at. So an empty box no longer fires a request -- it puts the
  // cursor where their own lead goes, which is the only input we don't
  // already have an answer for. Not a dead button: it does something, and
  // nothing is being withheld behind it any more.
  const [needsLead, setNeedsLead] = useState(false);
  // Switching vertical swaps in an entirely different captured run, so it is
  // the cheapest real look at the product on the page -- and it fired
  // nothing at all, neither analytics nor a route change. Same reasoning as
  // markVirtualPageview itself: this demo lives on one URL, so engagement
  // that isn't a navigation is invisible unless we say so. A visitor who
  // reads two verticals' results and leaves understood more than one who
  // clicked run and bounced, and was counted worse.
  function selectVertical(value) {
    if (value === vertical) return;
    setVertical(value);
    track("try_vertical_switch", { vertical: value });
    markVirtualPageview("explored");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      setNeedsLead(true);
      messageRef.current?.focus();
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setNeedsLead(false);
    run(e);
  }

  // The rejection demo always sends the same fixed lead, so a live call here
  // spends one of the visitor's three hourly runs to recompute an answer we
  // already have verbatim. Replaying the capture makes it instant and free,
  // and leaves the live budget for leads we haven't seen -- theirs. Falls
  // back to a real run only where no capture exists yet.
  function runWeak() {
    if (status === "running") return;
    const msg = active.weakSample;
    const cached = getWeakRun(vertical);
    setMessage(msg);
    if (cached) {
      track("demo_weak_lead", { vertical, cached: true });
      setError("");
      setElapsedMs(null);
      setResultIsCached(true);
      setResult(cached);
      setRound(1);
      setStatus("done");
      markVirtualPageview("completed");
      return;
    }
    track("demo_weak_lead", { vertical, cached: false });
    run(null, { message: msg });
  }

  function runWithEdit() {
    if (!editedDraft.trim() || !result?.draftReply) return;
    const edited = editedDraft.trim();
    const priorEdit = { draft: result.draftReply, edited };
    const nextMessage = active.sample2 || active.sample;
    setMessage(nextMessage);
    setRound(2);
    track("demo_edit_rerun", { vertical });
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
        </div>

        {!result && status !== "running" && (
          <SampleRun
            vertical={vertical}
            onRunOwn={() => {
              track("try_run_own_from_peek", { vertical });
              messageRef.current?.focus({ preventScroll: false });
              messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
          <div className="space-y-2">
            {/* Was "What kind of business" -- which reads as a form field to
                fill in before the real thing happens. It isn't: each of these
                swaps the answered example above for a different real one, so
                it's the fastest look at the product on the page and the label
                should say so. */}
            <Label className="text-xs uppercase tracking-[0.18em] text-[var(--text)] opacity-60">
              See it on a different business
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {VERTICALS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => selectVertical(v.value)}
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
            {/* The placeholder already says what this is and that it's
                optional, so the label was a second copy of the same sentence
                costing a line of fold. Kept for screen readers. */}
            <Label htmlFor="leadMessage" className="sr-only">
              What the lead said
            </Label>
            <textarea
              id="leadMessage"
              ref={messageRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) setNeedsLead(false);
              }}
              rows={2}
              maxLength={4000}
              placeholder="Paste or type what a lead sent you…"
              className="w-full resize-none overflow-hidden border-0 border-b border-[rgba(var(--text-rgb),0.15)] bg-transparent px-0 py-2.5 text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.3)] transition-colors duration-200 focus-visible:border-[rgba(var(--text-rgb),0.45)] focus-visible:outline-none focus-visible:ring-0"
            />
          </div>

          {/* The chat widget is fixed to the viewport's bottom-right, so a
              full-width CTA sitting inside the fold collides with it on
              mobile -- reserve the bubble's width rather than let it sit on
              top of the page's primary action. */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
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
              ) : (
                "Run it on your own lead"
              )}
            </Button>
            {needsLead && (
              <p className="w-full text-[13px] text-[var(--accent)]">
                Paste a lead above and it runs live on that.{" "}
                {/* The refusal used to dead-end the exact visitor the cold
                    campaign paid to get here — someone with no lead text in
                    hand. Bridge them to the cached rejection replay (free,
                    instant) instead of scolding them; the live paste-run
                    stays the primary path for anyone who has a real lead. */}
                <button
                  type="button"
                  onClick={runWeak}
                  className="underline underline-offset-2 hover:opacity-70"
                >
                  No lead handy? Watch it turn one down instead
                </button>
              </p>
            )}
            {/* The only action on this page that costs the visitor nothing
                and still produces a result they haven't seen -- the primary
                CTA now requires them to write out a real lead first. It was
                a 13px 60%-opacity link next to a solid button, which is how
                you style an afterthought, not the one thing a visitor with
                no lead to hand can actually do. */}
            {status !== "running" && (
              <Button
                type="button"
                variant="outline"
                onClick={runWeak}
                className="border-[rgba(var(--text-rgb),0.25)] bg-transparent text-[var(--text)] hover:bg-[rgba(var(--text-rgb),0.05)]"
              >
                Watch it turn one down
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

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
            elapsedMs={elapsedMs}
            isCached={resultIsCached}
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
// A real captured run (src/data/sampleRuns.js), rendered on load so the
// product is visible in zero seconds instead of behind a 20-40s wait a cold
// visitor has no reason to spend. Deliberately shows the verdict and the
// drafted reply verbatim -- including when the agent says "needs more info"
// rather than "qualified", which is the honest thing it actually returns for
// these samples and a stronger proof than a hand-picked win would be.
//
// Labelled as captured, with the live run one tap away, so "same agent as
// the paying accounts, not a recording" stays true: this IS what that agent
// returned, and the visitor can make it do it again on their own lead.
// Fired at most once per page load each, however many times SampleRun
// mounts (it unmounts during a live run and comes back on reset). Without
// these, a cold visitor who reads the pre-answered example and leaves —
// the exact experience the sequence emails promise — registered as
// nothing, so the funnel could only count them as a failure. "Viewed"
// means the example rendered; "read" means its end actually entered the
// viewport, which is as close to read-through as a static page can see.
let exampleViewedTracked = false;
let exampleReadTracked = false;

function SampleRun({ vertical, onRunOwn }) {
  const run = getSampleRun(vertical);
  const lead = VERTICALS.find((v) => v.value === vertical)?.sample;
  const endRef = useRef(null);

  useEffect(() => {
    if (!run) return;
    const attribution = getAttribution();
    if (!exampleViewedTracked) {
      exampleViewedTracked = true;
      track("try_example_viewed", { ...attribution, vertical });
    }
    const el = endRef.current;
    if (exampleReadTracked || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !exampleReadTracked) {
          exampleReadTracked = true;
          track("try_example_read", { ...attribution, vertical });
          trackLinkedInConversion("exampleRead");
          io.disconnect();
        }
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // A vertical with no capture yet still gets the CTA -- losing the whole
  // block (and with it the only trial link above the fold) is a worse
  // failure than showing no sample. Never substitute another vertical's run:
  // it would be captioned as this one's and it isn't.
  if (!run) {
    return (
      <div className="mt-6">
        <SampleRunCta onRunOwn={onRunOwn} />
      </div>
    );
  }
  const verdict = VERDICT[run.qualification] ?? VERDICT.needs_more_info;
  const { Icon } = verdict;
  const firstPara = (run.draftReply || "").split("\n\n").filter(Boolean)[1] || run.draftReply;

  return (
    <div className="animate-fade-up mt-6 space-y-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text)] opacity-50">
        What this agent returned — a captured run
      </div>

      {/* The reply means little without the message that produced it -- the
          whole story is lead in, judgement and draft out, and that has to be
          legible without scrolling or clicking. */}
      {lead && (
        <p
          className="border-l-2 border-[rgba(var(--text-rgb),0.15)] pl-3 text-[13px] leading-relaxed text-[var(--text)] opacity-55"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {lead}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        {run.score && (
          <div className="flex items-center gap-3">
            <ScoreRing score={run.score.score} size={56} stroke={4} />
            <span className="max-w-[9rem] text-xs leading-snug text-[var(--text)] opacity-70">
              {run.score.tierLabel}
            </span>
          </div>
        )}
        <span className={"inline-flex items-center gap-1.5 text-xs font-medium " + verdict.flatClassName}>
          <Icon className="h-3.5 w-3.5" />
          {verdict.label}
        </span>
        {run.needsHumanReview && (
          <span className="text-[11px] text-[var(--text)] opacity-60">Flagged for human review</span>
        )}
      </div>

      <div className="border-t border-[rgba(var(--text-rgb),0.1)] pt-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text)] opacity-50">
          What it drafted back
        </div>
        <p
          className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text)] opacity-85"
          style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {firstPara}
        </p>
      </div>

      <SampleRunCta onRunOwn={onRunOwn} />
      {/* Sentinel for the try_example_read observer above — zero height,
          sits after the CTA so "read" means the whole block was passed. */}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}

function SampleRunCta({ onRunOwn }) {
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <a href="/get-started" onClick={() => track("try_peek_cta")}>
        <Button className="bg-[var(--accent)] font-bold text-white hover:bg-[var(--accent-hover)]">
          Start free trial
          <ArrowRight className="h-4 w-4" />
        </Button>
      </a>
      <button
        type="button"
        onClick={onRunOwn}
        className="text-[13px] text-[var(--text)] opacity-60 transition-opacity hover:opacity-100"
      >
        Or run it live on your own lead ↓
      </button>
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

// Turns the question the elapsed line already asks into an input, using only
// arithmetic on numbers the visitor supplies and the run they just watched.
//
// Deliberately NOT a revenue figure. "You're losing $47,000 a month" needs a
// close rate and a deal size we don't have and a slow-response penalty we'd
// have to invent -- and an invented multiplier is exactly what makes a
// sophisticated buyer stop believing the rest of the page. Leads x wait is a
// quantity that's simply true, and "1,200 hours a month of leads sitting
// unanswered" lands harder than a number they can tell we made up.
function WaitMath({ elapsedMs }) {
  const [leads, setLeads] = useState("");
  const [hours, setHours] = useState("");

  const leadsNum = Number(leads);
  const hoursNum = Number(hours);
  const ready = leadsNum > 0 && hoursNum > 0 && Number.isFinite(leadsNum) && Number.isFinite(hoursNum);

  const theirs = ready ? leadsNum * hoursNum : 0;
  const ours = ready ? (leadsNum * (elapsedMs / 1000)) / 3600 : 0;

  // Fires once per completed pair, debounced so half-typed numbers ("4" on
  // the way to "400") don't each report. Worth capturing beyond funnel
  // curiosity: this is real prospects self-reporting their lead volume and
  // current response time, which is the ICP data the outbound targeting is
  // otherwise guessing at.
  const reported = useRef(null);
  useEffect(() => {
    if (!ready) return;
    const key = `${leadsNum}:${hoursNum}`;
    if (reported.current === key) return;
    const timer = setTimeout(() => {
      reported.current = key;
      track("demo_wait_math", { leadsPerMonth: leadsNum, responseHours: hoursNum });
    }, 1200);
    return () => clearTimeout(timer);
  }, [ready, leadsNum, hoursNum]);
  const fmt = (n) => (n >= 10 ? Math.round(n).toLocaleString() : n.toFixed(1));

  const fieldClass =
    "w-16 border-0 border-b border-[rgba(var(--text-rgb),0.25)] bg-transparent px-0 py-0.5 text-center text-[var(--text)] transition-colors focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-0";

  return (
    <div className="space-y-2 pt-1 text-sm text-[var(--text)]">
      <p className="opacity-70">
        About{" "}
        <input
          type="number"
          min="1"
          inputMode="numeric"
          value={leads}
          onChange={(e) => setLeads(e.target.value)}
          placeholder="400"
          aria-label="Leads per month"
          className={fieldClass}
        />{" "}
        leads a month, and roughly{" "}
        <input
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="3"
          aria-label="Hours before someone replies"
          className={fieldClass}
        />{" "}
        hours before someone replies?
      </p>
      {ready && (
        <p className="leading-relaxed">
          <span className="font-medium">{fmt(theirs)} hours a month</span>
          <span className="opacity-70">
            {" "}
            of leads sitting unanswered. At the speed you just watched, that same volume waits{" "}
          </span>
          <span className="font-medium">{fmt(ours)} hours</span>
          <span className="opacity-70">.</span>
        </p>
      )}
    </div>
  );
}

function Result({ result, round, appliedEdit, editedDraft, setEditedDraft, onRunWithEdit, onReset, running, elapsedMs, isCached }) {
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
        <div className="flex items-center gap-2.5 border-l-0 text-sm text-[var(--text)]">
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
            "inline-flex items-center gap-1.5 text-xs font-medium " + verdict.flatClassName
          }
        >
          <Icon className="h-3.5 w-3.5" />
          {verdict.label}
        </span>
        {result.needsHumanReview && (
          <span className="text-[11px] text-[var(--text)] opacity-60">Flagged for human review</span>
        )}
      </div>

      {/* The elapsed time is the pitch, not an apology for a wait -- the
          whole product is that a lead goes cold before anyone gets to it.
          Deliberately asks rather than citing a benchmark: a number the
          visitor supplies about their own process persuades harder than a
          stat we'd have to source, and we don't have to stand behind
          someone else's survey to make the point. */}
      {isCached && (
        <p className="text-[13px] text-[var(--text)] opacity-55">
          A captured run on this lead — paste your own below to watch it live.
        </p>
      )}

      {elapsedMs != null && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--text)]">
            <span className="font-medium">
              {(elapsedMs / 1000).toFixed(0)} seconds
            </span>
            <span className="opacity-70"> from message to drafted reply.</span>
          </p>
          <WaitMath elapsedMs={elapsedMs} />
        </div>
      )}

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
          className="pt-1 text-sm leading-relaxed text-[var(--text)] opacity-80"
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
