import { useRef, useState } from "react";
import {
  Zap,
  ShieldCheck,
  CalendarCheck,
  Inbox,
  MessageSquareText,
  Plug,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

// Replaces the old inline-styled single-hero page ported from the
// standalone fieldsta-lead-booker project. Same value prop and same
// /api/lead submit target — just built out into a full page and restyled
// to look like a real product site instead of a one-off landing page,
// ahead of the 2026-07-25 cold-call push. No fabricated logos, metrics,
// or testimonials — nothing here claims a customer/number we can't back up.
export default function DemoLanding() {
  return (
    <div className="bg-white text-slate-900">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <FAQ />
      <FinalCTA />
      <DemoForm />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0c10]/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <span className="text-lg font-extrabold tracking-tight text-white">Fieldsta</span>
        <a href="#demo">
          <Button size="sm" className="bg-white text-[#0b0c10] hover:bg-white/90">
            Get a Live Demo
          </Button>
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0b0c10] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]"
      />
      <div className="container relative py-24 text-center sm:py-32">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/70">
          AI-Powered Lead Response
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Never Lose a Lead to Slow Response Time Again
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70 sm:text-xl">
          Fieldsta replies to every inbound lead in under 5 minutes, qualifies them, and books
          the meeting straight onto your calendar — with a human reviewing every booking.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#demo">
            <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
              Get a Live Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href="#how-it-works">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
            >
              See how it works
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    icon: Inbox,
    title: "A lead comes in",
    description: "From your website, a call, or wherever leads already reach you.",
  },
  {
    icon: MessageSquareText,
    title: "Fieldsta responds and qualifies",
    description: "Under 5 minutes, every time — asking the right questions before anyone's time is wasted.",
  },
  {
    icon: CalendarCheck,
    title: "The meeting gets booked",
    description: "Straight onto your calendar. A human reviews every booking before it's confirmed.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="container">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <div className="mx-auto mt-16 grid max-w-4xl gap-12 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="h-7 w-7" />
              </div>
              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step {i + 1}
              </div>
              <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
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
    description: "Every inbound lead hears back in under 5 minutes, day or night.",
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
    <section className="bg-slate-50 py-24">
      <div className="container">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Built to stop leads from going cold
        </h2>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} className="border-slate-200 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
            </Card>
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
    q: "What does \"under 5 minutes\" mean exactly?",
    a: "From the moment a lead comes in, Fieldsta responds and starts qualifying them in under 5 minutes — instead of the hours it can take a busy team to get back to someone.",
  },
  {
    q: "Is a real person involved at all?",
    a: "Yes — every meeting Fieldsta books is reviewed by a human before it's confirmed on your calendar.",
  },
];

function FAQ() {
  return (
    <section className="bg-white py-24">
      <div className="container max-w-2xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Questions
        </h2>
        <div className="mt-12 divide-y divide-slate-200">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-left text-base font-semibold">
                {item.q}
                <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[#0b0c10] py-20 text-center text-white">
      <div className="container">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to stop losing leads?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/70">
          See Fieldsta on a live call with your own leads and workflow.
        </p>
        <a href="#demo">
          <Button size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
            Get a Live Demo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
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

  return (
    <section id="demo" className="bg-slate-50 py-24">
      <div className="container">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Get a Live Demo
        </h2>
        <Card className="mx-auto mt-10 max-w-md border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" ref={firstNameRef} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" ref={lastNameRef} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Business Email</Label>
              <Input id="email" type="email" ref={emailRef} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="crm">What CRM do you use?</Label>
              <Input
                id="crm"
                ref={crmRef}
                placeholder="e.g. HubSpot, Salesforce, none"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="source">How did you hear about us?</Label>
              <Select id="source" ref={sourceRef} defaultValue="" className="mt-1.5">
                <option value="">Select one</option>
                <option value="Referral">Referral</option>
                <option value="Google Search">Google Search</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Email/Cold Outreach">Email / Cold Outreach</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={status === "submitting"}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              {status === "submitting" ? "Submitting..." : "Get a Live Demo"}
            </Button>
            {message && (
              <p
                className={
                  "text-center text-sm " +
                  (status === "success"
                    ? "text-green-700"
                    : status === "error"
                    ? "text-red-600"
                    : "text-muted-foreground")
                }
                role="status"
              >
                {message}
              </p>
            )}
          </form>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-center text-sm text-muted-foreground">
      <div className="container flex flex-col items-center gap-3">
        <span className="font-bold text-slate-900">Fieldsta</span>
        <div className="flex items-center gap-4">
          <a href="/terms" className="hover:text-slate-900">
            Terms
          </a>
          <a href="mailto:support@fieldsta.com" className="hover:text-slate-900">
            support@fieldsta.com
          </a>
        </div>
        <span>&copy; 2026 Fieldsta.</span>
      </div>
    </footer>
  );
}
