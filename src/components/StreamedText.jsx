import { useEffect, useRef, useState } from "react";

// Typewriter reveal for text that was genuinely produced by the agent —
// motion tied to real function, not decoration. The cadence is deliberately
// human: quick inside words, a beat after punctuation, a longer beat at
// paragraph breaks. Driven by a single rAF loop against a precomputed
// timestamp schedule, so a dropped frame reveals everything it owes rather
// than falling behind (no setInterval drift, no per-character timers).
//
// Honesty note: this animates the *reveal* of a complete response, it does
// not fake token streaming. The full text is already in the DOM owner's
// hands; users who select-all mid-stream get the whole thing.

const BASE_CPS = 55; // characters per second inside words
const PAUSE = { ",": 70, ";": 90, ":": 90, ".": 170, "!": 170, "?": 170, "\n": 240 };
const MAX_INSTANT_LENGTH = 2000; // beyond this, streaming is a chore — show it

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Builds the cumulative reveal-time (ms) for each character index. */
function buildSchedule(text) {
  const times = new Float64Array(text.length);
  let t = 0;
  const step = 1000 / BASE_CPS;
  for (let i = 0; i < text.length; i++) {
    t += step + (PAUSE[text[i]] ?? 0);
    times[i] = t;
  }
  return times;
}

export default function StreamedText({ text, className = "", onDone }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const rafRef = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!text) {
      setVisibleCount(0);
      setStreaming(false);
      return;
    }
    if (prefersReducedMotion() || text.length > MAX_INSTANT_LENGTH) {
      setVisibleCount(text.length);
      setStreaming(false);
      onDoneRef.current?.();
      return;
    }

    const schedule = buildSchedule(text);
    const start = performance.now();
    setVisibleCount(0);
    setStreaming(true);

    // Two drivers, one time-based advance. rAF gives frame-perfect motion
    // while the tab is visible; the interval is the correctness backstop for
    // contexts where rAF is starved (backgrounded tabs, embedded webviews —
    // observed for real in an embedded preview browser, where rAF never
    // fired at all and the stream froze at zero). Because progress is
    // computed from elapsed time, the two drivers are idempotent: whichever
    // fires just reveals everything owed by now.
    let finished = false;
    let lastCount = 0;
    const advance = () => {
      if (finished) return;
      const elapsed = performance.now() - start;
      let count = lastCount;
      while (count < text.length && schedule[count] <= elapsed) count++;
      if (count !== lastCount) {
        lastCount = count;
        setVisibleCount(count);
      }
      if (count >= text.length) {
        finished = true;
        clearInterval(intervalId);
        setStreaming(false);
        onDoneRef.current?.();
      }
    };
    const loop = () => {
      advance();
      if (!finished) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    const intervalId = setInterval(advance, 250);
    return () => {
      finished = true;
      cancelAnimationFrame(rafRef.current);
      clearInterval(intervalId);
    };
  }, [text]);

  return (
    <p className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, visibleCount)}</span>
      {streaming && (
        <span
          aria-hidden="true"
          className="ml-[1px] inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-caret rounded-full bg-[var(--accent)] align-baseline"
        />
      )}
    </p>
  );
}
