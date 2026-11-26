/* TechGarage demo — the app shell.
   Top bar, rail, search, language, basket drawer, shared actions and the
   hash router. Pages live in views.js; state and helpers in core.js;
   wording in i18n.js. */

import { CATEGORIES, NOTIFICATIONS, EXTRAS, PAGE_SECTIONS, SHOP_MODE, STORE } from './data.js?v=20261129d';
import { LANGS, t, lang, langInfo, setLang, onLang, applyLang, currencies, currencyNow, setCurrency, setBasePrices, refreshRates } from './i18n.js?v=20261129d';
import {
  $, $$, byId, tnd, esc, avatarSrc, go, ICON, state, on,
  cartQty, cartTotal, setQty, addToCart, toggleWish, unreadCount, markRead, noteText,
  applyPrefs, searchProducts, media, fitAll, toast, commitAdmin, catLabel, subLabel, subsOf, familyLead, FAMILY_CATS, signOut, consent, setConsent
} from './core.js?v=20261129d';
import { VIEWS, pageArt } from './views.js?v=20261129d';
import { admin } from './admin.js?v=20261129d';
import { mediaReady } from './media-store.js?v=20261129d';
import { startSync } from './sync.js?v=20261129d';
import { signup } from './signup.js?v=20261129d';
import { chatFab, chatOpen, chatInit } from './chat.js?v=20261129d';
import { canMorph, motionOn, introduce, revealOnScroll, tiltCards } from './motion.js?v=20261129d';
import { glassSelects, closeGlassSelect } from './glass-select.js?v=20261129d';
import { protect } from './protect.js?v=20261129d';
import { initSmooth, syncScroll } from './smooth.js?v=20261129d';

document.getElementById('webFonts')?.setAttribute('media', 'all');   // web fonts arrive without holding up the first paint
protect();   // no right-click, copying or developer-tools shortcuts on store pages

/* Preview mode on hosted copies: a bar on every page, and checkout switched off. */
const hosted = !['localhost', '127.0.0.1', '', '[::1]'].includes(location.hostname);
if (SHOP_MODE !== 'live' && hosted) {
  document.documentElement.classList.add('shop-preview');
  const bar = Object.assign(document.createElement('div'), { className: 'preview-bar', role: 'note' });
  const say = () => { bar.textContent = t('preview.bar'); };
  say(); onLang(say);
  document.body.prepend(bar);
  // a preview isn't the shop: keep it out of search engines
  document.head.append(Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' }));
  document.addEventListener('submit', e => {
    if (!e.target.closest('#checkoutForm')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    toast(t('preview.checkoutOff'));
  }, true);
}

VIEWS.admin = admin;
VIEWS.signup = signup;

applyLang();
applyPrefs();
if (currencyNow() !== 'TND') refreshRates();   // today's rates, for a shopper browsing in another currency

const view = $('#view');

/* ══════════════════════════════════════════════════════════════════════
   Static text in index.html  (data-i18n="key", data-i18n-attr="attr:key,…")
   ══════════════════════════════════════════════════════════════════════ */
function renderStatic() {
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(',').forEach(pair => {
    const [attr, key] = pair.split(':');
    el.setAttribute(attr, t(key));
  }));
  $('#langCode').textContent = langInfo().short;
}

/* ══════════════════════════════════════════════════════════════════════
   Popovers
   ══════════════════════════════════════════════════════════════════════ */
function closePops() {
  $$('.pop.open').forEach(p => p.classList.remove('open'));
  $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
function wirePop(btn, pop, onOpen) {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = pop.classList.contains('open');
    closePops();
    if (!open) { pop.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); onOpen?.(); }
  });
  pop.addEventListener('click', e => {
    e.stopPropagation();
    if (e.target.closest('a, [data-lang], [data-cur]')) closePops();
  });
}
document.addEventListener('click', closePops);

/* ══════════════════════════════════════════════════════════════════════
   Account chip, account menu, notifications, language
   ══════════════════════════════════════════════════════════════════════ */
/* a plain silhouette for the guest chip (no account, no picture) */
const GUEST_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='20' fill='%23ffffff22'/%3E%3Ccircle cx='20' cy='16' r='6.5' fill='none' stroke='white' stroke-width='2'/%3E%3Cpath d='M9 32c1.8-5.5 6-8 11-8s9.2 2.5 11 8' fill='none' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E";

function renderAccount() {
  const pr = state.profile;
  if (!state.signedIn) {
    $('#accountAvatar').src = GUEST_AVATAR;
    $('#accountName').textContent = t('acct.guest');
    $('#accountHandle').textContent = t('acct.signin');
    $('#accountPop').innerHTML = `
      <a class="pop-head" href="#/signup">
        <img src="${GUEST_AVATAR}" alt="">
        <span><b>${esc(t('acct.guest'))}</b><p>${esc(t('acct.guestD'))}</p></span>
      </a>
      <hr>
      <a class="pop-row" href="#/signup"><span class="pop-ico">${ICON.user}</span><b>${esc(t('acct.signin'))}</b></a>
      <a class="pop-row" href="#/signup"><span class="pop-ico">${ICON.plus}</span><b>${esc(t('menu.signup'))}</b></a>
      <hr>
      <a class="pop-row" href="#/wishlist"><span class="pop-ico">${ICON.heart}</span><b>${esc(t('menu.wishlist'))}</b><em class="pop-count">${state.wish.size || ''}</em></a>
      <a class="pop-row" href="#/support"><span class="pop-ico">${ICON.phone}</span><b>${esc(t('menu.support'))}</b></a>`;
    return;
  }
  $('#accountAvatar').src = avatarSrc(pr.avatar);
  $('#accountName').textContent = pr.name;
  $('#accountHandle').textContent = pr.handle;
  $('#accountPop').innerHTML = `
    <a class="pop-head" href="#/profile">
      <img src="${avatarSrc(pr.avatar)}" alt="">
      <span><b>${esc(pr.name)}</b><p dir="ltr">${esc(pr.email)}</p></span>
    </a>
    <hr>
    <a class="pop-row" href="#/profile"><span class="pop-ico">${ICON.user}</span><b>${esc(t('menu.profile'))}</b></a>
    <a class="pop-row" href="#/orders"><span class="pop-ico">${ICON.box}</span><b>${esc(t('menu.orders'))}</b></a>
    <a class="pop-row" href="#/wishlist"><span class="pop-ico">${ICON.heart}</span><b>${esc(t('menu.wishlist'))}</b><em class="pop-count">${state.wish.size || ''}</em></a>
    <a class="pop-row" href="#/settings"><span class="pop-ico">${ICON.palette}</span><b>${esc(t('menu.settings'))}</b></a>
    <a class="pop-row" href="#/support"><span class="pop-ico">${ICON.phone}</span><b>${esc(t('menu.support'))}</b></a>
    <a class="pop-row" href="#/admin"><span class="pop-ico">${ICON.admin}</span><b>${esc(t('menu.admin'))}</b></a>
    <hr>
    <a class="pop-row" href="#/signup"><span class="pop-ico">${ICON.plus}</span><b>${esc(t('menu.signup'))}</b></a>
    <button class="pop-row" id="signOut"><span class="pop-ico">${ICON.lock}</span><b>${esc(t('menu.signout'))}</b></button>`;
  $('#signOut').addEventListener('click', () => {
    closePops();
    signOut();
    toast(t('toast.signout'), true);
    if (location.hash === '#/' || location.hash === '') route({ keepScroll: true }); else go('#/');
  });
}

function renderBell() {
  $('#bellDot').hidden = unreadCount() === 0;
  $('#bellPop').innerHTML = `<h4>${esc(t('bell'))}</h4>` + NOTIFICATIONS.map(n => { const x = noteText(n); return `
    <a class="pop-row${state.read.has(n.id) ? '' : ' unread'}" href="${n.href}">
      <img src="${avatarSrc(n.who)}" alt="">
      <span style="flex:1"><b>${esc(x.title)}</b><p>${esc(x.body)}</p></span>
      <time>${esc(x.when)}</time>
    </a>`; }).join('') + `<a class="pop-foot" href="#/notifications">${esc(t('notif.viewAll'))}</a>`;
}

function renderLangPop() {
  $('#langPop').innerHTML = `<h4 role="none">${esc(t('lang.label'))}</h4>` + LANGS.map(l => `
    <button class="pop-row lang-opt" data-lang="${l.id}" role="menuitemradio" aria-checked="${lang() === l.id}" lang="${l.id}">
      <span class="lang-badge">${esc(l.short)}</span><b>${esc(l.label)}</b>${lang() === l.id ? `<span class="lang-on">${ICON.check}</span>` : ''}
    </button>`).join('') + currencyMenu();
}
/* the display currency, in the same menu as the language */
const curName = c => { try { return new Intl.DisplayNames([langInfo().locale], { type: 'currency' }).of(c); } catch { return c; } };
const currencyMenu = () => `<h4 role="none">${esc(t('cur.label'))}</h4><div class="cur-grid" role="group" aria-label="${esc(t('cur.label'))}">` + currencies().map(c => `
    <button class="cur-opt" data-cur="${c}" role="menuitemradio" aria-checked="${currencyNow() === c}" title="${esc(curName(c))}" aria-label="${esc(curName(c))}">${esc(c)}</button>`).join('')
  + `</div><p class="pop-note">${esc(t('cur.note'))}</p>`;
$('#langPop').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (b) setLang(b.dataset.lang);
  const c = e.target.closest('[data-cur]');
  if (c) setCurrency(c.dataset.cur);
});

/* The footer on every store page: legal pages, help, payment methods, business details. */
const FOOTLESS = new Set(['admin', 'signup']);
function siteFooter() {
  const reg = [STORE.regNo && t('foot.reg', { reg: STORE.regNo }), STORE.taxId && t('foot.tax', { tax: STORE.taxId })].filter(Boolean).join(' · ');
  return `
    <footer class="site-foot">
      <nav class="foot-links" aria-label="${esc(t('foot.notice'))}">
        ${['terms', 'privacy', 'refunds', 'notice'].map(p => `<a href="#/legal/${p}">${esc(t('foot.' + p))}</a>`).join('')}
        <a href="#/support">${esc(t('foot.help'))}</a>
        <button type="button" class="link-btn" data-privacy-choices>${esc(t('foot.choices'))}</button>
      </nav>
      <div class="foot-pay"><span>${esc(t('foot.pay'))}</span>
        <span class="pay-brands" aria-hidden="true"><i>VISA</i><i>MASTERCARD</i><i>e-DINAR</i><i>D17</i><i class="brand-ooredoo">ooredoo</i></span></div>
      <p class="foot-meta">${esc(t('foot.copy', { year: new Date().getFullYear(), name: STORE.legalName || t('brand') }))}${reg ? ' · ' + esc(reg) : ''}<br>${esc(t('foot.prices'))}</p>
    </footer>`;
}

/* Privacy notice: asked once; "Privacy choices" in the footer asks again. */
function askConsent() {
  document.querySelector('.consent')?.remove();
  const box = document.createElement('section');
  box.className = 'consent card';
  box.setAttribute('aria-label', t('consent.title'));
  box.innerHTML = `<b>${esc(t('consent.title'))}</b><p>${esc(t('consent.text'))} <a href="#/legal/privacy">${esc(t('consent.more'))}</a></p>
    <div class="consent-btns"><button type="button" class="btn btn-ghost btn-sm" data-consent="essential">${esc(t('consent.essential'))}</button>
    <button type="button" class="btn btn-solid btn-sm" data-consent="all">${esc(t('consent.all'))}</button></div>`;
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    setConsent(b.dataset.consent);
    box.remove();
    if (b.dataset.consent === 'all' && current?.name === 'home') route({ keepScroll: true });
  });
  document.body.append(box);
}
document.addEventListener('click', e => { if (e.target.closest('[data-privacy-choices]')) askConsent(); });
document.addEventListener('click', e => { const b = e.target.closest('[data-chat-buy]'); if (b) { e.preventDefault(); chatOpen(b.dataset.chatBuy); } });

wirePop($('#bell'), $('#bellPop'), () => setTimeout(() => markRead(), 900));
wirePop($('#accountBtn'), $('#accountPop'));
wirePop($('#langBtn'), $('#langPop'));
on('profile', renderAccount);
on('wish', renderAccount);
on('notes', renderBell);

/* ══════════════════════════════════════════════════════════════════════
   Category tabs — Trending is home, the rest open the shop.
   Hovering a tab opens a menu of its subcategories, like techgarage.tn.
   ══════════════════════════════════════════════════════════════════════ */
/* Mobile games and gift-card brands show their icon in the menu: the app's
   store icon where there is an app, otherwise a square of the store's own card art. */
const SUB_ICON = Object.fromEntries([
  ...['efootball', 'pubg', 'freefire', 'codm', 'coc', 'clashroyale', 'brawlstars', 'roblox', 'genshin',
      'wildrift', 'fcmobile', 'mlbb', 'hsr', 'wuwa', 'whiteout', 'bloodstrike', 'warzone'].map(id => [id, `assets/icons/games/${id}.webp`]),
  ...['steam', 'playstation', 'itunes', 'xbox', 'valorant', 'lol', 'fortnite', 'razer', 'nintendo', 'battlenet',
      'marvel', 'epic', 'binance', 'redotpay', 'bybit', 'ufl'].map(id => [id, `assets/icons/brands/${id}.webp`])
]);
const tabsEl = $('#tabs'), pill = $('#tabPill'), mega = $('#mega');
let activeCat = 'all', megaTimer = null;

function renderTabs() {
  $$('.tab', tabsEl).forEach(el => el.remove());
  CATEGORIES.forEach(c => {
    const a = document.createElement('a');
    a.className = 'tab';
    a.setAttribute('role', 'tab');
    a.textContent = c.id === 'all' ? t('cat.all') : catLabel(c.id);
    a.dataset.cat = c.id;
    a.href = c.id === 'all' ? '#/' : `#/shop/${c.id}`;
    if (c.subs) a.setAttribute('aria-haspopup', 'true');
    tabsEl.append(a);
  });
  setActiveTab(activeCat);
  if (typeof tabSizes !== 'undefined') watchTabs();   // the tab elements are new, observe them
}

function setActiveTab(cat) {
  activeCat = cat;
  $$('.tab', tabsEl).forEach(el => el.setAttribute('aria-selected', String(el.dataset.cat === cat)));
  const active = tabsEl.querySelector('[aria-selected="true"]');
  pill.style.opacity = active ? '1' : '0';
  if (!active) return;
  pill.style.width = active.offsetWidth + 'px';
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
}

function openMega(tab) {
  const cat = tab.dataset.cat, subs = subsOf(cat);
  if (!subs.length || matchMedia('(max-width: 960px), (hover: none)').matches) return;
  clearTimeout(megaTimer);
  mega.innerHTML = `
    <a class="mega-all" href="#/shop/${cat}">${esc(t('shop.allIn', { cat: catLabel(cat) }))} ${ICON.chev}</a>
    <div class="mega-grid${subs.some(id => SUB_ICON[id]) ? ' with-icons' : ''}">${subs.map(id => `<a href="${FAMILY_CATS.includes(cat) && familyLead(id) ? `#/product/${familyLead(id).id}` : `#/shop/${cat}/${id}`}">${SUB_ICON[id] ? `<img class="mega-ico" src="${SUB_ICON[id]}" alt="" width="32" height="32" loading="lazy" decoding="async">` : ''}<span>${esc(subLabel(id))}</span></a>`).join('')}</div>`;
  mega.dataset.cat = cat;
  mega.hidden = false;
  const tr = tab.getBoundingClientRect(), pr = mega.offsetParent.getBoundingClientRect();
  const width = Math.min(subs.length > 8 ? 620 : 340, pr.width - 24);
  let left = tr.left - pr.left + tr.width / 2 - width / 2;
  left = Math.max(12, Math.min(left, pr.width - width - 12));
  Object.assign(mega.style, { width: width + 'px', left: left + 'px' });
  requestAnimationFrame(() => mega.classList.add('open'));
}
function closeMega(now = false) {
  clearTimeout(megaTimer);
  const shut = () => { mega.classList.remove('open'); mega.hidden = true; };
  now ? shut() : (megaTimer = setTimeout(shut, 160));
}
tabsEl.addEventListener('mouseover', e => { const tab = e.target.closest('.tab'); if (tab) tab.dataset.cat === 'all' ? closeMega(true) : openMega(tab); });
tabsEl.addEventListener('mouseleave', () => closeMega());
tabsEl.addEventListener('focusin', e => { const tab = e.target.closest('.tab'); if (tab && tab.dataset.cat !== 'all') openMega(tab); });
mega.addEventListener('mouseenter', () => clearTimeout(megaTimer));
mega.addEventListener('mouseleave', () => closeMega());
mega.addEventListener('click', e => { if (e.target.closest('a')) closeMega(true); });

/* ══════════════════════════════════════════════════════════════════════
   Search
   ══════════════════════════════════════════════════════════════════════ */
const input = $('#search'), results = $('#results');
let cursor = -1;

const mark = (text, q) => {
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
};

function closeResults() { results.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); }

function search() {
  const q = input.value.trim().toLowerCase();
  cursor = -1;
  if (!q) return closeResults();
  const hits = searchProducts(q);
  results.innerHTML = (hits.length
    ? hits.slice(0, 6).map(p => `
        <button class="result" data-view="${p.id}" role="option">
          ${media(p, 'thumb', { eager: true })}
          <span style="min-width:0"><b>${mark(p.short, q)}</b><span>${esc(subLabel(p.sub))}</span></span>
          <span class="px">${tnd(p.price)}</span>
        </button>`).join('')
    : `<p class="empty">${esc(t('search.empty', { q: input.value.trim() }))}</p>`)
    + (hits.length ? `<a class="result-all" href="#/shop?q=${encodeURIComponent(input.value.trim())}">${esc(t('search.seeAll', { n: hits.length }))}</a>` : '');
  results.classList.add('open');
  input.setAttribute('aria-expanded', 'true');
}

input.addEventListener('input', search);
input.addEventListener('focus', () => input.value && search());
document.addEventListener('click', e => { if (!e.target.closest('#searchWrap')) closeResults(); });
results.addEventListener('click', e => { if (e.target.closest('a, .result')) { closeResults(); input.blur(); } });

input.addEventListener('keydown', e => {
  const opts = $$('.result', results);
  if (e.key === 'Escape') { input.value = ''; closeResults(); input.blur(); return; }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (cursor > -1 && opts[cursor]) return opts[cursor].click();
    if (input.value.trim()) { go(`#/shop?q=${encodeURIComponent(input.value.trim())}`); closeResults(); input.blur(); }
    return;
  }
  if (!opts.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    cursor = (cursor + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
    opts.forEach((o, i) => o.classList.toggle('cursor', i === cursor));
    opts[cursor].scrollIntoView({ block: 'nearest' });
  }
});

/* ══════════════════════════════════════════════════════════════════════
   Basket drawer
   ══════════════════════════════════════════════════════════════════════ */
const drawer = $('#drawer'), scrim = $('#scrim');

function renderDrawer() {
  const ids = Object.keys(state.cart);
  $('#lines').innerHTML = ids.length ? ids.map(id => {
    const p = byId[id];
    return `<div class="line">
      ${media(p, 'thumb', { eager: true })}
      <span class="txt"><b>${esc(p.short)}</b><span class="px">${tnd(p.price)}</span></span>
      <span class="qty">
        <button data-dec="${id}" aria-label="${esc(t('basket.fewer'))}">−</button>
        <span>${state.cart[id]}</span>
        <button data-inc="${id}" aria-label="${esc(t('basket.more'))}">+</button>
      </span>
    </div>`;
  }).join('') : `<div class="empty-cart">${ICON.cartBig}<p>${esc(t('basket.empty'))}</p><a class="btn btn-ghost" href="#/shop">${esc(t('shop.browse'))}</a></div>`;
  $('#total').textContent = tnd(cartTotal());
  $('#checkout').disabled = !ids.length;
}

function syncBadges() {
  const n = cartQty();
  const c = $('#cartCount');
  c.textContent = n;
  c.classList.toggle('on', n > 0);
  c.classList.remove('bump'); void c.offsetWidth;
  if (n > 0) c.classList.add('bump');
  const w = $('#wishCount');
  w.textContent = state.wish.size;
  w.classList.toggle('on', state.wish.size > 0);
}

const openCart  = () => { renderDrawer(); drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); };
const closeCart = () => { drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); };

$('#railCart').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);
drawer.addEventListener('click', e => { if (e.target.closest('a')) closeCart(); });
$('#checkout').addEventListener('click', () => { closeCart(); go('#/checkout'); });
$('#lines').addEventListener('click', e => {
  const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
  if (inc && state.cart[inc.dataset.inc]) setQty(inc.dataset.inc, state.cart[inc.dataset.inc] + 1);
  if (dec && state.cart[dec.dataset.dec]) setQty(dec.dataset.dec, state.cart[dec.dataset.dec] - 1);
});

on('cart', () => { syncBadges(); if (drawer.classList.contains('open')) renderDrawer(); });
on('wish', syncBadges);

/* keep every heart on screen in step with the wishlist */
on('wish', () => $$('[data-wish]').forEach(b => {
  const yes = state.wish.has(b.dataset.wish);
  b.classList.toggle('on', yes);
  b.setAttribute('aria-pressed', String(yes));
  b.innerHTML = yes ? ICON.heartOn : ICON.heart;
}));

/* ══════════════════════════════════════════════════════════════════════
   Rail
   ══════════════════════════════════════════════════════════════════════ */
$$('.rail-btn[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

const RAIL_FOR = { home: 'home', wishlist: 'wishlist', profile: 'account', orders: 'orders', order: 'orders', settings: 'settings', admin: 'admin' };

/* The sidebar shows icons with labels on wide screens; its last button folds it
   to icons only, and the choice is remembered. */
const railToggle = $('#railToggle');
function applyRail(collapsed) {
  document.documentElement.classList.toggle('rail-collapsed', collapsed);
  railToggle.setAttribute('aria-pressed', String(collapsed));
  const key = collapsed ? 'rail.expand' : 'rail.collapse';
  railToggle.setAttribute('aria-label', t(key));
  railToggle.dataset.i18nAttr = `aria-label:${key}`;
  railToggle.querySelector('.rail-label').dataset.i18n = key;
  railToggle.querySelector('.rail-label').textContent = t(key);
}
applyRail((() => { try { return localStorage.getItem('tg.railCollapsed') === '1'; } catch { return false; } })());
railToggle.addEventListener('click', () => {
  const next = !document.documentElement.classList.contains('rail-collapsed');
  applyRail(next);
  try { localStorage.setItem('tg.railCollapsed', next ? '1' : '0'); } catch {}
});
function setRail(name) {
  $$('.rail-btn').forEach(b => b.setAttribute('aria-current', String(b.dataset.rail === RAIL_FOR[name])));
}

/* ══════════════════════════════════════════════════════════════════════
   Shared actions, delegated from anywhere in the page
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  const buy = e.target.closest('[data-buy]');
  const wish = e.target.closest('[data-wish]');
  const open = e.target.closest('[data-view]');
  if (add) {
    e.preventDefault(); e.stopPropagation();
    const host = add.closest('.tile, .drop, .recent-row, .slide');
    addToCart(add.dataset.add, 1, host?.querySelector('.m-fg'));
  } else if (buy) {
    e.preventDefault();
    addToCart(buy.dataset.buy, 1, buy.closest('.slide')?.querySelector('.m-fg'));
    go('#/checkout');
  } else if (wish) {
    e.preventDefault(); e.stopPropagation();
    toggleWish(wish.dataset.wish);
  } else if (open) {
    closePops();
    // the card's picture becomes the product page's picture
    const m = open.querySelector('.media');
    // one picture carries the name, and only one on the page itself (a search suggestion's
    // thumbnail can still be fading out with the dropdown when the product page arrives)
    if (m && view.contains(m) && !document.querySelector('.pdp-art') && canMorph()) { clearNames(); m.style.viewTransitionName = 'pdp-art'; }
    go(`#/product/${open.dataset.view}`);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('[data-view][tabindex]')) go(`#/product/${e.target.dataset.view}`);
  if (e.key === '/' && !e.target.closest('input, textarea, select')) { e.preventDefault(); input.focus(); }
  if (e.key === 'Escape') { closeCart(); closePops(); closeMega(true); }
});

/* ══════════════════════════════════════════════════════════════════════
   Router
   ══════════════════════════════════════════════════════════════════════ */
const ROUTES = [
  [/^$/,                                  'home'],
  [/^shop(?:\/([\w-]+))?(?:\/([\w-]+))?$/, 'shop'],
  [/^product\/([\w-]+)$/,                 'product'],
  [/^wishlist$/,                          'wishlist'],
  [/^checkout$/,                          'checkout'],
  [/^orders$/,                            'orders'],
  [/^order\/([\w-]+)$/,                   'order'],
  [/^profile$/,                           'profile'],
  [/^settings(?:\/([\w-]+))?$/,           'settings'],
  [/^support$/,                           'support'],
  [/^notifications$/,                     'notifications'],
  [/^legal\/([\w-]+)$/,                   'legal'],
  [/^signup$/,                            'signup'],
  [/^admin(?:\/([\w-]+))?(?:\/([\w-]+))?$/, 'admin']
];

let current = null;

function resolve() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [path, qs] = raw.split('?');
  const query = new URLSearchParams(qs || '');
  for (const [re, n] of ROUTES) {
    const m = path.replace(/\/$/, '').match(re);
    if (m) return { name: n, params: m.slice(1).filter(Boolean), query };
  }
  return { name: 'notFound', params: [], query };
}

/* A round WhatsApp button on store pages (not in the admin or at checkout),
   with the number set in Store admin → Page sections. */
const WA_SVG = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>';
function whatsappButton(page) {
  let a = document.getElementById('waFab');
  const num = EXTRAS.whatsapp, off = !num || PAGE_SECTIONS.hidden.whatsapp || page === 'admin' || page === 'checkout' || page === 'signup';
  if (off) { a?.remove(); return; }
  if (!a) {
    a = Object.assign(document.createElement('a'), { id: 'waFab', className: 'wa-fab', target: '_blank', rel: 'noopener' });
    a.innerHTML = WA_SVG;
    document.body.append(a);
  }
  a.href = `https://wa.me/${num}`;
  a.setAttribute('aria-label', t('wa.label'));
  a.title = t('wa.label');
}

function render({ name, params, query }, keepScroll) {
  const scroll = keepScroll ? view.scrollTop : 0;
  current?.cleanup?.();
  const v = VIEWS[name];
  const ctx = { params, query };
  view.dataset.page = name;
  setBasePrices(name === 'admin');   // the admin always works in dinars
  view.innerHTML = v.render(ctx) + (FOOTLESS.has(name) ? '' : siteFooter());
  const cleanup = v.mount?.(view, ctx);
  closeGlassSelect();
  current = { name, params, cleanup: typeof cleanup === 'function' ? cleanup : null, rerenderOn: v.rerenderOn || [] };
  glassSelects(view);
  fitAll(view);
  pageArt(name, params);   // a product's key art becomes the page background
  whatsappButton(name);
  chatFab(name);   // live chat with the staff
  view.scrollTop = scroll;
  syncScroll(scroll);   // Lenis: jump, don't glide, to the new page's position
  if (!keepScroll) view.focus({ preventScroll: true });
  document.title = `${v.title(ctx)} · ${t('brand')}`;

  const cat = name === 'home' ? 'all' : name === 'shop' ? (params[0] || null) : name === 'product' ? byId[params[0]]?.cat ?? null : null;
  setActiveTab(cat);                                   // now, so it never waits on a transition frame
  requestAnimationFrame(() => setActiveTab(cat));      // and again once fonts and layout settle
  setRail(name);
  closeResults();
  closeMega(true);
}

/* Moving between pages: the old page cross-fades into the new one (View
   Transitions), shared pictures morph — a card's art grows into the product
   page and shrinks back on Back, the category covers shuffle — and the new
   page then builds itself up (motion.js). Re-sorting or filtering the same
   shop page slides every card to its new place instead. */
let running = null;   // the view transition in progress, if any
const clearNames = () => document.querySelectorAll('.media[style*="view-transition-name"]')
  .forEach(m => m.style.removeProperty('view-transition-name'));

/* Back and Forward return to where you were on that page: each history entry
   gets a key, and the scroll position is remembered per key. */
const scrolls = new Map();
let entrySeq = 0;
const pageScroll = () => Math.max(view.scrollTop, scrollY);
const entryKey = () => {
  if (!history.state?.tg) history.replaceState({ ...(history.state || {}), tg: `${Date.now()}-${++entrySeq}` }, '');
  return history.state.tg;
};
let currentEntry = null;
function restoreScroll() {
  const y = scrolls.get(currentEntry);
  if (y) { view._ensureScroll?.(y); view.scrollTop = y; scrollTo(0, y); syncScroll(y); }
}

/* Pages that belong to an account: a guest is sent to sign up instead. */
const ACCOUNT_PAGES = ['profile', 'orders', 'order', 'settings'];

function route({ keepScroll = false } = {}) {
  if (!state.signedIn && ACCOUNT_PAGES.includes(resolve().name)) { location.replace('#/signup'); return; }
  if (!keepScroll && currentEntry) scrolls.set(currentEntry, pageScroll());
  if (!keepScroll) currentEntry = entryKey();
  const next = resolve(), prev = current;
  motionOn();
  // a click while a transition is still playing: finish it at once, show the page plainly
  const busy = !!running;
  if (busy) { running.skipTransition(); running = null; }
  if (busy || keepScroll || !prev || !canMorph() || document.hidden) {
    clearNames();
    render(next, keepScroll);
    if (!keepScroll) { restoreScroll(); introduce(view); revealOnScroll(view); }
    return;
  }
  const root = document.documentElement;
  const sameShop = prev.name === 'shop' && next.name === 'shop' && prev.params.join('/') === next.params.join('/');
  root.classList.toggle('vt-flip', sameShop);
  root.classList.add('vt-run');
  const back = prev.name === 'product' && next.name !== 'product' ? prev.params[0] : null;
  let guard = 0;
  const vt = document.startViewTransition(() => {
    clearTimeout(guard);
    render(next, false);
    restoreScroll();
    if (sameShop) { view.querySelector('.page')?.classList.add('settled'); return; }
    if (back) {                       // the product's card takes the picture back
      const m = view.querySelector(`[data-view="${CSS.escape(back)}"] .media`);
      const r = m?.getBoundingClientRect();
      if (r && r.bottom > 0 && r.top < innerHeight) m.style.viewTransitionName = 'pdp-art';
    }
    introduce(view);
  });
  running = vt;
  // never keep the shopper waiting: if this device can't take the snapshot
  // quickly, drop the animation and show the page straight away
  guard = setTimeout(() => vt.skipTransition(), 300);
  // a skipped or interrupted transition is normal (fast clicks): nothing to report
  vt.ready.catch(() => {});
  vt.updateCallbackDone.catch(() => {});
  vt.finished.catch(() => {}).finally(() => {
    if (running === vt) running = null;
    root.classList.remove('vt-flip', 'vt-run');
    clearNames();
    if (!sameShop) revealOnScroll(view);
  });
}

on('stock', () => { if (['product', 'shop', 'home'].includes(current?.name)) route({ keepScroll: true }); });
/* a page asks to be drawn again where it is (e.g. a search box filtering a list): no transition, keeps the scroll */
on('redraw', () => route({ keepScroll: true }));
['cart', 'wish', 'orders', 'profile', 'notes'].forEach(ev =>
  on(ev, () => { if (current?.rerenderOn.includes(ev)) route({ keepScroll: true }); }));

/* A language change redraws everything in place, keeping the page and scroll. */
onLang(() => {
  renderStatic(); renderTabs(); renderAccount(); renderBell(); renderLangPop();
  if (drawer.classList.contains('open')) renderDrawer(); else $('#total').textContent = tnd(cartTotal());
  if (input.value) search();
  route({ keepScroll: true });
  if (lang() !== shownLang) { shownLang = lang(); toast(t('lang.changed'), true); }   // a currency change redraws quietly
});
let shownLang = lang();

/* The store owner changed the catalogue in the admin: redraw the tabs, menus
   and the page being shown, in place. */
on('catalog', () => {
  renderTabs();
  if (drawer.classList.contains('open')) renderDrawer();
  if (input.value) search();
  route({ keepScroll: true });
});

addEventListener('hashchange', () => route());
$('.skip-link').addEventListener('click', () => view.focus());
tiltCards(document);
initSmooth(view);
/* The pill must follow its tab's real width, which changes when a web font
   arrives (the Arabic one loads only when Arabic text appears) or the
   window resizes, so watch the tabs themselves rather than guess when. */
const tabSizes = 'ResizeObserver' in window ? new ResizeObserver(() => setActiveTab(activeCat)) : null;
function watchTabs() {
  if (!tabSizes) return;
  tabSizes.disconnect();
  tabSizes.observe(tabsEl);
  $$('.tab', tabsEl).forEach(el => tabSizes.observe(el));
}
addEventListener('resize', () => setActiveTab(activeCat));
document.fonts?.addEventListener?.('loadingdone', () => setActiveTab(activeCat));
document.fonts?.ready.then(() => setActiveTab(activeCat));

renderStatic();
renderTabs();
watchTabs();
renderAccount();
renderBell();
renderLangPop();
syncBadges();
await mediaReady;   // uploaded photos and videos (IndexedDB) resolve before the first page is drawn

/* The live site: the shared store loads before the first page, then another
   admin's saves arrive every few seconds. A product form being edited is never
   redrawn under the owner's hands: the change waits until they leave it. */
let pendingRemote = null;
const editingProduct = () => /^#\/admin\/product\//.test(location.hash);
const applyRemote = record => {
  if (editingProduct()) { if (!pendingRemote) toast(t('sync.waiting')); pendingRemote = record; return; }
  pendingRemote = null;
  commitAdmin(record, { remote: true });
  if (location.hash.startsWith('#/admin')) toast(t('sync.updated'), true);
};
addEventListener('hashchange', () => { if (pendingRemote && !editingProduct()) applyRemote(pendingRemote); });
chatInit();   // the live site without a chat database: no chat button
await startSync(applyRemote);
route();
if (!consent()) askConsent();
