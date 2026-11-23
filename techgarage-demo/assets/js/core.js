/* TechGarage demo — shared state, store actions and UI primitives.
   Everything a page needs lives here so the views stay declarative. */

import { PRODUCTS, CATEGORIES, ACCOUNT, ORDERS_SEED, NOTIFICATIONS, PAYMENT_METHODS } from './data.js';

/* ── helpers ───────────────────────────────────────────────────────── */
export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

/** Every price is a whole number of dinars, written the Tunisian way. */
export const tnd = n => n.toLocaleString('en-US') + ' DT';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).label || 'All products';
export const avatarSrc = name => `assets/avatars/${name}.png`;
export const payLabel = id => (PAYMENT_METHODS.find(m => m.id === id) || {}).label || id;

export const fmtDate = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Navigate; re-runs the route when the hash is already current. */
export function go(hash) {
  if (location.hash === hash) dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

/* ── icons ─────────────────────────────────────────────────────────── */
const svg = (d, w = 16, sw = 2) =>
  `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICON = {
  cart:   svg('<path d="M3 4h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.3a1.8 1.8 0 0 0 1.8-1.4L21 8H6.2"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>', 15),
  plus:   svg('<path d="M12 5v14M5 12h14"/>', 16, 2.4),
  minus:  svg('<path d="M5 12h14"/>', 14, 2.4),
  bolt:   svg('<path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>', 15),
  check:  svg('<path d="M20 6L9 17l-5-5"/>', 15, 2.6),
  dots:   '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  heart:  svg('<path d="M20.3 5.6a5 5 0 0 0-7.1 0L12 6.8l-1.2-1.2a5 5 0 1 0-7.1 7.1l8.3 8.3 8.3-8.3a5 5 0 0 0 0-7.1z"/>', 15),
  heartOn:'<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.3 5.6a5 5 0 0 0-7.1 0L12 6.8l-1.2-1.2a5 5 0 1 0-7.1 7.1l8.3 8.3 8.3-8.3a5 5 0 0 0 0-7.1z"/></svg>',
  trash:  svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 15),
  copy:   svg('<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 15),
  eye:    svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 15),
  eyeOff: svg('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.3 4.2M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>', 15),
  out:    svg('<path d="M7 17L17 7M9 7h8v8"/>', 11, 2.4),
  chev:   svg('<path d="M9 6l6 6-6 6"/>', 14, 2.2),
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
  download: svg('<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>', 16),
  heartBig: svg('<path d="M20.3 5.6a5 5 0 0 0-7.1 0L12 6.8l-1.2-1.2a5 5 0 1 0-7.1 7.1l8.3 8.3 8.3-8.3a5 5 0 0 0 0-7.1z"/>', 34, 1.4),
  cartBig:  svg('<path d="M3 4h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.3a1.8 1.8 0 0 0 1.8-1.4L21 8H6.2"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>', 34, 1.4),
  search:   svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.4-3.4"/>', 34, 1.4)
};

/* ── persistence ───────────────────────────────────────────────────── */
const KEYS = ['tg.cart', 'tg.wish', 'tg.prefs', 'tg.profile', 'tg.orders', 'tg.viewed', 'tg.read'];

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
const cleanCart = Object.fromEntries(Object.entries(load('tg.cart', {})).filter(([id, q]) => known(id) && q > 0));

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

export function addToCart(id, qty = 1, fromImg = null) {
  state.cart[id] = Math.min((state.cart[id] || 0) + qty, 10);
  save('tg.cart', state.cart);
  emit('cart');
  if (fromImg) fly(fromImg, byId[id]);
  toast(`${byId[id].short} added to basket`, true);
}

export function setQty(id, qty) {
  if (qty <= 0) delete state.cart[id];
  else state.cart[id] = Math.min(qty, 10);
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
  toast(has ? 'Removed from wishlist' : 'Saved to wishlist', !has);
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
  const date = typeof o.date === 'number' ? o.date : Date.parse(o.date);
  const status = o.status === 'processing' && o.deliverAt && Date.now() >= o.deliverAt ? 'delivered' : o.status;
  return { ...o, date, status };
};

export const allOrders = () => [...state.orders, ...ORDERS_SEED].map(normalise).sort((a, b) => b.date - a.date);
export const getOrder  = id => allOrders().find(o => o.id === id);
export const orderTotal = o => o.items.reduce((s, [id, q]) => s + byId[id].price * q, 0);
export const orderCount = o => o.items.reduce((s, [, q]) => s + q, 0);

export function placeOrder({ name, email, phone, payment, playerId }) {
  const next = 1043 + state.orders.length;
  const order = {
    id: `TG-${next}`,
    date: Date.now(),
    items: Object.entries(state.cart),
    status: 'processing',
    deliverAt: Date.now() + DELIVERY_DELAY,
    payment, playerId: playerId || undefined,
    contact: { name, email, phone }
  };
  state.orders.unshift(order);
  save('tg.orders', state.orders);
  clearCart();
  emit('orders');
  return order;
}

/* ── delivery: what the shopper receives, and a demo credential for it ── */
export function deliveryType(p) {
  if (p.cat === 'mobile') return 'topup';
  if (p.cat === 'cards') return 'code';
  if (p.tags.some(t => /account/i.test(t))) return 'account';
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
      return { label: 'Account login', login: `tg.${block(rand, 6).toLowerCase()}@example.com`, secret: `DEMO-${block(rand, 10)}` };
    case 'topup':
      return { label: 'Top-up', note: `Credited to player ID ${order.playerId || '—'}` };
    case 'code':
      return { label: 'Gift card code', secret: 'DEMO-' + [4, 4, 4, 4].map(n => block(rand, n)).join('-') };
    default:
      return { label: 'Activation key', secret: 'DEMO-' + [5, 5, 5].map(n => block(rand, n)).join('-') };
  }
}

/* ── search ────────────────────────────────────────────────────────── */
/** Hits on the displayed name rank above tags, which rank above the long
    store title — otherwise "steam" lists every Fresh Steam Account first. */
export function searchProducts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const rank = p =>
    p.short.toLowerCase().includes(q) ? 0 :
    p.tags.join(' ').toLowerCase().includes(q) ? 1 :
    p.name.toLowerCase().includes(q) ? 2 : -1;
  return PRODUCTS.map(p => [rank(p), p]).filter(([r]) => r >= 0).sort((a, b) => a[0] - b[0]).map(([, p]) => p);
}

/* ── shared markup ─────────────────────────────────────────────────── */
export const art = (p, cls = 'shot') =>
  `<div class="${cls}${p.kind === 'cut' ? ' cut' : ''}"><img src="${p.img}" alt="" loading="lazy" decoding="async"></div>`;

export const thumb = (p, cls = 'thumb') =>
  `<div class="${cls}${p.kind === 'cut' ? ' cut' : ''}"><img src="${p.img}" alt="" loading="lazy"></div>`;

export const heartBtn = (p, cls = 'tile-heart') => {
  const on = state.wish.has(p.id);
  return `<button class="${cls}${on ? ' on' : ''}" data-wish="${p.id}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Save'} ${esc(p.short)}">${on ? ICON.heartOn : ICON.heart}</button>`;
};

/** The product card used on every shelf and grid. */
export const tile = (p, i = 0) => `
  <article class="tile" data-view="${p.id}" style="--d:${Math.min(i, 12) * 45}ms">
    ${art(p)}
    <span class="tile-tag">${esc(p.badge || p.tags[1] || p.tags[0])}</span>
    ${heartBtn(p)}
    <div class="tile-body">
      <div class="txt">
        <h3>${esc(p.short)}</h3>
        <p>${esc(p.blurb)}</p>
        <span class="px">${tnd(p.price)}</span>
      </div>
      <button class="round" data-add="${p.id}" aria-label="Add ${esc(p.short)} to basket">${ICON.plus}</button>
    </div>
  </article>`;

/* ── feedback ──────────────────────────────────────────────────────── */
export function toast(msg, ok = false) {
  const host = $('#toasts');
  if (!host) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = (ok ? `<span class="ok">${ICON.check}</span>` : '') + esc(msg);
  host.append(t);
  setTimeout(() => {
    t.classList.add('out');
    t.addEventListener('animationend', () => t.remove(), { once: true });
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
