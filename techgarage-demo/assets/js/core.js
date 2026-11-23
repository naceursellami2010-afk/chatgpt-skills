/* TechGarage demo — shared state, store actions and UI primitives.
   Everything a page needs lives here so the views stay declarative. */

import { PRODUCTS, CATEGORIES, SUB_NAMES, ACCOUNT, ORDERS_SEED, NOTIFICATIONS, TOPUP_METHOD, PAYMENT_FEES } from './data.js?v=20261123c';
import { t, plural, price, date, word, blurb, num } from './i18n.js?v=20261123c';

/* ── helpers ───────────────────────────────────────────────────────── */
export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

/* ── brand families ────────────────────────────────────────────────────
   Gift cards and mobile games are browsed one brand at a time: the shop
   shows one tile per brand, and the product page switches region and
   value inside it. Region and value are read from the store's own titles. */
export const FAMILY_CATS = ['cards', 'mobile'];
export const familyOf = p => (p && FAMILY_CATS.includes(p.cat) ? p.sub : null);
export const familyVariants = fam => PRODUCTS.filter(p => familyOf(p) === fam);
export const familyLead = fam => familyVariants(fam)[0];

const REGION_RULES = [[/\(FR\)|FRANCE/i, 'FR'], [/UNITED STATES|\(US\)|USA/i, 'US'], [/TURKEY|\(TR\)/i, 'TR'],
                      [/INDIA/i, 'IN'], [/EUROPE|EURO\b|€/i, 'EU']];
export const regionOf = p => (REGION_RULES.find(([re]) => re.test(p.name + ' ' + p.short)) || [, 'GL'])[1];

const prefixCache = {};
function familyPrefix(fam) {
  if (fam in prefixCache) return prefixCache[fam];
  const names = familyVariants(fam).map(p => p.short);
  let pre = names[0] || '';
  for (const n of names) while (!n.startsWith(pre)) pre = pre.slice(0, -1);
  if (names.length < 2) pre = SUB_NAMES[fam] && names[0]?.startsWith(SUB_NAMES[fam]) ? SUB_NAMES[fam] : '';
  return (prefixCache[fam] = pre.slice(0, pre.lastIndexOf(' ') + 1));
}
/** "Steam Wallet 20 EUR (FR)" → "20 EUR"; "Fortnite Crew · 2 months" → "Crew · 2 months". */
export const valueOf = p => {
  const fam = familyOf(p);
  let v = fam ? p.short.slice(familyPrefix(fam).length) : p.short;
  v = v.replace(/\s*\((?:FR|US|TR|EU|IN)\)\s*$/, '').replace(/^[·\s]+/, '').trim();
  return v || p.short;
};

export const tnd = price;
export const fmtDate = date;

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const catLabel = id => id && CATEGORIES.some(c => c.id === id) ? t('cat.' + id) : t('cat.allProducts');
export const subLabel = id => SUB_NAMES[id] || t('sub.' + id);
export const subsOf = cat => (CATEGORIES.find(c => c.id === cat) || {}).subs || [];
export const avatarSrc = name => `assets/avatars/${name}.png`;
export const payLabel = id => t('pay.' + (id === 'card' ? 'clictopay' : id));   // 'card' = orders saved before ClicToPay

/** Navigate; re-runs the route when the hash is already current. */
export function go(hash) {
  if (location.hash === hash) dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

/* ── icons ─────────────────────────────────────────────────────────── */
const svg = (d, w = 16, sw = 2, cls = '') =>
  `<svg${cls ? ` class="${cls}"` : ''} width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

/* Icons with a direction carry class "dir" so right-to-left layouts mirror them. */
export const ICON = {
  cart:   svg('<path d="M3 4h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.3a1.8 1.8 0 0 0 1.8-1.4L21 8H6.2"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>', 15),
  plus:   svg('<path d="M12 5v14M5 12h14"/>', 16, 2.4),
  minus:  svg('<path d="M5 12h14"/>', 14, 2.4),
  bolt:   svg('<path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>', 15),
  check:  svg('<path d="M20 6L9 17l-5-5"/>', 15, 2.6),
  dots:   '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  heart:  svg('<path d="M20.3 5.6a5 5 0 0 0-7.1 0L12 6.8l-1.2-1.2a5 5 0 1 0-7.1 7.1l8.3 8.3 8.3-8.3a5 5 0 0 0 0-7.1z"/>', 15),
  heartOn:'<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.3 5.6a5 5 0 0 0-7.1 0L12 6.8l-1.2-1.2a5 5 0 1 0-7.1 7.1l8.3 8.3 8.3-8.3a5 5 0 0 0 0-7.1z"/></svg>',
  copy:   svg('<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 15),
  eye:    svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 15),
  eyeOff: svg('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.3 4.2M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>', 15),
  out:    svg('<path d="M7 17L17 7M9 7h8v8"/>', 11, 2.4, 'dir'),
  chev:   svg('<path d="M9 6l6 6-6 6"/>', 14, 2.2, 'dir'),
  down:   svg('<path d="M6 9l6 6 6-6"/>', 12, 2.4),
  mail:   svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>', 20, 1.8),
  phone:  svg('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>', 20, 1.8),
  pin:    svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', 20, 1.8),
  clock:  svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 20, 1.8),
  key:    svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>', 18, 1.8),
  box:    svg('<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>', 18, 1.8),
  user:   svg('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>', 18, 1.8),
  shield: svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>', 18, 1.8),
  bell:   svg('<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.2 7.5-2.2 7.5h16.4S18 14.5 18 8.5"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>', 18, 1.8),
  palette:svg('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="14.5" cy="7" r="1.2"/>', 18, 1.8),
  lock:   svg('<rect x="4" y="10.5" width="16" height="11" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>', 18, 1.8),
  globe:  svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', 18, 1.8),
  download: svg('<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>', 16),
  heartBig: svg('<path d="M20.3 5.6a5 5 0 0 0-7.1 0L12 6.8l-1.2-1.2a5 5 0 1 0-7.1 7.1l8.3 8.3 8.3-8.3a5 5 0 0 0 0-7.1z"/>', 34, 1.4),
  cartBig:  svg('<path d="M3 4h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.3a1.8 1.8 0 0 0 1.8-1.4L21 8H6.2"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>', 34, 1.4),
  search:   svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.4-3.4"/>', 34, 1.4)
};

/* ── persistence ───────────────────────────────────────────────────── */
const KEYS = ['tg.cart', 'tg.wish', 'tg.prefs', 'tg.profile', 'tg.orders', 'tg.viewed', 'tg.read', 'tg.lang'];

const load = (k, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback; }
  catch { return fallback; }
};
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const DEFAULT_PREFS = {
  accent: '#38a699',
  animatedBg: true,
  reduceMotion: false,
  twoFactor: false,
  channel: 'email',
  notify: { orders: true, stock: true, prices: true, news: false }
};

const storedPrefs = load('tg.prefs', {});
const known = id => id in byId;

/* Saved data can outlive the catalogue (an earlier build sold hardware), so
   anything that no longer exists is dropped on load. */
const cleanCart = Object.fromEntries(Object.entries(load('tg.cart', {})).filter(([id, q]) => known(id) && Number.isInteger(q) && q > 0));

export const state = {
  cart: cleanCart,
  wish: new Set(load('tg.wish', []).filter(known)),
  prefs: { ...DEFAULT_PREFS, ...storedPrefs, notify: { ...DEFAULT_PREFS.notify, ...(storedPrefs.notify || {}) } },
  profile: { ...ACCOUNT, ...load('tg.profile', {}) },
  orders: load('tg.orders', []).filter(o => o.items?.every(([id]) => known(id))),
  viewed: load('tg.viewed', []).filter(known),
  read: new Set(load('tg.read', []))
};

/* ── tiny event bus: views re-render when the data they show changes ── */
const subs = {};
export const on   = (ev, fn) => (subs[ev] ||= new Set()).add(fn);
export const off  = (ev, fn) => subs[ev]?.delete(fn);
export const emit = ev => subs[ev]?.forEach(fn => fn());

/* ── basket ────────────────────────────────────────────────────────── */
export const cartQty   = () => Object.values(state.cart).reduce((a, b) => a + b, 0);
export const cartTotal = () => Object.entries(state.cart).reduce((s, [id, q]) => s + byId[id].price * q, 0);

/* ── payment fees ─────────────────────────────────────────────────────
   The dinar has 1000 millimes, so fees are kept to three decimals. */
const roundMillimes = n => Math.round(n * 1000) / 1000;
const feeRule = method => PAYMENT_FEES[method === 'card' ? 'clictopay' : method] || {};
export const paymentFee = (method, subtotal) => {
  const r = feeRule(method);
  return roundMillimes(r.pct ? subtotal * r.pct / 100 : r.flat || 0);
};
/** "+2.5%" or "+5 DT" — the label on each payment option. */
export const feeLabel = method => {
  const r = feeRule(method);
  return r.pct ? `+${num(r.pct)}%` : r.flat ? `+${price(r.flat)}` : '';
};

export function addToCart(id, qty = 1, fromImg = null) {
  state.cart[id] = Math.min((state.cart[id] || 0) + qty, 10);
  save('tg.cart', state.cart);
  emit('cart');
  if (fromImg) fly(fromImg, byId[id]);
  toast(t('toast.added', { name: byId[id].short }), true);
}

export function setQty(id, qty) {
  // anything that isn't a whole number of at least 1 removes the line
  if (!Number.isFinite(qty) || qty < 1) delete state.cart[id];
  else state.cart[id] = Math.min(Math.floor(qty), 10);
  save('tg.cart', state.cart);
  emit('cart');
}

function clearCart() {
  state.cart = {};
  save('tg.cart', state.cart);
  emit('cart');
}

/* ── wishlist & history ────────────────────────────────────────────── */
export function toggleWish(id) {
  const has = state.wish.has(id);
  has ? state.wish.delete(id) : state.wish.add(id);
  save('tg.wish', [...state.wish]);
  emit('wish');
  toast(t(has ? 'toast.removed' : 'toast.saved'), !has);
  return !has;
}

export function markViewed(id) {
  state.viewed = [id, ...state.viewed.filter(x => x !== id)].slice(0, 8);
  save('tg.viewed', state.viewed);
}

export function clearViewed() {
  state.viewed = [];
  save('tg.viewed', state.viewed);
}

/* ── notifications ─────────────────────────────────────────────────── */
export const unreadCount = () => NOTIFICATIONS.filter(n => !state.read.has(n.id)).length;

export function markRead(ids = NOTIFICATIONS.map(n => n.id)) {
  ids.forEach(id => state.read.add(id));
  save('tg.read', [...state.read]);
  emit('notes');
}

/** A notification's text in the current language. */
export const noteText = n => ({
  title: t(n.id + '.t'),
  body: t(n.id + '.b', { price: tnd(n.price || 0) }),
  when: t('ago.' + n.unit, { n: n.ago })
});

/* ── profile & preferences ─────────────────────────────────────────── */
export function saveProfile(patch) {
  Object.assign(state.profile, patch);
  save('tg.profile', state.profile);
  emit('profile');
}

export function savePrefs(patch) {
  Object.assign(state.prefs, patch);
  save('tg.prefs', state.prefs);
  applyPrefs();
}

export function applyPrefs() {
  const root = document.documentElement;
  root.style.setProperty('--teal', state.prefs.accent);
  root.classList.toggle('no-motion', !!state.prefs.reduceMotion);
  root.classList.toggle('still-bg', !state.prefs.animatedBg);
}

export const calm = () =>
  state.prefs.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── orders ────────────────────────────────────────────────────────── */
const DELIVERY_DELAY = 6000;  // a placed demo order "arrives" after a few seconds

const normalise = o => {
  const when = typeof o.date === 'number' ? o.date : Date.parse(o.date);
  const status = o.status === 'processing' && o.deliverAt && Date.now() >= o.deliverAt ? 'delivered' : o.status;
  return { ...o, date: when, status };
};

export const allOrders = () => [...state.orders, ...ORDERS_SEED].map(normalise).sort((a, b) => b.date - a.date);
export const getOrder  = id => allOrders().find(o => o.id === id);
export const orderSubtotal = o => o.items.reduce((s, [id, q]) => s + byId[id].price * q, 0);
export const orderFee = o => paymentFee(o.payment, orderSubtotal(o));
export const orderTotal = o => roundMillimes(orderSubtotal(o) + orderFee(o));
export const orderCount = o => o.items.reduce((s, [, q]) => s + q, 0);

/** Game account details for one order. Passwords are dropped here — they
    are used for the top-up and never written to storage. */
const stripSecrets = accounts => accounts && Object.fromEntries(Object.entries(accounts)
  .map(([sub, { password, ...rest }]) => [sub, rest]));

export function placeOrder({ name, email, phone, payment, accounts }) {
  const next = 1043 + state.orders.length;
  const order = {
    id: `TG-${next}`,
    date: Date.now(),
    items: Object.entries(state.cart),
    status: 'processing',
    deliverAt: Date.now() + DELIVERY_DELAY,
    payment, accounts: stripSecrets(accounts),
    contact: { name, email, phone }
  };
  state.orders.unshift(order);
  save('tg.orders', state.orders);
  clearCart();
  emit('orders');
  return order;
}

/* ── delivery: what the shopper receives, and a demo credential for it ── */
/** How a top-up reaches the game: 'loginFull' | 'login' | 'id' (see TOPUP_METHOD). */
export const topupMethod = p => (p.cat === 'mobile' && TOPUP_METHOD[p.sub]) || 'id';

export function deliveryType(p) {
  if (p.cat === 'mobile' || p.sub === 'topups' || p.sub === 'apps') return 'topup';
  if (p.cat === 'cards') return 'code';
  if (p.tags.some(tag => /account/i.test(tag))) return 'account';
  return 'key';
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function seeded(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return (h >>> 0) % ALPHABET.length;
  };
}
const block = (rand, n) => Array.from({ length: n }, () => ALPHABET[rand()]).join('');

/** Demo credentials only — every one starts with DEMO and none is real. */
export function credential(order, id) {
  const p = byId[id];
  const rand = seeded(order.id + ':' + id);
  switch (deliveryType(p)) {
    case 'account':
      return { label: t('cred.account'), login: `tg.${block(rand, 6).toLowerCase()}@example.com`, secret: `DEMO-${block(rand, 10)}` };
    case 'topup':
    {
      const a = order.accounts?.[p.sub] || order.accounts?.[p.id] || {};
      return { label: t('cred.topup'), note: a.email ? t('cred.loginCredited', { email: a.email })
                                                     : t('cred.credited', { id: a.playerId || order.playerId || '—' }) };
    }
    case 'code':
      return { label: t('cred.code'), secret: 'DEMO-' + [4, 4, 4, 4].map(n => block(rand, n)).join('-') };
    default:
      return { label: t('cred.key'), secret: 'DEMO-' + [5, 5, 5].map(n => block(rand, n)).join('-') };
  }
}

/* ── search ────────────────────────────────────────────────────────── */
/** Hits on the displayed name rank first, then brand / subcategory / tags,
    then the long store title — so "steam" lists the Steam Wallet cards
    before every Fresh Steam Account. Matches English and the current language. */
export function searchProducts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const rank = p => {
    if (p.short.toLowerCase().includes(q)) return 0;
    const meta = [subLabel(p.sub), catLabel(p.cat), ...p.tags, ...p.tags.map(word)].join(' ').toLowerCase();
    if (meta.includes(q)) return 1;
    if (p.name.toLowerCase().includes(q)) return 2;
    return -1;
  };
  return PRODUCTS.map(p => [rank(p), p]).filter(([r]) => r >= 0).sort((a, b) => a[0] - b[0]).map(([, p]) => p);
}

/* ══════════════════════════════════════════════════════════════════════
   Smart photo fit
   Every product photo sits in a .media box. When the picture loads we read
   its real size and transparency and compare it with the box:
     cover   — shapes are close, so it fills the box with almost no crop
     contain — shapes differ, so the whole picture shows on a blurred copy
     cut     — transparent cut-out, shown whole with a shadow, no backdrop
     small   — much smaller than the box, shown at its own size, never blown up
   Boxes marked data-adapt take the picture's own shape instead.
   A ResizeObserver re-checks when the box changes size.
   ══════════════════════════════════════════════════════════════════════ */
export const media = (p, cls = '', { adapt = false, eager = false, alt = '', mode = '' } = {}) =>
  `<div class="media${cls ? ' ' + cls : ''}" data-fit="auto"${adapt ? ' data-adapt="1"' : ''}${mode ? ` data-mode="${mode}"` : ''}>` +
  `<img class="m-bg" src="${p.img}" alt="" aria-hidden="true" decoding="async"${eager ? '' : ' loading="lazy"'}>` +
  `<img class="m-fg" src="${p.img}" alt="${esc(alt)}" decoding="async"${eager ? '' : ' loading="lazy"'}></div>`;

function hasAlpha(img) {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 12;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, 12, 12);
    const d = x.getImageData(0, 0, 12, 12).data;
    return [0, 11, 132, 143].filter(i => d[i * 4 + 3] < 16).length >= 3;   // three transparent corners
  } catch { return false; }   // cross-origin pixels can't be read: treat as opaque
}

export function fitBox(box) {
  const img = box.querySelector('.m-fg');
  if (!img || !img.naturalWidth) return;
  if (box._alpha === undefined) box._alpha = hasAlpha(img);
  const ir = img.naturalWidth / img.naturalHeight;
  if (box.dataset.adapt) {
    box.style.aspectRatio = String(Math.min(1.8, Math.max(0.7, ir)));
    box.dataset.fit = box._alpha ? 'cut' : 'cover';
    return;
  }
  const w = box.clientWidth, h = box.clientHeight;
  if (!w || !h) return;
  box.dataset.shape = ir > 1.15 ? 'wide' : ir < .87 ? 'tall' : 'square';
  if (box.dataset.mode === 'banner') {
    // the hero is made for banners: anything landscape fills it, text sits on the scrim;
    // square and portrait art becomes the feathered side poster
    box.dataset.fit = box._alpha ? 'cut' : ir >= 1.4 ? 'cover' : 'contain';
    return;
  }
  const br = w / h;
  const gap = Math.max(ir, br) / Math.min(ir, br);
  const small = img.naturalWidth < w * .5 && img.naturalHeight < h * .5;
  box.dataset.fit = box._alpha ? 'cut' : small ? 'small' : gap <= 1.3 ? 'cover' : 'contain';
}

const resizer = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(e => fitBox(e.target))) : null;
const track = box => { fitBox(box); resizer?.observe(box); };

document.addEventListener('load', e => {
  if (e.target.classList?.contains('m-fg')) track(e.target.parentElement);
}, true);

/** For pictures that finished loading before their box was in the page. */
export const fitAll = (root = document) =>
  $$('.media', root).forEach(box => { const i = box.querySelector('.m-fg'); if (i?.complete && i.naturalWidth) track(box); });

/* ── shared markup ─────────────────────────────────────────────────── */
export const heartBtn = (p, cls = 'tile-heart') => {
  const yes = state.wish.has(p.id);
  return `<button class="${cls}${yes ? ' on' : ''}" data-wish="${p.id}" aria-pressed="${yes}" aria-label="${esc(t(yes ? 'heart.remove' : 'heart.save', { name: p.short }))}">${yes ? ICON.heartOn : ICON.heart}</button>`;
};

/** The product card used on every shelf and grid. */
export const tile = (p, i = 0) => `
  <article class="tile" data-view="${p.id}" style="--d:${Math.min(i, 12) * 45}ms">
    ${media(p, 'shot')}
    <span class="tile-tag">${esc(word(p.badge || p.tags[1] || p.tags[0]))}</span>
    ${heartBtn(p)}
    <div class="tile-body">
      <div class="txt">
        <h3>${esc(p.short)}</h3>
        <p>${esc(blurb(p))}</p>
        <span class="px">${tnd(p.price)}</span>
      </div>
      <button class="round" data-add="${p.id}" aria-label="${esc(t('buy.addNamed', { name: p.short }))}">${ICON.plus}</button>
    </div>
  </article>`;

/** One tile for a whole brand: lead photo, "From 40 DT", number of options. */
export const familyTile = (fam, i = 0) => {
  const vs = familyVariants(fam), p = vs[0], low = Math.min(...vs.map(v => v.price)), name = subLabel(fam);
  if (vs.length < 2) return tile(p, i);
  return `
  <article class="tile tile-family" data-view="${p.id}" style="--d:${Math.min(i, 12) * 45}ms">
    ${media(p, 'shot')}
    <span class="tile-tag">${esc(plural('options', vs.length))}</span>
    <div class="tile-body">
      <div class="txt">
        <h3>${esc(name)}</h3>
        <p>${esc(vs.slice(0, 3).map(valueOf).join(' · '))}${vs.length > 3 ? ' …' : ''}</p>
        <span class="px">${esc(t('fam.from', { price: tnd(low) }))}</span>
      </div>
      <button class="round" data-view="${p.id}" aria-label="${esc(t('fam.open', { name }))}">${ICON.chev}</button>
    </div>
  </article>`;
};

/* ── feedback ──────────────────────────────────────────────────────── */
export function toast(msg, ok = false) {
  const host = $('#toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = (ok ? `<span class="ok">${ICON.check}</span>` : '') + `<span>${esc(msg)}</span>`;
  host.append(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2600);
}

/** The product image that arcs into the basket icon. */
export function fly(from, p) {
  const target = $('#railCart');
  if (calm() || !from || !target) return;
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
  if (!a.width) return;
  const img = document.createElement('img');
  img.src = p.img;
  img.className = 'flyer';
  Object.assign(img.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  document.body.append(img);
  img.animate([
    { transform: 'translate(0,0) scale(1)', opacity: .95 },
    { transform: `translate(${b.left - a.left - 6}px, ${b.top - a.top - 6}px) scale(.16)`, opacity: 0 }
  ], { duration: 620, easing: 'cubic-bezier(.5,0,.4,1)' }).onfinish = () => img.remove();
}

/* ── data controls (Settings → Privacy) ─────────────────────────────── */
export function exportData() {
  const data = {
    exported: new Date().toISOString(),
    profile: state.profile, preferences: state.prefs,
    basket: state.cart, wishlist: [...state.wish],
    orders: state.orders, recentlyViewed: state.viewed
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'techgarage-my-data.json' });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function resetEverything() {
  KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });
  location.hash = '#/';
  location.reload();
}
