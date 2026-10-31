#!/usr/bin/env python3
"""Write the committed favicon and share images. Run when those assets need to change.

Hexagram share images (public/share/hexagram-N.png) read their names from
src/lib/siteContent.js through node, so run `npm ci` first.
"""

import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
PARCHMENT = (248, 245, 239, 255)
INK = (34, 31, 29, 255)
MUTED = (92, 86, 78, 255)
RULE = (196, 189, 180, 255)


def draw_centered(draw, text, font, y, fill, tracking=0):
    widths = [font.getlength(ch) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (1200 - total) / 2
    for ch, width in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += width + tracking


CJK_FONTS = [
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
]
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def cjk_font():
    for path in CJK_FONTS:
        if Path(path).exists():
            return path
    raise SystemExit("No CJK font found. Install fonts-wqy-microhei or fonts-wqy-zenhei.")


def hexagram_records():
    script = (
        "import('./src/lib/siteContent.js').then(m => console.log(JSON.stringify("
        "m.ALL_HEXAGRAMS.map(h => ({number: h.number, name: h.name, chinese: h.chinese, pinyin: h.pinyin, "
        "lines: h.lines_bottom_to_top, upper: h.upper_trigram.element, lower: h.lower_trigram.element})))))"
    )
    out = subprocess.run(["node", "-e", script], cwd=ROOT, check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def draw_left(draw, text, font, x, y, fill, tracking=0):
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + tracking


def hexagram_image(h, fonts):
    image = Image.new("RGB", (1200, 630), PARCHMENT[:3])
    draw = ImageDraw.Draw(image)
    draw.rectangle((48, 48, 1151, 581), outline=RULE[:3], width=1)

    # Six lines, drawn top (line 6) to bottom (line 1).
    left, width, bar, gap = 150, 300, 28, 30
    top = 315 - (6 * bar + 5 * gap) / 2
    for row, bit in enumerate(reversed(h["lines"])):
        y = top + row * (bar + gap)
        if bit == "1":
            draw.rectangle((left, y, left + width, y + bar), fill=INK[:3])
        else:
            half = (width - 44) / 2
            draw.rectangle((left, y, left + half, y + bar), fill=INK[:3])
            draw.rectangle((left + width - half, y, left + width, y + bar), fill=INK[:3])

    x = 560
    draw_left(draw, f"HEXAGRAM {h['number']}", fonts["label"], x, 128, MUTED, tracking=3)
    draw_left(draw, h["chinese"], fonts["zh"], x, 170, INK)
    zh_width = sum(fonts["zh"].getlength(ch) for ch in h["chinese"])
    draw_left(draw, h["pinyin"], fonts["pinyin"], x + zh_width + 24, 222, MUTED)
    name_font = fonts["name"] if fonts["name"].getlength(h["name"]) <= 540 else fonts["name_small"]
    draw_left(draw, h["name"], name_font, x, 300, INK)
    draw.line((x, 390, x + 220, 390), fill=RULE[:3], width=1)
    draw_left(draw, f"{h['upper']} over {h['lower']}", fonts["detail"], x, 412, MUTED)
    draw_left(draw, "The Free I Ching", fonts["brand"], x, 500, MUTED, tracking=2)

    out = PUBLIC / "share" / f"hexagram-{h['number']}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    image.quantize(colors=32).save(out, "PNG", optimize=True)


def hexagram_images():
    fonts = {
        "label": ImageFont.truetype(SERIF, 22),
        "zh": ImageFont.truetype(cjk_font(), 104),
        "pinyin": ImageFont.truetype(SERIF, 36),
        "name": ImageFont.truetype(SERIF, 50),
        "name_small": ImageFont.truetype(SERIF, 38),
        "detail": ImageFont.truetype(SERIF, 28),
        "brand": ImageFont.truetype(SERIF, 24),
    }
    for h in hexagram_records():
        hexagram_image(h, fonts)


def og_image():
    image = Image.new("RGB", (1200, 630), PARCHMENT[:3])
    draw = ImageDraw.Draw(image)
    draw.rectangle((48, 48, 1151, 581), outline=RULE[:3], width=1)

    zh = ImageFont.truetype(cjk_font(), 92)
    title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 54)
    sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 26)

    draw_centered(draw, "易經", zh, 168, INK)
    draw.line((460, 318, 740, 318), fill=RULE[:3], width=1)
    draw_centered(draw, "The Free I Ching", title, 348, INK)
    draw_centered(draw, "A quiet oracle", sub, 440, MUTED, tracking=4)

    image.save(PUBLIC / "og-image.png", "PNG", optimize=True)


def favicon():
    source = Image.open(PUBLIC / "icons" / "icon-192.png").convert("RGBA")
    source.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )


if __name__ == "__main__":
    import sys

    if "--hexagrams-only" in sys.argv:
        hexagram_images()
        print("wrote public/share/hexagram-1.png to hexagram-64.png")
    else:
        og_image()
        favicon()
        hexagram_images()
        print("wrote public/og-image.png, public/favicon.ico and public/share/hexagram-N.png")
