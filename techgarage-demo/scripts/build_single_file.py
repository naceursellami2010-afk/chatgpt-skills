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
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Links carry ?v=<date> so browsers fetch fresh files after an update; bump it in
# index.html and the module imports when shipping changes.
MODULES = ["data.js", "i18n.js", "core.js", "views.js", "admin.js", "app.js"]   # dependency order


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

    # product images: P + 'file.webp'  ->  'data:image/webp;base64,...'
    def product(m: re.Match) -> str:
        return "'" + data_uri(ROOT / "assets/products" / m.group(1)) + "'"
    script, n_products = re.subn(r"P \+ '([^']+)'", product, script)

    # avatars: avatarSrc() builds `assets/avatars/${name}.png`; look them up instead
    avatars = {p.stem: data_uri(p) for p in sorted((ROOT / "assets/avatars").glob("*.png"))}
    lookup = "const AVATAR_URI = {" + ",".join(f"{k}:'{v}'" for k, v in avatars.items()) + "};\n"
    script, n_av = re.subn(r"assets/avatars/\$\{(\w+)\}\.png", r"${AVATAR_URI[\1]}", script)
    assert n_av >= 1, "avatar path template not found"
    script = lookup + script

    html = re.sub(r'<link rel="stylesheet" href="assets/css/app.css(?:\?v=\w+)?">', lambda _: f"<style>\n{css}\n</style>", html)
    html = re.sub(r'<script type="module" src="assets/js/app.js(?:\?v=\w+)?"></script>',
                  lambda _: f'<script type="module">\n{script}\n</script>', html)

    leftovers = re.findall(r"assets/(?:products|avatars|css|js)/[\w.\-]+", html)
    assert not leftovers, f"unresolved asset references: {leftovers[:5]}"

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print(f"{out}  {out.stat().st_size / 1e6:.1f} MB  "
          f"({len(MODULES)} modules, {n_products} product images, {len(avatars)} avatars inlined)")


if __name__ == "__main__":
    main()
