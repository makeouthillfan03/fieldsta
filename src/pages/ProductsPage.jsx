import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import SalesChatWidget from "@/components/SalesChatWidget";
import Triangle from "@/components/Triangle";
import { track } from "@vercel/analytics/react";

// The product family on one page, priced independently and as a bundle.
// Honesty rules that shaped every CTA here:
//   - A buy button exists ONLY where self-serve fulfillment actually exists
//     (lead response signup, the support agent's one-click checkout).
//   - Early-access products route to Harper — a human-adjacent path for
//     things the team still enables by hand — never a checkout that would
//     take money for an unprovisioned feature.
//   - Coming-soon gets an interest signal, not a promise.
// Bundle math is a live prototype: the numbers are real intent, labelled
// as preview so nobody screenshots them as a contract.

const AGENTS_BASE = import.meta.env.VITE_AGENTS_BASE_URL || "https://studio.fieldsta.com";

const STATUS_STYLE = {
  live: "text-emerald-400",
  early: "text-amber-400",
  soon: "text-[var(--text)] opacity-50",
};

function StatusTag({ kind, children }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${STATUS_STYLE[kind]}`}>
      {children}
    </span>
  );
}

function openChat(event) {
  track(event);
  window.dispatchEvent(new CustomEvent("fieldsta:open-chat"));
}

function BuySupportButton() {
  const [state, setState] = useState("idle");
  async function buy() {
    if (state === "opening") return;
    setState("opening");
    track("products_support_buy");
    try {
      const res = await fetch(`${AGENTS_BASE}/api/support-agent-checkout`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error("no url");
      window.location.href = data.url;
    } catch {
      setState("error");
    }
  }
  return (
    <div>
      <Button onClick={buy} disabled={state === "opening"} className="bg-[var(--accent)] font-bold text-white hover:bg-[var(--accent-hover)]">
        {state === "opening" ? "Opening checkout…" : "Start 14 days free"}
        <ArrowRight className="h-4 w-4" />
      </Button>
      {state === "error" ? (
        <div className="mt-2 text-xs text-[var(--accent)]">Checkout hiccuped — try again.</div>
      ) : (
        <div className="mt-2 text-xs opacity-50">
          One-minute Stripe checkout — $0 today, then one line to install on your site.
        </div>
      )}
    </div>
  );
}

const PRODUCTS = [
  {
    id: "lead-response",
    status: "live",
    statusLabel: "Live",
    name: "AI Lead Response",
    tag: "The core product",
    what: "Replies to every inbound lead in under a minute, qualifies it against your own criteria, and books the meeting — with a human reviewing every booking. Learns from every edit you make.",
    priceLine: "$500/mo · higher-volume tiers at $1,500 and $3,000",
    independent: "Sold on its own — most clients start here.",
    cta: "signup",
  },
  {
    id: "support-agent",
    status: "live",
    statusLabel: "Live",
    name: "24/7 Support Agent",
    tag: "For your existing customers",
    what: "A chat bubble on your own website that answers your customers any hour in your voice, and hands anything sensitive — refunds, complaints, commitments — to a person instead of guessing. One line to install.",
    priceLine: "$200/mo on its own · +$150/mo with any plan",
    independent: "Fully independent — works without the lead-response product.",
    cta: "buy-support",
  },
  {
    id: "intelligence",
    status: "early",
    statusLabel: "Early access",
    name: "Intelligence Suite",
    tag: "CRM · Analytics · Customer Success",
    what: "Three dashboards over everything Fieldsta knows for you: who to act on today and why (CRM), whether the machine is actually fast and autonomous (Analytics), and whether your account is healthy — with new risks pushed to your Slack automatically (Customer Success). Every number carries its evidence; the AI can only narrate what the engines computed.",
    priceLine: "+$100/mo with any plan · included on $1,500+ tiers",
    independent: "Not sold alone — it runs on the data your other Fieldsta products generate.",
    cta: "harper",
    ctaLabel: "Ask Harper for early access",
    ctaEvent: "products_intelligence_cta",
  },
  {
    id: "outbound",
    status: "soon",
    statusLabel: "Coming soon",
    name: "Outbound",
    tag: "We find the leads, then answer them",
    what: "Cold outreach from your own domains with your own copy — warmed, sequenced, reply-detected — feeding straight into the same lead-response machine. Built and running in test; opening to clients soon.",
    priceLine: "Pricing announced at launch",
    independent: "Will require the lead-response product — outbound generates the leads it answers.",
    cta: "notify",
  },
];

export default function ProductsPage() {
  return (
    <div className="relative min-h-screen bg-[var(--bg)] font-body text-[var(--text)]">
      <SiteHeader />
      <div className="container relative z-10 max-w-3xl py-12 sm:py-16">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] opacity-60">
            <Triangle />
            Products
          </div>
          <h1 className="font-editorial text-3xl font-medium tracking-tight sm:text-4xl">
            One machine, four products.
          </h1>
          <p className="max-w-lg text-sm opacity-70">
            Each works on its own. Together they cover the whole loop — finding leads, answering
            them, supporting the customers they become, and telling you honestly how it&apos;s all
            going.
          </p>
        </div>

        <div className="mt-12 space-y-0 divide-y divide-[rgba(var(--text-rgb),0.08)]">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="py-9 first:pt-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <StatusTag kind={p.status}>{p.statusLabel}</StatusTag>
                <h2 className="font-editorial text-xl font-medium">{p.name}</h2>
                <span className="text-xs opacity-50">{p.tag}</span>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-75">{p.what}</p>
              <div className="mt-3 text-sm font-semibold">{p.priceLine}</div>
              <div className="mt-1 text-xs opacity-50">{p.independent}</div>
              <div className="mt-4">
                {p.cta === "signup" && (
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <a href="/get-started">
                        <Button className="bg-[var(--accent)] font-bold text-white hover:bg-[var(--accent-hover)]">
                          Start free trial
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </a>
                      <Link to="/try" className="text-[13px] opacity-60 transition-opacity hover:opacity-100">
                        See it run first →
                      </Link>
                    </div>
                    {/* The whole signup really is two fields with no card
                        (see GetStarted.jsx / quick-checkout's skipCheckout
                        branch) — saying so at the button is what makes the
                        click feel safe. */}
                    <div className="mt-2 text-xs opacity-50">
                      Self-serve — a name and an email, live in about two minutes. No card, no call.
                    </div>
                  </div>
                )}
                {p.cta === "buy-support" && <BuySupportButton />}
                {p.cta === "harper" && (
                  <button
                    type="button"
                    onClick={() => openChat(p.ctaEvent)}
                    className="text-sm font-semibold text-[var(--accent)] transition-opacity hover:opacity-80"
                  >
                    {p.ctaLabel} →
                  </button>
                )}
                {p.cta === "notify" && (
                  <a
                    href="mailto:support@fieldsta.com?subject=Interested%20in%20Fieldsta%20outbound"
                    onClick={() => track("products_outbound_interest")}
                    className="text-[13px] opacity-60 transition-opacity hover:opacity-100"
                  >
                    Get notified →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bundle prototype — labelled as preview, routed to a human. */}
        <div className="mt-4 border-t border-[rgba(var(--text-rgb),0.08)] pt-9">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] opacity-50">
            <Triangle />
            Bundle — pricing preview
          </div>
          <h2 className="mt-3 font-editorial text-xl font-medium">The whole stack</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-75">
            Lead Response + 24/7 Support Agent + Intelligence Suite, one bill.
          </p>
          <div className="mt-3 text-sm">
            <span className="opacity-50 line-through">$750/mo separately</span>
            <span className="ml-3 text-lg font-bold">$700/mo bundled</span>
            <span className="ml-2 text-xs opacity-50">14-day free trial covers all of it</span>
          </div>
          <button
            type="button"
            onClick={() => openChat("products_bundle_cta")}
            className="mt-4 text-sm font-semibold text-[var(--accent)] transition-opacity hover:opacity-80"
          >
            Talk to Harper about the bundle →
          </button>
        </div>
      </div>
      <SalesChatWidget />
    </div>
  );
}
