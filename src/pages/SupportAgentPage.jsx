import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, X, Mail, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SalesChatWidget from "@/components/SalesChatWidget";
import InlineSupportChat, { SupportChatFootnote } from "@/components/InlineSupportChat";
import Triangle from "@/components/Triangle";
import { track } from "@vercel/analytics/react";
import { trackEngagement, observeSection } from "@/lib/funnel";

// The support agent's own product page. Until this existed the product's
// entire marketing presence was one strip inside the lead product's pricing
// section — fine for an add-on, wrong for a product being sold standalone
// to cold prospects who have never heard of the lead product. Same honesty
// rules as everywhere else: no invented statistics, no guarantees, a buy
// button only because self-serve fulfillment actually exists, and the
// won't-do list is as prominent as the will-do list because "it escalates
// instead of guessing" IS the pitch.

const STEPS = [
  {
    n: "1",
    title: "Write your facts.",
    body:
      "Hours, services, pricing, policies. Plain text, in your own words. The agent answers only from what you wrote, and nothing else. If you'd rather not start from scratch, it can pull a first draft from your own website for you to edit.",
  },
  {
    n: "2",
    title: "Paste one script tag.",
    body:
      "One line on your website, on any platform that lets you add HTML. The chat bubble appears, matching your brand color if you want, and the setup page confirms when it's live on your site.",
  },
  {
    n: "3",
    title: "It hands off the moment it isn't sure.",
    body:
      "Refunds, complaints, legal questions, commitments: anything outside your facts gets handed to a real person, with the visitor's email captured so nobody is lost overnight.",
  },
];

// Matches DemoLanding.jsx's Reveal exactly (same threshold, duration,
// easing, reduced-motion behavior) — kept as its own local copy rather than
// a shared import because that's the existing convention (ScoreRing.jsx
// already has its own copy too), not a new pattern invented for this page.
//
// This page had ZERO scroll motion before this pass, on a site where every
// other page uses this same reveal throughout DemoLanding. That gap (not a
// missing color or a missing icon) is the concrete, checkable reason the
// lower half read as inert next to the rest of the site.
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

// Counts a number up from 0 once its own Reveal fires, instead of the
// receipt's figures just appearing static — the one place on the page a
// number is worth watching happen rather than only reading. Skips straight
// to the target under reduced motion, same rule Reveal follows.
function useCountUp(target, active, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutExpo -- fast start, settles rather than ticking evenly, which
      // reads as a real count rather than a metronome.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, durationMs]);
  return value;
}

const FAQS = [
  {
    q: "What happens when it doesn't know the answer?",
    a: "It says so and hands off. It never fills a gap with a guess: an answer it can't trace to your facts is an answer it doesn't give.",
  },
  {
    q: "Can it promise my customers things, like discounts or delivery dates?",
    a: "No. Anything that resembles a commitment is escalated to you. That's a design rule, not a setting.",
  },
  {
    q: "What does it cost, and can I cancel?",
    a: "$200/month on its own, or +$150/month added to any Fieldsta plan. 14 days free at the start, cancel anytime from your dashboard.",
  },
  {
    q: "Do I need the lead-response product too?",
    a: "No — this is fully independent. Plenty of businesses only need their existing customers answered at 11pm, not their sales leads.",
  },
  {
    q: "How is this different from a generic chatbot?",
    a: "It only speaks from facts you wrote, it escalates instead of improvising, and a real person is always the fallback. The failure mode of most chat widgets — confidently wrong — is the exact thing this one is built to refuse.",
  },
];

// A jagged bottom edge via clip-path, so the receipt reads as an actual
// slip of paper set down on the page rather than a bordered div that
// happens to contain receipt-shaped text. The dashed rule between the
// header and the line items is the tear a printer leaves; -rotate-[0.6deg]
// is the amount a real one settles at when set down, not squared to the
// page. Numbers only start counting once Receipt itself is in view — the
// parent Reveal firing is what makes `active` true.
const RECEIPT_TEETH = 26;
function receiptClipPath() {
  const points = ["0% 0%", "100% 0%", "100% 92%"];
  for (let i = RECEIPT_TEETH; i >= 0; i--) {
    const x = (i / RECEIPT_TEETH) * 100;
    const y = i % 2 === 0 ? 92 : 100;
    points.push(`${x}% ${y}%`);
  }
  return `polygon(${points.join(", ")})`;
}

function Receipt() {
  const [ref, active] = useReveal();
  const conversations = useCountUp(34, active);
  const messages = useCountUp(121, active);
  const afterHours = useCountUp(12, active);
  const warmLeads = useCountUp(5, active);

  return (
    <div ref={ref} className="mt-6 max-w-md -rotate-[0.6deg]">
      <div
        className="border border-b-0 border-[rgba(var(--text-rgb),0.14)] bg-[var(--bg)] p-5 pb-8 font-mono text-[13px] leading-relaxed shadow-[0_18px_36px_-20px_rgba(0,0,0,0.35)]"
        style={{ clipPath: receiptClipPath() }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-50">
            Sample month
          </div>
          <div className="border border-[rgba(var(--accent-rgb),0.4)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-[var(--accent)]">
            Illustrative
          </div>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-dashed border-[rgba(var(--text-rgb),0.18)] pt-4 opacity-85">
          <div className="flex justify-between">
            <span>Conversations answered</span>
            <span className="tabular-nums">{conversations}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer messages handled</span>
            <span className="tabular-nums">{messages}</span>
          </div>
          <div className="flex justify-between">
            <span>Answered outside business hours</span>
            <span className="tabular-nums">{afterHours}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Handed to you as warm leads</span>
            <span className="tabular-nums">{warmLeads}</span>
          </div>
        </div>
        <div className="mt-4 space-y-1 border-t border-dashed border-[rgba(var(--text-rgb),0.18)] pt-4 opacity-85">
          <div>Your average job: $450</div>
          <div>5 warm leads × $450 = up to $2,250 of potential work</div>
          <div>Agent cost: $200</div>
        </div>
      </div>
      <p className="mt-3 text-[11px] opacity-50">
        Your receipt uses your numbers. Nothing is estimated or invented.
      </p>
    </div>
  );
}

function FaqItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-[15px] font-semibold">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-none opacity-50 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>
      {/* grid-rows 0fr->1fr, not max-height: animates to the answer's real
          height at any length/viewport instead of a guessed cap, and needs
          no JS measurement. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-xl pb-4 text-sm leading-relaxed opacity-70">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function SupportAgentPage() {
  // Attention instrumentation — see lib/funnel.js. This page is where cold
  // clicks land, so it's the one that most needs to say where they leave.
  useEffect(() => trackEngagement("support_agent"), []);

  // Captures ?ref=<code> off a referral link (see /settings/support-widget
  // on the dashboard, where an existing customer gets their own link) so
  // GetStarted's support-agent signup form can forward it later. Stashed
  // under its own key rather than the existing "fieldsta_ref" — that one
  // already means something different (a company-id team invite read by
  // CompanySetup.jsx), and reusing it here would silently break whichever
  // flow read it second.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("fieldsta_referral_code", ref);
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--bg)] font-body text-[var(--text)]">
      <SiteHeader />
      <div className="container relative z-10 max-w-3xl py-12 sm:py-16">
        {/* Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] opacity-60">
            <Triangle />
            24/7 Support Agent
          </div>
          <h1 className="font-editorial text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Your customers ask at 11pm.
            <br />
            Now something answers.
          </h1>
          <p className="max-w-xl pt-2 text-[15px] leading-relaxed opacity-75">
            A chat bubble on your own website that answers your customers any hour, in your voice,
            from facts you wrote — and hands anything sensitive to a real person instead of guessing.
            One line to install.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <a href="/get-started?product=support-agent" onClick={() => track("support_page_buy")}>
            <Button className="bg-[var(--accent)] font-bold text-white hover:bg-[var(--accent-hover)]">
              Start 14 days free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          {/* Scrolls to the inline agent rather than navigating to
              /support-demo. That page still exists and still earns its keep
              for traffic that lands on it directly (the SEO pages' demo CTA
              points there), but sending someone AWAY from this page to a
              near-duplicate of it — to reach a demo this page now contains —
              is a worse journey than moving them 400px down. */}
          <a
            href="#talk-to-it"
            onClick={() => track("support_page_demo")}
            className="text-[13px] opacity-60 transition-opacity hover:opacity-100"
          >
            Talk to it live first →
          </a>
        </div>
        <div className="mt-3 text-xs opacity-50">
          $200/mo on its own · +$150/mo with any plan · $0 today, cancel anytime
        </div>

        {/* Live demo, inline. This page is where nearly all support-motion
            cold-email clicks land now (ctaUrl routes here), and the demo is
            the page's strongest argument — making it one more click away was
            losing the least-motivated visitors.
            It used to be an <iframe> of studio's /support-demo. See
            InlineSupportChat for why that shape was wrong: that URL is a
            whole landing page, so it duplicated this page's own sections
            inside a scroll box, and the real widget it carried put a second
            chat bubble in the frame's corner — next to the sales bubble
            already in the page's corner. Talking to the API directly is what
            /try does for the lead product, and it makes the conversation
            visible instead of one click inside a nested page. */}
        <div id="talk-to-it" className="mt-14 scroll-mt-20 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Talk to it right now</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-70">
            This is the live agent. Ask it what you&apos;d ask any business after hours.
          </p>
          {/* The confusion this exists to head off: someone talks to THIS
              (the product itself, demonstrating what it'll say to your
              customers) and assumes it's also who they'd talk to about
              buying it -- it isn't, and it doesn't know how to sell
              itself. Harper, the actual sales chat, is the bubble in the
              corner of every page including this one. */}
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed opacity-50">
            This is the product itself, not our sales team — it&apos;s demonstrating what it&apos;d
            say to your customers, so it only knows Fieldsta&apos;s own facts. Questions about
            pricing, plans, or getting set up go to Harper, the chat bubble in the corner.
          </p>
          <div className="mt-5">
            <InlineSupportChat />
            <SupportChatFootnote />
          </div>
        </div>

        {/* The monthly receipt — the answer to "this costs $X, makes me $Y".
            Given an actual receipt's shape (torn edge, slight set-down tilt)
            instead of a plain bordered box, since the content already IS a
            receipt conceptually — the visual was the one thing not
            following through on its own idea. Numbers count up once
            in view rather than just appearing, the one place on the page
            worth watching a number happen instead of only reading it.
            Still clearly labeled a sample with illustrative numbers; every
            real receipt is counted from the customer's own conversations,
            and the dollar line only ever uses THEIR average job value. */}
        <Reveal className="mt-14 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Every month, you get the math</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-70">
            A monthly receipt, counted from your agent&apos;s real conversations. You always know what it did against what it costs.
          </p>
          <Receipt />
        </Reveal>

        {/* The concierge offer — same promise the outbound emails make
            (variant B's "reply and I'll set it up, free for a week"), stated
            on the page so email and site tell one story. Given a callout
            treatment instead of a bare paragraph so it reads as an offer
            rather than blending into the surrounding prose rhythm. */}
        <Reveal delay={80} className="mt-12 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Or let us set it up for you</h2>
          <div className="mt-4 flex max-w-xl items-start gap-4 border border-[rgba(var(--text-rgb),0.12)] p-5">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]">
              <Mail className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed opacity-80">
              Reply to any email from us with your website — or write to{" "}
              <a href="mailto:support@fieldsta.com" className="underline underline-offset-2">
                support@fieldsta.com
              </a>{" "}
              — and we&apos;ll install it on your site ourselves, free for a week. If it
              doesn&apos;t catch anything worth keeping, we take it down and you owe nothing.
            </p>
          </div>
        </Reveal>

        {/* How it works — a real sequence (each step depends on the last),
            so the numbering stays; given a connecting line and bigger
            numerals so it reads as one wired-together path rather than
            three stacked list items. */}
        <Reveal className="mt-14 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">How it gets onto your site</h2>
          <div className="relative mt-7 space-y-8">
            <div
              aria-hidden="true"
              className="absolute bottom-5 left-[19px] top-5 w-px bg-[rgba(var(--text-rgb),0.12)]"
            />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120} className="relative flex gap-5">
                <div className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[rgba(var(--text-rgb),0.16)] bg-[var(--bg)] font-editorial text-base font-medium">
                  {s.n}
                </div>
                <div className="pt-1.5">
                  <div className="text-[15px] font-semibold">{s.title}</div>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed opacity-70">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* Will / won't — the honesty section IS the differentiator, so it's
            the one place on the page that looks different rather than just
            reading different: full-bleed, always-dark regardless of site
            theme, with the same black + red-glow signature /support-demo's
            own hero uses — this is the agent's own space, on brand with
            where the live agent actually lives. Everything else on the page
            stays quiet on purpose; this is the one bold move. */}
        <div className="relative left-1/2 right-1/2 -mx-[50vw] mt-16 w-screen overflow-hidden bg-black py-16 text-white sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 55% at 15% 15%, rgba(239,68,68,0.22), transparent 60%), radial-gradient(50% 50% at 100% 100%, rgba(239,68,68,0.12), transparent 65%)",
            }}
          />
          <div className="container relative max-w-3xl">
            <Reveal>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] opacity-60">
                <Triangle />
                The differentiator
              </div>
              <h2 className="mt-3 font-editorial text-2xl font-medium leading-tight sm:text-3xl">
                What it will and won&apos;t do
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-10 sm:grid-cols-2">
              <Reveal delay={100}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                  It will
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
                  {[
                    "Answer instantly, any hour, from the facts you wrote",
                    "Match your voice and your brand color",
                    "Capture the visitor's email when a person needs to follow up",
                    "Notify you the moment something is escalated",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={220}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  It won&apos;t
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
                  {[
                    "Invent an answer it can't trace to your facts",
                    "Promise refunds, discounts, or delivery dates",
                    "Handle legal threats or complaints on its own",
                    "Keep talking when a human should take over",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[rgba(239,68,68,0.15)] text-[var(--accent)]">
                        <X className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </div>

        {/* FAQ — collapsed by default (was a dense wall of five always-open
            answers), so the reader sees the five questions first and opens
            only what they actually want. */}
        <Reveal className="mt-16 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Questions people actually ask</h2>
          <div className="mt-2 divide-y divide-[rgba(var(--text-rgb),0.06)]">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </Reveal>

        {/* Close — bigger than the section headings above it, so the page
            bookends the hero instead of trailing off at the same weight as
            everything before it. */}
        <Reveal className="mt-4 border-t border-[rgba(var(--text-rgb),0.08)] pt-12">
          <h2 className="font-editorial text-2xl font-medium leading-tight sm:text-3xl">
            Put it on your site today
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-75">
            Self-serve start to finish: create the account, write your facts, paste the tag. If you get stuck, a person answers.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href="/get-started?product=support-agent" onClick={() => track("support_page_buy_bottom")}>
              <Button className="bg-[var(--accent)] font-bold text-white hover:bg-[var(--accent-hover)]">
                Start 14 days free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link to="/products" className="text-[13px] opacity-60 transition-opacity hover:opacity-100">
              See all products →
            </Link>
          </div>
        </Reveal>
      </div>
      <SiteFooter />
      <SalesChatWidget />
    </div>
  );
}
