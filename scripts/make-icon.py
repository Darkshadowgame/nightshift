"""Renders the NS app icon, splash and Android/web icons from the in-app brand.

N in chalk, S in sodium orange (like the NIGHTSHIFT wordmark), Chakra Petch Bold
Italic, inside the hexagon pin outline on asphalt with a sodium street-light glow.
Run from the repo root: python3 scripts/make-icon.py (needs Pillow).
"""
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = 'node_modules/@expo-google-fonts/chakra-petch/700Bold_Italic/ChakraPetch_700Bold_Italic.ttf'
BG, CHALK, SODIUM = (11, 15, 23), (233, 237, 244), (255, 154, 46)


def hexagon(cx, cy, r):
    return [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in (-90, -30, 30, 90, 150, 210)]


def mark(size, bg=True):
    s = size * 4  # supersample, then scale down
    img = Image.new('RGBA', (s, s), BG + (255,) if bg else (0, 0, 0, 0))
    if bg:
        glow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse((s * 0.05, s * 0.55, s * 0.95, s * 1.35), fill=SODIUM + (70,))
        img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(s * 0.12)))
    d = ImageDraw.Draw(img)
    cx = cy = s / 2
    d.polygon(hexagon(cx, cy, s * 0.40), outline=SODIUM + (255,), width=int(s * 0.028))
    font = ImageFont.truetype(FONT, int(s * 0.355))
    n_w, s_w, gap = d.textlength('N', font=font), d.textlength('S', font=font), -s * 0.01
    bbox = font.getbbox('NS')
    x = cx - (n_w + s_w + gap) / 2 - s * 0.012  # nudge left: italics lean right
    y = cy - (bbox[3] - bbox[1]) / 2 - bbox[1]
    d.text((x, y), 'N', font=font, fill=CHALK + (255,))
    d.text((x + n_w + gap, y), 'S', font=font, fill=SODIUM + (255,))
    return img.resize((size, size), Image.LANCZOS)


def main():
    mark(1024).convert('RGB').save('assets/icon.png')  # iOS: no transparency
    mark(1024, bg=False).save('assets/splash-icon.png')
    fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    fg.paste(mark(700, bg=False), (162, 162))
    fg.save('assets/android-icon-foreground.png')
    Image.new('RGB', (1024, 1024), BG).save('assets/android-icon-background.png')
    alpha = mark(700, bg=False).split()[3]
    mono = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    mono.paste(Image.new('RGBA', (700, 700), (255, 255, 255, 255)), (162, 162), alpha)
    mono.save('assets/android-icon-monochrome.png')
    mark(48).convert('RGB').save('assets/favicon.png')


if __name__ == '__main__':
    main()
