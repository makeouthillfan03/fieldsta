import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

// Extracted from DemoLanding so /try wears the same header as the homepage
// rather than its own one-off back-link row. The section links are absolute
// (`/#pricing`, not `#pricing`) because they now render on pages that don't
// contain those sections -- a bare hash would just no-op on /try.
const NAV_LINK_CLASS =
  "relative pb-1 transition-colors hover:text-[var(--text)] " +
  "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left " +
  "after:scale-x-0 after:bg-[var(--accent)] after:transition-transform after:duration-300 after:ease-out " +
  "hover:after:scale-x-100";

// Shared between the desktop left-aligned slot and the mobile centered
// slot below so the fairly large inline SVG only has to be written once.
// `withWordmark` off for the mobile instance -- measured on the live page:
// full logo 132px + phantom-matched button 124px + real button 124px is
// 380px against a 343px content width (375 viewport - 2rem container
// padding), which is what caused the button to clip off-screen on the
// first attempt at this. Icon-only brings the total to ~272px, comfortably
// inside budget with room for the two gaps.
export function FieldstaLogoMark({ withWordmark = true }) {
  return (
    <>
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
      {withWordmark && (
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--text)]">
          Fieldsta
        </span>
      )}
    </>
  );
}

export default function SiteHeader() {
  // "Try Demo" is the one nav action that can be already-satisfied -- showing
  // it on /try points at the page you're on.
  const onTryPage = useLocation().pathname === "/try";

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(var(--text-rgb),0.1)] bg-[rgba(var(--bg-rgb),0.9)] backdrop-blur">
      <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center">
        <div className="justify-self-start">
          {/* Desktop only -- on mobile the logo moves to the center slot
              below instead. */}
          <a href="/" className="hidden items-center gap-2 md:flex">
            <FieldstaLogoMark />
          </a>
          {/* display:none contributes zero width to its grid track, so a
              simply-hidden left slot collapses toward 0 while the button-
              heavy right slot stays wide -- that asymmetry is what was
              actually dragging the "centered" logo left instead of
              centering it. An invisible clone of the real button (same
              markup, `invisible` instead of `hidden` so it keeps its
              layout box) reserves the same width on the left as the real
              button takes on the right, keeping the two side tracks equal
              and the logo genuinely centered between them. */}
          <div className="invisible md:hidden" aria-hidden="true">
            <Button size="sm" className="font-bold">
              Start Free Trial
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-self-center">
          <a href="/" className="flex items-center gap-2 md:hidden">
            <FieldstaLogoMark withWordmark={false} />
          </a>
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text)] md:flex">
            <a href="/#how-it-works" className={NAV_LINK_CLASS}>
              How It Works
            </a>
            <a href="/#features" className={NAV_LINK_CLASS}>
              Features
            </a>
            <a href="/#pricing" className={NAV_LINK_CLASS}>
              Pricing
            </a>
            <a href="/#faq" className={NAV_LINK_CLASS}>
              FAQ
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3 justify-self-end">
          {/* Theme toggle and "Try Demo" both drop below `sm` -- on a
              narrow phone there isn't room for the logo, toggle, and two
              full-width buttons without something giving, and "Start Free
              Trial" is the one that actually has to stay: it's the only
              persistent access to it while scrolled past the hero (whose
              own CTA is "Try Demo", so that action isn't lost, just no
              longer duplicated in the nav on small screens too). */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <a href="/get-started">
            <Button
              size="sm"
              className="bg-[var(--accent)] font-bold text-white hover:bg-[var(--accent-hover)]"
            >
              Start Free Trial
            </Button>
          </a>
          {!onTryPage && (
            <Link to="/try" className="hidden sm:block">
              <Button size="sm" className="bg-[var(--text)] text-[var(--bg-deep)] hover:bg-white">
                Try Demo
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
