import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  ShieldCheck,
  CalendarCheck,
  Inbox,
  MessageSquareText,
  ArrowRight,
  Sparkles,
  Check,
  Mail,
  Database,
  Megaphone,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import ParticleSkyline from "@/components/ParticleSkyline";
import { ScoreRing } from "@/components/ScoreRing";
import SalesChatWidget from "@/components/SalesChatWidget";
import { ThemeToggle, useIsDarkTheme } from "@/components/ThemeToggle";
import { track } from "@vercel/analytics/react";
import { cn } from "@/lib/utils";

// Same backend base SalesChatWidget already uses for its API calls --
// self-serve signup lives on the agents backend (studio.fieldsta.com/signup),
// not this app, so this is a plain link, not a react-router route.
const AGENTS_BASE = import.meta.env.VITE_AGENTS_BASE_URL || "https://studio.fieldsta.com";

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
      <SetupFlow />
      <WhySwitch />
      <Pricing />
      <DataTrust />
      <FAQ />
      <FinalCTA />
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
          <a href={`${AGENTS_BASE}/signup`}>
            <Button size="sm" className="bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]">
              Start Free
            </Button>
          </a>
          <Link to="/try">
            <Button size="sm" className="bg-[var(--text)] text-[var(--bg-deep)] hover:bg-white">
              Try It Live
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
          <h1 className="animate-fade-up text-4xl font-light leading-[1.12] tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
            Answer <span className="font-bold text-[var(--accent)]">every lead</span>
            <br />
            <span className="font-bold text-[var(--accent)]">before</span> your competitor
            <br />
            picks up the phone
          </h1>

          <p className="animate-fade-up [animation-delay:280ms] mt-8 text-lg font-semibold text-[var(--text)]">
            Respond. Qualify. Book.
          </p>

          <Link
            to="/try"
            className="animate-fade-up [animation-delay:160ms] mt-9 inline-block"
          >
            <Button
              size="lg"
              className="w-full rounded-none bg-[var(--text)] px-7 text-[var(--bg-deep)] hover:opacity-90 sm:w-auto"
            >
              See it live — free
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
    icon: Inbox,
    n: "01",
    title: "A lead comes in",
  },
  {
    icon: MessageSquareText,
    n: "02",
    title: "Fieldsta responds and qualifies",
  },
  {
    icon: CalendarCheck,
    n: "03",
    title: "The pilot account activates",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            The Standard
          </h2>
        </Reveal>
        <div className="mx-auto mt-16 grid max-w-4xl gap-12 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 100} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(var(--text-rgb),0.15)] bg-[rgba(var(--text-rgb),0.05)] text-[var(--text)]">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="mt-4 text-sm font-extrabold tracking-[0.2em] text-[var(--accent)]">
                {step.n}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">{step.title}</h3>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// The two that actually differentiate this from "yet another auto-reply
// bot" -- given full visual weight below, not equal billing with the
// integrations/CRM talk every competitor already claims.
const heroFeatures = [
  {
    icon: Sparkles,
    title: "It grows with every correction",
    desc: "Edit a draft before it goes out and that correction becomes an example the agent sees on every reply after — no retraining, no waiting days for it to sink in. Say no to a phrasing once and it stops using it, permanently.",
  },
  {
    icon: ShieldCheck,
    title: "Built and fed around your business, not a script",
    desc: "You feed it your own qualifying criteria, your tone, and a hard list of anything it can never claim on your behalf. It's not a generic template with your logo on it — it's shaped by your rules and grows sharper from your own edits over time.",
  },
];

// Real, but table stakes -- every CRM-bundled AI agent claims this too.
// Kept, just not competing for attention with the two above.
const secondaryFeatures = [
  { icon: Plug, title: "Works with what you already run", desc: "HubSpot, Meta Lead Ads, Slack, Google Calendar, or a plain webhook — plugs into your stack instead of replacing it." },
  { icon: Zap, title: "One system, not one templated reply", desc: "Respond, qualify, and book straight onto your calendar — the whole handoff, not a bot that fires one message and stops." },
];

const integrations = [
  { name: "Email", note: "Reply from & notification settings", icon: Mail },
  { name: "HubSpot", note: "Pushes qualified leads and status", icon: Database },
  { name: "Meta Lead Ads", note: "Facebook & Instagram lead forms", icon: Megaphone },
  { name: "Slack", note: "Real-time lead notifications", icon: MessageSquareText },
  { name: "Google Calendar", note: "Auto-book meetings", icon: CalendarCheck },
  { name: "Webhooks", note: "Zapier, Make, custom systems", icon: Plug },
];

function Features() {
  return (
    <section id="features" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            More than an email bot
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-center text-2xl font-bold leading-snug tracking-tight text-[var(--text)] sm:text-3xl">
            It doesn&apos;t just send auto-replies —{" "}
            <span className="text-[var(--accent)]">it&apos;s fed your business, shaped by your edits, and grows sharper the more it runs.</span>
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
          {heroFeatures.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <Card className="h-full border-2 border-[var(--accent)]/30 bg-[var(--accent)]/[0.05] p-8 transition-colors hover:border-[var(--accent)]/60">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-extrabold tracking-tight text-[var(--text)]">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text)] opacity-90">{f.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {secondaryFeatures.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-lg border border-[rgba(var(--text-rgb),0.1)] bg-[var(--text)]/[0.02] p-4">
                <f.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--text)] opacity-60" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">{f.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--text)] opacity-70">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div className="mx-auto mt-14 max-w-5xl">
            <div className="text-center text-[10px] uppercase tracking-[0.28em] text-[var(--text)] opacity-70">
              Also wired up today
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              {integrations.map((i) => (
                <div
                  key={i.name}
                  title={i.note}
                  className="flex h-10 items-center gap-2 rounded-full border border-[rgba(var(--text-rgb),0.15)] bg-[var(--text)]/[0.03] pl-3 pr-5 text-sm font-semibold text-[var(--text)]"
                >
                  <i.icon className="h-4 w-4 flex-shrink-0" />
                  {i.name}
                </div>
              ))}
              <div className="flex h-10 items-center rounded-full border border-dashed border-[rgba(var(--text-rgb),0.15)] px-5 text-sm text-[var(--text)]">
                + tell us what else you use
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={350}>
          <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[rgba(var(--text-rgb),0.1)] bg-[var(--text)]/[0.02] p-7">
            <h3 className="text-base font-semibold text-[var(--text)]">Why not just use my CRM&apos;s built-in AI?</h3>
            <p className="mt-2 text-sm text-[var(--text)] opacity-80">
              Fair question — a lot of CRMs ship some version of an AI reply assistant now. Fieldsta isn&apos;t trying to
              replace your CRM&apos;s dashboard; it sits in front of it. It works whether you run HubSpot, something else,
              or nothing at all, and it&apos;s built around one job — responding to and qualifying inbound leads — instead
              of being a general assistant bolted onto a much bigger platform. That focus is also why setup takes
              minutes instead of a CRM configuration project.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SetupFlow() {
  return (
    <section className="border-t border-[rgba(var(--text-rgb),0.1)] py-24 bg-[var(--text)]/[0.02]">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Set up in 5 minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-[var(--text)]">
            Pay → get a setup link → connect your integrations → start receiving qualified leads
          </p>
        </Reveal>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
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
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="rounded-lg border border-[rgba(var(--text-rgb),0.1)] bg-[var(--text)]/[0.02] p-6">
                  <div className="text-xs font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                    Step {item.step}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text)]">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={400} className="mt-12 text-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)]">
            FULLY AUTONOMOUS — BUILT TO SAVE YOU TIME AND MONEY
          </div>
        </Reveal>
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

const WITH_FIELDSTA = [
  "Replies in under a minute, day or night",
  "Every lead qualified automatically, against your own criteria",
  "Meeting booked straight onto your calendar — no admin work",
  "Hours back every week that used to go to manual replies — and it sounds more like you the more you correct it",
];

function WhySwitch() {
  return (
    <section className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Why businesses switch
          </h2>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
          <Reveal delay={80}>
            <Card className="h-full border-[rgba(var(--text-rgb),0.1)] bg-[var(--text)]/[0.02] p-7">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text)]">
                Without Fieldsta
              </div>
              <ul className="mt-4 space-y-3">
                {WITHOUT_FIELDSTA.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--text)]">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--text)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
          <Reveal delay={160}>
            <Card className="h-full border-emerald-400/20 bg-emerald-400/[0.04] p-7">
              <div className="text-[10px] uppercase tracking-[0.24em] text-emerald-400">
                With Fieldsta
              </div>
              <ul className="mt-4 space-y-3">
                {WITH_FIELDSTA.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--text)]">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
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
    q: "Can I feed it my own data?",
    a: "Not documents or a knowledge base to upload — you tell it directly: your qualifying criteria, your tone, and anything it should never claim. From there it learns your voice from your own edits over time. That's a deliberate tradeoff for keeping setup to minutes instead of a data-ingestion project — if you need document/knowledge-base training specifically, tell us and we'll talk it through.",
  },
];

const PRICING_INCLUDES = [
  "Responds to every inbound lead in under a minute, day or night",
  "Qualifies against your own criteria before it ever reaches your calendar",
  "Learns your voice from your edits — sounds like you, not a generic bot",
  "Works alongside HubSpot, Meta Lead Ads, Slack, or any CRM",
];

// Real prices, matching what the backend actually enforces (see
// DEFAULT_MONTHLY_LEAD_LIMIT_BY_PRICE) -- every tier gets every feature,
// they scale by lead volume, not functionality. Only Starter has a real
// self-serve checkout; Growth/Scale are real prices but require an actual
// conversation first since usage-based cost varies enough at that volume
// that it isn't a click-and-go purchase.
const PLANS = [
  {
    name: "Starter",
    price: "$500",
    volume: "Up to ~150 qualified leads/mo",
    cta: "Start your free pilot",
    action: "signup",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$1,500",
    volume: "Up to ~500 qualified leads/mo",
    cta: "Book a setup call",
    action: "call",
    highlight: true,
  },
  {
    name: "Scale",
    price: "$3,000",
    volume: "Up to ~1,500 qualified leads/mo",
    cta: "Book a setup call",
    action: "call",
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Straightforward Pricing, No Surprises
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-[var(--text)]">
            Every plan includes every feature — plans only differ by lead volume, since that's what actually drives cost at scale.
          </p>
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

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={120 + i * 80}>
              <Card
                className={`h-full p-7 text-center ${
                  plan.highlight
                    ? "border-2 border-[var(--accent)]/50 bg-[var(--accent)]/[0.05]"
                    : "border-[rgba(var(--text-rgb),0.15)] bg-[var(--text)]/[0.03]"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{plan.name}</div>
                <div className="mt-4 flex items-baseline justify-center gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-[var(--text)]">{plan.price}</span>
                  <span className="text-sm text-[var(--text)]">/ month</span>
                </div>
                <div className="mt-3 text-sm text-[var(--text)] opacity-70">{plan.volume}</div>
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
              </Card>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120 + PLANS.length * 80}>
          <p className="mx-auto mt-8 max-w-md text-center text-xs text-[var(--text)] opacity-60">
            Starter checks out instantly. Growth and Scale are real prices, set up over a quick call since usage-based cost varies enough at that volume to talk through first.
          </p>
        </Reveal>
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
        <Reveal>
          <div className="mx-auto max-w-2xl rounded-2xl border border-[rgba(var(--text-rgb),0.1)] bg-[var(--text)]/[0.02] p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(var(--text-rgb),0.15)] bg-[rgba(var(--text-rgb),0.05)] text-[var(--text)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">What happens to your leads&apos; data</h3>
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
          </div>
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
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
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

function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-[rgba(var(--text-rgb),0.1)] py-20 text-center">
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] rounded-full bg-[rgba(var(--text-rgb),0.1)] blur-[120px]"
      />
      <div className="container relative">
        <Reveal>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Your next lead is already <span className="text-[var(--accent)]">waiting</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--text)]">
            Talk to Harper right now and see exactly how much time and money this puts back in your week.
          </p>
          <Link to="/try">
            <Button
              size="lg"
              className="mt-8 bg-[var(--text)] text-[var(--bg-deep)] hover:bg-white"
            >
              Start Your Live AI Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function DemoForm() {
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const crmRef = useRef(null);
  const sourceRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("Submitting...");

    const payload = {
      firstName: firstNameRef.current.value,
      lastName: lastNameRef.current.value,
      email: emailRef.current.value,
      crm: crmRef.current.value,
      source: sourceRef.current.value,
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Try again.");
        return;
      }
      setStatus("success");
      setMessage(data.message || "Demo request received!");
      e.target.reset();
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  const fieldClass =
    "mt-1.5 border-[rgba(var(--text-rgb),0.15)] bg-[var(--text)]/[0.04] text-[var(--text)] placeholder:text-[rgba(var(--text-rgb),0.7)] focus-visible:ring-[rgba(var(--text-rgb),0.4)]";

  return (
    <section id="demo" className="border-t border-[rgba(var(--text-rgb),0.1)] py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Prefer email? Tell us about your business
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <Card className="mx-auto mt-10 max-w-md border-[rgba(var(--text-rgb),0.1)] bg-[var(--text)]/[0.03] p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-[var(--text)]">
                  First Name
                </Label>
                <Input id="firstName" ref={firstNameRef} required className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[var(--text)]">
                  Last Name
                </Label>
                <Input id="lastName" ref={lastNameRef} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="email" className="text-[var(--text)]">
                  Business Email
                </Label>
                <Input id="email" type="email" ref={emailRef} required className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="crm" className="text-[var(--text)]">
                  What CRM do you use?
                </Label>
                <Input
                  id="crm"
                  ref={crmRef}
                  placeholder="e.g. HubSpot, Salesforce, none"
                  className={fieldClass}
                />
              </div>
              <div>
                <Label htmlFor="source" className="text-[var(--text)]">
                  How did you hear about us?
                </Label>
                <Select id="source" ref={sourceRef} defaultValue="" className={fieldClass}>
                  <option value="" className="bg-[var(--bg-deep)]">
                    Select one
                  </option>
                  <option value="Referral" className="bg-[var(--bg-deep)]">
                    Referral
                  </option>
                  <option value="Google Search" className="bg-[var(--bg-deep)]">
                    Google Search
                  </option>
                  <option value="LinkedIn" className="bg-[var(--bg-deep)]">
                    LinkedIn
                  </option>
                  <option value="Email/Cold Outreach" className="bg-[var(--bg-deep)]">
                    Email / Cold Outreach
                  </option>
                  <option value="Other" className="bg-[var(--bg-deep)]">
                    Other
                  </option>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-[var(--text)] text-[var(--bg-deep)] hover:bg-white"
                size="lg"
              >
                {status === "submitting" ? "Submitting..." : "Get My Custom Automation Plan"}
              </Button>
              {message && (
                <div
                  className={
                    "rounded-lg p-4 text-center font-medium " +
                    (status === "success"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : status === "error"
                      ? "bg-red-400/10 text-red-400"
                      : "text-[var(--text)]")
                  }
                  role="status"
                >
                  {message}
                </div>
              )}
            </form>
          </Card>
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
            Try It Live
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
