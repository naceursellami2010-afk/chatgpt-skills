/* TechGarage demo — pages.
   Each view is { title(ctx), render(ctx) → html, mount(el, ctx) → cleanup? }.
   Shared actions (add to basket, wishlist, open product) are delegated by
   the shell, so most markup only needs data-* attributes.
   Every visible word goes through t() / plural() from i18n.js. */

import { PRODUCTS, CATEGORIES, HERO, NEW_DROPS, RECENT, NOTIFICATIONS, STORE, PAYMENT_METHODS, ACCENTS, AVATARS } from './data.js?v=20261124o';
import { LANGS, t, plural, blurb, word, faq, lang, setLang, isRTL } from './i18n.js?v=20261124o';
import {
  $, $$, byId, tnd, esc, catLabel, subLabel, subsOf, avatarSrc, payLabel, fmtDate, go, ICON, state,
  cartQty, cartTotal, setQty, addToCart, markViewed, clearViewed, unreadCount, markRead, noteText,
  saveProfile, savePrefs, calm, allOrders, getOrder, orderTotal, orderSubtotal, orderFee, orderCount, placeOrder,
  paymentFee, feeLabel,
  deliveryType, credential, searchProducts, media, heartBtn, tile, toast, exportData, resetEverything,
  familyOf, familyVariants, familyLead, familyTile, regionOf, valueOf, topupMethod, FAMILY_CATS,
  isListed, listed, sectionHidden, secTitle, stockState, stockOf, maxBuyable
} from './core.js?v=20261124o';
import { PAGE_SECTIONS } from './data.js?v=20261124o';
import { splitWords, parallax } from './motion.js?v=20261124o';

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

const statusPill = s => `<span class="pill pill-${s}">${esc(t(s === 'delivered' ? 'st.delivered' : 'st.processing'))}</span>`;

const mask = s => s.replace(/[A-Za-z0-9](?=.{4})/g, '•');

export const field = (id, label, value = '', type = 'text', extra = '') => `
  <div class="field">
    <label for="${id}">${esc(label)}</label>
    <input id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${extra}>
    <span class="msg" aria-live="polite"></span>
  </div>`;

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
      <code class="cred-code" dir="ltr">${esc(mask(c.secret))}</code>
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
    </div>`,

  mount(el) {
    const cleanups = [];

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
            <span class="note">${esc(t(deliveryType(p) === 'topup' ? 'note.minutes' : 'note.instant'))}</span>
          </div>
          <div class="slide-cta">
            <button class="btn btn-solid" data-buy="${p.id}">${ICON.bolt} ${esc(t('buy.now'))}</button>
            <button class="btn btn-ghost" data-add="${p.id}">${ICON.cart} <span>${esc(t('buy.add'))}</span></button>
            <a class="btn btn-icon" href="#/product/${p.id}" aria-label="${esc(t('buy.more', { name: p.short }))}">${ICON.dots}</a>
          </div>
        </div>`;
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
      $$('.tick', ticks).forEach((tk, n) => {
        tk.classList.remove('on', 'done');
        if (n < cur) tk.classList.add('done');
        if (n === cur) { void tk.offsetWidth; tk.classList.add('on'); }
      });
      restart();
    }
    const next = () => show(cur + 1, 1), prev = () => show(cur - 1, -1);
    function restart() { clearInterval(timer); if (!calm()) timer = setInterval(next, DWELL); }
    restart();
    cleanups.push(() => { clearInterval(timer); clearTimeout(wasTimer); });

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
              ? `<div class="grid-tiles">${s.items.map((it, i) => it.fam ? familyTile(it.fam, i) : tile(it.p, i)).join('')}</div>`
              : emptyState(ICON.search, t('shop.none'), esc(s.q ? t('shop.noneQ', { q: s.q }) : t('shop.nonePrice')),
                  `<a class="btn btn-solid" href="${shopHash({ cat: s.cat, sub: s.sub })}">${esc(t('shop.clear'))}</a>`)}
          </section>
        </div>
      </div>`;
  },
  mount(el, ctx) {
    const s = shopState(ctx);
    $('#shopSort', el).addEventListener('change', e => go(shopHash({ ...s, sort: e.target.value })));
    return parallax($('#catHero', el));
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Product
   ══════════════════════════════════════════════════════════════════════ */
function howItWorks(p) {
  const platform = word(p.tags[0]).replace(/ Key$/, '');
  switch (deliveryType(p)) {
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
function variantPicker(p) {
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

const product = {
  title: ctx => (isListed(ctx.params[0]) && byId[ctx.params[0]]?.short) || t('pdp.notFound'),
  render(ctx) {
    const p = isListed(ctx.params[0]) && byId[ctx.params[0]];
    if (!p) return notFound.render();
    const fam = familyOf(p);
    // a brand page suggests other brands; anything else suggests its neighbours
    const related = fam
      ? [...new Set(PRODUCTS.filter(x => x.cat === p.cat && x.sub !== fam).map(x => x.sub))].slice(0, 5)
      : [...PRODUCTS.filter(x => x.sub === p.sub && x.id !== p.id),
         ...PRODUCTS.filter(x => x.cat === p.cat && x.sub !== p.sub)].slice(0, 5);
    const type = deliveryType(p);
    return `
      <div class="page">
        ${crumbs([[t('home'), '#/'], [catLabel(p.cat), `#/shop/${p.cat}`], ...(fam ? [] : [[subLabel(p.sub), `#/shop/${p.cat}/${p.sub}`]]), [p.short, '']])}
        <div class="pdp">
          ${media(p, 'pdp-art', { adapt: true, eager: true, alt: p.short })}
          <div class="pdp-info">
            <div class="chips">${p.tags.map(tag => `<span class="chip">${esc(word(tag))}</span>`).join('')}${p.badge ? `<span class="chip chip-accent">${esc(word(p.badge))}</span>` : ''}</div>
            <h1>${esc(p.short)}</h1>
            <p class="listing">${esc(p.name)}</p>
            <p class="pdp-blurb">${esc(blurb(p))}</p>
            ${variantPicker(p)}
            <div class="price-line"><span class="now">${tnd(p.price)}</span><span class="note">${esc(t('pdp.tax'))}</span>${stockBadge(p.id)}</div>
            <ul class="facts">
              <li>${ICON.bolt}<span>${esc(dlvText(p))}</span></li>
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
            ${p.url ? `<a class="source" href="${p.url}" target="_blank" rel="noopener">${esc(t('pdp.source'))} ${ICON.out}</a>` : ''}
          </div>
        </div>

        <section class="block" ${sectionHidden('pdp.how') ? 'hidden' : ''}>
          <h2>${esc(t('pdp.how'))}</h2>
          <ol class="steps">${howItWorks(p).map(([ti, d], i) => `<li><span class="step-n">${i + 1}</span><div><b>${esc(ti)}</b><p>${esc(d)}</p></div></li>`).join('')}</ol>
        </section>

        <section class="block" ${sectionHidden('pdp.details') ? 'hidden' : ''}>
          <h2>${esc(t('pdp.details'))}</h2>
          <dl class="spec-table">
            <div><dt>${esc(t('spec.product'))}</dt><dd>${esc(p.name)}</dd></div>
            <div><dt>${esc(t('spec.category'))}</dt><dd>${esc(catLabel(p.cat))} · ${esc(subLabel(p.sub))}</dd></div>
            <div><dt>${esc(t('spec.platform'))}</dt><dd>${esc(word(p.tags[0]))}</dd></div>
            <div><dt>${esc(t('spec.type'))}</dt><dd>${esc(word(p.tags[1] || '—'))}</dd></div>
            <div><dt>${esc(t('spec.includes'))}</dt><dd>${esc(p.specs.map(word).join(' · '))}</dd></div>
            ${fam && familyVariants(fam).length > 1 ? `<div><dt>${esc(t('pdp.region'))}</dt><dd>${esc(t('region.' + regionOf(p)))}</dd></div>` : ''}
            <div><dt>${esc(t('spec.delivery'))}</dt><dd>${esc(dlvText(p))}</dd></div>
            <div><dt>${esc(t('spec.price'))}</dt><dd>${esc(t('spec.priceTax', { price: tnd(p.price) }))}</dd></div>
          </dl>
        </section>

        <section class="block" ${sectionHidden('pdp.related') ? 'hidden' : ''}>
          ${fam
            ? `<div class="block-head"><h2>${esc(t('pdp.otherBrands'))}</h2><a class="see-all" href="#/shop/${p.cat}">${esc(t('pdp.moreIn', { cat: catLabel(p.cat) }))}</a></div>
               <div class="grid-tiles">${related.map(familyTile).join('')}</div>`
            : `<div class="block-head"><h2>${esc(t('pdp.related'))}</h2><a class="see-all" href="#/shop/${p.cat}/${p.sub}">${esc(t('pdp.moreIn', { cat: subLabel(p.sub) }))}</a></div>
               <div class="grid-tiles">${related.map(tile).join('')}</div>`}
        </section>
      </div>`;
  },
  mount(el, ctx) {
    const p = isListed(ctx.params[0]) && byId[ctx.params[0]];
    if (!p) return;
    markViewed(p.id);
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

let chosenPayment = PAYMENT_METHODS[0];    // kept when the basket re-renders the page

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
    const pay = PAYMENT_METHODS.includes(chosenPayment) ? chosenPayment : PAYMENT_METHODS[0];
    const sub = cartTotal(), fee = paymentFee(pay, sub);
    let step = 1;
    return `
      <div class="page">
        ${pageHead(t('co.title'), `${plural('items', cartQty())} · ${esc(t('co.digital'))}`, trail)}
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
            ${games.length ? `<h2><span class="step-n">${step++}</span> ${esc(t('co.games'))}</h2>
              <p class="hint">${esc(t('co.gamesD'))}</p>
              ${games.map(gameBlock).join('')}` : ''}
            <h2><span class="step-n">${step++}</span> ${esc(t('co.payment'))}</h2>
            <div class="pay-options" role="radiogroup" aria-label="${esc(t('co.paymentLabel'))}">
              ${PAYMENT_METHODS.map((m, i) => `
                <label class="pay-option${m === 'clictopay' ? ' pay-main' : ''}">
                  <input type="radio" name="payment" value="${m}" ${m === pay ? 'checked' : ''}>
                  <span><b>${esc(t('pay.' + m))} <em class="pay-fee" dir="ltr">${esc(feeLabel(m))}</em></b><small>${esc(t('pay.' + m + 'D'))}</small></span>
                  ${m === 'clictopay' ? `<span class="pay-brands" aria-hidden="true"><i>VISA</i><i>MC</i><i>CIB</i><i>e-DINAR</i></span>` : ''}
                </label>`).join('')}
            </div>
            <label class="check"><input type="checkbox" id="terms"><span>${esc(t('co.terms'))}</span></label>
            <span class="msg" id="termsMsg" aria-live="polite"></span>
            <button class="btn btn-solid btn-wide" type="submit" id="placeBtn">${esc(t('co.place', { total: tnd(sub + fee) }))}</button>
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
            <div class="sum-row fee-row"><span id="feeLabel">${esc(t('co.fee.' + pay))} <em dir="ltr">${esc(feeLabel(pay))}</em></span><span id="feeAmt">${tnd(fee)}</span></div>
            <div class="sum-row"><span>${esc(t('co.delivery'))}</span><span>${esc(t('co.free'))}</span></div>
            <div class="sum-row total-row"><span>${esc(t('co.total'))}</span><b id="grandTotal">${tnd(Math.round((sub + fee) * 1000) / 1000)}</b></div>
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
    // the fee line and totals follow the chosen payment method
    form.addEventListener('change', e => {
      if (e.target.name !== 'payment') return;
      chosenPayment = e.target.value;
      const sub = cartTotal(), fee = paymentFee(chosenPayment, sub), total = Math.round((sub + fee) * 1000) / 1000;
      $('#feeLabel', el).innerHTML = `${esc(t('co.fee.' + chosenPayment))} <em dir="ltr">${esc(feeLabel(chosenPayment))}</em>`;
      $('#feeAmt', el).textContent = tnd(fee);
      $('#grandTotal', el).textContent = tnd(total);
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

      const terms = $('#terms', form);
      $('#termsMsg', form).textContent = terms.checked ? '' : t('err.terms');
      if (!terms.checked && !first) first = terms;
      if (first) { first.focus(); return; }

      const details = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), phone: form.elements.phone.value.trim() };
      if ($('#saveContact', form).checked) saveProfile(details);
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
        const order = placeOrder({ ...details, payment: form.elements.payment.value, accounts });
        go(`#/order/${order.id}?new=1`);
      };
      if (form.elements.payment.value !== 'clictopay') return finish();
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
    const done = o.status === 'delivered';
    const email = o.contact?.email || state.profile.email;
    const first = o.contact?.name?.split(' ')[0];
    return `
      <div class="page">
        ${fresh ? `<div class="success card">
          <span class="success-icon">${ICON.check}</span>
          <div><h2>${esc(first ? t('ord.thanks', { name: first }) : t('ord.thanksAnon'))}</h2>
          <p>${esc(t(done ? 'ord.doneD' : 'ord.pendD', { id: o.id, email }))}</p></div>
        </div>` : ''}
        ${pageHead(t('ord.title', { id: o.id }), orderMeta(o), [[t('home'), '#/'], [t('orders.title'), '#/orders'], [o.id, '']], statusPill(o.status))}
        <ol class="timeline" aria-label="${esc(t('ord.progress'))}">
          <li class="done"><span>${ICON.check}</span><b>${esc(t('ord.placed'))}</b><small>${fmtDate(o.date)}</small></li>
          <li class="done"><span>${ICON.check}</span><b>${esc(t('ord.paid'))}</b><small>${esc(payLabel(o.payment))}</small></li>
          <li class="${done ? 'done' : 'active'}"><span>${done ? ICON.check : '<i class="spinner"></i>'}</span><b>${esc(t(done ? 'ord.delivered' : 'ord.delivering'))}</b><small>${esc(t(done ? 'ord.byEmail' : 'ord.minutes'))}</small></li>
        </ol>
        <div class="order-layout">
          <section class="card order-items">
            <h2>${esc(t('ord.items'))}</h2>
            ${o.items.map(([id, q]) => { const p = byId[id]; return `
              <div class="order-item">
                <a class="oi-head" href="#/product/${id}">${media(p, 'thumb')}<span class="txt"><b>${esc(p.short)}</b><span>${q} × ${tnd(p.price)}</span></span></a>
                ${done ? Array.from({ length: q }, (_, n) => credBlock({ ...o, id: o.id + (n ? '-' + n : ''), unit: n }, id)).join('')
                       : `<div class="cred pending"><i class="spinner"></i><span>${esc(t('ord.preparing'))}</span></div>`}
              </div>`; }).join('')}
          </section>
          <aside class="card order-sum">
            <h2>${esc(t('ord.summary'))}</h2>
            <div class="sum-row"><span>${esc(t('ord.payment'))}</span><span>${esc(payLabel(o.payment))}</span></div>
            <div class="sum-row"><span>${esc(t('ord.to'))}</span><span dir="ltr">${esc(email)}</span></div>
            ${o.playerId ? `<div class="sum-row"><span>${esc(t('ord.player'))}</span><span dir="ltr">${esc(o.playerId)}</span></div>` : ''}
            ${Object.entries(o.accounts || {}).map(([key, a]) => `<div class="sum-row"><span>${esc(byId[key]?.short || subLabel(key))}</span>
              <span dir="ltr">${esc(a.email ? [a.email, a.uid && 'UID ' + a.uid, a.platform && t('acc.' + a.platform)].filter(Boolean).join(' · ') : a.playerId)}</span></div>`).join('')}
            <div class="sum-row"><span>${esc(t('co.subtotal'))}</span><span>${tnd(orderSubtotal(o))}</span></div>
            <div class="sum-row fee-row"><span>${esc(t('co.fee.' + (o.payment === 'card' ? 'clictopay' : o.payment)))} <em dir="ltr">${esc(feeLabel(o.payment))}</em></span><span>${tnd(orderFee(o))}</span></div>
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
    if (o && o.status === 'processing' && o.deliverAt) {
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
        ${ACCENTS.map(a => `<label class="swatch" title="${esc(t('acc.' + a.id))}"><input type="radio" name="accent" value="${a.value}" ${pf.accent === a.value ? 'checked' : ''}><span style="--c:${a.value}"></span><em>${esc(t('acc.' + a.id))}</em></label>`).join('')}
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
            <span class="hours">${STORE.hours.map(([d, h]) => `<i>${esc(t(d))}</i><i dir="ltr">${h}</i>`).join('')}</span></div>
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

export const VIEWS = { home, shop, product, wishlist, checkout, order, orders, profile, settings, support, notifications, notFound };
