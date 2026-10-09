"""Recolor the orange Kit mascot illustrations blue, in place.

Usage: python3 cryfox/recolor-kit.py FILE.svg|FILE.png [...]
Requires Pillow. Only warm, saturated colors change.
"""

import base64, colorsys, io, re, sys
from pathlib import Path
from PIL import Image


def new_hue(deg):
    """Return the blue hue for a warm hue in degrees, or None to keep it."""
    if deg >= 330:
        deg -= 360
    if not -30 <= deg <= 65:
        return None
    return 225 - (deg + 30) * 40 / 95


def swap_hex(m):
    h = m.group(1)
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hue, light, sat = colorsys.rgb_to_hls(r, g, b)
    deg = new_hue(hue * 360)
    if deg is None or sat < 0.3:
        return m.group(0)
    r, g, b = colorsys.hls_to_rgb(deg / 360, light, sat)
    return "#%02x%02x%02x" % (round(r * 255), round(g * 255), round(b * 255))


def recolor_image(img):
    img = img.convert("RGBA")
    alpha = img.getchannel("A")
    h, s, v = img.convert("RGB").convert("HSV").split()
    lut = [round(d * 255 / 360) % 256 if (d := new_hue(i * 360 / 256)) is not None else i for i in range(256)]
    warm = h.point(lambda i: 255 if new_hue(i * 360 / 256) is not None else 0)
    saturated = s.point(lambda i: 255 if i >= 77 else 0)
    mask = Image.composite(warm, Image.new("L", img.size), saturated)
    h = Image.composite(h.point(lut), h, mask)
    out = Image.merge("HSV", (h, s, v)).convert("RGB").convert("RGBA")
    out.putalpha(alpha)
    return out


def swap_embedded(m):
    img = recolor_image(Image.open(io.BytesIO(base64.b64decode(m.group(2)))))
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return m.group(1) + base64.b64encode(buf.getvalue()).decode()


for p in map(Path, sys.argv[1:]):
    if p.suffix == ".png":
        recolor_image(Image.open(p)).save(p)
        continue
    text = re.sub(r"(data:image/png;base64,)([A-Za-z0-9+/=]+)", swap_embedded, p.read_text())
    p.write_text(re.sub(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b", swap_hex, text))
