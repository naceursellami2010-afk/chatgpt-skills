/* TechGarage demo — pages.
   Each view is { title(ctx), render(ctx) → html, mount(el, ctx) → cleanup? }.
   Shared actions (add to basket, wishlist, open product) are delegated by
   the shell, so most markup only needs data-* attributes.
   Every visible word goes through t() / plural() from i18n.js. */

import { PRODUCTS, CATEGORIES, HERO, NEW_DROPS, RECENT, NOTIFICATIONS, STORE, PAYMENT_METHODS, ACCENTS, AVATARS } from './data.js?v=20261129d';
import { LANGS, t, plural, blurb, word, faq, lang, setLang, isRTL, langInfo, num, priceTND, currencyNow } from './i18n.js?v=20261129d';
import {
  $, $$, byId, tnd, esc, catLabel, subLabel, subsOf, avatarSrc, payLabel, fmtDate, go, ICON, state,
  cartQty, cartTotal, setQty, addToCart, markViewed, clearViewed, unreadCount, markRead, noteText,
  saveProfile, savePrefs, calm, allOrders, getOrder, orderTotal, orderSubtotal, orderFee, orderCount, placeOrder,
  paymentFee, feeLabel,
  deliveryType, credential, searchProducts, media, heartBtn, tile, toast, exportData, resetEverything,
  familyOf, familyVariants, familyLead, familyTile, regionOf, valueOf, topupMethod, FAMILY_CATS,
  isListed, listed, sectionHidden, secTitle, stockState, stockOf, maxBuyable, isGameVersion, versionKind, fitAll,
  unitPrice, orderDiscount, couponPct, couponCode, couponOff, applyCoupon, clearCoupon, emit,
  videoTag, videoToggle, playVideo, pauseVideo,
  liveBundles, addBundle, bundleOff, orderBundleOff, orderPromoOff, accentNow, googleReviews, googleLinks, consent, setConsent,
  isShipped, cartShips, shipOptions, shipCountries, TN_GOVS, govLabel, countryName, orderShip, orderTrack, digitalDone, SHIPPING
} from './core.js?v=20261129d';
import { STEAM } from './steam.js?v=20261129d';
import { PAGE_SECTIONS, PLATFORMS, PROMO, FLASH, EXTRAS, LEGAL_OVR, BRAND_INFO, KIND } from './data.js?v=20261129d';
import { srcOf } from './media-store.js?v=20261129d';
import { PDP_BLOCKS, SYSREQ_KEYS } from './guard.js?v=20261129d';
import { splitWords, parallax } from './motion.js?v=20261129d';
import { contentGrew } from './smooth.js?v=20261129d';

/* Where a subcategory link goes: brands (gift cards, mobile games) open their
   product page, where region and value are picked; others open the shop. */
const subHref = (cat, sub, s = {}) => FAMILY_CATS.includes(cat) && familyLead(sub)
  ? `#/product/${familyLead(sub).id}` : shopHash({ ...s, cat, sub });

/** What the delivery line says: login top-ups read differently from ID ones. */
const dlvText = p => t(deliveryType(p) === 'topup' && topupMethod(p) !== 'id' ? 'dlv.login' : 'dlv.' + deliveryType(p));

/* ── shared page pieces ────────────────────────────────────────────── */
export const crumbs = list => `<nav class="crumbs" aria-label="${esc(t('crumbs'))}">${list.map(([label, href], i) =>
  href && i < list.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`
).join('<i aria-hidden="true">/</i>')}</nav>`;

export const pageHead = (title, sub = '', trail = null, aside = '') => `
  <header class="page-head">
    <div>
      ${trail ? crumbs(trail) : ''}
      <h1>${esc(title)}</h1>
      ${sub ? `<p>${sub}</p>` : ''}
    </div>
    ${aside}
  </header>`;

export const emptyState = (icon, title, text, cta = '') => `
  <div class="empty-state">${icon}<h2>${esc(title)}</h2><p>${text}</p>${cta}</div>`;

const statusPill = s => `<span class="pill pill-${s}">${esc(t(['delivered', 'cancelled', 'shipped'].includes(s) ? 'st.' + s : 'st.processing'))}</span>`;

const mask = s => s.replace(/[A-Za-z0-9](?=.{4})/g, '•');

export const field = (id, label, value = '', type = 'text', extra = '') => `
  <div class="field">
    <label for="${id}">${esc(label)}</label>
    <input id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${extra}>
    <span class="msg" aria-live="polite"></span>
  </div>`;

/* Payment logos: Visa (Simple Icons, CC0) and Mastercard drawn in their brand colours, D17 and
   Ooredoo from their app icons; e-DINAR has no logo to hand, so they stay as text chips. */
const PAY_LOGO = {
  visa: `<i class="pb pb-visa" title="Visa"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1A1F71" d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/></svg><span class="sr">Visa</span></i>`,
  mc: `<i class="pb pb-mc" title="Mastercard"><svg viewBox="0 0 38 24" aria-hidden="true"><circle cx="14" cy="12" r="9" fill="#EB001B"/><circle cx="24" cy="12" r="9" fill="#F79E1B"/><path fill="#FF5F00" d="M19 4.52A9 9 0 0 1 19 19.48A9 9 0 0 1 19 4.52Z"/></svg><span class="sr">Mastercard</span></i>`,
  edinar: `<i class="pb pb-text">e-DINAR</i>`,
  d17: `<i class="pb pb-img" title="D17"><img src="assets/icons/pay/d17.webp" alt="D17" width="22" height="22"></i>`,
  ooredoo: `<i class="pb pb-ooredoo" title="Ooredoo Pay"><img src="assets/icons/pay/ooredoo.webp" alt="" width="16" height="16"><b>ooredoo</b></i>`
};
export const payLogos = (...ids) => ids.map(id => PAY_LOGO[id]).join('');

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  fallbackCopy(text);
  return Promise.resolve();
}
function fallbackCopy(text) {
  const ta = Object.assign(document.createElement('textarea'), { value: text });
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.append(ta); ta.select();
  try { document.execCommand('copy'); } catch {}
  ta.remove();
}

const revealBtn = shown => `${shown ? ICON.eyeOff : ICON.eye}<span>${esc(t(shown ? 'cred.hide' : 'cred.reveal'))}</span>`;

/** A delivered credential: masked until revealed, copyable. */
function credBlock(order, id) {
  const c = credential(order, id);
  if (c.note) return `<div class="cred"><span class="cred-label">${esc(c.label)}</span><span class="cred-note">${esc(c.note)}</span></div>`;
  return `
    <div class="cred" data-secret="${esc(c.secret)}">
      <span class="cred-label">${esc(c.label)}</span>
      ${c.login ? `<span class="cred-login" dir="ltr">${esc(c.login)}</span>` : ''}
      <code class="cred-code allow-copy" dir="ltr">${esc(mask(c.secret))}</code>
      <span class="cred-actions">
        <button class="mini" type="button" data-reveal aria-pressed="false">${revealBtn(false)}</button>
        <button class="mini" type="button" data-copy>${ICON.copy}<span>${esc(t('cred.copy'))}</span></button>
      </span>
    </div>`;
}

function wireCreds(el) {
  const onClick = e => {
    const rev = e.target.closest('[data-reveal]');
    const cp = e.target.closest('[data-copy]');
    if (!rev && !cp) return;
    const box = e.target.closest('.cred');
    const secret = box.dataset.secret;
    if (rev) {
      const shown = rev.getAttribute('aria-pressed') === 'true';
      box.querySelector('.cred-code').textContent = shown ? mask(secret) : secret;
      rev.setAttribute('aria-pressed', String(!shown));
      rev.innerHTML = revealBtn(!shown);
    }
    if (cp) copyText(secret).then(() => toast(t('toast.copied'), true));
  };
  el.addEventListener('click', onClick);
  return () => el.removeEventListener('click', onClick);
}

/* ══════════════════════════════════════════════════════════════════════
   Home
   ══════════════════════════════════════════════════════════════════════ */
const SORTS = ['new', 'low', 'high', 'az'];
const sortList = (list, by) => {
  const c = [...list];
  if (by === 'low')  c.sort((a, b) => a.price - b.price);
  if (by === 'high') c.sort((a, b) => b.price - a.price);
  if (by === 'az')   c.sort((a, b) => a.short.localeCompare(b.short));
  return c;
};

const chevron = d => `<svg class="dir" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'}"/></svg>`;

/* ══════════════════════════════════════════════════════════════════════
   Home, further down: a rolling product bar, the deals with a countdown, the
   promo banner, editor's picks and one sliding row per category. Each part is
   edited (or switched off) in Store admin → Page sections and → Promotions.
   ══════════════════════════════════════════════════════════════════════ */
const timeLeft = until => {
  const s = Math.max(0, Math.floor((Date.parse(until) - Date.now()) / 1000));
  return t('deal.time', { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 });
};
const countdownText = (until, key = 'deal.ends') => (Date.parse(until) > Date.now() ? t(key, { time: timeLeft(until) }) : t('deal.over'));
const countdown = (until, key) => (until ? `<span class="countdown" data-until="${esc(until)}" data-label="${key || 'deal.ends'}">${esc(countdownText(until, key))}</span>` : '');
// one clock for every countdown on screen
setInterval(() => document.querySelectorAll('[data-until]').forEach(el => { el.textContent = countdownText(el.dataset.until, el.dataset.label); }), 1000);

const dealsList = () => PRODUCTS.filter(p => p.sale && isListed(p.id)).sort((a, b) => b.sale.pct - a.sale.pct).slice(0, 16);
const blockHead = (key, fallback, extra = '', link = '') => `
  <div class="home-head">
    <h2>${esc(secTitle(key, fallback))}</h2>
    <div class="home-head-end">${extra}${link ? `<a class="see-all" href="${link}">${esc(t('home.seeAll'))}</a>` : ''}
      <span class="hs-nav"><button type="button" class="hs-btn" data-hs="-1" aria-label="${esc(t('prev'))}">${chevron('prev')}</button><button type="button" class="hs-btn" data-hs="1" aria-label="${esc(t('next'))}">${chevron('next')}</button></span></div>
  </div>`;
const hscroll = items => `<div class="hscroll" tabindex="0">${items}</div>`;

function tickerSection() {
  const list = listed(PAGE_SECTIONS.ticker);
  if (sectionHidden('ticker') || !list.length) return '';
  const run = list.map(p => `
    <a class="roll-item" href="#/product/${p.id}">${media(p, 'roll-art')}<span class="roll-txt"><b>${esc(p.short)}</b>
      <em>${tnd(p.price)}${p.sale ? ` <i class="roll-off">${esc(t('deal.off', { n: p.sale.pct }))}</i>` : ''}</em></span></a>`).join('');
  return `
    <section class="ticker" aria-label="${esc(secTitle('ticker', 'home.ticker'))}">
      <span class="ticker-label">${ICON.flame}<span>${esc(secTitle('ticker', 'home.ticker'))}</span></span>
      <div class="ticker-track"><div class="ticker-run">${run}<span class="ticker-copy" aria-hidden="true">${run.replace(/href="/g, 'tabindex="-1" href="')}</span></div></div>
    </section>`;
}

function dealsSection() {
  const deals = dealsList();
  if (sectionHidden('deals') || !deals.length) return '';
  const ends = deals.map(p => p.sale.until).filter(Boolean).sort()[0];
  return `<section class="home-block" id="deals">${blockHead('deals', 'home.deals', countdown(ends))}${hscroll(deals.map(tile).join(''))}</section>`;
}

function promoSection() {
  if (sectionHidden('promo') || PROMO.on === false) return '';
  const pick = (f) => PROMO[f]?.[lang()] || PROMO[f]?.en || '';
  const art = byId[PROMO.art], b = art && bannerOf(art);
  const src = b ? b.srcset[b.srcset.length - 1][0] : art?.img;
  const top = Math.max(0, ...dealsList().map(p => p.sale.pct));
  const href = PROMO.link && PROMO.link !== 'deals' ? PROMO.link : '#/shop';
  return `
    <section class="promo home-block" style="--focus:${esc(b?.focus || '50% 50%')}">
      ${src ? `<div class="promo-bg" aria-hidden="true"><img src="${src}" alt="" loading="lazy" decoding="async"></div>` : ''}
      <div class="promo-body">
        ${top ? `<span class="promo-kicker">${esc(t('promo.upTo', { n: top }))}</span>` : ''}
        <h2>${esc(pick('title'))}</h2>
        ${pick('text') ? `<p>${esc(pick('text'))}</p>` : ''}
        <div class="promo-cta">
          ${pick('cta') ? `<a class="btn btn-solid" href="${esc(href)}" ${PROMO.link === 'deals' || !PROMO.link ? 'data-to-deals' : ''}>${esc(pick('cta'))}</a>` : ''}
          ${PROMO.code && PROMO.codePct > 0 ? `<button type="button" class="promo-code" data-code="${esc(PROMO.code)}"><span dir="ltr">${esc(PROMO.code)}</span><small>${esc(t('promo.copy'))}</small></button>` : ''}
        </div>
      </div>
    </section>`;
}

function picksSection() {
  const list = listed(PAGE_SECTIONS.picks);
  if (sectionHidden('picks') || !list.length) return '';
  return `<section class="home-block picks">
    <div class="home-head"><div><h2>${esc(secTitle('picks', 'home.picks'))}</h2><p>${esc(t('home.picksD'))}</p></div></div>
    <div class="picks-grid">${list.slice(0, 6).map(tile).join('')}</div></section>`;
}

/* One sliding row per category: a tile per brand for grouped categories. */
function categoryRow(key, cat, title) {
  if (sectionHidden(key) || !CATEGORIES.some(c => c.id === cat)) return '';
  const items = PRODUCTS.filter(p => p.cat === cat && isListed(p.id));
  if (!items.length) return '';
  const html = FAMILY_CATS.includes(cat)
    ? [...new Set(items.map(familyOf))].filter(Boolean).slice(0, 14).map((f, i) => familyTile(f, i)).join('')
    : items.slice(0, 14).map(tile).join('');
  return `<section class="home-block">${blockHead(key, title, '', `#/shop/${cat}`)}${hscroll(html)}</section>`;
}


/* ══════════════════════════════════════════════════════════════════════
   More home sections: flash sale of the day, bundles, best sellers, a top-up
   calculator, a gift finder, coming soon, customer reviews and how delivery
   works. Each one is switched on or off (and renamed) in Page sections.
   ══════════════════════════════════════════════════════════════════════ */
const sectionHead = (key, fallback, sub) => `<div class="home-head"><div><h2>${esc(secTitle(key, fallback))}</h2>${sub ? `<p>${esc(t(sub))}</p>` : ''}</div></div>`;
const todayIso = () => new Date().toISOString().slice(0, 10);

function flashSection() {
  if (sectionHidden('flash')) return '';
  const p = byId[FLASH.id];
  if (!p?.sale?.flash || !isListed(p.id)) return '';
  return `
    <section class="home-block flash card" aria-labelledby="flashH">
      <a class="flash-art" href="#/product/${p.id}" tabindex="-1" aria-hidden="true">${media(p, 'flash-media')}</a>
      <div class="flash-body">
        <span class="flash-kicker">${ICON.bolt}<span id="flashH">${esc(secTitle('flash', 'home.flash'))}</span></span>
        <h3>${esc(p.short)}</h3>
        <div class="price-line"><span class="now">${tnd(p.price)}</span>${p.was ? `<s class="was">${tnd(p.was)}</s>` : ''}<span class="sale-pill">${esc(t('deal.off', { n: p.sale.pct }))}</span></div>
        <p class="flash-ends">${countdown(p.sale.until)}</p>
        <a class="btn btn-solid" href="#/product/${p.id}">${ICON.bolt} ${esc(t('flash.cta'))}</a>
      </div>
    </section>`;
}

const bundleName = b => b.name?.[lang()] || b.name?.en || t('bundle.untitled');
function bundlesSection() {
  if (sectionHidden('bundles')) return '';
  const list = liveBundles();
  if (!list.length) return '';
  return `<section class="home-block bundles">${sectionHead('bundles', 'home.bundles', 'home.bundlesD')}
    <div class="bundle-grid">${list.slice(0, 6).map(b => {
      const items = b.items.map(id => byId[id]);
      const full = items.reduce((s, p) => s + p.price, 0), price = Math.round(full * (100 - b.pct) * 10) / 1000;
      return `<article class="bundle card">
        <div class="bundle-arts">${items.map(p => `<a class="bundle-art" href="#/product/${p.id}" aria-label="${esc(p.short)}">${media(p, 'thumb')}</a>`).join('<span class="bundle-plus" aria-hidden="true">+</span>')}</div>
        <h3>${esc(bundleName(b))}</h3>
        <p class="bundle-items">${items.map(p => esc(p.short)).join(' + ')}</p>
        <div class="price-line"><span class="now">${tnd(price)}</span><s class="was">${tnd(full)}</s><span class="sale-pill">${esc(t('deal.off', { n: b.pct }))}</span></div>
        <button type="button" class="btn btn-solid" data-bundle="${esc(b.id)}">${ICON.cart} ${esc(t('bundle.add'))}</button>
      </article>`; }).join('')}</div></section>`;
}

/* Best sellers: what real orders of the last 30 days sold most, then the owner's list. */
function bestSection() {
  if (sectionHidden('best')) return '';
  const since = Date.now() - 30 * 864e5, sold = {};
  for (const o of allOrders()) if (o.date >= since) for (const [id, q] of o.items) if (byId[id] && isListed(id)) sold[id] = (sold[id] || 0) + q;
  const ids = [...new Set([...Object.keys(sold).sort((a, b) => sold[b] - sold[a]), ...listed(PAGE_SECTIONS.best).map(p => p.id)])].slice(0, 10);
  if (!ids.length) return '';
  return `<section class="home-block best">${blockHead('best', 'home.best')}${hscroll(ids.map((id, i) =>
    `<div class="rank-item"><span class="rank-n" aria-hidden="true">${i + 1}</span>${tile(byId[id], i)}</div>`).join(''))}</section>`;
}

/* Top-up calculator: the biggest pack a budget buys, and the next one up. */
const topupGames = () => [...new Set(PRODUCTS.filter(p => p.cat === 'mobile' && isListed(p.id)).map(p => p.sub))];
function calcResult(sub, budget) {
  const packs = PRODUCTS.filter(p => p.cat === 'mobile' && p.sub === sub && isListed(p.id)).sort((a, b) => a.price - b.price);
  if (!packs.length) return '';
  const fit = packs.filter(p => p.price <= budget).pop(), up = packs.find(p => p.price > budget);
  const pick = (p, label) => `<a class="calc-pick" href="#/product/${p.id}">${media(p, 'thumb')}<span class="txt"><small>${esc(label)}</small><b>${esc(valueOf(p) || p.short)}</b><span>${tnd(p.price)}</span></span>${ICON.chev}</a>`;
  return (fit ? pick(fit, t('calc.best')) : `<p class="hint">${esc(t('calc.none', { price: tnd(packs[0].price) }))}</p>`)
    + (up ? pick(up, t('calc.more', { n: tnd(Math.round((up.price - budget) * 1000) / 1000) })) : '');
}
function calcSection() {
  if (sectionHidden('calc')) return '';
  const games = topupGames();
  if (!games.length) return '';
  return `<section class="home-block calc card">
    ${sectionHead('calc', 'home.calc', 'calc.d')}
    <form class="calc-form" id="calcForm" novalidate>
      <label class="field"><span class="label">${esc(t('calc.game'))}</span>
        <select class="select" name="game">${games.map(s => `<option value="${esc(s)}">${esc(subLabel(s))}</option>`).join('')}</select></label>
      <label class="field"><span class="label">${esc(t('calc.budget'))}</span>
        <input name="budget" type="number" inputmode="decimal" min="1" max="5000" step="1" value="50" dir="ltr"></label>
    </form>
    <div class="calc-out" id="calcOut" aria-live="polite">${calcResult(games[0], 50)}</div>
  </section>`;
}

/* Gift finder: gift cards and top-ups for a budget and a platform. */
const FINDER_BUDGETS = [20, 50, 100, 0];   // 0 = over 100 DT
function finderList(budget, plat) {
  let list = PRODUCTS.filter(p => (p.cat === 'cards' || p.cat === 'mobile') && isListed(p.id));
  if (plat === 'mobile') list = list.filter(p => p.cat === 'mobile');
  else if (plat !== 'any') list = list.filter(p => p.sub === plat);
  list = budget ? list.filter(p => p.price <= budget).sort((a, b) => b.price - a.price) : list.filter(p => p.price > 100).sort((a, b) => a.price - b.price);
  return list.slice(0, 8);
}
const finderOut = (budget, plat) => { const l = finderList(budget, plat); return l.length ? l.map(tile).join('') : `<p class="hint">${esc(t('finder.none'))}</p>`; };
function finderSection() {
  if (sectionHidden('finder')) return '';
  const plats = ['any', ...['steam', 'playstation', 'xbox', 'itunes', 'nintendo', 'fortnite', 'razer'].filter(s => PRODUCTS.some(p => p.sub === s && isListed(p.id))), 'mobile'];
  const chip = (kind, v, label, on) => `<button type="button" class="fchip" data-finder="${kind}" data-v="${esc(v)}" aria-pressed="${on}">${esc(label)}</button>`;
  return `<section class="home-block finder card" id="finder">
    ${sectionHead('finder', 'home.finder', 'finder.d')}
    <div class="finder-row" role="group" aria-label="${esc(t('finder.budget'))}"><span class="finder-label">${esc(t('finder.budget'))}</span>
      ${FINDER_BUDGETS.map((b, i) => chip('budget', b, b ? t('finder.upTo', { price: tnd(b) }) : t('finder.over', { price: tnd(100) }), i === 1)).join('')}</div>
    <div class="finder-row" role="group" aria-label="${esc(t('finder.for'))}"><span class="finder-label">${esc(t('finder.for'))}</span>
      ${plats.map((s, i) => chip('plat', s, s === 'any' ? t('finder.any') : s === 'mobile' ? t('finder.mobile') : subLabel(s), i === 0)).join('')}</div>
    <div class="grid-tiles finder-out" id="finderOut" aria-live="polite">${finderOut(50, 'any')}</div>
  </section>`;
}

/* Coming soon: products the owner gave a release date in the future. */
function upcomingSection() {
  if (sectionHidden('upcoming')) return '';
  const now = todayIso();
  const list = PRODUCTS.filter(p => p.release && p.release > now && isListed(p.id)).sort((a, b) => a.release.localeCompare(b.release)).slice(0, 12);
  if (!list.length) return '';
  return `<section class="home-block upcoming">${blockHead('upcoming', 'home.upcoming')}${hscroll(list.map((p, i) =>
    `<div class="rank-item soon-item"><span class="soon-date">${ICON.clock}${esc(t('soon.on', { date: fmtDate(p.release + 'T12:00:00') }))}</span>${tile(p, i)}</div>`).join(''))}</section>`;
}

/* Customer reviews: only the ones the owner adds. */
const starRow = n => `<span class="stars" role="img" aria-label="${esc(t('reviews.stars', { n }))}">${'★'.repeat(n)}<span class="stars-off">${'★'.repeat(5 - n)}</span></span>`;
const G_MARK = '<svg class="g-mark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"/></svg>';
const ownReviewCard = r => { const p = r.product && byId[r.product]; return `<figure class="review card">
  ${starRow(r.stars)}<blockquote dir="auto">${esc(r.text)}</blockquote>
  <figcaption><b dir="auto">${esc(r.name)}</b>${p ? ` · <a href="#/product/${p.id}">${esc(t('reviews.on', { name: p.short }))}</a>` : ''}</figcaption></figure>`; };
const googleReviewCard = r => `<figure class="review card g-review">
  <div class="g-head">${r.photo ? `<img src="${esc(r.photo)}" alt="" width="36" height="36" loading="lazy" referrerpolicy="no-referrer">` : `<span class="g-initial" aria-hidden="true">${esc(r.name.slice(0, 1))}</span>`}
    <span class="g-who"><b dir="auto">${r.profile ? `<a href="${esc(r.profile)}" target="_blank" rel="noopener">${esc(r.name)}</a>` : esc(r.name)}</b><small>${esc(r.when)}</small></span>${G_MARK}</div>
  ${starRow(r.stars)}${r.text ? `<blockquote dir="auto">${esc(r.text)}</blockquote>` : ''}
  ${r.link ? `<a class="g-open" href="${esc(r.link)}" target="_blank" rel="noopener">${esc(t('reviews.onGoogle'))}</a>` : ''}</figure>`;
/* A review the owner copied from the store's Google page: Google's look, and a link back to that page. */
const copiedGoogleCard = r => googleReviewCard({ name: r.name, stars: r.stars, text: r.text, when: r.when || '', photo: '', profile: '',
  link: EXTRAS.google?.placeId ? googleLinks(EXTRAS.google.placeId).all : '' });

/* Customer reviews: the store's Google reviews (when connected in the admin),
   then the ones the owner adds by hand. */
function reviewsSection() {
  const list = EXTRAS.reviews || [], g = EXTRAS.google || {};
  if (sectionHidden('reviews') || (!list.length && !g.placeId)) return '';
  const avg = list.length ? Math.round(list.reduce((s, r) => s + r.stars, 0) / list.length * 10) / 10 : 0;
  const links = g.placeId ? googleLinks(g.placeId) : null;
  const head = `<span class="reviews-avg" id="reviewsAvg">${list.length && !g.key ? `${starRow(Math.round(avg))} ${esc(t('reviews.avg', { avg: num(avg), count: plural('reviews', list.length) }))}` : ''}</span>`;
  return `<section class="home-block reviews" ${g.placeId ? `data-gplace="1"` : ''}>${blockHead('reviews', 'home.reviews', head)}
    ${g.key && consent() !== 'all' ? `<p class="g-consent">${esc(t('reviews.consent'))} <button type="button" class="btn btn-ghost btn-sm" data-consent-allow>${esc(t('reviews.allow'))}</button></p>` : ''}
    ${links ? `<div class="g-links">${G_MARK}<a class="btn btn-ghost btn-sm" href="${esc(links.all)}" id="gAll" target="_blank" rel="noopener">${esc(t('reviews.seeAll'))} ${ICON.out}</a>
      <a class="btn btn-ghost btn-sm" href="${esc(links.write)}" target="_blank" rel="noopener">${ICON.plus} ${esc(t('reviews.write'))}</a></div>` : ''}
    ${hscroll(list.map(r => (r.source === 'google' ? copiedGoogleCard(r) : ownReviewCard(r))).join(''))}</section>`;
}
/** Fill the review section with the store's Google rating and reviews. */
function loadGoogleReviews(root) {
  const sec = root.querySelector('.reviews[data-gplace]'), g = EXTRAS.google || {};
  if (!sec || !g.key || consent() !== 'all') return;
  googleReviews(g, lang()).then(d => {
    if (!sec.isConnected) return;
    const row = sec.querySelector('.hscroll');
    row.insertAdjacentHTML('afterbegin', d.reviews.map(googleReviewCard).join(''));
    if (d.count) $('#reviewsAvg', sec).innerHTML = `${starRow(Math.round(d.rating))} ${esc(t('reviews.google', { avg: num(d.rating), count: plural('reviews', d.count) }))}`;
    if (d.mapsUri) $('#gAll', sec)?.setAttribute('href', d.mapsUri);
  }).catch(() => { /* Google unreachable or the key refused: the links and the store's own reviews stay */ });
}

/* How delivery works, and the ways to pay. */
function howSection() {
  if (sectionHidden('how')) return '';
  const steps = [['shield', 'how.pay', 'how.payD'], ['mail', 'how.get', 'how.getD'], ['bolt', 'how.play', 'how.playD']];
  return `<section class="home-block how card">
    ${sectionHead('how', 'home.how')}
    <ol class="how-steps">${steps.map(([icon, ti, d], i) => `<li><span class="how-ico">${ICON[icon]}</span><div><b><span class="sr">${i + 1}. </span>${esc(t(ti))}</b><p>${esc(t(d))}</p></div></li>`).join('')}</ol>
    <div class="how-pay"><span>${esc(t('how.payWith'))}</span>
      <span class="pay-brands">${payLogos('visa', 'mc', 'edinar', 'd17', 'ooredoo')}</span></div>
  </section>`;
}

/* "Someone just bought": a small note made from real orders, a few at a time. */
function buyBubble(cleanups) {
  if (sectionHidden('bubble')) return;
  const seen = new Set(), feed = [];
  for (const o of allOrders()) for (const [id] of o.items) if (byId[id] && isListed(id) && !seen.has(id)) { seen.add(id); feed.push({ p: byId[id], when: o.date }); }
  if (!feed.length) return;
  const rtf = new Intl.RelativeTimeFormat(langInfo().locale, { numeric: 'auto' });
  const ago = ms => { const m = Math.round(ms / 60000); return m < 60 ? rtf.format(-Math.max(1, m), 'minute') : m < 1440 ? rtf.format(-Math.round(m / 60), 'hour') : rtf.format(-Math.round(m / 1440), 'day'); };
  const box = document.createElement('div');
  box.className = 'buy-bubble';
  box.hidden = true;
  document.body.append(box);
  let i = 0, shown = 0, timer;
  const hide = () => { box.classList.remove('in'); setTimeout(() => { box.hidden = true; }, 300); };
  const show = () => {
    if (shown++ >= 6 || !document.body.contains(box)) return;
    const { p, when } = feed[i++ % feed.length];
    box.innerHTML = `<a href="#/product/${p.id}">${media(p, 'thumb')}<span class="txt"><b>${esc(t('bubble.bought', { name: p.short }))}</b><small>${esc(ago(Date.now() - when))}</small></span></a>
      <button type="button" class="bubble-x" aria-label="${esc(t('bubble.hide'))}">${ICON.plus}</button>`;
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('in'));
    timer = setTimeout(() => { hide(); timer = setTimeout(show, 16000); }, 6000);
  };
  box.addEventListener('click', e => { if (e.target.closest('.bubble-x')) { clearTimeout(timer); hide(); shown = 99; } });
  timer = setTimeout(show, 7000);
  cleanups.push(() => { clearTimeout(timer); box.remove(); });
}

function homeMore() {
  return `<div class="home-more">
    ${tickerSection()}
    ${flashSection()}
    ${dealsSection()}
    ${bundlesSection()}
    ${bestSection()}
    ${promoSection()}
    ${calcSection()}
    ${picksSection()}
    ${finderSection()}
    ${upcomingSection()}
    ${categoryRow('rowCards', 'cards', 'home.rowCards')}
    ${reviewsSection()}
    ${categoryRow('rowMobile', 'mobile', 'home.rowMobile')}
    ${howSection()}
    ${categoryRow('rowSoftware', 'software', 'home.rowSoftware')}
  </div>`;
}

function mountHomeMore(el, cleanups, later = false) {
  /* The first screen paints first; the rest is built in the next idle moment
     (at once if the shopper returns to a spot further down). */
  let filled = !later;
  const fill = () => {
    if (filled) return;
    filled = true;
    const host = $('#homeMore', el);
    if (!host) return;
    host.outerHTML = homeMore();
    const more = $('.home-more', el);
    fitAll(more);
    contentGrew(more);
    loadGoogleReviews(more);
  };
  if (later) {
    const idle = window.requestIdleCallback ? requestIdleCallback(fill, { timeout: 250 }) : setTimeout(fill, 60);
    el._ensureScroll = () => fill();
    cleanups.push(() => { (window.cancelIdleCallback && window.requestIdleCallback ? cancelIdleCallback : clearTimeout)(idle); delete el._ensureScroll; });
  }
  const onClick = e => {
    const hs = e.target.closest('[data-hs]');
    if (hs) {
      const row = hs.closest('.home-block')?.querySelector('.hscroll');
      const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
      row?.scrollBy({ left: +hs.dataset.hs * rtl * row.clientWidth * 0.85, behavior: calm() ? 'auto' : 'smooth' });
      return;
    }
    if (e.target.closest('[data-to-deals]')) {
      const deals = $('#deals', el);
      if (deals) { e.preventDefault(); deals.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' }); }
      return;
    }
    if (e.target.closest('[data-consent-allow]')) {
      setConsent('all');
      e.target.closest('.g-consent')?.remove();
      loadGoogleReviews(el);
      return;
    }
    const bundle = e.target.closest('[data-bundle]');
    if (bundle) {
      const b = liveBundles().find(x => x.id === bundle.dataset.bundle);
      if (b && addBundle(b.id)) toast(t('bundle.added', { name: bundleName(b) }), true);
      return;
    }
    const fchip = e.target.closest('[data-finder]');
    if (fchip) {
      fchip.parentElement.querySelectorAll('[data-finder]').forEach(c => c.setAttribute('aria-pressed', String(c === fchip)));
      const box = fchip.closest('.finder'), pick = k => box.querySelector(`[data-finder="${k}"][aria-pressed="true"]`).dataset.v;
      const out = $('#finderOut', box);
      out.innerHTML = finderOut(+pick('budget'), pick('plat'));
      fitAll(out);
      return;
    }
    const code = e.target.closest('[data-code]');
    if (code) {
      const done = () => toast(t('promo.copied', { code: code.dataset.code }), true);
      navigator.clipboard?.writeText(code.dataset.code).then(done, done) ?? done();
    }
  };
  const onCalc = e => {
    const form = e.target.closest('#calcForm');
    if (!form) return;
    const out = $('#calcOut', el), budget = Math.max(0, +form.elements.budget.value || 0);
    out.innerHTML = calcResult(form.elements.game.value, budget);
    fitAll(out);
  };
  el.addEventListener('click', onClick);
  el.addEventListener('input', onCalc);
  el.addEventListener('change', onCalc);
  buyBubble(cleanups);
  cleanups.push(() => { el.removeEventListener('click', onClick); el.removeEventListener('input', onCalc); el.removeEventListener('change', onCalc); });
}

const home = {
  title: () => t('home.title'),
  render: () => `
    <h1 class="sr">${esc(t('home.title'))} · TechGarage</h1>
    <div class="main${sectionHidden('drops') && sectionHidden('recent') ? ' no-left' : ''}">
      <div class="col-left">
        <section class="card" style="display:flex;flex-direction:column;min-height:0" ${sectionHidden('drops') ? 'hidden' : ''}>
          <div class="card-head">
            <span class="flame">${ICON.flame}</span>
            <h2>${esc(secTitle('drops', 'home.newDrops'))}</h2>
            <div class="sort">
              <button class="sort-btn" id="sortBtn" aria-expanded="false">
                ${esc(t('home.sortBy'))} <b id="sortLabel">${esc(t('sort.new'))}</b>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7l-4 4m0 0l4 4M4 11h8M16 17l4-4m0 0l-4-4m4 4h-8"/></svg>
              </button>
              <div class="pop" id="sortPop" role="menu">
                ${SORTS.map(s => `<button class="sort-opt" role="menuitemradio" data-sort="${s}" aria-checked="${s === 'new'}">${esc(t('sort.' + s))}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="drops" id="drops"></div>
        </section>
        <section class="card" ${sectionHidden('recent') ? 'hidden' : ''}>
          <div class="card-head"><h2>${esc(secTitle('recent', 'home.recent'))}</h2></div>
          <div class="recent" id="recent"></div>
        </section>
      </div>

      <div class="col-right">
        <section class="hero" id="hero" aria-roledescription="carousel" aria-label="${esc(t('home.featured'))}" ${sectionHidden('hero') || !listed(HERO).length ? 'hidden' : ''}>
          <span class="badge">${ICON.flame} ${esc(secTitle('hero', 'home.trending'))}</span>
          <div class="hero-ticks" id="ticks"></div>
          <div class="hero-nav">
            <button id="prev" aria-label="${esc(t('prev'))}">${chevron('prev')}</button>
            <button id="next" aria-label="${esc(t('next'))}">${chevron('next')}</button>
          </div>
        </section>

        <section ${sectionHidden('shelf') ? 'hidden' : ''}>
          <div class="shelf-head">
            <h2 id="shelfTitle">${esc(secTitle('shelf', 'home.youMightLike'))}</h2>
            <a class="see-all" id="seeAll" href="#/shop">${esc(t('home.seeAll'))}</a>
          </div>
          <div class="shelf" id="shelf">
            ${(PAGE_SECTIONS.shelf.length ? listed(PAGE_SECTIONS.shelf) : PRODUCTS.filter(p => !HERO.includes(p.id) && p.cat === 'games').slice(0, 10)).map(tile).join('')}
          </div>
        </section>
      </div>
    </div>
    <div id="homeMore"></div>`,

  mount(el) {
    const cleanups = [];
    mountHomeMore(el, cleanups, true);

    /* ── hero carousel ── */
    const hero = $('#hero', el), ticks = $('#ticks', el);
    const slides = listed(HERO);
    const DWELL = 7000;
    let cur = 0, timer = null;

    slides.forEach((p, i) => {
      const s = document.createElement('article');
      s.className = 'slide' + (i === 0 ? ' on' : '');
      s.innerHTML = `
        ${media(p, 'slide-art', { eager: true, mode: 'banner' })}
        <div class="slide-body">
          <div class="chips">${p.tags.map(tag => `<span class="chip">${esc(word(tag))}</span>`).join('')}</div>
          <h2 class="slide-title">${esc(p.short)}</h2>
          <p>${esc(blurb(p))}</p>
          <div class="price-line">
            <span class="now">${tnd(p.price)}</span>
            <span class="note">${esc(isShipped(p) ? t('note.ship', { days: SHIPPING.tn.days }) : t(deliveryType(p) === 'topup' ? 'note.minutes' : 'note.instant'))}</span>
          </div>
          <div class="slide-cta">
            <button class="btn btn-solid" data-buy="${p.id}">${ICON.bolt} ${esc(t('buy.now'))}</button>
            <button class="btn btn-ghost" data-add="${p.id}" aria-label="${esc(t('buy.add'))}">${ICON.cart} <span>${esc(t('buy.add'))}</span></button>
            <a class="btn btn-icon" href="#/product/${p.id}" aria-label="${esc(t('buy.more', { name: p.short }))}">${ICON.dots}</a>
          </div>
        </div>`;
      const vid = videoTag(p);
      if (vid) {
        const art = $('.slide-art', s);
        art.insertAdjacentHTML('beforeend', vid);
        s.insertAdjacentHTML('beforeend', videoToggle());
        s.classList.add('has-video');
      }
      hero.append(s);
      const tk = document.createElement('button');
      tk.className = 'tick' + (i === 0 ? ' on' : '');
      tk.innerHTML = '<i></i>';
      tk.setAttribute('aria-label', t('slide', { n: i + 1 }));
      tk.addEventListener('click', () => show(i));
      ticks.append(tk);
    });
    const slideEls = $$('.slide', hero);
    document.documentElement.style.setProperty('--dwell', DWELL + 'ms');

    slideEls.forEach(s => splitWords($('.slide-title', s)));
    let wasTimer = 0;
    function show(i, dir = i >= cur ? 1 : -1) {
      const from = cur;
      cur = (i + slides.length) % slides.length;
      if (cur !== from) {
        // the new slide wipes across from the side it comes from (mirrored in Arabic)
        const s = slideEls[cur], side = dir * (isRTL() ? -1 : 1) > 0;
        s.style.transition = 'none';
        s.style.clipPath = side ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
        void s.offsetWidth;
        s.style.transition = ''; s.style.clipPath = '';
        slideEls[from]?.classList.add('was');
        clearTimeout(wasTimer);
        wasTimer = setTimeout(() => slideEls.forEach(x => x.classList.remove('was')), 950);
      }
      slideEls.forEach((s, n) => s.classList.toggle('on', n === cur));
      syncVideos();
      $$('.tick', ticks).forEach((tk, n) => {
        tk.classList.remove('on', 'done');
        if (n < cur) tk.classList.add('done');
        if (n === cur) { void tk.offsetWidth; tk.classList.add('on'); }
      });
      restart();
    }
    const next = () => show(cur + 1, 1), prev = () => show(cur - 1, -1);
    function restart() { clearInterval(timer); if (!calm()) timer = setInterval(next, DWELL); }
    // only the slide on show plays its video, and only while the banner is on screen
    let heroSeen = true;
    function syncVideos() {
      slideEls.forEach((s, n) => { const v = $('video', s); if (n === cur && heroSeen && !document.hidden) playVideo(v); else pauseVideo(v); });
    }
    const seen = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { heroSeen = e.isIntersecting; syncVideos(); }, { threshold: 0.25 }) : null;
    seen?.observe(hero);
    document.addEventListener('visibilitychange', syncVideos);
    syncVideos();
    restart();
    cleanups.push(() => {
      clearInterval(timer); clearTimeout(wasTimer); seen?.disconnect();
      document.removeEventListener('visibilitychange', syncVideos);
      slideEls.forEach(s => pauseVideo($('video', s)));
    });

    $('#next', el).addEventListener('click', next);
    $('#prev', el).addEventListener('click', prev);
    hero.addEventListener('mouseenter', () => clearInterval(timer));
    hero.addEventListener('mouseleave', restart);

    hero.addEventListener('pointermove', e => {
      if (calm()) return;
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      const artEl = slideEls[cur]?.querySelector('.slide-art');
      if (artEl) artEl.style.transform = `scale(1.05) translate3d(${x * -14}px, ${y * -10}px, 0)`;
    });
    hero.addEventListener('pointerleave', () => {
      const artEl = slideEls[cur]?.querySelector('.slide-art');
      if (artEl) artEl.style.transform = '';
    });
    /* swipe and arrow keys follow reading direction: "forward" is left in Arabic */
    let sx = null;
    hero.addEventListener('pointerdown', e => sx = e.clientX);
    hero.addEventListener('pointerup', e => {
      if (sx === null) return;
      const d = (e.clientX - sx) * (isRTL() ? -1 : 1);
      if (Math.abs(d) > 56) (d < 0 ? next : prev)();
      sx = null;
    });
    const onKey = e => {
      if (e.target.closest('input, textarea, select')) return;
      const fwd = isRTL() ? 'ArrowLeft' : 'ArrowRight', back = isRTL() ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === fwd) next();
      if (e.key === back) prev();
    };
    document.addEventListener('keydown', onKey);
    cleanups.push(() => document.removeEventListener('keydown', onKey));

    /* ── new drops ── */
    let by = 'new';
    const drops = () => {
      $('#drops', el).innerHTML = sortList(listed(NEW_DROPS), by).map(p => `
        <article class="drop" data-view="${p.id}">
          ${media(p, 'shot')}
          <div class="drop-meta">
            <div style="flex:1;min-width:0"><h3>${esc(p.short)}</h3><span class="px">${tnd(p.price)}</span></div>
            <button class="round" data-add="${p.id}" aria-label="${esc(t('buy.addNamed', { name: p.short }))}">${ICON.plus}</button>
          </div>
        </article>`).join('');
    };
    drops();
    const sortBtn = $('#sortBtn', el), sortPop = $('#sortPop', el);
    sortBtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = !sortPop.classList.contains('open');
      $$('.pop.open').forEach(p => p.classList.remove('open'));
      sortPop.classList.toggle('open', open);
      sortBtn.setAttribute('aria-expanded', String(open));
    });
    sortPop.addEventListener('click', e => {
      e.stopPropagation();
      const b = e.target.closest('[data-sort]');
      if (!b) return;
      by = b.dataset.sort;
      $('#sortLabel', el).textContent = t('sort.' + by);
      $$('[data-sort]', sortPop).forEach(o => o.setAttribute('aria-checked', String(o.dataset.sort === by)));
      sortPop.classList.remove('open');
      sortBtn.setAttribute('aria-expanded', 'false');
      drops();
    });

    /* ── recently viewed: real history first, demo history otherwise ── */
    const recentNote = r =>
      r.note === 'deliveredOn' ? t('home.deliveredOn', { date: fmtDate(Date.parse(r.date)) }) :
      r.note === 'inBasket' ? t('home.inBasket') :
      r.note === 'viewedYesterday' ? t('home.viewedYesterday') : t('home.viewedRecently');
    const recent = state.viewed.length ? state.viewed.slice(0, 4).map(id => ({ id, note: 'viewed' })) : RECENT;
    $('#recent', el).innerHTML = recent.map(r => {
      const p = isListed(r.id) && byId[r.id];
      return p ? `<div class="recent-row" data-view="${p.id}" role="link" tabindex="0">
        ${media(p, 'thumb')}
        <span class="txt"><b>${esc(p.short)}</b><span>${esc(recentNote(r))}</span></span>
        <button class="round" data-add="${p.id}" aria-label="${esc(t('buy.addNamed', { name: p.short }))}">${ICON.plus}</button>
      </div>` : '';
    }).join('');

    return () => cleanups.forEach(f => f());
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Shop — all products, a category, a subcategory, or search results
   ══════════════════════════════════════════════════════════════════════ */
const PRICE_BANDS = ['any', '0-50', '50-100', '100-200', '200-'];
const SHOP_SORTS = ['featured', 'low', 'high', 'az'];

const shopHash = ({ cat = '', sub = '', q = '', price = 'any', sort = 'featured' }) => {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (price !== 'any') p.set('price', price);
  if (sort !== 'featured') p.set('sort', sort);
  const s = p.toString();
  return `#/shop${cat ? '/' + cat : ''}${cat && sub ? '/' + sub : ''}${s ? '?' + s : ''}`;
};

function shopState(ctx) {
  const cat = CATEGORIES.some(c => c.id === ctx.params[0] && c.id !== 'all') ? ctx.params[0] : '';
  const sub = cat && subsOf(cat).includes(ctx.params[1]) ? ctx.params[1] : '';
  const q = (ctx.query.get('q') || '').trim();
  const price = PRICE_BANDS.includes(ctx.query.get('price')) ? ctx.query.get('price') : 'any';
  const sort = SHOP_SORTS.includes(ctx.query.get('sort')) ? ctx.query.get('sort') : 'featured';
  let base = q ? searchProducts(q) : [...PRODUCTS];
  if (cat) base = base.filter(p => p.cat === cat);
  const inCat = base;                                  // before the subcategory, for chip counts
  if (sub) base = base.filter(p => p.sub === sub);
  if (price !== 'any') {
    const [lo, hi] = price.split('-').map(v => v === '' ? Infinity : +v);
    base = base.filter(p => p.price >= lo && p.price < hi);
  }
  if (sort !== 'featured') base = sortList(base, sort);
  // outside search and a single brand, each gift card brand / mobile game is one tile
  const grouped = !q && !sub, seen = new Set(), items = [];
  for (const p of base) {
    const fam = grouped && familyOf(p);
    if (!fam) items.push({ p });
    else if (!seen.has(fam)) { seen.add(fam); items.push({ fam }); }
  }
  // a brand tile shows its lowest price, so price sorting goes by that
  const shown = it => it.p ? it.p.price : Math.min(...familyVariants(it.fam).map(v => v.price));
  if (sort === 'low' || sort === 'high') items.sort((a, b) => (shown(a) - shown(b)) * (sort === 'high' ? -1 : 1));
  return { cat, sub, q, price, sort, list: base, inCat, items };
}

/** The glass header of a category: title, line, category chips and three
    fanned covers that shuffle when you move between categories. */
function catHero(s, title) {
  // covers follow the catalogue's own order, so sorting the grid doesn't reshuffle them
  const shown = new Set(s.items.map(it => (it.fam ? familyLead(it.fam) : it.p)?.id));
  const covers = PRODUCTS.filter(p => shown.has(p.id)).slice(0, 3);
  const key = 'hero.d.' + (s.sub ? 'sub' : s.cat || 'all');
  const line = t(key) === key ? t('hero.d.default') : t(key);
  const cats = CATEGORIES.filter(c => c.id !== 'all');
  return `
    <section class="cat-hero" id="catHero">
      <div class="cat-hero-txt">
        <p class="eyebrow" data-intro>${esc(plural('products', s.items.length))} · ${esc(STORE.name)}</p>
        <h1>${esc(title)}</h1>
        <p class="cat-hero-d" data-intro>${esc(line)}</p>
        <nav class="chip-row cat-chips" data-intro aria-label="${esc(t('shop.category'))}">
          <a class="fchip" href="#/shop" ${!s.cat ? 'aria-current="true"' : ''}>${esc(t('cat.allProducts'))}</a>
          ${cats.map(c => `<a class="fchip" href="#/shop/${c.id}" ${s.cat === c.id && !s.sub ? 'aria-current="true"' : ''}>${esc(catLabel(c.id))}</a>`).join('')}
        </nav>
      </div>
      <div class="cat-covers" aria-hidden="true">
        ${covers.map((p, i) => `<div class="cover cover-${i}">${media(p, 'cover-art', { eager: true })}</div>`).join('')}
      </div>
    </section>`;
}

const shop = {
  title: ctx => { const s = shopState(ctx); return s.q ? t('shop.results', { q: s.q }) : s.sub ? subLabel(s.sub) : catLabel(s.cat); },
  render(ctx) {
    const s = shopState(ctx);
    const title = s.q ? t('shop.results', { q: s.q }) : s.sub ? subLabel(s.sub) : catLabel(s.cat);
    const trail = [[t('home'), '#/'], [t('shop.title'), '#/shop'],
      ...(s.cat ? [[catLabel(s.cat), shopHash({ cat: s.cat })]] : []),
      ...(s.sub ? [[subLabel(s.sub), '']] : []),
      ...(s.q ? [[`“${s.q}”`, '']] : [])];
    const cats = CATEGORIES.filter(c => c.id !== 'all');
    // brand pages already show one tile per brand, so the chip row would repeat them
    const subs = s.cat && !FAMILY_CATS.includes(s.cat) ? subsOf(s.cat).filter(id => s.inCat.some(p => p.sub === id)) : [];
    const sortSelect = `
          <label class="select-wrap">
            <span class="sr">${esc(t('shop.sort'))}</span>
            <select id="shopSort" class="select">
              ${SHOP_SORTS.map(id => `<option value="${id}" ${id === s.sort ? 'selected' : ''}>${esc(t('ssort.' + id))}</option>`).join('')}
            </select>
          </label>`;
    return `
      <div class="page">
        ${s.q ? pageHead(title, plural('products', s.items.length), trail, sortSelect) : `
          ${crumbs(trail)}
          ${catHero(s, title)}
          <div class="shop-bar"><p>${esc(t('shop.showing', { what: plural('products', s.items.length) }))}</p>${sortSelect}</div>`}
        ${subs.length ? `
          <nav class="sub-chips" aria-label="${esc(catLabel(s.cat))}">
            <a class="fchip" href="${shopHash({ ...s, sub: '' })}" ${!s.sub ? 'aria-current="true"' : ''}>${esc(t('sub.all'))} <em>${s.inCat.length}</em></a>
            ${subs.map(id => `<a class="fchip" href="${subHref(s.cat, id, s)}" ${s.sub === id ? 'aria-current="true"' : ''}>${esc(subLabel(id))} <em>${s.inCat.filter(p => p.sub === id).length}</em></a>`).join('')}
          </nav>` : ''}
        <div class="shop">
          <aside class="filters card" aria-label="${esc(t('shop.filters'))}">
            <h2 class="sr">${esc(t('shop.filters'))}</h2>
            <h3>${esc(t('shop.category'))}</h3>
            <nav class="filter-list">
              <a href="${shopHash({ ...s, cat: '', sub: '' })}" ${!s.cat ? 'aria-current="true"' : ''}>${esc(t('cat.allProducts'))} <em>${PRODUCTS.length}</em></a>
              ${cats.map(c => `
                <a href="${shopHash({ ...s, cat: c.id, sub: '' })}" ${s.cat === c.id && !s.sub ? 'aria-current="true"' : ''} ${s.cat === c.id ? 'data-open' : ''}>${esc(catLabel(c.id))} <em>${PRODUCTS.filter(p => p.cat === c.id).length}</em></a>
                ${s.cat === c.id ? `<div class="filter-subs">${subsOf(c.id).map(id =>
                  `<a href="${subHref(c.id, id, s)}" ${s.sub === id ? 'aria-current="true"' : ''}>${esc(subLabel(id))} <em>${PRODUCTS.filter(p => p.sub === id).length}</em></a>`).join('')}</div>` : ''}`).join('')}
            </nav>
            <h3>${esc(t('shop.price'))}</h3>
            <div class="chip-row">
              ${PRICE_BANDS.map(id => `<a class="fchip" href="${shopHash({ ...s, price: id })}" ${s.price === id ? 'aria-current="true"' : ''}>${esc(t('price.' + id))}</a>`).join('')}
            </div>
            ${s.q || s.price !== 'any' || s.sort !== 'featured' ? `<a class="clear-filters" href="${shopHash({ cat: s.cat, sub: s.sub })}">${esc(t('shop.clear'))}</a>` : ''}
          </aside>
          <section class="shop-results" aria-labelledby="resultsH">
            <h2 class="sr" id="resultsH">${esc(t('shop.listH'))}</h2>
            ${s.items.length
              ? `<div class="grid-tiles" id="shopGrid" data-total="${s.items.length}">${shopTiles(s.items, 0)}</div>
                 ${s.items.length > SHOP_BATCH ? `<div class="more-wrap"><button class="btn more-tiles" id="moreTiles" type="button">${esc(t('shop.more', { n: s.items.length - SHOP_BATCH }))}</button></div>` : ''}`
              : emptyState(ICON.search, t('shop.none'), esc(s.q ? t('shop.noneQ', { q: s.q }) : t('shop.nonePrice')),
                  `<a class="btn btn-solid" href="${shopHash({ cat: s.cat, sub: s.sub })}">${esc(t('shop.clear'))}</a>`)}
          </section>
        </div>
      </div>`;
  },
  mount(el, ctx) {
    const s = shopState(ctx);
    $('#shopSort', el).addEventListener('change', e => go(shopHash({ ...s, sort: e.target.value })));
    const stopParallax = parallax($('#catHero', el));
    // long lists arrive in batches: the next one is added as the shopper nears the end
    const grid = $('#shopGrid', el), btn = $('#moreTiles', el);
    let shown = Math.min(SHOP_BATCH, s.items.length), watch = null;
    const more = () => {
      if (shown >= s.items.length) return;
      grid.insertAdjacentHTML('beforeend', shopTiles(s.items, shown));
      shown = Math.min(shown + SHOP_BATCH, s.items.length);
      fitAll(grid);
      contentGrew(grid);
      if (shown >= s.items.length) { watch?.disconnect(); btn.parentElement.remove(); }
      else btn.textContent = t('shop.more', { n: s.items.length - shown });
    };
    if (btn) {
      btn.addEventListener('click', more);
      if ('IntersectionObserver' in window) {
        watch = new IntersectionObserver(es => es.some(e => e.isIntersecting) && more(), { rootMargin: '0px 0px 900px 0px' });
        watch.observe(btn);
      }
    }
    // Back to a spot far down the list: add batches until the page is long enough
    el._ensureScroll = y => { while (shown < s.items.length && el.scrollHeight < y + innerHeight * 2) more(); };
    return () => { stopParallax?.(); watch?.disconnect(); delete el._ensureScroll; };
  }
};

/* Key art behind the whole page (p.banner: { srcset: [[src, width], …], focus }).
   A product with key art, and every version of its game, shows it as the page's own
   background; any other product uses its own photo, blurred harder (it is small): fixed, softly blurred and dimmed behind the glass, fading in on arrival
   and out on leaving. The browser picks the file that suits the screen (srcset). */
const bannerOf = p => p && ((p.wall && p.wallBg ? { srcset: [[srcOf(p.wall), 1600]], focus: '50% 40%' } : null) || p.banner || (p.game ? familyVariants(familyOf(p)).find(v => v.banner)?.banner : null)) || null;

export function pageArt(name, params) {
  const p = name === 'product' ? byId[params?.[0]] : null;
  // no wallpaper yet: the product's own photo, blurred harder, stands in for it
  const b = bannerOf(p) || (p?.img ? { srcset: [[p.img, 640]], focus: '50% 40%', photo: true } : null);
  const root = document.documentElement;
  let el = document.getElementById('pageArt');
  if (!b?.srcset?.length) { el?.classList.remove('on'); root.classList.remove('has-art'); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'pageArt';
    el.className = 'page-art';
    el.setAttribute('aria-hidden', 'true');
    (document.querySelector('.glow') || document.body.firstElementChild).after(el);
  }
  const key = b.srcset[0][0];
  if (el.dataset.key !== key) {
    el.dataset.key = key;
    el.style.setProperty('--focus', b.focus || '50% 50%');
    const mid = b.srcset[Math.min(1, b.srcset.length - 1)][0];
    el.innerHTML = b.photo ? `<img src="${mid}" alt="" decoding="async">`
      : `<img src="${mid}" srcset="${b.srcset.map(([src, w]) => `${src} ${w}w`).join(', ')}" sizes="100vw" alt="" decoding="async">`;
    el.classList.toggle('from-photo', !!b.photo);
  }
  root.classList.add('has-art');
  requestAnimationFrame(() => el.classList.add('on'));
}

/* Steam screenshots come in 1920 × 1080 and App Store ones at 1600 px; the thumbnail strip loads a small copy. */
const thumbOf = src => String(src).replace(/(\/ss_[0-9a-f]+)\.1920x1080\.jpg/, '$1.600x338.jpg').replace(/\/1600x1600bb\.webp$/, '/400x400bb.webp');

/* The product's picture, or its video in a 16:9 frame over the picture. */
function pdpMedia(p) {
  const vid = videoTag(p);
  let main;
  if (!vid) main = media(p, 'pdp-art', { adapt: true, eager: true, alt: p.short });
  else {
    const box = media(p, 'pdp-art', { eager: true, alt: p.short, mode: 'banner' });
    const at = box.lastIndexOf('</div>');
    main = `<div class="pdp-video has-video">${box.slice(0, at)}${vid}${box.slice(at)}${videoToggle()}</div>`;
  }
  if (!p.gallery?.length) return main;
  // more photos: a strip of thumbnails under the main picture; the first one is the main picture (or the video)
  const shots = [p.img, ...p.gallery];
  return `<div class="pdp-media">${main}
    <div class="pdp-thumbs" role="listbox" aria-label="${esc(t('pdp.photos'))}">
      ${shots.map((src, i) => `<button type="button" class="pdp-thumb" role="option" aria-selected="${i === 0}" data-shot="${i}" aria-label="${esc(t('pdp.photoN', { n: i + 1, total: shots.length }))}">
        <img src="${esc(thumbOf(srcOf(src)))}" alt="" loading="lazy" decoding="async">${i === 0 && vid ? `<span class="pdp-thumb-play" aria-hidden="true">${ICON.play || '▶'}</span>` : ''}</button>`).join('')}
    </div></div>`;
}

/* ── blocks below the product, in the order the owner chose (admin → product → Page layout) ── */
/** Text copied through a wrong encoding ("WindowsÂ® 10", "Coreâ„¢") read back as it was meant. */
export const unmangle = s => {
  if (!/[ÂÃâ][-ÿ‘-™]/.test(s)) return s;
  try { return decodeURIComponent(escape(s.replace(/[‘-™]/g, ch => String.fromCharCode(CP1252[ch] ?? 63)))); } catch { return s; }
};
const CP1252 = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e,
  '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f };
function sysreqBlock(p) {
  const r = p.sysreq;
  if (!r) return '';
  const cols = ['min', 'rec'].filter(c => Object.keys(r[c] || {}).length);
  const rows = SYSREQ_KEYS.filter(k => cols.some(c => r[c][k]));
  return `<section class="block pdp-sysreq" aria-labelledby="sysH">
    <h2 id="sysH">${esc(t('pdp.sysreq'))}</h2>
    <div class="sys-table" style="--cols:${cols.length}">
      <div class="sys-row sys-head"><span></span>${cols.map(c => `<b>${esc(t('sys.' + c))}</b>`).join('')}</div>
      ${rows.map(k => `<div class="sys-row"><span>${esc(t('sys.' + k))}</span>${cols.map(c => `<p dir="auto">${esc(unmangle(r[c][k] || '—'))}</p>`).join('')}</div>`).join('')}
    </div>
  </section>`;
}
/** The owner's own redeem steps (text and pictures), on the product page and with the delivered key. */
/* The long description: the product's own, or for gift cards the brand's, in the shopper's language. */
const guideOf = p => p.guide ?? autoGuide(p);   // '' = the owner cleared it
const has = key => t(key) !== key;
const APP_NAMES = { bigo: 'BIGO Live', dramawave: 'DramaWave', dramabox: 'DramaBox', tango: 'Tango', duolingo: 'Duolingo', likee: 'Likee',
  mango: 'Mango Live', poppo: 'Poppo Live', snapchat: 'Snapchat', superlive: 'SuperLive', tiktok: 'TikTok', weplay: 'WePlay', apple: 'Apple' };
/** A game's Steam facts, or null. */
const steamOf = p => (p.cat === 'games' && p.game && STEAM[p.game]) || ((p.cat === 'cards' || p.cat === 'mobile') && STEAM['sub:' + p.sub]) || null;
function autoGuide(p) {
  if (isShipped(p)) return t('gd.hw', { days: SHIPPING.tn.days });
  if (p.cat === 'cards') return has('gd.' + p.sub) ? t('gd.' + p.sub) : '';
  const key = KIND[p.id] || '';
  if (p.cat === 'mobile' && BRAND_INFO[p.sub]) {
    const b = BRAND_INFO[p.sub];
    return t('gd.mob', { game: subLabel(p.sub), currency: b.cur, pub: b.pub, method: t(topupMethod(p) === 'id' ? 'gd.mob.id' : 'gd.mob.login') });
  }
  if (key.startsWith('app-')) return t('gd.app', { app: APP_NAMES[key.slice(4)] || p.short.split(' ')[0] });
  if (key.startsWith('sw-') && has('gd.sw.' + key.slice(3))) return t('gd.sw.' + key.slice(3));
  const s = steamOf(p);
  const d = s?.d && (s.d[lang()] || s.d.en);
  return d ? `## ${t('pdp.aboutGame')}\n${d}` : '';
}
/** Extra rows for the Details table: publisher, platforms, release date, genres… */
function detailRows(p) {
  const row = (k, v) => (v ? `<div><dt>${esc(t(k))}</dt><dd dir="auto">${esc(v)}</dd></div>` : '');
  const s = steamOf(p), b = BRAND_INFO[p.sub] || BRAND_INFO[KIND[p.id]] || null;
  let out = '';
  if (s && p.cat === 'games') {
    out += row('spec.developer', s.dev) + row('spec.publisher', s.pub);
    if (s.rel) out += row('spec.release', fmtDate(s.rel + 'T12:00:00'));
    out += row('spec.genres', (s.g?.[lang()] || s.g?.en || []).join(', '));
  }
  if (b) {
    out += row('spec.publisher', b.pub) + row('spec.worksOn', (b.on || []).join(' · ')) + row('spec.currency', b.cur);
    if (p.cat === 'mobile') out += row('spec.topupBy', t(topupMethod(p) === 'id' ? 'topup.id' : 'topup.login'));
  }
  return out;
}

/* How to redeem: the owner's own steps (admin → product), or the store's
   standard steps for that kind of product, in the shopper's language. */
const CARD_REDEEM = { steam: 'steamWallet', playstation: 'psn', itunes: 'apple', xbox: 'xbox', nintendo: 'nintendo', epic: 'epic', fortnite: 'epic',
  lol: 'riot', valorant: 'riot', razer: 'razer', battlenet: 'battlenet', binance: 'crypto', bybit: 'crypto', redotpay: 'crypto' };
function redeemKind(p) {
  const d = deliveryType(p), tag = String(p.tags?.[0] || '').toLowerCase(), name = String(p.name || '').toLowerCase();
  if (d === 'topup') return topupMethod(p) === 'id' ? 'topupId' : 'topupLogin';
  if (d === 'account') return /steam/.test(tag) || p.platform === 'pc' && !/epic/.test(name) ? 'steamAcct' : 'account';
  if (p.cat === 'cards') return CARD_REDEEM[p.sub] || 'code';
  if (p.platform === 'ps5' || p.sub === 'ps') return 'psn';
  if (p.platform === 'xbox' || /xbox|microsoft/.test(tag)) return 'xbox';
  if (/^ea\b/.test(tag)) return 'eaKey';
  if (/ubisoft/.test(tag)) return 'ubiKey';
  if (/rockstar/.test(tag)) return 'rockstarKey';
  if (p.cat === 'software') return ['sw-subs', 'sw-ai'].includes(KIND[p.id]) ? 'sub' : /windows/.test(name) ? 'windows' : /office|microsoft 365/.test(name) ? 'office' : 'licence';
  return p.cat === 'games' ? 'steamKey' : 'code';
}
export const redeemOf = p => (p.redeem?.length ? p.redeem : isShipped(p) ? [] : t('rd.' + redeemKind(p)).split('|').filter(Boolean).map(text => ({ text })));
export function redeemSteps(p) {
  return `<ol class="steps redeem-steps">${redeemOf(p).map((st, i) => `
    <li><span class="step-n">${i + 1}</span><div>${st.text ? `<p dir="auto">${esc(st.text)}</p>` : ''}${st.img ? `<img src="${esc(srcOf(st.img))}" alt="" loading="lazy" decoding="async">` : ''}</div></li>`).join('')}</ol>`;
}
export const blockOrder = p => [...new Set([...(p.layout || []), ...PDP_BLOCKS])];

/* Shop grids render this many tiles at a time. */
const SHOP_BATCH = 48;
const shopTiles = (items, from) => items.slice(from, from + SHOP_BATCH)
  .map((it, i) => (it.fam ? familyTile(it.fam, i) : tile(it.p, i))).join('');

/* ══════════════════════════════════════════════════════════════════════
   Product
   ══════════════════════════════════════════════════════════════════════ */
function howItWorks(p) {
  const platform = p.platform ? t('plat.' + p.platform) : word(p.tags[0]).replace(/ Key$/, '');
  switch (deliveryType(p)) {
    case 'ship': return [[t('how.pay'), t('how.payShort')], [t('how.shipPackT'), t('how.shipPackD')], [t('how.shipGetT'), t('how.shipGetD')]];
    case 'account': return [[t('how.pay'), t('how.payD')], [t('how.loginT'), t('how.emailD')], [t('how.ownT'), t('how.ownD')]];
    case 'topup': {
      const m = topupMethod(p);
      const first = m === 'id' ? [t('how.idT'), t('how.idD')] : [t('how.gameLoginT'), t(m === 'loginFull' ? 'how.gameLoginFullD' : 'how.gameLoginD')];
      return [first, [t('how.pay'), t('how.payShort')], [t('how.creditT'), t('how.creditD')]];
    }
    case 'code':    return [[t('how.pay'), t('how.payShort')], [t('how.codeT'), t('how.emailD')], [t('how.redeemT', { platform }), t('how.redeemD')]];
    default:        return [[t('how.pay'), t('how.payShort')], [t('how.keyT'), t('how.emailD')], [t('how.activateT', { platform }), t('how.activateD')]];
  }
}

/** "In stock · 12 left" / "Only 2 left" / "Out of stock" for products with keys in stock. */
function stockBadge(id) {
  const st = stockState(id);
  if (st === 'untracked') return '';
  const n = stockOf(id).available;
  const text = st === 'out' ? t('stock.out') : st === 'low' ? t('stock.low', { n }) : `${t('stock.in')} · ${t('stock.left', { n })}`;
  return `<span class="stock-badge stock-${st}"><i aria-hidden="true"></i>${esc(text)}</span>`;
}

/** Region and value (or amount) chips that switch between a brand's variants. */
/** A game's page: pick the platform, then a key or an account. Versions the
    store doesn't sell (yet) show greyed out as "Not available". */
function gamePicker(p) {
  const vs = familyVariants(familyOf(p));
  const plat = p.platform || 'pc', kind = versionKind(p);
  const pickFor = pl => vs.find(v => v.platform === pl && versionKind(v) === kind) || vs.find(v => v.platform === pl);
  const group = (key, chips) => `
    <div class="vgroup"><span class="vlabel" id="vl-${key.replace('.', '-')}">${esc(t(key))}</span>
      <div class="vchips" role="radiogroup" aria-labelledby="vl-${key.replace('.', '-')}">${chips}</div></div>`;
  const chip = (target, on, label, sub) => target
    ? `<a class="vchip${stockState(target.id) === 'out' ? ' is-out' : ''}" href="#/product/${target.id}" role="radio" aria-checked="${on}" data-variant><b>${esc(label)}</b><small>${esc(sub)}</small></a>`
    : `<span class="vchip is-na" role="radio" aria-checked="false" aria-disabled="true"><b>${esc(label)}</b><small>${esc(t('pdp.notAvail'))}</small></span>`;
  const priceOf = v => (stockState(v.id) === 'out' ? t('stock.out') : tnd(v.price));
  const low = list => list.length ? t('fam.from', { price: tnd(Math.min(...list.map(v => v.price))) }) : '';
  return `<div class="variants">
    ${group('pdp.platform', PLATFORMS.map(pl => {
      const on = vs.filter(v => v.platform === pl), target = pickFor(pl);
      return chip(target, pl === plat, t('plat.' + pl), on.length > 1 ? low(on) : target ? priceOf(target) : '');
    }).join(''))}
    ${group('pdp.edition', ['key', 'account'].map(k => {
      const target = vs.find(v => v.platform === plat && versionKind(v) === k);
      return chip(target, k === kind, t('kind.' + k), target ? priceOf(target) : '');
    }).join(''))}
  </div>`;
}

function variantPicker(p) {
  if (isGameVersion(p)) return gamePicker(p);
  const fam = familyOf(p);
  const vs = fam ? familyVariants(fam) : [];
  if (vs.length < 2) return '';
  const regions = [...new Set(vs.map(regionOf))], reg = regionOf(p);
  const shown = (regions.length > 1 ? vs.filter(v => regionOf(v) === reg) : vs).sort((a, b) => a.price - b.price);
  const closest = r => vs.filter(v => regionOf(v) === r).sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price))[0];
  const group = (key, chips) => `
    <div class="vgroup"><span class="vlabel" id="vl-${key.replace('.', '-')}">${esc(t(key))}</span>
      <div class="vchips" role="radiogroup" aria-labelledby="vl-${key.replace('.', '-')}">${chips}</div></div>`;
  const chip = (target, on, inner) =>
    `<a class="vchip${stockState(target.id) === 'out' ? ' is-out' : ''}" href="#/product/${target.id}" role="radio" aria-checked="${on}" data-variant>${inner}</a>`;
  return `<div class="variants">
    ${regions.length > 1 ? group('pdp.region', regions.map(r => chip(closest(r), r === reg, esc(t('region.' + r)))).join('')) : ''}
    ${group(p.cat === 'cards' ? 'pdp.value' : 'pdp.amount',
            shown.map(v => chip(v, v.id === p.id, `<b dir="auto">${esc(valueOf(v))}</b><small>${stockState(v.id) === 'out' ? esc(t('stock.out')) : tnd(v.price)}</small>`)).join(''))}
  </div>`;
}

/* Each block of the product page, by id (see PDP_BLOCKS in guard.js). */
const BLOCKS = {
  wall: p => (p.wall ? `<section class="block pdp-wall"><img src="${esc(srcOf(p.wall))}" alt="" loading="lazy" decoding="async"></section>` : ''),
  guide: p => `${guideOf(p) ? `<section class="block pdp-guide" aria-labelledby="guideH">
          <h2 id="guideH">${esc(t('pdp.guide'))}</h2>
          <div class="rich" dir="auto">${richText(guideOf(p))}</div>
        </section>` : ''}`,
  sysreq: p => sysreqBlock(p),
  redeem: p => (redeemOf(p).length ? `<section class="block pdp-redeem" aria-labelledby="redeemH"><h2 id="redeemH">${esc(t('pdp.redeem'))}</h2>${redeemSteps(p)}</section>` : ''),
  how: p => `<section class="block" ${sectionHidden('pdp.how') ? 'hidden' : ''}>
          <h2>${esc(t('pdp.how'))}</h2>
          <ol class="steps">${howItWorks(p).map(([ti, d], i) => `<li><span class="step-n">${i + 1}</span><div><b>${esc(ti)}</b><p>${esc(d)}</p></div></li>`).join('')}</ol>
        </section>`,
  details: (p, { fam }) => `<section class="block" ${sectionHidden('pdp.details') ? 'hidden' : ''}>
          <h2>${esc(t('pdp.details'))}</h2>
          <dl class="spec-table">
            <div><dt>${esc(t('spec.product'))}</dt><dd>${esc(p.name)}</dd></div>
            <div><dt>${esc(t('spec.category'))}</dt><dd>${esc(catLabel(p.cat))} · ${esc(subLabel(p.sub))}</dd></div>
            <div><dt>${esc(t('spec.platform'))}</dt><dd>${esc(word(p.tags[0]))}</dd></div>
            <div><dt>${esc(t('spec.type'))}</dt><dd>${esc(word(p.tags[1] || '—'))}</dd></div>
            <div><dt>${esc(t('spec.includes'))}</dt><dd>${esc(p.specs.map(word).join(' · '))}</dd></div>
            ${detailRows(p)}
            ${fam && !isGameVersion(p) && familyVariants(fam).length > 1 ? `<div><dt>${esc(t('pdp.region'))}</dt><dd>${esc(t('region.' + regionOf(p)))}</dd></div>` : ''}
            <div><dt>${esc(t('spec.delivery'))}</dt><dd>${esc(dlvText(p))}</dd></div>
            <div><dt>${esc(t('spec.price'))}</dt><dd>${esc(t('spec.priceTax', { price: tnd(p.price) }))}</dd></div>
          </dl>
        </section>`,
  related: (p, { fam, related }) => `<section class="block" ${sectionHidden('pdp.related') ? 'hidden' : ''}>
          ${fam
            ? `<div class="block-head"><h2>${esc(t(isGameVersion(p) ? 'pdp.moreGames' : 'pdp.otherBrands'))}</h2><a class="see-all" href="#/shop/${p.cat}">${esc(t('pdp.moreIn', { cat: catLabel(p.cat) }))}</a></div>
               <div class="grid-tiles">${related.map(familyTile).join('')}</div>`
            : `<div class="block-head"><h2>${esc(t('pdp.related'))}</h2><a class="see-all" href="#/shop/${p.cat}/${p.sub}">${esc(t('pdp.moreIn', { cat: subLabel(p.sub) }))}</a></div>
               <div class="grid-tiles">${related.map(tile).join('')}</div>`}
        </section>`
};

const product = {
  title: ctx => (isListed(ctx.params[0]) && byId[ctx.params[0]]?.short) || t('pdp.notFound'),
  render(ctx) {
    const p = isListed(ctx.params[0]) && byId[ctx.params[0]];
    if (!p) return notFound.render();
    const fam = familyOf(p);
    // a brand page suggests other brands; anything else suggests its neighbours
    const related = isGameVersion(p)            // a game suggests other games
      ? [...new Set(PRODUCTS.filter(x => x.game && x.game !== p.game).map(familyOf))].slice(0, 5)
      : fam
      ? [...new Set(PRODUCTS.filter(x => x.cat === p.cat && x.sub !== fam).map(x => x.sub))].filter(f => familyVariants(f).length).slice(0, 5)
      : [...PRODUCTS.filter(x => x.sub === p.sub && x.id !== p.id),
         ...PRODUCTS.filter(x => x.cat === p.cat && x.sub !== p.sub)].slice(0, 5);
    const type = deliveryType(p);
    return `
      <div class="page">
        ${crumbs([[t('home'), '#/'], [catLabel(p.cat), `#/shop/${p.cat}`], ...(fam && !isGameVersion(p) ? [] : [[subLabel(p.sub), `#/shop/${p.cat}/${p.sub}`]]), [p.short, '']])}
        <div class="pdp">
          ${pdpMedia(p)}
          <div class="pdp-info">
            <div class="chips">${p.tags.map(tag => `<span class="chip">${esc(word(tag))}</span>`).join('')}${p.badge ? `<span class="chip chip-accent">${esc(word(p.badge))}</span>` : ''}</div>
            <h1>${esc(p.short)}</h1>
            <p class="listing">${esc(p.name)}</p>
            <p class="pdp-blurb">${esc(blurb(p))}</p>
            ${variantPicker(p)}
            <div class="price-line"><span class="now">${tnd(p.price)}</span>${p.was ? `<s class="was">${tnd(p.was)}</s><span class="sale-pill">${esc(t('deal.off', { n: p.sale.pct }))}</span>` : ''}<span class="note">${esc(t('pdp.tax'))}</span>${stockBadge(p.id)}</div>
            ${p.sale?.until ? `<p class="sale-ends">${countdown(p.sale.until, 'deal.saleEnds')}</p>` : ''}
            ${p.release && p.release > todayIso() ? `<p class="preorder">${ICON.clock}<span>${esc(t('pdp.preorder', { date: fmtDate(p.release + 'T12:00:00') }))}</span></p>` : ''}
            <ul class="facts">
              <li>${ICON.bolt}<span>${esc(dlvText(p))}</span></li>
              ${isShipped(p) ? `<li>${ICON.clock}<span>${esc(t('note.ship', { days: SHIPPING.tn.days }))}${SHIPPING.tn.free > 0 ? ' · ' + esc(t('ship.freeOver', { amount: tnd(SHIPPING.tn.free) })) : ''}</span></li>` : ''}
              <li>${ICON.shield}<span>${esc(p.specs.map(word).join(' · '))}</span></li>
            </ul>
            <div class="pdp-buy">
              <div class="stepper" role="group" aria-label="${esc(t('pdp.qty'))}">
                <button type="button" id="qtyDown" aria-label="${esc(t('basket.fewer'))}">${ICON.minus}</button>
                <output id="qty" aria-live="polite">1</output>
                <button type="button" id="qtyUp" aria-label="${esc(t('basket.more'))}">${ICON.plus}</button>
              </div>
              <button class="btn btn-solid" id="pdpBuy" ${stockState(p.id) === 'out' ? 'disabled' : ''}>${ICON.bolt} ${esc(t('buy.now'))}</button>
              <button class="btn btn-ghost" id="pdpAdd" ${stockState(p.id) === 'out' ? 'disabled' : ''}>${ICON.cart} ${esc(t('buy.add'))}</button>
              ${heartBtn(p, 'btn btn-icon pdp-heart')}
            </div>
            ${['topup', 'ship'].includes(deliveryType(p)) ? `<button type="button" class="btn btn-ghost pdp-chat" data-chat-buy="${esc(p.id)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.6-5.2A8.4 8.4 0 1 1 21 11.5z"/></svg> ${esc(t('ch.buy'))}</button>` : ''}
            ${p.url ? `<a class="source" href="${p.url}" target="_blank" rel="noopener">${esc(t('pdp.source'))} ${ICON.out}</a>` : ''}
          </div>
        </div>

        ${blockOrder(p).filter(k => !(p.off || []).includes(k)).map(k => BLOCKS[k](p, { fam, related })).join('')}
      </div>`;
  },
  mount(el, ctx) {
    const p = isListed(ctx.params[0]) && byId[ctx.params[0]];
    if (!p) return;
    markViewed(p.id);
    // the product video plays while it is on screen and the tab is visible
    const vid = $('.pdp-video video', el);
    let stopVideo = null;
    if (vid) {
      let seenNow = false;
      const sync = () => (seenNow && !document.hidden ? playVideo(vid) : pauseVideo(vid));
      const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { seenNow = e.isIntersecting; sync(); }, { threshold: 0.3 }) : null;
      if (io) io.observe(vid.parentElement); else { seenNow = true; sync(); }
      document.addEventListener('visibilitychange', sync);
      stopVideo = () => { io?.disconnect(); document.removeEventListener('visibilitychange', sync); pauseVideo(vid); };
    }
    // the photo strip: a thumbnail swaps the main picture (the first one brings the video back)
    const thumbs = $('.pdp-thumbs', el);
    if (thumbs) {
      const shots = [p.img, ...p.gallery];
      thumbs.addEventListener('click', e => {
        const b = e.target.closest('[data-shot]');
        if (!b) return;
        const i = +b.dataset.shot, art = $('.pdp-art', el);
        $$('.pdp-thumb', thumbs).forEach(x => x.setAttribute('aria-selected', String(x === b)));
        art.querySelectorAll('img').forEach(im => { im.src = srcOf(shots[i]); });
        delete art._alpha;
        art.closest('.pdp-video')?.classList.toggle('photo-mode', i > 0);
        if (vid) i > 0 ? pauseVideo(vid) : playVideo(vid);
        art.querySelector('.m-fg')?.addEventListener('load', () => fitAll(art.parentElement), { once: true });
      });
    }
    let qty = 1;
    const out = $('#qty', el);
    const set = n => { qty = Math.max(1, Math.min(Math.max(1, maxBuyable(p.id)), n)); out.textContent = qty; };
    $('#qtyDown', el).addEventListener('click', () => set(qty - 1));
    $('#qtyUp', el).addEventListener('click', () => set(qty + 1));
    $('#pdpAdd', el).addEventListener('click', () => addToCart(p.id, qty, $('.pdp-art .m-fg', el)));
    $('#pdpBuy', el).addEventListener('click', () => { addToCart(p.id, qty); go('#/checkout'); });
    // switching value or region replaces the page in history instead of stacking it
    $$('[data-variant]', el).forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      if (a.getAttribute('aria-checked') !== 'true') location.replace(a.getAttribute('href'));
    }));
    return stopVideo || undefined;
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Wishlist
   ══════════════════════════════════════════════════════════════════════ */
const wishlist = {
  title: () => t('wish.title'),
  rerenderOn: ['wish'],
  render() {
    const items = [...state.wish].map(id => byId[id]).filter(Boolean);
    return `
      <div class="page">
        ${pageHead(t('wish.title'), items.length ? `${plural('saved', items.length)} · ${esc(t('wish.total', { price: tnd(items.reduce((s, p) => s + p.price, 0)) }))}` : '',
          [[t('home'), '#/'], [t('wish.title'), '']],
          items.length ? `<button class="btn btn-solid" id="addAll">${ICON.cart} ${esc(t('wish.addAll'))}</button>` : '')}
        ${items.length
          ? `<div class="grid-tiles">${items.map(tile).join('')}</div>`
          : emptyState(ICON.heartBig, t('wish.empty'), esc(t('wish.emptyD')), `<a class="btn btn-solid" href="#/shop">${esc(t('shop.browse'))}</a>`)}
      </div>`;
  },
  mount(el) {
    $('#addAll', el)?.addEventListener('click', () => {
      [...state.wish].forEach(id => setQty(id, (state.cart[id] || 0) + 1));
      toast(t('toast.addedAll'), true);
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Checkout
   ══════════════════════════════════════════════════════════════════════ */
/* Top-ups in the basket, one block per game (mobile) or per product (others):
   each game asks for what its publisher needs — a player ID, or the game login. */
function topupGroups(ids) {
  const groups = new Map();
  for (const id of ids) {
    const p = byId[id];
    if (deliveryType(p) !== 'topup') continue;
    const key = p.cat === 'mobile' ? p.sub : p.id;
    if (!groups.has(key)) groups.set(key, { key, method: topupMethod(p), name: p.cat === 'mobile' ? subLabel(p.sub) : p.short, p });
  }
  return [...groups.values()];
}

const accountRules = {
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || t('err.gemail'),
  password: v => v.length >= 4 || t('err.gpass'),
  uid: v => /^\d[\d\s]{4,19}$/.test(v.trim()) || t('err.uid'),
  pid: v => /^\d[\d\s]{5,15}$/.test(v.trim()) || t('err.player')
};

function gameBlock({ key, method, name, p }) {
  const saved = state.profile.games?.[key] || {};
  const n = k => `g_${key}_${k}`;
  const login = method !== 'id';
  const remembered = login ? saved.email : saved.playerId;
  return `
    <fieldset class="game-acc" data-key="${esc(key)}" data-method="${method}">
      <legend class="ga-head">
        ${media(p, 'thumb')}
        <span class="txt"><b>${esc(name)}</b><span>${esc(t(login ? 'acc.loginD' : 'acc.idD'))}</span></span>
      </legend>
      ${remembered ? `<p class="ga-saved">${ICON.check}<span>${esc(t('co.remembered'))}</span></p>` : ''}
      ${login ? `
        <div class="field-row">
          ${field(n('email'), t('acc.email'), saved.email || '', 'email', 'autocomplete="off" dir="ltr"')}
          <div class="field">
            <label for="${n('password')}">${esc(t('acc.password'))}</label>
            <div class="pw-wrap">
              <input id="${n('password')}" name="${n('password')}" type="password" autocomplete="new-password" dir="ltr">
              <button type="button" class="pw-toggle" data-pw="${n('password')}" aria-label="${esc(t('acc.show'))}" aria-pressed="false">${ICON.eye}</button>
            </div>
            <span class="msg" aria-live="polite"></span>
          </div>
        </div>
        ${method === 'loginFull' ? `
        <div class="field-row">
          ${field(n('uid'), t('acc.uid'), saved.uid || '', 'text', `inputmode="numeric" dir="ltr" placeholder="${esc(t('acc.uidPh'))}"`)}
          <div class="field">
            <span class="label" id="${n('plat')}-l">${esc(t('acc.platform'))}</span>
            <div class="seg seg-plat" role="radiogroup" aria-labelledby="${n('plat')}-l">
              ${['android', 'ios'].map(pl => `<label><input type="radio" name="${n('platform')}" value="${pl}" ${saved.platform === pl ? 'checked' : ''}><span>${esc(t('acc.' + pl))}</span></label>`).join('')}
            </div>
            <span class="msg" aria-live="polite"></span>
          </div>
        </div>` : ''}
        <p class="ga-note">${ICON.lock}<span>${esc(t('acc.never'))}</span></p>`
      : field(n('pid'), t('co.player'), saved.playerId || '', 'text', `inputmode="numeric" dir="ltr" placeholder="${esc(t('co.playerPh'))}"`)}
    </fieldset>`;
}

const contactOk = pr => pr.name?.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pr.email || '') && (pr.phone || '').replace(/\D/g, '').length >= 8;

let chosenPayment = null;    // the shopper's pick, kept when the basket re-renders the page
let chosenShip = null, shipCountry = null;   // the delivery method and country, kept the same way

/* ── delivery of physical items at checkout ── */
const shipAmount = () => { const sub = cartTotal(), bOff = bundleOff(); return sub - bOff - couponOff(sub - bOff); };
function shipChoice(country) {
  const opts = shipOptions(country, shipAmount());
  return { opts, pick: opts.find(o => o.method === chosenShip) || opts[0] || null };
}
/** Cash on delivery: physical orders delivered in Tunisia, or picked up at the shop. */
const codOk = (ships, country, method) => ships && (country === 'TN' || method === 'pickup');
const shipOptsHtml = (opts, pick) => (!opts.length ? `<p class="ship-none">${esc(t('ship.none'))}</p>` : opts.map(o => `
  <label class="pay-option ship-option">
    <input type="radio" name="shipMethod" value="${o.method}" ${o === pick ? 'checked' : ''}>
    <span><b>${esc(t('ship.' + o.method))}</b><small>${esc(o.method === 'pickup' ? t('ship.pickupAt', { address: o.address }) : t('ship.in', { days: o.days }))}</small></span>
    <span class="ship-fee">${o.fee ? tnd(o.fee) : esc(t('ship.free'))}</span>
  </label>`).join(''));
const freeHint = pick => {
  const rule = pick && SHIPPING[pick.method];
  return rule && rule.free > 0 && pick.fee > 0 ? t('ship.addMore', { amount: tnd(Math.max(0, rule.free - shipAmount())) }) : '';
};

const checkout = {
  title: () => t('co.title'),
  rerenderOn: ['cart'],
  render() {
    const ids = Object.keys(state.cart);
    const trail = [[t('home'), '#/'], [t('co.title'), '']];
    if (!ids.length) return `<div class="page">${pageHead(t('co.title'), '', trail)}
      ${emptyState(ICON.cartBig, t('co.emptyT'), esc(t('co.emptyD')), `<a class="btn btn-solid" href="#/shop">${esc(t('shop.browse'))}</a>`)}</div>`;
    const games = topupGroups(ids);
    const pr = state.profile;
    const filled = contactOk(pr);
    const ships = cartShips();
    const country = shipCountry || (shipCountries().includes(pr.country) ? pr.country : 'TN');
    const { opts, pick } = ships ? shipChoice(country) : { opts: [], pick: null };
    const shipFee = pick?.fee || 0;
    const payList = PAYMENT_METHODS.filter(m => m !== 'cod' || ships);
    const payOk = m => m !== 'cod' || codOk(ships, country, pick?.method);
    // a shopper browsing in another currency most likely pays with a card from abroad
    const pay = payList.includes(chosenPayment) && payOk(chosenPayment) ? chosenPayment
      : currencyNow() !== 'TND' && payList.includes('cardintl') ? 'cardintl' : payList.find(payOk);
    const sub = cartTotal(), bOff = bundleOff(), off = couponOff(sub - bOff), fee = paymentFee(pay, sub - bOff - off), total = Math.round((sub - bOff - off + fee + shipFee) * 1000) / 1000;
    let step = 1;
    return `
      <div class="page">
        ${pageHead(t('co.title'), `${plural('items', cartQty())} · ${esc(t(ships ? 'co.physical' : 'co.digital'))}`, trail)}
        <p class="demo-note">${ICON.shield}<span>${esc(t('co.demo'))}</span></p>
        <div class="checkout">
          <form class="card form" id="checkoutForm" novalidate>
            <h2><span class="step-n">${step++}</span> ${esc(t('co.contact'))}</h2>
            <p class="hint">${esc(t('co.contactD'))}</p>
            <div class="contact-card" id="contactCard" ${filled ? '' : 'hidden'}>
              <img src="${avatarSrc(pr.avatar)}" alt="" width="44" height="44">
              <div class="txt">
                <span class="cc-from">${ICON.check} ${esc(t('co.fromAccount'))}</span>
                <b>${esc(pr.name)}</b>
                <span dir="ltr">${esc(pr.email)}</span>
                <span dir="ltr">${esc(pr.phone)}</span>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" id="editContact">${esc(t('co.edit'))}</button>
            </div>
            <div id="contactFields" ${filled ? 'hidden' : ''}>
              <div class="field-row">
                ${field('name', t('co.name'), pr.name, 'text', 'autocomplete="name"')}
                ${field('email', t('co.email'), pr.email, 'email', 'autocomplete="email" dir="ltr"')}
              </div>
              ${field('phone', t('co.phone'), pr.phone, 'tel', 'autocomplete="tel" dir="ltr"')}
              <label class="check"><input type="checkbox" id="saveContact"><span>${esc(t('co.saveToAccount'))}</span></label>
            </div>
            ${ships ? `<h2><span class="step-n">${step++}</span> ${esc(t('co.ship'))}</h2>
              <p class="hint">${esc(t('co.shipD'))}</p>
              <div class="field-row">
                <div class="field"><label for="shipCountry">${esc(t('ship.country'))}</label>
                  <select class="select" id="shipCountry" name="shipCountry" autocomplete="country">${shipCountries().map(c => `<option value="${c}" ${c === country ? 'selected' : ''}>${esc(countryName(c))}</option>`).join('')}</select>
                  <span class="msg" aria-live="polite"></span></div>
                <div class="field" id="govField" ${country === 'TN' ? '' : 'hidden'}><label for="shipGov">${esc(t('ship.gov'))}</label>
                  <select class="select" id="shipGov" name="shipGov" autocomplete="address-level1"><option value="">${esc(t('ship.govPick'))}</option>${TN_GOVS.map(g => `<option value="${esc(g)}" ${pr.state === g ? 'selected' : ''}>${esc(govLabel(g))}</option>`).join('')}</select>
                  <span class="msg" aria-live="polite"></span></div>
                <div id="regionField" ${country === 'TN' ? 'hidden' : ''}>${field('shipRegion', t('ship.region'), country !== 'TN' && !TN_GOVS.includes(pr.state) ? pr.state || '' : '', 'text', 'autocomplete="address-level1"')}</div>
              </div>
              <div id="addrFields" ${pick?.method === 'pickup' ? 'hidden' : ''}>
                ${field('shipLine', t('ship.line'), pr.address || '', 'text', 'autocomplete="street-address"')}
                <div class="field-row">
                  ${field('shipCity', t('ship.city'), pr.city || '', 'text', 'autocomplete="address-level2"')}
                  ${field('shipZip', t('ship.zip'), pr.zip || '', 'text', 'autocomplete="postal-code" inputmode="numeric" dir="ltr"')}
                </div>
              </div>
              <div class="pay-options ship-options" id="shipOpts" role="radiogroup" aria-label="${esc(t('co.ship'))}">${shipOptsHtml(opts, pick)}</div>
              <p class="hint ship-free" id="shipFree" aria-live="polite">${esc(freeHint(pick))}</p>
              <div class="field"><label for="shipNotes">${esc(t('ship.notes'))}</label>
                <textarea id="shipNotes" name="shipNotes" rows="2" maxlength="300" placeholder="${esc(t('ship.notesPh'))}" dir="auto"></textarea></div>` : ''}
            ${games.length ? `<h2><span class="step-n">${step++}</span> ${esc(t('co.games'))}</h2>
              <p class="hint">${esc(t('co.gamesD'))}</p>
              ${games.map(gameBlock).join('')}` : ''}
            <h2><span class="step-n">${step++}</span> ${esc(t('co.payment'))}</h2>
            <div class="pay-options" role="radiogroup" aria-label="${esc(t('co.paymentLabel'))}">
              ${payList.map((m, i) => `
                <label class="pay-option${m === 'clictopay' || m === 'cardintl' ? ' pay-main' : ''}" ${m === 'cod' ? `data-cod ${payOk('cod') ? '' : 'hidden'}` : ''}>
                  <input type="radio" name="payment" value="${m}" ${m === pay ? 'checked' : ''}>
                  <span><b>${esc(t('pay.' + m))} <em class="pay-fee" dir="ltr">${esc(feeLabel(m))}</em></b><small>${esc(t('pay.' + m + 'D'))}</small></span>
                  ${m === 'clictopay' ? `<span class="pay-brands" aria-hidden="true">${payLogos('visa', 'mc', 'edinar')}</span>` : ''}
                  ${m === 'cardintl' ? `<span class="pay-brands" aria-hidden="true">${payLogos('visa', 'mc')}</span>` : ''}
                  ${m === 'ooredoo' ? `<span class="pay-brands" aria-hidden="true">${payLogos('ooredoo')}</span>` : ''}
                  ${m === 'd17' ? `<span class="pay-brands" aria-hidden="true">${payLogos('d17')}</span>` : ''}
                </label>`).join('')}
            </div>
            <label class="check"><input type="checkbox" id="terms"><span>${esc(t('co.terms'))}</span></label>
            <span class="msg" id="termsMsg" aria-live="polite"></span>
            <button class="btn btn-solid btn-wide" type="submit" id="placeBtn">${esc(t('co.place', { total: tnd(total) }))}</button>
          </form>

          <aside class="card summary" aria-label="${esc(t('co.summary'))}">
            <h2>${esc(t('co.summary'))}</h2>
            <div class="sum-lines">
              ${ids.map(id => { const p = byId[id], q = state.cart[id]; return `
                <div class="sum-line">
                  ${media(p, 'thumb')}
                  <div class="txt"><b>${esc(p.short)}</b><span>${esc(t('co.each', { price: tnd(p.price) }))}</span></div>
                  <div class="stepper small" role="group" aria-label="${esc(t('co.qtyOf', { name: p.short }))}">
                    <button type="button" data-dec="${id}" aria-label="${esc(t('basket.fewer'))}">${ICON.minus}</button>
                    <output>${q}</output>
                    <button type="button" data-inc="${id}" aria-label="${esc(t('basket.more'))}">${ICON.plus}</button>
                  </div>
                  <span class="line-total">${tnd(p.price * q)}</span>
                </div>`; }).join('')}
            </div>
            <div class="sum-row"><span>${esc(t('co.subtotal'))}</span><span>${tnd(sub)}</span></div>
            ${bOff ? `<div class="sum-row discount-row"><span>${esc(t('co.bundle'))}</span><span>−${tnd(bOff)}</span></div>` : ''}
            ${off ? `<div class="sum-row discount-row"><span>${esc(t('co.discount', { code: couponCode(), n: couponPct() }))} <button type="button" class="link-btn" id="removeCode">${esc(t('co.promoRemove'))}</button></span><span>−${tnd(off)}</span></div>`
              : `<div class="promo-field"><label class="sr" for="promoCode">${esc(t('co.promo'))}</label>
                   <input id="promoCode" type="text" placeholder="${esc(t('co.promoPh'))}" autocomplete="off" autocapitalize="characters" maxlength="20" dir="ltr">
                   <button type="button" class="btn btn-ghost" id="applyCode">${esc(t('co.apply'))}</button></div>
                 <p class="promo-msg" id="promoMsg" role="status" aria-live="polite"></p>`}
            <div class="sum-row fee-row"><span id="feeLabel">${esc(t('co.fee.' + pay))} <em dir="ltr">${esc(feeLabel(pay))}</em></span><span id="feeAmt">${tnd(fee)}</span></div>
            ${ships ? `<div class="sum-row"><span>${esc(t('co.ship'))}</span><span id="shipAmt">${pick ? (shipFee ? tnd(shipFee) : esc(t('ship.free'))) : '—'}</span></div>`
              : `<div class="sum-row"><span>${esc(t('co.delivery'))}</span><span>${esc(t('co.free'))}</span></div>`}
            <div class="sum-row total-row"><span>${esc(t('co.total'))}</span><b id="grandTotal">${tnd(total)}</b></div>
            ${currencyNow() !== 'TND' ? `<p class="charged" id="chargedNote">${esc(t('co.charged', { amount: priceTND(total) }))}</p>` : ''}
          </aside>
        </div>
        <div class="redirect" id="redirect" hidden role="status">
          <div class="card"><i class="spinner"></i><b>${esc(t('co.redirect'))}</b><small>${esc(t('co.redirectD'))}</small></div>
        </div>
      </div>`;
  },
  mount(el) {
    const form = $('#checkoutForm', el);
    if (!form) return;
    // stock may have changed since these were added: no line can ask for more than is left
    for (const [id, q] of Object.entries(state.cart)) if (q > maxBuyable(id)) { setQty(id, maxBuyable(id)); return; }
    let timer = null;
    // the page container outlives each render, so this listener is removed in the cleanup
    const onClick = e => {
      const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
      if (inc && state.cart[inc.dataset.inc]) setQty(inc.dataset.inc, state.cart[inc.dataset.inc] + 1);
      if (dec && state.cart[dec.dataset.dec]) setQty(dec.dataset.dec, state.cart[dec.dataset.dec] - 1);
      const pw = e.target.closest('[data-pw]');
      if (pw) {
        const input = form.elements[pw.dataset.pw], show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        pw.innerHTML = show ? ICON.eyeOff : ICON.eye;
        pw.setAttribute('aria-pressed', String(show));
        pw.setAttribute('aria-label', t(show ? 'acc.hide' : 'acc.show'));
      }
    };
    el.addEventListener('click', onClick);
    // promo code: the one the store owner set in the promo banner
    const tryCode = () => {
      const input = $('#promoCode', el);
      if (!input?.value.trim()) return input?.focus();
      if (applyCoupon(input.value)) { toast(t('co.promoOk', { code: couponCode(), n: couponPct() }), true); emit('cart'); }
      else { $('#promoMsg', el).textContent = t('co.promoBad'); input.select(); }
    };
    $('#applyCode', el)?.addEventListener('click', tryCode);
    $('#promoCode', el)?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); tryCode(); } });
    $('#removeCode', el)?.addEventListener('click', () => { clearCoupon(); emit('cart'); });
    // the fee line and totals follow the chosen payment method
    // …and the delivery: the country decides the methods, the method decides the fee and cash on delivery
    const shipNow = () => {
      if (!cartShips()) return { pick: null, country: 'TN' };
      const country = form.elements.shipCountry.value;
      const { opts, pick } = shipChoice(country);
      return { opts, pick, country };
    };
    form.addEventListener('change', e => {
      const n = e.target.name;
      if (!['payment', 'shipCountry', 'shipMethod'].includes(n)) return;
      if (n === 'payment') chosenPayment = e.target.value;
      if (n === 'shipMethod') chosenShip = e.target.value;
      if (n === 'shipCountry') {
        shipCountry = e.target.value;
        const tn = shipCountry === 'TN';
        $('#govField', el).hidden = !tn;
        $('#regionField', el).hidden = tn;
      }
      const { opts, pick, country } = shipNow();
      if (n === 'shipCountry') $('#shipOpts', el).innerHTML = shipOptsHtml(opts, pick);
      if (cartShips()) {
        $('#addrFields', el).hidden = pick?.method === 'pickup';
        $('#shipFree', el).textContent = freeHint(pick);
        $('#shipAmt', el).textContent = pick ? (pick.fee ? tnd(pick.fee) : t('ship.free')) : '—';
        const cod = $('[data-cod]', form);
        if (cod) {
          cod.hidden = !codOk(true, country, pick?.method);
          if (cod.hidden && cod.querySelector('input').checked) { const first = $('.pay-option:not([hidden]) input', form); first.checked = true; chosenPayment = first.value; }
        }
      }
      const payNow = form.querySelector('input[name=payment]:checked')?.value || chosenPayment;
      const shipFee = pick?.fee || 0;
      const sub = cartTotal(), bOff = bundleOff(), off = couponOff(sub - bOff), fee = paymentFee(payNow, sub - bOff - off), total = Math.round((sub - bOff - off + fee + shipFee) * 1000) / 1000;
      chosenPayment = payNow;
      $('#feeLabel', el).innerHTML = `${esc(t('co.fee.' + chosenPayment))} <em dir="ltr">${esc(feeLabel(chosenPayment))}</em>`;
      $('#feeAmt', el).textContent = tnd(fee);
      $('#grandTotal', el).textContent = tnd(total);
      if ($('#chargedNote', el)) $('#chargedNote', el).textContent = t('co.charged', { amount: priceTND(total) });
      $('#placeBtn', el).textContent = t('co.place', { total: tnd(total) });
      for (const n of [$('#feeAmt', el), $('#grandTotal', el)]) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
    });
    const openContact = () => {
      $('#contactCard', el).hidden = true;
      $('#contactFields', el).hidden = false;
    };
    $('#editContact', el).addEventListener('click', () => { openContact(); form.elements.name.focus(); });

    const setMsg = (input, res) => {
      const box = input.closest('.field');
      box.classList.toggle('err', res !== true);
      box.querySelector('.msg').textContent = res === true ? '' : res;
      return res === true;
    };
    // check a field when the shopper leaves it (only once they've typed, or after an error)
    const ruleFor = input => {
      const n = input.name;
      if (n === 'name') return v => v.trim().length >= 2 || t('err.name');
      if (n === 'email') return v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || t('err.email');
      if (n === 'phone') return v => v.replace(/\D/g, '').length >= 8 || t('err.phone');
      if (n === 'shipLine') return v => v.trim().length >= 4 || t('err.line');
      if (n === 'shipCity') return v => v.trim().length >= 2 || t('err.city');
      const m = n.match(/^g_.+_(email|password|uid|pid)$/);
      return m ? accountRules[m[1]] : null;
    };
    const onBlur = e => {
      const input = e.target, rule = input.name && ruleFor(input);
      if (!rule || input.type === 'radio') return;
      const box = input.closest('.field');
      if (input.value !== '' || box?.classList.contains('err')) setMsg(input, rule(input.value));
    };
    const onInput = e => {
      const input = e.target, rule = input.name && ruleFor(input);
      if (rule && input.closest('.field')?.classList.contains('err') && rule(input.value) === true) setMsg(input, true);
    };
    form.addEventListener('focusout', onBlur);
    form.addEventListener('input', onInput);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (form.dataset.busy) return;            // already placing this order
      let first = null;
      const flag = (input, res) => { if (!setMsg(input, res) && !first) first = input; };

      const contact = {
        name: v => v.trim().length >= 2 || t('err.name'),
        email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || t('err.email'),
        phone: v => v.replace(/\D/g, '').length >= 8 || t('err.phone')
      };
      for (const [name, check] of Object.entries(contact)) {
        const input = form.elements[name], res = check(input.value);
        if (res !== true) openContact();
        flag(input, res);
      }

      const accounts = {};
      for (const fs of $$('.game-acc', form)) {
        const { key, method } = fs.dataset, n = k => form.elements[`g_${key}_${k}`];
        if (method === 'id') {
          flag(n('pid'), accountRules.pid(n('pid').value));
          accounts[key] = { method, playerId: n('pid').value.trim() };
          continue;
        }
        flag(n('email'), accountRules.email(n('email').value));
        flag(n('password'), accountRules.password(n('password').value));
        accounts[key] = { method, email: n('email').value.trim(), password: n('password').value };
        if (method === 'loginFull') {
          flag(n('uid'), accountRules.uid(n('uid').value));
          const plat = $(`input[name="g_${key}_platform"]:checked`, fs);
          const radio = $(`input[name="g_${key}_platform"]`, fs);
          setMsg(radio, plat ? true : t('err.platform'));
          if (!plat && !first) first = radio;
          Object.assign(accounts[key], { uid: n('uid').value.trim(), platform: plat?.value });
        }
      }

      let ship = null;
      if (cartShips()) {
        const { pick, country } = shipNow();
        if (!pick) { if (!first) first = form.elements.shipCountry; }
        else {
          const gov = country === 'TN' ? form.elements.shipGov.value : '';
          if (pick.method !== 'pickup') {
            flag(form.elements.shipLine, form.elements.shipLine.value.trim().length >= 4 || t('err.line'));
            flag(form.elements.shipCity, form.elements.shipCity.value.trim().length >= 2 || t('err.city'));
            if (country === 'TN') flag(form.elements.shipGov, !!gov || t('err.gov'));
          }
          ship = { method: pick.method, fee: pick.fee, address: { country, gov, region: country === 'TN' ? '' : form.elements.shipRegion.value.trim(),
            city: form.elements.shipCity.value.trim(), zip: form.elements.shipZip.value.trim(), line: form.elements.shipLine.value.trim(), notes: form.elements.shipNotes.value.trim() } };
          if (pick.method === 'pickup') ship.address = { country, notes: ship.address.notes };
        }
      }

      const terms = $('#terms', form);
      $('#termsMsg', form).textContent = terms.checked ? '' : t('err.terms');
      if (!terms.checked && !first) first = terms;
      if (first) { first.focus(); return; }

      const details = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), phone: form.elements.phone.value.trim() };
      if ($('#saveContact', form).checked) saveProfile(details);
      // the delivery address is kept on this device for the next order
      if (ship && ship.method !== 'pickup') saveProfile({ country: ship.address.country, state: ship.address.gov || ship.address.region, city: ship.address.city, zip: ship.address.zip, address: ship.address.line });
      // remember the non-secret game details (never the password) for next time
      const games = { ...(state.profile.games || {}) };
      for (const [key, { password, method, ...rest }] of Object.entries(accounts)) games[key] = rest;
      saveProfile({ games });

      // the button shows it's working and can't be pressed twice
      const submit = form.querySelector('button[type=submit]');
      form.dataset.busy = '1';
      submit.disabled = true;
      submit.classList.add('loading');
      submit.setAttribute('aria-busy', 'true');
      const finish = () => {
        const order = placeOrder({ ...details, payment: form.elements.payment.value, accounts, ship });
        go(`#/order/${order.id}?new=1`);
      };
      if (!['clictopay', 'cardintl'].includes(form.elements.payment.value)) return finish();
      // stands in for the bank's payment page; moved to <body> so the page's
      // entrance transform and the glass panel's blur can't trap it
      const rd = $('#redirect', el);
      document.body.append(rd);
      rd.hidden = false;
      timer = setTimeout(() => { rd.remove(); finish(); }, 1400);
    });
    return () => { el.removeEventListener('click', onClick); clearTimeout(timer); document.querySelector('body > #redirect')?.remove(); };
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Order detail & confirmation
   ══════════════════════════════════════════════════════════════════════ */
const orderMeta = o => `${fmtDate(o.date)} · ${plural('items', orderCount(o))} · ${tnd(orderTotal(o))}`;

const order = {
  title: ctx => t('ord.title', { id: ctx.params[0] }),
  rerenderOn: ['orders'],
  render(ctx) {
    const o = getOrder(ctx.params[0]);
    if (!o) return notFound.render();
    const fresh = ctx.query.get('new') === '1';
    const done = digitalDone(o);          // the codes and keys
    const parcel = !!o.ship, cod = o.payment === 'cod', track = orderTrack(o), pickup = o.ship?.method === 'pickup';
    const shipped = ['shipped', 'delivered'].includes(o.status), arrived = o.status === 'delivered';
    const email = o.contact?.email || state.profile.email;
    const addr = o.ship?.address || {};
    const addrText = [addr.line, [addr.zip, addr.city].filter(Boolean).join(' '), addr.gov ? govLabel(addr.gov) : addr.region, addr.country && countryName(addr.country)].filter(Boolean).join(', ');
    const first = o.contact?.name?.split(' ')[0];
    return `
      <div class="page">
        ${fresh ? `<div class="success card">
          <span class="success-icon">${ICON.check}</span>
          <div><h2>${esc(first ? t('ord.thanks', { name: first }) : t('ord.thanksAnon'))}</h2>
          <p>${esc(t(parcel ? 'ord.shipPendD' : done ? 'ord.doneD' : 'ord.pendD', { id: o.id, email }))}</p></div>
        </div>` : ''}
        ${pageHead(t('ord.title', { id: o.id }), orderMeta(o), [[t('home'), '#/'], [t('orders.title'), '#/orders'], [o.id, '']], statusPill(o.status))}
        <ol class="timeline" aria-label="${esc(t('ord.progress'))}">
          <li class="done"><span>${ICON.check}</span><b>${esc(t('ord.placed'))}</b><small>${fmtDate(o.date)}</small></li>
          <li class="done"><span>${ICON.check}</span><b>${esc(t(cod ? 'ord.payOnDelivery' : 'ord.paid'))}</b><small>${esc(payLabel(o.payment))}</small></li>
          ${parcel ? `
          <li class="${shipped ? 'done' : 'active'}"><span>${shipped ? ICON.check : '<i class="spinner"></i>'}</span><b>${esc(t('ord.packing'))}</b><small>${esc(t('ord.packingD'))}</small></li>
          <li class="${arrived ? 'done' : shipped ? 'active' : ''}"><span>${arrived ? ICON.check : shipped ? '<i class="spinner"></i>' : ICON.box}</span><b>${esc(t(arrived ? 'ord.delivered' : pickup ? 'ord.ready' : 'ord.onWay'))}</b><small dir="auto">${esc(track ? t('ord.track', { carrier: track.carrier, number: track.number }) : pickup ? o.ship.address?.notes || SHIPPING.pickup.address || '' : t('ship.' + o.ship.method))}</small></li>`
          : `<li class="${done ? 'done' : 'active'}"><span>${done ? ICON.check : '<i class="spinner"></i>'}</span><b>${esc(t(done ? 'ord.delivered' : 'ord.delivering'))}</b><small>${esc(t(done ? 'ord.byEmail' : 'ord.minutes'))}</small></li>`}
        </ol>
        <div class="order-layout">
          <section class="card order-items">
            <h2>${esc(t('ord.items'))}</h2>
            ${o.items.map(([id, q, paid]) => { const p = byId[id]; return `
              <div class="order-item">
                <a class="oi-head" href="#/product/${id}">${media(p, 'thumb')}<span class="txt"><b>${esc(p.short)}</b><span>${q} × ${tnd(unitPrice([id, q, paid]))}</span></span></a>
                ${isShipped(p) ? `<div class="cred parcel">${ICON.box}<span>${esc(t(arrived ? 'st.delivered' : shipped ? 'st.shipped' : 'ord.parcel'))}</span></div>`
                  : done ? Array.from({ length: q }, (_, n) => credBlock({ ...o, id: o.id + (n ? '-' + n : ''), unit: n }, id)).join('')
                       : `<div class="cred pending"><i class="spinner"></i><span>${esc(t('ord.preparing'))}</span></div>`}
                ${done && redeemOf(p).length ? `<details class="order-redeem" open><summary>${esc(t('pdp.redeem'))}</summary>${redeemSteps(p)}</details>` : ''}
              </div>`; }).join('')}
          </section>
          <aside class="card order-sum">
            <h2>${esc(t('ord.summary'))}</h2>
            <div class="sum-row"><span>${esc(t('ord.payment'))}</span><span>${esc(payLabel(o.payment))}</span></div>
            <div class="sum-row"><span>${esc(t('ord.to'))}</span><span dir="ltr">${esc(email)}</span></div>
            ${parcel ? `<div class="sum-row ship-to"><span>${esc(t('ord.shipTo'))}</span><span dir="auto">${esc(pickup ? t('ship.pickupAt', { address: SHIPPING.pickup.address || STORE.address }) : addrText)}</span></div>
              ${track ? `<div class="sum-row"><span>${esc(t('adm.or.tracking'))}</span><span dir="ltr">${esc(track.carrier)} · ${esc(track.number)}</span></div>` : ''}` : ''}
            ${o.playerId ? `<div class="sum-row"><span>${esc(t('ord.player'))}</span><span dir="ltr">${esc(o.playerId)}</span></div>` : ''}
            ${Object.entries(o.accounts || {}).map(([key, a]) => `<div class="sum-row"><span>${esc(byId[key]?.short || subLabel(key))}</span>
              <span dir="ltr">${esc(a.email ? [a.email, a.uid && 'UID ' + a.uid, a.platform && t('acc.' + a.platform)].filter(Boolean).join(' · ') : a.playerId)}</span></div>`).join('')}
            <div class="sum-row"><span>${esc(t('co.subtotal'))}</span><span>${tnd(orderSubtotal(o))}</span></div>
            ${orderBundleOff(o) ? `<div class="sum-row discount-row"><span>${esc(t('co.bundle'))}</span><span>−${tnd(orderBundleOff(o))}</span></div>` : ''}
            ${o.promo ? `<div class="sum-row discount-row"><span>${esc(t('co.discount', { code: o.promo.code, n: o.promo.pct }))}</span><span>−${tnd(orderPromoOff(o))}</span></div>` : ''}
            <div class="sum-row fee-row"><span>${esc(t('co.fee.' + (o.payment === 'card' ? 'clictopay' : o.payment)))} <em dir="ltr">${esc(feeLabel(o.payment))}</em></span><span>${tnd(orderFee(o))}</span></div>
            ${parcel ? `<div class="sum-row"><span>${esc(t('co.ship'))} · ${esc(t('ship.' + o.ship.method))}</span><span>${orderShip(o) ? tnd(orderShip(o)) : esc(t('ship.free'))}</span></div>` : ''}
            <div class="sum-row total-row"><span>${esc(t('co.total'))}</span><b>${tnd(orderTotal(o))}</b></div>
            <a class="btn btn-ghost btn-wide" href="#/support">${esc(t('ord.help'))}</a>
          </aside>
        </div>
        <p class="fine">${esc(t('ord.fine'))}</p>
      </div>`;
  },
  mount(el, ctx) {
    const cleanups = [wireCreds(el)];
    const o = getOrder(ctx.params[0]);
    if (o && o.status === 'processing' && o.deliverAt && !digitalDone(o) && o.items.some(([id]) => !isShipped(byId[id]))) {
      const timer = setTimeout(() => {
        toast(t('toast.delivered', { id: o.id }), true);
        go(`#/order/${o.id}`);
      }, Math.max(0, o.deliverAt - Date.now()) + 60);
      cleanups.push(() => clearTimeout(timer));
    }
    return () => cleanups.forEach(f => f());
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Orders
   ══════════════════════════════════════════════════════════════════════ */
const orderRow = o => `
  <a class="order-row card" href="#/order/${o.id}">
    <span class="or-id"><b>${o.id}</b><small>${fmtDate(o.date)}</small></span>
    <span class="or-thumbs">${o.items.slice(0, 3).map(([id]) => media(byId[id], 'thumb')).join('')}</span>
    <span class="or-names">${esc(o.items.map(([id]) => byId[id].short).join(', '))}</span>
    <span class="or-total">${tnd(orderTotal(o))}</span>
    ${statusPill(o.status)}
    <span class="or-chev">${ICON.chev}</span>
  </a>`;

const orders = {
  title: () => t('orders.title'),
  rerenderOn: ['orders'],
  render() {
    const list = allOrders();
    return `
      <div class="page">
        ${pageHead(t('orders.title'), `${plural('orders', list.length)} · ${esc(t('orders.total', { price: tnd(list.reduce((s, o) => s + orderTotal(o), 0)) }))}`, [[t('home'), '#/'], [t('orders.title'), '']])}
        <div class="order-list">${list.map(orderRow).join('')}</div>
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Profile
   ══════════════════════════════════════════════════════════════════════ */
const profile = {
  title: () => t('pf.title'),
  rerenderOn: ['orders', 'wish', 'profile'],
  render() {
    const pr = state.profile;
    const list = allOrders();
    const vault = list.filter(o => o.status === 'delivered').flatMap(o => o.items.map(([id]) => ({ o, id })));
    const codes = vault.filter(({ id }) => deliveryType(byId[id]) !== 'topup').length;
    return `
      <div class="page">
        ${crumbs([[t('home'), '#/'], [t('pf.title'), '']])}
        <section class="profile-hero card">
          <img class="avatar-xl" src="${avatarSrc(pr.avatar)}" alt="">
          <div class="ph-text">
            <h1>${esc(pr.name)}</h1>
            <p><span dir="ltr">${esc(pr.handle)}</span> · <span dir="ltr">${esc(pr.email)}</span></p>
            <p class="muted">${esc(t('pf.since', { date: t('demo.since') }))}</p>
          </div>
          <a class="btn btn-ghost" href="#/settings/profile">${esc(t('pf.edit'))}</a>
        </section>

        <div class="stats">
          <a class="stat card" href="#/orders"><b>${list.length}</b><span>${esc(t('pf.orders'))}</span></a>
          <div class="stat card"><b>${tnd(list.reduce((s, o) => s + orderTotal(o), 0))}</b><span>${esc(t('pf.spent'))}</span></div>
          <button class="stat card" type="button" data-scroll="vault"><b>${codes}</b><span>${esc(t('pf.keys'))}</span></button>
          <a class="stat card" href="#/wishlist"><b>${state.wish.size}</b><span>${esc(t('pf.wish'))}</span></a>
        </div>

        <section class="block" id="vault">
          <div class="block-head"><h2>${esc(t('pf.vault'))}</h2><span class="muted">${esc(t('pf.vaultD'))}</span></div>
          <div class="vault">
            ${vault.length ? vault.map(({ o, id }) => { const p = byId[id]; return `
              <div class="vault-row card">
                <a class="oi-head" href="#/product/${id}">${media(p, 'thumb')}<span class="txt"><b>${esc(p.short)}</b><span>${esc(t('ord.title', { id: o.id }))} · ${fmtDate(o.date)}</span></span></a>
                ${credBlock(o, id)}
              </div>`; }).join('')
              : emptyState(ICON.key, t('pf.noKeys'), esc(t('pf.noKeysD')))}
          </div>
        </section>

        <section class="block">
          <div class="block-head"><h2>${esc(t('pf.recent'))}</h2><a class="see-all" href="#/orders">${esc(t('pf.all'))}</a></div>
          <div class="order-list">${list.slice(0, 3).map(orderRow).join('')}</div>
        </section>
        <p class="fine">${esc(t('ord.fine'))}</p>
      </div>`;
  },
  mount(el) {
    $('[data-scroll]', el)?.addEventListener('click', e =>
      $('#' + e.currentTarget.dataset.scroll, el)?.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' }));
    return wireCreds(el);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Settings
   ══════════════════════════════════════════════════════════════════════ */
const SECTIONS = [
  ['profile', ICON.user], ['security', ICON.lock], ['notifications', ICON.bell], ['appearance', ICON.palette], ['privacy', ICON.shield]
];

/* The owner's product description / guide: plain text with a few simple marks.
   Everything is escaped first, so it can never carry HTML.
     ## Heading      - bullet       1. numbered step      **bold**
   A blank line starts a new paragraph. */
function richText(src) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const out = [];
  let list = null;          // 'ul' | 'ol'
  let para = [];
  const flushPara = () => { if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; };
  const closeList = () => { if (list) out.push(`</${list}>`); list = null; };
  for (const raw of String(src).split(/\r?\n/)) {
    const line = raw.trim();
    let m;
    if (!line) { flushPara(); closeList(); continue; }
    if ((m = line.match(/^#{1,3}\s+(.+)/))) { flushPara(); closeList(); out.push(`<h3>${inline(m[1])}</h3>`); continue; }
    const bullet = line.match(/^[-*•]\s+(.+)/), step = line.match(/^\d+[.)]\s+(.+)/);
    if (bullet || step) {
      flushPara();
      const want = bullet ? 'ul' : 'ol';
      if (list !== want) { closeList(); out.push(`<${want}>`); list = want; }
      out.push(`<li>${inline((bullet || step)[1])}</li>`);
      continue;
    }
    closeList();
    para.push(line);
  }
  flushPara(); closeList();
  return out.join('');
}

export const toggle = (attr, yes, label) =>
  `<label class="switch"><input type="checkbox" ${attr} ${yes ? 'checked' : ''}><span aria-hidden="true"></span><span class="sr">${esc(label)}</span></label>`;

const setRow = (title, desc, control) =>
  `<div class="set-row"><div><b>${esc(title)}</b><p>${esc(desc)}</p></div>${control}</div>`;

function settingsBody(section) {
  const pr = state.profile, pf = state.prefs;
  switch (section) {
    case 'security': return `
      <h2>${esc(t('set.security'))}</h2>
      <form id="pwForm" class="form" novalidate>
        <h3>${esc(t('set.changePw'))}</h3>
        ${field('current', t('set.current'), '', 'password', 'autocomplete="current-password" dir="ltr"')}
        <div class="field-row">
          ${field('newpw', t('set.new'), '', 'password', 'autocomplete="new-password" dir="ltr"')}
          ${field('confirm', t('set.confirm'), '', 'password', 'autocomplete="new-password" dir="ltr"')}
        </div>
        <div class="meter" aria-hidden="true"><i id="pwMeter"></i></div>
        <p class="hint" id="pwHint">${esc(t('set.pwHint'))}</p>
        <button class="btn btn-solid" type="submit">${esc(t('set.update'))}</button>
      </form>
      <h3>${esc(t('set.protect'))}</h3>
      ${setRow(t('set.2fa'), t('set.2faD'), toggle('data-pref="twoFactor"', pf.twoFactor, t('set.2fa')))}`;

    case 'notifications': return `
      <h2>${esc(t('set.notifications'))}</h2>
      <h3>${esc(t('set.tellMe'))}</h3>
      ${setRow(t('set.nOrders'), t('set.nOrdersD'), toggle('data-notify="orders"', pf.notify.orders, t('set.nOrders')))}
      ${setRow(t('set.nStock'), t('set.nStockD'), toggle('data-notify="stock"', pf.notify.stock, t('set.nStock')))}
      ${setRow(t('set.nPrice'), t('set.nPriceD'), toggle('data-notify="prices"', pf.notify.prices, t('set.nPrice')))}
      ${setRow(t('set.nNews'), t('set.nNewsD'), toggle('data-notify="news"', pf.notify.news, t('set.nNews')))}
      <h3>${esc(t('set.sendBy'))}</h3>
      <div class="seg" role="radiogroup" aria-label="${esc(t('set.channel'))}">
        ${[['email', 'set.chEmail'], ['sms', 'set.chSms'], ['both', 'set.chBoth']].map(([id, k]) =>
          `<label><input type="radio" name="channel" value="${id}" ${pf.channel === id ? 'checked' : ''}><span>${esc(t(k))}</span></label>`).join('')}
      </div>`;

    case 'appearance': return `
      <h2>${esc(t('set.appearance'))}</h2>
      <h3>${esc(t('set.lang'))}</h3>
      <div class="seg seg-lang" role="radiogroup" aria-label="${esc(t('set.lang'))}">
        ${LANGS.map(l => `<label><input type="radio" name="lang" value="${l.id}" ${lang() === l.id ? 'checked' : ''}><span lang="${l.id}">${esc(l.label)}</span></label>`).join('')}
      </div>
      <p class="hint">${esc(t('set.langD'))}</p>
      <h3>${esc(t('set.accent'))}</h3>
      <div class="swatches" role="radiogroup" aria-label="${esc(t('set.accent'))}">
        ${ACCENTS.map(a => `<label class="swatch" title="${esc(t('acc.' + a.id))}"><input type="radio" name="accent" value="${a.value}" ${accentNow() === a.value ? 'checked' : ''}><span style="--c:${a.value}"></span><em>${esc(t('acc.' + a.id))}</em></label>`).join('')}
      </div>
      <h3>${esc(t('set.motion'))}</h3>
      ${setRow(t('set.bg'), t('set.bgD'), toggle('data-pref="animatedBg"', pf.animatedBg, t('set.bg')))}
      ${setRow(t('set.rm'), t('set.rmD'), toggle('data-pref="reduceMotion"', pf.reduceMotion, t('set.rm')))}`;

    case 'privacy': return `
      <h2>${esc(t('set.privacy'))}</h2>
      <p class="hint">${esc(t('set.privHint'))}</p>
      ${setRow(t('set.export'), t('set.exportD'), `<button class="btn btn-ghost" id="exportBtn">${ICON.download} ${esc(t('set.exportB'))}</button>`)}
      ${setRow(t('set.clearV'), plural('history', state.viewed.length), `<button class="btn btn-ghost" id="clearViewed" ${state.viewed.length ? '' : 'disabled'}>${esc(t('set.clearB'))}</button>`)}
      ${setRow(t('set.reset'), t('set.resetD'), `<button class="btn btn-danger" id="resetBtn">${esc(t('set.resetB'))}</button>`)}`;

    default: return `
      <h2>${esc(t('set.profile'))}</h2>
      <form id="profileForm" class="form" novalidate>
        <h3>${esc(t('set.avatar'))}</h3>
        <div class="avatar-pick" role="radiogroup" aria-label="${esc(t('set.avatar'))}">
          ${AVATARS.map(a => `<label><input type="radio" name="avatar" value="${a}" ${pr.avatar === a ? 'checked' : ''}><img src="${avatarSrc(a)}" alt="${a}"></label>`).join('')}
        </div>
        <h3>${esc(t('set.details'))}</h3>
        <div class="field-row">
          ${field('pname', t('set.name'), pr.name, 'text', 'autocomplete="name"')}
          ${field('phandle', t('set.handle'), pr.handle, 'text', 'dir="ltr"')}
        </div>
        <div class="field-row">
          ${field('pemail', t('co.email'), pr.email, 'email', 'autocomplete="email" dir="ltr"')}
          ${field('pphone', t('co.phone'), pr.phone, 'tel', 'autocomplete="tel" dir="ltr"')}
        </div>
        <button class="btn btn-solid" type="submit">${esc(t('set.save'))}</button>
      </form>`;
  }
}

const settings = {
  title: () => t('set.title'),
  render(ctx) {
    const section = SECTIONS.some(([id]) => id === ctx.params[0]) ? ctx.params[0] : 'profile';
    return `
      <div class="page">
        ${pageHead(t('set.title'), esc(t('set.sub')), [[t('home'), '#/'], [t('set.title'), '']])}
        <div class="settings">
          <nav class="settings-nav card" aria-label="${esc(t('set.sections'))}">
            ${SECTIONS.map(([id, icon]) => `<a href="#/settings/${id}" ${id === section ? 'aria-current="page"' : ''}>${icon}<span>${esc(t('set.' + id))}</span></a>`).join('')}
          </nav>
          <section class="settings-body card" data-section="${section}">${settingsBody(section)}</section>
        </div>
      </div>`;
  },
  mount(el) {
    const body = $('.settings-body', el);

    body.addEventListener('change', e => {
      const tg = e.target;
      if (tg.dataset.pref) { savePrefs({ [tg.dataset.pref]: tg.checked }); toast(t('toast.done'), true); }
      if (tg.dataset.notify) { savePrefs({ notify: { ...state.prefs.notify, [tg.dataset.notify]: tg.checked } }); toast(t('toast.done'), true); }
      if (tg.name === 'channel') { savePrefs({ channel: tg.value }); toast(t('toast.done'), true); }
      if (tg.name === 'accent') { savePrefs({ accent: tg.value }); toast(t('toast.accent'), true); }
      if (tg.name === 'lang') setLang(tg.value);   // the shell re-renders everything
    });

    const err = (form, name, msg) => {
      const box = form.elements[name].closest('.field');
      box.classList.toggle('err', !!msg);
      box.querySelector('.msg').textContent = msg || '';
      return !msg;
    };

    const pf = $('#profileForm', body);
    pf?.addEventListener('submit', e => {
      e.preventDefault();
      const v = n => pf.elements[n].value.trim();
      let handle = v('phandle'); if (handle && !handle.startsWith('@')) handle = '@' + handle;
      const ok = [
        err(pf, 'pname', v('pname').length >= 2 ? '' : t('err.name2')),
        err(pf, 'phandle', /^@[a-z0-9_.]{3,20}$/i.test(handle) ? '' : t('err.handle')),
        err(pf, 'pemail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('pemail')) ? '' : t('err.email')),
        err(pf, 'pphone', v('pphone').replace(/\D/g, '').length >= 8 ? '' : t('err.phone2'))
      ].every(Boolean);
      if (!ok) return;
      saveProfile({ name: v('pname'), handle, email: v('pemail'), phone: v('pphone'), avatar: pf.elements.avatar.value });
      pf.elements.phandle.value = handle;
      toast(t('toast.profile'), true);
    });

    const pw = $('#pwForm', body);
    if (pw) {
      const strength = s => [s.length >= 8, /[a-z]/i.test(s), /\d/.test(s), /[^a-z0-9]/i.test(s), s.length >= 12].filter(Boolean).length;
      pw.elements.newpw.addEventListener('input', () => {
        const n = strength(pw.elements.newpw.value);
        const m = $('#pwMeter', pw);
        m.style.width = (n / 5 * 100) + '%';
        m.dataset.level = n <= 2 ? 'weak' : n <= 3 ? 'ok' : 'strong';
        $('#pwHint', pw).textContent = !pw.elements.newpw.value ? t('set.pwHint') : n <= 2 ? t('set.pwWeak') : n <= 3 ? t('set.pwOk') : t('set.pwStrong');
      });
      pw.addEventListener('submit', e => {
        e.preventDefault();
        const nv = pw.elements.newpw.value;
        const ok = [
          err(pw, 'current', pw.elements.current.value ? '' : t('err.current')),
          err(pw, 'newpw', nv.length >= 8 && /[a-z]/i.test(nv) && /\d/.test(nv) ? '' : t('set.pwHint')),
          err(pw, 'confirm', pw.elements.confirm.value === nv && nv ? '' : t('err.match'))
        ].every(Boolean);
        if (!ok) return;
        pw.reset();
        $('#pwMeter', pw).style.width = '0';
        toast(t('toast.password'), true);
      });
    }

    $('#exportBtn', body)?.addEventListener('click', () => { exportData(); toast(t('toast.export'), true); });
    $('#clearViewed', body)?.addEventListener('click', e => {
      clearViewed();
      e.currentTarget.disabled = true;
      e.currentTarget.closest('.set-row').querySelector('p').textContent = plural('history', 0);
      toast(t('toast.history'), true);
    });
    const reset = $('#resetBtn', body);
    let armed = null;
    reset?.addEventListener('click', () => {
      if (armed) return resetEverything();
      reset.textContent = t('set.resetConfirm');
      reset.classList.add('armed');
      armed = setTimeout(() => { armed = null; reset.textContent = t('set.resetB'); reset.classList.remove('armed'); }, 4000);
    });
    return () => clearTimeout(armed);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Support
   ══════════════════════════════════════════════════════════════════════ */
const support = {
  title: () => t('menu.support'),
  render() {
    const tel = STORE.phone.replace(/\s/g, '');
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(STORE.address);
    return `
      <div class="page">
        ${pageHead(t('sup.title'), esc(t('sup.sub')), [[t('home'), '#/'], [t('menu.support'), '']])}
        <div class="contact-grid">
          <a class="contact card" href="tel:${tel}">${ICON.phone}<b>${esc(t('sup.call'))}</b><span dir="ltr">${esc(STORE.phone)}</span></a>
          <a class="contact card" href="mailto:${STORE.email}">${ICON.mail}<b>${esc(t('sup.email'))}</b><span dir="ltr">${esc(STORE.email)}</span></a>
          <a class="contact card" href="${maps}" target="_blank" rel="noopener">${ICON.pin}<b>${esc(t('sup.visit'))}</b><span>${esc(t('store.address'))}</span></a>
          <div class="contact card">${ICON.clock}<b>${esc(t('sup.hours'))}</b>
            <span class="hours">${STORE.hours.filter(([, h]) => h).map(([d, h]) => `<i>${esc(t(d))}</i><i dir="ltr">${esc(h)}</i>`).join('')}</span></div>
        </div>

        <div class="support-layout">
          <section class="block">
            <h2>${esc(t('sup.faq'))}</h2>
            <div class="faq">${faq().map(([q, a], i) => `
              <details ${i === 0 ? 'open' : ''}><summary>${esc(q)}<span class="plus" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join('')}
            </div>
          </section>

          <section class="block">
            <h2>${esc(t('sup.send'))}</h2>
            <form id="contactForm" class="card form" novalidate>
              <div class="field-row">
                ${field('cname', t('sup.name'), state.profile.name)}
                ${field('cemail', t('co.email'), state.profile.email, 'email', 'dir="ltr"')}
              </div>
              <div class="field">
                <label for="corder">${esc(t('sup.order'))}</label>
                <select id="corder" class="select">
                  <option value="">${esc(t('sup.notOrder'))}</option>
                  ${allOrders().map(o => `<option value="${o.id}">${o.id} · ${esc(o.items.map(([id]) => byId[id].short).join(', '))}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label for="cmsg">${esc(t('sup.msg'))}</label>
                <textarea id="cmsg" name="cmsg" rows="5" placeholder="${esc(t('sup.msgPh'))}"></textarea>
                <span class="msg" aria-live="polite"></span>
              </div>
              <button class="btn btn-solid" type="submit">${ICON.mail} ${esc(t('sup.sendB'))}</button>
              <p class="hint">${esc(t('sup.sendD', { email: STORE.email }))}</p>
            </form>
          </section>
        </div>
      </div>`;
  },
  mount(el) {
    const f = $('#contactForm', el);
    f.addEventListener('submit', e => {
      e.preventDefault();
      const msg = f.elements.cmsg;
      const box = msg.closest('.field');
      const bad = msg.value.trim().length < 10;
      box.classList.toggle('err', bad);
      box.querySelector('.msg').textContent = bad ? t('err.msg') : '';
      if (bad) return msg.focus();
      const orderId = $('#corder', f).value;
      const subject = orderId ? t('sup.subjOrder', { id: orderId }) : t('sup.subjGeneral');
      const bodyText = `${msg.value.trim()}\n\n— ${f.elements.cname.value} (${f.elements.cemail.value})`;
      location.href = `mailto:${STORE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      toast(t('toast.mail'), true);
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Notifications
   ══════════════════════════════════════════════════════════════════════ */
const notifications = {
  title: () => t('nt.title'),
  rerenderOn: ['notes'],
  render() {
    const unread = unreadCount();
    return `
      <div class="page narrow">
        ${pageHead(t('nt.title'), unread ? plural('unread', unread) : esc(t('nt.caught')), [[t('home'), '#/'], [t('nt.title'), '']],
          unread ? `<button class="btn btn-ghost" id="readAll">${esc(t('nt.readAll'))}</button>` : '')}
        <div class="note-list">
          ${NOTIFICATIONS.map(n => { const x = noteText(n); return `
            <a class="note card${state.read.has(n.id) ? '' : ' unread'}" href="${n.href}" data-note="${n.id}">
              <img src="${avatarSrc(n.who)}" alt="">
              <span class="txt"><b>${esc(x.title)}</b><span>${esc(x.body)}</span></span>
              <time>${esc(x.when)}</time>
            </a>`; }).join('')}
        </div>
        <p class="hint" style="margin-top:14px">${t('nt.hint', { link: `<a href="#/settings/notifications">${esc(t('nt.link'))}</a>` })}</p>
      </div>`;
  },
  mount(el) {
    $('#readAll', el)?.addEventListener('click', () => markRead());
    const onClick = e => { const n = e.target.closest('[data-note]'); if (n) markRead([n.dataset.note]); };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Not found
   ══════════════════════════════════════════════════════════════════════ */
const notFound = {
  title: () => t('nf.title'),
  render: () => `
    <div class="page">
      <div class="not-found">
        <b>404</b>
        <h1>${esc(t('nf.title'))}</h1>
        <p>${esc(t('nf.text'))}</p>
        <div class="nf-cta"><a class="btn btn-solid" href="#/">${esc(t('nf.back'))}</a><a class="btn btn-ghost" href="#/shop">${esc(t('nf.browse'))}</a></div>
      </div>
    </div>`
};

/* ══════════════════════════════════════════════════════════════════════
   Legal pages: terms of sale, privacy, refunds, legal notice. A template in
   each language (i18n.js) that the owner can reword in Store settings; words
   in curly brackets come from the store's details.
   ══════════════════════════════════════════════════════════════════════ */
export const LEGAL_PAGES = ['terms', 'privacy', 'refunds', 'notice'];
const legalVars = () => ({ name: t('brand'), legalName: STORE.legalName || t('brand'), email: STORE.email, phone: STORE.phone,
  address: t('store.address'), regNo: STORE.regNo || '', taxId: STORE.taxId || '' });
export function legalBody(page) {
  const vars = legalVars();
  const src = LEGAL_OVR[page]?.[lang()] || t(`legal.${page}.body`);
  return src.split('\n')
    .filter(line => { const m = line.match(/\{(regNo|taxId)\}/); return !m || vars[m[1]]; })   // no empty "Tax ID:" lines
    .join('\n').replace(/\{(\w+)\}/g, (all, k) => (k in vars ? vars[k] : all));
}
const legal = {
  title: ctx => t(LEGAL_PAGES.includes(ctx.params[0]) ? 'legal.' + ctx.params[0] : 'nf.title'),
  render(ctx) {
    const page = ctx.params[0];
    if (!LEGAL_PAGES.includes(page)) return notFound.render();
    return `
      <div class="page legal-page">
        ${pageHead(t('legal.' + page), '', [[t('home'), '#/'], [t('legal.' + page), '']])}
        <nav class="legal-nav" aria-label="${esc(t('foot.notice'))}">${LEGAL_PAGES.map(p => `<a href="#/legal/${p}" ${p === page ? 'aria-current="page"' : ''}>${esc(t('legal.' + p))}</a>`).join('')}</nav>
        <article class="card legal-body rich" dir="auto">${richText(legalBody(page))}</article>
      </div>`;
  }
};

export const VIEWS = { home, shop, product, wishlist, checkout, order, orders, profile, settings, support, notifications, notFound, legal };
