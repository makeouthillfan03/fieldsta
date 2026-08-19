import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SalesChatWidget from "@/components/SalesChatWidget";
import Triangle from "@/components/Triangle";
import { track } from "@vercel/analytics/react";

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
      "Hours, services, pricing, policies — plain text, in your own words. The agent answers only from what you wrote, and nothing else. If you'd rather not start from scratch, it can pull a first draft from your own website for you to edit.",
  },
  {
    n: "2",
    title: "Paste one script tag.",
    body:
      "One line on your website — any platform that lets you add HTML. The chat bubble appears, matching your brand color if you want, and the setup page confirms when it's live on your site.",
  },
  {
    n: "3",
    title: "It hands off the moment it isn't sure.",
    body:
      "Anything outside your facts — refunds, complaints, legal, commitments — gets escalated to a real person, with the visitor's email captured so nobody is lost overnight.",
  },
];

const FAQS = [
  {
    q: "What happens when it doesn't know the answer?",
    a: "It says so and hands off. It never fills a gap with a guess — an answer it can't trace to your facts is an answer it doesn't give.",
  },
  {
    q: "Can it promise my customers things — discounts, refunds, delivery dates?",
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

export default function SupportAgentPage() {
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
          <a
            href="/support-demo"
            onClick={() => track("support_page_demo")}
            className="text-[13px] opacity-60 transition-opacity hover:opacity-100"
          >
            Talk to it live first →
          </a>
        </div>
        <div className="mt-3 text-xs opacity-50">
          $200/mo on its own · +$150/mo with any plan · $0 today, cancel anytime
        </div>

        {/* Live demo, embedded. This page is where nearly all support-motion
            cold-email clicks land now (ctaUrl routes here), and the demo is
            the page's strongest argument — making it one more click away was
            losing the least-motivated visitors. The studio serves
            /support-demo with a frame-ancestors exemption scoped to this
            site; everything inside the frame is the real live widget. */}
        <div className="mt-14 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Talk to it right now</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-70">
            This is the live agent, not a recording — ask it what you&apos;d ask any business
            after hours.
          </p>
          <div className="mt-5 overflow-hidden rounded-none border border-[rgba(var(--text-rgb),0.14)]">
            <iframe
              src="https://studio.fieldsta.com/support-demo"
              title="Live support agent demo"
              className="h-[560px] w-full"
              loading="lazy"
            />
          </div>
        </div>

        {/* The monthly receipt — the answer to "this costs $X, makes me $Y".
            Clearly labeled a sample with illustrative numbers; every real
            receipt is counted from the customer's own conversations, and the
            dollar line only ever uses THEIR average job value. */}
        <div className="mt-12 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Every month, you get the math</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-70">
            A monthly receipt, counted from your agent&apos;s real conversations — so you always
            know what it&apos;s doing against what it costs.
          </p>
          <div className="mt-5 max-w-md border border-[rgba(var(--text-rgb),0.12)] p-5 font-mono text-[13px] leading-relaxed">
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-50">
              Sample month — illustrative numbers
            </div>
            <div className="mt-3 space-y-1 opacity-85">
              <div>Conversations answered: 34</div>
              <div>Customer messages handled: 121</div>
              <div>Answered outside business hours: 12</div>
              <div>Handed to you as warm leads: 5</div>
            </div>
            <div className="mt-3 border-t border-[rgba(var(--text-rgb),0.1)] pt-3 opacity-85">
              Your average job: $450
              <br />5 warm leads × $450 = up to $2,250 of potential work
              <br />
              Agent cost: $200
            </div>
            <div className="mt-3 text-[11px] opacity-50">
              Your receipt uses your numbers — nothing estimated, nothing invented.
            </div>
          </div>
        </div>

        {/* The concierge offer — same promise the outbound emails make
            (variant B's "reply and I'll set it up, free for a week"), stated
            on the page so email and site tell one story. */}
        <div className="mt-12 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Or let us set it up for you</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-70">
            Reply to any email from us with your website — or write to{" "}
            <a href="mailto:support@fieldsta.com" className="underline underline-offset-2">
              support@fieldsta.com
            </a>{" "}
            — and we&apos;ll install it on your site ourselves, free for a week. If it doesn&apos;t
            catch anything worth keeping, we take it down and you owe nothing.
          </p>
        </div>

        {/* How it works */}
        <div className="mt-14 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">How it gets onto your site</h2>
          <div className="mt-5 space-y-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4">
                <div className="font-editorial text-xl opacity-30">{s.n}</div>
                <div>
                  <div className="text-[15px] font-semibold">{s.title}</div>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed opacity-70">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Will / won't — the honesty section IS the differentiator */}
        <div className="mt-12 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">What it will and won&apos;t do</h2>
          <div className="mt-5 grid gap-8 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                It will
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-75">
                <li>Answer instantly, any hour, from the facts you wrote</li>
                <li>Match your voice and your brand color</li>
                <li>Capture the visitor&apos;s email when a person needs to follow up</li>
                <li>Notify you the moment something is escalated</li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                It won&apos;t
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-75">
                <li>Invent an answer it can&apos;t trace to your facts</li>
                <li>Promise refunds, discounts, or delivery dates</li>
                <li>Handle legal threats or complaints on its own</li>
                <li>Keep talking when a human should take over</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Questions people actually ask</h2>
          <div className="mt-2 divide-y divide-[rgba(var(--text-rgb),0.06)]">
            {FAQS.map((f) => (
              <div key={f.q} className="py-5">
                <div className="text-[15px] font-semibold">{f.q}</div>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed opacity-70">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Close */}
        <div className="mt-4 border-t border-[rgba(var(--text-rgb),0.08)] pt-10">
          <h2 className="font-editorial text-xl font-medium">Put it on your site today</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-75">
            Self-serve start to finish — create the account, write your facts, paste the tag. If
            you get stuck, a person answers.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
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
        </div>
      </div>
      <SiteFooter />
      <SalesChatWidget />
    </div>
  );
}
