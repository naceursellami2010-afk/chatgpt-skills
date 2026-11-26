"""Official App Store pictures for mobile games, apps and subscriptions.

For each brand below it finds the app on the App Store (itunes.apple.com search),
keeps its screenshots and icon, and builds a banner from them: a blurred screenshot
as the background, the screenshots as cards and the app icon. Writes
assets/js/appstore.js (screenshots per brand, and which software product is which
app) and assets/products/brands/as-<key>.webp; scripts/brand_banners.py then points
those products at the new banners.

    python3 scripts/enrich_from_appstore.py     (cache: scripts/.appstore-cache.json)
Needs network access to itunes.apple.com and is1-5-ssl.mzstatic.com."""
import io, json, pathlib, re, sys, time, unicodedata, urllib.parse, urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'scripts' / '.appstore-cache.json'
OUT_JS = ROOT / 'assets' / 'js' / 'appstore.js'
OUT_IMG = ROOT / 'assets' / 'products' / 'brands'
UA = {'User-Agent': 'Mozilla/5.0 (store catalogue builder)'}
W, H = 1920, 560

# key -> (search words, words the app's name must start with, seller must contain)
APPS = {
    # mobile games (keys = the shop's sub-categories)
    'efootball': ('eFootball', 'efootball', 'konami'), 'pubg': ('PUBG MOBILE', 'pubg mobile', 'tencent'),
    'freefire': ('Free Fire', 'free fire', 'garena'), 'codm': ('Call of Duty Mobile', 'call of duty', 'activision'),
    'coc': ('Clash of Clans', 'clash of clans', 'supercell'), 'clashroyale': ('Clash Royale', 'clash royale', 'supercell'),
    'brawlstars': ('Brawl Stars', 'brawl stars', 'supercell'), 'roblox': ('Roblox', 'roblox', 'roblox'),
    'genshin': ('Genshin Impact', 'genshin impact', 'cognosphere'), 'wildrift': ('League of Legends Wild Rift', 'league of legends', 'riot'),
    'fcmobile': ('EA SPORTS FC Mobile Soccer', 'ea sports fc soccer mobile', 'ea swiss'), 'mlbb': ('Mobile Legends Bang Bang', 'mobile legends', ''),
    'hsr': ('Honkai Star Rail', 'honkai', 'cognosphere'), 'wuwa': ('Wuthering Waves', 'wuthering waves', 'kuro'),
    'whiteout': ('Whiteout Survival', 'whiteout survival', 'century'), 'bloodstrike': ('Blood Strike', 'blood strike', 'netease'),
    # (Warzone Mobile left the stores: its pages keep the generated banner)
    # app credits
    'app-tiktok': ('TikTok', 'tiktok', 'tiktok'), 'app-bigo': ('BIGO LIVE', 'bigo live', 'bigo'), 'app-likee': ('Likee', 'likee', ''),
    'app-snapchat': ('Snapchat', 'snapchat', 'snap'), 'app-duolingo': ('Duolingo', 'duolingo', 'duolingo'), 'app-poppo': ('Poppo Live', 'poppo', ''),
    'app-superlive': ('SuperLive', 'superlive', ''), 'app-weplay': ('WePlay', 'weplay', ''), 'app-mango': ('Mango Live', 'mango', ''),
    'app-dramawave': ('DramaWave', 'dramawave', ''), 'app-dramabox': ('DramaBox', 'dramabox', ''), 'app-tango': ('Tango Live Stream Video Chat', 'tango live', ''),
    # software and subscriptions (matched to products by name, below)
    'netflix': ('Netflix', 'netflix', 'netflix'), 'spotify': ('Spotify', 'spotify', 'spotify'), 'shahid': ('MBC Shahid', 'mbc shahid', 'mbc'),
    'discord': ('Discord', 'discord', 'discord'), 'chatgpt': ('ChatGPT', 'chatgpt', 'openai'), 'gemini': ('Google Gemini', 'google gemini', 'google'),
    'perplexity': ('Perplexity', 'perplexity', 'perplexity'), 'capcut': ('CapCut', 'capcut', ''), 'nordvpn': ('NordVPN', 'nordvpn', 'nord'),
    'norton': ('Norton 360', 'norton 360', 'gen digital'), 'mcafee': ('McAfee Security', 'mcafee', 'mcafee'), 'bitdefender': ('Bitdefender Mobile Security', 'bitdefender', 'bitdefender'),
    'avg': ('AVG Mobile Security', 'avg', 'avg'), 'adguard': ('AdGuard', 'adguard', 'adguard'), 'kaspersky': ('Kaspersky Security VPN', 'kaspersky', 'kaspersky'),
    'word': ('Microsoft Word', 'microsoft word', 'microsoft'), 'excel': ('Microsoft Excel', 'microsoft excel', 'microsoft'),
    'powerpoint': ('Microsoft PowerPoint', 'microsoft powerpoint', 'microsoft'), 'outlook': ('Microsoft Outlook', 'microsoft outlook', 'microsoft'),
    'office': ('Microsoft Office', 'microsoft 365', 'microsoft'),
}
# software product name -> app key (first match wins)
SOFTWARE = [('netflix', 'netflix'), ('spotify', 'spotify'), ('shahid', 'shahid'), ('discord', 'discord'), ('chatgpt', 'chatgpt'),
            ('gemini', 'gemini'), ('perplexity', 'perplexity'), ('capcut', 'capcut'), ('nord vpn|nordvpn', 'nordvpn'), ('norton', 'norton'),
            ('mcafee', 'mcafee'), ('bitdefender', 'bitdefender'), (r'\bavg\b', 'avg'), ('adguard', 'adguard'), ('kaspersky', 'kaspersky'),
            (r'microsoft word|\bword 20', 'word'), (r'microsoft excel', 'excel'), (r'microsoft powerpoint', 'powerpoint'),
            (r'microsoft outlook', 'outlook'), (r'microsoft office|office (pro|20)', 'office')]

cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
def save(): CACHE.write_text(json.dumps(cache))

def get(url, as_json=True):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                b = r.read()
                return json.loads(b) if as_json else b
        except Exception:
            time.sleep(3 + 5 * i)
    return None

def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', s)).strip()

def find(key, term, starts, seller):
    k = 'S ' + term
    if k not in cache:
        d = get('https://itunes.apple.com/search?' + urllib.parse.urlencode({'term': term, 'entity': 'software', 'country': 'us', 'limit': 8}))
        cache[k] = (d or {}).get('results', [])
        time.sleep(1.5)
    for r in cache[k]:
        if norm(r.get('trackName')).startswith(norm(starts)) and (not seller or seller in norm(r.get('sellerName'))):
            return r
    return None

def big(u, px=1600, fmt='webp'):
    return re.sub(r'/[^/]+$', f'/{px}x{px}bb.{fmt}', u)

IMG_CACHE = pathlib.Path('/tmp/appstore-img-cache')
def fetch_img(u):
    IMG_CACHE.mkdir(exist_ok=True)
    f = IMG_CACHE / re.sub(r'[^\w.]+', '_', u[-150:])
    if not f.exists():
        data = get(u, as_json=False)
        if data: f.write_bytes(data)
    data = f.read_bytes() if f.exists() else None
    return Image.open(io.BytesIO(data)).convert('RGB') if data else None

def rounded(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=r, fill=255)
    im = im.convert('RGBA'); im.putalpha(m)
    return im

def shadowed(base, im, x, y, angle=0, blur=26, alpha=.55):
    rot = im.rotate(angle, resample=Image.BICUBIC, expand=True) if angle else im
    sh = Image.new('RGBA', (rot.width + 140, rot.height + 140), (0, 0, 0, 0))
    sh.paste(Image.new('RGBA', rot.size, (0, 0, 0, 255)), (70, 86), rot.split()[3].point(lambda v: v * alpha))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(sh, (int(x - sh.width / 2), int(y - sh.height / 2)))
    base.alpha_composite(rot, (int(x - rot.width / 2), int(y - rot.height / 2)))

def banner(key, shots, icon_url):
    """A blurred screenshot behind, three or four screenshots as cards across the right, the icon on the left."""
    imgs = [i for i in (fetch_img(big(u, 1280, 'jpg')) for u in shots[:4]) if i]
    if not imgs: return False
    land = [i for i in imgs if i.width > i.height]
    bg = ImageOps.fit(land[0] if land else imgs[0], (W, H), Image.LANCZOS, centering=(.5, .45)).filter(ImageFilter.GaussianBlur(16))
    bg = Image.blend(bg, Image.new('RGB', (W, H), (10, 12, 18)), .28).convert('RGBA')
    shade = Image.linear_gradient('L').rotate(90).resize((W, H)).point(lambda v: int(175 - v * .62))   # darker on the left
    bg = Image.composite(Image.new('RGBA', (W, H), (6, 8, 12, 255)), bg, shade)
    if land:
        cards = [rounded(ImageOps.contain(i, (600, 340), Image.LANCZOS), 18) for i in land[:3]]
        spots = {1: [(.66, .5, -3)], 2: [(.58, .56, 4), (.80, .46, -4)], 3: [(.46, .58, 5), (.84, .56, -5), (.65, .46, 0)]}[len(cards)]
        order = cards if len(cards) < 3 else [cards[1], cards[2], cards[0]]
    else:   # phone screenshots
        cards = [rounded(ImageOps.contain(i, (240, 460), Image.LANCZOS), 28) for i in imgs[:4]]
        spots = {1: [(.7, .52, 0)], 2: [(.62, .52, 5), (.78, .52, -5)], 3: [(.56, .54, 6), (.84, .54, -6), (.70, .5, 0)],
                 4: [(.46, .56, 7), (.88, .56, -7), (.60, .52, 3), (.74, .5, -2)]}[len(cards)]
        order = cards if len(cards) < 3 else ([cards[1], cards[2], cards[0]] if len(cards) == 3 else [cards[2], cards[3], cards[1], cards[0]])
    for c, (x, y, a) in zip(order, spots):
        shadowed(bg, c, W * x, H * y, a)
    ic = fetch_img(big(icon_url, 512, 'jpg')) if icon_url else None
    if ic:
        shadowed(bg, rounded(ic.resize((176, 176), Image.LANCZOS), 40), W * .13, H * .5, 0, 20, .7)
    bg.convert('RGB').save(OUT_IMG / f'as-{key}.webp', 'WEBP', quality=80, method=6)
    return True

def main():
    found, missed = {}, []
    for key, (term, starts, seller) in APPS.items():
        r = find(key, term, starts, seller)
        if not r:
            missed.append(key); continue
        shots = r.get('screenshotUrls') or []
        pads = r.get('ipadScreenshotUrls') or []
        # games: landscape shots look best; the iPad set is often landscape when the phone set isn't
        pick = shots if len(shots) >= 3 else pads
        entry = {'n': r['trackName'][:60], 's': [big(u) for u in pick[:6]], 'i': big(r.get('artworkUrl512') or r.get('artworkUrl100', ''), 512)}
        if not entry['s']:
            missed.append(key); continue
        if banner(key, pick, r.get('artworkUrl512')):
            found[key] = entry
            print(key, '->', r['trackName'], len(entry['s']), file=sys.stderr)
        save()
    # which software product is which app
    cat = (ROOT / 'assets/js/catalog.js').read_text() + (ROOT / 'assets/js/data.js').read_text()
    product_app = {}
    for pid, name in re.findall(r'id: ["\']([^"\']+)["\'][^\n]*?name: ["\']((?:[^"\'\\]|\\.)*)["\'][^\n]*?cat: ["\']software', cat):
        n = name.lower()
        k = next((k for rx, k in SOFTWARE if re.search(rx, n)), None)
        if k in found: product_app[pid] = k
    OUT_JS.write_text('/* Official App Store screenshots (s) and icon (i) for mobile games, apps and subscriptions,\n'
                      '   and which software product is which app. Generated by scripts/enrich_from_appstore.py —\n'
                      "   don't edit by hand. Banners: brands/as-<key>.webp in the products folder. */\n"
                      'export const APPS = ' + json.dumps(found, ensure_ascii=False, separators=(',', ':')) + ';\n'
                      'export const PRODUCT_APP = ' + json.dumps(product_app, separators=(',', ':')) + ';\n')
    print('found', len(found), 'missed', missed, 'software products', len(product_app), file=sys.stderr)

if __name__ == '__main__':
    main()
