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
| Shop | `#/shop`, `#/shop/<category>`, `#/shop/<category>/<sub>` | Every product or a category; gift cards and mobile games show one tile per brand ("From 40 DT · 3 options"); a nested sidebar, price filters, sorting |
| Search | `#/shop?q=…` | Ranked results; the top-bar search suggests as you type |
| Product | `#/product/<id>` | Artwork, price, quantity, buy / add / save; for a brand, region and value (or amount) chips that switch card; how delivery works, details, related products or other brands, link to the live store |
| Wishlist | `#/wishlist` | Saved products, add all to basket |
| Checkout | `#/checkout` | Contact filled in from the account (edit, save back), one block per game for top-ups, ClicToPay / D17 / transfer, validation, order summary |
| Order | `#/order/<id>` | Confirmation, progress timeline, delivered codes and logins (reveal / copy) |
| Orders | `#/orders` | Order history with status |
| Profile | `#/profile` | Account summary, stats, every key and account you've been delivered |
| Settings | `#/settings/<section>` | Profile & avatar, password & two-step, notifications, accent colour & motion, data export & reset |
| Support | `#/support` | Phone, email, address and opening hours, FAQ, contact form (opens your email app) |
| Notifications | `#/notifications` | All notifications, mark as read |
| Store admin | `#/admin`, `#/admin/products`, `#/admin/sections`, `#/admin/product/<id>` | Categories and subcategories, products, and what every page section shows (see below) |

The shell around them: an icon rail (store, wishlist, basket, profile, settings), the
category tabs, search, notifications, the account menu and a slide-out basket.

Everything you do — basket, wishlist, orders, profile, settings, history — is saved in
your browser. Checkout takes no payment: a placed order "delivers" a few seconds later
with demo codes, all of which start with `DEMO` and are not real.

### Brands and variants

Gift cards and mobile games are browsed one brand at a time. The Gift Cards and Mobile
pages, the subcategory menu and the sidebar all lead to a brand's page, where **Region**
(France, United States, Turkey, Europe, India, Global) and **Card value** — or **Amount**
for games — switch between that brand's products. Region and value are read from the
store's own product titles (`regionOf` / `valueOf` in `core.js`), so a new product joins
its brand without extra data. Switching replaces the page in history rather than piling
up Back steps. Search still lists every individual card.

### Game top-ups

Each game is topped up the way its publisher requires (`TOPUP_METHOD` in `data.js`):

| Asks for | Games |
| --- | --- |
| Email, password, UID, Android or iOS | eFootball, Call of Duty Mobile |
| Email and password | Clash of Clans, LoL: Wild Rift, Brawl Stars, Genshin Impact, 8 Ball Pool, FC Mobile, Wuthering Waves, Clash Royale, Roblox, Honkai: Star Rail |
| Player ID | every other game |

Checkout shows one block per game in the basket, with validation and a show-password
button. **Passwords are never stored**: they are dropped before the order is saved. The
game email, UID, phone type and player ID are remembered and filled in next time.

### Payment

techgarage.tn shows **ClicToPay** as its payment gateway (bank cards: Visa, Mastercard,
CIB and e-Dinar), so it is the default. Choosing it shows a short "opening the secure
ClicToPay page" step that stands in for the bank's page — no card details are ever asked
for here. D17 and bank transfer are also offered; confirm with the store which it accepts
and edit `PAYMENT_METHODS` in `data.js`.

Each method adds its own fee (`PAYMENT_FEES` in `data.js`): **ClicToPay +2.5%** bank
fees, **D17 +1%**, **bank transfer +5 DT**. The fee shows on each option and as its own
line in the order summary; the line, the total and the Place order button update the
moment the method changes, and the order page keeps the same breakdown. Fees are kept to
millimes, so amounts with a fee read like `399.75 DT`.

## Store admin

Open it from the account menu → **Store admin** (`#/admin`). A sidebar (Feather icons)
leads to **Overview**, Categories, Products and Page sections, with export / import / reset
underneath. **Overview** shows four stat cards — revenue and orders over the last 30 days
with the change against the 30 days before, products on sale, categories — a sales-per-day
line chart (hover or arrow keys for each day, "Show as a table" for the numbers) and the
best sellers, all from the store's own orders. Every change applies to the
whole store at once — tabs, the subcategory menu, shop pages, product pages, search and
the home page redraw in place.

- **Categories** — add a category by picking it from a menu (the store's own categories and
  popular digital ones, with names ready in English, French and Arabic; "Other…" to type
  one); it becomes a tab straight away. Rename (folded under a button), reorder, delete.
  Subcategories are picked the same way — every sub-brand on techgarage.tn (Steam Turkey,
  PlayStation USA, iTunes France, EA FC 27 Points, 8 Ball Pool…) plus popular apps and
  streaming — then renamed, reordered or deleted. "Browse by
  brand" turns a category into one tile per brand with the region / value picker. A
  category or subcategory that still has products can't be deleted.
- **Products** — search and filter the catalogue; add a product (photo upload, resized to
  640 px WebP, or an image link; name, full title, price, category, subcategory, region,
  value label, delivery type, what a top-up asks for, tags, badge, description, store link);
  edit any product, shipped ones included; delete. Deleted products leave every list and
  their page, but past orders still show them.
- **Keys & stock** — paste each product's keys or codes (one per line, or load a .txt /
  .csv; account products as `email:password`); duplicates are skipped. When a payment
  succeeds, every item takes its keys from stock, oldest first, and the order page shows
  the real code (accounts show login and password separately). A product with keys is
  tracked: with 3 or fewer left it says "Only N left", at 0 it's "Out of stock" and can't be
  bought, and the basket never holds more than what's left. If two shoppers race for the
  last key, the order waits and is delivered automatically the moment you add keys. The
  page shows keys in stock, sold, running low and out of stock; the Overview warns when
  something has run out. Keys are masked with a Reveal button; sold keys link to their
  order. Products without keys keep the demo codes. Export / Import include the stock.
  (Demo: the stock lives in the browser. A real store keeps keys on its server and hands
  them out from the payment provider's confirmation.)
- **Page sections** — for the home page: which products the hero carousel, New Drops and
  the product shelf show and in what order, each section's title in three languages, and
  whether it shows at all (Recently Viewed too). For product pages: switch How it works,
  Details and Related products on or off.
- **Export / Import / Reset** — download the edits as JSON, load them in another browser,
  or go back to the catalogue as shipped.

This is a front-end demo with no server, so the edits are saved in the browser that made
them (`localStorage`, key `tg.admin`) and laid over the shipped catalogue by `applyAdmin()`
in `data.js`. A real store would save the same record to its backend and put the admin
behind a login.

## Motion

Modelled on the transitions of the reference build (techgarage-demo.vercel.app — its GSAP
timings: expo-out curves, ~1 s builds, 50–80 ms staggers), done here with CSS, the View
Transitions API and an IntersectionObserver, no library (`assets/js/motion.js`):

- **Page to page** — the old page cross-fades into the new one, then the new page builds
  itself up: big titles rise word by word out of a mask, the rest lifts in from a soft blur,
  one piece after another.
- **Category header** — every category and subcategory opens on a glass header with its
  title, a line about it, category chips and three fanned covers. Moving between
  categories, the covers shuffle like a deck; they lean with the pointer and spread on hover.
- **Card → product** — a card's picture grows into the product page's picture, and shrinks
  back into its card on Back. Switching region or value morphs the picture in place.
- **Sorting and filtering** — cards slide to their new places.
- **Home carousel** — the next slide wipes across from the side it comes from, its art
  settles from a zoom and its text rises in.
- **Scrolling** — cards and sections further down fade up as they arrive.
- **Cards** lean toward the pointer with a sheen that follows it; buttons give a little
  when pressed.

Settings → Appearance → Reduce motion, or the device's own setting, turns all of it off.
If a device can't start a page transition within 300 ms, the page simply appears — the
animation never makes anyone wait.

## UI/UX checklist (UI/UX Pro Max)

The site is checked against the UI/UX Pro Max rules, highest priority first:

- **Accessibility** — one page title per page and no skipped heading levels; every control
  has a name and a visible keyboard focus ring; a "Skip to content" link; text contrast
  ≥ 4.5 : 1 and nothing under 12 px (all three languages); reduced motion respected.
- **Touch** — every control has at least a 44 px tap area; no double-tap delay; form fields
  are 16 px on phones so iPhone Safari doesn't zoom in.
- **Style** — SVG icons only (no emoji), one icon family, prices in tabular figures.
- **Layout** — no sideways scrolling at 390 / 820 / 1366 / 1920 px; page ends clear the
  floating phone dock.
- **Motion** — page builds in ~0.6–0.75 s with 40–50 ms staggers, exits faster than
  entrances, interruptible, and skipped if a device is slow.
- **Forms** — labels on every field, errors under the field, checked when you leave a
  field and cleared as soon as it's fixed, focus moves to the first problem, Place order
  shows a spinner and can't be pressed twice.
- **Navigation** — every page has its own address; Back returns to the same scroll
  position; the current tab is highlighted; breadcrumbs on deep pages.

## Languages

English, French and Arabic, chosen from the globe button in the top bar or in
Settings → Appearance, and remembered. Every phrase, product description, the FAQ,
notifications, dates and prices are translated (`assets/js/i18n.js`, 466 phrases per
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
assets/js/motion.js     page transitions, word-by-word titles, scroll reveals, card tilt
assets/js/glass-select.js  frosted-glass dropdowns over every <select> (search, keyboard, big rows)
assets/js/views.js      every page
assets/js/admin.js      store admin: categories, products, page sections
assets/js/app.js        shell, search, basket, router
assets/products/        product imagery
assets/avatars/         gravify-generated avatars
scripts/                avatar generation
```
