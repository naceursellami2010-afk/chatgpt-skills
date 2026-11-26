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
python3 scripts/build_single_file.py   # -> dist/techgarage-demo.html (~9 MB)
```

Inlines the stylesheet, the scripts and the 103 hand-picked product photos, so the page
opens straight from disk with no server. The ~780 imported products link to their photos
on techgarage.tn instead (inlining them would add ~25 MB), so those need a connection.
The web font falls back to the system font offline, which on Apple devices is SF Pro anyway.

### Phone preview

```bash
python3 scripts/build_preview.py   # -> dist/store-preview.html (~12 MB)
```

An unbranded design preview to look at away from the PC: every photo embedded at phone
size, a "Preview · not a real shop · checkout off" tag on every page, no password fields,
checkout switched off and no real contact details. It is published as a private page on
claude.ai, so only the owner's account can open it.

## What's real

Every product name, price and category comes from the live techgarage.tn catalogue —
the store's **whole** range of games, gift cards, mobile top-ups and software, 885 products
in its own categories and subcategories:

| Category | Products | Subcategories |
| --- | --- | --- |
| PC Games | 435 (293 game pages) | Fresh accounts · Game keys · Game top-ups · PlayStation games · Xbox games |
| Gift Cards | 154 (16 brands) | Steam · PlayStation · Apple iTunes · Xbox · VALORANT · League of Legends · Fortnite · Razer Gold · Nintendo · Battle.net · Marvel Rivals · Epic Games · Binance · RedotPay · Bybit · UFL |
| Mobile | 143 (17 games) | eFootball · PUBG Mobile · Free Fire · Call of Duty Mobile · Clash of Clans · Clash Royale · Brawl Stars · Roblox · Genshin Impact · LoL: Wild Rift · FC Mobile · Mobile Legends · Honkai: Star Rail · Wuthering Waves · Whiteout Survival · Blood Strike · Warzone Mobile |
| Software | 151 | Software licences · App credits |

Hardware is deliberately left out. Prices are in dinars, shown as `180 DT`, and every
product records its page on the live store.

The catalogue comes in two parts:

- `assets/js/data.js` — 103 hand-written products with their own descriptions, badges
  and translations (the home page, hero and demo orders use these).
- `assets/js/catalog.js` — the other 782 products, **generated** from the live store.
  Each game's PC / Xbox / PS5 keys and accounts share a `game` key so they open on one
  page; gift cards carry their `region`; names are tidied ("Steam Wallet 20 USD (TR)").

To refresh the import from the live store:

```bash
pip install -r scripts/requirements.txt          # Pillow, for the photos
python3 scripts/crawl_store.py crawl.json        # every category page and product page
python3 scripts/import_catalogue.py crawl.json   # -> assets/js/catalog.js + assets/products/live/
```

To re-check the hand-written products' prices:

```bash
python3 scripts/sync_prices.py --check   # report differences
python3 scripts/sync_prices.py           # update data.js to match the store
```

Long lists render 48 products at a time; the next batch arrives as you scroll (with a
"Show more" button as the fallback), so even the 477-tile "All products" page opens fast.

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
| Checkout | `#/checkout` | Contact filled in from the account (edit, save back), one block per game for top-ups, ClicToPay / D17 / Ooredoo Pay / transfer, validation, order summary |
| Order | `#/order/<id>` | Confirmation, progress timeline, delivered codes and logins (reveal / copy) |
| Orders | `#/orders` | Order history with status |
| Profile | `#/profile` | Account summary, stats, every key and account you've been delivered |
| Settings | `#/settings/<section>` | Profile & avatar, password & two-step, notifications, accent colour & motion, data export & reset |
| Support | `#/support` | Phone, email, address and opening hours, FAQ, contact form (opens your email app) |
| Notifications | `#/notifications` | All notifications, mark as read |
| Store admin | `#/admin`, `#/admin/products`, `#/admin/sections`, `#/admin/product/<id>` | Categories and subcategories, products, and what every page section shows (see below) |

The shell around them: a sidebar with Feather icons and labels on wide screens (store, wishlist,
basket, orders, profile, store admin, settings — foldable to icons, remembered; icons only on
tablets; a labelled five-item dock on phones), the
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

### Game platforms

Every game has its own page. On it the shopper picks the **platform — PC, Xbox or
PlayStation 5 —** and then **Key or Account**; price, picture and delivery follow the
choice. Versions the store doesn't sell (yet) show greyed out as "Not available". Each
product carries `game` and `platform` (techgarage.tn's fresh accounts and keys are PC, its
PlayStation games PS5); in the admin product form, **Game** and **Platform** put a new
version on an existing game's page (it borrows that game's photo if none is given).

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

techgarage.tn shows **ClicToPay** as its payment gateway (bank cards: Visa, Mastercard and
e-Dinar), so it is the default. Choosing it shows a short "opening the secure
ClicToPay page" step that stands in for the bank's page — no card details are ever asked
for here. D17, Ooredoo Pay (paid from Ooredoo mobile credit) and bank transfer are also offered; confirm with the store which it accepts
and edit `PAYMENT_METHODS` in `data.js`.

Each method adds its own fee (`PAYMENT_FEES` in `data.js`): **ClicToPay +2.5%** bank
fees, **D17 +1%**, **Ooredoo Pay +15%**, **bank transfer +5 DT**. The fee shows on each option and as its own
line in the order summary; the line, the total and the Place order button update the
moment the method changes, and the order page keeps the same breakdown. Fees are kept to
millimes, so amounts with a fee read like `399.75 DT`.

## Home page, further down

Below the first screen the home page keeps going, and every part is the owner's to edit:

| Section | What it shows | Edited in |
| --- | --- | --- |
| Rolling product bar | Products gliding past (pauses on hover or touch; a plain swipeable row with reduced motion) | Page sections — pick and order the products |
| Deals | Every product on sale, biggest discount first, with a live countdown to the end of the sale | Promotions — products on sale |
| Promo banner | Headline, text and button in three languages over a picture, plus a copyable promo code | Promotions — promo banner |
| Editor's picks | One big card and five more for the games you want to push | Page sections — pick and order the products |
| Flash sale of the day | One product at a big discount with a countdown to midnight; the sale price applies everywhere while the section is on | Promotions — product and % off |
| Bundles | Products sold together for less ("Steam starter", "Football fan"…); one click puts the whole set in the basket and checkout shows a "Bundle discount" line | Promotions — name, products, % off |
| Best sellers | A numbered row: what real orders of the last 30 days sold most, then the owner's list | Page sections — the owner's list |
| Top-up calculator | Pick a mobile game and a budget in DT: the biggest pack it buys, and the next one up | Page sections — on/off and title |
| Gift finder | Budget chips and "they play on" chips (Steam, PlayStation, Xbox, iTunes…, mobile games) filter gift cards and top-ups | Page sections — on/off and title |
| Coming soon · pre-order | Products whose release date is still to come, soonest first; their page says "Pre-order · out …" | Product form — release date |
| Customer reviews | The store's **Google rating and latest Google reviews** (Places API, New: Place ID + a browser key restricted to the site and to the Places API, entered in the admin; Google attribution, "See all on Google" and "Write a review" links), then reviews the owner adds by hand (none are made up); a review copied from the store's Google page can be marked "From Google" to get the Google look and a link back to that page | Page sections — Google Place ID and key, add / delete reviews |
| How we deliver | Pay, get the code, redeem — and the payment methods taken | Page sections — on/off and title |
| Category rows | Sliding rows of gift-card brands, mobile games and software, with arrows on computers | Page sections — on/off and title |

Two more helpers sit over the pages: a small **"Someone bought …"** note at the bottom of the
home page, built from real orders and their real times (it never invents a buyer), and a round
**WhatsApp button** on store pages (not in the admin or at checkout) that opens a chat with the
number set in Page sections. Both can be switched off there.

**Sales.** A product put on sale (Promotions → "Put a product on sale…", then % off and an end
date) shows its old price struck through and a "−20%" tag on every card, its page and the
deals row; the sale price is what the basket and checkout charge, and the sale stops by itself
on its end date. The product form always edits the regular price.

**Promo code.** The banner's code (e.g. `TECH10`, 10% off) is typed in the checkout summary;
the discount shows as its own line, the payment fee is worked out on the discounted amount and
the order keeps the code and the price paid for each item, so a later sale never changes an
old order's total.

### Product videos

A product can carry a short silent video (`video: { hd, sd }` in its data, or the two video
fields in the admin's product form). It plays over the product's picture on its page, and on
the home banner when the product is in the carousel:

- full HD (1080p) on computer screens at least 1600 px wide (or sharp ones), 720p on phones,
  tablets and slow connections; the file loads only when it is about to play;
- only the slide on show plays, and only while it is on screen and the tab is visible;
- a pause button on every video (WCAG 2.2.2); reduced motion or data saver shows the picture;
- `assets/videos/minecraft-hd.mp4` / `-sd.mp4` are an 8-second loop made from the Minecraft
  key art (2.2 MB / 1.1 MB, H.264, `+faststart` so it starts before it has fully loaded).

## Store admin

Open it from the account menu → **Store admin** (`#/admin`). A sidebar (Feather icons)
leads to **Overview**, **Orders**, Categories, Products, Keys & stock, Promotions, Page sections,
**Store settings** and **Texts**, with export / import / reset underneath.

- **Orders** — every order with its customer, items, payment and total; search, filter by
  status, and set the status (processing, delivered, cancelled). The customer's order page
  follows, and cancelled orders leave the sales figures.
- **Store settings** — store name (EN/FR/AR, also in every page title), phone, email, address,
  opening hours; the store's colour for visitors who haven't picked their own; each payment
  method on or off, its fee (% or DT) and its name; the help page's questions and answers for
  each language (add, reorder, delete, or go back to the originals).
- **Texts** — every phrase the store shows, searchable, reworded in English, French or Arabic
  (`TEXTS` overrides in `i18n.js`'s `t()`); an empty field keeps the original. **Overview** shows four stat cards — revenue and orders over the last 30 days
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
  value label, delivery type, what a top-up asks for, tags, badge, summary, store link, and a
  longer **description and guide** shown in its own section on the product page — plain text
  with `## heading`, `- bullet`, `1. step` and `**bold**`, escaped so it can never carry HTML);
  edit any product, shipped ones included; **duplicate** a product (the copy button on its
  row, or "Duplicate" in its form, `#/admin/product/copy-<id>`) to start a new one with the
  same photo, description and details — only the name, price or value need changing, and the
  video is left empty for the owner to add; delete. Deleted products leave every list and
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
timings: expo-out curves, ~1 s builds, 50–80 ms staggers), done with CSS and the View
Transitions API (`assets/js/motion.js`), plus Lenis and GSAP for scrolling
(`assets/js/smooth.js`):

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
- **Smooth scrolling** — [Lenis](https://github.com/darkroomengineering/lenis) gives the
  mouse wheel and trackpad a soft, weighted glide (expo-out, 1.1 s). On wide screens it
  drives the content panel, on phones the page; touch scrolling stays native. A new page
  always starts at the top instantly, and Back returns to where you were.
- **Scroll scenes** — [GSAP](https://gsap.com) ScrollTrigger, kept in step with Lenis on
  one clock: cards and sections further down fade up in staggered batches
  (`ScrollTrigger.batch`), including the shop's later batches of tiles; the home banner
  eases back, the category covers drift up and the product photo trails the page as you
  scroll (scrubbed). Only transforms and opacity are animated.
- **Cards** lean toward the pointer with a sheen that follows it; buttons give a little
  when pressed.

Settings → Appearance → Reduce motion, or the device's own setting, turns all of it off,
smooth scrolling included. Lenis 1.3.27 (MIT) and GSAP 3.15.1 with ScrollTrigger (free
under GSAP's standard licence) are kept in `assets/vendor/`, not loaded from a CDN, so
the security policy can stay at "this site only"; the single-file build inlines them and
allows each by its hash. Without them, the IntersectionObserver fallback still reveals content.
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
many forms. Prices read `180 DT` in English and French and `180 د.ت` in Arabic (or the chosen display currency, see below).

Arabic turns the whole layout right-to-left: the icon rail, sidebars and hero text move
to the right, the basket slides in from the left, arrows and swipe directions mirror.
Layout CSS uses logical properties (inline-start / end) so it flips on its own, with a
short list of overrides for gradients and animations. Arabic text uses SF Arabic on Apple
devices and IBM Plex Sans Arabic elsewhere, with no letter-spacing (it would break the
connected script) and a little more line height. Product names stay in their original form,
as stores in the region do.

## Game pages from Steam

`scripts/enrich_from_steam.py` matches each game sold here to its Steam page and writes
`assets/js/steam.js`: up to 6 screenshots (the photo strip under the main picture), the wide
banner (its own block and the blurred page background), the trailer where Steam still
offers a WebM file (plays muted over the main picture), and the PC system requirements
(PC versions only). 238 of 255 games match; PlayStation exclusives, unreleased games and
bundles have no Steam page. Images and trailers load from Steam's CDN. Anything the owner
sets on a product in the admin replaces the Steam media. Re-run the script after importing
new games (it needs network access to Steam; results are cached in `scripts/.steam-cache.json`).

Every product also gets **How to redeem** steps in all three languages, chosen by type:
Steam / EA / Ubisoft / Rockstar keys, Xbox and PlayStation codes, Steam accounts, each
gift-card brand, top-ups by player ID or login, Windows, Office and other licences. Steps
the owner writes for a product (admin → product → How to redeem) replace them, and every
wording can be changed in Store admin → Texts (keys `rd.*`).

## Product pages: details for every kind

- **Games**: Steam's description (in French and Arabic where Steam has a translation, otherwise
  English) under "About the game", and developer, publisher, release date and genres in the
  Details table — 241 games. Games Steam has no banner for (GTA VI, PS exclusives, Minecraft…)
  get a generated banner from their photo.
- **Mobile top-ups**: a guide per game (currency, publisher, top-up by player ID or login) and
  Details rows: publisher, platforms, in-game currency, top-up method.
- **Gift cards**: brand guide and a "Works on" row.
- **Software**: each licence is sorted into a kind — Windows, Office, security, VPN,
  streaming & subscriptions, AI, creative, tools — with its own banner, guide, "Works on" row
  and redeem steps (subscriptions get their own steps). App credits (TikTok, BIGO, Tango…) get a
  banner and guide per app.
- **Official App Store pictures** (`scripts/enrich_from_appstore.py`, writes `assets/js/appstore.js`): 16 mobile
  games, 11 apps and 18 software / subscription brands (Netflix, Spotify, Shahid, Discord, ChatGPT, Gemini,
  Perplexity, CapCut, NordVPN, Norton, McAfee, Bitdefender, AVG, AdGuard, Word, Excel, PowerPoint, Outlook) get
  their real screenshots in the photo strip and a banner built from them: a blurred screenshot behind, the
  screenshots as cards, and the app icon. Images load from Apple's CDN.
- `scripts/brand_banners.py` writes every banner and `assets/js/brand-art.js` (which banner each
  product uses); `scripts/enrich_from_steam.py` writes `assets/js/steam.js`. Any text or picture
  the owner sets on a product in the admin wins.

## Hardware and delivery

The store's **Computing** section (53 products: keyboards, cases, graphics cards,
motherboards, coolers, power supplies, headsets, monitors, storage) is imported as the
**Hardware** category, with 800 px photos. Hardware products have `delivery: 'ship'`; the owner
can make any product physical in admin → product → Delivery, and set **Units in stock**
(orders placed after that take from it).

- **Checkout** adds a Delivery step when the basket holds a physical item: country,
  governorate (the 24 of Tunisia) or region, street, city, postal code, notes, and the
  methods open for that country with their fee. The fee shows in the summary, with
  "Add X DT more for free delivery". The address is remembered on the device.
- **Store admin → Store → Shipping**: home delivery in Tunisia (fee, free-from amount,
  delivery time), express delivery, international delivery (fee, countries served) and
  store pickup (address). Each can be switched off.
- **Cash on delivery** is a payment method (Payment methods card) shown only for physical
  orders delivered in Tunisia or picked up.
- **Orders**: a physical order stays "Processing" until the owner marks it **Shipped** and
  then **Delivered** in Store admin → Orders, where the address, phone and notes show and a
  carrier and tracking number can be entered; the shopper's order page shows the timeline,
  address and tracking. Digital items in the same order still arrive by email.
- The refund policy has a section for physical products (14-day return of unused items).

Gift cards, mobile top-ups and hardware sub-categories each get a wide banner
(`scripts/brand_banners.py`, written to `assets/products/brands/`), and gift cards a short
guide per brand in all three languages.

The catalogue is refreshed with `scripts/crawl_store.py` (one request at a time: the store's
server is small) and `scripts/import_catalogue.py`; products already imported keep their ids.

## International selling

- **Currencies.** The globe menu also picks a display currency (EUR, USD, GBP, SAR, AED,
  CAD, MAD by default). Prices then read `≈ €29.00`; payment is always taken in Tunisian
  dinars, and checkout says so with the exact dinar amount. The owner sets the rates in
  Store admin → Store → Currencies (1 TND = rate × currency).
  Admin pages always show dinars.
- **Live exchange rates.** Currencies left on "Live" follow today's rate from
  open.er-api.com (free, no key), fetched only when a shopper picks another currency and
  kept for 6 hours. In Store admin → Currencies, set any currency to "Manual" to use your
  own rate; manual rates are also the fallback when the service can't be reached.
- **Card fees.** A Tunisian bank card pays +2.5%; an international card (Visa / Mastercard
  issued abroad) pays +3.5%. Shoppers browsing in another currency get the international
  card picked first. Both fees are editable under Payment methods.
- **Legal pages.** `#/legal/terms`, `#/legal/privacy`, `#/legal/refunds` and
  `#/legal/notice`, in all three languages, linked from the footer on every page. The
  default wording is a template filled from the store details (name, registered name,
  registration number, tax ID, address, email). The owner can replace any page in
  Store admin → Store → Legal pages. Have a lawyer review the texts before selling
  abroad, especially the EU withdrawal-right waiver for digital goods.
- **Privacy notice.** First visit shows a small card: "Only essential" or "Allow Google
  content". Google reviews load only after "Allow". The footer's "Privacy choices"
  reopens it. The store sets no tracking cookies.
- **Business identity.** Store settings hold the registered name, RNE number and tax ID;
  they appear in the footer and the legal notice once filled.
- **Fonts** (Inter, IBM Plex Sans Arabic, OFL) are served from `assets/fonts/`, so no
  request goes to Google Fonts.
- **Search and sharing.** Description, Open Graph and Twitter tags, JSON-LD
  `OnlineStore`, `manifest.webmanifest` with app icons, and `robots.txt`.

## Security

Everything a front end can do on its own is in place. Layer by layer:

| Layer | What it does | Where |
| --- | --- | --- |
| Escaped output | Every name, review, search term or saved value is escaped before it goes into the page, so typed or imported text can never run as code. Checked with an injection test across every page and form. | `esc()` in `core.js` |
| Input guard | Basket, profile, orders, key stock, preferences and the admin's catalogue changes are type-checked when read back or imported: ids must look like ids, text is length-capped, pictures and links must be safe addresses (no `javascript:`), the accent must be a colour. Damaged or tampered saves are dropped instead of breaking the store. | `guard.js` |
| Content Security Policy | Only the site's own scripts run (the single file allows exactly its one script, by SHA-256 hash); no plugins, no `<base>` tricks, no foreign forms or frames. Fonts only from Google Fonts. | `<meta>` in `index.html` |
| Clickjacking | The store refuses to run inside another site's frame and offers to open in its own window. On a real host `X-Frame-Options: DENY` / `frame-ancestors 'none'` do this at the server. | `protect.js`, `_headers` |
| Admin PIN | The store admin opens only with the owner's PIN — created on first visit, stored salted and SHA-256-hashed (never as text), unlocked until the tab closes or "Lock admin". Five wrong tries lock the form for 30 s, then longer. | `admin.js` |
| Passwords | Game-account passwords typed at checkout are used for the order and never saved; the profile keeps only non-secret game details. | `views.js`, `guard.js` |
| Copy protection | No right-click menu, text selection, copy/cut or photo dragging outside form fields; F12, Ctrl+Shift+I/J/C/K, ⌘⌥I/J/C/U, Ctrl+U and Ctrl+S are blocked. Purchased keys and form fields still copy normally. | `protect.js` |
| Console warning | A "Stop!" message in three languages warns people who were told to paste code into the console (self-XSS scams). | `protect.js` |
| Privacy | `Referrer-Policy: strict-origin-when-cross-origin`; no trackers or third-party scripts; avatars are baked in. | `index.html` |
| Hosting headers | Ready-made security headers — CSP with `frame-ancestors 'none'` and `upgrade-insecure-requests`, HSTS, `X-Frame-Options`, `nosniff`, `Permissions-Policy`, COOP/CORP — for Netlify / Cloudflare Pages (`_headers`) and Vercel (`vercel.json`). | `_headers`, `vercel.json` |

**What a front end cannot do.** The browser downloads the page to show it, so its code,
prices and anything stored in it can always be read by a determined visitor (browser
menu, extensions, JavaScript off). For the live store, keep on the **server**: the key
stock and key hand-out, admin logins, order and payment confirmation (ClicToPay's
callback), and price checks at checkout — never trust a total sent by the browser.

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
`assets/products/live/` holds the imported catalogue's ~780 photos at 400px WebP (17 MB);
they're known to be opaque, so the smart photo fit skips its transparency check for them.

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
assets/js/data.js       hand-written products, categories and subcategories, account, orders, store details
assets/js/catalog.js    the rest of the live catalogue (generated by scripts/import_catalogue.py)
assets/js/i18n.js       English, French and Arabic: phrases, plurals, prices, dates, product copy, FAQ
assets/js/core.js       shared state, store actions, smart photo fit, product card
assets/js/motion.js     page transitions, word-by-word titles, card tilt
assets/js/smooth.js     Lenis smooth scrolling + GSAP ScrollTrigger scroll scenes
assets/vendor/          Lenis, GSAP and ScrollTrigger (with their licences)
assets/js/glass-select.js  frosted-glass dropdowns over every <select> (search, keyboard, big rows)
assets/js/views.js      every page
assets/js/admin.js      store admin: categories, products, page sections
assets/js/protect.js    copy protection, frame blocking, console warning
assets/js/guard.js      checks every saved or imported value before use
_headers, vercel.json    security headers for hosting
assets/js/app.js        shell, search, basket, router
assets/products/        product imagery
assets/avatars/         gravify-generated avatars
scripts/                catalogue crawl + import, price sync, single-file build, avatar generation
```
