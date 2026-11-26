/* TechGarage demo — input guard.
   Everything the store reads back from the browser (basket, profile, orders,
   key stock, the admin's catalogue changes) or from an imported file is
   checked here before use: wrong types are dropped, text is length-capped,
   ids must look like ids and pictures / links must be safe addresses. A
   damaged or tampered save can then never break the page or slip in a
   `javascript:` link. All output is escaped as well (esc() in core.js) —
   this is the second line of defence. No imports: data.js loads it first. */

const isPlain = v => !!v && typeof v === 'object' && !Array.isArray(v);
export const clip = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' && isFinite(v) ? String(v) : '');
export const isId = v => typeof v === 'string' && /^[a-z0-9][a-z0-9_-]{0,80}$/i.test(v);
const isKey = v => typeof v === 'string' && /^[a-z0-9][\w.-]{0,80}$/i.test(v);   // page-section keys like "pdp.details"
const idList = v => (Array.isArray(v) ? [...new Set(v.filter(isId))] : []);
const clipList = (v, max = 80, n = 12) => (Array.isArray(v) ? v.map(x => clip(x, max)).filter(Boolean).slice(0, n) : []);
const pickOne = (v, list) => (list.includes(v) ? v : undefined);
const inRange = (v, min, max) => (typeof v === 'number' && isFinite(v) && v >= min && v <= max ? v : undefined);

/** Pictures: the store's own files, uploaded images (data URIs) or https addresses. */
export function safeImg(v) {
  if (typeof v !== 'string') return '';
  if (/^idb:[a-z0-9]{6,40}$/.test(v)) return v;   // a file uploaded in the admin (media-store.js)
  if (/^assets\/[\w./-]+\.(webp|png|jpe?g|gif|svg)$/i.test(v) && !v.includes('..')) return v;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(v)) return v;
  if (/^https:\/\/[a-z0-9.-]+\/[^\s"'<>\\]*$/i.test(v)) return v;
  return '';
}
/** Links out of the store: https only. */
export const safeUrl = v => (typeof v === 'string' && /^https:\/\/[a-z0-9.-]+(\/[^\s"'<>\\]*)?$/i.test(v) ? v : undefined);

const langText = v => (isPlain(v) ? Object.fromEntries(['en', 'fr', 'ar'].filter(l => typeof v[l] === 'string').map(l => [l, clip(v[l], 80)])) : undefined);

/* Product page blocks the owner can reorder or hide, and the system-requirement rows. */
export const PDP_BLOCKS = ['wall', 'guide', 'sysreq', 'redeem', 'how', 'details', 'related'];
export const SYSREQ_KEYS = ['os', 'cpu', 'ram', 'gpu', 'storage', 'dx', 'net', 'notes'];

/* The fields a product may carry, each with its check. */
const PRODUCT_FIELDS = {
  name: v => clip(v, 200) || undefined, short: v => clip(v, 120) || undefined,
  price: v => inRange(v, 0, 1e6), cat: v => (isId(v) ? v : undefined), sub: v => (isId(v) ? v : undefined),
  kind: v => pickOne(v, ['art', 'cut']), img: v => safeImg(v) || undefined, url: safeUrl,
  tags: v => { const t = clipList(v); return t.length ? t : undefined; }, specs: v => clipList(v),
  badge: v => clip(v, 40) || undefined, blurb: v => clip(v, 800) || undefined, guide: v => (typeof v === 'string' ? v.slice(0, 8000).trim() : undefined), custom: v => (typeof v === 'boolean' ? v : undefined),
  game: v => (isId(v) ? v : undefined), platform: v => pickOne(v, ['pc', 'xbox', 'ps5']),
  delivery: v => pickOne(v, ['key', 'account', 'code', 'topup', 'ship']), topup: v => pickOne(v, ['loginFull', 'login', 'id']),
  video: v => {
    if (!isPlain(v)) return undefined;
    const ok = u => typeof u === 'string' && (/^idb:[a-z0-9]{6,40}$/.test(u) || /^assets\/[\w./-]+\.(mp4|webm)$/i.test(u) && !u.includes('..') || /^https:\/\/[a-z0-9.-]+\/[^\s"'<>\\]*$/i.test(u));
    const out = {};
    if (ok(v.hd)) out.hd = v.hd;
    if (ok(v.sd)) out.sd = v.sd;
    return out.hd || out.sd ? out : undefined;
  },
  region: v => (typeof v === 'string' && /^[A-Z]{2}$/.test(v) ? v : undefined), value: v => clip(v, 60) || undefined,
  /* product page extras, edited in the admin */
  gallery: v => (Array.isArray(v) ? v.map(safeImg).filter(Boolean).slice(0, 12) : undefined),
  wall: v => safeImg(v) || undefined,
  wallBg: v => (typeof v === 'boolean' ? v : undefined),
  sysreq: v => {
    if (!isPlain(v)) return undefined;
    const side = x => (isPlain(x) ? Object.fromEntries(SYSREQ_KEYS.filter(k => typeof x[k] === 'string' && x[k].trim()).map(k => [k, clip(x[k].trim(), 200)])) : {});
    const out = { min: side(v.min), rec: side(v.rec) };
    return Object.keys(out.min).length || Object.keys(out.rec).length ? out : undefined;
  },
  redeem: v => (Array.isArray(v) ? v.filter(isPlain).map(st => ({ text: clip(st.text, 600), ...(safeImg(st.img) ? { img: safeImg(st.img) } : {}) }))
    .filter(st => st.text || st.img).slice(0, 12) : undefined),
  layout: v => (Array.isArray(v) ? [...new Set(v.filter(x => PDP_BLOCKS.includes(x)))] : undefined),
  off: v => (Array.isArray(v) ? [...new Set(v.filter(x => PDP_BLOCKS.includes(x)))] : undefined),
  qty: v => (Number.isInteger(v) && v >= 0 && v <= 1e6 ? v : undefined), qtyAt: v => inRange(v, 0, 9e15),
  release: v => (v === '' || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v))) ? v : undefined)
};
function cleanFields(p) {
  const out = {};
  for (const [k, check] of Object.entries(PRODUCT_FIELDS)) {
    if (!(k in p)) continue;
    const v = check(p[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}
/** A complete product the shop can show, or null. */
export function cleanProduct(p) {
  if (!isPlain(p) || !isId(p.id)) return null;
  const c = cleanFields(p);
  if (c.price === undefined || !c.cat || !c.sub || !(c.short || c.name)) return null;
  return { id: p.id, kind: 'art', specs: [], ...c, short: c.short || c.name, name: c.name || c.short, tags: c.tags || ['Game'], img: c.img || '' };
}

/** The admin's record of catalogue changes (localStorage "tg.admin" or an imported file). */
export function cleanAdmin(a) {
  if (!isPlain(a)) return {};
  const out = {};
  if (Array.isArray(a.added)) out.added = a.added.map(cleanProduct).filter(Boolean).slice(0, 2000);
  if (isPlain(a.edited)) out.edited = Object.fromEntries(Object.entries(a.edited).filter(([id, p]) => isId(id) && isPlain(p)).map(([id, p]) => [id, cleanFields(p)]));
  if (a.removed) out.removed = idList(a.removed);
  if (Array.isArray(a.categories)) {
    const cats = a.categories.filter(c => isPlain(c) && isId(c.id))
      .map(c => ({ id: c.id, ...(c.grouped === true ? { grouped: true } : {}), ...(c.id === 'all' ? {} : { subs: idList(c.subs) }) }));
    if (cats.some(c => c.id === 'all')) out.categories = cats;
  }
  if (isPlain(a.catNames)) out.catNames = Object.fromEntries(Object.entries(a.catNames).filter(([id]) => isId(id)).map(([id, n]) => [id, langText(n)]).filter(([, n]) => n?.en));
  if (isPlain(a.subNames)) out.subNames = Object.fromEntries(Object.entries(a.subNames).filter(([id, n]) => isId(id) && typeof n === 'string').map(([id, n]) => [id, clip(n, 60)]));
  for (const k of ['hero', 'drops', 'shelf', 'ticker', 'picks', 'best']) if (a[k]) out[k] = idList(a[k]);
  if (Array.isArray(a.bundles)) out.bundles = a.bundles.filter(b => isPlain(b) && isId(b.id)).slice(0, 20)
    .map(b => ({ id: b.id, name: langText(b.name) || {}, items: idList(b.items).slice(0, 6), pct: Math.round(inRange(b.pct, 1, 90) ?? 10) }));
  if (isPlain(a.flash)) out.flash = isId(a.flash.id) && inRange(a.flash.pct, 1, 90) !== undefined ? { id: a.flash.id, pct: Math.round(a.flash.pct) } : {};
  if (Array.isArray(a.reviews)) out.reviews = a.reviews.filter(isPlain).slice(0, 40)
    .map(r => ({ name: clip(r.name, 40).trim(), stars: Math.round(inRange(r.stars, 1, 5) ?? 5), text: clip(r.text, 1000).trim(), ...(isId(r.product) ? { product: r.product } : {}),
      ...(r.source === 'google' ? { source: 'google' } : {}), ...(clip(r.when, 40).trim() ? { when: clip(r.when, 40).trim() } : {}) }))
    .filter(r => r.name && r.text);
  if (typeof a.whatsapp === 'string') out.whatsapp = a.whatsapp.replace(/\D/g, '').slice(0, 15);
  if (isPlain(a.google)) {
    const g = {};
    if (typeof a.google.placeId === 'string' && /^[\w-]{10,300}$/.test(a.google.placeId.trim())) g.placeId = a.google.placeId.trim();
    if (typeof a.google.key === 'string' && /^[\w-]{20,80}$/.test(a.google.key.trim())) g.key = a.google.key.trim();
    out.google = g;
  }
  const longText = (v, max) => (isPlain(v) ? Object.fromEntries(['en', 'fr', 'ar'].filter(l => typeof v[l] === 'string' && v[l].trim()).map(l => [l, clip(v[l], max)])) : {});
  if (isPlain(a.texts)) out.texts = Object.fromEntries(Object.entries(a.texts).filter(([k]) => isKey(k)).slice(0, 3000)
    .map(([k, v]) => [k, longText(v, 600)]).filter(([, v]) => Object.keys(v).length));
  if (isPlain(a.faq)) out.faq = Object.fromEntries(['en', 'fr', 'ar'].filter(l => Array.isArray(a.faq[l])).map(l => [l,
    a.faq[l].filter(qa => Array.isArray(qa)).slice(0, 40).map(([q, an]) => [clip(q, 200), clip(an, 1200)])]));
  if (isPlain(a.site)) { const s = {}; if (typeof a.site.accent === 'string' && /^#[0-9a-f]{6}$/i.test(a.site.accent)) s.accent = a.site.accent; out.site = s; }
  if (isPlain(a.store)) {
    const s = {}, st = a.store;
    if (typeof st.phone === 'string') s.phone = clip(st.phone, 30).replace(/[^\d+ ()-]/g, '');
    if (typeof st.email === 'string' && /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}$/.test(st.email)) s.email = st.email;
    if (typeof st.name === 'string') s.name = clip(st.name, 60);
    for (const k of ['legalName', 'regNo', 'taxId']) if (typeof st[k] === 'string') s[k] = clip(st[k], 80);
    if (Array.isArray(st.hours)) s.hours = st.hours.filter(h => Array.isArray(h) && ['day.week', 'day.sat', 'day.sun'].includes(h[0])).slice(0, 3).map(([d, v]) => [d, clip(v, 40)]);
    out.store = s;
  }
  if (isPlain(a.payments)) out.payments = Object.fromEntries(Object.entries(a.payments).filter(([m, v]) => isId(m) && isPlain(v)).map(([m, v]) => {
    const o = {};
    if (typeof v.on === 'boolean') o.on = v.on;
    if (isPlain(v.fee)) { const pct = inRange(v.fee.pct, 0, 50), flat = inRange(v.fee.flat, 0, 1000); o.fee = pct !== undefined ? { pct } : flat !== undefined ? { flat } : {}; }
    return [m, o];
  }));
  if (Array.isArray(a.ratesManual)) out.ratesManual = [...new Set(a.ratesManual.filter(c => typeof c === 'string' && /^[A-Z]{3}$/.test(c)))].slice(0, 60);
  if (isPlain(a.currencies)) out.currencies = Object.fromEntries(Object.entries(a.currencies)
    .filter(([c, r]) => /^[A-Z]{3}$/.test(c) && c !== 'TND' && inRange(r, 0.0001, 100000) !== undefined));
  if (isPlain(a.legal)) out.legal = Object.fromEntries(Object.entries(a.legal)
    .filter(([k, v]) => ['terms', 'privacy', 'refunds', 'notice'].includes(k) && isPlain(v)).map(([k, v]) => [k, longText(v, 12000)]));
  if (isPlain(a.tracking)) out.tracking = Object.fromEntries(Object.entries(a.tracking)
    .filter(([id, v]) => /^[\w-]{1,40}$/.test(id) && isPlain(v)).map(([id, v]) => [id, { carrier: clip(v.carrier, 40), number: clip(v.number, 60) }]));
  if (isPlain(a.shipping)) out.shipping = Object.fromEntries(['tn', 'express', 'intl', 'pickup'].filter(k => isPlain(a.shipping[k])).map(k => {
    const v = a.shipping[k], o = {};
    if (typeof v.on === 'boolean') o.on = v.on;
    for (const f of ['fee', 'free']) { const n = inRange(v[f], 0, 100000); if (n !== undefined) o[f] = n; }
    if (typeof v.days === 'string') o.days = clip(v.days, 40);
    if (typeof v.address === 'string') o.address = clip(v.address, 160);
    if (Array.isArray(v.countries)) o.countries = [...new Set(v.countries.filter(c => typeof c === 'string' && /^[A-Z]{2}$/.test(c)))].slice(0, 250);
    return [k, o];
  }));
  if (isPlain(a.orderStatus)) out.orderStatus = Object.fromEntries(Object.entries(a.orderStatus)
    .filter(([id, st]) => /^[\w-]{1,40}$/.test(id) && ['processing', 'shipped', 'delivered', 'cancelled'].includes(st)));
  if (isPlain(a.promo)) {
    const p = a.promo, o = {};
    if (typeof p.on === 'boolean') o.on = p.on;
    for (const [f, max] of [['title', 60], ['text', 220], ['cta', 30]]) if (isPlain(p[f])) o[f] = Object.fromEntries(['en', 'fr', 'ar'].filter(l => typeof p[f][l] === 'string').map(l => [l, clip(p[f][l], max)]));
    if (typeof p.link === 'string' && (p.link === 'deals' || /^#\/[\w\/-]{0,80}$/.test(p.link))) o.link = p.link;
    if (isId(p.art)) o.art = p.art;
    if (typeof p.code === 'string' && /^[A-Z0-9-]{0,20}$/i.test(p.code)) o.code = p.code.toUpperCase();
    const pct = inRange(p.codePct, 0, 90);
    if (pct !== undefined) o.codePct = Math.round(pct);
    out.promo = o;
  }
  if (isPlain(a.sales)) out.sales = Object.fromEntries(Object.entries(a.sales)
    .filter(([id, s]) => isId(id) && isPlain(s) && inRange(s.pct, 1, 90) !== undefined)
    .map(([id, s]) => [id, { pct: Math.round(s.pct), ...(typeof s.until === 'string' && !isNaN(Date.parse(s.until)) ? { until: s.until.slice(0, 25) } : {}) }]));
  if (isPlain(a.hidden)) out.hidden = Object.fromEntries(Object.keys(a.hidden).filter(isKey).map(k => [k, true]));
  if (isPlain(a.titles)) out.titles = Object.fromEntries(Object.entries(a.titles).filter(([k]) => isKey(k)).map(([k, v]) => [k, langText(v) || {}]));
  return out;
}

/** Key stock: { productId: [{ code, added, order?, soldAt? }] }. */
export function cleanStock(s) {
  if (!isPlain(s)) return {};
  return Object.fromEntries(Object.entries(s).filter(([id, list]) => isId(id) && Array.isArray(list)).map(([id, list]) => [id,
    list.filter(k => isPlain(k) && clip(k.code, 500)).slice(0, 5000).map(k => ({
      code: clip(k.code, 500), added: inRange(k.added, 0, 1e15) ?? 0,
      ...(k.order ? { order: clip(k.order, 40) } : {}), ...(inRange(k.soldAt, 0, 1e15) ? { soldAt: k.soldAt } : {})
    }))]));
}

/** Basket: { productId: quantity }, whole numbers from 1 to 99. */
export const cleanCart = c => (isPlain(c) ? Object.fromEntries(Object.entries(c).filter(([id, q]) => isId(id) && Number.isInteger(q) && q > 0 && q <= 99)) : {});

/** The shopper's own details: known text fields only, plus non-secret game details. */
export function cleanProfile(p) {
  if (!isPlain(p)) return {};
  const out = {};
  for (const k of ['name', 'firstName', 'lastName', 'handle', 'email', 'phone', 'since', 'address', 'city', 'zip', 'state']) if (typeof p[k] === 'string') out[k] = clip(p[k], 120);
  if (typeof p.country === 'string' && /^[A-Z]{2}$/.test(p.country)) out.country = p.country;
  if (isId(p.avatar)) out.avatar = p.avatar;
  if (isPlain(p.games)) out.games = Object.fromEntries(Object.entries(p.games).filter(([id, g]) => isId(id) && isPlain(g))
    .map(([id, g]) => [id, Object.fromEntries(Object.entries(g).filter(([k, v]) => isId(k) && k !== 'password' && typeof v === 'string').map(([k, v]) => [k, clip(v, 120)]))]));
  return out;
}

/** Saved orders: id, date, items as [productId, qty, …]; anything else is checked or dropped. */
export function cleanOrders(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(o => isPlain(o) && typeof o.id === 'string' && /^[\w-]{1,40}$/.test(o.id) && (typeof o.date === 'number' ? isFinite(o.date) : typeof o.date === 'string' && !isNaN(Date.parse(o.date)))
      && Array.isArray(o.items) && o.items.length && o.items.every(it => Array.isArray(it) && isId(it[0]) && Number.isInteger(it[1]) && it[1] > 0 && it[1] <= 99))
    .map(o => (o.promo && !(isPlain(o.promo) && inRange(o.promo.pct, 1, 90) !== undefined) ? { ...o, promo: undefined } : o))
    .map(o => (o.bundleOff !== undefined && inRange(o.bundleOff, 0, 1e6) === undefined ? { ...o, bundleOff: undefined } : o))
    .map(o => (o.ship === undefined ? o : { ...o, ship: cleanShip(o.ship) }))
    .slice(0, 500);
}
/** A physical order's delivery: method, fee and address, every field checked. */
function cleanShip(s) {
  if (!isPlain(s) || !['tn', 'express', 'intl', 'pickup'].includes(s.method)) return undefined;
  const a = isPlain(s.address) ? s.address : {};
  const address = Object.fromEntries(['gov', 'region', 'city', 'zip', 'line', 'notes'].filter(k => typeof a[k] === 'string' && a[k].trim()).map(k => [k, clip(a[k].trim(), k === 'notes' ? 300 : 120)]));
  if (typeof a.country === 'string' && /^[A-Z]{2}$/.test(a.country)) address.country = a.country;
  return { method: s.method, fee: inRange(s.fee, 0, 100000) ?? 0, address };
}

/** Preferences: the accent must be a colour, flags must be true/false. */
export function cleanPrefs(p) {
  if (!isPlain(p)) return {};
  const out = {};
  if (typeof p.accent === 'string' && /^#[0-9a-f]{6}$/i.test(p.accent)) out.accent = p.accent;
  for (const k of ['animatedBg', 'reduceMotion', 'twoFactor']) if (typeof p[k] === 'boolean') out[k] = p[k];
  if (['email', 'sms', 'both'].includes(p.channel)) out.channel = p.channel;
  if (isPlain(p.notify)) out.notify = Object.fromEntries(Object.entries(p.notify).filter(([k, v]) => isId(k) && typeof v === 'boolean'));
  return out;
}
