/* TechGarage demo — catalogue data.
   Names, prices and categories are taken from the live techgarage.tn store.
   Digital goods only: PC games, gift cards, mobile top-ups and software.
   Prices are in Tunisian dinar and rendered in the store's own format. */

import { LIVE, GAME_OF } from './catalog.js?v=20261129d';
import { ART, KIND } from './brand-art.js?v=20261129d';
import { APPS } from './appstore.js?v=20261129d';
import { STEAM } from './steam.js?v=20261129d';
import { cleanAdmin } from './guard.js?v=20261129d';
import { PUBLISHED_RECORD } from './store-record.js?v=20261129d';

const P = 'assets/products/';
const S = 'https://techgarage.tn/';   /* each product's page on the live store */

/* kind: 'art' — full-bleed artwork, fills its frame.
   (The UI also supports 'cut' for transparent product cutouts.) */

export const PRODUCTS = [
  /* ---- PC games: keys & fresh accounts ----------------------------- */
  {
    id: 'bo7', url: S + 'accounts/1380-call-of-duty-black-ops-7.html',
    name: 'Call Of Duty : Black OPS 7 Standard Edition',
    short: 'Call of Duty: Black Ops 7', price: 180, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'call-of-duty-black-ops-7.webp',
    tags: ['Fresh Steam Account', 'FPS'], badge: 'Now trending',
    blurb: 'The newest Black Ops, delivered as a fresh Steam account. Instant handover after checkout.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'fc27', url: S + 'ea-fc-27/2126-ea-fc27-standard-edition-fresh-steam-account.html',
    name: 'EA FC27 STANDARD EDITION FRESH STEAM ACCOUNT',
    short: 'EA SPORTS FC 27', price: 90, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'ea-fc27-standard-edition-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Sports'], badge: 'New season',
    blurb: 'This season’s FC on a clean Steam account. Change the password as soon as it arrives.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'elden-ring', url: S + 'accounts/1139-elden-ring-fresh-steam-account.html',
    name: 'Elden Ring Fresh Steam account',
    short: 'Elden Ring', price: 100, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'elden-ring-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'RPG'],
    blurb: 'The Lands Between, on a fresh account. One of the store’s steadiest sellers.',
    guide: "## What you get\nA fresh Steam account with **Elden Ring** already on it. You get the account's email and password after checkout.\n\n## First steps\n1. Sign in to Steam with the details from your order\n2. Change the password right away\n3. Add your own email and turn on **Steam Guard**\n4. Download the game and play\n\n## Good to know\n- Play online and offline, with your own saves\n- Do not share the account with anyone",
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'ac-shadows', url: S + 'key/774-assassins-creed-shadows-pc-ubisoft-connect-key-global.html',
    name: 'Assassin’s Creed Shadows (PC) Ubisoft Connect Key GLOBAL',
    short: 'Assassin’s Creed Shadows', price: 200, cat: 'games', sub: 'keys', kind: 'art',
    img: P + 'assassins-creed-shadows-pc-ubisoft-connect-key-global.webp',
    tags: ['Ubisoft Connect', 'Global Key'],
    blurb: 'Feudal Japan, two protagonists. A global Ubisoft Connect key, no region lock.',
    specs: ['Ubisoft Connect', 'Global', 'Instant delivery']
  },
  {
    id: 'wukong', url: S + 'accounts/651-black-myth-wukong-fresh-steam-account.html',
    name: 'black myth wukong FRESH STEAM ACCOUNT',
    short: 'Black Myth: Wukong', price: 120, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'black-myth-wukong-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Action'],
    blurb: 'The Journey to the West action-RPG everyone argued about. Fresh Steam account.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'ready-or-not', url: S + 'key/23-ready-or-not-steam-key-global.html',
    name: 'Ready or Not Steam Key GLOBAL',
    short: 'Ready or Not', price: 110, cat: 'games', sub: 'keys', kind: 'art',
    img: P + 'ready-or-not-steam-key-global.webp',
    tags: ['Steam Key', 'Tactical'],
    blurb: 'Close-quarters police tactics. Global Steam key, activates anywhere.',
    specs: ['Steam', 'Global', 'Instant delivery']
  },
  {
    id: 'split-fiction', url: S + 'accounts/1134-split-fiction-fresh-new-steam-account.html',
    name: 'Split Fiction Fresh New Steam Account',
    short: 'Split Fiction', price: 100, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'split-fiction-fresh-new-steam-account.webp',
    tags: ['Fresh Steam Account', 'Co-op'],
    blurb: 'Two-player co-op from the It Takes Two team. Friend’s Pass included.',
    specs: ['Steam', 'Co-op', 'Instant delivery']
  },
  {
    id: 'inzoi', url: S + 'accounts/1137-inzoi-fresh-steam-account.html',
    name: 'inzoi Fresh Steam account',
    short: 'inZOI', price: 100, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'inzoi-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Simulation'],
    blurb: 'Life simulation with unreasonably good character creation.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'tlou2', url: S + 'accounts/1389-the-last-of-us-part-1-fresh-steam-account.html',
    name: 'THE LAST OF US Part 2 FRESH STEAM Account',
    short: 'The Last of Us Part II', price: 120, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'the-last-of-us-part-1-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Story'],
    blurb: 'The PC port of Part II, on a fresh Steam account.',
    specs: ['Steam', 'Remastered', 'Instant delivery']
  },
  {
    id: 'nba2k26', url: S + 'accounts/1375-nba-2k26-standard-edition-fresh-account.html',
    name: 'NBA 2K26 Standard Edition Fresh Account',
    short: 'NBA 2K26', price: 115, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'nba-2k26-standard-edition-fresh-account.webp',
    tags: ['Fresh Steam Account', 'Sports'], badge: 'New',
    blurb: 'This year’s 2K on a clean account, ready for MyCareer.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'f1-2025', url: S + 'accounts/1674-ea-sports-f1-2025-standard-editionnew-steam-account.html',
    name: 'EA SPORTS F1 2025 Standard Edition — New Steam Account',
    short: 'EA SPORTS F1 25', price: 90, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'ea-sports-f1-2025-standard-editionnew-steam-account.webp',
    tags: ['Fresh Steam Account', 'Racing'],
    blurb: 'The official F1 season on a new Steam account.',
    specs: ['Steam', 'Standard Edition', 'Instant delivery']
  },
  {
    id: 'gta5', url: S + 'accounts/474-grand-theft-auto-v-fresh-steam-account.html',
    name: 'GRAND THEFT AUTO: V FRESH STEAM ACCOUNT',
    short: 'Grand Theft Auto V', price: 45, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'grand-theft-auto-v-fresh-steam-account.webp',
    tags: ['Fresh Steam Account', 'Open World'],
    blurb: 'Los Santos, still. Fresh Steam account at the long-running store price.',
    specs: ['Steam', 'Base game', 'Instant delivery']
  },
  {
    id: 'minecraft', url: S + 'accounts/477-minecraft-java-bedrock-edition-pc-windows-store-key-global.html',
    name: 'Minecraft: Java & Bedrock Edition (PC) Windows FRESH ACCOUNT',
    short: 'Minecraft Java & Bedrock', price: 45, cat: 'games', sub: 'accounts', kind: 'art',
    img: P + 'minecraft-java-bedrock-edition-pc-windows-store-key-global.webp',
    tags: ['Fresh Account', 'Sandbox'],
    blurb: 'Both editions on one account, through the Windows Store.',
    specs: ['Java + Bedrock', 'Windows', 'Instant delivery'],
    /* wide key art at the top of the page; the crop keeps the two heroes on the bridge in view */
    video: { hd: 'assets/videos/minecraft-hd.mp4', sd: 'assets/videos/minecraft-sd.mp4' },   // 8 s silent loop, 1080p / 720p
    banner: { focus: '74% 62%', srcset: [[P + 'banners/minecraft-640.webp', 640], [P + 'banners/minecraft-1280.webp', 1280], [P + 'banners/minecraft-1672.webp', 1672]] }
  },

  /* ---- Gift cards ---------------------------------------------------- */
  {
    id: 'steam-20', url: S + 'steam-usd/53-steam-wallet-gift-card-20-usd-steam-key.html',
    name: 'Steam Wallet Gift Card 20 USD Steam Key',
    short: 'Steam Wallet 20 USD', price: 78, cat: 'cards', sub: 'steam', kind: 'art',
    img: P + 'steam-wallet-gift-card-20-usd-steam-key.webp',
    tags: ['Steam', 'Gift Card'], badge: 'Best seller',
    blurb: 'Twenty dollars of Steam wallet, delivered as a key.',
    guide: "## How to redeem\n1. Open Steam and sign in to your account\n2. Click your name at the top right, then **Wallet**\n3. Click **Add funds**, then **Redeem a Steam Gift Card or Wallet Code**\n4. Paste the code from your order and confirm\n\n## Good to know\n- The card is in US dollars: it works on accounts whose wallet is in USD\n- The balance never expires\n- Keep your order email until the code is redeemed",
    specs: ['Steam', '20 USD', 'Instant delivery']
  },
  {
    id: 'steam-50', url: S + 'steam-usd/54-steam-wallet-gift-card-50-usd-steam-key.html',
    name: 'Steam Wallet Gift Card 50 USD Steam Key',
    short: 'Steam Wallet 50 USD', price: 190, cat: 'cards', sub: 'steam', kind: 'art',
    img: P + 'steam-wallet-gift-card-50-usd.webp',
    tags: ['Steam', 'Gift Card'],
    blurb: 'Fifty dollars of Steam wallet — enough for a new release and change.',
    specs: ['Steam', '50 USD', 'Instant delivery']
  },
  {
    id: 'psn-20', url: S + 'playstation-france/126-playstation-network-card-20-eur-fr-psn-key-france.html',
    name: 'PlayStation Network Card 20 EUR (FR) PSN Key FRANCE',
    short: 'PlayStation 20 EUR (FR)', price: 80, cat: 'cards', sub: 'playstation', kind: 'art',
    img: P + 'psn-card-20-eur-france.webp',
    tags: ['PlayStation', 'Gift Card'],
    blurb: 'Twenty euros of PSN credit for French-region accounts.',
    guide: "## How to redeem\n1. On your PS5, go to **Settings**, then **Users and Accounts**\n2. Open **Account**, then **Payment and Subscriptions**\n3. Choose **Redeem Codes** and type the 12-character code\n4. The 20 EUR lands in your PlayStation wallet straight away\n\n## Good to know\n- For **French** PlayStation accounts only\n- You can also redeem it on the PlayStation website or app",
    specs: ['PSN', '20 EUR', 'France']
  },
  {
    id: 'itunes-20', url: S + 'itunes-usa/615-apple-itunes-gift-card-20-usd-itunes-key-united-states.html',
    name: 'Apple iTunes Gift Card 20 USD iTunes Key UNITED STATES',
    short: 'Apple iTunes 20 USD', price: 78, cat: 'cards', sub: 'itunes', kind: 'art',
    img: P + 'apple-itunes-gift-card-20-usd.webp',
    tags: ['Apple', 'Gift Card'],
    blurb: 'Twenty dollars of App Store and iTunes credit for US accounts.',
    guide: "## How to redeem\n1. On your iPhone, open the **App Store**\n2. Tap your picture at the top, then **Redeem Gift Card or Code**\n3. Tap **Enter Code Manually** and paste your code\n\n## Good to know\n- For **United States** Apple accounts only\n- Works for apps, games, iCloud+, Apple Music and more",
    specs: ['Apple', '20 USD', 'United States']
  },
  {
    id: 'valorant-20', url: S + 'valorant-EUW/59-valorant-gift-card-20-eur-europe.html',
    name: 'VALORANT Gift Card 20 EUR — EUROPE',
    short: 'VALORANT 20 EUR', price: 74, cat: 'cards', sub: 'valorant', kind: 'art',
    img: P + 'valorant-gift-card-20-eur-europe.webp',
    tags: ['Riot', 'Gift Card'],
    blurb: 'Valorant Points for the European region.',
    specs: ['Riot', '20 EUR', 'Europe']
  },
  {
    id: 'lol-20', url: S + 'league-of-legends-rp/67-valorant-gift-card-20-eur-europe.html',
    name: 'League of Legends Gift Card 20€ Riot Key — EUROPE',
    short: 'League of Legends 20 EUR', price: 74, cat: 'cards', sub: 'lol', kind: 'art',
    img: P + 'league-of-legends-gift-card-20-eur.webp',
    tags: ['Riot', 'Gift Card'],
    blurb: 'Riot Points for League of Legends on European servers.',
    specs: ['Riot', '20 EUR', 'Europe']
  },

  /* ---- Mobile top-ups ------------------------------------------------ */
  {
    id: 'efootball-1000', url: S + 'efootball-2027/431-efootball-1000-coins.html',
    name: 'EFOOTBALL 1000 Coins',
    short: 'eFootball 1000 Coins', price: 35, cat: 'mobile', sub: 'efootball', kind: 'art',
    img: P + 'efootball-1000-coins.webp',
    tags: ['eFootball', 'Top-up'],
    blurb: 'A thousand eFootball coins, credited straight to your account.',
    specs: ['eFootball 2027', '1000 coins', 'Fast top-up']
  },
  {
    id: 'efootball-5000', url: S + 'efootball-2027/434-efootball-5000-coins.html',
    name: 'EFOOTBALL 5000 Coins',
    short: 'eFootball 5000 Coins', price: 160, cat: 'mobile', sub: 'efootball', kind: 'art',
    img: P + 'efootball-5000-coins.webp',
    tags: ['eFootball', 'Top-up'], badge: 'Best value',
    blurb: 'The big pack — five thousand coins for the new season.',
    specs: ['eFootball 2027', '5000 coins', 'Fast top-up']
  },
  {
    id: 'pubg-3850', url: S + 'pubg-mobile/459-pubg-mobile-3850-uc.html',
    name: 'PUBG Mobile 3850 UC',
    short: 'PUBG Mobile 3850 UC', price: 190, cat: 'mobile', sub: 'pubg', kind: 'art',
    img: P + 'pubg-mobile-3850-uc.webp',
    tags: ['PUBG Mobile', 'Top-up'],
    blurb: '3850 Unknown Cash, topped up by player ID.',
    specs: ['PUBG Mobile', '3850 UC', 'By player ID']
  },

  /* ---- Software & subscriptions ------------------------------------- */
  {
    id: 'win11', url: S + 'software-licenses/512-windows11-pro.html',
    name: 'Windows 10/11 Professional Key — Tunisia',
    short: 'Windows 11 Pro', price: 20, cat: 'software', sub: 'licenses', kind: 'art',
    img: P + 'windows11-pro.webp',
    tags: ['Software', 'Licence'], badge: 'Cheapest',
    blurb: 'A Pro licence for Windows 10 or 11, at twenty dinars.',
    specs: ['Windows 10/11', 'Pro', 'Instant delivery']
  },
  {
    id: 'nitro-1m', url: S + 'software-licenses/514-discord-nitro-key-1-month.html',
    name: 'DISCORD NITRO KEY 1 MONTH',
    short: 'Discord Nitro — 1 month', price: 35, cat: 'software', sub: 'licenses', kind: 'art',
    img: P + 'discord-nitro-1-month.webp',
    tags: ['Subscription', 'Discord'],
    blurb: 'A month of Nitro: bigger uploads, HD streaming, custom emoji everywhere.',
    specs: ['Discord', '1 month', 'Instant delivery']
  },

  /* ---- added from the store's subcategories ---------------------- */
  {
    id: 'steam-20-eur', url: S + 'steam-euro/86-steam-wallet-gift-card-20-eur-steam-key-france.html',
    name: 'Steam Wallet Gift Card 20 EUR Steam Key FRANCE',
    short: 'Steam Wallet 20 EUR (FR)', price: 83, cat: 'cards', sub: 'steam', kind: 'art',
    img: P + 'steam-20-eur.webp',
    tags: ['Steam', 'Gift Card'],
    specs: ['Steam', 'France', 'Instant delivery']
  },
  {
    id: 'steam-300-try', url: S + 'steam-turkey/79-steam-wallet-gift-card-20-usd-steam-key-turkey.html',
    name: 'Steam Wallet Gift Card 300 TRY Steam Key TURKEY',
    short: 'Steam Wallet 300 TRY (TR)', price: 85, cat: 'cards', sub: 'steam', kind: 'art',
    img: P + 'steam-300-try.webp',
    tags: ['Steam', 'Gift Card'],
    specs: ['Steam', 'Turkey', 'Instant delivery']
  },
  {
    id: 'psn-25-usd', url: S + 'playstation-usa/119-playstation-network-card-25-usd-usa-psn-key-united-states.html',
    name: 'PlayStation Network Card 25 USD (USA) PSN Key UNITED STATES',
    short: 'PlayStation 25 USD (US)', price: 100, cat: 'cards', sub: 'playstation', kind: 'art',
    img: P + 'psn-25-usd.webp',
    tags: ['PlayStation', 'Gift Card'],
    specs: ['PlayStation', 'United States', 'Instant delivery']
  },
  {
    id: 'psn-80-eur', url: S + 'playstation-france/1422-playstation-network-card-80-eur-fr-psn-key-france.html',
    name: 'PlayStation Network Card 80 EUR (FR) PSN Key FRANCE',
    short: 'PlayStation 80 EUR (FR)', price: 312, cat: 'cards', sub: 'playstation', kind: 'art',
    img: P + 'psn-80-eur.webp',
    tags: ['PlayStation', 'Gift Card'],
    specs: ['PlayStation', 'France', 'Instant delivery']
  },
  {
    id: 'psn-20-usd', url: S + 'playstation-usa/118-playstation-network-card-20-usd-usa-psn-key-united-states.html',
    name: 'PlayStation Network Card 20 USD (USA) PSN Key UNITED STATES',
    short: 'PlayStation 20 USD (US)', price: 78, cat: 'cards', sub: 'playstation', kind: 'art',
    img: P + 'psn-20-usd.webp',
    tags: ['PlayStation', 'Gift Card'],
    specs: ['PlayStation', 'United States', 'Instant delivery']
  },
  {
    id: 'itunes-50-eur', url: S + 'itunes-france/611-apple-itunes-gift-card-5-eur-itunes-key-france.html',
    name: 'Apple iTunes Gift Card 50 EUR iTunes Key FRANCE',
    short: 'Apple iTunes 50 EUR (FR)', price: 200, cat: 'cards', sub: 'itunes', kind: 'art',
    img: P + 'itunes-50-eur.webp',
    tags: ['Apple iTunes', 'Gift Card'],
    specs: ['Apple iTunes', 'France', 'Instant delivery']
  },
  {
    id: 'itunes-20-eur', url: S + 'itunes-france/610-apple-itunes-gift-card-20-eur-itunes-key-france.html',
    name: 'Apple iTunes Gift Card 20 EUR iTunes Key FRANCE',
    short: 'Apple iTunes 20 EUR (FR)', price: 85, cat: 'cards', sub: 'itunes', kind: 'art',
    img: P + 'itunes-20-eur.webp',
    tags: ['Apple iTunes', 'Gift Card'],
    specs: ['Apple iTunes', 'France', 'Instant delivery']
  },
  {
    id: 'xbox-10-eur', url: S + 'xbox-gift-card/600-xbox-live-gift-card-5-eur-xbox-live-key-france.html',
    name: 'Xbox Live Gift Card 10 EUR Xbox Live Key FRANCE',
    short: 'Xbox 10 EUR (FR)', price: 40, cat: 'cards', sub: 'xbox', kind: 'art',
    img: P + 'xbox-10-eur.webp',
    tags: ['Xbox', 'Gift Card'],
    specs: ['Xbox', 'France', 'Instant delivery']
  },
  {
    id: 'gamepass-1m', url: S + 'xbox-game-pass/511-xbox-game-pass-ultimate-1-month-xbox-live-key-france.html',
    name: 'Xbox Game Pass Ultimate 1 Month - Xbox Live Key - FRANCE',
    short: 'Xbox Game Pass Ultimate · 1 month', price: 80, cat: 'cards', sub: 'xbox', kind: 'art',
    img: P + 'gamepass-1m.webp',
    tags: ['Xbox', 'Subscription'],
    specs: ['Xbox', 'France', 'Instant delivery']
  },
  {
    id: 'gamepass-3m', url: S + 'xbox-game-pass/509-xbox-game-pass-ultimate-1-month-xbox-live-key-india.html',
    name: 'Xbox Game Pass Ultimate 3 Month - Xbox Live Key - INDIA',
    short: 'Xbox Game Pass Ultimate · 3 months', price: 60, cat: 'cards', sub: 'xbox', kind: 'art',
    img: P + 'gamepass-3m.webp',
    tags: ['Xbox', 'Subscription'],
    specs: ['Xbox', 'India', 'Instant delivery']
  },
  {
    id: 'valorant-500-try', url: S + 'valorant-TURKEY/779-valorant-gift-card-450-try-riot-games-key-turkey.html',
    name: 'Valorant Gift Card 500 TRY Riot Games Key TURKEY',
    short: 'VALORANT 500 TRY (TR)', price: 60, cat: 'cards', sub: 'valorant', kind: 'art',
    img: P + 'valorant-500-try.webp',
    tags: ['Riot Games', 'Gift Card'],
    specs: ['Riot Games', 'Turkey', 'Instant delivery']
  },
  {
    id: 'valorant-450-try', url: S + 'valorant-TURKEY/74-valorant-gift-card-450-try-riot-games-key-turkey.html',
    name: 'Valorant Gift Card 450 TRY Riot Games Key TURKEY',
    short: 'VALORANT 450 TRY (TR)', price: 55, cat: 'cards', sub: 'valorant', kind: 'art',
    img: P + 'valorant-450-try.webp',
    tags: ['Riot Games', 'Gift Card'],
    specs: ['Riot Games', 'Turkey', 'Instant delivery']
  },
  {
    id: 'lol-15', url: S + 'league-of-legends-rp/68-valorant-gift-card-15-eur-europe.html',
    name: 'League of Legends Gift Card 15€ Riot Key - EUROPE',
    short: 'League of Legends 15 EUR', price: 60, cat: 'cards', sub: 'lol', kind: 'art',
    img: P + 'lol-15.webp',
    tags: ['Riot Games', 'Gift Card'],
    specs: ['Riot Games', 'Europe', 'Instant delivery']
  },
  {
    id: 'fortnite-gilded', url: S + 'fortnite-vbucks/1671-gilded-elites-pack.html',
    name: 'Gilded Elites Pack',
    short: 'Fortnite Gilded Elites Pack', price: 70, cat: 'cards', sub: 'fortnite', kind: 'art',
    img: P + 'fortnite-gilded.webp',
    tags: ['Fortnite', 'Bundle'],
    specs: ['Fortnite', 'Global', 'Instant delivery']
  },
  {
    id: 'fortnite-crew-2m', url: S + 'fortnite-vbucks/103-fortnite-3-month-crew-all-platform.html',
    name: 'Fortnite -2 Month Crew, All Platform',
    short: 'Fortnite Crew · 2 months', price: 70, cat: 'cards', sub: 'fortnite', kind: 'art',
    img: P + 'fortnite-crew-2m.webp',
    tags: ['Fortnite', 'Subscription'],
    specs: ['Fortnite', 'All platforms', 'Instant delivery']
  },
  {
    id: 'razer-20', url: S + 'razer-gold/534-razer-gold-20-usd-razer-key-global.html',
    name: 'Razer Gold 20 USD - Razer Key - GLOBAL',
    short: 'Razer Gold 20 USD', price: 78, cat: 'cards', sub: 'razer', kind: 'art',
    img: P + 'razer-20.webp',
    tags: ['Razer Gold', 'Gift Card'],
    specs: ['Razer Gold', 'Global', 'Instant delivery']
  },
  {
    id: 'razer-10', url: S + 'razer-gold/533-razer-gold-10-usd-razer-key-global.html',
    name: 'Razer Gold 10 USD - Razer Key - GLOBAL',
    short: 'Razer Gold 10 USD', price: 40, cat: 'cards', sub: 'razer', kind: 'art',
    img: P + 'razer-10.webp',
    tags: ['Razer Gold', 'Gift Card'],
    specs: ['Razer Gold', 'Global', 'Instant delivery']
  },
  {
    id: 'nintendo-25', url: S + 'nintendo-gift-cards/699--nintendo-gift-card-25-euro-.html',
    name: 'NINTENDO GIFT CARD 25 EURO',
    short: 'Nintendo eShop 25 EUR', price: 100, cat: 'cards', sub: 'nintendo', kind: 'art',
    img: P + 'nintendo-25.webp',
    tags: ['Nintendo', 'Gift Card'],
    specs: ['Nintendo', 'Europe', 'Instant delivery']
  },
  {
    id: 'nintendo-15', url: S + 'nintendo-gift-cards/700-nintendo-gift-card-15-euro.html',
    name: 'NINTENDO GIFT CARD 15 EURO',
    short: 'Nintendo eShop 15 EUR', price: 65, cat: 'cards', sub: 'nintendo', kind: 'art',
    img: P + 'nintendo-15.webp',
    tags: ['Nintendo', 'Gift Card'],
    specs: ['Nintendo', 'Europe', 'Instant delivery']
  },
  {
    id: 'battlenet-50', url: S + 'battlenet-gift-cards/96-battlenet-gift-card-50-eur-key-europe.html',
    name: 'Battle.net Gift Card 50 EUR Key EUROPE',
    short: 'Battle.net 50 EUR', price: 225, cat: 'cards', sub: 'battlenet', kind: 'art',
    img: P + 'battlenet-50.webp',
    tags: ['Battle.net', 'Gift Card'],
    specs: ['Battle.net', 'Europe', 'Instant delivery']
  },
  {
    id: 'battlenet-20', url: S + 'battlenet-gift-cards/97-battlenet-gift-card-20-eur-key-europe.html',
    name: 'Battle.net Gift Card 20 EUR Key EUROPE',
    short: 'Battle.net 20 EUR', price: 90, cat: 'cards', sub: 'battlenet', kind: 'art',
    img: P + 'battlenet-20.webp',
    tags: ['Battle.net', 'Gift Card'],
    specs: ['Battle.net', 'Europe', 'Instant delivery']
  },
  {
    id: 'marvel-1000', url: S + 'marvel-rivals/788-1000-lattices-marvel-rivals-pcplaystationxbox-global.html',
    name: '1000 Lattices Marvel Rivals (PC/PlayStation/Xbox) Global',
    short: 'Marvel Rivals 1000 Lattices', price: 45, cat: 'cards', sub: 'marvel', kind: 'art',
    img: P + 'marvel-1000.webp',
    tags: ['Marvel Rivals', 'In-game currency'],
    specs: ['Marvel Rivals', 'Global', 'Instant delivery']
  },
  {
    id: 'marvel-500', url: S + 'marvel-rivals/787-500-lattices-marvel-rivals-pcplaystationxbox-global.html',
    name: '500 Lattices Marvel Rivals (PC/PlayStation/Xbox) Global',
    short: 'Marvel Rivals 500 Lattices', price: 25, cat: 'cards', sub: 'marvel', kind: 'art',
    img: P + 'marvel-500.webp',
    tags: ['Marvel Rivals', 'In-game currency'],
    specs: ['Marvel Rivals', 'Global', 'Instant delivery']
  },
  {
    id: 'epic-20', url: S + 'epic-game/1941-epic-game-balance-20-usd-topup.html',
    name: 'EPIC GAME BALANCE 20 USD - TOPUP',
    short: 'Epic Games 20 USD', price: 80, cat: 'cards', sub: 'epic', kind: 'art',
    img: P + 'epic-20.webp',
    tags: ['Epic Games', 'Gift Card'],
    specs: ['Epic Games', 'Global', 'Instant delivery']
  },
  {
    id: 'epic-10', url: S + 'epic-game/1940-epic-game-balance-10-usd-topup.html',
    name: 'EPIC GAME BALANCE 10 USD - TOPUP',
    short: 'Epic Games 10 USD', price: 40, cat: 'cards', sub: 'epic', kind: 'art',
    img: P + 'epic-10.webp',
    tags: ['Epic Games', 'Gift Card'],
    specs: ['Epic Games', 'Global', 'Instant delivery']
  },
  {
    id: 'binance-25', url: S + 'binance-gift-cards/1733-binance-25.html',
    name: 'Binance | 25$',
    short: 'Binance 25 USD', price: 100, cat: 'cards', sub: 'binance', kind: 'art',
    img: P + 'binance-25.webp',
    tags: ['Binance', 'Gift Card'],
    specs: ['Binance', 'Global', 'Instant delivery']
  },
  {
    id: 'binance-15', url: S + 'binance-gift-cards/1730-binance-15.html',
    name: 'Binance | 15$',
    short: 'Binance 15 USD', price: 60, cat: 'cards', sub: 'binance', kind: 'art',
    img: P + 'binance-15.webp',
    tags: ['Binance', 'Gift Card'],
    specs: ['Binance', 'Global', 'Instant delivery']
  },
  {
    id: 'redotpay-25', url: S + 'redotpay/1723-redotpay-5.html',
    name: 'RedotPay | 25$',
    short: 'RedotPay 25 USD', price: 100, cat: 'cards', sub: 'redotpay', kind: 'art',
    img: P + 'redotpay-25.webp',
    tags: ['RedotPay', 'Gift Card'],
    specs: ['RedotPay', 'Global', 'Instant delivery']
  },
  {
    id: 'redotpay-20', url: S + 'redotpay/1722-redotpay-5.html',
    name: 'RedotPay | 20$',
    short: 'RedotPay 20 USD', price: 80, cat: 'cards', sub: 'redotpay', kind: 'art',
    img: P + 'redotpay-20.webp',
    tags: ['RedotPay', 'Gift Card'],
    specs: ['RedotPay', 'Global', 'Instant delivery']
  },
  {
    id: 'bybit-25', url: S + 'bybit/1742-bybit-25.html',
    name: 'Bybit | 25$',
    short: 'Bybit 25 USD', price: 100, cat: 'cards', sub: 'bybit', kind: 'art',
    img: P + 'bybit-25.webp',
    tags: ['Bybit', 'Gift Card'],
    specs: ['Bybit', 'Global', 'Instant delivery']
  },
  {
    id: 'bybit-20', url: S + 'bybit/1741-bybit-20.html',
    name: 'Bybit | 20$',
    short: 'Bybit 20 USD', price: 80, cat: 'cards', sub: 'bybit', kind: 'art',
    img: P + 'bybit-20.webp',
    tags: ['Bybit', 'Gift Card'],
    specs: ['Bybit', 'Global', 'Instant delivery']
  },
  {
    id: 'ufl-1050', url: S + 'ufl-game/1717-ufl-2150-lp.html',
    name: 'UFL | 1,050 LP',
    short: 'UFL 1,050 LP', price: 40, cat: 'cards', sub: 'ufl', kind: 'art',
    img: P + 'ufl-1050.webp',
    tags: ['UFL', 'In-game currency'],
    specs: ['UFL', 'Global', 'Instant delivery']
  },
  {
    id: 'ufl-starter', url: S + 'ufl-game/1711-ufl-starter-bundle.html',
    name: 'UFL | Starter Bundle',
    short: 'UFL Starter Bundle', price: 20, cat: 'cards', sub: 'ufl', kind: 'art',
    img: P + 'ufl-starter.webp',
    tags: ['UFL', 'Bundle'],
    specs: ['UFL', 'Global', 'Instant delivery']
  },
  {
    id: 'efootball-1500', url: S + 'efootball-2027/2276-efootball-1500-coins-special-offer.html',
    name: 'EFOOTBALL 1500 Coins | Special Offer',
    short: 'eFootball 1500 Coins', price: 35, cat: 'mobile', sub: 'efootball', kind: 'art',
    img: P + 'efootball-1500.webp',
    tags: ['eFootball', 'Top-up'],
    specs: ['eFootball', 'Global', 'Fast top-up']
  },
  {
    id: 'efootball-500', url: S + 'efootball-2027/2277-efootball-500-coins-special-offer.html',
    name: 'EFOOTBALL 500 Coins | Special Offer',
    short: 'eFootball 500 Coins', price: 12, cat: 'mobile', sub: 'efootball', kind: 'art',
    img: P + 'efootball-500.webp',
    tags: ['eFootball', 'Top-up'],
    specs: ['eFootball', 'Global', 'Fast top-up']
  },
  {
    id: 'pubg-660', url: S + 'pubg-mobile/457-pubg-mobile-660-uc.html',
    name: 'PUBG Mobile 660 UC Tunisia',
    short: 'PUBG Mobile 660 UC', price: 50, cat: 'mobile', sub: 'pubg', kind: 'art',
    img: P + 'pubg-660.webp',
    tags: ['PUBG Mobile', 'Top-up'],
    specs: ['PUBG Mobile', 'Global', 'Fast top-up']
  },
  {
    id: 'pubg-325', url: S + 'pubg-mobile/456-pubg-mobile-325-uc.html',
    name: 'PUBG Mobile 325 UC Tunisia',
    short: 'PUBG Mobile 325 UC', price: 30, cat: 'mobile', sub: 'pubg', kind: 'art',
    img: P + 'pubg-325.webp',
    tags: ['PUBG Mobile', 'Top-up'],
    specs: ['PUBG Mobile', 'Global', 'Fast top-up']
  },
  {
    id: 'freefire-monthly', url: S + 'free-fire-id/685-monthly-membership-free-fire-subscription-30-days.html',
    name: 'monthly membership free fire subscription 30 days',
    short: 'Free Fire Monthly Membership', price: 46, cat: 'mobile', sub: 'freefire', kind: 'art',
    img: P + 'freefire-monthly.webp',
    tags: ['Free Fire', 'Subscription'],
    specs: ['Free Fire', 'Global', 'Fast top-up']
  },
  {
    id: 'freefire-1080', url: S + 'free-fire-id/447-freefire-1080-diamonds-pin.html',
    name: 'FreeFire 1080 Diamonds PIN',
    short: 'Free Fire 1080 Diamonds', price: 42, cat: 'mobile', sub: 'freefire', kind: 'art',
    img: P + 'freefire-1080.webp',
    tags: ['Free Fire', 'Top-up'],
    specs: ['Free Fire', 'Global', 'Fast top-up']
  },
  {
    id: 'codm-880', url: S + 'call-of-duty-mobile/419-call-of-duty-mobile-880-point.html',
    name: 'CALL OF DUTY MOBILE 880 POINT',
    short: 'CoD Mobile 880 CP', price: 40, cat: 'mobile', sub: 'codm', kind: 'art',
    img: P + 'codm-880.webp',
    tags: ['CoD Mobile', 'Top-up'],
    specs: ['CoD Mobile', 'Global', 'Fast top-up']
  },
  {
    id: 'codm-420', url: S + 'call-of-duty-mobile/422-call-of-duty-mobile-440-point.html',
    name: 'CALL OF DUTY MOBILE 420 POINT',
    short: 'CoD Mobile 420 CP', price: 20, cat: 'mobile', sub: 'codm', kind: 'art',
    img: P + 'codm-420.webp',
    tags: ['CoD Mobile', 'Top-up'],
    specs: ['CoD Mobile', 'Global', 'Fast top-up']
  },
  {
    id: 'coc-2500', url: S + 'clash-of-clans/452-2500-gems.html',
    name: 'Clash of clans 2500 gems',
    short: 'Clash of Clans 2500 Gems', price: 84, cat: 'mobile', sub: 'coc', kind: 'art',
    img: P + 'coc-2500.webp',
    tags: ['Clash of Clans', 'Top-up'],
    specs: ['Clash of Clans', 'Global', 'Fast top-up']
  },
  {
    id: 'coc-500', url: S + 'clash-of-clans/450-500-gems.html',
    name: 'Clash of clans 500 gems',
    short: 'Clash of Clans 500 Gems', price: 20, cat: 'mobile', sub: 'coc', kind: 'art',
    img: P + 'coc-500.webp',
    tags: ['Clash of Clans', 'Top-up'],
    specs: ['Clash of Clans', 'Global', 'Fast top-up']
  },
  {
    id: 'cr-diamond', url: S + 'clash-royale/575-diamond-pass.html',
    name: 'DIAMOND PASS',
    short: 'Clash Royale Diamond Pass', price: 48, cat: 'mobile', sub: 'clashroyale', kind: 'art',
    img: P + 'cr-diamond.webp',
    tags: ['Clash Royale', 'Pass'],
    specs: ['Clash Royale', 'Global', 'Fast top-up']
  },
  {
    id: 'cr-gold', url: S + 'clash-royale/574-gold-pass.html',
    name: 'GOLD PASS',
    short: 'Clash Royale Gold Pass', price: 26, cat: 'mobile', sub: 'clashroyale', kind: 'art',
    img: P + 'cr-gold.webp',
    tags: ['Clash Royale', 'Pass'],
    specs: ['Clash Royale', 'Global', 'Fast top-up']
  },
  {
    id: 'bs-plus', url: S + 'brawlstars/498-brawl-stars-plus.html',
    name: 'Brawl Stars PLUS',
    short: 'Brawl Stars Pass Plus', price: 44, cat: 'mobile', sub: 'brawlstars', kind: 'art',
    img: P + 'bs-plus.webp',
    tags: ['Brawl Stars', 'Pass'],
    specs: ['Brawl Stars', 'Global', 'Fast top-up']
  },
  {
    id: 'bs-80', url: S + 'brawlstars/501-80-250-points.html',
    name: '80 point',
    short: 'Brawl Stars 80 Points', price: 21, cat: 'mobile', sub: 'brawlstars', kind: 'art',
    img: P + 'bs-80.webp',
    tags: ['Brawl Stars', 'Top-up'],
    specs: ['Brawl Stars', 'Global', 'Fast top-up']
  },
  {
    id: 'roblox-2000', url: S + 'roblox/137-2000-roblox-roblox-tunisia.html',
    name: 'Buy 2000 Roblox Robux in Tunisia',
    short: 'Roblox 2000 Robux', price: 80, cat: 'mobile', sub: 'roblox', kind: 'art',
    img: P + 'roblox-2000.webp',
    tags: ['Roblox', 'Top-up'],
    specs: ['Roblox', 'Global', 'Fast top-up']
  },
  {
    id: 'roblox-1000', url: S + 'roblox/134-1000-robux-roblox-tunisia.html',
    name: 'Buy 1000 Roblox Robux in Tunisia',
    short: 'Roblox 1000 Robux', price: 40, cat: 'mobile', sub: 'roblox', kind: 'art',
    img: P + 'roblox-1000.webp',
    tags: ['Roblox', 'Top-up'],
    specs: ['Roblox', 'Global', 'Fast top-up']
  },
  {
    id: 'genshin-980', url: S + 'genshin-impact/437-genshin-impact-980-crystals.html',
    name: 'Genshin Impact 980 Crystals',
    short: 'Genshin Impact 980 Crystals', price: 60, cat: 'mobile', sub: 'genshin', kind: 'art',
    img: P + 'genshin-980.webp',
    tags: ['Genshin Impact', 'Top-up'],
    specs: ['Genshin Impact', 'Global', 'Fast top-up']
  },
  {
    id: 'genshin-300', url: S + 'genshin-impact/436-genshin-impact-300-crystals.html',
    name: 'Genshin Impact 300 Crystals',
    short: 'Genshin Impact 300 Crystals', price: 20, cat: 'mobile', sub: 'genshin', kind: 'art',
    img: P + 'genshin-300.webp',
    tags: ['Genshin Impact', 'Top-up'],
    specs: ['Genshin Impact', 'Global', 'Fast top-up']
  },
  {
    id: 'wildrift-1850', url: S + 'league-of-legends-wild-rift/505-league-of-legends-wild-rift.html',
    name: '1850 point',
    short: 'Wild Rift 1850 Points', price: 108, cat: 'mobile', sub: 'wildrift', kind: 'art',
    img: P + 'wildrift-1850.webp',
    tags: ['Wild Rift', 'Top-up'],
    specs: ['Wild Rift', 'Global', 'Fast top-up']
  },
  {
    id: 'wildrift-pass', url: S + 'league-of-legends-wild-rift/2164-twilight-pass.html',
    name: 'Twilight Pass',
    short: 'Wild Rift Twilight Pass', price: 40, cat: 'mobile', sub: 'wildrift', kind: 'art',
    img: P + 'wildrift-pass.webp',
    tags: ['Wild Rift', 'Pass'],
    specs: ['Wild Rift', 'Global', 'Fast top-up']
  },
  {
    id: 'fcm-1500', url: S + 'fc-mobile-android/2249-mobile-1500-fp-bundle-daily-limit-1.html',
    name: 'Mobile | 1500 FP Bundle (Daily Limit: 1)',
    short: 'FC Mobile 1500 FP Bundle', price: 50, cat: 'mobile', sub: 'fcmobile', kind: 'art',
    img: P + 'fcm-1500.webp',
    tags: ['FC Mobile', 'Top-up'],
    specs: ['FC Mobile', 'Global', 'Fast top-up']
  },
  {
    id: 'fcm-520', url: S + 'fc-mobile-android/2235-fc-mobile-520-fc-points.html',
    name: 'FC Mobile | 520 FC Points',
    short: 'FC Mobile 520 FC Points', price: 25, cat: 'mobile', sub: 'fcmobile', kind: 'art',
    img: P + 'fcm-520.webp',
    tags: ['FC Mobile', 'Top-up'],
    specs: ['FC Mobile', 'Global', 'Fast top-up']
  },
  {
    id: 'mlbb-625', url: S + 'mobile-legends-bang-bang/2263-mobile-legends-bang-bang-62581-diamonds.html',
    name: 'Mobile Legends: Bang Bang | 625+81 Diamonds',
    short: 'Mobile Legends 625+81 Diamonds', price: 52, cat: 'mobile', sub: 'mlbb', kind: 'art',
    img: P + 'mlbb-625.webp',
    tags: ['Mobile Legends', 'Top-up'],
    specs: ['Mobile Legends', 'Global', 'Fast top-up']
  },
  {
    id: 'mlbb-234', url: S + 'mobile-legends-bang-bang/2262-mobile-legends-bang-bang-23423-diamonds.html',
    name: 'Mobile Legends: Bang Bang | 234+23 Diamonds',
    short: 'Mobile Legends 234+23 Diamonds', price: 20, cat: 'mobile', sub: 'mlbb', kind: 'art',
    img: P + 'mlbb-234.webp',
    tags: ['Mobile Legends', 'Top-up'],
    specs: ['Mobile Legends', 'Global', 'Fast top-up']
  },
  {
    id: 'hsr-2240', url: S + '-honkai-star-rail/1098-oneiric-shard-2240.html',
    name: 'ONEIRIC SHARD 2240',
    short: 'Honkai: Star Rail 2240 Oneiric Shards', price: 90, cat: 'mobile', sub: 'hsr', kind: 'art',
    img: P + 'hsr-2240.webp',
    tags: ['Honkai: Star Rail', 'Top-up'],
    specs: ['Honkai: Star Rail', 'Global', 'Fast top-up']
  },
  {
    id: 'hsr-pass', url: S + '-honkai-star-rail/1102-express-supply-pass.html',
    name: 'Express Supply Pass',
    short: 'Honkai: Star Rail Express Supply Pass', price: 20, cat: 'mobile', sub: 'hsr', kind: 'art',
    img: P + 'hsr-pass.webp',
    tags: ['Honkai: Star Rail', 'Pass'],
    specs: ['Honkai: Star Rail', 'Global', 'Fast top-up']
  },
  {
    id: 'wuwa-1090', url: S + 'wuthering-waves/2162-1090-lunite.html',
    name: '1090 Lunite',
    short: 'Wuthering Waves 1090 Lunite', price: 60, cat: 'mobile', sub: 'wuwa', kind: 'art',
    img: P + 'wuwa-1090.webp',
    tags: ['Wuthering Waves', 'Top-up'],
    specs: ['Wuthering Waves', 'Global', 'Fast top-up']
  },
  {
    id: 'wuwa-sub', url: S + 'wuthering-waves/2158-lunite-subscription.html',
    name: 'Lunite Subscription',
    short: 'Wuthering Waves Lunite Subscription', price: 20, cat: 'mobile', sub: 'wuwa', kind: 'art',
    img: P + 'wuwa-sub.webp',
    tags: ['Wuthering Waves', 'Subscription'],
    specs: ['Wuthering Waves', 'Global', 'Fast top-up']
  },
  {
    id: 'wos-999', url: S + 'whiteout-survival/1396--whiteout-survival-99-frost-star.html',
    name: 'Whiteout Survival 999 Frost Star',
    short: 'Whiteout Survival 999 Frost Stars', price: 40, cat: 'mobile', sub: 'whiteout', kind: 'art',
    img: P + 'wos-999.webp',
    tags: ['Whiteout Survival', 'Top-up'],
    specs: ['Whiteout Survival', 'Global', 'Fast top-up']
  },
  {
    id: 'wos-molly', url: S + 'whiteout-survival/2232-whiteout-survival-molly-s-blessing.html',
    name: 'Whiteout Survival | Molly\'s Blessing',
    short: 'Whiteout Survival Molly’s Blessing', price: 25, cat: 'mobile', sub: 'whiteout', kind: 'art',
    img: P + 'wos-molly.webp',
    tags: ['Whiteout Survival', 'Bundle'],
    specs: ['Whiteout Survival', 'Global', 'Fast top-up']
  },
  {
    id: 'bloodstrike-500', url: S + 'blood-strike-mobile/494-100-gold-blood-strike-mobilesteam.html',
    name: '500 GOLD BLOOD STRIKE MOBILE/STEAM',
    short: 'Blood Strike 500 Gold', price: 20, cat: 'mobile', sub: 'bloodstrike', kind: 'art',
    img: P + 'bloodstrike-500.webp',
    tags: ['Blood Strike', 'Top-up'],
    specs: ['Blood Strike', 'Mobile / Steam', 'Fast top-up']
  },
  {
    id: 'bloodstrike-300', url: S + 'blood-strike-mobile/493-300-gold-blood-strike-mobilesteam.html',
    name: '300 GOLD BLOOD STRIKE MOBILE/STEAM',
    short: 'Blood Strike 300 Gold', price: 12, cat: 'mobile', sub: 'bloodstrike', kind: 'art',
    img: P + 'bloodstrike-300.webp',
    tags: ['Blood Strike', 'Top-up'],
    specs: ['Blood Strike', 'Mobile / Steam', 'Fast top-up']
  },
  {
    id: 'warzone-2400', url: S + 'warzone-mobile/425-2400-warzone-cp.html',
    name: '2400 Warzone CP',
    short: 'Warzone Mobile 2400 CP', price: 77, cat: 'mobile', sub: 'warzone', kind: 'art',
    img: P + 'warzone-2400.webp',
    tags: ['Warzone Mobile', 'Top-up'],
    specs: ['Warzone Mobile', 'Global', 'Fast top-up']
  },
  {
    id: 'warzone-500', url: S + 'warzone-mobile/423-500-warzone-cp.html',
    name: '500 Warzone CP',
    short: 'Warzone Mobile 500 CP', price: 20, cat: 'mobile', sub: 'warzone', kind: 'art',
    img: P + 'warzone-500.webp',
    tags: ['Warzone Mobile', 'Top-up'],
    specs: ['Warzone Mobile', 'Global', 'Fast top-up']
  },
  {
    id: 'fc-coins-400k', url: S + 'fc-27-coins/1628-400k-safe-70-coins-pc.html',
    name: '400K Safe 7.0 Coins PC',
    short: 'EA FC 400K Coins (PC)', price: 170, cat: 'games', sub: 'topups', kind: 'art',
    img: P + 'fc-coins-400k.webp',
    tags: ['EA FC', 'Top-up'],
    specs: ['EA FC', 'PC', 'Fast top-up']
  },
  {
    id: 'gta-700m', url: S + '-gta-5-online-boosting/1010-700-million-money-150-million-cash550-million-casino-chipsfast-runany-lvl-of-your-choicemax-statsunlock-all.html',
    name: '700+ MILLION Money (150+ MILLION CASH+550 MILLION CASINO CHIPS)+FAST RUN+ANY LVL of your choice+MAX STATS+UNLOCK ALL',
    short: 'GTA Online 700M+ Money Boost', price: 100, cat: 'games', sub: 'topups', kind: 'art',
    img: P + 'gta-700m.webp',
    tags: ['GTA Online', 'Boost'],
    specs: ['GTA Online', 'PC', 'Fast top-up']
  },
  {
    id: 'rl-3000', url: S + 'rocket-league/1092--rocket-league-7500-credits.html',
    name: 'Rocket League 3000 Credits',
    short: 'Rocket League 3000 Credits', price: 100, cat: 'games', sub: 'topups', kind: 'art',
    img: P + 'rl-3000.webp',
    tags: ['Rocket League', 'Top-up'],
    specs: ['Rocket League', 'Global', 'Fast top-up']
  },
  {
    id: 'ps-callisto', url: S + 'playstation-games/1463-the-callisto-protocol.html',
    name: 'The Callisto Protocol',
    short: 'The Callisto Protocol', price: 270, cat: 'games', sub: 'ps', kind: 'art',
    img: P + 'ps-callisto.webp',
    tags: ['PlayStation', 'PS5 game'],
    specs: ['PlayStation', 'PlayStation', 'Instant delivery']
  },
  {
    id: 'ps-mindseye', url: S + 'playstation-games/1464-mindseye.html',
    name: 'MindsEye',
    short: 'MindsEye', price: 230, cat: 'games', sub: 'ps', kind: 'art',
    img: P + 'ps-mindseye.webp',
    tags: ['PlayStation', 'PS5 game'],
    specs: ['PlayStation', 'PlayStation', 'Instant delivery']
  },
  {
    id: 'ps-demons-souls', url: S + 'playstation-games/1443-demons-souls-acount.html',
    name: 'Demon’s Souls',
    short: 'Demon’s Souls', price: 270, cat: 'games', sub: 'ps', kind: 'art',
    img: P + 'ps-demons-souls.webp',
    tags: ['PlayStation', 'PS5 game'],
    specs: ['PlayStation', 'PlayStation', 'Instant delivery']
  },
  {
    id: 'mcafee', url: S + 'software-licenses/1565-mcafee-total-protection-1.html',
    name: 'McAfee Total Protection | 1',
    short: 'McAfee Total Protection', price: 60, cat: 'software', sub: 'licenses', kind: 'art',
    img: P + 'mcafee.webp',
    tags: ['McAfee', 'Security'],
    specs: ['McAfee', '1 device', 'Instant delivery']
  },
  {
    id: 'kaspersky', url: S + 'software-licenses/522-kaspersky-total-security-.html',
    name: 'Kaspersky Total Security',
    short: 'Kaspersky Total Security', price: 40, cat: 'software', sub: 'licenses', kind: 'art',
    img: P + 'kaspersky.webp',
    tags: ['Kaspersky', 'Security'],
    specs: ['Kaspersky', 'PC', 'Instant delivery']
  },
  {
    id: 'word-2024', url: S + 'software-licenses/1530-microsoft-word-2024-bind-pcmac.html',
    name: 'Microsoft Word 2024 BIND PC/MAC',
    short: 'Microsoft Word 2024', price: 140, cat: 'software', sub: 'licenses', kind: 'art',
    img: P + 'word-2024.webp',
    tags: ['Microsoft', 'Office'],
    specs: ['Microsoft', 'PC / Mac', 'Instant delivery']
  },
  {
    id: 'avast', url: S + 'software-licenses/520-avast-premium-security-2024-cd-key.html',
    name: 'AVAST Premium Security 2024 CD KEY',
    short: 'Avast Premium Security', price: 45, cat: 'software', sub: 'licenses', kind: 'art',
    img: P + 'avast.webp',
    tags: ['Avast', 'Security'],
    specs: ['Avast', 'PC', 'Instant delivery']
  },
  {
    id: 'dramabox-week', url: S + 'mobile-apps/2219-dramabox-weekly-membership.html',
    name: 'DramaBox | Weekly Membership',
    short: 'DramaBox Weekly Membership', price: 80, cat: 'software', sub: 'apps', kind: 'art',
    img: P + 'dramabox-week.webp',
    tags: ['DramaBox', 'App credit'],
    specs: ['DramaBox', 'Global', 'Fast top-up']
  },
  {
    id: 'tango-600', url: S + 'mobile-apps/758-600-coin.html',
    name: '600 COIN TANGO',
    short: 'Tango 600 Coins', price: 25, cat: 'software', sub: 'apps', kind: 'art',
    img: P + 'tango-600.webp',
    tags: ['Tango', 'App credit'],
    specs: ['Tango', 'Global', 'Fast top-up']
  }
];

/* …and the rest of the store's games, gift cards, top-ups and software, imported
   from techgarage.tn by scripts/import_catalogue.py (see catalog.js). */
for (const p of LIVE) PRODUCTS.push({ kind: 'art', ...p, url: S + p.url });

export const HW_SUBS = ['pcs', 'monitors', 'keyboards', 'mice', 'headsets', 'controllers', 'chairs', 'mousepads', 'gpu', 'cpu', 'motherboards', 'ram', 'storage', 'psu', 'cases', 'cooling', 'cables', 'printers', 'combos'];   // hardware sub-categories, in menu order
export const CATEGORIES = [
  { id: 'all' },
  { id: 'games',    subs: ['accounts', 'keys', 'topups', 'ps', 'xboxgames'] },
  { id: 'cards',    grouped: true, subs: ['steam', 'playstation', 'itunes', 'xbox', 'valorant', 'lol', 'fortnite', 'razer', 'nintendo',
                           'battlenet', 'marvel', 'epic', 'binance', 'redotpay', 'bybit', 'ufl'] },
  { id: 'mobile',   grouped: true, subs: ['efootball', 'pubg', 'freefire', 'codm', 'coc', 'clashroyale', 'brawlstars', 'roblox', 'genshin',
                           'wildrift', 'fcmobile', 'mlbb', 'hsr', 'wuwa', 'whiteout', 'bloodstrike', 'warzone'] },
  { id: 'software', subs: ['licenses', 'apps'] },
  { id: 'hardware', subs: HW_SUBS.filter(sub => PRODUCTS.some(p => p.cat === 'hardware' && p.sub === sub)) }   // physical products, shipped
];

/* Subcategory names that are brands read the same in every language;
   the generic ones (accounts, keys…) are translated in i18n.js. */
export const SUB_NAMES = {
  steam: 'Steam', playstation: 'PlayStation', itunes: 'Apple iTunes', xbox: 'Xbox', valorant: 'VALORANT',
  lol: 'League of Legends', fortnite: 'Fortnite', razer: 'Razer Gold', nintendo: 'Nintendo', battlenet: 'Battle.net',
  marvel: 'Marvel Rivals', epic: 'Epic Games', binance: 'Binance', redotpay: 'RedotPay', bybit: 'Bybit', ufl: 'UFL',
  efootball: 'eFootball', pubg: 'PUBG Mobile', freefire: 'Free Fire', codm: 'Call of Duty Mobile', coc: 'Clash of Clans',
  clashroyale: 'Clash Royale', brawlstars: 'Brawl Stars', roblox: 'Roblox', genshin: 'Genshin Impact',
  wildrift: 'LoL: Wild Rift', fcmobile: 'FC Mobile', mlbb: 'Mobile Legends', hsr: 'Honkai: Star Rail',
  wuwa: 'Wuthering Waves', whiteout: 'Whiteout Survival', bloodstrike: 'Blood Strike', warzone: 'Warzone Mobile'
};

/* Hero carousel — ids resolved against PRODUCTS */
export const HERO = ['minecraft', 'bo7', 'elden-ring', 'fc27', 'ac-shadows', 'wukong'];

/* Left column: newest arrivals */
export const NEW_DROPS = ['nba2k26', 'fc27', 'efootball-5000', 'f1-2025', 'split-fiction', 'steam-50'];

/* Left column, lower card: the shopper's recent activity */
export const RECENT = [
  { id: 'elden-ring',  note: 'deliveredOn', date: '2026-11-12' },
  { id: 'steam-20',    note: 'inBasket' },
  { id: 'valorant-20', note: 'deliveredOn', date: '2026-11-03' },
  { id: 'minecraft',   note: 'viewedYesterday' }
];

/* Account shown in the top-right chip — a demo identity. `avatar` names a
   file in assets/avatars (generated by scripts/build_avatars.py). */
export const ACCOUNT = {
  name: 'Sami Ben Ali',
  handle: '@samibenali',
  email: 'sami.benali@example.com',
  phone: '+216 20 000 000',
  avatar: 'sami',
  since: 'March 2025'
};

export const AVATARS = ['sami', 'yassine', 'mariem', 'oussama', 'nour'];

export const NOTIFICATIONS = [   // wording lives in i18n.js under the same id
  { id: 'n4', who: 'yassine', ago: 12, unit: 'm', href: '#/orders' },
  { id: 'n3', who: 'mariem',  ago: 2,  unit: 'h', href: '#/product/steam-50', price: 190 },
  { id: 'n2', who: 'oussama', ago: 1,  unit: 'd', href: '#/product/win11', price: 20 },
  { id: 'n1', who: 'nour',    ago: 2,  unit: 'd', href: '#/orders' }
];

/* The shopper's earlier orders — demo history, consistent with RECENT above. */
export const ORDERS_SEED = [
  { id: 'TG-1042', date: '2026-11-12T14:20:00', items: [['elden-ring', 1]],                     status: 'delivered', payment: 'clictopay' },
  { id: 'TG-1037', date: '2026-11-03T19:05:00', items: [['valorant-20', 1], ['efootball-1000', 1]], status: 'delivered', payment: 'd17',
    accounts: { efootball: { method: 'loginFull', email: 'sami.benali@example.com', uid: '512 873 229', platform: 'android' } } },
  { id: 'TG-1029', date: '2026-10-21T10:41:00', items: [['minecraft', 1], ['steam-20', 1]],     status: 'delivered', payment: 'clictopay' }
];

/* ClicToPay is the gateway techgarage.tn shows (bank cards: Visa, Mastercard,
   e-Dinar). D17 and bank transfer are common in Tunisia — confirm with the store. */
export const PAYMENT_METHODS = ['clictopay', 'cardintl', 'd17', 'ooredoo', 'transfer', 'cod'];   // cod: only for physical orders in Tunisia   // names in i18n.js

/* What each method adds to the order: a percentage of the subtotal, or a flat
   amount in dinars. Shown on the option and as its own line in the summary. */
export const PAYMENT_FEES = {
  clictopay: { pct: 2.5 },   // bank fees, card issued in Tunisia
  cardintl:  { pct: 3.5 },   // bank fees, card issued abroad (Visa / Mastercard)
  d17:       { pct: 1 },
  ooredoo:   { pct: 15 },   // Ooredoo Pay: paid from Ooredoo mobile credit
  transfer:  { flat: 5 },
  cod:       { flat: 0 }    // cash on delivery
};

/* How each mobile game is topped up. Some publishers credit by player ID;
   others need the shopper's game login so the store can sign in and buy.
     loginFull — email + password + UID + Android/iOS
     login     — email + password
     id        — player ID (every game not listed) */
export const TOPUP_METHOD = {
  efootball: 'loginFull', codm: 'loginFull',
  coc: 'login', wildrift: 'login', brawlstars: 'login', genshin: 'login', '8ball': 'login',
  fcmobile: 'login', wuwa: 'login', clashroyale: 'login', roblox: 'login', hsr: 'login'
};

export const ACCENTS = [   // names in i18n.js as acc.<id>
  { id: 'teal',   value: '#38a699' },
  { id: 'blue',   value: '#4f8cff' },
  { id: 'violet', value: '#9b7bff' },
  { id: 'orange', value: '#ff9f43' },
  { id: 'pink',   value: '#ff6fa8' }
];


export const STORE = {
  name: 'TechGarage',
  domain: 'techgarage.tn',
  phone: '+216 58 578 111',
  legalName: 'TechGarage',   // the registered business name, for the legal pages and footer
  regNo: '',                 // company registration (RNE) number
  taxId: '',                 // tax ID (matricule fiscal)
  email: 'Commercial@techgarage.site',
  address: 'Rue Hssan Achoura, 5100 Mahdia, Tunisia',
  hours: [
    ['day.week', '8:00 – 21:00'],
    ['day.sat',  '9:00 – 20:00'],
    ['day.sun',  '10:00 – 19:00']
  ]
};


const STORE_SHIPPED = JSON.parse(JSON.stringify(STORE));
export const FEES_SHIPPED = JSON.parse(JSON.stringify(PAYMENT_FEES));
export const METHODS_SHIPPED = [...PAYMENT_METHODS];

/* ══════════════════════════════════════════════════════════════════════
   Store owner's edits (admin dashboard)
   Everything above is the catalogue as shipped. Edits made in #/admin are
   kept as a small record in the browser (localStorage "tg.admin") and laid
   over that catalogue: added and edited products, removed ones, categories
   and subcategories, names, and what each page section shows. The arrays
   and objects above are updated in place, so every page sees the result.
   ══════════════════════════════════════════════════════════════════════ */
export const ADMIN_KEY = 'tg.admin';

const copy = v => JSON.parse(JSON.stringify(v));
/* Games: each product is one version of a game — a platform (PC / Xbox / PS5)
   delivered as a key or an account. Products that share `game` are shown on one
   page with a platform and key/account picker; every game has its own page.
   Fresh accounts and keys on techgarage.tn are PC (Steam / Ubisoft); the
   PlayStation games are PS5. Top-ups aren't game versions. */
const GAME_PLATFORM = { accounts: 'pc', keys: 'pc', ps: 'ps5', xboxgames: 'xbox' };
for (const p of PRODUCTS) {
  if (p.cat !== 'games' || !GAME_PLATFORM[p.sub]) continue;
  p.game ??= GAME_OF[p.id] ?? p.id.replace(/^ps-/, '');
  p.platform ??= GAME_PLATFORM[p.sub];
}

/* Steam media for every game (steam.js, made by scripts/enrich_from_steam.py):
   screenshots for the photo strip, the wide banner (also the blurred page
   background), the trailer over the main picture and, on PC versions, the
   system requirements. A product's own media and the owner's edits win. */
const STEAM_IMG = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/';
const STEAM_MOV = 'https://cdn.akamai.steamstatic.com/steam/apps/';
for (const p of PRODUCTS) {
  const s = p.cat === 'games' && p.game && STEAM[p.game];
  if (!s) continue;
  if (!p.gallery && s.s?.length) p.gallery = s.s.map(h => `${STEAM_IMG}${s.a}/${s.n ? h + '/' : ''}ss_${h}.1920x1080.jpg`);
  if (!p.wall && s.h) { p.wall = `${STEAM_IMG}${s.a}/library_hero.jpg`; if (!p.banner) p.wallBg ??= true; }
  if (!p.video && s.v) p.video = { sd: `${STEAM_MOV}${s.v}/movie480_vp9.webm`, ...(s.vh ? { hd: `${STEAM_MOV}${s.v}/movie_max_vp9.webm` } : {}) };
  if (!p.sysreq && s.r && p.platform === 'pc') p.sysreq = s.r;
}
/* Gift cards, top-ups, software, hardware and the games Steam has no banner for:
   a generated banner (scripts/brand_banners.py, keyed in brand-art.js) as its own
   block and the blurred page background; and, for brands that are games on Steam,
   that game's photos and trailer. (Other packs' pictures stay off the photo strip:
   they show other amounts.) */
for (const p of PRODUCTS) {
  const key = ART[p.id];
  if (!key) continue;
  if (!p.wall) { p.wall = `assets/products/brands/${key}.webp`; if (!p.banner) p.wallBg ??= true; }
  if (p.gallery || p.cat === 'hardware') continue;
  const s = p.cat === 'cards' || p.cat === 'mobile' ? STEAM['sub:' + p.sub] : null;
  const steam = s?.s?.length ? s.s.map(h => `${STEAM_IMG}${s.a}/${s.n ? h + '/' : ''}ss_${h}.1920x1080.jpg`) : [];
  const app = key.startsWith('as-') ? APPS[key.slice(3)] : null;   // official App Store screenshots
  const g = steam.length ? steam : app?.s || [];
  if (g.length) p.gallery = g;
  if (!p.video && s?.v) p.video = { sd: `${STEAM_MOV}${s.v}/movie480_vp9.webm`, ...(s.vh ? { hd: `${STEAM_MOV}${s.v}/movie_max_vp9.webm` } : {}) };
}

/* Facts for the Details table: who makes it, what it runs on, its currency. */
const MOBILE_ONLY = ['Android', 'iOS'];
export const BRAND_INFO = {
  efootball: { pub: 'Konami', on: ['Android', 'iOS', 'PC', 'PlayStation', 'Xbox'], cur: 'eFootball Coins' },
  pubg: { pub: 'Level Infinite (Tencent)', on: MOBILE_ONLY, cur: 'UC' }, freefire: { pub: 'Garena', on: MOBILE_ONLY, cur: 'Diamonds' },
  codm: { pub: 'Activision', on: MOBILE_ONLY, cur: 'COD Points (CP)' }, coc: { pub: 'Supercell', on: MOBILE_ONLY, cur: 'Gems' },
  clashroyale: { pub: 'Supercell', on: MOBILE_ONLY, cur: 'Gems' }, brawlstars: { pub: 'Supercell', on: MOBILE_ONLY, cur: 'Gems' },
  roblox: { pub: 'Roblox Corporation', on: ['Android', 'iOS', 'PC', 'Xbox', 'PlayStation'], cur: 'Robux' },
  genshin: { pub: 'HoYoverse', on: ['Android', 'iOS', 'PC', 'PlayStation'], cur: 'Genesis Crystals' },
  wildrift: { pub: 'Riot Games', on: MOBILE_ONLY, cur: 'Wild Cores' }, fcmobile: { pub: 'EA Sports', on: MOBILE_ONLY, cur: 'FC Points' },
  mlbb: { pub: 'Moonton', on: MOBILE_ONLY, cur: 'Diamonds' }, hsr: { pub: 'HoYoverse', on: ['Android', 'iOS', 'PC', 'PlayStation'], cur: 'Oneiric Shards' },
  wuwa: { pub: 'Kuro Games', on: ['Android', 'iOS', 'PC', 'PlayStation'], cur: 'Lunites' },
  whiteout: { pub: 'Century Games', on: MOBILE_ONLY, cur: 'Packs & Frost Stars' }, bloodstrike: { pub: 'NetEase Games', on: ['Android', 'iOS', 'PC'], cur: 'Golds' },
  warzone: { pub: 'Activision', on: MOBILE_ONLY, cur: 'COD Points (CP)' },
  steam: { on: ['PC (Steam)'] }, playstation: { on: ['PS5', 'PS4', 'PlayStation Store'] }, itunes: { on: ['iPhone', 'iPad', 'Mac', 'Apple TV'] },
  xbox: { on: ['Xbox Series X|S', 'Xbox One', 'Windows PC'] }, nintendo: { on: ['Nintendo Switch'] }, epic: { on: ['PC (Epic Games Store)'] },
  fortnite: { on: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'] }, lol: { on: ['PC'] }, valorant: { on: ['PC', 'PlayStation', 'Xbox'] },
  razer: { on: ['PC', 'Mobile'] }, battlenet: { on: ['PC (Battle.net)'] }, marvel: { on: ['PC', 'PlayStation', 'Xbox'] }, ufl: { on: ['PlayStation', 'Xbox'] },
  binance: { on: ['Binance app'] }, bybit: { on: ['Bybit app'] }, redotpay: { on: ['RedotPay app'] },
  'sw-windows': { on: ['Windows PC'] }, 'sw-office': { on: ['Windows PC', 'Mac'] }, 'sw-security': { on: ['Windows', 'Mac', 'Android', 'iOS'] },
  'sw-vpn': { on: ['Windows', 'Mac', 'Android', 'iOS'] }, 'sw-subs': { on: ['TV', 'Phone', 'PC', 'Tablet'] }, 'sw-ai': { on: ['Web', 'Android', 'iOS'] },
  'sw-creative': { on: ['Windows', 'Mac'] }, 'sw-tools': { on: ['Windows PC'] }
};
export { ART, KIND };
export const PLATFORMS = ['pc', 'xbox', 'ps5'];

const SHIPPED = copy({ PRODUCTS, CATEGORIES, SUB_NAMES, HERO, NEW_DROPS });

/* Products the owner removed. Past orders still need their name and price,
   so they stay readable here but are no longer listed anywhere. */
export const RETIRED = [];
/* Category names the owner typed, per language: { id: { en, fr, ar } } */
export const CAT_NAMES = {};
/* What each page section shows. hidden: { key: true }, titles: { key: { en, fr, ar } },
   shelf: product ids, or empty for the automatic pick. */
export const PAGE_SECTIONS = { hidden: {}, titles: {}, shelf: [], ticker: [], picks: [], best: [] };

/* Home page extras. The owner changes all of these in Store admin → Promotions
   (banner, code, sales) and → Page sections (rolling bar, picks, rows). */
export const PROMO = {};    // the promo banner and its checkout code
export const SALES = {};    // { productId: { pct, until } } — live sale prices
/* The owner's own wording and settings (Store admin → Store settings, Texts, Orders) */
export const TEXTS = {};        // { key: { en, fr, ar } } — any phrase on the site, reworded
export const FAQ_OVR = {};      // { en: [[question, answer]…], fr: […], ar: […] }
export const SITE = {};         // { accent: '#rrggbb' } — the store's colour for visitors who haven't picked one
export const ORDER_STATUS = {};
export const ORDER_TRACK = {};   // { orderId: { carrier, number } } — physical orders, set by the owner // { orderId: 'processing' | 'delivered' | 'cancelled' } — set by the owner
/* Shop mode. "preview": on a hosted copy (e.g. Vercel) a bar says the store is
   a preview and checkout is off, because orders and payments need a server
   that doesn't exist yet. On this computer (localhost or the file) everything
   works as usual for testing. Change to "live" once orders reach a real server. */
export const SHOP_MODE = 'preview';
/* Other currencies prices can be shown in: 1 TND = rate × currency. Payment
   is always taken in Tunisian dinars; other currencies are an estimate. */
export const CURRENCY_RATES = {};
/* Delivery of physical products (delivery: 'ship'), set in Store admin → Shipping.
   Fees in dinars; free = the order amount from which delivery is free (0 = never);
   days = the delivery time shown to shoppers; countries = ISO codes served abroad
   ([] = everywhere). Cash on delivery is a payment method (Payment methods card). */
export const SHIPPING_DEFAULTS = {
  tn:      { on: true,  fee: 8,  free: 300, days: '24–72 h' },
  express: { on: false, fee: 15, free: 0,   days: '24 h' },
  intl:    { on: false, fee: 70, free: 0,   days: '7–15 days', countries: [] },
  pickup:  { on: true,  address: '' }        // '' = the store's address
};
export const SHIPPING = JSON.parse(JSON.stringify(SHIPPING_DEFAULTS));
export const SHIP_METHODS = ['tn', 'express', 'intl', 'pickup'];
export const LEGAL_OVR = {};
export const RATE_MANUAL = [];   // currencies the owner prices by hand; the others follow the live rate   // { terms: { en, fr, ar }, privacy: …, refunds: …, notice: … } — the owner's wording
export const BUNDLES = [];  // [{ id, name: { en, fr, ar }, items: [productId…], pct }]
export const FLASH = {};    // { id, pct } — the flash sale of the day, until midnight
export const EXTRAS = {};   // { reviews: [{ name, stars, text, product? }], whatsapp: '216…' }
/** A sale price: whole or half dinars, never below 0.5 DT. */
export const salePrice = (base, pct) => Math.max(0.5, Math.round(base * (100 - pct) / 50) / 2);
const SALE_END = '2026-12-01T00:00:00';
const HOME_DEFAULTS = {
  ticker: ['bo7', 'fc27', 'elden-ring', 'gta5', 'minecraft', 'wukong', 'nba2k26', 'steam-20', 'psn-20', 'valorant-20', 'efootball-1000', 'win11'],
  picks: ['gta5', 'minecraft', 'tlou2', 'split-fiction', 'nba2k26', 'f1-2025'],
  /* the owner's best sellers: ranked after what real orders of the last 30 days sold */
  best: ['bo7', 'fc27', 'gta5', 'minecraft', 'steam-20', 'efootball-1000', 'valorant-20', 'psn-20', 'pubg-660', 'win11'],
  bundles: [
    { id: 'steam-starter', name: { en: 'Steam starter', fr: 'Pack Steam', ar: 'باقة Steam' }, items: ['elden-ring', 'steam-20'], pct: 10 },
    { id: 'football-fan', name: { en: 'Football fan', fr: 'Fan de foot', ar: 'لعشّاق كرة القدم' }, items: ['fc27', 'efootball-1000'], pct: 10 },
    { id: 'work-and-play', name: { en: 'Work and play', fr: 'Travail et jeu', ar: 'عمل ولعب' }, items: ['win11', 'nitro-1m'], pct: 15 }
  ],
  flash: { id: 'gta5', pct: 30 },
  reviews: [],               // real reviews only: the owner adds them in the admin
  /* approximate rates (1 TND in each currency); the owner keeps them up to date */
  currencies: { EUR: 0.29, USD: 0.34, GBP: 0.25, SAR: 1.27, AED: 1.24, CAD: 0.47, MAD: 3.1 },
  whatsapp: STORE.phone.replace(/\D/g, ''),
  promo: {
    on: true, link: 'deals', art: 'minecraft', code: 'TECH10', codePct: 10,
    title: { en: 'Black Friday week', fr: 'Semaine du Black Friday', ar: 'أسبوع الجمعة السوداء' },
    text: { en: 'Games, gift cards and software at their lowest prices of the year, until Cyber Monday. Add code TECH10 at checkout for 10% more.',
            fr: 'Jeux, cartes cadeaux et logiciels au plus bas de l’année, jusqu’au Cyber Monday. Ajoutez le code TECH10 au paiement pour 10 % de plus.',
            ar: 'الألعاب وبطاقات الهدايا والبرامج بأقل أسعار السنة حتى الاثنين الإلكتروني. أضف الرمز TECH10 عند الدفع لخصم إضافي 10٪.' },
    cta: { en: 'Shop the deals', fr: 'Voir les promos', ar: 'تسوّق العروض' }
  },
  sales: {
    'red-dead-redemption-2-37': { pct: 30, until: SALE_END }, 'baldurs-gate-3-2112': { pct: 25, until: SALE_END },
    'forza-horizon-5-487': { pct: 20, until: SALE_END }, 'tekken-8-2084': { pct: 25, until: SALE_END },
    'palworld-1676': { pct: 20, until: SALE_END }, 'battlefield-6-1382': { pct: 15, until: SALE_END },
    'ghost-of-tsushima-directors-cut-1831': { pct: 20, until: SALE_END }, 'razer-gold-50-usd-535': { pct: 10, until: SALE_END },
    'fortnite-2400-v-bucks-99': { pct: 15, until: SALE_END }, 'discord-nitro-1-year-515': { pct: 20, until: SALE_END },
    'nord-vpn-1-month-518': { pct: 25, until: SALE_END }, 'pubg-mobile-1800-uc-458': { pct: 10, until: SALE_END }
  }
};
export const homeDefaults = () => HOME_DEFAULTS;

/* Sale prices replace the price everywhere (shop, basket, checkout); the old
   price is kept as `was`. A sale past its end date simply doesn't apply. */
function applySales(sales) {
  reset(SALES, copy(sales));
  const now = Date.now();
  for (const p of PRODUCTS) {
    const s = sales[p.id];
    if (!s || !(s.pct >= 1 && s.pct <= 90) || (s.until && Date.parse(s.until) <= now)) continue;
    p.was = p.price;
    p.price = salePrice(p.price, s.pct);
    p.sale = { pct: s.pct, until: s.until || null };
  }
}

const refill = (arr, items) => arr.splice(0, arr.length, ...items);
const reset = (obj, ...sources) => { for (const k of Object.keys(obj)) delete obj[k]; Object.assign(obj, ...sources); };

/* A hosted copy with no edits saved in this browser starts from the owner's published record. */
const HOSTED = typeof location !== 'undefined' && !['localhost', '127.0.0.1', '', '[::1]'].includes(location.hostname);
export function loadAdmin() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(ADMIN_KEY)); } catch {}
  return cleanAdmin(saved ?? (HOSTED ? PUBLISHED_RECORD : {}));
}

export function applyAdmin(a = {}) {
  a = cleanAdmin(a);   // a damaged save or import can't break the shop
  const removed = new Set(a.removed || []);
  const edited = a.edited || {};
  const shipped = SHIPPED.PRODUCTS.map(p => (edited[p.id] ? { ...p, ...edited[p.id] } : p));
  const all = [...shipped, ...(a.added || [])];
  refill(PRODUCTS, copy(all.filter(p => !removed.has(p.id))));
  refill(RETIRED, copy(all.filter(p => removed.has(p.id))));
  refill(CATEGORIES, copy(a.categories || SHIPPED.CATEGORIES));
  reset(SUB_NAMES, SHIPPED.SUB_NAMES, a.subNames || {});
  reset(CAT_NAMES, a.catNames || {});
  refill(HERO, a.hero || SHIPPED.HERO);
  refill(NEW_DROPS, a.drops || SHIPPED.NEW_DROPS);
  reset(PAGE_SECTIONS, { hidden: { ...(a.hidden || {}) }, titles: copy(a.titles || {}), shelf: [...(a.shelf || [])],
    ticker: [...(a.ticker || HOME_DEFAULTS.ticker)], picks: [...(a.picks || HOME_DEFAULTS.picks)], best: [...(a.best || HOME_DEFAULTS.best)] });
  reset(PROMO, copy(HOME_DEFAULTS.promo), a.promo ? copy(a.promo) : {});
  applySales(a.sales || HOME_DEFAULTS.sales);
  refill(BUNDLES, copy(a.bundles || HOME_DEFAULTS.bundles));
  reset(TEXTS, copy(a.texts || {}));
  reset(CURRENCY_RATES, copy(a.currencies || HOME_DEFAULTS.currencies));
  reset(LEGAL_OVR, copy(a.legal || {}));
  refill(RATE_MANUAL, [...(a.ratesManual || [])]);
  reset(FAQ_OVR, copy(a.faq || {}));
  reset(SITE, a.site ? copy(a.site) : {});
  reset(ORDER_STATUS, { ...(a.orderStatus || {}) });
  reset(ORDER_TRACK, copy(a.tracking || {}));
  reset(SHIPPING, ...Object.keys(SHIPPING_DEFAULTS).map(k => ({ [k]: { ...SHIPPING_DEFAULTS[k], ...(a.shipping?.[k] || {}) } })));
  // store details and payment methods: the shipped ones with the owner's changes
  reset(STORE, copy(STORE_SHIPPED), a.store ? copy(a.store) : {});
  const pay = a.payments || {};
  reset(PAYMENT_FEES, ...Object.keys(FEES_SHIPPED).map(m => ({ [m]: pay[m]?.fee ? copy(pay[m].fee) : copy(FEES_SHIPPED[m]) })));
  const on = METHODS_SHIPPED.filter(m => pay[m]?.on !== false);
  refill(PAYMENT_METHODS, on.length ? on : [METHODS_SHIPPED[0]]);
  applyFlash(a.flash || HOME_DEFAULTS.flash);
  reset(EXTRAS, { reviews: copy(a.reviews || HOME_DEFAULTS.reviews), whatsapp: a.whatsapp ?? HOME_DEFAULTS.whatsapp, google: copy(a.google || {}) });
}

/* The flash sale of the day: one product at a big discount until midnight,
   every day, while its home section is switched on. It wins over a smaller sale. */
const nextMidnight = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.toISOString(); };
function applyFlash(f) {
  reset(FLASH, f?.id ? copy(f) : {});
  const p = PRODUCTS.find(x => x.id === FLASH.id);
  if (!p || !(FLASH.pct >= 1 && FLASH.pct <= 90) || PAGE_SECTIONS.hidden.flash) return;
  if (p.sale && p.sale.pct >= FLASH.pct) { p.sale.flash = true; return; }
  const base = p.was ?? p.price;
  p.was = base;
  p.price = salePrice(base, FLASH.pct);
  p.sale = { pct: FLASH.pct, until: nextMidnight(), flash: true };
}

/** The shipped catalogue, for the dashboard's "reset" and "edited" markers. */
export const shipped = () => SHIPPED;

applyAdmin(loadAdmin());
