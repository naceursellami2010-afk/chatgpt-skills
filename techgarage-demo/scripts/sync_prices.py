"""Sync the demo's prices with the live techgarage.tn store.

Every product in assets/js/data.js records the page it came from (`url`).
This fetches each page, reads the price the store is charging right now and
rewrites `price:` in data.js wherever it differs. Standard library only.

    python3 scripts/sync_prices.py           # update data.js
    python3 scripts/sync_prices.py --check   # report differences, change nothing
"""

from __future__ import annotations

import html
import pathlib
import re
import sys
import urllib.request

DATA = pathlib.Path(__file__).resolve().parent.parent / "assets" / "js" / "data.js"
BASE = "https://techgarage.tn/"

# PrestaShop exposes the selling price in several places; take the first hit.
PRICE_PATTERNS = [
    r'class="current-price-value"[^>]*content="([\d.]+)"',
    r'itemprop="price"[^>]*content="([\d.]+)"',
    r'"price":\s*"?([\d.]+)',
]
REGULAR = r'class="regular-price"[^>]*>\s*([^<]+?)\s*<'


def live_price(url: str) -> tuple[float | None, str | None]:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (techgarage-demo price sync)"})
    with urllib.request.urlopen(req, timeout=40) as resp:
        page = resp.read().decode("utf-8", "ignore")
    price = None
    for pattern in PRICE_PATTERNS:
        m = re.search(pattern, page)
        if m:
            price = float(m.group(1))
            break
    regular = re.search(REGULAR, page)
    return price, (html.unescape(regular.group(1)) if regular else None)


def main() -> int:
    check_only = "--check" in sys.argv
    src = DATA.read_text()
    # one product object per block: grab its id, url path and current price
    blocks = re.findall(r"id: '([^']+)', url: S \+ '([^']+)',.*?price: (\d+(?:\.\d+)?)", src, re.S)
    if not blocks:
        print("no products found in data.js")
        return 1

    changed = 0
    for pid, path, ours in blocks:
        try:
            theirs, regular = live_price(BASE + path)
        except Exception as exc:  # network trouble: report and keep going
            print(f"  ??  {pid:16} could not fetch ({exc.__class__.__name__})")
            continue
        if theirs is None:
            print(f"  ??  {pid:16} no price found on the page")
            continue
        sale = f"  (on sale, was {regular})" if regular else ""
        if float(ours) == theirs:
            print(f"  ok  {pid:16} {theirs:g} DT{sale}")
            continue
        changed += 1
        print(f"  !!  {pid:16} {float(ours):g} DT -> {theirs:g} DT{sale}")
        if not check_only:
            new = f"{theirs:g}"
            src = re.sub(rf"(id: '{re.escape(pid)}',.*?price: )\d+(?:\.\d+)?", rf"\g<1>{new}", src, count=1, flags=re.S)

    if changed and not check_only:
        DATA.write_text(src)
    verb = "would change" if check_only else "updated"
    print(f"\n{len(blocks)} products checked, {changed} {verb}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
