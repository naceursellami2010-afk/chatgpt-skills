# TechGarage — website demo

A design demo for [techgarage.tn](https://techgarage.tn/), built to the layout of the
supplied reference mockup: a floating browser frame over a moving grey/white gradient,
with a frosted-glass storefront inside.

Status: **in progress** — product data and imagery are in place, the UI is being built.

## Contents

- `assets/products/` — 28 product images sourced from techgarage.tn, background-keyed to
  transparent cutouts where the originals were white-background product shots, resized to
  max 820px and converted to WebP.

## Data

All product names, prices (TND) and categories in this demo come from the live
techgarage.tn catalogue, not from placeholder content.

Brand accent sampled from the site's own CSS: `#38a699` (teal), `#185b52` (deep teal).

## Running

Static files, no build step:

```bash
cd techgarage-demo && python3 -m http.server 8000
```
