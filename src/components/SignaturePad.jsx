import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// Dependency-free draw-to-sign canvas. Works with mouse or touch, exports
// the drawing as a compact PNG data URL (small enough to store directly on
// the Firestore doc — a typical signature comes out to a few KB, nowhere
// near the 1MB document limit).
export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    // Match the canvas's internal resolution to its displayed size (times
    // devicePixelRatio) so strokes aren't blurry on high-DPI screens.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  function pointFromEvent(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = pointFromEvent(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pointFromEvent(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    if (empty) setEmpty(false);
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    if (!empty) onChange?.(canvasRef.current.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
    onChange?.(null);
  }

  return (
    <div className="space-y-1.5">
      <canvas
        ref={canvasRef}
        className="h-32 w-full touch-none rounded-md border border-border bg-white"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Sign above with your finger or mouse.</p>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={empty}>
          Clear
        </Button>
      </div>
    </div>
  );
}
