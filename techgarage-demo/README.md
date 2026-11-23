# TechGarage — website demo

A design demo for [techgarage.tn](https://techgarage.tn/), built to the layout of the
supplied reference mockup: a frosted-glass storefront floating over a slow grey/white
gradient. Digital goods only — PC games, gift cards, mobile top-ups and software.

![the demo](docs/preview.webp)

## Running

Static files, no build step and no dependencies:

```bash
cd techgarage-demo && python3 -m http.server 8000
```

Then open <http://localhost:8000>. It must be served over HTTP rather than opened as a
`file://` path, because the scripts are ES modules.

### One file you can double-click

```bash
python3 scripts/build_single_file.py   # -> dist/techgarage-demo.html (~3 MB)
```

Inlines the stylesheet, the scripts and every image, so the page opens straight from
disk with no server (~9 MB with every photo inside). Only the web font needs a connection; offline it falls back to the
system font, which on Apple devices is SF Pro anyway.

## What's real

Every product name, price and category comes from the live techgarage.tn catalogue —
103 digital products in the store's own categories and subcategories:

| Category | Subcategories |
| --- | --- |
| PC Games (19) | Fresh accounts · Game keys · Game top-ups · PlayStation games |
| Gift Cards (39) | Steam · PlayStation · Apple iTunes · Xbox · VALORANT · League of Legends · Fortnite · Razer Gold · Nintendo · Battle.net · Marvel Rivals · Epic Games · Binance · RedotPay · Bybit · UFL |
| Mobile (37) | eFootball · PUBG Mobile · Free Fire · Call of Duty Mobile · Clash of Clans · Clash Royale · Brawl Stars · Roblox · Genshin Impact · LoL: Wild Rift · FC Mobile · Mobile Legends · Honkai: Star Rail · Wuthering Waves · Whiteout Survival · Blood Strike · Warzone Mobile |
| Software (8) | Software licences · App credits |

Two or three products per subcategory, spread across the price range — enough for every
subcategory to be real, without importing the store's whole stock. Hardware is
deliberately left out. Prices are whole dinars, shown as `180 DT`, and every product records its page on the
live store (`url` in `data.js`). To re-check them against the site at any time:

```bash
python3 scripts/sync_prices.py --check   # report differences
python3 scripts/sync_prices.py           # update data.js to match the store
```

Quick view links each product back to its techgarage.tn page. The contact
details and the brand accent (`#38a699`, sampled from the site's CSS) are theirs too.

The shopper, the notifications and the "recently viewed" history are invented, as a demo
needs an account to show.

## Pages

A single-page app with a hash router — every page has its own address, so links,
refresh and the browser's Back button all work.

| Page | Address | What's on it |
| --- | --- | --- |
| Home | `#/` | Hero carousel, New Drops, Recently Viewed (your real history), a full-width shelf |
| Shop | `#/shop`, `#/shop/<category>`, `#/shop/<category>/<sub>` | Every product, a category or a subcategory; subcategory chips with counts, a nested sidebar, price filters, sorting |
| Search | `#/shop?q=…` | Ranked results; the top-bar search suggests as you type |
| Product | `#/product/<id>` | Artwork, price, quantity, buy / add / save, how delivery works, details, related products, link to the live store |
| Wishlist | `#/wishlist` | Saved products, add all to basket |
| Checkout | `#/checkout` | Contact details, player ID for top-ups, payment choice, validation, order summary |
| Order | `#/order/<id>` | Confirmation, progress timeline, delivered codes and logins (reveal / copy) |
| Orders | `#/orders` | Order history with status |
| Profile | `#/profile` | Account summary, stats, every key and account you've been delivered |
| Settings | `#/settings/<section>` | Profile & avatar, password & two-step, notifications, accent colour & motion, data export & reset |
| Support | `#/support` | Phone, email, address and opening hours, FAQ, contact form (opens your email app) |
| Notifications | `#/notifications` | All notifications, mark as read |

The shell around them: an icon rail (store, wishlist, basket, profile, settings), the
category tabs, search, notifications, the account menu and a slide-out basket.

Everything you do — basket, wishlist, orders, profile, settings, history — is saved in
your browser. Checkout takes no payment: a placed order "delivers" a few seconds later
with demo codes, all of which start with `DEMO` and are not real. The payment options
are placeholders to swap for what the store actually accepts.

## Languages

English, French and Arabic, chosen from the globe button in the top bar or in
Settings → Appearance, and remembered. Every phrase, product description, the FAQ,
notifications, dates and prices are translated (`assets/js/i18n.js`, 339 phrases per
language). Counts use each language's plural rules, so Arabic gets its one / two / few /
many forms. Prices read `180 DT` in English and French and `180 د.ت` in Arabic.

Arabic turns the whole layout right-to-left: the icon rail, sidebars and hero text move
to the right, the basket slides in from the left, arrows and swipe directions mirror.
Layout CSS uses logical properties (inline-start / end) so it flips on its own, with a
short list of overrides for gradients and animations. Arabic text uses SF Arabic on Apple
devices and IBM Plex Sans Arabic elsewhere, with no letter-spacing (it would break the
connected script) and a little more line height. Product names stay in their original form,
as stores in the region do.

## Smart photo fit

Every product photo slot reads the real size and transparency of the picture it is given
and picks how to show it:

| Picture vs. slot | What happens |
| --- | --- |
| Similar shape | Fills the slot, almost no crop |
| Very different shape | Shown whole, on a blurred copy of itself |
| Transparent cut-out | Floats with a shadow on a lit stage |
| Much smaller than the slot | Shown at its own size, never blown up |

The product page frame takes the picture's own shape, and the home hero fills with any
landscape banner while square or portrait art becomes a feathered side poster. Slots
re-check when their size changes. So new photos can be any size: they always fit.

## Design notes

Apple's own typeface: the font stack asks for the system font, so every Mac, iPhone and
iPad renders SF Pro (Apple's licence doesn't allow hosting SF Pro on a non-Apple site).
Other devices get Inter, the closest open design, with optical sizing. Type follows
Apple's habits, on fixed scales: type 12 · 13 · 14 · 15 · 17 · 20 · 22 · 28 · 34 px;
line height 1.1 / 1.25 / 1.45 / 1.55; tracking −0.028em (display), −0.02em (headings),
−0.011em (text); radii 8 · 10 · 12 · 14 · 24 · pill; even-pixel spacing; named colour
tokens. An audit of every visible text element on eight pages in all three languages
found all of them at WCAG AA contrast (4.5:1, 3:1 for large text) and none under 12px. The background is a set of
slowly drifting radial light pools over a grey gradient, with an SVG grain overlay so it
never reads as flat vector mush; everything animated moves on `transform` only.

The store's artwork is square but the hero is roughly 3:1, so cover-cropping it would
throw the poster away — instead a blurred copy builds the backdrop and the sharp artwork
sits on top, its left edge feathered into the stage with a mask. Search ranks hits on the
displayed name above the long store title, so "steam" finds the Steam Wallet cards before
every Fresh Steam Account.

## Images

`assets/products/` holds 103 images sourced from techgarage.tn, with the white matte
some of them ship with trimmed off, capped at 640px and converted to WebP (6.3 MB).

`assets/avatars/` holds five avatars generated by `scripts/build_avatars.py`, which uses
[gravify](https://pypi.org/project/gravify/) to resolve Gravatar URLs for demo
identities and bakes the results in, so the page makes no third-party requests at
runtime. To regenerate:

```bash
pip install -r scripts/requirements.txt
python3 scripts/build_avatars.py
```

## Files

```
index.html              the app shell
assets/css/app.css      all styling
assets/js/data.js       catalogue, categories and subcategories, account, orders, store details
assets/js/i18n.js       English, French and Arabic: phrases, plurals, prices, dates, product copy, FAQ
assets/js/core.js       shared state, store actions, smart photo fit, product card
assets/js/views.js      every page
assets/js/app.js        shell, search, basket, router
assets/products/        product imagery
assets/avatars/         gravify-generated avatars
scripts/                avatar generation
```
