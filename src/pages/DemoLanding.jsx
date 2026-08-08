import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleSkyline from "@/components/ParticleSkyline";
import { ScoreRing } from "@/components/ScoreRing";
import SalesChatWidget from "@/components/SalesChatWidget";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import Triangle from "@/components/Triangle";
import { ThemeToggle, useIsDarkTheme } from "@/components/ThemeToggle";
import { track } from "@vercel/analytics/react";
import { cn } from "@/lib/utils";

// Clean/engineered monochrome restyle of the cold-call landing page ahead of
// the 2026-07-25 push (replacing an earlier dark-luxury/serif direction that
// read as too old-school). One consistent sans (Inter) throughout, black/
// white base, warm red reserved strictly for bold accents. Same value prop,
// same /api/lead target, same honesty policy — no fabricated logos,
// metrics, testimonials, or claims about where the company is based.
export default function DemoLanding() {
  // The browser tries to scroll to the #demo/#how-it-works anchor before
  // this SPA has rendered that element, so a direct deep link (e.g. one
  // texted during a cold call) lands on the hero instead of the target
  // section. Retry the scroll once mounted.
  useEffect(() => {
    if (!window.location.hash) return;
    const el = document.getElementById(window.location.hash.slice(1));
    el?.scrollIntoView();
  }, []);

  // collect_payment (sales-agent.ts) redirects here on a real completed
  // Stripe checkout -- the one genuine "paid" signal in the whole funnel,
  // as opposed to pilot_created (free, no payment) or checkout_sent (a
  // link was generated, not that anyone actually paid). Strips the param
  // right after firing so a refresh doesn't double-count it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      track("payment_completed");
      params.delete("checkout");
      const next = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (next ? `?${next}` : ""));
    }
  }, []);

  return (
    <div className="font-body bg-[var(--bg)] text-[var(--text)]">
      <Nav />
      <Hero />
      <DemoVideo />
      <LeadReviewDemo />
      <HowItWorks />
      <Features />
      <AlwaysImproving />
      <SetupFlow />
      <WhySwitch />
      <Pricing />
      <DataTrust />
      <FAQ />
      <DemoForm />
      <Footer />
      <SalesChatWidget />
    </div>
  );
}

// Fires once an element enters the viewport, then stays true. Skips the
// observer entirely under prefers-reduced-motion so content is just present,
// not animated in.
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      data-reveal
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}


function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(var(--text-rgb),0.1)] bg-[rgba(var(--bg-rgb),0.9)] backdrop-blur">
      <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center">
        <a href="/" className="flex items-center gap-2 justify-self-start">
          <svg width="24" height="24" viewBox="0 0 200 200" className="text-[var(--text)]" aria-hidden="true">
            <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="2" />
            <g fill="none" stroke="currentColor" strokeWidth="1.2">
              {/* Left building cluster */}
              <rect x="20" y="110" width="15" height="50" />
              <rect x="38" y="85" width="12" height="75" />
              <rect x="53" y="120" width="14" height="40" />
              {/* Center tower */}
              <rect x="72" y="60" width="11" height="100" />
              <polygon points="77.5,50 82,60 73,60" />
              {/* Chrysler building style */}
              <polygon points="85,95 92,85 99,95" />
              <rect x="85" y="95" width="14" height="65" />
              {/* Right cluster */}
              <rect x="105" y="90" width="13" height="70" />
              <rect x="122" y="130" width="11" height="30" />
              <rect x="138" y="105" width="15" height="55" />
              <polygon points="145,100 150,105 140,105" />
              {/* Far right */}
              <rect x="158" y="115" width="20" height="35" />
            </g>
          </svg>
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--text)]">
            Fieldsta
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text)] md:flex">
          <a href="#how-it-works" className="hover:text-[var(--text)]">
            How It Works
          </a>
          <a href="#features" className="hover:text-[var(--text)]">
            Features
          </a>
          <a href="#pricing" className="hover:text-[var(--text)]">
            Pricing
          </a>
          <a href="#faq" className="hover:text-[var(--text)]">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3 justify-self-end">
          <ThemeToggle />
          <a href="/get-started" className="hidden sm:block">
            <Button
              size="sm"
              variant="outline"
              className="border-[rgba(var(--text-rgb),0.25)] text-[var(--text)] hover:bg-[rgba(var(--text-rgb),0.06)]"
            >
              Get Started
            </Button>
          </a>
          <Link to="/try">
            <Button size="sm" className="bg-[var(--text)] text-[var(--bg-deep)] hover:bg-white">
              Try Demo
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const dark = useIsDarkTheme();
  return (
    <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden bg-[var(--bg)]">
      {/* Particle field occupies the upper half and dissolves downward into
          the page, so the headline sits in clean negative space rather than
          fighting the artwork for contrast. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[68%]">
        <ParticleSkyline className="absolute inset-0 h-full w-full" dark={dark} />

        {/* Depth fog across the lower third, so the base of the city
            dissolves rather than terminating on a line. */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_bottom,transparent_0%,rgba(var(--bg-rgb),0.55)_45%,var(--bg)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[var(--bg)] to-transparent" />
      </div>

      {/* Film grain over the whole hero, type included — grain that stops at
          the edge of the artwork reads as a sticker. Kept under 5% so it
          textures the image without muddying text contrast. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 opacity-[0.045] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="container relative z-10 py-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="animate-fade-up font-editorial text-4xl font-medium leading-[1.12] tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
            You already <span className="font-semibold text-[var(--accent)]">paid</span> for the lead.
            <br />
            The <span className="font-semibold text-[var(--accent)]">expensive part</span> is losing it
            <br />
            before anyone replies.
          </h1>

          <p className="animate-fade-up [animation-delay:280ms] mt-8 text-lg font-semibold text-[var(--text)]">
            Your competitor only has to reply first.
          </p>

          <Link
            to="/try"
            className="animate-fade-up [animation-delay:160ms] mt-9 inline-block"
          >
            <Button
              size="lg"
              className="w-full rounded-none bg-[var(--text)] px-7 text-[var(--bg-deep)] hover:opacity-90 sm:w-auto"
            >
              Try Demo
            </Button>
          </Link>
        </div>
      </div>

    </section>
  );
}

function DemoVideo() {
  return (
    <section className="border-t border-[rgba(var(--text-rgb),0.1)] bg-[var(--bg)] py-20">
      <div className="container flex flex-col items-center">
        <div className="animate-fade-up mb-6 text-sm uppercase tracking-[0.18em] text-[var(--text)]">
          Watch it qualify a real lead — start to finish
        </div>
        <div className="animate-fade-up [animation-delay:100ms] w-full max-w-3xl overflow-hidden rounded-2xl border border-[rgba(var(--text-rgb),0.15)] shadow-2xl">
          <video
            src="/demo-video.mp4"
            controls
            preload="metadata"
            playsInline
            className="block w-full bg-black"
          />
        </div>
      </div>
    </section>
  );
}

function LeadReviewDemo() {
  return (
    <section className="border-t border-[rgba(var(--text-rgb),0.1)] bg-[var(--bg)] py-20">
      <div className="container flex flex-col items-center">
        <div className="animate-fade-up mb-6 text-sm uppercase tracking-[0.18em] text-[var(--text)]">
          Know exactly why a lead is worth your time
        </div>
        <div className="animate-fade-up [animation-delay:100ms] w-full max-w-3xl overflow-hidden rounded-2xl border border-[rgba(var(--text-rgb),0.15)] shadow-2xl">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

const EXAMPLE_CRITERIA = [
  {
    criterion: "Property is within the service area",
    met: true,
    evidence: "“About 20 minutes from Raleigh” — inside the 45-mile radius",
  },
  {
    criterion: "Needs the service offered — storm/hail damage",
    met: true,
    evidence: "“Hailstorm last week, dented gutters and shingles in the yard”",
  },
  {
    criterion: "Wants an actual visit, not just information",
    met: true,
    evidence: "“Can someone come take a look this week?” — a real ask, not browsing",
  },
  {
    criterion: "Owns the property or can authorize the work",
    met: false,
    evidence: "Not stated — the one thing keeping this from a perfect score",
  },
];

// Real product screenshot goes here eventually; this mockup uses the exact
// data shape and copy voice the live dashboard (studio.fieldsta.com)
// actually produces — see server.ts's renderCriteriaBreakdown and
// computeLeadScore — not an invented UI. Labeled "Example" throughout
// rather than shown as a captured lead, per the no-fabricated-claims rule
// everywhere else on this site.
function DashboardMockup() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg-deep)] text-left">
      <div className="flex items-center gap-3 border-b border-[rgba(var(--text-rgb),0.1)] px-6 py-5 sm:px-10">
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--text)]">
          Fieldsta
        </span>
        <span className="text-sm text-[var(--text)]">·</span>
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--text)]">Lead review</span>
        <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.1em] text-amber-400">
          Example
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8 sm:flex-row sm:gap-14 sm:p-10">
        <div className="flex flex-shrink-0 flex-col items-center gap-4">
          <ScoreRing score={88} size={150} stroke={10} />
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-amber-400">
            Needs one more detail
          </div>
        </div>

        <div>
          <div className="text-sm uppercase tracking-[0.18em] text-[var(--text)]">
            Why this lead scored 88, not 100
          </div>
          <ul className="mt-4 space-y-3">
            {EXAMPLE_CRITERIA.map((c) => (
              <li key={c.criterion} className="flex items-center gap-3">
                <span
                  className={
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-sm font-bold " +
                    (c.met ? "border-emerald-400/40 text-emerald-400" : "border-amber-400/40 text-amber-400")
                  }
                >
                  {c.met ? "✓" : "?"}
                </span>
                <div className="text-base font-medium text-[var(--text)]">{c.criterion}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const steps = [
  {
    n: "01",
    title: "A lead comes in",
    desc: "Webhook, form, HubSpot, Meta Lead Ads — however it already reaches you.",
  },
  {
    n: "02",
    title: "Fieldsta responds and qualifies",
    desc: "Drafted against your own criteria in under a minute, day or night.",
  },
  {
    n: "03",
    title: "The pilot account activates",
    desc: "Live immediately — no deploy, no waiting on a developer.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal className="text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            How it works
          </div>
          <h2 className="mt-4 font-editorial text-3xl font-medium leading-tight tracking-tight text-[var(--text)] sm:text-4xl">
            The Standard
          </h2>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-4xl gap-x-10 gap-y-12 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 100}>
              <div className="border-t border-[rgba(var(--text-rgb),0.12)] pt-6 text-center">
                <div className="mx-auto flex justify-center">
                  <Triangle />
                </div>
                <div className="mt-2 font-editorial text-3xl text-[var(--accent)]">{step.n}</div>
                <h3 className="mt-3 text-lg font-semibold text-[var(--text)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)] opacity-70">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// The correction-loop story (the strongest differentiator) used to also
// run as its own dedicated section below with a second mockup -- two
// tellings of one idea. It now lives in exactly one place (AlwaysImproving),
// so these three stay distinct from each other and from that section.
const features = [
  {
    title: "Built and fed around your business, not a script",
    desc: "You feed it your own qualifying criteria, your tone, and a hard list of anything it can never claim on your behalf. It's not a generic template with your logo on it — it's shaped by your rules and grows sharper from your own edits over time.",
  },
  {
    title: "Works with what you already run",
    desc: "HubSpot, Meta Lead Ads, Slack, Google Calendar, or a plain webhook — plugs into your stack instead of replacing it.",
  },
  {
    title: "One system, not one templated reply",
    desc: "Respond, qualify, and book straight onto your calendar — the whole handoff, not a bot that fires one message and stops.",
  },
];

function Features() {
  return (
    <section id="features" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal className="text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            More than an email bot
          </div>
          <p className="mx-auto mt-5 max-w-3xl font-editorial text-3xl font-medium leading-[1.2] tracking-tight text-[var(--text)] sm:text-4xl">
            It doesn&apos;t just send auto-replies —{" "}
            <span className="text-[var(--accent)]">it&apos;s fed your own rules, plugs into what you already run, and handles the whole handoff end to end.</span>
          </p>
        </Reveal>

        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div
                className={cn(
                  "h-full pt-6 text-center",
                  "border-t border-[rgba(var(--text-rgb),0.12)]"
                )}
              >
                <div className="flex justify-center">
                  <Triangle className="mb-3" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)] opacity-70">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}

// Fictional correction example, same treatment as DashboardMockup's honesty
// rule -- labeled "Example" throughout rather than shown as a captured
// exchange, since no real before/after has been recorded yet.
const CORRECTION_EXAMPLE = {
  before:
    "“Hi there! Thanks for reaching out, we’d love to help with your gutters. We can schedule an appointment whenever works for you!”",
  note: "“Too casual — drop the exclamation points, lead with availability.”",
  after:
    "“Thanks for reaching out. We have openings Thursday and Friday this week — which works better for you?”",
};

// This is the one place the correction-loop differentiator lives on the
// page (see the comment on `features` above) -- each point states what
// changes for the business, not what the model is doing under the hood.
// The claim itself is the strongest thing here; the job of this copy is
// to not bury it under capability language ("adapts instantly," "gets
// smarter") the way an earlier draft did in two separate sections.
const ALWAYS_IMPROVING_POINTS = [
  { title: "Never makes the same mistake twice" },
  { title: "The fix is live on the very next lead" },
  { title: "It won't cross the lines you set" },
];

function CorrectionMockup() {
  return (
    <div className="flex h-full w-full flex-col bg-[var(--bg-deep)] text-left">
      <div className="flex items-center gap-3 border-b border-[rgba(var(--text-rgb),0.1)] px-6 py-5 sm:px-8">
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--text)]">
          Fieldsta
        </span>
        <span className="text-sm text-[var(--text)]">·</span>
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--text)]">Correction loop</span>
        <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.1em] text-amber-400">
          Example
        </span>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--text)] opacity-60">First draft</div>
          <p className="mt-2 text-sm text-[var(--text)] opacity-80">{CORRECTION_EXAMPLE.before}</p>
        </div>

        <div className="flex items-start gap-2.5 border-y border-dashed border-[rgba(var(--text-rgb),0.15)] py-4">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/40 text-sm font-bold text-[var(--accent)]">
            &#9998;
          </span>
          <div className="text-sm text-[var(--text)]">
            <span className="font-semibold">You correct it once:</span> {CORRECTION_EXAMPLE.note}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Every reply after</div>
          <p className="mt-2 text-sm font-medium text-[var(--text)]">{CORRECTION_EXAMPLE.after}</p>
        </div>
      </div>
    </div>
  );
}

function AlwaysImproving() {
  return (
    <section className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal className="text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            Always learning
          </div>
          <p className="mx-auto mt-5 max-w-3xl font-editorial text-3xl font-medium leading-[1.2] tracking-tight text-[var(--text)] sm:text-4xl">
            The more you use it, the more{" "}
            <span className="text-[var(--accent)]">it sounds like you</span> — not a generic bot.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-14 w-full max-w-2xl overflow-hidden rounded-2xl border border-[rgba(var(--text-rgb),0.15)] shadow-2xl">
            <CorrectionMockup />
          </div>
        </Reveal>

        <Reveal delay={200}>
          <ul className="mx-auto mt-14 grid max-w-4xl gap-x-8 gap-y-6 text-sm sm:grid-cols-3">
            {ALWAYS_IMPROVING_POINTS.map((point) => (
              <li
                key={point.title}
                className="flex items-start gap-3 border-t border-[rgba(var(--text-rgb),0.12)] pt-4"
              >
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#34D399]" />
                <div className="font-semibold text-[var(--text)]">{point.title}</div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

const SETUP_STEPS = [
  {
    step: "1",
    title: "Connect integrations",
    desc: "Link Meta Lead Ads, HubSpot, or your own webhook in one click",
  },
  {
    step: "2",
    title: "Configure email",
    desc: "Choose which email you reply from and where notifications go",
  },
  {
    step: "3",
    title: "Test & launch",
    desc: "We send a demo lead to prove it works, then you're live",
  },
];

function SetupFlow() {
  return (
    <section className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal className="text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            Getting started
          </div>
          <h2 className="mt-4 font-editorial text-3xl font-medium leading-tight tracking-tight text-[var(--text)] sm:text-4xl">
            Set up in 5 minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text)] opacity-70">
            Sign up free → connect your integrations → test it on a real lead → you&apos;re live
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-x-10 gap-y-10 sm:grid-cols-3">
          {SETUP_STEPS.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="border-t border-[rgba(var(--text-rgb),0.12)] pt-6 text-center">
                <div className="flex justify-center">
                  <Triangle className="mb-3" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
                  Step {item.step}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)] opacity-70">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const WITHOUT_FIELDSTA = [
  "Lead waits 3+ hours for a reply",
  "Qualification happens manually, if at all",
  "Follow-ups get forgotten",
  "Slow response means the deal goes to whoever called back first",
];

// Each line is the direct flip of the WITHOUT item at the same index --
// this section's job is contrast, not another features checklist. The
// response-time / qualification / voice claims already have a home
// (Pricing's includes list); repeating them here just to fill four rows
// duplicated that list almost verbatim. What belongs here is what only
// makes sense stated as a before/after: the lead gets a reply before
// they've moved on, follow-ups stop depending on someone remembering,
// and being first is the thing that actually wins the deal.
const WITH_FIELDSTA = [
  "Lead gets a reply before they've closed the tab",
  "Every lead qualified the same way, every time — no one skipped on a busy day",
  "Follow-ups go out on schedule automatically, not when someone remembers",
  "You're the one who gets there first",
];

function WhySwitch() {
  return (
    <section className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal className="text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            The difference
          </div>
          <h2 className="mt-4 font-editorial text-3xl font-medium leading-tight tracking-tight text-[var(--text)] sm:text-4xl">
            Why businesses switch
          </h2>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-4xl divide-y divide-[rgba(var(--text-rgb),0.1)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <Reveal delay={80}>
            <div className="pb-8 pr-0 sm:pb-0 sm:pr-10">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
                Without Fieldsta
              </div>
              <ul className="mt-4 space-y-3">
                {WITHOUT_FIELDSTA.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--text)] opacity-80">
                    <Triangle className="mt-1.5 opacity-60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="pt-8 pl-0 sm:pt-0 sm:pl-10">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-500">
                With Fieldsta
              </div>
              <ul className="mt-4 space-y-3">
                {WITH_FIELDSTA.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--text)]">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Is a real person involved at all?",
    a: "Fieldsta runs fully automated by design — that's the whole point, getting your time back instead of trading one manual task for another. Harper handles the conversation end to end, including voice.",
  },
  {
    q: "Can I control how it talks, or what it's never allowed to say?",
    a: "Yes — you tell us what to never claim on your behalf (pricing, guarantees, anything you haven't approved), and Fieldsta won't say it, ever. Combined with the voice it learns from your edits, this is how replies end up sounding like your business, not a generic bot.",
  },
  {
    q: "How fast does Fieldsta actually respond?",
    a: "Fast enough that the lead is still warm — Fieldsta starts responding and qualifying immediately, instead of the hours it can take a busy team to get back to someone.",
  },
  {
    q: "Do I need to switch CRMs?",
    a: "No. Tell us what you're already using on the form below and Fieldsta works alongside it.",
  },
  {
    q: "How does the free trial work?",
    a: "It's live the moment you sign up — 14 days, capped at 3 leads/day so you can see real replies against your own leads before paying anything. Upgrade to Starter whenever you're ready and the cap lifts.",
  },
  {
    q: "Can I feed it my own data?",
    a: "Not documents or a knowledge base to upload — you tell it directly: your qualifying criteria, your tone, and anything it should never claim. From there it learns your voice from your own edits over time. That's a deliberate tradeoff for keeping setup to minutes instead of a data-ingestion project — if you need document/knowledge-base training specifically, tell us and we'll talk it through.",
  },
];

const PRICING_INCLUDES = [
  "Responds to every inbound lead in under a minute, day or night",
  "Qualifies against your own criteria before it ever reaches your calendar",
  "A human reviews every booking before it's confirmed — nothing goes out unchecked",
  "Learns your voice from your edits — sounds like you, not a generic bot",
  "Works alongside HubSpot, Meta Lead Ads, Slack, or any CRM",
];

// Real prices, matching what the backend actually enforces (see
// DEFAULT_MONTHLY_LEAD_LIMIT_BY_PRICE) -- every tier gets every feature,
// they scale by lead volume, not functionality. Only Starter has a real
// self-serve checkout; Growth/Scale are real prices but require an actual
// conversation first since usage-based cost varies enough at that volume
// that it isn't a click-and-go purchase.
//
// `fit` is volume-sizing guidance only -- deliberately not a feature
// claim (every tier is functionally identical) or a fabricated stat
// ("most agencies choose..."). It just helps a visitor self-select
// against their own real lead volume, the one differentiator that
// actually exists between these three.
const PLANS = [
  {
    name: "Starter",
    price: "$500",
    volume: "Up to ~150 qualified leads/mo",
    fit: "Fits one account, or a single active campaign's lead flow.",
    cta: "Start your free pilot",
    action: "signup",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$1,500",
    volume: "Up to ~500 qualified leads/mo",
    fit: "Fits an agency running lead flow across a handful of clients.",
    cta: "Book a setup call",
    action: "call",
    highlight: true,
  },
  {
    name: "Scale",
    price: "$3,000",
    volume: "Up to ~1,500 qualified leads/mo",
    fit: "Fits volume from paid campaigns already running at real scale.",
    cta: "Book a setup call",
    action: "call",
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            Pricing
          </div>
          <h2 className="mt-4 font-editorial text-3xl font-medium leading-tight tracking-tight text-[var(--text)] sm:text-4xl">
            Straightforward Pricing, No Surprises
          </h2>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)] opacity-80">
            14-day free trial
          </div>
        </Reveal>

        <Reveal delay={80}>
          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--text)]">
            {PRICING_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-[#34D399]" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl divide-y divide-[rgba(var(--text-rgb),0.1)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={120 + i * 80}>
              <div className="flex h-full flex-col px-0 py-8 text-center sm:px-8 sm:py-0">
                <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{plan.name}</div>
                <div className="mt-4 flex items-baseline justify-center gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-[var(--text)]">{plan.price}</span>
                  <span className="text-sm text-[var(--text)] opacity-70">/ month</span>
                </div>
                <div className="mt-3 text-sm text-[var(--text)] opacity-70">{plan.volume}</div>
                <div className="mt-2 text-xs text-[var(--text)] opacity-50">{plan.fit}</div>
                <div className="flex-1" />
                <Button
                  size="lg"
                  onClick={() => {
                    if (plan.action === "signup") window.location.href = "/get-started";
                    else window.location.href = "mailto:support@fieldsta.com?subject=Setting%20up%20the%20" + plan.name + "%20plan";
                  }}
                  className="mt-7 w-full bg-[var(--text)] text-[var(--bg-deep)] hover:bg-white"
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const DATA_TRUST_POINTS = [
  "Your leads' data is never sold — to anyone, for any reason.",
  "Encrypted in transit, access-controlled at rest.",
  "Delete everything tied to your account on request — just email us, no retention runaround.",
];

function DataTrust() {
  return (
    <section className="border-t border-[rgba(var(--text-rgb),0.1)] py-20">
      <div className="container">
        <Reveal className="mx-auto max-w-lg text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            Data &amp; privacy
          </div>
          <h3 className="mt-4 font-editorial text-2xl font-medium text-[var(--text)]">What happens to your leads&apos; data</h3>
          <ul className="mx-auto mt-5 max-w-md space-y-2.5 text-left text-sm text-[var(--text)] opacity-80">
            {DATA_TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#34D399]" />
                {point}
              </li>
            ))}
          </ul>
          <a href="/privacy" className="mt-5 inline-block text-sm font-semibold text-[var(--accent)] hover:underline">
            Full privacy policy →
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// Native <details> snaps its content open/closed instantly with no way to
// transition height via CSS alone (height:auto isn't animatable) -- this
// swaps in a plain open/closed boolean and animates the answer's height
// with the Web Animations API instead, so expanding a question reads as a
// smooth action rather than a jump cut.
function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);

  const toggle = () => {
    const body = bodyRef.current;
    if (!body) return;
    const opening = !open;
    const startHeight = body.getBoundingClientRect().height;
    setOpen(opening);
    requestAnimationFrame(() => {
      const endHeight = opening ? body.scrollHeight : 0;
      body.animate([{ height: startHeight + "px" }, { height: endHeight + "px" }], {
        duration: 220,
        easing: "ease",
      });
    });
  };

  return (
    <div className="py-5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between text-left text-base font-semibold text-[var(--text)]"
      >
        {q}
        <span
          className="ml-4 shrink-0 text-[var(--text)] transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div ref={bodyRef} className="overflow-hidden" style={{ height: open ? "auto" : 0 }}>
        <p className="mt-3 text-sm text-[var(--text)]">{a}</p>
      </div>
    </div>
  );
}

function FAQ() {
  return (
    <section id="faq" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container max-w-2xl">
        <Reveal className="text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            FAQ
          </div>
          <h2 className="mt-4 font-editorial text-3xl font-medium leading-tight tracking-tight text-[var(--text)] sm:text-4xl">
            Questions Worth Asking
          </h2>
        </Reveal>
        <Reveal delay={100} className="mt-12 divide-y divide-[rgba(var(--text-rgb),0.1)]">
          {faqs.map((item) => (
            <AccordionItem key={item.q} q={item.q} a={item.a} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function DemoForm() {
  return (
    <section id="demo" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal className="text-center">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text)] opacity-60">
            <Triangle />
            Get in touch
          </div>
          <h2 className="mt-4 font-editorial text-3xl font-medium leading-tight tracking-tight text-[var(--text)] sm:text-4xl">
            Prefer email? Tell us about your business
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mx-auto mt-10 max-w-md border-t border-[rgba(var(--text-rgb),0.1)] pt-10">
            <LeadCaptureForm ctaLabel="Get in Touch" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[rgba(var(--text-rgb),0.1)] py-12 text-center text-sm text-[var(--text)]">
      <div className="container flex flex-col items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--text)]">
          Fieldsta
        </span>
        <div className="flex items-center gap-4">
          <a href="/try" className="hover:text-[var(--text)]">
            Try Demo
          </a>
          <a href="/terms" className="hover:text-[var(--text)]">
            Terms
          </a>
          <a href="/privacy" className="hover:text-[var(--text)]">
            Privacy
          </a>
          <a href="mailto:support@fieldsta.com" className="hover:text-[var(--text)]">
            support@fieldsta.com
          </a>
        </div>
        <span>&copy; 2026 Fieldsta, LLC.</span>
      </div>
    </footer>
  );
}
