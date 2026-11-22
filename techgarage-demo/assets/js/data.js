/* TechGarage demo — catalogue data.
   Names, prices and categories are taken from the live techgarage.tn store.
   Prices are in Tunisian dinar and rendered in the store's own format. */

const P = 'assets/products/';

/* kind: 'art'  — full-bleed artwork, fills its frame
         'cut'  — transparent product cutout, floats on the surface      */

export const PRODUCTS = [
  /* ---- Graphics cards --------------------------------------------- */
  {
    id: 'rtx-5070-ti', name: 'MSI GeForce RTX 5070 Ti 16G GAMING TRIO OC — WHITE',
    short: 'RTX 5070 Ti GAMING TRIO OC', price: 3599, cat: 'components', kind: 'cut',
    img: P + 'msi-geforce-rtx-5070-ti-16g-gaming-trio-oc-white.webp',
    tags: ['Graphics Card', 'MSI'], badge: 'Flagship',
    blurb: '16 GB of GDDR7 on a 256-bit bus, 2572 MHz boost, and a tri-fan cooler in premium white. Built for 4K.',
    specs: ['16 GB GDDR7', '256-bit', 'Boost 2572 MHz', 'Tri Frozr 3']
  },
  {
    id: 'rtx-5070', name: 'MSI GeForce RTX 5070 12G VENTUS 2X OC — WHITE',
    short: 'RTX 5070 VENTUS 2X OC', price: 2499, cat: 'components', kind: 'cut',
    img: P + 'msi-geforce-rtx-5070-12g-ventus-2x-oc-white.webp',
    tags: ['Graphics Card', 'MSI'],
    blurb: '12 GB GDDR7 on a 192-bit bus in a compact two-slot white shroud. High-refresh 1440p without the bulk.',
    specs: ['12 GB GDDR7', '192-bit', 'Dual fan', 'White']
  },
  {
    id: 'rtx-5060', name: 'MSI GeForce RTX 5060 8G GAMING OC',
    short: 'RTX 5060 GAMING OC', price: 1359, cat: 'components', kind: 'cut',
    img: P + 'msi-geforce-rtx-5060-8g-gaming-oc.webp',
    tags: ['Graphics Card', 'MSI'], badge: 'Best value',
    blurb: '3840 CUDA cores and 8 GB of GDDR7. The sensible entry into the 50-series.',
    specs: ['8 GB GDDR7', '3840 CUDA', 'Gaming OC']
  },

  /* ---- Monitors ---------------------------------------------------- */
  {
    id: 'gameon-27w', name: 'GAMEON GOSX27W Switch X Series 27" Dual Switch 4K UHD 160Hz / FHD 320Hz — White',
    short: 'GAMEON GOSX27W 27" Dual Switch', price: 1269, cat: 'pcs', kind: 'cut',
    img: P + 'gameon-gosx27w-switch-x-series-27-dual-switch-4k-uhd-160hzfhd-320hz-white.webp',
    tags: ['Monitor', '27"'], badge: 'New',
    blurb: 'Flip between 4K at 160 Hz and 1080p at 320 Hz on one panel. Quantum-dot IPS, HDR10, 95% DCI-P3.',
    specs: ['4K 160 Hz', 'FHD 320 Hz', 'Quantum Dot IPS', 'HDR10']
  },
  {
    id: 'gameon-27b', name: 'GAMEON GOSX27B Switch X Series 27" Dual Switch 4K UHD 160Hz / FHD 320Hz',
    short: 'GAMEON GOSX27B 27" Dual Switch', price: 1249, cat: 'pcs', kind: 'cut',
    img: P + 'gameon-gosx27b-switch-x-series-27-dual-switch-4k-uhd-160hzfhd-320hz.webp',
    tags: ['Monitor', '27"'],
    blurb: 'The same dual-switch panel in black. 125% sRGB, G-Sync compatible, 0.5 ms MPRT.',
    specs: ['4K 160 Hz', 'FHD 320 Hz', '125% sRGB', '0.5 ms']
  },

  /* ---- Keyboards & audio ------------------------------------------- */
  {
    id: 'mchose-k87s', name: 'MCHOSE K87S-7',
    short: 'MCHOSE K87S', price: 470, cat: 'peripherals', kind: 'cut',
    img: P + 'mchose-k87s-7.webp',
    tags: ['Keyboard', 'Wireless'], badge: 'New',
    blurb: 'Tri-mode TKL with 0.125 ms latency, 8K polling, hot-swap sockets and a 10,000 mAh battery.',
    specs: ['8K polling', '0.125 ms', 'Hot-swap', 'SnapKey SOCD']
  },
  {
    id: 'yunzii-rt80', name: 'YUNZII RT80 Black Hall Effect 8K Rapid — White',
    short: 'YUNZII RT80 Hall Effect', price: 420, cat: 'peripherals', kind: 'cut',
    img: P + 'yunzii-rt80-black-hall-effect-8k-rapid-white.webp',
    tags: ['Keyboard', 'Hall Effect'],
    blurb: 'Magnetic switches with rapid trigger and adjustable actuation, 75% layout, 8K polling, hot-swap.',
    specs: ['Hall effect', 'Rapid trigger', '75%', 'BT / 2.4G / wired']
  },
  {
    id: 'epomaker-f99', name: 'EPOMAKER x AULA F99',
    short: 'EPOMAKER x AULA F99', price: 355, cat: 'peripherals', kind: 'art',
    img: P + 'epomaker-x-aula-f99.webp',
    tags: ['Keyboard', 'Gasket'],
    blurb: 'Gasket-mounted 96% board with five layers of padding and an 8000 mAh battery.',
    specs: ['Gasket mount', 'Hot-swap', '8000 mAh', 'BT / 2.4G / USB-C']
  },
  {
    id: 'aula-win60he', name: 'AULA WIN 60HE black',
    short: 'AULA WIN 60HE', price: 180, cat: 'peripherals', kind: 'cut',
    img: P + 'aula-win-60he-black.webp',
    tags: ['Keyboard', '60%'],
    blurb: '60% magnetic board with adjustable actuation and an 8000 Hz polling rate.',
    specs: ['Magnetic', '8000 Hz', '60%', 'Hot-swap']
  },
  {
    id: 'rk-r65', name: 'RK Royal Kludge R65 Gasket Wired Mechanical Keyboard 66 Key 65% RGB',
    short: 'RK Royal Kludge R65', price: 220, cat: 'peripherals', kind: 'cut',
    img: P + 'rk-royal-kludge-r65-gasket-wired-mechanical-keyboard-66-key-65-rgb.webp',
    tags: ['Keyboard', '65%'],
    blurb: 'Gasket-mounted 66-key board with per-key RGB. A clean, cheap entry to custom feel.',
    specs: ['Gasket', '66 keys', 'RGB', 'Wired']
  },
  {
    id: 'fifine-am8', name: 'FIFINE AmpliGame AM8 RGB USB/XLR — WHITE',
    short: 'FIFINE AmpliGame AM8', price: 309, cat: 'peripherals', kind: 'art',
    img: P + 'fifine-ampligame-am8-rgb-usbxlr.webp',
    tags: ['Microphone', 'RGB'], badge: 'Pre-order',
    blurb: 'Dual USB and XLR output with RGB lighting. Works with PC, PS5 and laptops.',
    specs: ['USB + XLR', 'RGB', 'Cardioid']
  },
  {
    id: 'fifine-kit', name: 'FIFINE USB/XLR Gaming Microphone Kit',
    short: 'FIFINE USB/XLR Mic Kit', price: 380, cat: 'peripherals', kind: 'art',
    img: P + 'fifine-usbxlr-gaming-microphone-kit-.webp',
    tags: ['Microphone', 'Kit'], badge: 'Pre-order',
    blurb: 'The full streaming kit — microphone, boom arm and shock mount in one box.',
    specs: ['USB + XLR', 'Boom arm', 'Shock mount']
  },

  /* ---- Game keys & accounts ---------------------------------------- */
  {
    id: 'bo7', name: 'Call Of Duty : Black OPS 7 Standard Edition',
    short: 'Call of Duty: Black Ops 7', price: 180, cat: 'keys', kind: 'art',
    img: P + 'call-of-duty-black-ops-7.webp',
    tags: ['Fresh Steam Account', 'FPS'], badge: 'Now trending',
    blurb: 'The newest Black Ops, delivered as a fresh Steam account. Instant handover after checkout.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'fc27', name: 'EA FC27 STANDARD EDITION FRESH STEAM ACCOUNT',
    short: 'EA SPORTS FC 27', price: 90, cat: 'keys', kind: 'art',
    img: P + 'ea-fc27-standard-edition-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Sports'], badge: 'New season',
    blurb: 'This season’s FC on a clean Steam account. Change the password and the mail on arrival.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'elden-ring', name: 'Elden Ring Fresh Steam account',
    short: 'Elden Ring', price: 100, cat: 'keys', kind: 'art',
    img: P + 'elden-ring-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'RPG'],
    blurb: 'The Lands Between, on a fresh account. One of the store’s steadiest sellers.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'ac-shadows', name: 'Assassin’s Creed Shadows (PC) Ubisoft Connect Key GLOBAL',
    short: 'Assassin’s Creed Shadows', price: 200, cat: 'keys', kind: 'art',
    img: P + 'assassins-creed-shadows-pc-ubisoft-connect-key-global.webp',
    tags: ['Ubisoft Connect', 'Global Key'],
    blurb: 'Feudal Japan, two protagonists. A global Ubisoft Connect key, no region lock.',
    specs: ['Ubisoft Connect', 'Global', 'Instant delivery']
  },
  {
    id: 'ready-or-not', name: 'Ready or Not Steam Key GLOBAL',
    short: 'Ready or Not', price: 110, cat: 'keys', kind: 'art',
    img: P + 'ready-or-not-steam-key-global.webp',
    tags: ['Steam Key', 'Tactical'],
    blurb: 'Close-quarters police tactics. Global Steam key, activates anywhere.',
    specs: ['Steam', 'Global', 'Instant delivery']
  },
  {
    id: 'wukong', name: 'black myth wukong FRESH STEAM ACCOUNT',
    short: 'Black Myth: Wukong', price: 120, cat: 'keys', kind: 'art',
    img: P + 'black-myth-wukong-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Action'],
    blurb: 'The Journey to the West action-RPG everyone argued about. Fresh Steam account.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'split-fiction', name: 'Split Fiction Fresh New Steam Account',
    short: 'Split Fiction', price: 100, cat: 'keys', kind: 'art',
    img: P + 'split-fiction-fresh-new-steam-account.webp',
    tags: ['Fresh Steam Account', 'Co-op'],
    blurb: 'Two-player co-op from the It Takes Two team. Friend’s Pass included.',
    specs: ['Steam', 'Co-op', 'Instant delivery']
  },
  {
    id: 'inzoi', name: 'inzoi Fresh Steam account',
    short: 'inZOI', price: 100, cat: 'keys', kind: 'art',
    img: P + 'inzoi-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Simulation'],
    blurb: 'Life simulation with unreasonably good character creation.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'tlou2', name: 'THE LAST OF US Part 2 FRESH STEAM Account',
    short: 'The Last of Us Part II', price: 120, cat: 'keys', kind: 'art',
    img: P + 'the-last-of-us-part-1-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Story'],
    blurb: 'The PC port of Part II, on a fresh Steam account.',
    specs: ['Steam', 'Remastered', 'Instant delivery']
  },
  {
    id: 'nba2k26', name: 'NBA 2K26 Standard Edition Fresh Account',
    short: 'NBA 2K26', price: 115, cat: 'keys', kind: 'art',
    img: P + 'nba-2k26-standard-edition-fresh-account.webp',
    tags: ['Fresh Steam Account', 'Sports'],
    blurb: 'This year’s 2K on a clean account, ready for MyCareer.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'f1-2025', name: 'EA SPORTS F1 2025 Standard Edition — New Steam Account',
    short: 'EA SPORTS F1 25', price: 90, cat: 'keys', kind: 'art',
    img: P + 'ea-sports-f1-2025-standard-editionnew-steam-account.webp',
    tags: ['Fresh Steam Account', 'Racing'],
    blurb: 'The official F1 season on a new Steam account.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'gta5', name: 'GRAND THEFT AUTO: V FRESH STEAM ACCOUNT',
    short: 'Grand Theft Auto V', price: 45, cat: 'keys', kind: 'art',
    img: P + 'grand-theft-auto-v-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Open World'],
    blurb: 'Los Santos, still. Fresh Steam account at the long-running store price.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'minecraft', name: 'Minecraft: Java & Bedrock Edition (PC) Windows FRESH ACCOUNT',
    short: 'Minecraft Java & Bedrock', price: 45, cat: 'keys', kind: 'art',
    img: P + 'minecraft-java-bedrock-edition-pc-windows-store-key-global.webp',
    tags: ['Fresh Account', 'Sandbox'],
    blurb: 'Both editions on one account, through the Windows Store.',
    specs: ['Java + Bedrock', 'Windows', 'Instant delivery']
  },

  /* ---- Gift cards & software --------------------------------------- */
  {
    id: 'steam-20', name: 'Steam Wallet Gift Card 20 USD Steam Key',
    short: 'Steam Wallet 20 USD', price: 78, cat: 'cards', kind: 'art',
    img: P + 'steam-wallet-gift-card-20-usd-steam-key.webp',
    tags: ['Gift Card', 'Steam'],
    blurb: 'Twenty dollars of Steam wallet, delivered as a key.',
    specs: ['Steam', '20 USD', 'Instant delivery']
  },
  {
    id: 'valorant-20', name: 'VALORANT Gift Card 20 EUR — EUROPE',
    short: 'VALORANT 20 EUR', price: 74, cat: 'cards', kind: 'art',
    img: P + 'valorant-gift-card-20-eur-europe.webp',
    tags: ['Gift Card', 'Riot'],
    blurb: 'Valorant Points for the European region.',
    specs: ['Riot', '20 EUR', 'Europe']
  },
  {
    id: 'win11', name: 'Windows 10/11 Professional Key — Tunisia',
    short: 'Windows 11 Pro', price: 20, cat: 'cards', kind: 'art',
    img: P + 'windows11-pro.webp',
    tags: ['Software', 'Licence'], badge: 'Cheapest',
    blurb: 'A Pro licence for Windows 10 or 11, at twenty dinars.',
    specs: ['Windows 10/11', 'Pro', 'Instant delivery']
  }
];

export const CATEGORIES = [
  { id: 'all',         label: 'Trending'    },
  { id: 'components',  label: 'Components'  },
  { id: 'peripherals', label: 'Peripherals' },
  { id: 'keys',        label: 'Game Keys'   },
  { id: 'pcs',         label: 'Setups'      },
  { id: 'cards',       label: 'More'        }
];

/* Hero carousel — ids resolved against PRODUCTS */
export const HERO = ['bo7', 'rtx-5070-ti', 'elden-ring', 'gameon-27w', 'fc27'];

/* Left column: newest arrivals */
export const NEW_DROPS = ['mchose-k87s', 'gameon-27w', 'yunzii-rt80', 'fc27', 'epomaker-f99', 'rtx-5070-ti'];

/* Left column, lower card: the shopper's recent activity */
export const RECENT = [
  { id: 'elden-ring',  note: 'Delivered · 12 Nov' },
  { id: 'rtx-5060',    note: 'In your basket'          },
  { id: 'steam-20',    note: 'Delivered · 03 Nov' },
  { id: 'rk-r65',      note: 'Viewed yesterday'        },
  { id: 'minecraft',   note: 'Delivered · 28 Oct' }
];

/* Account shown in the top-right chip — demo identity, matches assets/avatars */
export const ACCOUNT = {
  name: 'Sami Ben Ali',
  handle: '@samibenali',
  avatar: 'assets/avatars/sami.png'
};

export const NOTIFICATIONS = [
  { who: 'yassine', title: 'Your order shipped',      body: 'MSI RTX 5060 8G GAMING OC is out for delivery in Mahdia.', when: '12m' },
  { who: 'mariem',  title: 'Back in stock',           body: 'MCHOSE K87S is available again — 470 TND.',                when: '2h'  },
  { who: 'oussama', title: 'Price drop',              body: 'Windows 10/11 Pro key is down to 20 TND.',                 when: '1d'  },
  { who: 'nour',    title: 'Key delivered',           body: 'Your EA FC 27 account details are in your inbox.',         when: '2d'  }
];

export const STORE = {
  name: 'TechGarage',
  domain: 'techgarage.tn',
  phone: '+216 58 578 111',
  email: 'Commercial@techgarage.site',
  address: 'Rue Hssan Achoura, 5100 Mahdia, Tunisia'
};
