/* TechGarage demo — the app shell.
   Top bar, rail, search, basket drawer, shared actions and the hash router.
   Pages live in views.js; state and helpers in core.js. */

import { CATEGORIES, NOTIFICATIONS } from './data.js';
import {
  $, $$, byId, tnd, esc, avatarSrc, go, ICON, state, on, emit,
  cartQty, cartTotal, setQty, addToCart, toggleWish, unreadCount, markRead,
  applyPrefs, searchProducts, thumb, toast
} from './core.js';
import { VIEWS } from './views.js';

applyPrefs();

const view = $('#view');

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
    if (e.target.closest('a')) closePops();
  });
}
document.addEventListener('click', closePops);

/* ══════════════════════════════════════════════════════════════════════
   Account chip, account menu, notifications
   ══════════════════════════════════════════════════════════════════════ */
function renderAccount() {
  const pr = state.profile;
  $('#accountAvatar').src = avatarSrc(pr.avatar);
  $('#accountName').textContent = pr.name;
  $('#accountHandle').textContent = pr.handle;
  $('#accountPop').innerHTML = `
    <a class="pop-head" href="#/profile">
      <img src="${avatarSrc(pr.avatar)}" alt="">
      <span><b>${esc(pr.name)}</b><p>${esc(pr.email)}</p></span>
    </a>
    <hr>
    <a class="pop-row" href="#/profile"><span class="pop-ico">${ICON.user}</span><b>Profile</b></a>
    <a class="pop-row" href="#/orders"><span class="pop-ico">${ICON.box}</span><b>Orders</b></a>
    <a class="pop-row" href="#/wishlist"><span class="pop-ico">${ICON.heart}</span><b>Wishlist</b><em class="pop-count">${state.wish.size || ''}</em></a>
    <a class="pop-row" href="#/settings"><span class="pop-ico">${ICON.palette}</span><b>Settings</b></a>
    <a class="pop-row" href="#/support"><span class="pop-ico">${ICON.phone}</span><b>Support</b></a>
    <hr>
    <button class="pop-row" id="signOut"><span class="pop-ico">${ICON.lock}</span><b>Sign out</b></button>`;
  $('#signOut').addEventListener('click', () => { closePops(); toast('Signing out isn’t part of this demo'); });
}

function renderBell() {
  const unread = unreadCount();
  $('#bellDot').hidden = unread === 0;
  $('#bellPop').innerHTML = `<h4>Notifications</h4>` + NOTIFICATIONS.map(n => `
    <a class="pop-row${state.read.has(n.id) ? '' : ' unread'}" href="${n.href}">
      <img src="${avatarSrc(n.who)}" alt="">
      <span style="flex:1"><b>${esc(n.title)}</b><p>${esc(n.body)}</p></span>
      <time>${n.when}</time>
    </a>`).join('') + `<a class="pop-foot" href="#/notifications">View all notifications</a>`;
}

wirePop($('#bell'), $('#bellPop'), () => setTimeout(() => markRead(), 900));
wirePop($('#accountBtn'), $('#accountPop'));
renderAccount();
renderBell();
on('profile', renderAccount);
on('wish', renderAccount);
on('notes', renderBell);

/* ══════════════════════════════════════════════════════════════════════
   Category tabs — Trending is home, the rest open the shop
   ══════════════════════════════════════════════════════════════════════ */
const tabsEl = $('#tabs'), pill = $('#tabPill');
CATEGORIES.forEach(c => {
  const a = document.createElement('a');
  a.className = 'tab';
  a.role = 'tab';
  a.textContent = c.label;
  a.dataset.cat = c.id;
  a.href = c.id === 'all' ? '#/' : `#/shop/${c.id}`;
  tabsEl.append(a);
});

function setActiveTab(cat) {
  $$('.tab', tabsEl).forEach(t => t.setAttribute('aria-selected', String(t.dataset.cat === cat)));
  const active = tabsEl.querySelector('[aria-selected="true"]');
  pill.style.opacity = active ? '1' : '0';
  if (!active) return;
  pill.style.width = active.offsetWidth + 'px';
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
}

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
          <img src="${p.img}" alt="">
          <span style="min-width:0"><b>${mark(p.short, q)}</b><span>${esc(p.tags[0])}</span></span>
          <span class="px">${tnd(p.price)}</span>
        </button>`).join('')
    : `<p class="empty">Nothing matches “${esc(input.value.trim())}”.</p>`)
    + (hits.length ? `<a class="result-all" href="#/shop?q=${encodeURIComponent(input.value.trim())}">See all ${hits.length} result${hits.length === 1 ? '' : 's'}</a>` : '');
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
      ${thumb(p)}
      <span class="txt"><b>${esc(p.short)}</b><span class="px">${tnd(p.price)}</span></span>
      <span class="qty">
        <button data-dec="${id}" aria-label="One fewer">−</button>
        <span>${state.cart[id]}</span>
        <button data-inc="${id}" aria-label="One more">+</button>
      </span>
    </div>`;
  }).join('') : `<div class="empty-cart">${ICON.cartBig}<p>Your basket is empty.</p><a class="btn btn-ghost" href="#/shop">Browse the store</a></div>`;
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
  if (inc) setQty(inc.dataset.inc, state.cart[inc.dataset.inc] + 1);
  if (dec) setQty(dec.dataset.dec, state.cart[dec.dataset.dec] - 1);
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
    addToCart(add.dataset.add, 1, host?.querySelector('img'));
  } else if (buy) {
    e.preventDefault();
    addToCart(buy.dataset.buy, 1, buy.closest('.slide')?.querySelector('img.fg, img'));
    go('#/checkout');
  } else if (wish) {
    e.preventDefault(); e.stopPropagation();
    toggleWish(wish.dataset.wish);
  } else if (open) {
    closePops();
    go(`#/product/${open.dataset.view}`);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('[data-view][tabindex]')) go(`#/product/${e.target.dataset.view}`);
  if (e.key === '/' && !e.target.closest('input, textarea, select')) { e.preventDefault(); input.focus(); }
  if (e.key === 'Escape') { closeCart(); closePops(); }
});

/* ══════════════════════════════════════════════════════════════════════
   Router
   ══════════════════════════════════════════════════════════════════════ */
const ROUTES = [
  [/^$/,                          'home'],
  [/^shop(?:\/([\w-]+))?$/,       'shop'],
  [/^product\/([\w-]+)$/,         'product'],
  [/^wishlist$/,                  'wishlist'],
  [/^checkout$/,                  'checkout'],
  [/^orders$/,                    'orders'],
  [/^order\/([\w-]+)$/,           'order'],
  [/^profile$/,                   'profile'],
  [/^settings(?:\/([\w-]+))?$/,   'settings'],
  [/^support$/,                   'support'],
  [/^notifications$/,             'notifications']
];

let current = null;

function route({ keepScroll = false } = {}) {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [path, qs] = raw.split('?');
  const query = new URLSearchParams(qs || '');
  let name = 'notFound', params = [];
  for (const [re, n] of ROUTES) {
    const m = path.replace(/\/$/, '').match(re);
    if (m) { name = n; params = m.slice(1).filter(Boolean); break; }
  }
  const scroll = keepScroll ? view.scrollTop : 0;
  current?.cleanup?.();
  const v = VIEWS[name];
  const ctx = { params, query };
  view.dataset.page = name;
  view.innerHTML = v.render(ctx);
  const cleanup = v.mount?.(view, ctx);
  current = { name, cleanup: typeof cleanup === 'function' ? cleanup : null, rerenderOn: v.rerenderOn || [] };
  view.scrollTop = scroll;
  if (!keepScroll) view.focus({ preventScroll: true });
  document.title = `${v.title(ctx)} · TechGarage`;

  const cat = name === 'home' ? 'all' : name === 'shop' ? (params[0] || null) : null;
  requestAnimationFrame(() => setActiveTab(cat));
  setRail(name);
  closeResults();
}

['cart', 'wish', 'orders', 'profile', 'notes'].forEach(ev =>
  on(ev, () => { if (current?.rerenderOn.includes(ev)) route({ keepScroll: true }); }));

addEventListener('hashchange', () => route());
addEventListener('resize', () => setActiveTab(tabsEl.querySelector('[aria-selected="true"]')?.dataset.cat ?? null));
document.fonts?.ready.then(() => setActiveTab(tabsEl.querySelector('[aria-selected="true"]')?.dataset.cat ?? null));

syncBadges();
route();
