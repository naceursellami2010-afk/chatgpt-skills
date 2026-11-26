"""Wide banners for the gift-card, mobile top-up and hardware pages (one per sub-category).

Each banner is the brand's colours as a soft gradient with light glows, and its
card photos fanned out on the right, with no text so it reads in every
language. Written to assets/products/brands/<sub>.webp (1920 × 560); data.js
shows it as the banner block and the blurred page background of every product of
that brand.

    python3 scripts/brand_banners.py
"""
import colorsys, hashlib, json, math, pathlib, random, re
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIVE = ROOT / 'assets/products/live'
OUT = ROOT / 'assets/products/brands'
W, H = 1920, 560

# brand colours: (deep, bright)
BRAND = {
    'steam': ('#0b1a2b', '#2a6f9e'), 'playstation': ('#001a4d', '#0070d1'), 'itunes': ('#2a0b3d', '#fc3c78'),
    'xbox': ('#062b06', '#18a018'), 'nintendo': ('#3d0005', '#e60012'), 'epic': ('#0d0d12', '#2b6fd6'),
    'fortnite': ('#1c0b45', '#7b3cf0'), 'lol': ('#06101f', '#c89b3c'), 'valorant': ('#0f1923', '#fd4556'),
    'razer': ('#050805', '#44d62c'), 'battlenet': ('#071226', '#148eff'), 'marvel': ('#1a0306', '#e0141e'),
    'ufl': ('#06102a', '#19c3ff'), 'binance': ('#121317', '#f0b90b'), 'redotpay': ('#160607', '#e53935'),
    'bybit': ('#0f0f12', '#f7a600'),
}

# hardware pages share the store's own colours
HW = ('pcs', 'monitors', 'keyboards', 'mice', 'headsets', 'controllers', 'chairs', 'mousepads', 'gpu', 'cpu', 'motherboards',
             'ram', 'storage', 'psu', 'cases', 'cooling', 'cables', 'printers', 'combos')
for _sub in HW:
    BRAND[_sub] = ('#0a1418', '#2f8f86')

def hexrgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def auto_colours(imgs):
    """deep + bright colours from the brand's photos (their most saturated hue)."""
    px = []
    for im in imgs:
        px += list(im.convert('RGB').resize((40, 40)).get_flattened_data())
    best = max(px, key=lambda c: colorsys.rgb_to_hsv(*(v / 255 for v in c))[1] * (0.35 + colorsys.rgb_to_hsv(*(v / 255 for v in c))[2]))
    h, s, v = colorsys.rgb_to_hsv(*(x / 255 for x in best))
    bright = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(h, min(1, s * 1.05), max(.75, v)))
    deep = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(h, min(1, s * .9), .14))
    return deep, bright

def gradient(deep, bright):
    g = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(g)
    for x in range(W):
        t = (x / W) ** 1.4
        d.line([(x, 0), (x, H)], fill=tuple(int(deep[i] + (bright[i] - deep[i]) * t * .55) for i in range(3)))
    glow = Image.new('L', (W, H), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W * .52, -H * .6, W * 1.15, H * 1.3), fill=200)
    gd.ellipse((-W * .2, H * .45, W * .35, H * 1.6), fill=90)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    g = Image.composite(Image.new('RGB', (W, H), bright), g, glow.point(lambda v: v * .55))
    # fine diagonal lines for texture
    lines = Image.new('L', (W, H), 0)
    ld = ImageDraw.Draw(lines)
    for x in range(-H, W, 22):
        ld.line([(x, H), (x + H, 0)], fill=16, width=1)
    return Image.composite(Image.new('RGB', (W, H), (255, 255, 255)), g, lines)

def card(im, h):
    im = im.convert('RGBA')
    im = ImageOps.contain(im, (int(h * 1.6), h), Image.LANCZOS)
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=int(h * .07), fill=255)
    im.putalpha(mask)
    return im

def paste_card(base, im, cx, cy, angle):
    rot = im.rotate(angle, resample=Image.BICUBIC, expand=True)
    sh = Image.new('RGBA', (rot.width + 120, rot.height + 120), (0, 0, 0, 0))
    a = rot.split()[3].point(lambda v: v * .6)
    sh.paste(Image.new('RGBA', rot.size, (0, 0, 0, 255)), (60, 75), a)
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    base.alpha_composite(sh, (int(cx - sh.width / 2), int(cy - sh.height / 2)))
    base.alpha_composite(rot, (int(cx - rot.width / 2), int(cy - rot.height / 2)))

def banner(sub, files):
    imgs, seen = [], set()
    for f in files:   # distinct designs only
        b = (LIVE / f).read_bytes()
        hsh = hashlib.md5(Image.open(LIVE / f).convert('L').resize((16, 16)).tobytes()).hexdigest()
        if hsh in seen: continue
        seen.add(hsh); imgs.append(Image.open(LIVE / f))
        if len(imgs) == 3: break
    deep, bright = (tuple(map(hexrgb, BRAND[sub])) if sub in BRAND else auto_colours(imgs))
    base = gradient(deep, bright).convert('RGBA')
    n = len(imgs)
    spots = {1: [(W * .74, H * .52, -6)], 2: [(W * .66, H * .55, 7), (W * .82, H * .47, -6)],
             3: [(W * .60, H * .58, 9), (W * .86, H * .56, -9), (W * .73, H * .47, -2)]}[n]
    for im, (cx, cy, ang) in zip(imgs if n < 3 else [imgs[1], imgs[2], imgs[0]], spots):
        paste_card(base, card(im, int(H * (.62 if n == 1 else .56))), cx, cy, ang)
    # fade the left side so the page reads cleanly over it
    fade = Image.linear_gradient('L').rotate(90).resize((W, H))
    base = Image.composite(base, Image.new('RGBA', (W, H), deep + (255,)), fade.point(lambda v: min(255, int(v * 1.6))))
    base.convert('RGB').save(OUT / f'{sub}.webp', 'WEBP', quality=80, method=6)

# software: the kind of licence, from its name (data.js's swKind reads the same keys)
SW_KINDS = [('ai', r'chatgpt|gemini|perplexity|copilot'),
            ('subs', r'netflix|spotify|shahid|discord nitro|youtube|disney|osn|deezer|anghami|orca|iptv'),
            ('vpn', r'vpn|exitlag'),
            ('security', r'antivirus|norton|mcafee|bitdefender|eset|\bavg\b|kaspersky|avast|adguard|privacy|webcam guard|malware'),
            ('office', r'microsoft (office|access|excel|outlook|powerpoint|visio|word|project)|office (pro|20)'),
            ('windows', r'windows'),
            ('creative', r'adobe|autodesk|autocad|revit|maya|3ds|corel|capcut|affinity|enscape|photo|cinemagraph|music studio|cad|home design|wallpaper engine'),
            ('tools', r'ashampoo|ccleaner|aida64|download manager|parallels|zip|backup|driver|uninstaller|optimizer|burning|pdf')]
APP_BRANDS = ['bigo', 'dramawave', 'dramabox', 'tango', 'duolingo', 'likee', 'mango', 'poppo', 'snapchat', 'superlive', 'tiktok', 'weplay', 'apple']
SW_COLOURS = {'windows': ('#04122b', '#0a64d8'), 'office': ('#2a0d06', '#d83b01'), 'security': ('#06150f', '#16a34a'),
              'vpn': ('#0b0b24', '#4f46e5'), 'subs': ('#1a0610', '#e50914'), 'ai': ('#06161a', '#10a37f'),
              'creative': ('#140a24', '#9b5de5'), 'tools': ('#0f141a', '#3b82f6'), 'licence': ('#0a1418', '#2f8f86')}
for k, v in SW_COLOURS.items():
    BRAND['sw-' + k] = v


def slug(x):
    return re.sub(r'[^a-z0-9]+', '-', x.lower()).strip('-')[:40]


def art_key(cat, sub, name, game='', tag='', pid='', store=True):
    n = name.lower()
    # official App Store art first (scripts/enrich_from_appstore.py)
    if store and cat == 'mobile' and sub in AS_APPS:
        return 'as-' + sub
    if store and cat == 'software' and pid in AS_PRODUCT:
        return 'as-' + AS_PRODUCT[pid]
    if cat in ('cards', 'mobile', 'hardware'):
        return sub
    if cat == 'games':   # only games Steam has no banner for, and the game top-ups
        if sub == 'topups':
            return 'tu-' + slug(tag or name)
        return ('game-' + game) if game and game not in STEAM_HERO else None
    if sub == 'apps':
        k = 'app-' + next((b for b in APP_BRANDS if b in n.replace(' ', '')), 'other')
        return 'as-' + k if store and k in AS_APPS else k
    return 'sw-' + next((k for k, rx in SW_KINDS if re.search(rx, n)), 'licence')


STEAM_HERO, GAME_OF = set(), {}
_as = (ROOT / 'assets/js/appstore.js').read_text() if (ROOT / 'assets/js/appstore.js').exists() else ''
AS_APPS = set(json.loads(re.search(r'APPS = (\{.*?\});\n', _as).group(1))) if _as else set()
AS_PRODUCT = json.loads(re.search(r'PRODUCT_APP = (\{.*?\});', _as).group(1)) if _as else {}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []   # (id, cat, sub, name, image file relative to LIVE, game, first tag)
    st = (ROOT / 'assets/js/steam.js').read_text()
    STEAM_HERO.update(k for k, v in json.loads(st[st.index('{'):st.rindex(';')]).items() if v.get('h'))
    cat = (ROOT / 'assets/js/catalog.js').read_text()
    for row in re.findall(r'\{ id: "[^\n]*', cat):
        c = re.search(r'cat: "(\w+)"', row).group(1)
        if c not in ('cards', 'mobile', 'hardware', 'software', 'games'): continue
        g = re.search(r'game: "([\w-]+)"', row); tg = re.search(r'tags: \["([^"]*)"', row)
        rows.append((re.search(r'id: "([^"]+)"', row).group(1), c, re.search(r'sub: "(\w+)"', row).group(1),
                     json.loads('"' + re.search(r'name: "((?:[^"\\]|\\.)*)"', row).group(1) + '"'),
                     re.search(r"LIVE_IMG \+ '([^']+)'", row).group(1), g.group(1) if g else '', tg.group(1) if tg else ''))
    GAME_OF.update(json.loads(re.search(r'GAME_OF = (\{.*?\});', cat).group(1)))
    src = (ROOT / 'assets/js/data.js').read_text()   # hand-written products in data.js too
    for block in re.split(r"\n  \{\n", src):
        m = re.search(r"id: '([^']+)'", block); cs = re.search(r"cat: '(\w+)', sub: '(\w+)'", block)
        nm = re.search(r"name: '((?:[^'\\]|\\.)*)'", block); img = re.search(r"img: P \+ '([^']+)'", block)
        if m and cs and nm and img and cs.group(1) in ('cards', 'mobile', 'hardware', 'software', 'games'):
            tg = re.search(r"tags: \['([^']*)'", block)
            gm = GAME_OF.get(m.group(1), m.group(1).replace('ps-', '')) if cs.group(2) in ('accounts', 'keys', 'ps', 'xboxgames') else ''
            rows.append((m.group(1), cs.group(1), cs.group(2), nm.group(1).replace("\\'", "'"), '../' + img.group(1), gm, tg.group(1) if tg else ''))
    art, by, kind = {}, {}, {}
    for pid, c, sub, name, f, game, tag in rows:
        k = art_key(c, sub, name, game, tag, pid)
        if c == 'software': kind[pid] = art_key(c, sub, name, store=False)
        if not k: continue
        art[pid] = k
        by.setdefault(k, []).append((pid, f))
    for k, items in sorted(by.items()):
        if not k.startswith('as-'):   # App Store banners are made by enrich_from_appstore.py
            banner(k, sorted(f for _, f in items))
        print(k, len(items))
    (ROOT / 'assets/js/brand-art.js').write_text(
        '/* Which banner (brands/<key>.webp in the products folder) each gift card, top-up, software and hardware\n'
        '   product shows. Generated by\n'
        "   scripts/brand_banners.py — don't edit by hand. */\n"
        'export const ART = ' + json.dumps(art, separators=(',', ':')) + ';\n'
        '/* Software only: its kind (sw-windows, sw-subs, app-tiktok…), for its guide and redeem steps. */\n'
        'export const KIND = ' + json.dumps(kind, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    main()
