"""Import the full techgarage.tn catalogue of games, gift cards, mobile top-ups and software.

Reads a crawl of the live store (scripts/crawl_store.py writes it), maps every
product to the demo's categories, groups each game's PC / Xbox / PS5 keys and
accounts under one `game`, downloads a 400 px WebP of each product photo and
writes assets/js/catalog.js. Products already hand-written in data.js (same
store product number) are left alone and only told which game they belong to.

    python3 scripts/crawl_store.py crawl.json
    python3 scripts/import_catalogue.py crawl.json
"""

from __future__ import annotations

import concurrent.futures as cf
import io
import json
import pathlib
import re
import sys
import time
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "assets/js/data.js"
OUT = ROOT / "assets/js/catalog.js"
IMG_DIR = ROOT / "assets/products/live"
UA = {"User-Agent": "Mozilla/5.0 (techgarage-demo catalogue sync)"}

# ── where each store category goes in the demo ──────────────────────────────
MOBILE = {
    "warzone mobile": "warzone", "genshin impact": "genshin", "efootball 2027": "efootball", "call of duty mobile": "codm",
    "free fire (id)": "freefire", "pubg mobile": "pubg", "clash of clans": "coc", "league of legends wild rift": "wildrift",
    "brawlstars": "brawlstars", "fc mobile android": "fcmobile", "blood strike mobile": "bloodstrike", "wuthering waves": "wuwa",
    "clash royale": "clashroyale", "roblox": "roblox", "honkai star rail": "hsr", "whiteout survival": "whiteout",
    "mobile legends: bang bang": "mlbb",
}
CARDS = {
    "steam": "steam", "playstation": "playstation", "itunes": "itunes", "xbox": "xbox", "nintendo": "nintendo",
    "marvel rivals": "marvel", "ufl football": "ufl", "binance": "binance", "redotpay": "redotpay", "bybit": "bybit",
    "epic game": "epic", "league of legends": "lol", "battlenet": "battlenet", "razer gold": "razer", "fortnite": "fortnite",
    "valorant": "valorant",
}
SUB_NAMES = {}   # filled from data.js
REGION_OF_LEAF = {"usa": "US", "turkey": "TR", "euro": "EU", "france": "FR", "ukraine": "UA", "china": "CN",
                  "saudia": "SA", "canada": "CA"}


def place(crumbs: list[str], name: str):
    """(cat, sub) for a product, or None to skip it."""
    path = [c.strip().lower() for c in crumbs[1:]]
    if not path:
        return None
    root, n = path[0], name.lower()
    if root == "pc games":
        if len(path) == 1 or path[1] == "accounts":
            return "games", "accounts"
        return ("games", "keys") if path[1] == "key code" else ("games", "topups")
    if root == "ea fc 27":
        if "xbox" in n:
            return "games", "xboxgames"
        return ("games", "keys") if re.search(r"\bkey\b", n) else ("games", "accounts")
    if root == "playstation games":
        return "games", "ps"
    if root == "gift cards" and len(path) > 1:
        if path[1] == "xbox" and len(path) > 2 and path[2] == "xbox games":
            return "games", "xboxgames"
        sub = CARDS.get(path[1])
        return ("cards", sub) if sub else None
    if root == "mobile game" and len(path) > 1:
        sub = MOBILE.get(path[1])
        return ("mobile", sub) if sub else None
    if root == "computing" and len(path) > 1:   # hardware: physical products, shipped
        leaf = path[-1]
        sub = next((v for k, v in HARDWARE if k in leaf), None)
        return ("hardware", sub) if sub else None
    if root == "softwares":
        return "software", "licenses"
    if root == "mobile apps":
        return "software", "apps"
    return None


# store leaf category (lower case, matched by substring) -> hardware sub-category
HARDWARE = [("desktop gaming", "pcs"), ("monitor", "monitors"), ("keyboard", "keyboards"), ("mouse pad", "mousepads"), ("mice", "mice"),
            ("headset", "headsets"), ("controller", "controllers"), ("chair", "chairs"), ("graphics", "gpu"), ("processor", "cpu"),
            ("motherboard", "motherboards"), ("ram", "ram"), ("ssd", "storage"), ("flash", "storage"), ("memory card", "storage"),
            ("power suppl", "psu"), ("case", "cases"), ("fan", "cooling"), ("cooler", "cooling"), ("thermal", "cooling"),
            ("cable", "cables"), ("printer", "printers"), ("photocopier", "printers"), ("combo", "combos")]
HW_NAMES = {"pcs": "Gaming PC", "monitors": "Monitor", "keyboards": "Keyboard", "mice": "Mouse", "headsets": "Headset", "controllers": "Controller",
            "chairs": "Gaming chair", "mousepads": "Mouse pad", "gpu": "Graphics card", "cpu": "Processor", "motherboards": "Motherboard",
            "ram": "Memory", "storage": "Storage", "psu": "Power supply", "cases": "PC case", "cooling": "Cooling", "cables": "Cable",
            "printers": "Printer", "combos": "Gaming combo"}

GAME_PLATFORM = {"accounts": "pc", "keys": "pc", "ps": "ps5", "xboxgames": "xbox"}

# ── game names: one key for every version of the same game ──────────────────
NOISE = [
    r"buy .*", r"\(no game ?\)", r"\(eng/es/fr/pt\)", r"\(all dlc\)", r"pre-?order",
    r"pc edition standard", r"pc edition", r"standard edition", r"\(pc\)", r"fresh", r"\bnew\b", r"steam", r"accounts?", r"acount", r"\bcd\b", r"keys?", r"global", r"europe", r"\beu\b",
    r"\busa\b", r"worldwide", r"windows store", r"windows", r"uplay", r"ubisoft connect", r"ubisoft", r"ea app", r"origin",
    r"rockstar", r"epic games", r"playstation", r"ps4 (and|&) ps5 edition", r"ps5", r"ps4", r"xbox live",
    r"xbox one (&|and) xbox series x\|s", r"xbox one", r"\(?xbox series x[|/]s\)?", r"xbox", r"\blive\b",
    r"\bpc\b", r"\bstandard\b", r"\(\s*\)",
]
NOISE_RE = re.compile("|".join(f"(?:{n})" for n in NOISE), re.I)
KEEP_UPPER = {"EA", "FC", "GTA", "NBA", "UFC", "F1", "DLC", "II", "III", "IV", "VI", "VII", "VIII", "XI", "2K", "TOTY", "ARK",
              "DOOM", "COD", "R.E.P.O.", "PUBG", "UC", "CP", "VP", "RP", "LP", "USD", "EUR", "TRY", "CAD", "SAR", "CNY", "UAH",
              "PSN", "VPN", "AI", "TV", "HD", "4K", "PS", "X|S", "MW3", "2D", "3D", "UFL", "XP", "FP", "DC", "NOD32", "AVG",
              "ESET", "IPTV", "BIGO", "TOD", "VIP", "MLBB", "HSR", "TN"}
SPECIAL = {"efootball": "eFootball", "freefire": "Free Fire", "weplay": "WePlay", "tiktok": "TikTok", "youtube": "YouTube",
           "playstation": "PlayStation", "iphone": "iPhone", "ios": "iOS", "adguard": "AdGuard", "nordvpn": "NordVPN",
           "coreldraw": "CorelDRAW", "autocad": "AutoCAD", "chatgpt": "ChatGPT", "capcut": "CapCut", "linkedin": "LinkedIn"}


def tidy(s: str) -> str:
    s = s.replace("丨", " ").replace("’", "'").replace("™", "").replace("®", "").replace("©", "")
    s = re.sub(r"\s+", " ", s).strip(" -|:·,")
    s = re.sub(r"\s*([|:])\s*(?=[|:]|$)", "", s)
    return s.strip(" -|:·,")


def nice_case(s: str) -> str:
    """Shouting and all-lowercase names read as titles; acronyms stay upper case."""
    lower = not any(c.isupper() for c in s)
    out = []
    for i, w in enumerate(s.split(" ")):
        core = w.strip("():,·")
        if core.lower() in SPECIAL:
            w = w.replace(core, SPECIAL[core.lower()])
        elif core.upper() in KEEP_UPPER or any(ch.isdigit() for ch in core):
            w = w.replace(core, core.upper()) if core.upper() in KEEP_UPPER else w
        elif core.isupper() and len(core) >= 3 or lower and core and (i == 0 or core not in {"of", "the", "and", "a", "to", "in", "on", "for"}):
            w = w.replace(core, core[:1].upper() + core[1:].lower())
        out.append(w)
    return " ".join(out)


def game_title(name: str) -> str:
    s = name.replace("’", "'").replace("丨", " | ")
    s = re.sub(r"(?i)^buy (.+?) online in tunisia.*$", r"\1", s)   # a store page whose title is its SEO line
    s = re.sub(r"EA SPORTS ", "EA ", s, flags=re.I)
    s = re.sub(r"\bFC ?(\d\d)\b", r"FC \1", s, flags=re.I)
    s = re.sub(r"\bDelux\b", "Deluxe", s, flags=re.I)
    s = re.sub(r"\bBundel\b", "Bundle", s, flags=re.I)
    s = NOISE_RE.sub(" ", s)
    s = re.sub(r"\s[-|]\s|\s[-|]$|^[-|]\s", " ", s)
    s = re.sub(r"\(\s*\)|\[\s*\]", " ", s)
    s = tidy(re.sub(r"\s{2,}", " ", s))
    s = re.sub(r"\s*-\s*$", "", s)
    s = re.sub(r"\(\s*([^()]*?)\s*\)", r"(\1)", s)
    s = re.sub(r"^(.*?) \((.*edition)\)$", r"\1 \2", s, flags=re.I)
    s = re.sub(r"(?<=[\d\w]) edition$", "", s, flags=re.I) if not re.search(r"(deluxe|ultimate|gold|premium|complete|definitive|phantom|toty|elite|kobe bryant|scholarship|director's cut|java & bedrock|game of the year|enhanced) edition$", s, re.I) else s
    return nice_case(s) or name


def slug(s: str) -> str:
    s = s.lower().replace("'", "")
    s = re.sub(r"\bthe\b|\bedition\b", " ", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def launcher(name: str) -> str:
    n = name.lower()
    for word, label in (("ea app", "EA App"), ("origin", "EA App"), ("ea key", "EA App"), ("ubisoft", "Ubisoft Connect"),
                        ("uplay", "Ubisoft Connect"), ("rockstar", "Rockstar"), ("windows store", "Microsoft Store"),
                        ("xbox live", "Xbox"), ("epic", "Epic Games"), ("playstation", "PlayStation"), ("steam", "Steam")):
        if word in n:
            return label
    return "Steam"


# ── gift cards: "Steam 20 USD (TR)" ─────────────────────────────────────────
CUR = r"USD|EUR|EURO|TRY|TL|CAD|SAR|CNY|UAH|GBP|INR|\$|€"


def card_short(sub: str, name: str, region: str) -> str:
    brand = SUB_NAMES.get(sub, sub.title())
    m = re.search(r"(\d[\d,.]*)\s*(USD|EUR|EURO|TRY|TL|CAD|SAR|CNY|UAH|GBP|INR)\b|(\$|€)\s*(\d[\d,.]*)|(\d[\d,.]*)\s*(\$|€)", name, re.I)
    if m:
        amount = m.group(1) or m.group(4) or m.group(5)
        cur = (m.group(2) or m.group(3) or m.group(6)).upper()
        cur = {"$": "USD", "€": "EUR", "EURO": "EUR", "TL": "TRY"}.get(cur, cur)
        tail = f" ({region})" if region in {"FR", "US", "TR", "CA", "SA", "UA", "CN"} and sub in {"steam", "playstation", "itunes", "xbox"} else ""
        label = {"xbox": "Xbox", "playstation": "PlayStation", "itunes": "Apple iTunes", "steam": "Steam Wallet"}.get(sub, brand)
        if sub == "xbox" and "game pass" in name.lower():
            label = "Xbox Game Pass"
        return f"{label} {amount} {cur}{tail}"
    s = re.sub(r"\s+[-|]\s*|\s*\|\s*", " · ", tidy(name))
    s = re.sub(r"(?<=\d)(V-Bucks)", r" \1", s)
    s = re.sub(r"(?i)\((pc/playstation/xbox|all platforms?)\)|\b(gift card|key|global|code)\b", "", s)
    s = re.sub(rf"(?i)(?<=.)\b{re.escape(brand)}\b", "", s)
    s = tidy(re.sub(r"\s{2,}", " ", s)).replace("· ·", "·").strip(" ·")
    if not s.lower().startswith(brand.lower().split()[0].lower()):
        s = f"{brand} · {s}"
    return nice_case(s)


def plain_short(name: str) -> str:
    s = re.sub(r"(?i)^buy\s+|\s+in tunisia.*$|\s*[|·-]\s*tech garage.*$", "", tidy(name))
    s = re.sub(r"(?i)\s*-\s*[\w .]*\bkey\b\s*-\s*global|\(pc\)|\bretail\b|\bsteam cd key\b|\bkey\b\s*global|\bglobal\b|\bkey\b", " ", s)
    s = re.sub(r"\s+-\s+|\s*\|\s*", " · ", s)
    s = re.sub(r"\(\s*\)", "", s)
    return nice_case(tidy(re.sub(r"\s{2,}", " ", s)).strip(" ·-"))


HW_UPPER = {"MSI", "ASUS", "AMD", "NVIDIA", "RGB", "ARGB", "ATX", "MATX", "ITX", "SSD", "HDD", "NVME", "DDR4", "DDR5", "GB", "TB", "PSU", "RTX",
            "GTX", "RX", "USB", "HDMI", "ROG", "TUF", "MPG", "MAG", "MEG", "PCIE", "WIFI", "LED", "IPS", "VA", "FHD", "QHD", "UHD", "HZ", "AIO",
            "TKL", "HP", "LG", "AOC", "BTF", "II", "III", "XPG", "WD", "PC", "GPU", "CPU", "OC", "SFX", "ID", "ARCTIC", "NZXT", "PS5", "PS4"}
HW_CASE = {"nvme": "NVMe", "wifi": "WiFi", "hz": "Hz", "pcie": "PCIe", "arctic": "Arctic", "gaming": "Gaming"}


def hw_short(name: str) -> str:
    """Hardware names as the brands write them: MSI MPG Gungnir 300R Airflow Black."""
    out = []
    for w in tidy(name).replace(" -", " ").split():
        core = w.strip("()-,")
        if not core:
            continue
        low = core.lower()
        if low in HW_CASE:
            nw = HW_CASE[low]
        elif core.upper() in HW_UPPER or any(ch.isdigit() for ch in core) and core.isalnum():
            nw = core.upper()
        else:
            nw = core[:1].upper() + core[1:].lower()
        out.append(w.replace(core, nw))
    return " ".join(out)


MOBILE_WORDS = r"mobile legends:? bang bang|mobile/steam|blood strike mobile|blood strike|fc mobile|efootball( 2027)?|free ?fire|call of duty mobile|clash of clans|roblox|genshin impact|whiteout survival|brawl stars|warzone|pubg mobile|wuthering waves|clash royale|honkai star rail|wild rift"


def mobile_short(sub: str, name: str) -> str:
    brand = SUB_NAMES.get(sub, sub)
    v = re.sub(r"(?i)^buy\s+|\s+in tunisia.*$|\s*[|·-]\s*tech garage.*$|\bpin\b|subscription|/steam|\btunisia\b", "", name)
    v = re.sub(rf"(?i)\b(?:{MOBILE_WORDS})\b", " ", v)
    v = re.sub(r"(?i)^\s*(mobile|android)\s*\|", "", v)
    v = plain_short(v).strip(" ·|-")
    return f"{brand} {nice_case(v)}".strip()


def topup_short(leaf: str, name: str) -> str:
    n = tidy(name)
    if "fc 27" in leaf.lower():
        m = re.search(r"(\d+K)", n, re.I)
        return f"FC 27 Coins {m.group(1).upper()} (PC)" if m else plain_short(n)
    if "gta" in leaf.lower():
        first = n.split("+")[0].strip()
        first = re.sub(r"(?i)\s*\(.*", "", first)
        return "GTA Online · " + nice_case(first.title().replace("Million", "million").replace("Billion", "billion"))
    return plain_short(n)


# ── images ───────────────────────────────────────────────────────────────────
def fetch(url: str) -> bytes:
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:   # flaky connection: back off and retry
            err = e
            time.sleep(2 + 3 * i)
    raise err


def image(img_url: str, big: bool = False) -> str | None:
    """A WebP copy of the store photo: 400 px, or 800 px for hardware (its page shows it large)."""
    m = re.search(r"/(\d+)-[a-z_]+/([^/]+)\.jpg$", img_url or "")
    if not m:
        return None
    name = f"{m.group(1)}-{m.group(2)}.webp"
    path = IMG_DIR / name
    if not path.exists():
        src = f"https://techgarage.tn/{m.group(1)}-{'large' if big else 'home'}_default/{m.group(2)}.jpg"
        im = Image.open(io.BytesIO(fetch(src))).convert("RGB")
        im.thumbnail((800, 800) if big else (400, 400), Image.LANCZOS)
        im.save(path, "WEBP", quality=72, method=6)
    return name


def main() -> int:
    crawl = json.loads(pathlib.Path(sys.argv[1]).read_text())
    src = DATA.read_text()
    SUB_NAMES.update(dict(re.findall(r"(\w+): '([^']+)'", src[src.index("export const SUB_NAMES"):src.index("};", src.index("export const SUB_NAMES"))])))
    existing = {}   # store product number -> (demo id, cat, sub, name)
    for pid, path, name, cat, sub in re.findall(
            r"id: '([^']+)', url: S \+ '[^']*?/(\d+)-[^']*',\s*name: '((?:[^'\\]|\\.)*)',.*?cat: '(\w+)', sub: '(\w+)'", src, re.S):
        existing[path] = (pid, cat, sub, name)

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    rows, seen = [], set()
    for c in crawl:
        for p in c["products"]:
            if p["pid"] in seen or not p.get("name") or not p.get("price"):
                continue
            where = place(c["crumbs"], p["name"])
            if not where:
                continue
            seen.add(p["pid"])
            if re.fullmatch(r"(?i)\s*account\s+\w+ edition\s*", p["name"]):
                # a store listing without a game name: its photo's file name has it
                m = re.search(r"/\d+-[a-z_]+/(?:copy-of-)?(.+?)-account-(\w+)-edition\.jpg$", p.get("img") or "")
                if not m:
                    continue
                p = {**p, "name": f"{m.group(1).replace('-', ' ').title()} {m.group(2).title()} Edition Account"}
            leaf = c["crumbs"][-1].lower().split()[-1]
            rows.append({**p, "cat": where[0], "sub": where[1], "leaf": leaf, "leafname": c["crumbs"][-1]})

    # photos, in parallel
    todo = [r for r in rows if r["pid"] not in existing]
    with cf.ThreadPoolExecutor(2) as ex:
        for r, name in zip(todo, ex.map(lambda r: _safe(image, r["img"], r["cat"] == "hardware"), todo)):
            r["file"] = name

    # games: group every version under one key
    games: dict[str, dict] = {}
    game_of_existing = {}
    for r in rows:
        if r["sub"] not in GAME_PLATFORM:
            continue
        title = game_title(r["name"])
        r["title"], r["game"] = title, slug(title)
        r["platform"] = GAME_PLATFORM[r["sub"]]
        if r["sub"] == "ps":
            r["kind"] = "key" if re.search(r"\bkey\b", r["name"], re.I) else "account"
        elif r["sub"] == "xboxgames":
            r["kind"] = "key"
        else:
            r["kind"] = "account" if r["sub"] == "accounts" else "key"
    # a game page offers one product per platform + key/account; a second one starts its own page
    taken: dict[tuple, str] = {}
    for r in sorted(rows, key=lambda r: r["pid"] not in existing):   # hand-written products keep the plain game key
        if "game" not in r:
            continue
        base, n = r["game"], 1
        while (r["game"], r["platform"], r["kind"]) in taken:
            n += 1
            r["game"] = f"{base}-{n}"
            r["dup"] = True
        taken[(r["game"], r["platform"], r["kind"])] = r["pid"]
        games.setdefault(r["game"], r)
        if r["pid"] in existing:
            game_of_existing[existing[r["pid"]][0]] = r["game"]

    out = []
    for r in rows:
        if r["pid"] in existing or not r.get("file"):
            continue
        cat, sub, name = r["cat"], r["sub"], r["name"]
        price = float(r["price"])
        e = {"id": None, "url": r["url"].replace("https://techgarage.tn/", ""), "name": name, "price": int(price) if price.is_integer() else price,
             "cat": cat, "sub": sub, "img": r["file"]}
        if "game" in r:
            short = games[r["game"]]["title"]
            if r.get("dup"):
                short = f"{short} ({launcher(name)})" if r["kind"] == "key" and r["platform"] == "pc" else short
            e["short"], e["game"], e["platform"] = short, r["game"], r["platform"]
            if r["platform"] == "pc" and r["kind"] == "account":
                e["tags"] = ["Fresh Steam Account" if "steam" in name.lower() or "uplay" not in name.lower() and "windows" not in name.lower() else "Fresh Account", "Game"]
                e["specs"] = [launcher(name) if "uplay" in name.lower() or "windows" in name.lower() else "Steam", "Instant delivery"]
            elif r["platform"] == "pc":
                lab = launcher(name)
                e["tags"] = [lab, "Global Key" if "global" in name.lower() else "Key"]
                e["specs"] = [lab, "Instant delivery"]
            elif r["platform"] == "ps5":
                e["tags"] = ["PlayStation", "Account" if r["kind"] == "account" else "Key"]
                e["specs"] = ["PlayStation", "Instant delivery"]
            else:
                e["tags"] = ["Xbox", "Key"]
                e["specs"] = ["Xbox", "Instant delivery"]
            e["delivery"] = r["kind"]
        elif cat == "cards":
            region = REGION_OF_LEAF.get(r["leaf"]) or ("FR" if re.search(r"\(FR\)|FRANCE", name) else
                                                       "US" if re.search(r"\bUSA?\b|UNITED STATES", name) else "IN" if re.search(r"INDIA", name, re.I) else
                                                       "EU" if re.search(r"\bEUR(O)?\b|EUROPE", name, re.I) and sub in {"xbox", "nintendo"} else "GL")
            e["short"], e["region"] = card_short(sub, name, region), region
            brand = SUB_NAMES.get(sub, sub)
            sub_kind = "Subscription" if re.search(r"game pass|crew|month|nitro", name, re.I) else \
                       "In-game currency" if sub in {"marvel", "ufl", "fortnite", "lol", "valorant"} else "Gift Card"
            e["tags"] = [brand, sub_kind]
            e["specs"] = [brand, {"GL": "Global", "US": "United States", "FR": "France", "TR": "Turkey", "EU": "Europe", "CA": "Canada", "CN": "China", "UA": "Ukraine", "SA": "Saudi Arabia", "IN": "India"}[region], "Instant delivery"]
        elif cat == "mobile":
            brand = SUB_NAMES.get(sub, sub)
            e["short"] = mobile_short(sub, name)
            e["tags"] = [brand, "Pass" if re.search(r"pass|card|supply|plus|blessing|membership", name, re.I) else "Top-up"]
            e["specs"] = [brand, "Global", "Fast top-up"]
        elif sub == "topups":
            e["short"] = topup_short(r["leafname"], name)
            e["tags"] = [r["leafname"].title().replace("Gta", "GTA").replace("Fc", "FC"), "Boost" if "gta" in r["leafname"].lower() else "In-game currency"]
            e["specs"] = ["PC", "Fast top-up"]
        elif sub == "licenses":
            e["short"] = plain_short(name)
            kind = "Security" if re.search(r"antivirus|kaspersky|norton|eset|bitdefender|mcafee|avast|malware|vpn|security", name, re.I) else \
                   "Office" if re.search(r"office|microsoft 365|word|excel|project|visio", name, re.I) else \
                   "Subscription" if re.search(r"year|month|nitro|premium|plus|subscription|\b\d+\s*(an|mois)\b", name, re.I) else "Licence"
            e["tags"] = ["Software", kind]
            e["specs"] = ["Software", "Instant delivery"]
        elif cat == "hardware":
            e["short"] = hw_short(name)
            brand = e["short"].split(" ")[0]
            e["tags"] = [brand, HW_NAMES[sub]]
            e["specs"] = [brand, "Delivery in Tunisia"]
            e["delivery"] = "ship"
        else:   # mobile apps
            e["short"] = plain_short(name)
            e["tags"] = [e["short"].split(" · ")[0].split(" ")[0], "App credit"]
            e["specs"] = ["App credit", "Fast top-up"]
        e["id"] = f"{slug(e['short'])[:40].strip('-')}-{r['pid']}"
        out.append(e)

    lines = [
        "/* TechGarage demo — the rest of the live catalogue, generated by",
        "   scripts/import_catalogue.py from techgarage.tn. Don't edit by hand: re-run the",
        "   import. Hand-written products with stories and badges live in data.js. */",
        "",
        "const LIVE_IMG = 'assets/products/live/';",
        "",
        "/* Hand-written products in data.js that are versions of a game sold here too. */",
        "export const GAME_OF = " + json.dumps(game_of_existing, ensure_ascii=False, sort_keys=True) + ";",
        "",
        "export const LIVE = [",
    ]
    for e in out:
        img = e.pop("img")
        body = json.dumps(e, ensure_ascii=False, separators=(", ", ": "))[1:-1]
        body = re.sub(r'"(\w+)": ', r"\1: ", body)
        lines.append(f"  {{ {body}, img: LIVE_IMG + '{img}' }},")
    lines.append("];")
    OUT.write_text("\n".join(lines) + "\n")
    from collections import Counter
    print(f"{len(out)} products written, {len(game_of_existing)} hand-written games linked, {len(existing)} kept from data.js")
    print(Counter((e['cat'], e['sub']) for e in out))
    return 0


def _safe(fn, *args):
    try:
        return fn(*args)
    except Exception as exc:
        print("  image failed:", args[0], exc.__class__.__name__)
        return None


if __name__ == "__main__":
    sys.exit(main())
