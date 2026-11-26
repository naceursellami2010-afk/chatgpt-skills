"""Crawl the live techgarage.tn catalogue into a JSON file for import_catalogue.py.

Visits every category linked from the home page (following pagination), notes
its breadcrumb and the products listed, then opens each game, gift card,
top-up and software product page for its full name, price and photo.
Standard library only.

    python3 scripts/crawl_store.py crawl.json
"""

from __future__ import annotations

import concurrent.futures as cf
import html
import json
import pathlib
import re
import sys
import time
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (techgarage-demo catalogue sync)"}
SKIP_ROOTS: set[str] = set()   # every section, hardware included (sold as physical products)


def get(url: str) -> str:
    time.sleep(0.8)   # one request at a time, gently: the store's server is small
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read().decode("utf-8", "ignore")
        except Exception as e:   # flaky connection: back off and retry
            err = e
            time.sleep(10 + 20 * i)   # the server is struggling: give it room
    raise err


def text(s: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def crawl_category(cat: str) -> dict:
    res = {"url": cat, "crumbs": [], "products": []}
    page = 1
    while True:
        s = get(f"{cat}?page={page}" if page > 1 else cat)
        if page == 1:
            bc = re.search(r'"breadcrumb":(\{"links":\[.*?\]),"count"', s)
            if bc:
                res["crumbs"] = [html.unescape(link["title"]) for link in json.loads(bc.group(1) + "}")["links"]]
        for art in re.findall(r"<article[^>]*js-product-miniature.*?</article>", s, re.S):
            img = re.search(r'data-full-size-image-url="([^"]+)"', art)
            title = re.search(r'product-title[^>]*>\s*<a[^>]*>([^<]*)</a>', art)
            price = re.search(r'class="price\s*"[^>]*>\s*TND\s*([\d.,]+)', art)
            res["products"].append({
                "pid": re.search(r'data-id-product="(\d+)"', art).group(1),
                "url": re.search(r'href="(https://techgarage\.tn/[^"]+\.html)"', art).group(1),
                "price": price.group(1).replace(",", "") if price else None,
                "img": img.group(1) if img else None,
                "listed": html.unescape(title.group(1)).strip() if title else None,
            })
        m = re.search(r"Showing (\d+)-(\d+) of (\d+)", s)
        if not m or int(m.group(2)) >= int(m.group(3)):
            return res
        page += 1


def meta(s: str, prop: str) -> str | None:
    m = re.search(r'<meta property="%s" content="([^"]*)"' % re.escape(prop), s)
    return html.unescape(m.group(1)) if m else None


def read_product(p: dict) -> None:
    try:
        s = get(p["url"])
    except Exception:
        return
    p["name"] = meta(s, "og:title")
    p["price"] = meta(s, "product:price:amount") or p["price"]
    p["img"] = p.get("img") or meta(s, "og:image")


def main() -> int:
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "crawl.json")
    cats = sorted(set(re.findall(r'href="(https://techgarage\.tn/\d+-[a-z0-9-]+)"', get("https://techgarage.tn/"))))
    with cf.ThreadPoolExecutor(1) as ex:
        crawl = list(ex.map(crawl_category, cats))
    todo = [p for c in crawl if len(c["crumbs"]) > 1 and c["crumbs"][1] not in SKIP_ROOTS for p in c["products"]]
    # the listing's title is enough for products the demo already has; new ones (or cut-off
    # titles) get their own page read, so the store's server sees as few requests as possible
    root = pathlib.Path(__file__).resolve().parent.parent
    cat_js = (root / "assets/js/catalog.js").read_text()
    known = {pid: json.loads('"' + name + '"') for pid, name in re.findall(r'url: "[^"]*?/(\d+)-[^"]*", name: "((?:[^"\\]|\\.)*)"', cat_js)}
    hand = set(re.findall(r"/(\d+)-[\w-]+\.html", (root / "assets/js/data.js").read_text()))
    for p in todo:
        if p["pid"] in known:
            p["name"] = known[p["pid"]]          # the name already imported: product ids stay the same
        elif p["pid"] in hand and p.get("listed"):
            p["name"] = p["listed"]
    for _ in range(3):   # a few pages time out on the first pass
        missing = [p for p in todo if not p.get("name")]
        if not missing:
            break
        with cf.ThreadPoolExecutor(1) as ex:
            list(ex.map(read_product, missing))
    out.write_text(json.dumps(crawl, ensure_ascii=False, indent=1))
    print(f"{len(cats)} categories, {len(todo)} products, {sum(1 for p in todo if p.get('name'))} read -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
