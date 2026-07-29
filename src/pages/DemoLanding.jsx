import { useEffect, useRef, useState } from "react";
import {
  Zap,
  ShieldCheck,
  CalendarCheck,
  Inbox,
  MessageSquareText,
  Plug,
  ArrowRight,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import ParticleSkyline from "@/components/ParticleSkyline";
import { ScoreRing } from "@/components/ScoreRing";
import SalesChatWidget from "@/components/SalesChatWidget";
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

  return (
    <div className="font-body bg-[#060607] text-[#F5F5F5]">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <SetupFlow />
      <WhySwitch />
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
    <header className="sticky top-0 z-50 border-b border-[#F5F5F5]/10 bg-[#060607]/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 200 200" className="text-[#F5F5F5]" aria-hidden="true">
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
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#F5F5F5]">
            Fieldsta
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.2em] text-[#9A9A9E] md:flex">
          <a href="#how-it-works" className="hover:text-[#F5F5F5]">
            How It Works
          </a>
          <a href="#features" className="hover:text-[#F5F5F5]">
            Features
          </a>
          <a href="#faq" className="hover:text-[#F5F5F5]">
            FAQ
          </a>
          <a href="/try" className="text-[#F5F5F5] hover:text-white">
            Try It Live
          </a>
        </nav>
        <a href="#demo">
          <Button size="sm" className="bg-[#F5F5F5] text-[#0a0a0a] hover:bg-white">
            Request a Demo
          </Button>
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[92vh] flex-col overflow-hidden bg-[#060607]">
      {/* Particle field occupies the upper half and dissolves downward into
          the page, so the headline sits in clean negative space rather than
          fighting the artwork for contrast. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[68%]">
        {/* Lit air behind the skyline. In the reference photographs the sky
            is never black — it's luminous at the horizon and falls off
            upward, and that gradient is what puts the buildings at a
            distance instead of on the surface of the screen. Kept
            near-neutral with the faintest warm bias so it reads as city
            light without introducing a second accent colour. */}
        <div className="absolute inset-0 bg-[radial-gradient(140%_95%_at_50%_100%,rgba(255,241,232,0.16)_0%,rgba(255,235,225,0.06)_28%,transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(239,68,68,0.05)_0%,transparent_38%)]" />

        <ParticleSkyline className="absolute inset-0 h-full w-full" />

        {/* Depth fog across the lower third, so the base of the city
            dissolves rather than terminating on a line. */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,6,7,0.55)_45%,#060607_100%)]" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#060607] to-transparent" />
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

      <div className="container relative z-10 mt-auto pb-14 pt-40">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <h1 className="animate-fade-up max-w-xl text-4xl font-light leading-[1.12] tracking-tight text-[#6F6F75] sm:text-5xl lg:text-6xl">
              <span className="text-[#F5F5F5]">Answer every lead</span>
              <br />
              before your competitor
              <br />
              picks up the phone
            </h1>

            <p className="animate-fade-up [animation-delay:280ms] mt-8 max-w-md text-[15px] leading-relaxed text-[#9A9A9E]">
              AI that responds, qualifies, and books meetings automatically for every
              inbound lead.
            </p>

            <p className="animate-fade-up [animation-delay:340ms] mt-5 text-[13px] text-[#6F6F75]">
              <span className="font-semibold text-[#F5F5F5]">Under a minute</span> — median
              time to a drafted reply, measured on real leads.
            </p>

            <a href="#demo" className="animate-fade-up [animation-delay:160ms] mt-9 inline-block">
              <Button
                size="lg"
                className="w-full rounded-none bg-[#F5F5F5] px-7 text-[#0a0a0a] hover:bg-white sm:w-auto"
              >
                Request a demo
              </Button>
            </a>
          </div>

          <div className="animate-fade-up [animation-delay:220ms]">
            <div className="mb-3 text-xs uppercase tracking-[0.18em] text-[#6F6F75]">
              Know exactly why a lead is worth your time
            </div>
            <div className="h-[22rem] overflow-hidden rounded-2xl border border-[#F5F5F5]/15 shadow-2xl sm:h-[26rem]">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </div>

      <div className="container relative z-10 flex items-center justify-between border-t border-[#F5F5F5]/10 py-4 text-[10px] uppercase tracking-[0.28em] text-[#6F6F75]">
        <span>Human-reviewed · Any CRM · Always-on</span>
        <span className="hidden items-center gap-2 sm:flex">
          Scroll
          <ArrowDown className="h-3 w-3" />
        </span>
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
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0a0a0b] text-left">
      <div className="flex items-center gap-2 border-b border-[#F5F5F5]/10 px-4 py-3 sm:px-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6F6F75]">
          Fieldsta
        </span>
        <span className="text-[10px] text-[#4A4A50]">·</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#4A4A50]">Lead review</span>
        <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-amber-400">
          Example
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-hidden p-4 sm:flex-row sm:gap-8 sm:p-6">
        <div className="flex flex-shrink-0 flex-row items-center gap-4 sm:flex-col sm:items-start sm:gap-3">
          <ScoreRing score={88} />
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-amber-400">
              Needs one more detail
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#9A9A9E] sm:max-w-[11rem]">
              Strong lead — one thing unconfirmed below is the only gap between this and a perfect score.
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#6F6F75]">
            Why this lead scored 88, not 100
          </div>
          <ul className="mt-2.5 space-y-2.5">
            {EXAMPLE_CRITERIA.map((c) => (
              <li key={c.criterion} className="flex items-start gap-2.5">
                <span
                  className={
                    "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold " +
                    (c.met ? "border-emerald-400/40 text-emerald-400" : "border-amber-400/40 text-amber-400")
                  }
                >
                  {c.met ? "✓" : "?"}
                </span>
                <div>
                  <div className="text-[13px] font-medium text-[#F5F5F5]">{c.criterion}</div>
                  <div className="mt-0.5 text-[12px] text-[#9A9A9E]">{c.evidence}</div>
                </div>
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
    description: "From your website, a call, or wherever leads already reach you.",
  },
  {
    icon: MessageSquareText,
    n: "02",
    title: "Fieldsta responds and qualifies",
    description:
      "Right away, every time — asking the right questions before anyone's time is wasted.",
  },
  {
    icon: CalendarCheck,
    n: "03",
    title: "The meeting gets booked",
    description: "Straight onto your calendar — reviewed by you by default, or sent automatically once you trust the voice it's learned.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-[#F5F5F5]/10 py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            The Standard
          </h2>
        </Reveal>
        <div className="mx-auto mt-16 grid max-w-4xl gap-12 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 100} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#F5F5F5]/15 bg-[#F5F5F5]/5 text-[#F5F5F5]">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="mt-4 text-sm font-extrabold tracking-[0.2em] text-[#EF4444]">
                {step.n}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-[#F5F5F5]">{step.title}</h3>
              <p className="mt-2 text-sm text-[#9A9A9E]">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Zap,
    title: "Your leads hear back immediately — even while you sleep",
    description: "The faster you respond, the more deals you close. Fieldsta makes that automatic, day or night.",
  },
  {
    icon: MessageSquareText,
    title: "Real qualification",
    description: "Leads are asked the questions your team would ask, before they hit your calendar.",
  },
  {
    icon: Sparkles,
    title: "Gets better the more you use it",
    description: "Every edit you make teaches it — its own dedicated memory per client, so replies sound more like you over time, not less.",
  },
  {
    icon: ShieldCheck,
    title: "Your call, always",
    description: "Every reply waits for your review by default. Once you trust how it sounds, you can let it send on its own for the leads it's confident about — you set the boundary, not us.",
  },
  {
    icon: Plug,
    title: "Works alongside your CRM",
    description: "Pushes qualified leads straight into HubSpot, or works standalone with any CRM or none.",
  },
];

const integrations = [
  { name: "Email", note: "Reply from & notification settings" },
  { name: "HubSpot", note: "Pushes qualified leads and status" },
  { name: "Meta Lead Ads", note: "Facebook & Instagram lead forms" },
  { name: "Slack", note: "Real-time lead notifications" },
  { name: "Google Calendar", note: "Auto-book meetings" },
  { name: "Webhooks", note: "Zapier, Make, custom systems" },
];

function Features() {
  return (
    <section id="features" className="border-t border-[#F5F5F5]/10 py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            What separates a missed call from a closed deal
          </h2>
        </Reveal>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <Card className="h-full border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] p-6 transition-colors hover:border-[#F5F5F5]/25 hover:bg-[#F5F5F5]/[0.05]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F5F5F5]/15 bg-[#F5F5F5]/5 text-[#F5F5F5]">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#F5F5F5]">{f.title}</h3>
                <p className="mt-1.5 text-sm text-[#9A9A9E]">{f.description}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={features.length * 80}>
          <div className="mx-auto mt-14 max-w-5xl">
            <div className="text-center text-[10px] uppercase tracking-[0.28em] text-[#6F6F75]">
              Actually wired up today
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              {integrations.map((i) => (
                <div
                  key={i.name}
                  title={i.note}
                  className="rounded-full border border-[#F5F5F5]/15 bg-[#F5F5F5]/[0.03] px-5 py-2 text-sm font-semibold text-[#F5F5F5]"
                >
                  {i.name}
                </div>
              ))}
              <div className="rounded-full border border-dashed border-[#F5F5F5]/15 px-5 py-2 text-sm text-[#6F6F75]">
                + tell us what else you use
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SetupFlow() {
  return (
    <section className="border-t border-[#F5F5F5]/10 py-24 bg-[#F5F5F5]/[0.02]">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Set up in 5 minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-[#9A9A9E]">
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
                <div className="rounded-lg border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] p-6">
                  <div className="text-xs font-bold tracking-[0.2em] text-[#EF4444] uppercase">
                    Step {item.step}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#F5F5F5]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#9A9A9E]">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={400} className="mt-12 text-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-[#4ADE80]">
            FULLY AUTONOMOUS
          </div>
          <p className="mt-2 text-[#9A9A9E]">No manual review. No operator handoff. No waiting days for setup.</p>
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
  "Meeting booked on your calendar, reviewed by you",
  "Gets better at sounding like you the more you use it",
];

function WhySwitch() {
  return (
    <section className="border-t border-[#F5F5F5]/10 py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Why businesses switch
          </h2>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
          <Reveal delay={80}>
            <Card className="h-full border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] p-7">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#6F6F75]">
                Without Fieldsta
              </div>
              <ul className="mt-4 space-y-3">
                {WITHOUT_FIELDSTA.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#9A9A9E]">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#6F6F75]" />
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
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#F5F5F5]">
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
    q: "Do I need to switch CRMs?",
    a: "No. Tell us what you're already using on the form below and Fieldsta works alongside it.",
  },
  {
    q: "How fast does Fieldsta actually respond?",
    a: "Fast enough that the lead is still warm — Fieldsta starts responding and qualifying immediately, instead of the hours it can take a busy team to get back to someone.",
  },
  {
    q: "Is a real person involved at all?",
    a: "By default, yes — every reply waits for you to review it before it sends. As Fieldsta learns your voice and you see it consistently getting things right, you can turn on auto-send for the leads it's confident about, and keep manual review for anything it flags as unsure. That's your setting to change whenever you want, not ours.",
  },
  {
    q: "Can I control how it talks, or what it's never allowed to say?",
    a: "Yes — you tell us what to never claim on your behalf (pricing, guarantees, anything you haven't approved), and Fieldsta won't say it, ever. Combined with the voice it learns from your edits, this is how replies end up sounding like your business, not a generic bot.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="border-t border-[#F5F5F5]/10 py-24">
      <div className="container max-w-2xl">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Questions Worth Asking
          </h2>
        </Reveal>
        <Reveal delay={100} className="mt-12 divide-y divide-[#F5F5F5]/10">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-left text-base font-semibold text-[#F5F5F5]">
                {item.q}
                <span className="ml-4 shrink-0 text-[#9A9A9E] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-[#9A9A9E]">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-[#F5F5F5]/10 py-20 text-center">
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] rounded-full bg-[#F5F5F5]/10 blur-[120px]"
      />
      <div className="container relative">
        <Reveal>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Your next lead is already <span className="text-[#EF4444]">waiting</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[#9A9A9E]">
            See Fieldsta on a live call with your own leads and workflow.
          </p>
          <a href="#demo">
            <Button
              size="lg"
              className="mt-8 bg-[#F5F5F5] text-[#0a0a0a] hover:bg-white"
            >
              Request a Live Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
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
    "mt-1.5 border-[#F5F5F5]/15 bg-[#F5F5F5]/[0.04] text-[#F5F5F5] placeholder:text-[#9A9A9E]/70 focus-visible:ring-[#F5F5F5]/40";

  return (
    <section id="demo" className="border-t border-[#F5F5F5]/10 py-24">
      <div className="container">
        <Reveal>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Request a Live Demo
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <Card className="mx-auto mt-10 max-w-md border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-[#F5F5F5]">
                  First Name
                </Label>
                <Input id="firstName" ref={firstNameRef} required className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[#F5F5F5]">
                  Last Name
                </Label>
                <Input id="lastName" ref={lastNameRef} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="email" className="text-[#F5F5F5]">
                  Business Email
                </Label>
                <Input id="email" type="email" ref={emailRef} required className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="crm" className="text-[#F5F5F5]">
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
                <Label htmlFor="source" className="text-[#F5F5F5]">
                  How did you hear about us?
                </Label>
                <Select id="source" ref={sourceRef} defaultValue="" className={fieldClass}>
                  <option value="" className="bg-[#0a0a0a]">
                    Select one
                  </option>
                  <option value="Referral" className="bg-[#0a0a0a]">
                    Referral
                  </option>
                  <option value="Google Search" className="bg-[#0a0a0a]">
                    Google Search
                  </option>
                  <option value="LinkedIn" className="bg-[#0a0a0a]">
                    LinkedIn
                  </option>
                  <option value="Email/Cold Outreach" className="bg-[#0a0a0a]">
                    Email / Cold Outreach
                  </option>
                  <option value="Other" className="bg-[#0a0a0a]">
                    Other
                  </option>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-[#F5F5F5] text-[#0a0a0a] hover:bg-white"
                size="lg"
              >
                {status === "submitting" ? "Submitting..." : "Request a Live Demo"}
              </Button>
              {message && (
                <div
                  className={
                    "rounded-lg p-4 text-center font-medium " +
                    (status === "success"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : status === "error"
                      ? "bg-red-400/10 text-red-400"
                      : "text-[#9A9A9E]")
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
    <footer className="border-t border-[#F5F5F5]/10 py-12 text-center text-sm text-[#9A9A9E]">
      <div className="container flex flex-col items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#F5F5F5]">
          Fieldsta
        </span>
        <div className="flex items-center gap-4">
          <a href="/try" className="hover:text-[#F5F5F5]">
            Try It Live
          </a>
          <a href="/terms" className="hover:text-[#F5F5F5]">
            Terms
          </a>
          <a href="/privacy" className="hover:text-[#F5F5F5]">
            Privacy
          </a>
          <a href="mailto:support@fieldsta.com" className="hover:text-[#F5F5F5]">
            support@fieldsta.com
          </a>
        </div>
        <span>&copy; 2026 Fieldsta.</span>
      </div>
    </footer>
  );
}
