"""Fill game pages with Steam media: screenshots, a wide banner, the trailer and
PC system requirements. Writes assets/js/steam.js (keyed by each product's
`game`), which data.js applies to every product of that game. The owner's own
edits in the admin always win.

Run:  python3 scripts/enrich_from_steam.py            (uses a cache in scripts/.steam-cache.json)
Needs network access to store.steampowered.com and the Steam CDN hosts."""
import difflib, html, json, pathlib, re, sys, time, unicodedata, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'scripts' / '.steam-cache.json'
OUT = ROOT / 'assets' / 'js' / 'steam.js'
CDN = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/'
MOV = 'https://cdn.akamai.steamstatic.com/steam/apps/'
UA = {'User-Agent': 'Mozilla/5.0 (store catalogue builder)'}

cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
def save(): CACHE.write_text(json.dumps(cache))

def get(url, as_json=True, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
                b = r.read()
                return json.loads(b) if as_json else b
        except urllib.error.HTTPError as e:
            if e.code == 429: print('429, waiting', url[:80], file=sys.stderr); time.sleep(20 * (i + 1)); continue
            if e.code in (403, 404): return None
            time.sleep(3)
        except Exception:
            time.sleep(3)
    return None

def exists(url):
    k = 'HEAD ' + url
    if k not in cache:
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA, method='HEAD'), timeout=15) as r:
                cache[k] = r.status == 200
        except Exception:
            cache[k] = False
    return cache[k]

ROMAN = {'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7', 'viii': '8'}
def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r"['’`®™]", '', s)
    s = re.sub(r'[:.,!?\-–—|()/\[\]&+]', ' ', s)
    s = re.sub(r'\bea sports\b', 'ea', s)
    s = re.sub(r'\btom clancys\b', '', s)
    return re.sub(r'\s+', ' ', s).strip()

DROP = r'\b(fresh|steam|stam|epic|account|key|psn|ps5|ps4|playstation|xbox( live)?|series x ?s|one|pc|global|usa|eu|emea|tunisia|' \
       r'ubisoft connect|early access|pre ?order|year 1|' \
       r'(standard|deluxe|delux|ultimate|gold|premium|complete|digital|vault|cross ?gen|definitive|game of the year|goty|legendary|' \
       r'champions|special|collectors|enhanced|phantom|toty|kobe bryant|directors cut)( edition| cut)?|edition|bundle|pack)\b'
def term_of(short):
    t = re.sub(DROP, ' ', norm(short))
    t = re.sub(r'\bea$', '', t.strip())
    return re.sub(r'\s+', ' ', t).strip()
def key_of(name):   # for comparing: roman numerals as digits
    return ' '.join(ROMAN.get(w, w) for w in term_of(name).split())

# better search words for names the store spells differently from Steam; None = not on Steam
ALIAS = {
  'gta-v': 'Grand Theft Auto V Enhanced', 'hitman-3': 'HITMAN World of Assassination',
  'hitman-world-of-assassination-part-one': 'HITMAN World of Assassination', 'hitman-world-of-assassination-deluxe-pack-bundle': 'HITMAN World of Assassination',
  'ghost-of-tsushima-directors-cut': 'Ghost of Tsushima', 'last-of-us-part-1': 'The Last of Us Part I', 'last-of-us-part-ii': 'The Last of Us Part II Remastered',
  'resident-evil-7-biohazard-biohazard-7-resident-evil': 'Resident Evil 7 Biohazard', 'resident-evil-village-resident-evil-8': 'Resident Evil Village',
  'call-of-duty-modern-warfare-3-2023': 'Call of Duty Modern Warfare III', 'senuas-saga-hellblade-ii': 'Hellblade II Senuas Saga',
  'death-stranding-2': 'DEATH STRANDING 2 ON THE BEACH', 'rainbow-extraction': 'Rainbow Six Extraction', 'football-manager-2024-epic': 'Football Manager 2024',
  'sea-of-thieves-2023-deluxe': 'Sea of Thieves', 'sea-of-thieves-2025': 'Sea of Thieves', 'project-motor-racing-year-1-bundle': 'Project Motor Racing',
  'ea-madden-nfl-26': 'Madden NFL 26', 'world-of-warcraft-midnight-stam': None, 'minecraft': None, 'minecraft-java-bedrock': None,
  'grand-theft-auto-vi': None, 'grand-theft-auto-vi-psn': None, 'grand-theft-auto-vi-psn-tunisia': None, 'grand-theft-auto-vi-psn-ultimate': None,
  'grand-theft-auto-vi-ultimate': None, 'forza-horizon-4': None, 'forza-horizon-4-ultimate': None, 'china': None, 'sands-of-time': None,
  'call-of-duty-modern-warfare-2019': None, 'japan': None, 'amarica': None,
}
NOT_GAME = r'\b(pack|soundtrack|season pass|upgrade|points|dlc|demo|editor|character|expansion|cosmetic|bonus|currency|coins|vc)\b'

def search(term):
    k = 'S ' + term
    if k not in cache:
        d = get('https://store.steampowered.com/api/storesearch/?' + urllib.parse.urlencode({'term': term, 'cc': 'us', 'l': 'english'}))
        cache[k] = [(i['id'], i['name']) for i in (d or {}).get('items', []) if i.get('type') == 'app']
        time.sleep(0.4)
    return cache[k]

def details(app, lang='english'):
    k = 'D %s' % app if lang == 'english' else 'D %s %s' % (lang, app)
    if k not in cache:
        d = get('https://store.steampowered.com/api/appdetails?appids=%s&l=%s&cc=us' % (app, lang))
        v = (d or {}).get(str(app), {})
        cache[k] = v.get('data') if v.get('success') else None
        time.sleep(1.5)
    return cache[k]

LABELS = [('os', r'^os'), ('cpu', r'^processor'), ('ram', r'^memory'), ('gpu', r'^graphics|^video'), ('storage', r'^storage|^hard (disk|drive)|^disk'),
          ('dx', r'^directx'), ('net', r'^network'), ('notes', r'^additional notes|^notes')]
def reqs(block):
    out = {}
    if not block: return out
    for li in re.findall(r'<li>(.*?)</li>', block, re.S):
        m = re.match(r'\s*<strong>([^<]+?):?\s*</strong>\s*(.*)', li, re.S)
        if not m: continue
        label, val = m.group(1).strip().rstrip(':').lower(), html.unescape(re.sub(r'<[^>]+>', ' ', m.group(2)))
        val = re.sub(r'\s+', ' ', val).strip()
        for key, pat in LABELS:
            if re.match(pat, label) and val and key not in out:
                out[key] = val[:200]; break
    return out

MONTHS = {m: i + 1 for i, m in enumerate(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'])}
def iso_date(txt):
    """'24 Feb, 2022' or 'Feb 24, 2022' -> '2022-02-24' ('' when it isn't a date, e.g. 'Coming soon')."""
    m = re.match(r'(\d{1,2}) (\w{3})\w*,? (\d{4})$', txt or '') or re.match(r'(\w{3})\w* (\d{1,2}),? (\d{4})$', txt or '')
    if not m: return ''
    a, b, y = m.groups()
    day, mon = (a, b) if a.isdigit() else (b, a)
    mon = MONTHS.get(mon.lower()[:3])
    return f'{y}-{mon:02d}-{int(day):02d}' if mon else ''

def text(h, n=420):
    t = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h or ''))).strip()
    return t if len(t) <= n else t[:n].rsplit(' ', 1)[0] + '…'

def about(e, d):
    """The game's description in English, French and Arabic (only where Steam has a translation),
    its developer, publisher, release date and genres."""
    en = text(d.get('short_description'))
    if en:
        e['d'] = {'en': en}
        for code, lang in (('fr', 'french'), ('ar', 'arabic')):
            x = details(e['a'], lang) or {}
            t = text(x.get('short_description'))
            if t and t != en: e['d'][code] = t
            g = [y['description'] for y in x.get('genres', [])][:4]
            if g and g != [y['description'] for y in d.get('genres', [])][:4]: e.setdefault('g', {})[code] = g
    g = [y['description'] for y in d.get('genres', [])][:4]
    if g: e.setdefault('g', {})['en'] = g
    if d.get('developers'): e['dev'] = ', '.join(d['developers'][:2])[:80]
    if d.get('publishers'): e['pub'] = ', '.join(d['publishers'][:2])[:80]
    r = iso_date((d.get('release_date') or {}).get('date', ''))
    if r: e['rel'] = r

# the games sold, from the generated catalogue (each with its clean short name)
cat = (ROOT / 'assets/js/catalog.js').read_text()
games = {}
for row in re.findall(r'\{ id: "[^\n]*', cat):
    g = re.search(r'game: "([\w-]+)"', row); s = re.search(r'short: "((?:[^"\\]|\\.)*)"', row)
    sub = re.search(r'sub: "(\w+)"', row)
    if g and s and 'cat: "games"' in row and sub.group(1) in ('accounts', 'keys', 'ps', 'xboxgames'):
        games.setdefault(g.group(1), s.group(1))
print(len(games), 'games', file=sys.stderr)

out, missed = {}, []
for n, (game, short) in enumerate(sorted(games.items())):
    if game in ALIAS and ALIAS[game] is None: continue
    term = term_of(ALIAS.get(game) or short)
    if not term: continue
    want = key_of(ALIAS.get(game) or short)
    hits = search(term) or search(want)
    best, score = None, 0
    for app, name in hits[:10]:
        if re.search(NOT_GAME, norm(name)): continue
        nn = key_of(name)
        r = difflib.SequenceMatcher(None, want, nn).ratio()
        if nn == want: r = 1.01
        elif (nn.startswith(want + ' ') or want.startswith(nn + ' ')) and abs(len(nn) - len(want)) < 14: r = max(r, .9)
        if r > score: best, score = app, r
    if not best or score < .82:
        missed.append((game, short, hits[:2])); continue
    d = details(best)
    if not d or d.get('type') != 'game':
        missed.append((game, short, 'not a game')); continue
    e = {'a': best}
    shots = [re.search(r'/apps/\d+/((?:[0-9a-f]{40}/)?ss_[0-9a-f]+)\.1920x1080', s['path_full']) for s in d.get('screenshots', [])]
    ids = [m.group(1) for m in shots if m][:6]
    # old screenshots live at <app>/ss_<hash>, newer ones at <app>/<hash>/ss_<hash>: keep the hash, n = newer layout
    e['s'] = [i.split('ss_')[1] for i in ids]
    if ids and '/' in ids[0]: e['n'] = 1
    if exists(CDN + '%s/library_hero.jpg' % best): e['h'] = 1
    movs = sorted(d.get('movies') or [], key=lambda m: not m.get('highlight'))
    for m in movs[:2]:
        if exists(MOV + '%s/movie480_vp9.webm' % m['id']):
            e['v'] = m['id']
            if exists(MOV + '%s/movie_max_vp9.webm' % m['id']): e['vh'] = 1
            break
    pr = d.get('pc_requirements') if isinstance(d.get('pc_requirements'), dict) else {}
    r = {'min': reqs(pr.get('minimum')), 'rec': reqs(pr.get('recommended'))}
    if r['min'] or r['rec']: e['r'] = r
    about(e, d)
    out[game] = e
    if n % 5 == 0:
        save(); print(n, game, best, round(score, 2), time.strftime('%H:%M:%S'), file=sys.stderr)
save()

# gift-card and top-up brands that are games on Steam: their pages get the game's photos and trailer
BRAND_GAMES = {'marvel': 'Marvel Rivals', 'ufl': 'UFL', 'efootball': 'eFootball', 'bloodstrike': 'Blood Strike',
               'wuwa': 'Wuthering Waves', 'fortnite': None, 'warzone': None}
for sub, name in BRAND_GAMES.items():
    if not name: continue
    want = key_of(name)
    hits = [h for h in search(term_of(name)) if not re.search(NOT_GAME, norm(h[1]))]
    best = next((app for app, n in hits if key_of(n) == want), None)
    d = best and details(best)
    if not d: missed.append(('brand ' + sub, name, hits[:2])); continue
    shots = [re.search(r'/apps/\d+/((?:[0-9a-f]{40}/)?ss_[0-9a-f]+)\.1920x1080', x['path_full']) for x in d.get('screenshots', [])]
    ids = [m.group(1) for m in shots if m][:6]
    e = {'a': best, 's': [i.split('ss_')[1] for i in ids]}
    if ids and '/' in ids[0]: e['n'] = 1
    for m in sorted(d.get('movies') or [], key=lambda m: not m.get('highlight'))[:2]:
        if exists(MOV + '%s/movie480_vp9.webm' % m['id']):
            e['v'] = m['id']
            if exists(MOV + '%s/movie_max_vp9.webm' % m['id']): e['vh'] = 1
            break
    about(e, d)
    out['sub:' + sub] = e
save()

OUT.write_text('/* Steam media for the games sold here: screenshots, banner, trailer and PC\n'
               '   requirements, keyed by product `game`. Generated by scripts/enrich_from_steam.py —\n'
               '   don\'t edit by hand. a = Steam app, s = screenshot hashes (n = newer path), h = has a wide banner,\n'
               '   v = trailer id (vh = also in HD), r = system requirements,\n'
               '   d = description per language (en, fr, ar), g = genres per language, dev / pub = developer / publisher, rel = release date. */\n'
               'export const STEAM = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('matched', len(out), 'missed', len(missed), file=sys.stderr)
for m in missed: print('  miss', m, file=sys.stderr)
