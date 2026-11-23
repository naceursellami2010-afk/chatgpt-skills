/* TechGarage demo — catalogue data.
   Names, prices and categories are taken from the live techgarage.tn store.
   Digital goods only: PC games, gift cards, mobile top-ups and software.
   Prices are in Tunisian dinar and rendered in the store's own format. */

const P = 'assets/products/';

/* kind: 'art' — full-bleed artwork, fills its frame.
   (The UI also supports 'cut' for transparent product cutouts.) */

export const PRODUCTS = [
  /* ---- PC games: keys & fresh accounts ----------------------------- */
  {
    id: 'bo7', name: 'Call Of Duty : Black OPS 7 Standard Edition',
    short: 'Call of Duty: Black Ops 7', price: 180, cat: 'games', kind: 'art',
    img: P + 'call-of-duty-black-ops-7.webp',
    tags: ['Fresh Steam Account', 'FPS'], badge: 'Now trending',
    blurb: 'The newest Black Ops, delivered as a fresh Steam account. Instant handover after checkout.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'fc27', name: 'EA FC27 STANDARD EDITION FRESH STEAM ACCOUNT',
    short: 'EA SPORTS FC 27', price: 90, cat: 'games', kind: 'art',
    img: P + 'ea-fc27-standard-edition-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Sports'], badge: 'New season',
    blurb: 'This season’s FC on a clean Steam account. Change the password and the mail on arrival.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'elden-ring', name: 'Elden Ring Fresh Steam account',
    short: 'Elden Ring', price: 100, cat: 'games', kind: 'art',
    img: P + 'elden-ring-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'RPG'],
    blurb: 'The Lands Between, on a fresh account. One of the store’s steadiest sellers.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'ac-shadows', name: 'Assassin’s Creed Shadows (PC) Ubisoft Connect Key GLOBAL',
    short: 'Assassin’s Creed Shadows', price: 200, cat: 'games', kind: 'art',
    img: P + 'assassins-creed-shadows-pc-ubisoft-connect-key-global.webp',
    tags: ['Ubisoft Connect', 'Global Key'],
    blurb: 'Feudal Japan, two protagonists. A global Ubisoft Connect key, no region lock.',
    specs: ['Ubisoft Connect', 'Global', 'Instant delivery']
  },
  {
    id: 'wukong', name: 'black myth wukong FRESH STEAM ACCOUNT',
    short: 'Black Myth: Wukong', price: 120, cat: 'games', kind: 'art',
    img: P + 'black-myth-wukong-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Action'],
    blurb: 'The Journey to the West action-RPG everyone argued about. Fresh Steam account.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'ready-or-not', name: 'Ready or Not Steam Key GLOBAL',
    short: 'Ready or Not', price: 110, cat: 'games', kind: 'art',
    img: P + 'ready-or-not-steam-key-global.webp',
    tags: ['Steam Key', 'Tactical'],
    blurb: 'Close-quarters police tactics. Global Steam key, activates anywhere.',
    specs: ['Steam', 'Global', 'Instant delivery']
  },
  {
    id: 'split-fiction', name: 'Split Fiction Fresh New Steam Account',
    short: 'Split Fiction', price: 100, cat: 'games', kind: 'art',
    img: P + 'split-fiction-fresh-new-steam-account.webp',
    tags: ['Fresh Steam Account', 'Co-op'],
    blurb: 'Two-player co-op from the It Takes Two team. Friend’s Pass included.',
    specs: ['Steam', 'Co-op', 'Instant delivery']
  },
  {
    id: 'inzoi', name: 'inzoi Fresh Steam account',
    short: 'inZOI', price: 100, cat: 'games', kind: 'art',
    img: P + 'inzoi-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Simulation'],
    blurb: 'Life simulation with unreasonably good character creation.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'tlou2', name: 'THE LAST OF US Part 2 FRESH STEAM Account',
    short: 'The Last of Us Part II', price: 120, cat: 'games', kind: 'art',
    img: P + 'the-last-of-us-part-1-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Story'],
    blurb: 'The PC port of Part II, on a fresh Steam account.',
    specs: ['Steam', 'Remastered', 'Instant delivery']
  },
  {
    id: 'nba2k26', name: 'NBA 2K26 Standard Edition Fresh Account',
    short: 'NBA 2K26', price: 115, cat: 'games', kind: 'art',
    img: P + 'nba-2k26-standard-edition-fresh-account.webp',
    tags: ['Fresh Steam Account', 'Sports'], badge: 'New',
    blurb: 'This year’s 2K on a clean account, ready for MyCareer.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'f1-2025', name: 'EA SPORTS F1 2025 Standard Edition — New Steam Account',
    short: 'EA SPORTS F1 25', price: 90, cat: 'games', kind: 'art',
    img: P + 'ea-sports-f1-2025-standard-editionnew-steam-account.webp',
    tags: ['Fresh Steam Account', 'Racing'],
    blurb: 'The official F1 season on a new Steam account.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'gta5', name: 'GRAND THEFT AUTO: V FRESH STEAM ACCOUNT',
    short: 'Grand Theft Auto V', price: 45, cat: 'games', kind: 'art',
    img: P + 'grand-theft-auto-v-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Open World'],
    blurb: 'Los Santos, still. Fresh Steam account at the long-running store price.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'minecraft', name: 'Minecraft: Java & Bedrock Edition (PC) Windows FRESH ACCOUNT',
    short: 'Minecraft Java & Bedrock', price: 45, cat: 'games', kind: 'art',
    img: P + 'minecraft-java-bedrock-edition-pc-windows-store-key-global.webp',
    tags: ['Fresh Account', 'Sandbox'],
    blurb: 'Both editions on one account, through the Windows Store.',
    specs: ['Java + Bedrock', 'Windows', 'Instant delivery']
  },

  /* ---- Gift cards ---------------------------------------------------- */
  {
    id: 'steam-20', name: 'Steam Wallet Gift Card 20 USD Steam Key',
    short: 'Steam Wallet 20 USD', price: 78, cat: 'cards', kind: 'art',
    img: P + 'steam-wallet-gift-card-20-usd-steam-key.webp',
    tags: ['Gift Card', 'Steam'], badge: 'Best seller',
    blurb: 'Twenty dollars of Steam wallet, delivered as a key.',
    specs: ['Steam', '20 USD', 'Instant delivery']
  },
  {
    id: 'steam-50', name: 'Steam Wallet Gift Card 50 USD Steam Key',
    short: 'Steam Wallet 50 USD', price: 190, cat: 'cards', kind: 'art',
    img: P + 'steam-wallet-gift-card-50-usd.webp',
    tags: ['Gift Card', 'Steam'],
    blurb: 'Fifty dollars of Steam wallet — enough for a new release and change.',
    specs: ['Steam', '50 USD', 'Instant delivery']
  },
  {
    id: 'psn-20', name: 'PlayStation Network Card 20 EUR (FR) PSN Key FRANCE',
    short: 'PlayStation 20 EUR (FR)', price: 80, cat: 'cards', kind: 'art',
    img: P + 'psn-card-20-eur-france.webp',
    tags: ['Gift Card', 'PlayStation'],
    blurb: 'Twenty euros of PSN credit for French-region accounts.',
    specs: ['PSN', '20 EUR', 'France']
  },
  {
    id: 'itunes-20', name: 'Apple iTunes Gift Card 20 USD iTunes Key UNITED STATES',
    short: 'Apple iTunes 20 USD', price: 78, cat: 'cards', kind: 'art',
    img: P + 'apple-itunes-gift-card-20-usd.webp',
    tags: ['Gift Card', 'Apple'],
    blurb: 'Twenty dollars of App Store and iTunes credit for US accounts.',
    specs: ['Apple', '20 USD', 'United States']
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
    id: 'lol-20', name: 'League of Legends Gift Card 20€ Riot Key — EUROPE',
    short: 'League of Legends 20 EUR', price: 74, cat: 'cards', kind: 'art',
    img: P + 'league-of-legends-gift-card-20-eur.webp',
    tags: ['Gift Card', 'Riot'],
    blurb: 'Riot Points for League of Legends on European servers.',
    specs: ['Riot', '20 EUR', 'Europe']
  },

  /* ---- Mobile top-ups ------------------------------------------------ */
  {
    id: 'efootball-1000', name: 'EFOOTBALL 1000 Coins',
    short: 'eFootball 1000 Coins', price: 35, cat: 'mobile', kind: 'art',
    img: P + 'efootball-1000-coins.webp',
    tags: ['Top-up', 'eFootball'],
    blurb: 'A thousand eFootball coins, credited straight to your account.',
    specs: ['eFootball 2027', '1000 coins', 'Fast top-up']
  },
  {
    id: 'efootball-5000', name: 'EFOOTBALL 5000 Coins',
    short: 'eFootball 5000 Coins', price: 160, cat: 'mobile', kind: 'art',
    img: P + 'efootball-5000-coins.webp',
    tags: ['Top-up', 'eFootball'], badge: 'Best value',
    blurb: 'The big pack — five thousand coins for the new season.',
    specs: ['eFootball 2027', '5000 coins', 'Fast top-up']
  },
  {
    id: 'pubg-3850', name: 'PUBG Mobile 3850 UC',
    short: 'PUBG Mobile 3850 UC', price: 190, cat: 'mobile', kind: 'art',
    img: P + 'pubg-mobile-3850-uc.webp',
    tags: ['Top-up', 'PUBG Mobile'],
    blurb: '3850 Unknown Cash, topped up by player ID.',
    specs: ['PUBG Mobile', '3850 UC', 'By player ID']
  },

  /* ---- Software & subscriptions ------------------------------------- */
  {
    id: 'win11', name: 'Windows 10/11 Professional Key — Tunisia',
    short: 'Windows 11 Pro', price: 20, cat: 'software', kind: 'art',
    img: P + 'windows11-pro.webp',
    tags: ['Software', 'Licence'], badge: 'Cheapest',
    blurb: 'A Pro licence for Windows 10 or 11, at twenty dinars.',
    specs: ['Windows 10/11', 'Pro', 'Instant delivery']
  },
  {
    id: 'nitro-1m', name: 'DISCORD NITRO KEY 1 MONTH',
    short: 'Discord Nitro — 1 month', price: 35, cat: 'software', kind: 'art',
    img: P + 'discord-nitro-1-month.webp',
    tags: ['Subscription', 'Discord'],
    blurb: 'A month of Nitro: bigger uploads, HD streaming, custom emoji everywhere.',
    specs: ['Discord', '1 month', 'Instant delivery']
  }
];

export const CATEGORIES = [
  { id: 'all',      label: 'Trending'   },
  { id: 'games',    label: 'PC Games'   },
  { id: 'cards',    label: 'Gift Cards' },
  { id: 'mobile',   label: 'Mobile'     },
  { id: 'software', label: 'Software'   }
];

/* Hero carousel — ids resolved against PRODUCTS */
export const HERO = ['bo7', 'elden-ring', 'fc27', 'ac-shadows', 'wukong'];

/* Left column: newest arrivals */
export const NEW_DROPS = ['nba2k26', 'fc27', 'efootball-5000', 'f1-2025', 'split-fiction', 'steam-50'];

/* Left column, lower card: the shopper's recent activity */
export const RECENT = [
  { id: 'elden-ring',  note: 'Delivered · 12 Nov' },
  { id: 'steam-20',    note: 'In your basket'          },
  { id: 'valorant-20', note: 'Delivered · 03 Nov' },
  { id: 'minecraft',   note: 'Viewed yesterday'        }
];

/* Account shown in the top-right chip — demo identity, matches assets/avatars */
export const ACCOUNT = {
  name: 'Sami Ben Ali',
  handle: '@samibenali',
  avatar: 'assets/avatars/sami.png'
};

export const NOTIFICATIONS = [
  { who: 'yassine', title: 'Key delivered',  body: 'Your EA FC 27 account details are in your inbox.',     when: '12m' },
  { who: 'mariem',  title: 'Back in stock',  body: 'Steam Wallet 50 USD is available again — 190 TND.', when: '2h'  },
  { who: 'oussama', title: 'Price drop',     body: 'Windows 10/11 Pro key is down to 20 TND.',            when: '1d'  },
  { who: 'nour',    title: 'Top-up done',    body: '5000 eFootball coins credited to your account.',      when: '2d'  }
];

export const STORE = {
  name: 'TechGarage',
  domain: 'techgarage.tn',
  phone: '+216 58 578 111',
  email: 'Commercial@techgarage.site',
  address: 'Rue Hssan Achoura, 5100 Mahdia, Tunisia'
};
