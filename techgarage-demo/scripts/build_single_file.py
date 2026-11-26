"""Pack the demo into one self-contained HTML file.

Inlines the stylesheet, every script and every image (as data URIs), so the
result opens by double-clicking — no server, no install. Browsers won't load
ES modules from file:// paths, so the modules are merged into one inline
module in dependency order.

    python3 scripts/build_single_file.py            # -> dist/techgarage-demo.html
    python3 scripts/build_single_file.py out.html
"""

from __future__ import annotations

import base64
import collections
import shutil
import subprocess
import tempfile
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Links carry ?v=<date> so browsers fetch fresh files after an update; bump it in
# index.html and the module imports when shipping changes.
MODULES = ["guard.js", "catalog.js", "steam.js", "brand-art.js", "appstore.js", "store-record.js", "data.js", "i18n.js", "sync.js", "media-store.js", "core.js", "smooth.js", "motion.js", "glass-select.js", "views.js", "chat.js", "chat-admin.js", "sortable.js", "admin-extras.js", "admin.js", "signup.js", "protect.js", "app.js"]   # dependency order


def data_uri(path: pathlib.Path) -> str:
    mime = {"webp": "image/webp", "png": "image/png", "jpg": "image/jpeg"}[path.suffix[1:]]
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def main() -> None:
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "techgarage-demo.html"
    js = ROOT / "assets" / "js"

    html = (ROOT / "index.html").read_text()
    css = (ROOT / "assets/css/app.css").read_text()

    sources = []
    for name in MODULES:
        src = (js / name).read_text()
        src = re.sub(r"^import\s[\s\S]*?\sfrom\s+'[^']+';\n", "", src, flags=re.M)   # imports, incl. multi-line
        src = re.sub(r"^export\s+", "", src, flags=re.M)
        sources.append(f"/* ── {name} ── */\n{src}")
    script = "\n".join(sources)

    # every module now shares one scope, so a repeated top-level name would clash
    names = re.findall(r"^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)", script, flags=re.M)
    dupes = [n for n, c in collections.Counter(names).items() if c > 1]
    assert not dupes, f"top-level names defined in more than one module: {dupes}"
    # names declared in a list ("const a = 1, b = 2") slip past the check above: let a
    # JavaScript parser have the last word when one is installed
    if shutil.which("node"):
        with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False) as tmp:
            tmp.write(script)
        check = subprocess.run(["node", "--check", tmp.name], capture_output=True, text=True)
        pathlib.Path(tmp.name).unlink()
        assert check.returncode == 0, "the merged script does not parse:\n" + check.stderr.strip()[-600:]

    # product images: P + 'file.webp'  ->  'data:image/webp;base64,...'
    def product(m: re.Match) -> str:
        return "'" + data_uri(ROOT / "assets/products" / m.group(1)) + "'"
    script, n_products = re.subn(r"P \+ '([^']+)'", product, script)

    # photos the owner uploaded (built into store-record.js as file paths) go inline too
    script = re.sub(r"assets/products/owner/[\w.-]+\.(?:webp|png|jpe?g|gif)",
                    lambda m: data_uri(ROOT / m.group(0)), script)

    # menu icons of mobile games and gift-card brands (named in app.js by a template)
    icons = {f"{p.parent.name}/{p.stem}": data_uri(p) for p in sorted((ROOT / "assets/icons").glob("*/*.webp"))}
    for kind in ("games", "brands"):
        tpl = "`assets/icons/" + kind + "/${id}.webp`"
        assert script.count(tpl) == 1, tpl
        script = script.replace(tpl, "MENU_ICONS['" + kind + "/' + id]")
    script = "const MENU_ICONS = " + json.dumps(icons) + ";\n" + script
    # brand / hardware banners (named in data.js by a template)
    tpl = "`assets/products/brands/${key}.webp`"
    assert script.count(tpl) == 1, tpl
    art = {p.stem: data_uri(p) for p in sorted((ROOT / "assets/products/brands").glob("*.webp"))}
    script = "const BRAND_ART = " + json.dumps(art) + ";\n" + script.replace(tpl, "BRAND_ART[key]")
    # payment logos (D17, Ooredoo) named by their plain path in views.js
    for p in sorted((ROOT / "assets/icons/pay").glob("*.webp")):
        script = script.replace(f"assets/icons/pay/{p.name}", data_uri(p))

    # the imported catalogue (~800 photos) would make the file huge: point it at
    # the store's own photos instead (they need a connection to show)
    script = re.sub(r"^const LIVE_IMG = '[^']*';\n", "", script, flags=re.M)
    script, n_live = re.subn(r"LIVE_IMG \+ '(\d+)-([^']+)\.webp'",
                             r"'https://techgarage.tn/\1-home_default/\2.jpg'", script)

    # product videos: the 720p file goes inside (one copy serves every screen)
    def video(m: re.Match) -> str:
        if m.group(1).endswith("-hd.mp4"):
            return "''"
        return "'data:video/mp4;base64," + base64.b64encode((ROOT / "assets/videos" / m.group(1)).read_bytes()).decode() + "'"
    script, n_videos = re.subn(r"'assets/videos/([\w.-]+\.mp4)'", video, script)

    # avatars: avatarSrc() builds `assets/avatars/${name}.png`; look them up instead
    avatars = {p.stem: data_uri(p) for p in sorted((ROOT / "assets/avatars").glob("*.png"))}
    lookup = "const AVATAR_URI = {" + ",".join(f"{k}:'{v}'" for k, v in avatars.items()) + "};\n"
    script, n_av = re.subn(r"assets/avatars/\$\{(\w+)\}\.png", r"${AVATAR_URI[\1]}", script)
    assert n_av >= 1, "avatar path template not found"
    script = lookup + script

    # the site's own fonts go inline as data (the page's policy allows data: fonts)
    # (only Inter's Latin set and the Arabic face: the rest would add weight for rare characters)
    css = re.sub(r"/\* [^*]+ \*/\n@font-face \{[^}]*url\(\.\./fonts/(?!inter-latin-[0-9a-f]+\.woff2|ibm-plex-sans-arabic-arabic-)[^)]*\)[^}]*\}\n?", "", css)
    css = re.sub(r"url\(\.\./fonts/([\w.-]+\.woff2)\)", lambda m: "url(data:font/woff2;base64," + base64.b64encode((ROOT / 'assets/fonts' / m.group(1)).read_bytes()).decode() + ")", css)
    html = re.sub(r'<link rel="stylesheet" href="assets/css/app.css(?:\?v=\w+)?">', lambda _: f"<style>\n{css}\n</style>", html)
    html = re.sub(r'<script type="module" src="assets/js/app.js(?:\?v=\w+)?"></script>',
                  lambda _: f'<script type="module">\n{script}\n</script>', html)

    # libraries (Lenis, GSAP) become inline scripts too
    inline = [f"\n{script}\n"]
    def vendor(m: re.Match) -> str:
        code = "\n" + (ROOT / "assets/vendor" / m.group(1)).read_text() + "\n"
        assert "</script" not in code.lower(), m.group(1)
        inline.append(code)
        return f"<script>{code}</script>"
    # (the page itself loads them from smooth.js on computers only; offline they go inline)
    libs = "".join(vendor(re.match(r"(.*)", name)) for name in ["lenis.min.js", "gsap.min.js", "ScrollTrigger.min.js"])
    n_vendor = 3
    html = html.replace('<script type="module">', libs + '\n<script type="module">', 1)

    # the page's security policy allows exactly these inline scripts, by their hashes
    hashes = " ".join("'sha256-" + base64.b64encode(hashlib.sha256(code.encode()).digest()).decode() + "'" for code in inline)
    html, n_csp = re.subn(r"script-src 'self'", f"script-src {hashes}", html)
    assert n_csp == 1, "Content-Security-Policy meta tag not found"

    # the share picture, install icon and manifest are files next to the hosted site, not in this one file
    html = re.sub(r'<meta property="og:image"[^>]*>\n?|<link rel="(?:manifest|apple-touch-icon)"[^>]*>\n?', '', html)
    html = re.sub(r'<!-- the first banner picture[^>]*-->\n<link rel="preload" as="image" href="assets/[^"]+" fetchpriority="high">\n?', '', html)

    leftovers = re.findall(r"(?<![/\w])assets/(?:products|avatars|css|js|vendor|videos|icons|fonts)/[\w.\-]+", html)
    assert not leftovers, f"unresolved asset references: {leftovers[:5]}"

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print(f"{out}  {out.stat().st_size / 1e6:.1f} MB  "
          f"({len(MODULES)} modules, {n_products} product images, {len(avatars)} avatars inlined, {n_live} linked to techgarage.tn, {n_vendor} libraries)")


if __name__ == "__main__":
    main()
