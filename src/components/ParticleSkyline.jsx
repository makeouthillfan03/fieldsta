import { useEffect, useRef } from "react";

// The signature visual: a Manhattan skyline resolved out of drifting points
// of light rather than drawn as a solid shape. Canvas rather than SVG
// because a few thousand independently-moving points is exactly what
// canvas is good at and what DOM is terrible at.
//
// Density scales with viewport area and caps hard, so a phone renders a
// few hundred points instead of choking on the desktop count. Honors
// prefers-reduced-motion by painting one static frame and stopping.

const VIEW_W = 1000;
const VIEW_H = 320;

// Skyline in a 0-1000 × 0-320 space, as three explicit depth planes rather
// than one flat row. Layering is what the reference photographs have that a
// single silhouette never does: haze stacks up over distance, so far towers
// sit high and dim while near ones come forward, darker and denser.
//
// Massing is generic on purpose — setbacks, a couple of spires, water tanks
// on the low roofs. That reads unmistakably as New York without copying any
// actual building's profile.
//
//   x, w, h  base block
//   steps    art-deco setbacks, [inset, height] stacked upward
//   spire    mast height above the topmost step
//   tank     rooftop water tower, the detail that makes it read as NYC
const LAYERS = [
  {
    // Far — hazy, high on the frame, small and pale.
    depth: 0.18,
    yOffset: -30,
    buildings: [
      { x: 30, w: 46, h: 104, steps: [[8, 18]] },
      { x: 118, w: 34, h: 142 },
      { x: 196, w: 52, h: 88 },
      { x: 300, w: 30, h: 158, spire: 26 },
      { x: 372, w: 58, h: 112, steps: [[12, 22]] },
      { x: 486, w: 38, h: 176 },
      { x: 566, w: 46, h: 96 },
      { x: 648, w: 32, h: 150, steps: [[7, 20]] },
      { x: 728, w: 54, h: 118 },
      { x: 826, w: 36, h: 164, spire: 20 },
      { x: 906, w: 48, h: 100 },
    ],
  },
  {
    // Mid — the readable middle of the city, where most of the mass sits.
    depth: 0.55,
    yOffset: -14,
    buildings: [
      { x: 0, w: 74, h: 132, tank: true },
      { x: 84, w: 52, h: 196, steps: [[10, 30], [9, 22]] },
      { x: 146, w: 66, h: 108, tank: true },
      { x: 224, w: 44, h: 232, steps: [[9, 26]], spire: 34 },
      { x: 280, w: 78, h: 150 },
      { x: 370, w: 56, h: 204, steps: [[11, 28]] },
      { x: 438, w: 34, h: 236, spire: 40 },
      { x: 484, w: 62, h: 168, steps: [[13, 24]] },
      { x: 558, w: 48, h: 214 },
      { x: 618, w: 72, h: 126, tank: true },
      { x: 702, w: 40, h: 238, steps: [[8, 30]], spire: 28 },
      { x: 754, w: 66, h: 158 },
      { x: 832, w: 50, h: 200, steps: [[10, 26]] },
      { x: 894, w: 58, h: 134, tank: true },
      { x: 962, w: 38, h: 178 },
    ],
  },
  {
    // Near — foreground rooftops, darkest and densest, cropped by the fold.
    depth: 1,
    yOffset: 8,
    buildings: [
      { x: -10, w: 96, h: 92, tank: true },
      { x: 96, w: 78, h: 68 },
      { x: 188, w: 104, h: 84, tank: true },
      { x: 306, w: 86, h: 60 },
      { x: 408, w: 96, h: 96, tank: true },
      { x: 518, w: 82, h: 66 },
      { x: 614, w: 108, h: 88, tank: true },
      { x: 736, w: 88, h: 62 },
      { x: 838, w: 100, h: 90, tank: true },
      { x: 952, w: 72, h: 70 },
    ],
  },
];

/** Every filled rectangle a building occupies: base, setbacks, spire, tank. */
function massesFor(b, yOffset) {
  const groundY = VIEW_H + yOffset;
  const masses = [];

  let top = groundY - b.h;
  masses.push({ x: b.x, w: b.w, y: top, h: b.h });

  // Setbacks stack inward and upward from the base — the stepped Art Deco
  // profile that dates a New York skyline more than any single landmark.
  let curX = b.x;
  let curW = b.w;
  for (const [inset, stepH] of b.steps ?? []) {
    curX += inset;
    curW -= inset * 2;
    if (curW <= 2) break;
    top -= stepH;
    masses.push({ x: curX, w: curW, y: top, h: stepH });
  }

  if (b.spire) {
    masses.push({ x: curX + curW / 2 - 1.2, w: 2.4, y: top - b.spire, h: b.spire });
  }

  if (b.tank) {
    // Squat cylinder on legs, offset from centre so the roofs don't line up.
    const tw = Math.min(11, b.w * 0.22);
    const tx = b.x + b.w * 0.34;
    masses.push({ x: tx, w: tw, y: top - 13, h: 9 });
    masses.push({ x: tx + tw * 0.15, w: tw * 0.7, y: top - 4, h: 4 });
  }

  return masses;
}

function buildPoints(count) {
  const points = [];

  // Weight by layer so the near plane is genuinely denser than the far one,
  // not merely darker — density difference is half of what sells distance.
  const layerWeights = LAYERS.map((l) => 0.35 + l.depth * 0.9);
  const weightSum = layerWeights.reduce((a, b) => a + b, 0);

  LAYERS.forEach((layer, li) => {
    const layerCount = Math.round((layerWeights[li] / weightSum) * count);
    const masses = layer.buildings.flatMap((b) => massesFor(b, layer.yOffset));
    const totalArea = masses.reduce((sum, m) => sum + m.w * m.h, 0) || 1;

    // Points are PLACED on the silhouette rather than scattered and then
    // dimmed by distance from it. Scattering wastes most of the budget on
    // dark interior points and leaves the outline too sparse to read —
    // walking the perimeter guarantees a continuous edge at any density.
    const dim = (extra = 1) => ({
      phase: Math.random() * Math.PI * 2,
      // Distant lights shimmer slower — less atmosphere moving in front.
      speed: (0.3 + Math.random() * 1.0) * (0.55 + layer.depth * 0.6),
      drift: (Math.random() - 0.5) * 0.22 * layer.depth,
      size: (0.75 + layer.depth * 0.8 + Math.random() * 0.3) * extra,
    });

    // Wide spread between planes. A narrow range reads as one flat wall of
    // dots; pushing the far layer well down and the near layer to full
    // brightness is what actually produces depth.
    const shade = (brightness) =>
      brightness * (0.4 + layer.depth * 1.25) * (0.82 + Math.random() * 0.36);

    for (const m of masses) {
      const perimeter = m.w + m.h * 2;
      const budget = Math.round((perimeter / (totalArea / 40)) * layerCount * 0.02);
      const edgePoints = Math.max(14, budget);

      // Roofline — the strongest single cue that this is a building.
      const topCount = Math.max(6, Math.round((m.w / perimeter) * edgePoints * 1.7));
      for (let i = 0; i < topCount; i++) {
        points.push({
          x: m.x + (i / topCount) * m.w + (Math.random() - 0.5) * 1.6,
          y: m.y + (Math.random() - 0.35) * 1.9,
          base: shade(0.95),
          ...dim(),
        });
      }

      // Both vertical faces, fading downward into the fog.
      for (const sideX of [m.x, m.x + m.w]) {
        const sideCount = Math.max(5, Math.round((m.h / perimeter) * edgePoints));
        for (let i = 0; i < sideCount; i++) {
          const f = i / sideCount;
          if (Math.random() < f * 0.55) continue;
          points.push({
            x: sideX + (Math.random() - 0.5) * 1.7,
            y: m.y + f * m.h,
            base: shade(0.78 * Math.pow(1 - f, 0.85)),
            ...dim(),
          });
        }
      }

      // Sparse interior so masses read as solid volumes, not wireframes.
      const fill = Math.round(((m.w * m.h) / totalArea) * layerCount * 0.45);
      for (let i = 0; i < fill; i++) {
        const f = Math.random();
        if (Math.random() < f * 0.75) continue;
        points.push({
          x: m.x + Math.random() * m.w,
          y: m.y + f * m.h,
          base: shade(0.3 * Math.pow(1 - f, 1.5)),
          ...dim(0.85),
        });
      }
    }
  });

  // Suspended particulate above the roofline — the lit air itself, which is
  // what gives the reference photographs their depth. Not stars.
  const airborne = Math.round(count * 0.035);
  for (let i = 0; i < airborne; i++) {
    const y = Math.random() * (VIEW_H * 0.66);
    points.push({
      x: Math.random() * VIEW_W,
      y,
      // Denser low, thinning upward, the way haze actually settles.
      base: (0.04 + Math.random() * 0.18) * (0.35 + (y / (VIEW_H * 0.66)) * 0.8),
      size: 0.6 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.45,
    });
  }

  return points;
}

export default function ParticleSkyline({ className = "", dark = true }) {
  const canvasRef = useRef(null);
  // Read every frame without re-running the whole setup effect below —
  // toggling the theme mid-animation just recolors the next frame.
  const darkRef = useRef(dark);
  darkRef.current = dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let points = [];
    let width = 0;
    let height = 0;
    let running = true;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      // Cap DPR at 2 — beyond that it's invisible detail at real cost.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density is what makes the silhouette legible — too few points and
      // it reads as scattered dust rather than a city. Scales with area,
      // floors high enough to hold the shape on a phone, caps where the
      // per-frame cost starts to matter.
      const target = Math.round((width * height) / 90);
      points = buildPoints(Math.max(2400, Math.min(9000, target)));
    }

    function draw(t) {
      ctx.clearRect(0, 0, width, height);
      const scaleX = width / VIEW_W;
      const scaleY = height / VIEW_H;
      const time = t / 1000;
      const isDark = darkRef.current;
      // Dark mode: white lights on a black night skyline. Light mode:
      // inverted — a dark silhouette on a light sky.
      const particleColor = isDark ? "#F5F5F5" : "#0a0a0a";

      for (const p of points) {
        const twinkle = reduced ? 1 : 0.62 + 0.38 * Math.sin(time * p.speed + p.phase);
        const alpha = p.base * twinkle;
        if (alpha <= 0.015) continue;

        const x = (p.x + (reduced ? 0 : Math.sin(time * 0.22 + p.phase) * p.drift * 6)) * scaleX;
        const y = p.y * scaleY;

        ctx.globalAlpha = isDark ? alpha : Math.min(1, alpha * 1.4);
        ctx.fillStyle = particleColor;
        ctx.fillRect(x, y, p.size, p.size);
      }

      // One warm beacon at the tip of the tallest mast — the single point of
      // colour in the scene, matching the red used for emphasis in the type.
      // Coordinates track the mid-layer spire: x 438 + w 34/2, top of mast.
      const bx = 455 * scaleX;
      const by = 30 * scaleY;
      const pulse = reduced ? 0.75 : 0.45 + 0.55 * Math.sin(time * 1.5);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.arc(bx, by, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = pulse * 0.22;
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      if (!reduced && running) raf = requestAnimationFrame(draw);
    }

    resize();
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      if (reduced) draw(0);
    };
    window.addEventListener("resize", onResize);

    // Stop burning frames when the tab is hidden or the hero is scrolled away.
    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running && !reduced) raf = requestAnimationFrame(draw);
        else cancelAnimationFrame(raf);
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
