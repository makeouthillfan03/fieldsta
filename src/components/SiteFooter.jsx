import { Link } from "react-router-dom";
import { FieldstaLogoMark } from "@/components/SiteHeader";

// The ledger footer — the site's signature element (design pass 2026-08-19).
// Fieldsta's entire brand is "counted, never invented": the product's soul
// is a receipt. So the footer is set like one — hairline rules, mono
// small-caps column heads, tabular alignment — and closes with the honesty
// rule stated as identity. Before this existed, every page simply stopped;
// nothing reads "template" like a page that ends mid-air, and nothing reads
// "institution" like a considered colophon.

const COLUMNS = [
  {
    head: "Products",
    rows: [
      { label: "AI lead response", href: "/products" },
      { label: "24/7 support agent", href: "/support-agent" },
      { label: "Live demo", href: "/try" },
      { label: "Talk to the support agent", href: "/support-demo", plain: true },
    ],
  },
  {
    head: "For partners",
    rows: [
      { label: "Agency program", href: "/partners" },
      { label: "Free response grader", href: "/grader", plain: true },
    ],
  },
  {
    head: "Company",
    rows: [
      { label: "Sign in", href: "/login" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Customer agreement", href: "/agreement" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(var(--text-rgb),0.12)]">
      <div className="container py-12">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <FieldstaLogoMark withWordmark={false} />
              <span className="text-[13px] font-bold uppercase tracking-[0.3em]">Fieldsta</span>
            </div>
            <p className="mt-4 max-w-[26ch] text-sm leading-relaxed opacity-60">
              Lead gen fills the funnel. Fieldsta answers it — in under 60 seconds, day or night.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.head}>
              <div className="border-b border-[rgba(var(--text-rgb),0.12)] pb-2 font-mono text-[10px] uppercase tracking-[0.22em] opacity-50">
                {col.head}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {col.rows.map((row) =>
                  row.plain ? (
                    <li key={row.label}>
                      <a href={row.href} className="opacity-70 transition-opacity hover:opacity-100">
                        {row.label}
                      </a>
                    </li>
                  ) : (
                    <li key={row.label}>
                      <Link to={row.href} className="opacity-70 transition-opacity hover:opacity-100">
                        {row.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-baseline justify-between gap-3 border-t border-[rgba(var(--text-rgb),0.12)] pt-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-45">
            Every number on this site: counted, never invented.
          </div>
          <div className="font-mono text-[11px] opacity-45">© {new Date().getFullYear()} Fieldsta Services LLC · New Jersey</div>
        </div>
      </div>
    </footer>
  );
}
