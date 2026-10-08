#!/usr/bin/env python3
"""Write the committed favicon and share image. Run when those assets need to change."""

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


def og_image():
    image = Image.new("RGB", (1200, 630), PARCHMENT[:3])
    draw = ImageDraw.Draw(image)
    draw.rectangle((48, 48, 1151, 581), outline=RULE[:3], width=1)

    zh = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-microhei.ttc", 92)
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
    og_image()
    favicon()
    print("wrote public/og-image.png and public/favicon.ico")
