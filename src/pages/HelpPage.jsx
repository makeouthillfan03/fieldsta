import SiteHeader from "@/components/SiteHeader";
import SalesChatWidget from "@/components/SalesChatWidget";
import Triangle from "@/components/Triangle";

// The public help page — written to be accurate to what the product
// actually does today, nothing aspirational. Every claim here is a
// behavior that exists and was verified; when the product changes, this
// page is part of the change. A docs page that drifts from reality is
// worse than none: it burns exactly the trust it exists to build.
//
// Deliberately one page with anchored sections rather than a docs site —
// five honest articles beat an empty knowledge-base skeleton, and a
// buyer skimming before purchase reads exactly this much.

const ARTICLES = [
  {
    id: "lead-response",
    title: "Getting started with AI Lead Response",
    body: [
      ["How it works", "A lead reaches Fieldsta through your form, webhook, or Meta Lead Ads. Within about a minute the agent qualifies it against criteria you define, drafts a reply in your voice, and either holds it for your one-click review (the default) or sends it automatically if you've turned auto-respond on. Every booking is reviewed by a human before it's confirmed — that's a product rule, not a setting."],
      ["If you don't get to a draft", "Leads go cold in hours, so review mode doesn't mean a reply waits forever. If a drafted reply sits unreviewed for 8 hours, straightforward ones send themselves rather than let the lead go. Anything that proposes a meeting, turns someone down, or that the agent isn't confident about waits for you however long it takes — and you get an email hours before anything sends, so nothing goes out without warning. Change the timing or switch it off entirely under Reply Style in your dashboard."],
      ["Your first ten minutes", "Sign up at fieldsta.com/get-started (14 days free, no card). Set your password from the email, then open Qualifying Rules and make the criteria yours — the agent is only as sharp as what you tell it a good lead looks like. Point your form or webhook at your intake address, send yourself a test lead, and watch it arrive in the Inbox already answered."],
      ["It learns from you", "Every time you edit a draft before approving it, that correction becomes an example the agent follows next time. You're not configuring a bot; you're training your replacement for the 2am shift."],
    ],
  },
  {
    id: "widget-install",
    title: "Installing the 24/7 Support Agent on your website",
    body: [
      ["One line", "In your dashboard, open Chat Widget. Your install snippet is pre-filled — copy it and paste it anywhere in your site's HTML. On Wix: Settings → Custom Code. Squarespace: Settings → Advanced → Code Injection (Footer). WordPress: any headers-and-footers plugin. Shopify: theme.liquid before </body>."],
      ["It confirms itself", "The same dashboard page shows a detection panel that flips green the moment your published site loads the widget — you never have to wonder whether the paste worked. If you'd rather not touch your site at all, the page has a one-click email that sends the snippet and instructions to whoever runs it for you."],
      ["If you cancel", "The bubble removes itself from your site automatically. There's no code to clean up — the line you pasted simply does nothing."],
    ],
  },
  {
    id: "teach-agent",
    title: "Teaching your support agent what it knows",
    body: [
      ["The knowledge box", "Your agent states only the facts you give it — hours, service area, what you do and don't do, the answers to questions you get every week. Write them in the Chat Widget page's knowledge editor, or paste a page of your website into the Import field and review what it extracts before saving. Nothing reaches the live agent until you hit Save."],
      ["What it refuses to do", "Anything involving money, complaints, cancellations, legal topics, or commitments gets handed to a person instead of guessed at — the visitor is told a human will follow up, and the conversation is flagged in your dashboard and Slack. A wrong answer at 2am is worse than no answer; the agent is built to know that."],
      ["Visitors keep their thread", "If a visitor leaves and comes back, their conversation restores. If they leave an email, escalations reach you with a way to actually respond — and the conversation joins that contact's timeline in your CRM view."],
    ],
  },
  {
    id: "billing",
    title: "Billing, trials, and cancelling",
    body: [
      ["Trials", "The core product is 14 days free with no card. The support agent has its own 14-day free window — turn it on from your dashboard, and if you add billing early you're still not charged until the window ends. If you do nothing, it pauses itself politely instead of charging you."],
      ["Managing billing", "Everything runs through Stripe. From Billing settings you can update cards, view invoices, and cancel — cancellation is as easy as signup, and a cancelled support-agent subscription turns the agent off without touching the rest of your account."],
      ["Prices", "Lead Response starts at $500/mo. The 24/7 Support Agent is $200/mo on its own or +$150/mo with any plan. Current pricing for everything is always at fieldsta.com/products."],
    ],
  },
  {
    id: "data",
    title: "Your data",
    body: [
      ["The short version", "Your leads' data is never sold, to anyone, for any reason. It's encrypted in transit and access-controlled at rest. Email us and we delete everything tied to your account — no retention runaround."],
      ["What the AI sees", "The agents work only from your own configuration and your own conversations. Support-agent knowledge is only what you saved. Analytics and CRM views are computed from your data alone — nothing is pooled across customers, and the AI summaries on those pages can only restate numbers the system computed; they can't invent them."],
      ["The full documents", "Terms at fieldsta.com/terms, privacy policy at fieldsta.com/privacy. Questions to support@fieldsta.com get answered by a person."],
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="relative min-h-screen bg-[var(--bg)] font-body text-[var(--text)]">
      <SiteHeader />
      <div className="container relative z-10 max-w-2xl py-12 sm:py-16">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] opacity-60">
            <Triangle />
            Help
          </div>
          <h1 className="font-editorial text-3xl font-medium tracking-tight sm:text-4xl">
            How everything works
          </h1>
          <p className="max-w-lg text-sm opacity-70">
            Five short reads covering the whole product. Anything they don&apos;t answer, the chat
            bubble below will — or email{" "}
            <a href="mailto:support@fieldsta.com" className="underline underline-offset-2">
              support@fieldsta.com
            </a>{" "}
            and a person replies.
          </p>
        </div>

        <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          {ARTICLES.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="opacity-60 transition-opacity hover:opacity-100">
              {a.title} →
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-0 divide-y divide-[rgba(var(--text-rgb),0.08)]">
          {ARTICLES.map((a) => (
            <article key={a.id} id={a.id} className="scroll-mt-24 py-10 first:pt-4">
              <h2 className="font-editorial text-xl font-medium">{a.title}</h2>
              {a.body.map(([sub, text]) => (
                <div key={sub} className="mt-5">
                  <h3 className="text-sm font-semibold">{sub}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed opacity-75">{text}</p>
                </div>
              ))}
            </article>
          ))}
        </div>
      </div>
      <SalesChatWidget />
    </div>
  );
}
