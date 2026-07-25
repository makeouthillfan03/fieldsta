import { useEffect, useRef } from "react";

// The signature visual: a Manhattan skyline resolved out of drifting points
// of light rather than drawn as a solid shape. Canvas rather than SVG
// because a few thousand independently-moving points is exactly what
// canvas is good at and what DOM is terrible at.
//
// Density scales with viewport area and caps hard, so a phone renders a
// few hundred points instead of choking on the desktop count. Honors
// prefers-reduced-motion by painting one static frame and stopping.

// Skyline as [x, width, height] in a 0-1000 × 0-320 space. Tapered spire
// at 470 is the only landmark-ish silhouette; everything else is generic
// massing so this reads as "a city" without impersonating a real building.
const BUILDINGS = [
  [0, 88, 120], [92, 58, 178], [154, 70, 96], [228, 48, 214], [280, 84, 142],
  [368, 62, 188], [434, 30, 250], [468, 36, 300], [508, 30, 244], [542, 66, 166],
  [612, 54, 210], [670, 78, 132], [752, 44, 232], [800, 86, 154], [890, 52, 196],
  [946, 54, 118],
];

const VIEW_W = 1000;
const VIEW_H = 320;

function buildPoints(count) {
  const totalArea = BUILDINGS.reduce((sum, [, w, h]) => sum + w * h, 0);
  const points = [];

  for (const [x, w, h] of BUILDINGS) {
    const share = Math.round(((w * h) / totalArea) * count);
    const topY = VIEW_H - h;
    // Atmospheric perspective — each mass sits at its own distance, and
    // further ones go dimmer and smaller. This is most of what separates a
    // photograph of a skyline from a diagram of one.
    const z = Math.random();
    for (let i = 0; i < share; i++) {
      const px = x + Math.random() * w;
      const py = topY + Math.random() * h;
      // Points thin out toward the base so the silhouette dissolves into
      // the page instead of ending on a hard line.
      const depth = (py - topY) / Math.max(h, 1);
      if (Math.random() < depth * 0.55) continue;
      points.push({
        x: px,
        y: py,
        // Roofline points read brightest — that's what makes the shape legible.
        base: (0.30 + (1 - depth) * 0.85) * (0.45 + z * 0.55),
        // Uneven sizing is the grain. Uniform dots look printed.
        size: 0.85 + z * 0.7 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 0.22,
      });
    }
  }

  // Sparse points above the roofline — haze and light, not literal stars.
  const airborne = Math.round(count * 0.09);
  for (let i = 0; i < airborne; i++) {
    points.push({
      x: Math.random() * VIEW_W,
      y: Math.random() * (VIEW_H * 0.62),
      base: 0.05 + Math.random() * 0.22,
      size: 0.7 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 0.7,
      drift: (Math.random() - 0.5) * 0.3,
    });
  }

  return points;
}

export default function ParticleSkyline({ className = "" }) {
  const canvasRef = useRef(null);

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

      for (const p of points) {
        const twinkle = reduced ? 1 : 0.62 + 0.38 * Math.sin(time * p.speed + p.phase);
        const alpha = p.base * twinkle;
        if (alpha <= 0.015) continue;

        const x = (p.x + (reduced ? 0 : Math.sin(time * 0.22 + p.phase) * p.drift * 6)) * scaleX;
        const y = p.y * scaleY;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#F5F5F5";
        ctx.fillRect(x, y, p.size, p.size);
      }

      // One warm beacon on the spire — the single point of colour, matching
      // the red used for emphasis in the type.
      const bx = 486 * scaleX;
      const by = 22 * scaleY;
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
