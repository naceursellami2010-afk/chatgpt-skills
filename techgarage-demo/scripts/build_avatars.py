"""Generate the demo's account avatars with gravify.

Resolves Gravatar URLs for a set of *demo* identities (no real customer data),
downloads them once and writes them into assets/avatars/ so the page has no
runtime dependency on gravatar.com.

    pip install -r scripts/requirements.txt
    python3 scripts/build_avatars.py
"""

from __future__ import annotations

import json
import pathlib
import urllib.request

from gravify import AvatarGenerator
from gravify.avatars.options import DefaultImage

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "avatars"

# Demo identities only — invented addresses on a reserved-looking domain.
PEOPLE = [
    ("sami", "Sami Ben Ali", "sami.benali@techgarage.demo", 256),
    ("yassine", "Yassine Trabelsi", "yassine.t@techgarage.demo", 96),
    ("mariem", "Mariem Gharbi", "mariem.gharbi@techgarage.demo", 96),
    ("oussama", "Oussama Khelifi", "oussama.k@techgarage.demo", 96),
    ("nour", "Nour Jlassi", "nour.jlassi@techgarage.demo", 96),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}

    for slug, name, email, size in PEOPLE:
        generator = AvatarGenerator(
            size=size,
            default_image=DefaultImage.INITIALS,
            name=name,
            force_default=True,
        )
        url = generator.generate_url(email)
        dest = OUT / f"{slug}.png"

        request = urllib.request.Request(url, headers={"User-Agent": "techgarage-demo/1.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            dest.write_bytes(response.read())

        manifest[slug] = {"name": name, "file": f"assets/avatars/{slug}.png", "size": size}
        print(f"{slug:9} {size:>4}px  {dest.stat().st_size:>7,} bytes")

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
