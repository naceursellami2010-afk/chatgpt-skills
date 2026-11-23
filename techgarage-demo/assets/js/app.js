/* TechGarage demo — behaviour.
   Vanilla ES modules, no dependencies. */

import { PRODUCTS, CATEGORIES, HERO, NEW_DROPS, RECENT, ACCOUNT, NOTIFICATIONS } from './data.js';

/* ── helpers ──────────────────────────────────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The store prints prices as TND3,599.000 — keep its format. */
const tnd = n => 'TND' + n.toLocaleString('en-US') + '.000';

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Product artwork: cutouts float, artwork fills. */
const shot = (p, cls = 'shot') =>
  `<div class="${cls}${p.kind === 'cut' ? ' cut' : ''}"><img src="${p.img}" alt="" loading="lazy" decoding="async"></div>`;

/* The hero is ~3:1 but the artwork is square, so cover-cropping it throws
   away the poster. Instead: blur a copy to build a stage, then sit the
   sharp artwork on top of it, anchored right. */
const heroArt = p => p.kind === 'cut'
  ? `<div class="slide-art cut"><img src="${p.img}" alt=""></div>`
  : `<div class="slide-art"><img class="bg" src="${p.img}" alt="" aria-hidden="true">
       <img class="fg" src="${p.img}" alt=""></div>`;

const thumb = (p, cls = 'thumb') =>
  `<div class="${cls}${p.kind === 'cut' ? ' cut' : ''}"><img src="${p.img}" alt="" loading="lazy"></div>`;

const ICON = {
  cart: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.3a1.8 1.8 0 0 0 1.8-1.4L21 8H6.2"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  bolt: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg>',
  check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  dots: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  heart: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.3 5.6a5 5 0 0 0-7.1 0L12 6.8l-1.2-1.2a5 5 0 1 0-7.1 7.1l8.3 8.3 8.3-8.3a5 5 0 0 0 0-7.1z"/></svg>'
};

/* ── persisted state ──────────────────────────────────────────────────── */
const load = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
};
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

let cart  = load('tg.cart', {});          // id -> qty
let wish  = new Set(load('tg.wish', []));
let tab   = 'all';
let sort  = 'new';

/* ══════════════════════════════════════════════════════════════════════
   Account, notifications
   ══════════════════════════════════════════════════════════════════════ */
$('#accountAvatar').src = ACCOUNT.avatar;
$('#accountAvatar').alt = ACCOUNT.name;
$('#accountName').textContent = ACCOUNT.name;
$('#accountHandle').textContent = ACCOUNT.handle;

$('#bellPop').innerHTML = `<h4>Notifications</h4>` + NOTIFICATIONS.map(n => `
  <button class="pop-row">
    <img src="assets/avatars/${n.who}.png" alt="">
    <span style="flex:1">
      <b>${esc(n.title)}</b>
      <p>${esc(n.body)}</p>
    </span>
    <time>${n.when}</time>
  </button>`).join('');

$('#accountPop').innerHTML = `
  <button class="pop-row"><span style="flex:1"><b>My orders</b><p>3 delivered this month</p></span></button>
  <button class="pop-row"><span style="flex:1"><b>Wishlist</b><p id="wishLine">Nothing saved yet</p></span></button>
  <button class="pop-row"><span style="flex:1"><b>Account settings</b><p>${esc(ACCOUNT.handle)}</p></span></button>
  <hr>
  <button class="pop-row"><span style="flex:1"><b>Sign out</b></span></button>`;

/* ── popovers ─────────────────────────────────────────────────────────── */
function wirePop(btn, pop) {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = pop.classList.contains('open');
    closePops();
    if (!open) { pop.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  });
}
function closePops() {
  $$('.pop.open').forEach(p => p.classList.remove('open'));
  $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
document.addEventListener('click', closePops);

wirePop($('#bell'), $('#bellPop'));
wirePop($('#accountBtn'), $('#accountPop'));
wirePop($('#sortBtn'), $('#sortPop'));
$$('.pop').forEach(p => p.addEventListener('click', e => e.stopPropagation()));
$('#bell').addEventListener('click', () => $('#bellDot').style.display = 'none');

/* ══════════════════════════════════════════════════════════════════════
   Tabs
   ══════════════════════════════════════════════════════════════════════ */
const tabsEl = $('#tabs'), pill = $('#tabPill');

CATEGORIES.forEach(c => {
  const b = document.createElement('button');
  b.className = 'tab';
  b.role = 'tab';
  b.textContent = c.label;
  b.dataset.cat = c.id;
  b.setAttribute('aria-selected', String(c.id === tab));
  b.addEventListener('click', () => setTab(c.id));
  tabsEl.append(b);
});

function movePill() {
  const active = tabsEl.querySelector('[aria-selected="true"]');
  if (!active) return;
  pill.style.width = active.offsetWidth + 'px';
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
}

function setTab(id) {
  tab = id;
  $$('.tab', tabsEl).forEach(t => t.setAttribute('aria-selected', String(t.dataset.cat === id)));
  movePill();
  const label = CATEGORIES.find(c => c.id === id).label;
  $('#shelfTitle').textContent = id === 'all' ? 'You might like' : label;
  renderShelf();
}

/* ══════════════════════════════════════════════════════════════════════
   Hero carousel
   ══════════════════════════════════════════════════════════════════════ */
const hero = $('#hero'), ticksEl = $('#ticks');
const slides = HERO.map(id => byId[id]).filter(Boolean);
const DWELL = 7000;
let cur = 0, timer = null;

slides.forEach((p, i) => {
  const el = document.createElement('article');
  el.className = 'slide' + (i === 0 ? ' on' : '');
  el.innerHTML = `
    ${heroArt(p)}
    <div class="slide-body">
      <div class="chips">${p.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      <h1>${esc(p.short)}</h1>
      <p>${esc(p.blurb)}</p>
      <div class="price-line">
        <span class="now">${tnd(p.price)}</span>
        <span class="note">${p.cat === 'keys' || p.cat === 'cards' ? 'Instant delivery' : 'In stock in Mahdia'}</span>
      </div>
      <div class="slide-cta">
        <button class="btn btn-solid" data-buy="${p.id}">${ICON.bolt} Buy now</button>
        <button class="btn btn-ghost" data-add="${p.id}">${ICON.cart} <span>Add to basket</span></button>
        <button class="btn btn-icon" data-view="${p.id}" aria-label="More about ${esc(p.name)}">${ICON.dots}</button>
      </div>
    </div>`;
  hero.append(el);

  const t = document.createElement('button');
  t.className = 'tick' + (i === 0 ? ' on' : '');
  t.innerHTML = '<i></i>';
  t.setAttribute('aria-label', `Slide ${i + 1}`);
  t.addEventListener('click', () => go(i));
  ticksEl.append(t);
});

const slideEls = $$('.slide', hero);
document.documentElement.style.setProperty('--dwell', DWELL + 'ms');

function go(i) {
  cur = (i + slides.length) % slides.length;
  slideEls.forEach((s, n) => s.classList.toggle('on', n === cur));
  $$('.tick', ticksEl).forEach((t, n) => {
    t.classList.remove('on', 'done');
    if (n < cur) t.classList.add('done');
    if (n === cur) { void t.offsetWidth; t.classList.add('on'); }
  });
  restart();
}
const next = () => go(cur + 1);
const prev = () => go(cur - 1);

function restart() {
  clearInterval(timer);
  if (!calm) timer = setInterval(next, DWELL);
}
restart();

$('#next').addEventListener('click', next);
$('#prev').addEventListener('click', prev);
hero.addEventListener('mouseenter', () => clearInterval(timer));
hero.addEventListener('mouseleave', restart);

/* parallax — the art drifts a little against the pointer */
if (!calm) {
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    const art = slideEls[cur]?.querySelector('.slide-art');
    if (art) art.style.transform = `scale(1.05) translate3d(${x * -14}px, ${y * -10}px, 0)`;
  });
  hero.addEventListener('pointerleave', () => {
    const art = slideEls[cur]?.querySelector('.slide-art');
    if (art) art.style.transform = '';
  });
}

/* swipe */
let swipeX = null;
hero.addEventListener('pointerdown', e => swipeX = e.clientX);
hero.addEventListener('pointerup', e => {
  if (swipeX === null) return;
  const d = e.clientX - swipeX;
  if (Math.abs(d) > 56) (d < 0 ? next : prev)();
  swipeX = null;
});

/* ══════════════════════════════════════════════════════════════════════
   New Drops
   ══════════════════════════════════════════════════════════════════════ */
const SORTS = [
  { id: 'new',  label: 'Newest'      },
  { id: 'low',  label: 'Price ↑'     },
  { id: 'high', label: 'Price ↓'     },
  { id: 'az',   label: 'A – Z'       }
];

$('#sortPop').innerHTML = SORTS.map(s =>
  `<button class="sort-opt" role="menuitemradio" data-sort="${s.id}" aria-checked="${s.id === sort}">${s.label}</button>`
).join('');

$('#sortPop').addEventListener('click', e => {
  const b = e.target.closest('[data-sort]');
  if (!b) return;
  sort = b.dataset.sort;
  $('#sortLabel').textContent = SORTS.find(s => s.id === sort).label;
  $$('[data-sort]').forEach(o => o.setAttribute('aria-checked', String(o.dataset.sort === sort)));
  closePops();
  renderDrops();
});

function sorted(list) {
  const c = [...list];
  if (sort === 'low')  c.sort((a, b) => a.price - b.price);
  if (sort === 'high') c.sort((a, b) => b.price - a.price);
  if (sort === 'az')   c.sort((a, b) => a.short.localeCompare(b.short));
  return c;
}

function renderDrops() {
  const list = sorted(NEW_DROPS.map(id => byId[id]).filter(Boolean));
  $('#drops').innerHTML = list.map(p => `
    <article class="drop" data-view="${p.id}">
      ${shot(p)}
      <div class="drop-meta">
        <div style="flex:1;min-width:0">
          <h3>${esc(p.short)}</h3>
          <span class="px">${tnd(p.price)}</span>
        </div>
        <button class="round" data-add="${p.id}" aria-label="Add ${esc(p.short)} to basket">${ICON.plus}</button>
      </div>
    </article>`).join('');
}

/* ══════════════════════════════════════════════════════════════════════
   Recently viewed
   ══════════════════════════════════════════════════════════════════════ */
$('#recent').innerHTML = RECENT.map(r => {
  const p = byId[r.id];
  if (!p) return '';
  return `<button class="recent-row" data-view="${p.id}">
    ${thumb(p)}
    <span class="txt"><b>${esc(p.short)}</b><span>${esc(r.note)}</span></span>
    <span class="round" data-add="${p.id}">${ICON.plus}</span>
  </button>`;
}).join('');

/* ══════════════════════════════════════════════════════════════════════
   Shelf
   ══════════════════════════════════════════════════════════════════════ */
function shelfItems() {
  const pool = tab === 'all'
    ? PRODUCTS.filter(p => !HERO.includes(p.id))
    : PRODUCTS.filter(p => p.cat === tab);
  return pool.slice(0, 4);
}

function renderShelf() {
  const items = shelfItems();
  $('#shelf').innerHTML = items.map((p, i) => `
    <article class="tile" data-view="${p.id}" style="--d:${i * 55}ms">
      ${shot(p)}
      <span class="tile-tag">${esc(p.badge || p.tags[0])}</span>
      <div class="tile-body">
        <div class="txt">
          <h3>${esc(p.short)}</h3>
          <p>${esc(p.blurb)}</p>
          <span class="px">${tnd(p.price)}</span>
        </div>
        <button class="round" data-add="${p.id}" aria-label="Add ${esc(p.short)} to basket">${ICON.plus}</button>
      </div>
    </article>`).join('');
}

$('#seeAll').addEventListener('click', () => toast(`${shelfItems().length} of ${PRODUCTS.length} products shown — this is a demo shelf`));

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

function search() {
  const q = input.value.trim().toLowerCase();
  cursor = -1;
  if (!q) { results.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); return; }

  const hits = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.tags.join(' ').toLowerCase().includes(q)
  ).slice(0, 7);

  results.innerHTML = hits.length
    ? hits.map(p => `
        <button class="result" data-view="${p.id}" role="option">
          <img src="${p.img}" alt="">
          <span style="min-width:0">
            <b>${mark(p.short, q)}</b>
            <span>${esc(p.tags[0])}</span>
          </span>
          <span class="px">${tnd(p.price)}</span>
        </button>`).join('')
    : `<p class="empty">Nothing matches “${esc(input.value.trim())}”.</p>`;

  results.classList.add('open');
  input.setAttribute('aria-expanded', 'true');
}

input.addEventListener('input', search);
input.addEventListener('focus', () => input.value && search());

function closeResults() {
  results.classList.remove('open');
  input.setAttribute('aria-expanded', 'false');
}
/* Close on an outside click. Note: do NOT stopPropagation inside the search
   wrapper — the result rows rely on the delegated [data-view] handler. */
document.addEventListener('click', e => {
  if (!e.target.closest('#searchWrap')) closeResults();
});

input.addEventListener('keydown', e => {
  const opts = $$('.result', results);
  if (e.key === 'Escape') { input.value = ''; results.classList.remove('open'); input.blur(); }
  if (!opts.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    cursor = (cursor + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
    opts.forEach((o, i) => o.classList.toggle('cursor', i === cursor));
    opts[cursor].scrollIntoView({ block: 'nearest' });
  }
  if (e.key === 'Enter' && cursor > -1) { e.preventDefault(); opts[cursor].click(); }
});

/* ══════════════════════════════════════════════════════════════════════
   Basket
   ══════════════════════════════════════════════════════════════════════ */
const drawer = $('#drawer'), scrim = $('#scrim');

function cartQty()   { return Object.values(cart).reduce((a, b) => a + b, 0); }
function cartTotal() { return Object.entries(cart).reduce((s, [id, q]) => s + (byId[id]?.price || 0) * q, 0); }

function syncBadges() {
  const n = cartQty();
  const badge = $('#cartCount');
  badge.textContent = n;
  badge.classList.toggle('on', n > 0);
  badge.classList.remove('bump');
  void badge.offsetWidth;
  if (n > 0) badge.classList.add('bump');

  const w = $('#wishCount');
  w.textContent = wish.size;
  w.classList.toggle('on', wish.size > 0);
  const line = $('#wishLine');
  if (line) line.textContent = wish.size ? `${wish.size} item${wish.size > 1 ? 's' : ''} saved` : 'Nothing saved yet';

  $('#total').textContent = tnd(cartTotal());
}

function renderCart() {
  const ids = Object.keys(cart);
  $('#lines').innerHTML = ids.length ? ids.map(id => {
    const p = byId[id];
    return `<div class="line">
      ${thumb(p)}
      <span class="txt"><b>${esc(p.short)}</b><span class="px">${tnd(p.price)}</span></span>
      <span class="qty">
        <button data-dec="${id}" aria-label="One fewer">−</button>
        <span>${cart[id]}</span>
        <button data-inc="${id}" aria-label="One more">+</button>
      </span>
    </div>`;
  }).join('') : `<p class="empty-cart">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.3a1.8 1.8 0 0 0 1.8-1.4L21 8H6.2"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/></svg>
      Your basket is empty.</p>`;
  syncBadges();
}

function openCart()  { drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
function closeCart() { drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }

$('#railCart').addEventListener('click', () => { renderCart(); openCart(); });
$('#closeCart').addEventListener('click', closeCart);
$('#checkout').addEventListener('click', () => {
  if (!cartQty()) return toast('Your basket is empty');
  toast(`Demo only — ${tnd(cartTotal())} not charged`);
});

$('#lines').addEventListener('click', e => {
  const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
  if (inc) cart[inc.dataset.inc]++;
  if (dec) { const id = dec.dataset.dec; if (--cart[id] <= 0) delete cart[id]; }
  if (inc || dec) { save('tg.cart', cart); renderCart(); }
});

function addToCart(id, from) {
  cart[id] = (cart[id] || 0) + 1;
  save('tg.cart', cart);
  syncBadges();
  if (from) fly(from, byId[id]);
  toast(`${byId[id].short} added`, true);
}

/* the little image that arcs into the basket icon */
function fly(from, p) {
  if (calm) return;
  const a = from.getBoundingClientRect();
  const b = $('#railCart').getBoundingClientRect();
  const img = document.createElement('img');
  img.src = p.img;
  img.className = 'flyer';
  Object.assign(img.style, {
    left: a.left + 'px', top: a.top + 'px',
    width: a.width + 'px', height: a.height + 'px'
  });
  document.body.append(img);
  img.animate([
    { transform: 'translate(0,0) scale(1)', opacity: .95 },
    { transform: `translate(${b.left - a.left - 6}px, ${b.top - a.top - 6}px) scale(.16)`, opacity: 0 }
  ], { duration: 620, easing: 'cubic-bezier(.5,0,.4,1)' }).onfinish = () => img.remove();
}

/* ══════════════════════════════════════════════════════════════════════
   Quick view
   ══════════════════════════════════════════════════════════════════════ */
const sheet = $('#sheet');

function openSheet(id) {
  const p = byId[id];
  if (!p) return;
  const saved = wish.has(id);
  sheet.innerHTML = `
    <div class="sheet-art${p.kind === 'cut' ? ' cut' : ''}"><img src="${p.img}" alt="${esc(p.name)}"></div>
    <div class="sheet-body">
      <button class="close" id="closeSheet" aria-label="Close">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <div class="chips">${p.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      <h2>${esc(p.name)}</h2>
      <p>${esc(p.blurb)}</p>
      <div class="specs">${(p.specs || []).map(s => `<span class="spec">${esc(s)}</span>`).join('')}</div>
      <div class="price-line"><span class="now">${tnd(p.price)}</span><span class="note">VAT included</span></div>
      <div class="sheet-cta">
        <button class="btn btn-solid" data-add="${p.id}">${ICON.cart} Add to basket</button>
        <button class="btn btn-icon" data-wish="${p.id}" aria-pressed="${saved}" aria-label="Save" style="${saved ? 'color:#38a699' : ''}">${ICON.heart}</button>
      </div>
    </div>`;
  sheet.classList.add('open');
  scrim.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  $('#closeSheet').addEventListener('click', closeSheet);
}

function closeSheet() {
  sheet.classList.remove('open');
  if (!drawer.classList.contains('open')) scrim.classList.remove('open');
  sheet.setAttribute('aria-hidden', 'true');
}

scrim.addEventListener('click', () => { closeSheet(); closeCart(); });

/* ══════════════════════════════════════════════════════════════════════
   Delegated actions
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('click', e => {
  const add  = e.target.closest('[data-add]');
  const buy  = e.target.closest('[data-buy]');
  const wsh  = e.target.closest('[data-wish]');
  const view = e.target.closest('[data-view]');

  if (add) {
    e.stopPropagation();
    const host = add.closest('.tile, .drop, .recent-row, .slide, .sheet');
    addToCart(add.dataset.add, host?.querySelector('img'));
    return;
  }
  if (buy) {
    e.stopPropagation();
    addToCart(buy.dataset.buy, buy.closest('.slide')?.querySelector('img'));
    renderCart(); openCart();
    return;
  }
  if (wsh) {
    e.stopPropagation();
    const id = wsh.dataset.wish;
    wish.has(id) ? wish.delete(id) : wish.add(id);
    save('tg.wish', [...wish]);
    wsh.setAttribute('aria-pressed', String(wish.has(id)));
    wsh.style.color = wish.has(id) ? '#38a699' : '';
    syncBadges();
    toast(wish.has(id) ? 'Saved to wishlist' : 'Removed from wishlist');
    return;
  }
  if (view) { closePops(); closeResults(); openSheet(view.dataset.view); }
});

/* rail */
$$('.rail-btn').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.rail === 'cart') return;
  $$('.rail-btn').forEach(o => o.setAttribute('aria-current', String(o === b)));
  const copy = {
    home: 'Store — everything in stock',
    wishlist: wish.size ? `${wish.size} item${wish.size > 1 ? 's' : ''} on your wishlist` : 'Your wishlist is empty',
    account: `Signed in as ${ACCOUNT.handle}`,
    support: 'Support — +216 58 578 111, Mahdia'
  }[b.dataset.rail];
  if (copy) toast(copy);
}));

/* chrome reload */
$('#reload').addEventListener('click', function () {
  this.classList.add('spinning');
  setTimeout(() => this.classList.remove('spinning'), 640);
});

/* ══════════════════════════════════════════════════════════════════════
   Toasts
   ══════════════════════════════════════════════════════════════════════ */
function toast(msg, ok = false) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = (ok ? `<span class="ok">${ICON.check}</span>` : '') + esc(msg);
  $('#toasts').append(t);
  setTimeout(() => {
    t.classList.add('out');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }, 2600);
}

/* ══════════════════════════════════════════════════════════════════════
   Keyboard
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
  if (e.key === 'Escape') { closeSheet(); closeCart(); closePops(); }
  if (document.activeElement === input) return;
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft')  prev();
});

/* ══════════════════════════════════════════════════════════════════════
   Boot
   ══════════════════════════════════════════════════════════════════════ */
renderDrops();
renderShelf();
renderCart();
requestAnimationFrame(movePill);
addEventListener('resize', movePill);
document.fonts?.ready.then(movePill);
