/* TechGarage demo — pages.
   Each view is { title(ctx), render(ctx) → html, mount(el, ctx) → cleanup? }.
   Shared actions (add to basket, wishlist, open product) are delegated by
   the shell, so most markup only needs data-* attributes. */

import {
  PRODUCTS, CATEGORIES, HERO, NEW_DROPS, RECENT, NOTIFICATIONS, FAQ, STORE,
  PAYMENT_METHODS, ACCENTS, AVATARS
} from './data.js';
import {
  $, $$, byId, tnd, esc, catLabel, avatarSrc, payLabel, fmtDate, go, ICON, state, on, off,
  cartQty, cartTotal, setQty, addToCart, markViewed, clearViewed, unreadCount, markRead,
  saveProfile, savePrefs, calm, allOrders, getOrder, orderTotal, orderCount, placeOrder,
  deliveryType, credential, searchProducts, art, thumb, heartBtn, tile, toast, exportData,
  resetEverything
} from './core.js';

/* ── shared page pieces ────────────────────────────────────────────── */
const crumbs = list => `<nav class="crumbs" aria-label="Breadcrumb">${list.map(([label, href], i) =>
  href && i < list.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`
).join('<i aria-hidden="true">/</i>')}</nav>`;

const pageHead = (title, sub = '', trail = null, aside = '') => `
  <header class="page-head">
    <div>
      ${trail ? crumbs(trail) : ''}
      <h1>${esc(title)}</h1>
      ${sub ? `<p>${sub}</p>` : ''}
    </div>
    ${aside}
  </header>`;

const emptyState = (icon, title, text, cta = '') => `
  <div class="empty-state">${icon}<h2>${esc(title)}</h2><p>${text}</p>${cta}</div>`;

const statusPill = s => `<span class="pill pill-${s}">${s === 'delivered' ? 'Delivered' : 'Processing'}</span>`;

const mask = s => s.replace(/[A-Za-z0-9](?=.{4})/g, '•');

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

/** A delivered credential: masked until revealed, copyable. */
function credBlock(order, id) {
  const c = credential(order, id);
  if (c.note) return `<div class="cred"><span class="cred-label">${c.label}</span><span class="cred-note">${esc(c.note)}</span></div>`;
  return `
    <div class="cred" data-secret="${esc(c.secret)}">
      <span class="cred-label">${c.label}</span>
      ${c.login ? `<span class="cred-login">${esc(c.login)}</span>` : ''}
      <code class="cred-code">${esc(mask(c.secret))}</code>
      <span class="cred-actions">
        <button class="mini" type="button" data-reveal aria-pressed="false">${ICON.eye}<span>Reveal</span></button>
        <button class="mini" type="button" data-copy>${ICON.copy}<span>Copy</span></button>
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
      rev.innerHTML = shown ? `${ICON.eye}<span>Reveal</span>` : `${ICON.eyeOff}<span>Hide</span>`;
    }
    if (cp) copyText(secret).then(() => toast('Copied to clipboard', true));
  };
  el.addEventListener('click', onClick);
  return () => el.removeEventListener('click', onClick);
}

/* ══════════════════════════════════════════════════════════════════════
   Home
   ══════════════════════════════════════════════════════════════════════ */
const SORTS = [
  { id: 'new',  label: 'Newest'  },
  { id: 'low',  label: 'Price ↑' },
  { id: 'high', label: 'Price ↓' },
  { id: 'az',   label: 'A – Z'   }
];
const sortList = (list, by) => {
  const c = [...list];
  if (by === 'low')  c.sort((a, b) => a.price - b.price);
  if (by === 'high') c.sort((a, b) => b.price - a.price);
  if (by === 'az')   c.sort((a, b) => a.short.localeCompare(b.short));
  return c;
};

/* The hero is roughly 3:1 but the store's artwork is square, so a blurred
   copy builds the stage and the sharp artwork sits on top, anchored right. */
const heroArt = p => p.kind === 'cut'
  ? `<div class="slide-art cut"><img src="${p.img}" alt=""></div>`
  : `<div class="slide-art"><img class="bg" src="${p.img}" alt="" aria-hidden="true"><img class="fg" src="${p.img}" alt=""></div>`;

const home = {
  title: () => 'Gaming store',
  render: () => `
    <div class="main">
      <div class="col-left">
        <section class="card" style="display:flex;flex-direction:column;min-height:0">
          <div class="card-head">
            <span class="flame">🔥</span>
            <h2>New Drops</h2>
            <div class="sort">
              <button class="sort-btn" id="sortBtn" aria-expanded="false">
                Sort by: <b id="sortLabel">Newest</b>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7l-4 4m0 0l4 4M4 11h8M16 17l4-4m0 0l-4-4m4 4h-8"/></svg>
              </button>
              <div class="pop" id="sortPop" role="menu">
                ${SORTS.map(s => `<button class="sort-opt" role="menuitemradio" data-sort="${s.id}" aria-checked="${s.id === 'new'}">${s.label}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="drops" id="drops"></div>
        </section>
        <section class="card">
          <div class="card-head"><h2>Recently Viewed</h2></div>
          <div class="recent" id="recent"></div>
        </section>
      </div>

      <div class="col-right">
        <section class="hero" id="hero" aria-roledescription="carousel" aria-label="Featured products">
          <span class="badge">🔥 Now Trending</span>
          <div class="hero-ticks" id="ticks"></div>
          <div class="hero-nav">
            <button id="prev" aria-label="Previous"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
            <button id="next" aria-label="Next"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
          </div>
        </section>

        <section>
          <div class="shelf-head">
            <h2 id="shelfTitle">You might like</h2>
            <a class="see-all" id="seeAll" href="#/shop">See all</a>
          </div>
          <div class="shelf" id="shelf">
            ${PRODUCTS.filter(p => !HERO.includes(p.id)).slice(0, 8).map(tile).join('')}
          </div>
        </section>
      </div>
    </div>`,

  mount(el) {
    const cleanups = [];

    /* ── hero carousel ── */
    const hero = $('#hero', el), ticks = $('#ticks', el);
    const slides = HERO.map(id => byId[id]).filter(Boolean);
    const DWELL = 7000;
    let cur = 0, timer = null;

    slides.forEach((p, i) => {
      const s = document.createElement('article');
      s.className = 'slide' + (i === 0 ? ' on' : '');
      s.innerHTML = `
        ${heroArt(p)}
        <div class="slide-body">
          <div class="chips">${p.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
          <h1>${esc(p.short)}</h1>
          <p>${esc(p.blurb)}</p>
          <div class="price-line">
            <span class="now">${tnd(p.price)}</span>
            <span class="note">${p.cat === 'mobile' ? 'Credited in minutes' : 'Instant delivery'}</span>
          </div>
          <div class="slide-cta">
            <button class="btn btn-solid" data-buy="${p.id}">${ICON.bolt} Buy now</button>
            <button class="btn btn-ghost" data-add="${p.id}">${ICON.cart} <span>Add to basket</span></button>
            <a class="btn btn-icon" href="#/product/${p.id}" aria-label="More about ${esc(p.short)}">${ICON.dots}</a>
          </div>
        </div>`;
      hero.append(s);
      const t = document.createElement('button');
      t.className = 'tick' + (i === 0 ? ' on' : '');
      t.innerHTML = '<i></i>';
      t.setAttribute('aria-label', `Slide ${i + 1}`);
      t.addEventListener('click', () => show(i));
      ticks.append(t);
    });
    const slideEls = $$('.slide', hero);
    document.documentElement.style.setProperty('--dwell', DWELL + 'ms');

    function show(i) {
      cur = (i + slides.length) % slides.length;
      slideEls.forEach((s, n) => s.classList.toggle('on', n === cur));
      $$('.tick', ticks).forEach((t, n) => {
        t.classList.remove('on', 'done');
        if (n < cur) t.classList.add('done');
        if (n === cur) { void t.offsetWidth; t.classList.add('on'); }
      });
      restart();
    }
    const next = () => show(cur + 1), prev = () => show(cur - 1);
    function restart() { clearInterval(timer); if (!calm()) timer = setInterval(next, DWELL); }
    restart();
    cleanups.push(() => clearInterval(timer));

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
    let sx = null;
    hero.addEventListener('pointerdown', e => sx = e.clientX);
    hero.addEventListener('pointerup', e => {
      if (sx === null) return;
      const d = e.clientX - sx;
      if (Math.abs(d) > 56) (d < 0 ? next : prev)();
      sx = null;
    });

    const onKey = e => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    cleanups.push(() => document.removeEventListener('keydown', onKey));

    /* ── new drops ── */
    let by = 'new';
    const drops = () => {
      $('#drops', el).innerHTML = sortList(NEW_DROPS.map(id => byId[id]).filter(Boolean), by).map(p => `
        <article class="drop" data-view="${p.id}">
          ${art(p)}
          <div class="drop-meta">
            <div style="flex:1;min-width:0"><h3>${esc(p.short)}</h3><span class="px">${tnd(p.price)}</span></div>
            <button class="round" data-add="${p.id}" aria-label="Add ${esc(p.short)} to basket">${ICON.plus}</button>
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
      $('#sortLabel', el).textContent = SORTS.find(s => s.id === by).label;
      $$('[data-sort]', sortPop).forEach(o => o.setAttribute('aria-checked', String(o.dataset.sort === by)));
      sortPop.classList.remove('open');
      sortBtn.setAttribute('aria-expanded', 'false');
      drops();
    });

    /* ── recently viewed: real history first, demo history otherwise ── */
    const recent = state.viewed.length
      ? state.viewed.slice(0, 4).map(id => ({ id, note: 'Viewed recently' }))
      : RECENT;
    $('#recent', el).innerHTML = recent.map(r => {
      const p = byId[r.id];
      return p ? `<div class="recent-row" data-view="${p.id}" role="link" tabindex="0">
        ${thumb(p)}
        <span class="txt"><b>${esc(p.short)}</b><span>${esc(r.note)}</span></span>
        <button class="round" data-add="${p.id}" aria-label="Add ${esc(p.short)} to basket">${ICON.plus}</button>
      </div>` : '';
    }).join('');

    return () => cleanups.forEach(f => f());
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Shop — all products, a category, or search results
   ══════════════════════════════════════════════════════════════════════ */
const PRICE_BANDS = [
  ['any', 'Any price'], ['0-50', 'Under 50 DT'], ['50-100', '50 – 100 DT'],
  ['100-200', '100 – 200 DT'], ['200-', '200 DT and up']
];
const SHOP_SORTS = [['featured', 'Featured'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['az', 'Name: A – Z']];

const shopHash = ({ cat = '', q = '', price = 'any', sort = 'featured' }) => {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (price !== 'any') p.set('price', price);
  if (sort !== 'featured') p.set('sort', sort);
  const s = p.toString();
  return `#/shop${cat ? '/' + cat : ''}${s ? '?' + s : ''}`;
};

function shopState(ctx) {
  const cat = CATEGORIES.some(c => c.id === ctx.params[0] && c.id !== 'all') ? ctx.params[0] : '';
  const q = (ctx.query.get('q') || '').trim();
  const price = PRICE_BANDS.some(([id]) => id === ctx.query.get('price')) ? ctx.query.get('price') : 'any';
  const sort = SHOP_SORTS.some(([id]) => id === ctx.query.get('sort')) ? ctx.query.get('sort') : 'featured';
  let list = q ? searchProducts(q) : [...PRODUCTS];
  if (cat) list = list.filter(p => p.cat === cat);
  if (price !== 'any') {
    const [lo, hi] = price.split('-').map(v => v === '' ? Infinity : +v);
    list = list.filter(p => p.price >= lo && p.price < hi);
  }
  if (sort !== 'featured') list = sortList(list, sort);
  return { cat, q, price, sort, list };
}

const shop = {
  title: ctx => { const s = shopState(ctx); return s.q ? `Search: ${s.q}` : catLabel(s.cat); },
  render(ctx) {
    const s = shopState(ctx);
    const title = s.q ? `Results for “${s.q}”` : (s.cat ? catLabel(s.cat) : 'All products');
    const count = `${s.list.length} product${s.list.length === 1 ? '' : 's'}`;
    const trail = [['Home', '#/'], ['Shop', '#/shop'], ...(s.cat ? [[catLabel(s.cat), '']] : []), ...(s.q ? [[`“${s.q}”`, '']] : [])];
    const cats = CATEGORIES.filter(c => c.id !== 'all');
    return `
      <div class="page">
        ${pageHead(title, count, trail, `
          <label class="select-wrap">
            <span class="sr">Sort</span>
            <select id="shopSort" class="select">
              ${SHOP_SORTS.map(([id, l]) => `<option value="${id}" ${id === s.sort ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </label>`)}
        <div class="shop">
          <aside class="filters card" aria-label="Filters">
            <h3>Category</h3>
            <nav class="filter-list">
              <a href="${shopHash({ ...s, cat: '' })}" ${!s.cat ? 'aria-current="true"' : ''}>All products <em>${PRODUCTS.length}</em></a>
              ${cats.map(c => `<a href="${shopHash({ ...s, cat: c.id })}" ${s.cat === c.id ? 'aria-current="true"' : ''}>${c.label} <em>${PRODUCTS.filter(p => p.cat === c.id).length}</em></a>`).join('')}
            </nav>
            <h3>Price</h3>
            <div class="chip-row">
              ${PRICE_BANDS.map(([id, l]) => `<a class="fchip" href="${shopHash({ ...s, price: id })}" ${s.price === id ? 'aria-current="true"' : ''}>${l}</a>`).join('')}
            </div>
            ${s.q || s.price !== 'any' || s.sort !== 'featured' ? `<a class="clear-filters" href="${shopHash({ cat: s.cat })}">Clear filters</a>` : ''}
          </aside>
          <section class="shop-results">
            ${s.list.length
              ? `<div class="grid-tiles">${s.list.map(tile).join('')}</div>`
              : emptyState(ICON.search, 'Nothing matches', s.q ? `No products match “${esc(s.q)}” with these filters.` : 'No products in this price range.',
                  `<a class="btn btn-solid" href="${shopHash({ cat: s.cat })}">Clear filters</a>`)}
          </section>
        </div>
      </div>`;
  },
  mount(el, ctx) {
    const s = shopState(ctx);
    $('#shopSort', el).addEventListener('change', e => go(shopHash({ ...s, sort: e.target.value })));
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Product
   ══════════════════════════════════════════════════════════════════════ */
function howItWorks(p) {
  const platform = p.tags[0].replace(/ Key$/, '');
  switch (deliveryType(p)) {
    case 'account': return [
      ['Pay securely', 'Check out in a minute — no account needed.'],
      ['Get the login by email', 'Usually within minutes of payment.'],
      ['Make it yours', 'Sign in and change the password. Keep the linked email for at least a month.']];
    case 'topup': return [
      ['Enter your player ID', 'Asked for at checkout — double-check it.'],
      ['Pay securely', 'Check out in a minute.'],
      ['Coins arrive in-game', 'Credited to your account within minutes.']];
    case 'code': return [
      ['Pay securely', 'Check out in a minute.'],
      ['Get the code by email', 'Usually within minutes of payment.'],
      [`Redeem on ${p.tags[1]}`, 'The balance lands in your wallet straight away.']];
    default: return [
      ['Pay securely', 'Check out in a minute.'],
      ['Get your key by email', 'Usually within minutes of payment.'],
      [`Activate on ${platform}`, 'Redeem the key and start the download.']];
  }
}

const DELIVERY_COPY = {
  account: 'Fresh account, delivered by email',
  key: 'Activation key, delivered by email',
  code: 'Gift card code, delivered by email',
  topup: 'Credited to your player ID'
};

const product = {
  title: ctx => byId[ctx.params[0]]?.short || 'Product not found',
  render(ctx) {
    const p = byId[ctx.params[0]];
    if (!p) return notFound.render();
    const related = [...PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id), ...PRODUCTS.filter(x => x.cat !== p.cat)].slice(0, 4);
    const steps = howItWorks(p);
    return `
      <div class="page">
        ${crumbs([['Home', '#/'], [catLabel(p.cat), `#/shop/${p.cat}`], [p.short, '']])}
        <div class="pdp">
          <div class="pdp-art${p.kind === 'cut' ? ' cut' : ''}"><img src="${p.img}" alt="${esc(p.short)}"></div>
          <div class="pdp-info">
            <div class="chips">${p.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}${p.badge ? `<span class="chip chip-accent">${esc(p.badge)}</span>` : ''}</div>
            <h1>${esc(p.short)}</h1>
            <p class="listing">${esc(p.name)}</p>
            <p class="pdp-blurb">${esc(p.blurb)}</p>
            <div class="price-line"><span class="now">${tnd(p.price)}</span><span class="note">Tax incl.</span></div>
            <ul class="facts">
              <li>${ICON.bolt}<span>${DELIVERY_COPY[deliveryType(p)]}</span></li>
              <li>${ICON.shield}<span>${esc(p.specs.join(' · '))}</span></li>
            </ul>
            <div class="pdp-buy">
              <div class="stepper" role="group" aria-label="Quantity">
                <button type="button" id="qtyDown" aria-label="One fewer">${ICON.minus}</button>
                <output id="qty" aria-live="polite">1</output>
                <button type="button" id="qtyUp" aria-label="One more">${ICON.plus}</button>
              </div>
              <button class="btn btn-solid" id="pdpBuy">${ICON.bolt} Buy now</button>
              <button class="btn btn-ghost" id="pdpAdd">${ICON.cart} Add to basket</button>
              ${heartBtn(p, 'btn btn-icon pdp-heart')}
            </div>
            ${p.url ? `<a class="source" href="${p.url}" target="_blank" rel="noopener">View on techgarage.tn ${ICON.out}</a>` : ''}
          </div>
        </div>

        <section class="block">
          <h2>How it works</h2>
          <ol class="steps">${steps.map(([t, d], i) => `<li><span class="step-n">${i + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join('')}</ol>
        </section>

        <section class="block">
          <h2>Details</h2>
          <dl class="spec-table">
            <div><dt>Product</dt><dd>${esc(p.name)}</dd></div>
            <div><dt>Category</dt><dd>${esc(catLabel(p.cat))}</dd></div>
            <div><dt>Platform</dt><dd>${esc(p.tags[0])}</dd></div>
            <div><dt>Type</dt><dd>${esc(p.tags[1] || '—')}</dd></div>
            <div><dt>Includes</dt><dd>${esc(p.specs.join(' · '))}</dd></div>
            <div><dt>Delivery</dt><dd>${DELIVERY_COPY[deliveryType(p)]}</dd></div>
            <div><dt>Price</dt><dd>${tnd(p.price)} · tax included</dd></div>
          </dl>
        </section>

        <section class="block">
          <div class="block-head"><h2>You may also like</h2><a class="see-all" href="#/shop/${p.cat}">More in ${esc(catLabel(p.cat))}</a></div>
          <div class="grid-tiles">${related.map(tile).join('')}</div>
        </section>
      </div>`;
  },
  mount(el, ctx) {
    const p = byId[ctx.params[0]];
    if (!p) return;
    markViewed(p.id);
    let qty = 1;
    const out = $('#qty', el);
    const set = n => { qty = Math.max(1, Math.min(10, n)); out.textContent = qty; };
    $('#qtyDown', el).addEventListener('click', () => set(qty - 1));
    $('#qtyUp', el).addEventListener('click', () => set(qty + 1));
    $('#pdpAdd', el).addEventListener('click', () => addToCart(p.id, qty, $('.pdp-art img', el)));
    $('#pdpBuy', el).addEventListener('click', () => { addToCart(p.id, qty); go('#/checkout'); });
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Wishlist
   ══════════════════════════════════════════════════════════════════════ */
const wishlist = {
  title: () => 'Wishlist',
  rerenderOn: ['wish'],
  render() {
    const items = [...state.wish].map(id => byId[id]).filter(Boolean);
    return `
      <div class="page">
        ${pageHead('Wishlist', items.length ? `${items.length} saved item${items.length === 1 ? '' : 's'} · ${tnd(items.reduce((s, p) => s + p.price, 0))} in total` : '',
          [['Home', '#/'], ['Wishlist', '']],
          items.length ? `<button class="btn btn-solid" id="addAll">${ICON.cart} Add all to basket</button>` : '')}
        ${items.length
          ? `<div class="grid-tiles">${items.map(tile).join('')}</div>`
          : emptyState(ICON.heartBig, 'Nothing saved yet', 'Tap the heart on any product to keep it here for later.',
              '<a class="btn btn-solid" href="#/shop">Browse the store</a>')}
      </div>`;
  },
  mount(el) {
    $('#addAll', el)?.addEventListener('click', () => {
      [...state.wish].forEach(id => setQty(id, (state.cart[id] || 0) + 1));
      toast(`${state.wish.size} items added to basket`, true);
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Checkout
   ══════════════════════════════════════════════════════════════════════ */
const checkout = {
  title: () => 'Checkout',
  rerenderOn: ['cart'],
  render() {
    const ids = Object.keys(state.cart);
    if (!ids.length) return `<div class="page">${pageHead('Checkout', '', [['Home', '#/'], ['Checkout', '']])}
      ${emptyState(ICON.cartBig, 'Your basket is empty', 'Add something first — the checkout will be waiting.', '<a class="btn btn-solid" href="#/shop">Browse the store</a>')}</div>`;
    const needsId = ids.some(id => byId[id].cat === 'mobile');
    const pr = state.profile;
    const field = (id, label, value = '', type = 'text', extra = '') => `
      <div class="field">
        <label for="${id}">${label}</label>
        <input id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${extra}>
        <span class="msg" aria-live="polite"></span>
      </div>`;
    return `
      <div class="page">
        ${pageHead('Checkout', `${cartQty()} item${cartQty() === 1 ? '' : 's'} · digital delivery`, [['Home', '#/'], ['Checkout', '']])}
        <p class="demo-note">${ICON.shield}<span>Demo checkout — no payment is taken and nothing is charged.</span></p>
        <div class="checkout">
          <form class="card form" id="checkoutForm" novalidate>
            <h2><span class="step-n">1</span> Contact</h2>
            <p class="hint">Your codes and logins are sent to this email.</p>
            <div class="field-row">
              ${field('name', 'Full name', pr.name, 'text', 'autocomplete="name"')}
              ${field('email', 'Email', pr.email, 'email', 'autocomplete="email"')}
            </div>
            ${field('phone', 'Phone', pr.phone, 'tel', 'autocomplete="tel"')}
            ${needsId ? `<h2><span class="step-n">2</span> Player ID</h2>
              <p class="hint">Your basket has a mobile top-up — it's credited to this in-game ID.</p>
              ${field('playerId', 'Player ID', '', 'text', 'inputmode="numeric" placeholder="e.g. 51 873 2290"')}` : ''}
            <h2><span class="step-n">${needsId ? 3 : 2}</span> Payment</h2>
            <div class="pay-options" role="radiogroup" aria-label="Payment method">
              ${PAYMENT_METHODS.map((m, i) => `
                <label class="pay-option">
                  <input type="radio" name="payment" value="${m.id}" ${i === 0 ? 'checked' : ''}>
                  <span><b>${m.label}</b><small>${m.note}</small></span>
                </label>`).join('')}
            </div>
            <label class="check"><input type="checkbox" id="terms"><span>I accept the terms of sale and understand digital goods are delivered by email.</span></label>
            <span class="msg" id="termsMsg" aria-live="polite"></span>
            <button class="btn btn-solid btn-wide" type="submit">Place order · ${tnd(cartTotal())}</button>
          </form>

          <aside class="card summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <div class="sum-lines">
              ${ids.map(id => { const p = byId[id], q = state.cart[id]; return `
                <div class="sum-line">
                  ${thumb(p)}
                  <div class="txt"><b>${esc(p.short)}</b><span>${tnd(p.price)} each</span></div>
                  <div class="stepper small" role="group" aria-label="Quantity of ${esc(p.short)}">
                    <button type="button" data-dec="${id}" aria-label="One fewer">${ICON.minus}</button>
                    <output>${q}</output>
                    <button type="button" data-inc="${id}" aria-label="One more">${ICON.plus}</button>
                  </div>
                  <span class="line-total">${tnd(p.price * q)}</span>
                </div>`; }).join('')}
            </div>
            <div class="sum-row"><span>Subtotal</span><span>${tnd(cartTotal())}</span></div>
            <div class="sum-row"><span>Delivery</span><span>Free · by email</span></div>
            <div class="sum-row total-row"><span>Total</span><b>${tnd(cartTotal())}</b></div>
          </aside>
        </div>
      </div>`;
  },
  mount(el) {
    const form = $('#checkoutForm', el);
    if (!form) return;
    el.addEventListener('click', e => {
      const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
      if (inc) setQty(inc.dataset.inc, state.cart[inc.dataset.inc] + 1);
      if (dec) setQty(dec.dataset.dec, state.cart[dec.dataset.dec] - 1);
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const rules = {
        name: v => v.trim().length >= 2 || 'Enter your full name.',
        email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.',
        phone: v => v.replace(/\D/g, '').length >= 8 || 'Enter a phone number with at least 8 digits.',
        playerId: v => /^\d[\d\s]{5,15}$/.test(v.trim()) || 'Enter the numeric player ID from your game profile.'
      };
      let first = null;
      for (const [name, check] of Object.entries(rules)) {
        const input = form.elements[name];
        if (!input) continue;
        const res = check(input.value);
        const box = input.closest('.field');
        box.classList.toggle('err', res !== true);
        box.querySelector('.msg').textContent = res === true ? '' : res;
        if (res !== true && !first) first = input;
      }
      const terms = $('#terms', form);
      $('#termsMsg', form).textContent = terms.checked ? '' : 'Please accept the terms to continue.';
      if (!terms.checked && !first) first = terms;
      if (first) { first.focus(); return; }
      const order = placeOrder({
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        payment: form.elements.payment.value,
        playerId: form.elements.playerId?.value.trim()
      });
      go(`#/order/${order.id}?new=1`);
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Order detail & confirmation
   ══════════════════════════════════════════════════════════════════════ */
const order = {
  title: ctx => `Order ${ctx.params[0]}`,
  rerenderOn: ['orders'],
  render(ctx) {
    const o = getOrder(ctx.params[0]);
    if (!o) return notFound.render();
    const fresh = ctx.query.get('new') === '1';
    const done = o.status === 'delivered';
    const email = o.contact?.email || state.profile.email;
    return `
      <div class="page">
        ${fresh ? `<div class="success card">
          <span class="success-icon">${ICON.check}</span>
          <div><h2>Thank you${o.contact?.name ? ', ' + esc(o.contact.name.split(' ')[0]) : ''}!</h2>
          <p>Order ${o.id} is confirmed. ${done ? 'Everything has been delivered below and to' : 'Your codes will appear here and be emailed to'} <b>${esc(email)}</b>.</p></div>
        </div>` : ''}
        ${pageHead(`Order ${o.id}`, `${fmtDate(o.date)} · ${orderCount(o)} item${orderCount(o) === 1 ? '' : 's'} · ${tnd(orderTotal(o))}`,
          [['Home', '#/'], ['Orders', '#/orders'], [o.id, '']], statusPill(o.status))}
        <ol class="timeline" aria-label="Order progress">
          <li class="done"><span>${ICON.check}</span><b>Placed</b><small>${fmtDate(o.date)}</small></li>
          <li class="done"><span>${ICON.check}</span><b>Paid</b><small>${esc(payLabel(o.payment))}</small></li>
          <li class="${done ? 'done' : 'active'}"><span>${done ? ICON.check : '<i class="spinner"></i>'}</span><b>${done ? 'Delivered' : 'Delivering…'}</b><small>${done ? 'By email' : 'Usually within minutes'}</small></li>
        </ol>
        <div class="order-layout">
          <section class="card order-items">
            <h2>Items</h2>
            ${o.items.map(([id, q]) => { const p = byId[id]; return `
              <div class="order-item">
                <a class="oi-head" href="#/product/${id}">${thumb(p)}<span class="txt"><b>${esc(p.short)}</b><span>${q} × ${tnd(p.price)}</span></span></a>
                ${done ? Array.from({ length: q }, (_, n) => credBlock({ ...o, id: o.id + (n ? '-' + n : '') }, id)).join('')
                       : `<div class="cred pending"><i class="spinner"></i><span>Preparing your delivery…</span></div>`}
              </div>`; }).join('')}
          </section>
          <aside class="card order-sum">
            <h2>Summary</h2>
            <div class="sum-row"><span>Payment</span><span>${esc(payLabel(o.payment))}</span></div>
            <div class="sum-row"><span>Delivered to</span><span>${esc(email)}</span></div>
            ${o.playerId ? `<div class="sum-row"><span>Player ID</span><span>${esc(o.playerId)}</span></div>` : ''}
            <div class="sum-row total-row"><span>Total</span><b>${tnd(orderTotal(o))}</b></div>
            <a class="btn btn-ghost btn-wide" href="#/support">Need help with this order?</a>
          </aside>
        </div>
        <p class="fine">All codes and logins shown in this demo start with DEMO and are not real.</p>
      </div>`;
  },
  mount(el, ctx) {
    const cleanups = [wireCreds(el)];
    const o = getOrder(ctx.params[0]);
    if (o && o.status === 'processing' && o.deliverAt) {
      const t = setTimeout(() => {
        toast(`Order ${o.id} delivered`, true);
        go(`#/order/${o.id}`);
      }, Math.max(0, o.deliverAt - Date.now()) + 60);
      cleanups.push(() => clearTimeout(t));
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
    <span class="or-thumbs">${o.items.slice(0, 3).map(([id]) => thumb(byId[id])).join('')}</span>
    <span class="or-names">${esc(o.items.map(([id]) => byId[id].short).join(', '))}</span>
    <span class="or-total">${tnd(orderTotal(o))}</span>
    ${statusPill(o.status)}
    <span class="or-chev">${ICON.chev}</span>
  </a>`;

const orders = {
  title: () => 'Orders',
  rerenderOn: ['orders'],
  render() {
    const list = allOrders();
    return `
      <div class="page">
        ${pageHead('Orders', `${list.length} order${list.length === 1 ? '' : 's'} · ${tnd(list.reduce((s, o) => s + orderTotal(o), 0))} in total`, [['Home', '#/'], ['Orders', '']])}
        <div class="order-list">${list.map(orderRow).join('')}</div>
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Profile
   ══════════════════════════════════════════════════════════════════════ */
const profile = {
  title: () => 'Profile',
  rerenderOn: ['orders', 'wish', 'profile'],
  render() {
    const pr = state.profile;
    const list = allOrders();
    const delivered = list.filter(o => o.status === 'delivered');
    const vault = delivered.flatMap(o => o.items.map(([id]) => ({ o, id })));
    const codes = vault.filter(({ id }) => deliveryType(byId[id]) !== 'topup').length;
    return `
      <div class="page">
        ${crumbs([['Home', '#/'], ['Profile', '']])}
        <section class="profile-hero card">
          <img class="avatar-xl" src="${avatarSrc(pr.avatar)}" alt="">
          <div class="ph-text">
            <h1>${esc(pr.name)}</h1>
            <p>${esc(pr.handle)} · ${esc(pr.email)}</p>
            <p class="muted">Member since ${esc(pr.since)}</p>
          </div>
          <a class="btn btn-ghost" href="#/settings/profile">Edit profile</a>
        </section>

        <div class="stats">
          <a class="stat card" href="#/orders"><b>${list.length}</b><span>Orders</span></a>
          <div class="stat card"><b>${tnd(list.reduce((s, o) => s + orderTotal(o), 0))}</b><span>Total spent</span></div>
          <button class="stat card" type="button" data-scroll="vault"><b>${codes}</b><span>Keys &amp; accounts</span></button>
          <a class="stat card" href="#/wishlist"><b>${state.wish.size}</b><span>Wishlist</span></a>
        </div>

        <section class="block" id="vault">
          <div class="block-head"><h2>My keys &amp; accounts</h2><span class="muted">Everything you've been delivered, in one place</span></div>
          <div class="vault">
            ${vault.length ? vault.map(({ o, id }) => { const p = byId[id]; return `
              <div class="vault-row card">
                <a class="oi-head" href="#/product/${id}">${thumb(p)}<span class="txt"><b>${esc(p.short)}</b><span>Order ${o.id} · ${fmtDate(o.date)}</span></span></a>
                ${credBlock(o, id)}
              </div>`; }).join('')
              : emptyState(ICON.key, 'No keys yet', 'Codes and logins you buy will appear here once delivered.')}
          </div>
        </section>

        <section class="block">
          <div class="block-head"><h2>Recent orders</h2><a class="see-all" href="#/orders">All orders</a></div>
          <div class="order-list">${list.slice(0, 3).map(orderRow).join('')}</div>
        </section>
        <p class="fine">All codes and logins shown in this demo start with DEMO and are not real.</p>
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
  ['profile', 'Profile', ICON.user],
  ['security', 'Security', ICON.lock],
  ['notifications', 'Notifications', ICON.bell],
  ['appearance', 'Appearance', ICON.palette],
  ['privacy', 'Privacy & data', ICON.shield]
];

const toggle = (attr, on, label) =>
  `<label class="switch"><input type="checkbox" ${attr} ${on ? 'checked' : ''}><span aria-hidden="true"></span><span class="sr">${esc(label)}</span></label>`;

const setRow = (title, desc, control) =>
  `<div class="set-row"><div><b>${title}</b><p>${desc}</p></div>${control}</div>`;

const fieldHtml = (id, label, value, type = 'text', extra = '') => `
  <div class="field">
    <label for="${id}">${label}</label>
    <input id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${extra}>
    <span class="msg" aria-live="polite"></span>
  </div>`;

function settingsBody(section) {
  const pr = state.profile, pf = state.prefs;
  switch (section) {
    case 'security': return `
      <h2>Security</h2>
      <form id="pwForm" class="form" novalidate>
        <h3>Change password</h3>
        ${fieldHtml('current', 'Current password', '', 'password', 'autocomplete="current-password"')}
        <div class="field-row">
          ${fieldHtml('newpw', 'New password', '', 'password', 'autocomplete="new-password"')}
          ${fieldHtml('confirm', 'Confirm new password', '', 'password', 'autocomplete="new-password"')}
        </div>
        <div class="meter" aria-hidden="true"><i id="pwMeter"></i></div>
        <p class="hint" id="pwHint">At least 8 characters, with a letter and a number.</p>
        <button class="btn btn-solid" type="submit">Update password</button>
      </form>
      <h3>Sign-in protection</h3>
      ${setRow('Two-step verification', 'Ask for a one-time code when you sign in on a new device.', toggle('data-pref="twoFactor"', pf.twoFactor, 'Two-step verification'))}`;

    case 'notifications': return `
      <h2>Notifications</h2>
      <h3>Tell me about</h3>
      ${setRow('Order updates', 'Payment confirmed, codes delivered, top-ups credited.', toggle('data-notify="orders"', pf.notify.orders, 'Order updates'))}
      ${setRow('Back in stock', 'When something on your wishlist is available again.', toggle('data-notify="stock"', pf.notify.stock, 'Back in stock'))}
      ${setRow('Price drops', 'When a product on your wishlist gets cheaper.', toggle('data-notify="prices"', pf.notify.prices, 'Price drops'))}
      ${setRow('News and offers', 'New releases and occasional promotions.', toggle('data-notify="news"', pf.notify.news, 'News and offers'))}
      <h3>Send them by</h3>
      <div class="seg" role="radiogroup" aria-label="Notification channel">
        ${[['email', 'Email'], ['sms', 'SMS'], ['both', 'Email & SMS']].map(([id, l]) =>
          `<label><input type="radio" name="channel" value="${id}" ${pf.channel === id ? 'checked' : ''}><span>${l}</span></label>`).join('')}
      </div>`;

    case 'appearance': return `
      <h2>Appearance</h2>
      <h3>Accent colour</h3>
      <div class="swatches" role="radiogroup" aria-label="Accent colour">
        ${ACCENTS.map(a => `<label class="swatch" title="${a.label}"><input type="radio" name="accent" value="${a.value}" ${pf.accent === a.value ? 'checked' : ''}><span style="--c:${a.value}"></span><em>${a.label}</em></label>`).join('')}
      </div>
      <h3>Motion</h3>
      ${setRow('Animated background', 'The slow drifting light behind the store.', toggle('data-pref="animatedBg"', pf.animatedBg, 'Animated background'))}
      ${setRow('Reduce motion', 'Turn off carousel autoplay, parallax and transitions.', toggle('data-pref="reduceMotion"', pf.reduceMotion, 'Reduce motion'))}`;

    case 'privacy': return `
      <h2>Privacy &amp; data</h2>
      <p class="hint">This demo keeps everything in your browser — nothing is sent to a server.</p>
      ${setRow('Download my data', 'Your profile, preferences, basket, wishlist and orders as a JSON file.', `<button class="btn btn-ghost" id="exportBtn">${ICON.download} Download</button>`)}
      ${setRow('Clear recently viewed', `${state.viewed.length} product${state.viewed.length === 1 ? '' : 's'} in your history.`, `<button class="btn btn-ghost" id="clearViewed" ${state.viewed.length ? '' : 'disabled'}>Clear</button>`)}
      ${setRow('Reset everything', 'Empty the basket and wishlist, forget orders and restore default settings.', `<button class="btn btn-danger" id="resetBtn">Reset</button>`)}`;

    default: return `
      <h2>Profile</h2>
      <form id="profileForm" class="form" novalidate>
        <h3>Avatar</h3>
        <div class="avatar-pick" role="radiogroup" aria-label="Avatar">
          ${AVATARS.map(a => `<label><input type="radio" name="avatar" value="${a}" ${pr.avatar === a ? 'checked' : ''}><img src="${avatarSrc(a)}" alt="${a}"></label>`).join('')}
        </div>
        <h3>Details</h3>
        <div class="field-row">
          ${fieldHtml('pname', 'Display name', pr.name, 'text', 'autocomplete="name"')}
          ${fieldHtml('phandle', 'Username', pr.handle)}
        </div>
        <div class="field-row">
          ${fieldHtml('pemail', 'Email', pr.email, 'email', 'autocomplete="email"')}
          ${fieldHtml('pphone', 'Phone', pr.phone, 'tel', 'autocomplete="tel"')}
        </div>
        <button class="btn btn-solid" type="submit">Save changes</button>
      </form>`;
  }
}

const settings = {
  title: () => 'Settings',
  render(ctx) {
    const section = SECTIONS.some(([id]) => id === ctx.params[0]) ? ctx.params[0] : 'profile';
    return `
      <div class="page">
        ${pageHead('Settings', 'Manage your account and how the store looks and behaves.', [['Home', '#/'], ['Settings', '']])}
        <div class="settings">
          <nav class="settings-nav card" aria-label="Settings sections">
            ${SECTIONS.map(([id, label, icon]) => `<a href="#/settings/${id}" ${id === section ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></a>`).join('')}
          </nav>
          <section class="settings-body card" data-section="${section}">${settingsBody(section)}</section>
        </div>
      </div>`;
  },
  mount(el) {
    const body = $('.settings-body', el);

    /* toggles */
    body.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.pref) { savePrefs({ [t.dataset.pref]: t.checked }); toast('Saved', true); }
      if (t.dataset.notify) { savePrefs({ notify: { ...state.prefs.notify, [t.dataset.notify]: t.checked } }); toast('Saved', true); }
      if (t.name === 'channel') { savePrefs({ channel: t.value }); toast('Saved', true); }
      if (t.name === 'accent') { savePrefs({ accent: t.value }); toast('Accent colour updated', true); }
    });

    const err = (form, name, msg) => {
      const box = form.elements[name].closest('.field');
      box.classList.toggle('err', !!msg);
      box.querySelector('.msg').textContent = msg || '';
      return !msg;
    };

    /* profile */
    const pf = $('#profileForm', body);
    pf?.addEventListener('submit', e => {
      e.preventDefault();
      const v = n => pf.elements[n].value.trim();
      let handle = v('phandle'); if (handle && !handle.startsWith('@')) handle = '@' + handle;
      const ok = [
        err(pf, 'pname', v('pname').length >= 2 ? '' : 'Enter at least 2 characters.'),
        err(pf, 'phandle', /^@[a-z0-9_.]{3,20}$/i.test(handle) ? '' : '3–20 letters, numbers, dots or underscores.'),
        err(pf, 'pemail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('pemail')) ? '' : 'Enter a valid email address.'),
        err(pf, 'pphone', v('pphone').replace(/\D/g, '').length >= 8 ? '' : 'Enter at least 8 digits.')
      ].every(Boolean);
      if (!ok) return;
      saveProfile({ name: v('pname'), handle, email: v('pemail'), phone: v('pphone'), avatar: pf.elements.avatar.value });
      pf.elements.phandle.value = handle;
      toast('Profile saved', true);
    });

    /* password */
    const pw = $('#pwForm', body);
    if (pw) {
      const strength = s => [s.length >= 8, /[a-z]/i.test(s), /\d/.test(s), /[^a-z0-9]/i.test(s), s.length >= 12].filter(Boolean).length;
      pw.elements.newpw.addEventListener('input', () => {
        const n = strength(pw.elements.newpw.value);
        const m = $('#pwMeter', pw);
        m.style.width = (n / 5 * 100) + '%';
        m.dataset.level = n <= 2 ? 'weak' : n <= 3 ? 'ok' : 'strong';
        $('#pwHint', pw).textContent = !pw.elements.newpw.value ? 'At least 8 characters, with a letter and a number.'
          : n <= 2 ? 'Weak — add length, numbers or symbols.' : n <= 3 ? 'Good.' : 'Strong password.';
      });
      pw.addEventListener('submit', e => {
        e.preventDefault();
        const nv = pw.elements.newpw.value;
        const ok = [
          err(pw, 'current', pw.elements.current.value ? '' : 'Enter your current password.'),
          err(pw, 'newpw', nv.length >= 8 && /[a-z]/i.test(nv) && /\d/.test(nv) ? '' : 'At least 8 characters, with a letter and a number.'),
          err(pw, 'confirm', pw.elements.confirm.value === nv && nv ? '' : 'Passwords don’t match.')
        ].every(Boolean);
        if (!ok) return;
        pw.reset();
        $('#pwMeter', pw).style.width = '0';
        toast('Password updated', true);
      });
    }

    /* privacy */
    $('#exportBtn', body)?.addEventListener('click', () => { exportData(); toast('Your data is downloading', true); });
    $('#clearViewed', body)?.addEventListener('click', e => {
      clearViewed();
      e.currentTarget.disabled = true;
      e.currentTarget.closest('.set-row').querySelector('p').textContent = '0 products in your history.';
      toast('History cleared', true);
    });
    const reset = $('#resetBtn', body);
    let armed = null;
    reset?.addEventListener('click', () => {
      if (armed) return resetEverything();
      reset.textContent = 'Click again to confirm';
      reset.classList.add('armed');
      armed = setTimeout(() => { armed = null; reset.textContent = 'Reset'; reset.classList.remove('armed'); }, 4000);
    });
    return () => clearTimeout(armed);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Support
   ══════════════════════════════════════════════════════════════════════ */
const support = {
  title: () => 'Support',
  render() {
    const tel = STORE.phone.replace(/\s/g, '');
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(STORE.address);
    return `
      <div class="page">
        ${pageHead('How can we help?', 'Call, email or visit the shop in Mahdia — or find a quick answer below.', [['Home', '#/'], ['Support', '']])}
        <div class="contact-grid">
          <a class="contact card" href="tel:${tel}">${ICON.phone}<b>Call us</b><span>${esc(STORE.phone)}</span></a>
          <a class="contact card" href="mailto:${STORE.email}">${ICON.mail}<b>Email</b><span>${esc(STORE.email)}</span></a>
          <a class="contact card" href="${maps}" target="_blank" rel="noopener">${ICON.pin}<b>Visit the shop</b><span>${esc(STORE.address)}</span></a>
          <div class="contact card">${ICON.clock}<b>Opening hours</b>
            <span class="hours">${STORE.hours.map(([d, h]) => `<i>${d}</i><i>${h}</i>`).join('')}</span></div>
        </div>

        <div class="support-layout">
          <section class="block">
            <h2>Frequently asked</h2>
            <div class="faq">${FAQ.map((f, i) => `
              <details ${i === 0 ? 'open' : ''}><summary>${esc(f.q)}<span class="plus" aria-hidden="true"></span></summary><p>${esc(f.a)}</p></details>`).join('')}
            </div>
          </section>

          <section class="block">
            <h2>Send us a message</h2>
            <form id="contactForm" class="card form" novalidate>
              <div class="field-row">
                ${fieldHtml('cname', 'Name', state.profile.name)}
                ${fieldHtml('cemail', 'Email', state.profile.email, 'email')}
              </div>
              <div class="field">
                <label for="corder">Order (optional)</label>
                <select id="corder" class="select">
                  <option value="">Not about an order</option>
                  ${allOrders().map(o => `<option value="${o.id}">${o.id} · ${esc(o.items.map(([id]) => byId[id].short).join(', '))}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label for="cmsg">Message</label>
                <textarea id="cmsg" name="cmsg" rows="5" placeholder="How can we help?"></textarea>
                <span class="msg" aria-live="polite"></span>
              </div>
              <button class="btn btn-solid" type="submit">${ICON.mail} Send</button>
              <p class="hint">Opens your email app with the message ready to send to ${esc(STORE.email)}.</p>
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
      box.querySelector('.msg').textContent = bad ? 'Tell us a little more (at least 10 characters).' : '';
      if (bad) return msg.focus();
      const orderId = $('#corder', f).value;
      const subject = orderId ? `Help with order ${orderId}` : 'Question from the website';
      const bodyText = `${msg.value.trim()}\n\n— ${f.elements.cname.value} (${f.elements.cemail.value})`;
      location.href = `mailto:${STORE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      toast('Opening your email app…', true);
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Notifications
   ══════════════════════════════════════════════════════════════════════ */
const notifications = {
  title: () => 'Notifications',
  rerenderOn: ['notes'],
  render() {
    const unread = unreadCount();
    return `
      <div class="page narrow">
        ${pageHead('Notifications', unread ? `${unread} unread` : 'You’re all caught up', [['Home', '#/'], ['Notifications', '']],
          unread ? '<button class="btn btn-ghost" id="readAll">Mark all as read</button>' : '')}
        <div class="note-list">
          ${NOTIFICATIONS.map(n => `
            <a class="note card${state.read.has(n.id) ? '' : ' unread'}" href="${n.href}" data-note="${n.id}">
              <img src="${avatarSrc(n.who)}" alt="">
              <span class="txt"><b>${esc(n.title)}</b><span>${esc(n.body)}</span></span>
              <time>${n.when}</time>
            </a>`).join('')}
        </div>
        <p class="hint" style="margin-top:14px">Choose what you're told about in <a href="#/settings/notifications">notification settings</a>.</p>
      </div>`;
  },
  mount(el) {
    $('#readAll', el)?.addEventListener('click', () => markRead());
    el.addEventListener('click', e => { const n = e.target.closest('[data-note]'); if (n) markRead([n.dataset.note]); });
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Not found
   ══════════════════════════════════════════════════════════════════════ */
const notFound = {
  title: () => 'Page not found',
  render: () => `
    <div class="page">
      <div class="not-found">
        <b>404</b>
        <h1>This page doesn’t exist</h1>
        <p>The link may be old, or the product is no longer sold.</p>
        <div class="nf-cta"><a class="btn btn-solid" href="#/">Back to the store</a><a class="btn btn-ghost" href="#/shop">Browse all products</a></div>
      </div>
    </div>`
};

export const VIEWS = { home, shop, product, wishlist, checkout, order, orders, profile, settings, support, notifications, notFound };
