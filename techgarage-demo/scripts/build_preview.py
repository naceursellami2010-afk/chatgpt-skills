"""Build a private design preview of the demo, to look at on a phone.

The preview is the single-file build with three differences, so it can never be
taken for the real shop:
  * it is unbranded ("Store preview"), without the store's contact details;
  * a bar on every page says it is a design preview, checkout is switched off
    and the game-account password fields are removed;
  * every photo is embedded (smaller), because the artifact host only shows
    pictures that are inside the page.

    python3 scripts/build_preview.py            # -> dist/store-preview.html
"""

from __future__ import annotations

import base64
import importlib.util
import io
import pathlib
import re
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "store-preview.html"


def small(path: pathlib.Path, px: int, q: int) -> str:
    im = Image.open(path).convert("RGB")
    im.thumbnail((px, px), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=q, method=4)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def main() -> None:
    spec = importlib.util.spec_from_file_location("single", ROOT / "scripts/build_single_file.py")
    single = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(single)
    full = single.data_uri

    def preview_uri(path: pathlib.Path) -> str:
        if path.parent.name == "products":            # the 103 featured products: shown large
            return small(path, 360, 60)
        if path.parent.name == "brands":              # gift-card / hardware banners: half size
            return small(path, 640, 42)
        return full(path)                              # banners, avatars: as they are

    single.data_uri = preview_uri
    sys.argv = [sys.argv[0], str(OUT)]
    single.main()
    html = OUT.read_text()

    # the imported catalogue's photos, linked to the store in the normal build, embedded small
    live = ROOT / "assets/products/live"
    def embed(m: re.Match) -> str:
        f = live / f"{m.group(1)}-{m.group(2)}.webp"
        return "'" + (small(f, 200, 50) if f.exists() else "") + "'"
    html, n_live = re.subn(r"'https://techgarage\.tn/(\d+)-home_default/([^']+)\.jpg'", embed, html)

    # product videos: embedded too (the 720p file for every screen, to keep the page small)
    def embed_video(m: re.Match) -> str:
        if m.group(1).endswith('-hd.mp4'):
            return "''"   # no HD copy: every screen plays the one embedded 720p file
        return "'data:video/mp4;base64," + base64.b64encode((ROOT / 'assets/videos' / m.group(1)).read_bytes()).decode() + "'"
    html, n_vid = re.subn(r"'assets/videos/([\w.-]+\.mp4)'", embed_video, html)

    # unbranded, no real contact details
    html = html.replace("<title>TechGarage</title>", "<title>Store Preview</title>")
    for a, b in [("'brand': 'TechGarage'", "'brand': 'Store preview'"), ("'brand': 'تك غاراج'", "'brand': 'معاينة المتجر'"),
                 ("name: 'TechGarage'", "name: 'Store preview'"), ("phone: '+216 58 578 111'", "phone: '+216 00 000 000'"),
                 ("email: 'Commercial@techgarage.site'", "email: 'preview@example.com'"),
                 ("address: 'Rue Hssan Achoura, 5100 Mahdia, Tunisia'", "address: 'Preview address'")]:
        assert html.count(a) >= 1, a
        html = html.replace(a, b)

    # the artifact host applies its own security policy; the page's meta policy would
    # block the preview's small script below, so it is left out here
    html, n_csp = re.subn(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">\n?', "", html)
    assert n_csp == 1

    html = html.replace("TechGarage", "Store preview").replace("Tech Garage", "Store preview")   # everything else that names the store

    # the artifact viewer shows pages inside a frame: let the preview run there
    assert html.count("if (inFrame()) refuseFrame();") == 1
    html = html.replace("if (inFrame()) refuseFrame();", "/* preview: runs inside the viewer's frame */")

    # a design preview, not a shop: no password fields (the app's own preview mode adds
    # the bar and switches checkout off on any hosted copy, this one included)
    preview = """
<style>
.field:has(input[type="password"]), .pw-toggle { display: none !important; }
</style>
"""
    assert html.count("</body>") == 1
    html = html.replace("</body>", preview + "</body>")
    OUT.write_text(html)
    size = OUT.stat().st_size / 1e6
    print(f"{OUT}  {size:.1f} MB  ({n_live} catalogue photos, {n_vid} video links embedded)")
    assert size < 15.5, "too big for the artifact host (16 MB)"


if __name__ == "__main__":
    main()
