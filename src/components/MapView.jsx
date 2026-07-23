import { useEffect, useRef } from "react";

// Smooth, minimal map (Leaflet + CartoDB Positron tiles, loaded via CDN in
// index.html — no API key/account needed, unlike Mapbox/Google, so this
// works right now instead of being blocked on another provider signup).
// Deliberately styled clean and light to sit close to the Uber/Lyft
// reference (soft basemap, single marker, no clutter) without literally
// copying it — see chat "somewhat similar, but obviously not the same."
const PERTH_AMBOY = [40.5064, -74.2654];

export default function MapView({ center = PERTH_AMBOY, zoom = 13, height = 220, markers = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.L || !containerRef.current || mapRef.current) return;
    const map = window.L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, zoom);

    window.L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    const dot = window.L.divIcon({
      className: "",
      html: '<div style="width:14px;height:14px;border-radius:9999px;background:#185FA5;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [14, 14],
    });

    (markers.length ? markers : [{ position: center }]).forEach((m) => {
      window.L.marker(m.position, { icon: dot }).addTo(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5"
      aria-label="Map of Perth Amboy"
    />
  );
}
