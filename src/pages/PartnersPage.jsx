import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

// The agency partner program — a close path that doesn't depend on cold
// email deliverability or Harper: agencies already own the client rosters,
// and one partnership equals 10-30 end customers. Deliberately unlinked
// from the main nav for now; it's the landing page for the partner
// outreach drafts (scratch/partner-program-drafts.md in the agents repo)
// and for anyone an agency forwards it to.
//
// Terms stated here (30% recurring) are the program of record — change
// them here FIRST if the deal changes, since emails point people at this.

const STEPS = [
  {
    n: "1",
    title: "You introduce a client",
    body: "One email or a shared link. Clients who miss after-hours questions are the fit — trades, practices, local services.",
  },
  {
    n: "2",
    title: "We do the entire setup",
    body: "Facts, install, tuning — the client never needs to touch anything technical, and neither do you.",
  },
  {
    n: "3",
    title: "You get paid monthly, ongoing",
    body: "The client pays $200/mo. You keep 30% — $60/mo per client, for as long as they stay. No delivery work on your side.",
  },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader />
      <main className="container max-w-3xl py-16">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
          Partner program
        </div>
        <h1 className="mt-3 font-editorial text-3xl font-medium tracking-tight sm:text-4xl">
          Your clients&apos; sites, answering at 2am.
          <br />
          Your agency, paid monthly for it.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed opacity-75">
          Fieldsta puts a 24/7 support agent on a business&apos;s website — it answers customer
          questions any hour, only from facts the business approves, and hands anything sensitive
          to a person. Agencies own the relationships; we do the work. The split reflects that.
        </p>

        <div className="mt-10 space-y-6 border-t border-[rgba(var(--text-rgb),0.08)] pt-8">
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

        <div className="mt-10 border-t border-[rgba(var(--text-rgb),0.08)] pt-8">
          <div className="max-w-md border border-[rgba(var(--text-rgb),0.12)] p-5 text-sm leading-relaxed">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50">
              The math, plainly
            </div>
            <p className="mt-3 opacity-85">
              10 clients on the agent = <span className="font-semibold">$600/mo recurring to you</span>,
              on relationships you already have. Each client also gets a monthly usage receipt from
              us — real conversation counts, nothing invented — so the renewal argues for itself.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-[rgba(var(--text-rgb),0.08)] pt-8">
          <h2 className="font-editorial text-xl font-medium">Start with one client</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-70">
            No contracts to negotiate, no minimums. Email{" "}
            <a href="mailto:support@fieldsta.com?subject=Partner%20program" className="underline underline-offset-2">
              support@fieldsta.com
            </a>{" "}
            with one client you think fits, and we&apos;ll have their agent live within a day — free
            for the first two weeks so you can both judge it on results.
          </p>
          <p className="mt-4 text-xs opacity-50">
            Want to see it first?{" "}
            <a href="/support-demo" className="underline underline-offset-2">
              Talk to the live agent
            </a>{" "}
            — it&apos;s the same one your clients would get.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
