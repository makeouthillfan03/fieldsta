import { useEffect, useRef, useState } from "react";

// Live waveform for Harper's voice in the chat widget. The bars are driven
// by a real AnalyserNode reading the actual audio the visitor hears — this
// is a measurement, not a looping animation pretending to be one. While
// Harper is still thinking (voiceBusy, before any audio exists) the bars
// idle on a low sine swell so the strip reads as "alive, working" without
// claiming speech is happening.
//
// Rendering: one <canvas>, devicePixelRatio-aware, center-mirrored rounded
// bars, amplitudes lerped toward their targets each frame so the motion is
// silk instead of jitter. Everything happens in a single rAF loop that only
// runs while the strip is visible.

const BAR_COUNT = 27;
const SMOOTHING = 0.35; // lerp factor toward target amplitude per frame

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function VoiceWaveform({ audioRef, busy, color = "#EF4444" }) {
  const [speaking, setSpeaking] = useState(false);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const wiredElRef = useRef(null);
  const ampsRef = useRef(new Float32Array(BAR_COUNT));

  // Track whether the <audio> element is actually producing sound.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => {
      setSpeaking(true);
      // Wire the analyser lazily on first play. createMediaElementSource may
      // only ever be called once per element, so the wired element is
      // remembered; the data: URI src is same-origin, so no CORS taint.
      try {
        if (wiredElRef.current !== el) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          const ctx = new Ctx();
          const source = ctx.createMediaElementSource(el);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.6;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          audioCtxRef.current = ctx;
          analyserRef.current = analyser;
          wiredElRef.current = el;
        }
        // Autoplay policy can leave the context suspended; resuming inside
        // the play handler counts as a user-gesture-adjacent resume.
        audioCtxRef.current?.resume?.().catch(() => {});
      } catch {
        // Analyser is an enhancement — playback itself is untouched if any
        // of this throws; the idle animation still renders.
      }
    };
    const onStop = () => setSpeaking(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onStop);
    el.addEventListener("ended", onStop);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onStop);
      el.removeEventListener("ended", onStop);
    };
  }, [audioRef]);

  useEffect(() => () => audioCtxRef.current?.close?.().catch(() => {}), []);

  const visible = busy || speaking;
  const reduced = prefersReducedMotion();

  // The draw loop — only mounted while visible and motion is allowed.
  useEffect(() => {
    if (!visible || reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);

    const freq = new Uint8Array(analyserRef.current?.frequencyBinCount ?? 128);
    const amps = ampsRef.current;

    const draw = (now) => {
      g.clearRect(0, 0, cssW, cssH);
      const analyser = analyserRef.current;
      const live = speaking && analyser;
      if (live) analyser.getByteFrequencyData(freq);

      const gap = cssW / BAR_COUNT;
      const barW = Math.max(2, gap * 0.42);
      const mid = cssH / 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        let target;
        if (live) {
          // Sample the lower ~70% of the spectrum where voice lives; mirror
          // the index outward from the center so speech blooms from the
          // middle of the strip instead of scrolling left-to-right.
          const centered = Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
          const bin = Math.floor(centered * freq.length * 0.7);
          target = (freq[bin] / 255) * 0.95 + 0.05;
        } else {
          // Thinking: a slow travelling swell, deliberately quiet.
          target = 0.12 + 0.08 * Math.sin(now / 420 + i * 0.55);
        }
        amps[i] += (target - amps[i]) * SMOOTHING;
        const h = Math.max(2, amps[i] * (cssH - 4));
        const x = i * gap + (gap - barW) / 2;
        g.beginPath();
        g.roundRect(x, mid - h / 2, barW, h, barW / 2);
        g.fillStyle = color;
        g.globalAlpha = live ? 0.9 : 0.55;
        g.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, reduced, speaking, color]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 border-t border-[#F5F5F5]/10 px-4 py-2" aria-live="polite">
      <span className="flex-shrink-0 text-[11px] uppercase tracking-[0.14em] text-[#9A9A9E]">
        {speaking ? "Harper is speaking" : "Harper is thinking"}
      </span>
      {reduced ? (
        <span className="text-[#9A9A9E]">…</span>
      ) : (
        <canvas ref={canvasRef} className="h-6 min-w-0 flex-1" aria-hidden="true" />
      )}
    </div>
  );
}
