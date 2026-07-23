// Shared blue/white gradient swirl background — extracted from
// FindAPro.jsx (originally matched to a reference image) so other pages
// can share the same visual identity instead of looking like a plain
// unstyled form next to it. Pure CSS, no images: a couple of large,
// blurred radial gradients on a white base, slowly drifting so it
// doesn't feel static, subtle enough not to fight with page content.
//
// `variant` controls where the blobs sit, so pages don't all look like
// exact copy-paste of each other (see chat: "make every page different"
// — same idea already used for Login's own centered variant):
//   "hero"    — top-right + bottom-left (FindAPro's original placement)
//   "centered" — both blobs centered behind a single card (form pages)
//   "corner"  — top-left + bottom-right (mirrors "hero" for variety)
export default function GradientBackground({ variant = "hero" }) {
  const styles = {
    hero: {
      before: "top: -10%; right: -10%; width: 60vw; height: 60vw;",
      after: "bottom: -15%; left: -10%; width: 55vw; height: 55vw;",
    },
    centered: {
      before: "top: 12%; left: 50%; transform: translateX(-50%); width: 50vw; height: 50vw;",
      after: "bottom: -20%; right: -15%; width: 45vw; height: 45vw;",
    },
    corner: {
      before: "top: -12%; left: -12%; width: 55vw; height: 55vw;",
      after: "bottom: -18%; right: -8%; width: 50vw; height: 50vw;",
    },
  };
  const s = styles[variant] || styles.hero;

  return (
    <>
      <style>{`
        @keyframes gbg-drift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-3%, 2%) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .gbg-${variant} {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          background: #ffffff;
        }
        .gbg-${variant}::before,
        .gbg-${variant}::after {
          content: "";
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.65;
        }
        .gbg-${variant}::before {
          ${s.before}
          background: radial-gradient(circle at 40% 40%, #8fb8e8, #cfe1f5 60%, transparent 75%);
          animation: gbg-drift 22s ease-in-out infinite;
        }
        .gbg-${variant}::after {
          ${s.after}
          background: radial-gradient(circle at 60% 60%, #bcdcf7, #e9f3fc 60%, transparent 75%);
          animation: gbg-drift 26s ease-in-out infinite reverse;
        }
      `}</style>
      <div className={`gbg-${variant}`} aria-hidden="true" />
    </>
  );
}
