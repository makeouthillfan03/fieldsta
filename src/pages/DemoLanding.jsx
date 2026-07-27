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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import ParticleSkyline from "@/components/ParticleSkyline";
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
      <CitySection />
      <HowItWorks />
      <Features />
      <FAQ />
      <FinalCTA />
      <DemoForm />
      <Footer />
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

// Wireframe skyline — an original outline composition (tapered spire, no
// specific building or photograph) standing in for "NYC" as ambient
// background texture rather than literal photography. Small dots along the
// rooftops twinkle like windows; the spire carries a slow red beacon pulse,
// the one warm-red accent in the scene.
const windowLights = [
  { left: "5%", top: "58%", delay: "0s", duration: "3.2s" },
  { left: "11%", top: "42%", delay: "0.6s", duration: "4s" },
  { left: "18%", top: "63%", delay: "1.1s", duration: "3.6s" },
  { left: "27%", top: "38%", delay: "0.3s", duration: "4.4s" },
  { left: "36%", top: "70%", delay: "1.4s", duration: "3s" },
  { left: "48%", top: "52%", delay: "0.8s", duration: "3.8s" },
  { left: "56%", top: "66%", delay: "0.2s", duration: "4.2s" },
  { left: "66%", top: "45%", delay: "1.6s", duration: "3.4s" },
  { left: "76%", top: "60%", delay: "0.9s", duration: "4s" },
  { left: "85%", top: "50%", delay: "0.4s", duration: "3.6s" },
  { left: "93%", top: "62%", delay: "1.2s", duration: "3.9s" },
];

function SkylineSilhouette({ className = "" }) {
  return (
    <div className={cn("relative", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
        className="h-full w-full text-[#F5F5F5]/25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="0" y="120" width="90" height="100" />
        <rect x="95" y="90" width="60" height="130" />
        <rect x="160" y="140" width="70" height="80" />
        <rect x="235" y="70" width="50" height="150" />
        <rect x="290" y="110" width="85" height="110" />
        <polygon points="410,220 410,60 445,10 480,60 480,220" />
        <rect x="490" y="95" width="65" height="125" />
        <rect x="560" y="130" width="55" height="90" />
        <rect x="620" y="80" width="70" height="140" />
        <rect x="695" y="115" width="60" height="105" />
        <rect x="760" y="60" width="45" height="160" />
        <rect x="810" y="125" width="80" height="95" />
        <rect x="895" y="95" width="55" height="125" />
        <rect x="955" y="135" width="65" height="85" />
        <rect x="1025" y="75" width="50" height="145" />
        <rect x="1080" y="115" width="120" height="105" />
      </svg>
      {windowLights.map((light, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="animate-twinkle absolute h-[3px] w-[3px] rounded-full bg-[#F5F5F5] sm:h-1 sm:w-1"
          style={{ left: light.left, top: light.top, animationDelay: light.delay, animationDuration: light.duration }}
        />
      ))}
      <span
        aria-hidden="true"
        className="animate-beacon absolute h-1.5 w-1.5 rounded-full bg-[#EF4444] shadow-[0_0_6px_2px_rgba(239,68,68,0.6)]"
        style={{ left: "37%", top: "3%" }}
      />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#F5F5F5]/10 bg-[#060607]/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
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
        </div>
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
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <h1 className="animate-fade-up max-w-3xl text-4xl font-light leading-[1.12] tracking-tight text-[#6F6F75] sm:text-5xl lg:text-6xl">
            <span className="text-[#F5F5F5]">Answer every lead</span>
            <br />
            before your competitor
            <br />
            picks up the phone
          </h1>

          <a href="#demo" className="animate-fade-up [animation-delay:160ms] shrink-0">
            <Button
              size="lg"
              className="w-full rounded-none bg-[#F5F5F5] px-7 text-[#0a0a0a] hover:bg-white md:w-auto"
            >
              Request a demo
            </Button>
          </a>
        </div>

        <p className="animate-fade-up [animation-delay:280ms] mt-10 max-w-lg text-[15px] leading-relaxed text-[#9A9A9E]">
          Fieldsta responds to every inbound lead, qualifies them, and books the meeting
          straight onto your calendar — with a human reviewing every booking.
        </p>
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

// Placeholder background (gradient + the wireframe skyline) standing in for
// a real photo. Drop a licensed/AI-generated NYC image at
// src/assets/nyc-hero.jpg and swap the div below for an <img> once one
// exists — everything else (tilt/scale/reduced-motion handling) stays the
// same.
function CitySection() {
  return (
    <ContainerScroll
      titleComponent={
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Built for the city that doesn&apos;t wait for business hours.
        </h2>
      }
    >
      <div className="relative flex h-full w-full items-end justify-center overflow-hidden bg-gradient-to-b from-[#050506] via-[#131315] to-[#212124]">
        <div
          aria-hidden="true"
          className="animate-drift pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 rounded-full bg-[#F5F5F5]/10 blur-[100px]"
        />
        <SkylineSilhouette className="relative h-2/3 w-full" />
      </div>
    </ContainerScroll>
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
    description: "Straight onto your calendar. A human reviews every booking before it's confirmed.",
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
    title: "Instant response",
    description: "Every inbound lead hears back right away, day or night.",
  },
  {
    icon: MessageSquareText,
    title: "Real qualification",
    description: "Leads are asked the questions your team would ask, before they hit your calendar.",
  },
  {
    icon: ShieldCheck,
    title: "Human-reviewed booking",
    description: "Nothing lands on your calendar without a person checking it first.",
  },
  {
    icon: Plug,
    title: "Works alongside your CRM",
    description: "Tell us what you use — HubSpot, Salesforce, or nothing at all — and we'll fit in.",
  },
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
    a: "Yes — every meeting Fieldsta books is reviewed by a human before it's confirmed on your calendar.",
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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3100";
      const res = await fetch(`${apiUrl}/api/lead`, {
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
