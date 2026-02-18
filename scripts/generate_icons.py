#!/usr/bin/env python3
"""
generate_icons.py
Generates build-resources/icon.icns (macOS) and build-resources/icon.ico (Windows)
using only Pillow. Run once before building.

Usage:
    pip3 install Pillow --break-system-packages
    python3 scripts/generate_icons.py
"""

import struct, zlib, os, io
from PIL import Image, ImageDraw, ImageFont

BUILD_DIR = os.path.join(os.path.dirname(__file__), '..', 'build-resources')
os.makedirs(BUILD_DIR, exist_ok=True)

# ── Draw the icon ─────────────────────────────────────────────────────────────
def make_icon_image(size):
    img = Image.new('RGBA', (size, size), (8, 8, 8, 255))
    draw = ImageDraw.Draw(img)

    # Background: deep charcoal with subtle vignette feel
    # Rounded rect border in brand red
    pad = size // 10
    lw  = max(2, size // 32)
    red = (192, 64, 64, 255)

    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=size // 8,
        outline=red,
        width=lw
    )

    # Draw a simple split-flap "⏱" style symbol using basic shapes
    cx, cy = size // 2, size // 2
    r = size // 4

    # Outer circle
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=red, width=lw)

    # Clock hands
    import math
    # Hour hand (pointing to 10)
    angle_h = math.radians(-60)
    hx = cx + int(r * 0.5 * math.sin(angle_h))
    hy = cy - int(r * 0.5 * math.cos(angle_h))
    draw.line([cx, cy, hx, hy], fill=red, width=max(2, lw))

    # Minute hand (pointing to 12)
    angle_m = math.radians(0)
    mx2 = cx + int(r * 0.75 * math.sin(angle_m))
    my2 = cy - int(r * 0.75 * math.cos(angle_m))
    draw.line([cx, cy, mx2, my2], fill=red, width=max(1, lw - 1))

    # Center dot
    dot = max(2, size // 24)
    draw.ellipse([cx - dot, cy - dot, cx + dot, cy + dot], fill=red)

    return img


# ── ICNS (macOS) ──────────────────────────────────────────────────────────────
ICNS_SIZES = {
    b'icp4': 16,
    b'icp5': 32,
    b'ic07': 128,
    b'ic08': 256,
    b'ic09': 512,
    b'ic10': 1024,
}

def png_bytes(img):
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()

def make_icns():
    chunks = []
    for tag, size in ICNS_SIZES.items():
        img = make_icon_image(size)
        data = png_bytes(img)
        chunks.append((tag, data))

    total = 8 + sum(8 + len(d) for _, d in chunks)
    out = io.BytesIO()
    out.write(b'icns')
    out.write(struct.pack('>I', total))
    for tag, data in chunks:
        out.write(tag)
        out.write(struct.pack('>I', 8 + len(data)))
        out.write(data)

    path = os.path.join(BUILD_DIR, 'icon.icns')
    with open(path, 'wb') as f:
        f.write(out.getvalue())
    print('OK: Written ' + path)


# ── ICO (Windows) ─────────────────────────────────────────────────────────────
ICO_SIZES = [16, 32, 48, 64, 128, 256]

def make_ico():
    images = [(s, make_icon_image(s)) for s in ICO_SIZES]
    path = os.path.join(BUILD_DIR, 'icon.ico')
    # Use Pillow's built-in ICO writer
    images[0][1].save(
        path,
        format='ICO',
        sizes=[(s, s) for s in ICO_SIZES],
        append_images=[img for _, img in images[1:]]
    )
    print('OK: Written ' + path)


if __name__ == '__main__':
    make_icns()
    make_ico()
    print('Icons generated successfully.')
