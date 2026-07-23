"""
Generate the Fieldsta app icon set — a simple black map-pin mark on a
black rounded-square field, matching the Uber/Lyft-style monochrome
aesthetic used across the app (see FindAPro.jsx / Login.jsx). Replaces
the old cat mascot icon, which no longer matches the marketplace pivot.

Run: python3 scripts/gen-icons.py
"""
from PIL import Image, ImageDraw

BLACK = (17, 17, 17, 255)   # near-black, matches text/buttons in app
WHITE = (255, 255, 255, 255)

def rounded_square(size, radius_frac=0.22, bg=BLACK):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_frac), fill=bg)
    return img

def draw_pin(img, size, scale=1.0, color=WHITE):
    """Classic map-pin (teardrop) mark, centered, with a punched-out hole."""
    d = ImageDraw.Draw(img)
    cx = size / 2
    top = size * (0.5 - 0.30 * scale)
    r = size * 0.20 * scale
    tip_y = size * (0.5 + 0.34 * scale)

    # Circle part of the pin
    d.ellipse([cx - r, top, cx + r, top + 2 * r], fill=color)
    # Triangle point of the pin
    d.polygon(
        [
            (cx - r * 0.92, top + r * 1.15),
            (cx + r * 0.92, top + r * 1.15),
            (cx, tip_y),
        ],
        fill=color,
    )
    # Punched hole in the middle of the circle (matches MapView dot-marker look)
    hole_r = r * 0.42
    hole_cy = top + r
    d.ellipse([cx - hole_r, hole_cy - hole_r, cx + hole_r, hole_cy + hole_r], fill=(0, 0, 0, 0))
    return img

def make_icon(size, radius_frac=0.22, pin_scale=1.0, transparent_hole=True):
    img = rounded_square(size, radius_frac=radius_frac)
    draw_pin(img, size, scale=pin_scale)
    if transparent_hole:
        # Re-cut the hole through to full transparency (so the black bg shows
        # through cleanly rather than compositing white-over-black).
        pass
    return img

def make_maskable(size):
    # Maskable icons need full-bleed background (no transparent corners) and
    # all meaningful content inside the center ~80% safe zone.
    img = Image.new("RGBA", (size, size), BLACK)
    draw_pin(img, size, scale=0.72)
    return img

out = "public/icons"

make_icon(32, radius_frac=0.28).save(f"{out}/favicon-32.png")
make_icon(192, radius_frac=0.24).save(f"{out}/icon-192.png")
make_icon(512, radius_frac=0.22).save(f"{out}/icon-512.png")
make_maskable(512).save(f"{out}/icon-512-maskable.png")

# Apple touch icon: iOS applies its own rounding, so keep this one a plain
# square (no pre-rounded corners) to avoid a double-rounded look.
apple = Image.new("RGBA", (180, 180), BLACK)
draw_pin(apple, 180, scale=0.85)
apple.save(f"{out}/apple-touch-icon.png")

# SVG favicon (crisp at any size, used by modern browsers/tabs)
svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#111111"/>
  <path d="M32 14c-7.2 0-13 5.6-13 12.6 0 9.2 13 21.4 13 21.4s13-12.2 13-21.4C45 19.6 39.2 14 32 14z" fill="#ffffff"/>
  <circle cx="32" cy="26.6" r="5.4" fill="#111111"/>
</svg>"""
with open("public/favicon.svg", "w") as f:
    f.write(svg)

print("done")
