/* TechGarage demo — the app shell.
   Top bar, rail, search, language, basket drawer, shared actions and the
   hash router. Pages live in views.js; state and helpers in core.js;
   wording in i18n.js. */

import { CATEGORIES, NOTIFICATIONS } from './data.js?v=20261124c';
import { LANGS, t, lang, langInfo, setLang, onLang, applyLang } from './i18n.js?v=20261124c';
import {
  $, $$, byId, tnd, esc, avatarSrc, go, ICON, state, on,
  cartQty, cartTotal, setQty, addToCart, toggleWish, unreadCount, markRead, noteText,
  applyPrefs, searchProducts, media, fitAll, toast, catLabel, subLabel, subsOf, familyLead, FAMILY_CATS
} from './core.js?v=20261124c';
import { VIEWS } from './views.js?v=20261124c';
import { admin } from './admin.js?v=20261124c';
import { canMorph, motionOn, introduce, revealOnScroll, tiltCards } from './motion.js?v=20261124c';

VIEWS.admin = admin;

applyLang();
applyPrefs();

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
    if (e.target.closest('a, [data-lang]')) closePops();
  });
}
document.addEventListener('click', closePops);

/* ══════════════════════════════════════════════════════════════════════
   Account chip, account menu, notifications, language
   ══════════════════════════════════════════════════════════════════════ */
function renderAccount() {
  const pr = state.profile;
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
    <button class="pop-row" id="signOut"><span class="pop-ico">${ICON.lock}</span><b>${esc(t('menu.signout'))}</b></button>`;
  $('#signOut').addEventListener('click', () => { closePops(); toast(t('toast.signout')); });
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
  $('#langPop').innerHTML = `<h4>${esc(t('lang.label'))}</h4>` + LANGS.map(l => `
    <button class="pop-row lang-opt" data-lang="${l.id}" role="menuitemradio" aria-checked="${lang() === l.id}" lang="${l.id}">
      <span class="lang-badge">${esc(l.short)}</span><b>${esc(l.label)}</b>${lang() === l.id ? `<span class="lang-on">${ICON.check}</span>` : ''}
    </button>`).join('');
}
$('#langPop').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (b) setLang(b.dataset.lang);
});

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
    <div class="mega-grid">${subs.map(id => `<a href="${FAMILY_CATS.includes(cat) && familyLead(id) ? `#/product/${familyLead(id).id}` : `#/shop/${cat}/${id}`}">${esc(subLabel(id))}</a>`).join('')}</div>`;
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

const RAIL_FOR = { home: 'home', wishlist: 'wishlist', profile: 'account', orders: 'account', order: 'account', settings: 'settings' };
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
    if (m && !document.querySelector('.pdp-art') && canMorph()) m.style.viewTransitionName = 'pdp-art';
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

function render({ name, params, query }, keepScroll) {
  const scroll = keepScroll ? view.scrollTop : 0;
  current?.cleanup?.();
  const v = VIEWS[name];
  const ctx = { params, query };
  view.dataset.page = name;
  view.innerHTML = v.render(ctx);
  const cleanup = v.mount?.(view, ctx);
  current = { name, params, cleanup: typeof cleanup === 'function' ? cleanup : null, rerenderOn: v.rerenderOn || [] };
  fitAll(view);
  view.scrollTop = scroll;
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

function route({ keepScroll = false } = {}) {
  const next = resolve(), prev = current;
  motionOn();
  // a click while a transition is still playing: finish it at once, show the page plainly
  const busy = !!running;
  if (busy) { running.skipTransition(); running = null; }
  if (busy || keepScroll || !prev || !canMorph() || document.hidden) {
    clearNames();
    render(next, keepScroll);
    if (!keepScroll) { introduce(view); revealOnScroll(view); }
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

['cart', 'wish', 'orders', 'profile', 'notes'].forEach(ev =>
  on(ev, () => { if (current?.rerenderOn.includes(ev)) route({ keepScroll: true }); }));

/* A language change redraws everything in place, keeping the page and scroll. */
onLang(() => {
  renderStatic(); renderTabs(); renderAccount(); renderBell(); renderLangPop();
  if (drawer.classList.contains('open')) renderDrawer(); else $('#total').textContent = tnd(cartTotal());
  if (input.value) search();
  route({ keepScroll: true });
  toast(t('lang.changed'), true);
});

/* The store owner changed the catalogue in the admin: redraw the tabs, menus
   and the page being shown, in place. */
on('catalog', () => {
  renderTabs();
  if (drawer.classList.contains('open')) renderDrawer();
  if (input.value) search();
  route({ keepScroll: true });
});

addEventListener('hashchange', () => route());
tiltCards(document);
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
route();
