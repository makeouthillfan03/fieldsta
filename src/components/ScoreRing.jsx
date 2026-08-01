import { useEffect, useRef, useState } from "react";

// Same hook DemoLanding.jsx uses for scroll-triggered reveals — duplicated
// here (rather than imported from the page) so this component has no
// dependency on which page renders it.
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

// Circular score gauge — the same 0-100 figure the dashboard computes from
// criteriaBreakdown (fieldsta-agents/src/tools/save-lead-response.ts:
// computeLeadScore). Used on the marketing site's dashboard mockup and on
// the live /try demo's real results, so it lives here once rather than
// twice. Fills from empty when it scrolls into view (or immediately if it's
// already visible, e.g. a demo result appearing mid-page) instead of
// snapping straight to its final value — a ring that fills reads as a
// measurement being taken, not a picture of a number. Red/amber/green
// matches the tiering used everywhere else a score appears: red = low,
// amber = okay, green = quality lead.
export function ScoreRing({ score, size = 104, stroke = 8 }) {
  const [ref, visible] = useReveal();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - score / 100);
  const offset = visible ? targetOffset : circumference;
  const color = score >= 85 ? "#4ADE80" : score >= 70 ? "#FBBF24" : "#FF4438";

  return (
    <div ref={ref} className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(var(--text-rgb),0.1)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.1s ease-out, stroke 0.3s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none text-[var(--text)]"
          style={{ fontSize: Math.max(13, size * 0.23) }}
        >
          {visible ? score : 0}
        </span>
        {size >= 80 && (
          <span className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--text)]">/ 100</span>
        )}
      </div>
    </div>
  );
}
