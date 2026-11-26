/* TechGarage demo — store admin (#/admin).
   Three tabs: categories (and their subcategories), products, and what each
   page section shows. Every change is a small edit to the owner's record
   (see applyAdmin in data.js), saved with commitAdmin(), which re-indexes
   the catalogue and redraws the store — no reload, no server. */

import { PRODUCTS, CATEGORIES, SUB_NAMES, HERO, NEW_DROPS, CAT_NAMES, PAGE_SECTIONS, ADMIN_KEY, PLATFORMS, PROMO, SALES, BUNDLES, FLASH, EXTRAS,
  STORE, TEXTS, FAQ_OVR, SITE, ACCENTS, PAYMENT_METHODS, PAYMENT_FEES, METHODS_SHIPPED, CURRENCY_RATES, RATE_MANUAL, LEGAL_OVR, SHIPPING, ORDER_TRACK, salePrice, loadAdmin, shipped } from './data.js?v=20261129d';
import { LANGS, t, tIn, plural, lang, langInfo, faq, textKeys, refreshRates, liveRate } from './i18n.js?v=20261129d';
import {
  $, $$, byId, tnd, esc, catLabel, subLabel, subsOf, go, ICON, media, fitAll, toast, commitAdmin, emit,
  isListed, listed, regionOf, valueOf, deliveryType, topupMethod, allOrders, orderTotal, fmtDate, payLabel, orderCount, googleReviews,
  stock, stockOf, stockState, usesKeys, addKeys, removeKey, replaceStock, LOW_STOCK, versionKind
} from './core.js?v=20261129d';
import { pageHead, field, emptyState, toggle } from './views.js?v=20261129d';
import { extrasForm, mountExtras } from './admin-extras.js?v=20261129d';
import { keepOnly, refsIn, packFiles, unpackFiles } from './media-store.js?v=20261129d';
import { online, checkKey, adminKey, forgetKey, uploadToBlob } from './sync.js?v=20261129d';
import { chatsTab, mountChats, chatWatch, chatNavBadge } from './chat-admin.js?v=20261129d';

/* ── the owner's record ────────────────────────────────────────────── */
const clone = v => JSON.parse(JSON.stringify(v));
/** Load the record, let fn change it, save and apply. */
function change(fn, msg = t('adm.saved')) {
  const r = loadAdmin();
  if (fn(r) === false) return false;
  if (commitAdmin(r) && msg) toast(msg, true);
  return true;
}
const withCats = r => (r.categories ??= clone(CATEGORIES));

const slug = s => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
function freshId(name, taken, prefix) {
  const base = slug(name) || `${prefix}-${Date.now().toString(36)}`;
  let id = base, n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
}
const takenGroupIds = () => new Set(['all', ...CATEGORIES.flatMap(c => [c.id, ...(c.subs || [])]), ...Object.keys(SUB_NAMES)]);

const countIn = (key, id) => PRODUCTS.filter(p => p[key] === id).length;
const LANG_IDS = LANGS.map(l => l.id);
const NAME_LABEL = { en: 'adm.nameEn', fr: 'adm.nameFr', ar: 'adm.nameAr' };
/** A category's name as the owner would edit it in one language. */
const catNameIn = (id, l) => CAT_NAMES[id]?.[l] || (CAT_NAMES[id] ? '' : tIn(l, 'cat.' + id));

const iconBtn = (act, label, icon, extra = '') =>
  `<button type="button" class="adm-ico" data-act="${act}" aria-label="${esc(label)}" title="${esc(label)}" ${extra}>${icon}</button>`;
const moveBtns = (id, i, n) =>
  iconBtn('up', t('adm.up'), ICON.up, `data-id="${esc(id)}" ${i === 0 ? 'disabled' : ''}`) +
  iconBtn('down', t('adm.down'), `<span class="flip">${ICON.up}</span>`, `data-id="${esc(id)}" ${i === n - 1 ? 'disabled' : ''}`);
const move = (arr, id, dir) => {
  const i = arr.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
};

/* ══════════════════════════════════════════════════════════════════════
   Categories
   ══════════════════════════════════════════════════════════════════════ */
/* ── ready-made choices, so a category or subcategory is picked, not typed ──
   Taken from techgarage.tn's own menu (digital products only), plus a few
   popular digital lines. Names come in all three languages. */
const L = (en, fr, ar) => ({ en, fr, ar });
const CAT_PRESETS = [
  { group: 'store', id: 'fc-27', names: L('EA FC 27', 'EA FC 27', 'EA FC 27') },
  { group: 'store', id: 'account-topups', names: L('Account top-ups', 'Recharges de compte', 'شحن الحسابات') },
  { group: 'store', id: 'mobile-apps', names: L('Mobile apps', 'Applications mobiles', 'تطبيقات الجوال'), grouped: true },
  { group: 'store', id: 'playstation-games', names: L('PlayStation games', 'Jeux PlayStation', 'ألعاب بلايستيشن') },
  { group: 'popular', id: 'streaming', names: L('Streaming', 'Streaming', 'البث'), grouped: true },
  { group: 'popular', id: 'subscriptions', names: L('Subscriptions', 'Abonnements', 'الاشتراكات'), grouped: true },
  { group: 'popular', id: 'music', names: L('Music', 'Musique', 'الموسيقى'), grouped: true },
  { group: 'popular', id: 'crypto-cards', names: L('Crypto cards', 'Cartes crypto', 'بطاقات العملات الرقمية'), grouped: true },
  { group: 'popular', id: 'game-topups', names: L('Game top-ups', 'Recharges de jeux', 'شحن الألعاب'), grouped: true },
  { group: 'popular', id: 'ai-tools', names: L('AI tools', 'Outils IA', 'أدوات الذكاء الاصطناعي'), grouped: true },
  { group: 'popular', id: 'vpn-security', names: L('VPN & security', 'VPN et sécurité', 'VPN والحماية') },
  { group: 'popular', id: 'deals', names: L('Deals', 'Bons plans', 'العروض') }
];
const SUB_PRESETS = [
  { label: L('Gift cards', 'Cartes cadeaux', 'بطاقات الهدايا'), items: [
    ['fc27-points', 'EA SPORTS FC 27 Points'], ['steam-turkey', 'Steam Turkey'], ['steam-euro', 'Steam Euro'],
    ['steam-ukraine', 'Steam Ukraine'], ['steam-china', 'Steam China'], ['playstation-usa', 'PlayStation USA'],
    ['playstation-turkey', 'PlayStation Turkey'], ['playstation-france', 'PlayStation France'],
    ['playstation-saudi', 'PlayStation Saudi'], ['playstation-germany', 'PlayStation Germany'],
    ['playstation-canada', 'PlayStation Canada'], ['itunes-usa', 'iTunes USA'], ['itunes-france', 'iTunes France'],
    ['itunes-turkey', 'iTunes Turkey'], ['apple-music', 'Apple Music'], ['xbox-game-pass', 'Xbox Game Pass'],
    ['xbox-games', 'Xbox games'], ['google-play', 'Google Play']] },
  { label: L('Mobile games', 'Jeux mobiles', 'ألعاب الجوال'), items: [
    ['8ball', '8 Ball Pool'], ['honor-of-kings', 'Honor of Kings'], ['arena-breakout', 'Arena Breakout'],
    ['delta-force', 'Delta Force'], ['free-fire-max', 'Free Fire MAX'], ['pubg-new-state', 'PUBG: New State']] },
  { label: L('Top-ups', 'Recharges', 'الشحن'), items: [
    ['fc27-coins', 'FC 27 Coins'], ['gta5-boosting', 'GTA 5 Online Boosting'], ['rocket-league', 'Rocket League']] },
  { label: L('PC games', 'Jeux PC', 'ألعاب الحاسوب'), items: [
    ['ea-fc-27', 'EA FC 27'], ['ubisoft-keys', 'Ubisoft Connect'], ['ea-app-keys', 'EA app'], ['xbox-pc', 'Xbox PC']] },
  { label: L('Streaming & apps', 'Streaming et applis', 'البث والتطبيقات'), items: [
    ['netflix', 'Netflix'], ['spotify', 'Spotify'], ['shahid', 'Shahid VIP'], ['disney-plus', 'Disney+'],
    ['youtube-premium', 'YouTube Premium'], ['osn-plus', 'OSN+'], ['tod', 'TOD'], ['discord-nitro', 'Discord Nitro'],
    ['chatgpt-plus', 'ChatGPT Plus'], ['canva-pro', 'Canva Pro'], ['tango', 'Tango'], ['dramabox', 'DramaBox']] },
  { label: L('Software', 'Logiciels', 'البرامج'), items: [
    ['windows', 'Windows'], ['microsoft-office', 'Microsoft Office'], ['antivirus', 'Antivirus'], ['vpn', 'VPN']] }
];
const inLang = o => o[lang()] || o.en;
const OTHER = '__other';

function catPresetMenu() {
  const taken = takenGroupIds();
  const left = CAT_PRESETS.filter(p => !taken.has(p.id));
  const group = g => left.filter(p => p.group === g).map(p => `<option value="${p.id}">${esc(inLang(p.names))}</option>`).join('');
  return `<select class="select adm-preset" name="preset" data-change="preset" aria-label="${esc(t('adm.pickCat'))}">
      <option value="" hidden>${esc(t('adm.pickCat'))}</option>
      ${group('store') ? `<optgroup label="${esc(t('adm.fromStore'))}">${group('store')}</optgroup>` : ''}
      ${group('popular') ? `<optgroup label="${esc(t('adm.popular'))}">${group('popular')}</optgroup>` : ''}
      <option value="${OTHER}">${esc(t('adm.other'))}</option>
    </select>`;
}
function subPresetMenu() {
  const taken = takenGroupIds();
  return `<select class="select adm-preset" name="preset" data-change="preset" aria-label="${esc(t('adm.pickSub'))}">
      <option value="" hidden>${esc(t('adm.pickSub'))}</option>
      ${SUB_PRESETS.map(g => {
        const items = g.items.filter(([id]) => !taken.has(id));
        return items.length ? `<optgroup label="${esc(inLang(g.label))}">${items.map(([id, name]) => `<option value="${id}">${esc(name)}</option>`).join('')}</optgroup>` : '';
      }).join('')}
      <option value="${OTHER}">${esc(t('adm.other'))}</option>
    </select>`;
}

function categoriesTab() {
  const cats = CATEGORIES.filter(c => c.id !== 'all');
  const names = (prefix, id) => `<div class="adm-names">${LANG_IDS.map(l => `
      <label class="field"><span class="label">${esc(t(NAME_LABEL[l]))}</span>
        <input name="${l}" value="${esc(id ? catNameIn(id, l) : '')}" ${l === 'ar' ? 'dir="rtl"' : 'dir="ltr"'} ${l === 'en' && !id ? 'required' : ''}></label>`).join('')}</div>`;
  return `
    <section class="card adm-card">
      <h2>${esc(t('adm.addCat'))}</h2>
      <form class="adm-form" data-form="addCat" novalidate>
        ${catPresetMenu()}
        <div class="adm-custom" hidden>${names('new')}</div>
        <div class="adm-form-foot">
          <label class="check"><input type="checkbox" name="grouped"><span><b>${esc(t('adm.grouped'))}</b> — ${esc(t('adm.groupedD'))}</span></label>
          <button class="btn btn-solid" type="submit">${ICON.plus} ${esc(t('adm.add'))}</button>
        </div>
      </form>
    </section>
    ${cats.map((c, i) => {
      const subs = c.subs || [];
      return `
      <section class="card adm-card adm-cat" data-cat="${esc(c.id)}">
        <header class="adm-cat-head">
          <div><h2>${esc(catLabel(c.id))}</h2><p>${esc(plural('products', countIn('cat', c.id)))} · ${esc(plural('subs', subs.length))}</p></div>
          <div class="adm-actions">
            ${moveBtns(c.id, i, cats.length).replaceAll('data-act="up"', 'data-act="catUp"').replaceAll('data-act="down"', 'data-act="catDown"')}
            ${iconBtn('catDelete', t('adm.delete'), ICON.trash, `data-id="${esc(c.id)}"`)}
          </div>
        </header>
        <form class="adm-form" data-form="renameCat" data-id="${esc(c.id)}" novalidate>
          <details class="adm-rename"><summary>${esc(t('adm.rename'))}</summary>${names('cat', c.id)}</details>
          <div class="adm-form-foot">
            <label class="check"><input type="checkbox" name="grouped" ${c.grouped ? 'checked' : ''}><span><b>${esc(t('adm.grouped'))}</b> — ${esc(t('adm.groupedD'))}</span></label>
            <button class="btn btn-ghost" type="submit">${esc(t('adm.save'))}</button>
          </div>
        </form>
        <h3>${esc(t('adm.subs'))}</h3>
        <ul class="adm-subs">
          ${subs.map((s, j) => `
            <li data-sub="${esc(s)}">
              <input class="adm-inline" value="${esc(subLabel(s))}" data-change="renameSub" data-id="${esc(s)}" aria-label="${esc(t('adm.rename'))} ${esc(subLabel(s))}">
              <em>${countIn('sub', s)}</em>
              ${moveBtns(s, j, subs.length).replaceAll('data-act="up"', 'data-act="subUp"').replaceAll('data-act="down"', 'data-act="subDown"')}
              ${iconBtn('subDelete', t('adm.delete'), ICON.trash, `data-id="${esc(s)}"`)}
            </li>`).join('')}
        </ul>
        <form class="adm-addsub" data-form="addSub" data-id="${esc(c.id)}" novalidate>
          ${subPresetMenu()}
          <input name="name" class="adm-custom" hidden placeholder="${esc(t('adm.newSub'))}" aria-label="${esc(t('adm.newSub'))}">
          <button class="btn btn-ghost" type="submit">${ICON.plus} ${esc(t('adm.add'))}</button>
        </form>
      </section>`;
    }).join('')}`;
}

const catActions = {
  addCat(form) {
    const pick = form.elements.preset.value;
    if (!pick) { form.elements.preset.focus(); toast(t('adm.pickCat')); return; }
    const preset = CAT_PRESETS.find(p => p.id === pick);
    const n = preset ? { ...preset.names } : Object.fromEntries(LANG_IDS.map(l => [l, form.elements[l].value.trim()]));
    if (!n.en) { form.elements.en.focus(); toast(t('adm.nameNeeded')); return; }
    const id = preset ? preset.id : freshId(n.en, takenGroupIds(), 'cat');
    change(r => {
      withCats(r).push({ id, grouped: form.elements.grouped.checked, subs: [] });
      (r.catNames ??= {})[id] = n;
    }, t('adm.catAdded'));
  },
  renameCat(form) {
    const id = form.dataset.id;
    const n = Object.fromEntries(LANG_IDS.map(l => [l, form.elements[l].value.trim()]));
    if (!n.en) { form.elements.en.focus(); toast(t('adm.nameNeeded')); return; }
    change(r => {
      (r.catNames ??= {})[id] = n;
      const c = withCats(r).find(x => x.id === id);
      if (form.elements.grouped.checked) c.grouped = true; else delete c.grouped;
    });
  },
  addSub(form) {
    const pick = form.elements.preset.value;
    if (!pick) { form.elements.preset.focus(); toast(t('adm.pickSub')); return; }
    const preset = SUB_PRESETS.flatMap(g => g.items).find(([pid]) => pid === pick);
    const name = preset ? preset[1] : form.elements.name.value.trim();
    if (!name) { form.elements.name.focus(); toast(t('adm.nameNeeded')); return; }
    const id = preset ? preset[0] : freshId(name, takenGroupIds(), 'sub');
    change(r => {
      const c = withCats(r).find(x => x.id === form.dataset.id);
      (c.subs ??= []).push(id);
      (r.subNames ??= {})[id] = name;
    }, t('adm.subAdded'));
  }
};

function moveCat(id, dir) {
  change(r => {
    const cats = withCats(r), ids = cats.map(c => c.id).filter(x => x !== 'all');
    move(ids, id, dir);
    r.categories = [cats.find(c => c.id === 'all'), ...ids.map(x => cats.find(c => c.id === x))].filter(Boolean);
  }, '');
}
function moveSub(id, dir) {
  change(r => { const c = withCats(r).find(x => x.subs?.includes(id)); move(c.subs, id, dir); }, '');
}
function deleteGroup(kind, id) {
  const n = countIn(kind, id);
  if (n) { toast(t('adm.notEmpty', { what: plural('products', n) })); return; }
  const name = kind === 'cat' ? catLabel(id) : subLabel(id);
  if (!confirm(t('adm.deleteQ', { name }))) return;
  change(r => {
    const cats = withCats(r);
    if (kind === 'cat') r.categories = cats.filter(c => c.id !== id);
    else for (const c of cats) if (c.subs) c.subs = c.subs.filter(s => s !== id);
  }, t('adm.deleted'));
}

/* ══════════════════════════════════════════════════════════════════════
   Products
   ══════════════════════════════════════════════════════════════════════ */
const shippedIds = () => new Set(shipped().PRODUCTS.map(p => p.id));
let productQuery = '', productCat = '';

function productsTab() {
  const r = loadAdmin(), base = shippedIds();
  const q = productQuery.toLowerCase();
  const list = PRODUCTS.filter(p => (!productCat || p.cat === productCat) &&
    (!q || [p.short, p.name, p.id, subLabel(p.sub)].join(' ').toLowerCase().includes(q)));
  const mark = p => !base.has(p.id) ? `<span class="pill pill-new">${esc(t('adm.new'))}</span>`
    : r.edited?.[p.id] ? `<span class="pill pill-edited">${esc(t('adm.edited'))}</span>` : '';
  return `
    <div class="adm-toolbar">
      <label class="search-field">${ICON.search.replace('width="34" height="34"', 'width="16" height="16"')}
        <input type="search" id="admSearch" value="${esc(productQuery)}" placeholder="${esc(t('adm.search'))}" aria-label="${esc(t('adm.search'))}"></label>
      <select class="select" id="admCat" aria-label="${esc(t('adm.cat'))}">
        <option value="">${esc(t('adm.allCats'))}</option>
        ${CATEGORIES.filter(c => c.id !== 'all').map(c => `<option value="${esc(c.id)}" ${c.id === productCat ? 'selected' : ''}>${esc(catLabel(c.id))}</option>`).join('')}
      </select>
      <a class="btn btn-solid" href="#/admin/product/new">${ICON.plus} ${esc(t('adm.newProduct'))}</a>
    </div>
    <p class="hint">${esc(plural('products', list.length))}</p>
    ${list.length ? `<div class="card adm-table" role="list">
      ${list.map(p => `
        <div class="adm-row" role="listitem" data-pid="${esc(p.id)}">
          ${media(p, 'thumb')}
          <div class="txt"><b>${esc(p.short)} ${mark(p)}</b><span>${esc(catLabel(p.cat))} · ${esc(subLabel(p.sub))}</span></div>
          <span class="adm-price">${tnd(p.price)}</span>
          <div class="adm-actions">
            <a class="btn btn-ghost btn-sm" href="#/admin/product/${esc(p.id)}">${esc(t('adm.edit'))}</a>
            <a class="adm-ico" href="#/admin/product/copy-${esc(p.id)}" aria-label="${esc(t('adm.duplicate') + ' ' + p.short)}" title="${esc(t('adm.duplicate'))}">${ICON.copy}</a>
            ${iconBtn('productDelete', t('adm.delete') + ' ' + p.short, ICON.trash, `data-id="${esc(p.id)}"`)}
          </div>
        </div>`).join('')}
    </div>` : emptyState(ICON.search, t('adm.noResults'), '')}`;
}

const REGIONS = ['GL', 'FR', 'US', 'EU', 'TR', 'IN'];
const DELIVERIES = [['', 'adm.dAuto'], ['code', 'adm.dCode'], ['key', 'adm.dKey'], ['account', 'adm.dAccount'], ['topup', 'adm.dTopup'], ['ship', 'adm.dShip']];
const TOPUPS = [['id', 'adm.tId'], ['login', 'adm.tLogin'], ['loginFull', 'adm.tLoginFull']];

const options = (list, sel) => list.map(([v, label]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(label)}</option>`).join('');
const subOptions = (cat, sel) => options(subsOf(cat).map(s => [s, subLabel(s)]), sel);

function productForm(id) {
  // "copy-<id>": a new product that starts as a copy of another (same photo, text, details)
  const from = id.startsWith('copy-') ? byId[id.slice(5)] : null;
  const isNew = id === 'new' || !!from;
  const p = isNew ? null : byId[id];
  if (!isNew && (!p || !isListed(id))) return emptyState(ICON.search, t('pdp.notFound'), '', `<a class="btn btn-solid" href="#/admin/products">${esc(t('adm.tab.products'))}</a>`);
  const src = p || from;   // the product whose picture and details fill the form
  const cats = CATEGORIES.filter(c => c.id !== 'all');
  const cat = src?.cat || cats[0]?.id || '';
  const v = p || (from ? { ...from, short: t('adm.copyOf', { name: from.short }), name: '', url: '', badge: '', price: from.was ?? from.price, was: undefined, video: undefined } : { tags: [] });
  const sel = (name, label, inner, extra = '') => `
    <div class="field"><label for="${name}">${esc(label)}</label>
      <select class="select" id="${name}" name="${name}" ${extra}>${inner}</select><span class="msg" aria-live="polite"></span></div>`;
  const delivery = src?.delivery || '';
  const showTopup = (delivery || (src && deliveryType(src))) === 'topup';
  return `
    ${from ? `<p class="hint adm-copy-note">${ICON.copy}<span>${esc(t('adm.copyD', { name: from.short }))}</span></p>` : ''}
    <form class="card form adm-product" id="productForm" data-id="${esc(isNew ? '' : id)}"${from ? ` data-from="${esc(from.id)}"` : ''} novalidate>
      <div class="adm-product-grid">
        <div class="adm-photo">
          <span class="label">${esc(t('adm.photo'))}</span>
          <div class="adm-photo-box" id="photoBox">${src ? media(src, 'adm-photo-media', { adapt: false, eager: true }) : `<span class="adm-photo-empty">${ICON.box}</span>`}</div>
          <input type="hidden" name="img" value="${esc(src?.img || '')}">
          <label class="btn btn-ghost btn-wide adm-upload">${ICON.plus} ${esc(t('adm.upload'))}<input type="file" accept="image/*" id="photoFile" hidden></label>
          <input class="adm-inline" id="photoUrl" type="url" dir="ltr" placeholder="${esc(t('adm.photoUrl'))}" aria-label="${esc(t('adm.photoUrl'))}">
          <span class="msg" id="photoMsg" aria-live="polite"></span>
        </div>
        <div class="adm-fields">
          ${field('short', t('adm.short'), v.short || '', 'text', 'required')}
          ${field('name', t('adm.fullName'), v.name && v.name !== v.short ? v.name : '', 'text')}
          <div class="field-row">
            ${field('price', t('adm.price'), (v.was ?? v.price) ?? '', 'number', 'min="0" step="0.001" inputmode="decimal" dir="ltr"')}
            ${field('badge', t('adm.badge'), v.badge || '', 'text')}
          </div>
          <div class="field-row">
            ${sel('cat', t('adm.cat'), options(cats.map(c => [c.id, catLabel(c.id)]), cat))}
            ${sel('sub', t('adm.sub'), subOptions(cat, v.sub))}
          </div>
          <div class="field-row">
            ${sel('region', t('adm.region'), `<option value="">${esc(t('adm.regionAuto'))}${p ? ' · ' + esc(t('region.' + regionOf({ ...p, region: '' }))) : ''}</option>` +
              options(REGIONS.map(r => [r, t('region.' + r)]), v.region || ''))}
            <div class="field">
              <label for="value">${esc(t('adm.value'))}</label>
              <input id="value" name="value" value="${esc(v.value || '')}" placeholder="${esc(p ? valueOf({ ...p, value: '' }) : '50 EUR')}" dir="auto">
              <span class="hint">${esc(t('adm.valueD'))}</span>
            </div>
          </div>
          <div class="field-row">
            ${sel('game', t('adm.game'), `<option value="">${esc(t('adm.gameNone'))}</option><option value="__new">${esc(t('adm.gameNew'))}</option>` +
              options([...new Map(PRODUCTS.filter(x => x.game).map(x => [x.game, x])).values()]
                .sort((a, b) => a.short.localeCompare(b.short)).map(x => [x.game, x.short]), v.game || ''))}
            ${sel('platform', t('adm.platform'), `<option value="">—</option>` + options(PLATFORMS.map(pl => [pl, t('plat.' + pl)]), v.platform || ''))}
          </div>
          <p class="hint adm-game-hint">${esc(t('adm.gameD'))}</p>
          <div class="field-row">
            ${sel('delivery', t('adm.delivery'), options(DELIVERIES.map(([d, k]) => [d, t(k)]), delivery))}
            <div id="qtyWrap" ${(delivery || (src && deliveryType(src))) === 'ship' ? '' : 'hidden'}>${field('qty', t('adm.qty'), typeof v.qty === 'number' ? v.qty : '', 'number', 'min="0" step="1" inputmode="numeric" dir="ltr"')}<span class="hint">${esc(t('adm.qtyD'))}</span></div>
            <div id="topupWrap" ${showTopup ? '' : 'hidden'}>${sel('topup', t('adm.topup'), options(TOPUPS.map(([d, k]) => [d, t(k)]), src ? topupMethod(src) : 'id'))}</div>
          </div>
          <div class="field">
            <label for="tags">${esc(t('adm.tags'))}</label>
            <input id="tags" name="tags" value="${esc((v.tags || []).join(', '))}" dir="auto">
            <span class="hint">${esc(t('adm.tagsD'))}</span>
          </div>
          <div class="field">
            <label for="desc">${esc(t('adm.desc'))}</label>
            <textarea id="desc" name="desc" rows="3" dir="auto" maxlength="800">${esc(v.custom ? v.blurb : (v.blurb || ''))}</textarea>
            <span class="hint">${esc(t('adm.descD'))}</span>
          </div>
          <div class="field">
            <label for="guide">${esc(t('adm.guide'))}</label>
            <textarea id="guide" name="guide" rows="10" dir="auto" maxlength="8000" placeholder="${esc(t('adm.guideP'))}">${esc(v.guide || '')}</textarea>
            <span class="hint">${esc(t('adm.guideD'))}</span>
          </div>
          ${field('url', t('adm.link'), v.url || '', 'url', 'dir="ltr" placeholder="https://techgarage.tn/…"')}
          <div class="field-row">
            ${field('videoHd', t('adm.videoHd'), v.video?.hd?.startsWith('idb:') ? '' : v.video?.hd || '', 'text', 'dir="ltr" placeholder="https://…/game-1080p.mp4"')}
            ${field('videoSd', t('adm.videoSd'), v.video?.sd || '', 'text', 'dir="ltr" placeholder="https://…/game-720p.mp4"')}
          </div>
          <p class="hint">${esc(t('adm.videoD'))}</p>
          <div class="field-row">${field('release', t('adm.release'), v.release || '', 'date', 'dir="ltr"')}</div>
          <p class="hint">${esc(t('adm.releaseD'))}</p>
        </div>
      </div>
      ${extrasForm(v)}
      <div class="adm-form-foot">
        ${p ? `<a class="btn btn-ghost" href="#/product/${esc(p.id)}">${esc(t('adm.view'))} ${ICON.out}</a>` : '<span></span>'}
        <div class="adm-actions">
          ${p ? `<button class="btn btn-ghost adm-danger" type="button" data-act="productDelete" data-id="${esc(p.id)}">${ICON.trash} ${esc(t('adm.delete'))}</button>
                 <a class="btn btn-ghost" href="#/admin/product/copy-${esc(p.id)}">${ICON.copy} ${esc(t('adm.duplicate'))}</a>` : ''}
          <a class="btn btn-ghost" href="#/admin/products">${esc(t('adm.cancel'))}</a>
          <button class="btn btn-solid" type="submit">${esc(t('adm.save'))}</button>
        </div>
      </div>
    </form>`;
}

/** Shrink an uploaded picture to the size the store uses (640 px, WebP). */
function readPhoto(file) {
  return new Promise((ok, fail) => {
    const fr = new FileReader();
    fr.onerror = fail;
    fr.onload = () => {
      const img = new Image();
      img.onerror = fail;
      img.onload = () => {
        const k = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/webp', 0.85));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function mountProductForm(el) {
  const form = $('#productForm', el);
  if (!form) return () => {};
  const setPhoto = src => {
    form.elements.img.value = src;
    $('#photoBox', form).innerHTML = media({ img: src }, 'adm-photo-media', { eager: true });
    fitAll($('#photoBox', form));
    $('#photoMsg', form).textContent = '';
  };
  $('#photoFile', form).addEventListener('change', async e => {
    const f = e.target.files[0];
    if (f) try { setPhoto(await readPhoto(f)); } catch { $('#photoMsg', form).textContent = t('adm.photoNeeded'); }
  });
  $('#photoUrl', form).addEventListener('change', e => { const u = e.target.value.trim(); if (/^https?:\/\//.test(u)) setPhoto(u); });
  // more photos, banner, video upload, system requirements, redeem steps, page layout (admin-extras.js)
  const extras = mountExtras(form, byId[form.dataset.id] || byId[form.dataset.from] || {}, {
    setMain: src => { const old = form.elements.img.value; setPhoto(src); return old; }
  });
  form.elements.cat.addEventListener('change', e => { form.elements.sub.innerHTML = subOptions(e.target.value); });
  form.elements.delivery.addEventListener('change', e => {
    const cat = form.elements.cat.value;
    const auto = e.target.value || (cat === 'mobile' ? 'topup' : '');
    $('#topupWrap', form).hidden = auto !== 'topup';
    $('#qtyWrap', form).hidden = (e.target.value || (cat === 'hardware' ? 'ship' : '')) !== 'ship';
  });

  const onSubmit = e => {
    e.preventDefault();
    const f = form.elements, msg = (input, text) => {
      const box = input.closest('.field'); box?.classList.toggle('err', !!text);
      const m = box?.querySelector('.msg'); if (m) m.textContent = text || '';
      return !text;
    };
    const short = f.short.value.trim(), priceVal = parseFloat(f.price.value);
    const ok = [
      msg(f.short, short.length >= 2 ? '' : t('adm.nameNeeded')),
      msg(f.price, priceVal > 0 ? '' : t('adm.priceNeeded')),
      msg(f.sub, f.sub.value ? '' : t('adm.nameNeeded'))
    ];
    // a new version of an existing game borrows that game's photo when none is given
    if (!f.img.value && f.game.value && f.game.value !== '__new') {
      const lead = PRODUCTS.find(x => x.game === f.game.value);
      if (lead) f.img.value = lead.img;
    }
    const hasPhoto = !!f.img.value;
    $('#photoMsg', form).textContent = hasPhoto ? '' : t('adm.photoNeeded');
    if (ok.includes(false) || !hasPhoto) { (ok.indexOf(false) >= 0 ? [f.short, f.price, f.sub][ok.indexOf(false)] : $('#photoFile', form).parentElement).focus?.(); return; }

    const x = extras.read();
    if (!x) { toast(t('ax.wait')); return; }   // an upload is still running
    const tags = f.tags.value.split(',').map(s => s.trim()).filter(Boolean);
    const desc = f.desc.value.trim();
    const fields = {
      short, name: f.name.value.trim() || short, price: Math.round(priceVal * 1000) / 1000,
      cat: f.cat.value, sub: f.sub.value, img: f.img.value,
      tags: tags.length ? tags : [subLabel(f.sub.value)],
      badge: f.badge.value.trim() || undefined,
      url: f.url.value.trim() || undefined,
      video: f.videoHd.value.trim() || f.videoSd.value.trim() ? { hd: f.videoHd.value.trim() || undefined, sd: f.videoSd.value.trim() || undefined } : undefined,
      region: f.region.value || undefined, value: f.value.value.trim() || undefined,
      delivery: f.delivery.value || undefined,
      topup: !$('#topupWrap', form).hidden ? f.topup.value : undefined,
      // physical stock: the count, and when it was set (orders since then take from it)
      qty: !$('#qtyWrap', form).hidden && f.qty.value !== '' ? Math.max(0, Math.round(+f.qty.value)) : undefined,
      qtyAt: !$('#qtyWrap', form).hidden && f.qty.value !== '' ? (byId[form.dataset.id]?.qty === Math.max(0, Math.round(+f.qty.value)) ? byId[form.dataset.id]?.qtyAt : Date.now()) : undefined,
      game: f.game.value === '__new' ? (slug(short) || undefined) : (f.game.value || undefined),
      platform: f.platform.value || undefined,
      // an untouched guide stays as it was (a gift card then keeps its brand's text); a cleared one hides it
      guide: f.guide.value.trim() === (byId[form.dataset.id]?.guide || '') ? byId[form.dataset.id]?.guide : f.guide.value.trim(),
      release: f.release.value || '',
      gallery: x.gallery, wall: x.wall, wallBg: x.wallBg, sysreq: x.sysreq,
      redeem: x.redeem.length ? x.redeem : undefined, layout: x.layout, off: x.off.length ? x.off : undefined
    };
    if (x.uploadedVideo) fields.video = { hd: x.uploadedVideo };   // an uploaded video wins over the links
    const id = form.dataset.id;
    if (!id) {                                    // a new product
      const taken = new Set([...Object.keys(byId), ...(loadAdmin().added || []).map(p => p.id)]);
      const pid = freshId(short, taken, 'p');
      change(r => {
        const from = byId[form.dataset.from];      // a duplicate keeps the original's kind and details
        (r.added ??= []).push({ id: pid, kind: from?.kind || 'art', ...fields,
                                specs: from?.specs?.length ? [...from.specs] : [subLabel(fields.sub), 'Instant delivery'],
                                blurb: desc || undefined, custom: !!desc });
      }, t('adm.productAdded'));
    } else {
      const orig = shipped().PRODUCTS.find(p => p.id === id);
      change(r => {
        const added = (r.added || []).find(p => p.id === id);
        const own = desc && desc !== orig?.blurb;
        const patch = { ...fields, blurb: desc || orig?.blurb, custom: own || undefined };
        if (added) Object.assign(added, patch);
        else (r.edited ??= {})[id] = patch;
      }, t('adm.productSaved'));
    }
    keepOnly(refsIn(loadAdmin()));   // uploads no product uses any more are deleted
    go('#/admin/products');
  };
  form.addEventListener('submit', onSubmit);
  return () => { form.removeEventListener('submit', onSubmit); extras.stop(); };
}

function deleteProduct(id) {
  const p = byId[id];
  if (!p || !confirm(t('adm.deleteQ', { name: p.short }))) return false;
  change(r => {
    r.removed = [...new Set([...(r.removed || []), id])];
    for (const k of ['hero', 'drops', 'shelf']) if (r[k]) r[k] = r[k].filter(x => x !== id);
  }, t('adm.deleted'));
  return true;
}

/* ══════════════════════════════════════════════════════════════════════
   Page sections
   ══════════════════════════════════════════════════════════════════════ */
const HOME_SECTIONS = [
  { key: 'hero',   label: 'adm.sec.hero',   title: 'home.trending',     list: () => HERO },
  { key: 'drops',  label: 'adm.sec.drops',  title: 'home.newDrops',     list: () => NEW_DROPS },
  { key: 'shelf',  label: 'adm.sec.shelf',  title: 'home.youMightLike', list: () => PAGE_SECTIONS.shelf, auto: true },
  { key: 'recent', label: 'adm.sec.recent', title: 'home.recent',       note: 'adm.recentD' },
  { key: 'ticker', label: 'adm.sec.ticker', title: 'home.ticker',       list: () => PAGE_SECTIONS.ticker },
  { key: 'flash',  label: 'adm.sec.flash',  title: 'home.flash',        note: 'adm.sec.flashD' },
  { key: 'deals',  label: 'adm.sec.deals',  title: 'home.deals',        note: 'adm.sec.dealsD' },
  { key: 'bundles', label: 'adm.sec.bundles', title: 'home.bundles',    note: 'adm.sec.bundlesD' },
  { key: 'best',   label: 'adm.sec.best',   title: 'home.best',         list: () => PAGE_SECTIONS.best, note: 'adm.sec.bestD' },
  { key: 'promo',  label: 'adm.sec.promo',  title: null,                note: 'adm.sec.promoD' },
  { key: 'calc',   label: 'adm.sec.calc',   title: 'home.calc',         note: 'adm.sec.calcD' },
  { key: 'picks',  label: 'adm.sec.picks',  title: 'home.picks',        list: () => PAGE_SECTIONS.picks },
  { key: 'finder', label: 'adm.sec.finder', title: 'home.finder',       note: 'adm.sec.finderD' },
  { key: 'upcoming', label: 'adm.sec.upcoming', title: 'home.upcoming', note: 'adm.sec.upcomingD' },
  { key: 'rowCards',    label: 'adm.sec.rowCards',    title: 'home.rowCards',    note: 'adm.sec.rowD' },
  { key: 'reviews', label: 'adm.sec.reviews', title: 'home.reviews',    note: 'adm.sec.reviewsD', extra: () => reviewsEditor() },
  { key: 'rowMobile',   label: 'adm.sec.rowMobile',   title: 'home.rowMobile',   note: 'adm.sec.rowD' },
  { key: 'how',    label: 'adm.sec.how',    title: 'home.how',          note: 'adm.sec.howD' },
  { key: 'rowSoftware', label: 'adm.sec.rowSoftware', title: 'home.rowSoftware', note: 'adm.sec.rowD' },
  { key: 'bubble', label: 'adm.sec.bubble', title: null,                note: 'adm.sec.bubbleD' },
  { key: 'whatsapp', label: 'adm.sec.whatsapp', title: null,            note: 'adm.sec.whatsappD', extra: () => whatsappEditor() }
];

/* A product menu grouped by category (for flash sale, bundles and reviews). */
const productOptions = (selected = '', skip = []) => CATEGORIES.filter(c => c.id !== 'all').map(c => `<optgroup label="${esc(catLabel(c.id))}">
  ${PRODUCTS.filter(p => p.cat === c.id && !skip.includes(p.id)).map(p => `<option value="${esc(p.id)}" ${p.id === selected ? 'selected' : ''}>${esc(p.short)} — ${tnd(p.was ?? p.price)}</option>`).join('')}
</optgroup>`).join('');

function reviewsEditor() {
  const list = EXTRAS.reviews || [], g = EXTRAS.google || {};
  return `
    <div class="adm-google">
      <b>${esc(t('adm.g.title'))}</b>
      <p class="hint">${esc(t('adm.g.d'))}</p>
      <div class="field-row">
        <label class="field"><span class="label">${esc(t('adm.g.place'))}</span>
          <input data-change="gPlace" value="${esc(g.placeId || '')}" maxlength="300" dir="ltr" autocomplete="off" spellcheck="false" placeholder="ChIJ…"></label>
        <label class="field"><span class="label">${esc(t('adm.g.key'))}</span>
          <input data-change="gKey" value="${esc(g.key || '')}" maxlength="80" dir="ltr" autocomplete="off" spellcheck="false" placeholder="AIza…"></label>
      </div>
      <ol class="adm-steps">
        <li>${esc(t('adm.g.step1'))} <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener">Place ID Finder ${ICON.out}</a></li>
        <li>${esc(t('adm.g.step2'))} <a href="https://console.cloud.google.com/apis/library/places.googleapis.com" target="_blank" rel="noopener">Google Cloud ${ICON.out}</a></li>
        <li>${esc(t('adm.g.step3'))}</li>
      </ol>
      ${g.placeId && g.key ? `<button type="button" class="btn btn-ghost btn-sm" data-act="gTest">${esc(t('adm.g.test'))}</button>` : ''}
    </div>
    ${list.length ? `<ol class="adm-list adm-reviews">${list.map((r, i) => `<li>
      <span class="txt"><b>${r.source === 'google' ? `<span class="adm-g">Google</span> ` : ''}<span dir="auto">${esc(r.name)}</span> · <span class="adm-stars">${'★'.repeat(r.stars)}</span>${r.when ? ` · ${esc(r.when)}` : ''}${r.product && byId[r.product] ? ` · ${esc(byId[r.product].short)}` : ''}</b><span dir="auto">${esc(r.text)}</span></span>
      <span class="adm-actions">${iconBtn('reviewDelete', t('adm.rev.delete') + ' · ' + r.name, ICON.trash, `data-id="${i}"`)}</span></li>`).join('')}</ol>`
      : `<p class="hint">${esc(t('adm.rev.none'))}</p>`}
    <form class="adm-review-form" data-form="review" novalidate>
      <div class="field-row">
        <label class="field"><span class="label">${esc(t('adm.rev.name'))}</span><input name="rname" maxlength="40" dir="auto" autocomplete="off"></label>
        <label class="field"><span class="label">${esc(t('adm.rev.stars'))}</span>
          <select class="select" name="rstars">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${'★'.repeat(n)} · ${n}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span class="label">${esc(t('adm.rev.text'))}</span><textarea name="rtext" rows="4" maxlength="1000" dir="auto"></textarea></label>
      <div class="field-row">
        <label class="check"><input type="checkbox" name="rgoogle" checked><span>${esc(t('adm.rev.fromGoogle'))}</span></label>
        <label class="field"><span class="label">${esc(t('adm.rev.when'))}</span><input name="rwhen" maxlength="40" dir="auto" placeholder="${esc(t('adm.rev.whenPh'))}"></label>
      </div>
      <p class="hint">${esc(t('adm.rev.googleD'))}</p>
      <label class="field"><span class="label">${esc(t('adm.rev.product'))}</span>
        <select class="select" name="rproduct"><option value="">${esc(t('adm.rev.noProduct'))}</option>${productOptions()}</select></label>
      <button class="btn btn-solid" type="submit">${ICON.plus} ${esc(t('adm.rev.add'))}</button>
    </form>`;
}

const whatsappEditor = () => `
  <label class="field"><span class="label">${esc(t('adm.wa.number'))}</span>
    <input data-change="whatsapp" value="${esc(EXTRAS.whatsapp || '')}" inputmode="tel" maxlength="20" dir="ltr" placeholder="21658578111"></label>
  <p class="hint">${esc(t('adm.wa.d'))}</p>`;
const PDP_SECTIONS = [['pdp.how', 'adm.sec.how'], ['pdp.details', 'adm.sec.details'], ['pdp.related', 'adm.sec.related']];

const productPicker = (key, ids) => `
  <select class="select adm-picker" data-change="listAdd" data-key="${key}" aria-label="${esc(t('adm.addToList'))}">
    <option value="" hidden>${esc(t('adm.addToList'))}</option>
    ${CATEGORIES.filter(c => c.id !== 'all').map(c => `<optgroup label="${esc(catLabel(c.id))}">
      ${PRODUCTS.filter(p => p.cat === c.id && !ids.includes(p.id)).map(p => `<option value="${esc(p.id)}">${esc(p.short)} — ${tnd(p.price)}</option>`).join('')}
    </optgroup>`).join('')}
  </select>`;

function sectionsTab() {
  const titleInputs = (key, fallback) => `<div class="adm-names">${LANG_IDS.map(l => `
    <label class="field"><span class="label">${esc(t('adm.titleLabel'))} · ${l.toUpperCase()}</span>
      <input data-change="title" data-key="${key}" data-lang="${l}" value="${esc(PAGE_SECTIONS.titles[key]?.[l] || '')}"
             placeholder="${esc(tIn(l, fallback))}" ${l === 'ar' ? 'dir="rtl"' : 'dir="ltr"'}></label>`).join('')}</div>`;
  const home = HOME_SECTIONS.map(s => {
    const ids = s.list ? listed(s.list()).map(p => p.id) : [];
    return `
    <section class="card adm-card" data-section="${s.key}">
      <div class="set-row adm-sec-head"><div><b>${esc(t(s.label))}</b><p>${esc(t(s.note || (s.list ? 'adm.listD' : 'adm.show')))}</p></div>
        ${toggle(`data-change="show" data-key="${s.key}"`, !PAGE_SECTIONS.hidden[s.key], t('adm.show'))}</div>
      ${s.title ? titleInputs(s.key, s.title) : ''}
      ${s.extra ? s.extra() : ''}
      ${s.list ? `
        ${s.auto && !ids.length ? `<p class="hint">${esc(t('adm.auto'))}</p>` : ''}
        <ol class="adm-list">${ids.map((id, i) => { const p = byId[id]; return `
          <li>${media(p, 'thumb')}<span class="txt"><b>${esc(p.short)}</b><span>${tnd(p.price)}</span></span>
            <span class="adm-actions">
              ${iconBtn('listUp', t('adm.up'), ICON.up, `data-key="${s.key}" data-id="${esc(id)}" ${i === 0 ? 'disabled' : ''}`)}
              ${iconBtn('listDown', t('adm.down'), `<span class="flip">${ICON.up}</span>`, `data-key="${s.key}" data-id="${esc(id)}" ${i === ids.length - 1 ? 'disabled' : ''}`)}
              ${iconBtn('listRemove', t('adm.remove') + ' ' + p.short, ICON.trash, `data-key="${s.key}" data-id="${esc(id)}"`)}
            </span></li>`; }).join('')}</ol>
        ${productPicker(s.key, ids)}` : ''}
    </section>`;
  }).join('');
  const pdp = `
    <section class="card adm-card">
      ${PDP_SECTIONS.map(([key, label]) => `
        <div class="set-row"><div><b>${esc(t(label))}</b></div>${toggle(`data-change="show" data-key="${key}"`, !PAGE_SECTIONS.hidden[key], t(label))}</div>`).join('')}
    </section>`;
  return `
    <div class="adm-sec-group"><h2>${esc(t('adm.home'))}</h2><a class="see-all" href="#/">${esc(t('adm.preview'))} ${ICON.out}</a></div>
    ${home}
    <div class="adm-sec-group"><h2>${esc(t('adm.pdp'))}</h2></div>
    ${pdp}`;
}

/** The list a section shows, as the record stores it (starting from what's live). */
const listOf = (r, key) => (r[key] ??= key === 'hero' ? [...HERO] : key === 'drops' ? [...NEW_DROPS] : [...(PAGE_SECTIONS[key] || [])]);

/* ══════════════════════════════════════════════════════════════════════
   Overview — the store at a glance: four stat cards, sales per day,
   best sellers. Built from the store's own orders and catalogue.
   ══════════════════════════════════════════════════════════════════════ */
/* Feather icons (MIT), drawn the same way as the rest of the store's icons */
const fi = (d, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const FI = {
  overview: fi('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
  layers: fi('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
  package: fi('<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
  layout: fi('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>'),
  dollar: fi('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', 20),
  bag: fi('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>', 20),
  box: fi('<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>', 20),
  folder: fi('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', 20),
  up: fi('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>', 14),
  down: fi('<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>', 14),
  download: fi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', 16),
  upload: fi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', 16),
  reset: fi('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>', 16)
};

const DAY = 864e5;
const dayStart = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
const locale = () => langInfo().locale;
const fmtNum = n => n.toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 2 });
const fmtDT = n => (lang() === 'ar' ? `${fmtNum(n)} د.ت` : `${fmtNum(n)} DT`);
const shortDate = ts => new Date(ts).toLocaleDateString(locale(), { day: 'numeric', month: 'short', numberingSystem: 'latn' });

/** Revenue and orders now vs the 30 days before, sales per day, best sellers. */
function storeStats() {
  const today = dayStart(Date.now()), from = today - 29 * DAY, prevFrom = from - 30 * DAY;
  const orders = allOrders().filter(o => o.status !== 'cancelled');
  const inRange = (o, a, b) => o.date >= a && o.date < b;
  const cur = orders.filter(o => inRange(o, from, today + DAY)), prev = orders.filter(o => inRange(o, prevFrom, from));
  const sum = list => Math.round(list.reduce((s, o) => s + orderTotal(o), 0) * 1000) / 1000;
  const days = Array.from({ length: 30 }, (_, i) => ({ t: from + i * DAY, v: 0, n: 0 }));
  for (const o of cur) { const d = days[Math.floor((dayStart(o.date) - from) / DAY)]; if (d) { d.v += orderTotal(o); d.n++; } }
  days.forEach(d => { d.v = Math.round(d.v * 1000) / 1000; });
  const units = {};
  for (const o of orders) for (const [id, q] of o.items) {
    const p = byId[id]; if (!p) continue;
    (units[id] ??= { p, q: 0, v: 0 }); units[id].q += q; units[id].v += p.price * q;
  }
  const best = Object.values(units).sort((a, b) => b.v - a.v).slice(0, 5);
  const r = loadAdmin();
  return {
    revenue: sum(cur), revenuePrev: sum(prev), orders: cur.length, ordersPrev: prev.length,
    products: PRODUCTS.length, added: (r.added || []).filter(p => isListed(p.id)).length,
    cats: CATEGORIES.filter(c => c.id !== 'all').length, subs: CATEGORIES.reduce((n, c) => n + (c.subs?.length || 0), 0),
    days, best
  };
}

/** "+18%" against the previous 30 days; "New" when there was nothing before. */
function delta(now, before) {
  if (!before && !now) return `<span class="st-delta flat">${esc(t('adm.st.flat'))}</span>`;
  if (!before) return `<span class="st-delta up">${FI.up}<b>${esc(t('adm.new'))}</b> ${esc(t('adm.st.vsPrev'))}</span>`;
  const pct = Math.round(((now - before) / before) * 100);
  const dir = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '±';
  return `<span class="st-delta ${dir}">${dir === 'down' ? FI.down : dir === 'up' ? FI.up : ''}<b dir="ltr">${sign}${Math.abs(pct)}%</b> ${esc(t('adm.st.vsPrev'))}</span>`;
}

const statTile = (icon, label, value, foot) => `
  <article class="card stat-tile">
    <span class="st-icon">${icon}</span>
    <p class="st-label">${esc(label)}</p>
    <p class="st-value" dir="ltr">${value}</p>
    <p class="st-foot">${foot}</p>
  </article>`;

/** Sales per day as a thin line over a recessive grid (single series: the title names it). */
function salesChart(days) {
  const W = 720, H = 220, L = 46, R = 12, T = 14, B = 30;
  const max = Math.max(...days.map(d => d.v));
  const step = max <= 0 ? 100 : Math.pow(10, Math.floor(Math.log10(max))) * (max / Math.pow(10, Math.floor(Math.log10(max))) > 5 ? 2 : 1);
  const top = max <= 0 ? 300 : Math.ceil(max / step) * step;
  const x = i => L + (i * (W - L - R)) / (days.length - 1);
  const y = v => T + (1 - v / top) * (H - T - B);
  const ticks = [0, top / 3, (2 * top) / 3, top].map(v => Math.round(v));
  const pts = days.map((d, i) => `${x(i).toFixed(1)},${y(d.v).toFixed(1)}`);
  const area = `M${x(0)},${y(0)} L${pts.join(' L')} L${x(days.length - 1)},${y(0)} Z`;
  const empty = days.every(d => !d.v);
  return `
    <div class="chart" id="salesChart" dir="ltr" tabindex="0" role="img"
         aria-label="${esc(t('adm.chart.title'))}: ${esc(fmtDT(days.reduce((s, d) => s + d.v, 0)))}">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        ${ticks.map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}
        <path class="area" d="${area}"/>
        <polyline class="line" points="${pts.join(' ')}"/>
        <line class="cross" x1="0" x2="0" y1="${T}" y2="${H - B}" hidden/>
        <circle class="dot" r="4.5" cx="0" cy="0" hidden/>
      </svg>
      <div class="chart-y">${ticks.map(v => `<span style="top:${(y(v) / H) * 100}%">${fmtNum(v)}</span>`).join('')}</div>
      <div class="chart-x">${days.map((d, i) => ((i % 7 === 0 && i < days.length - 4) || i === days.length - 1) ? `<span style="left:${(x(i) / W) * 100}%">${esc(shortDate(d.t))}</span>` : '').join('')}</div>
      <div class="chart-tip" hidden></div>
      ${empty ? `<p class="chart-empty">${esc(t('adm.chart.empty'))}</p>` : ''}
    </div>
    <details class="chart-table">
      <summary>${esc(t('adm.chart.table'))}</summary>
      <table>
        <thead><tr><th scope="col">${esc(t('adm.chart.date'))}</th><th scope="col">${esc(t('adm.chart.orders'))}</th><th scope="col">${esc(t('adm.chart.sales'))}</th></tr></thead>
        <tbody>${days.filter(d => d.v).map(d => `<tr><td>${esc(shortDate(d.t))}</td><td>${d.n}</td><td>${esc(fmtDT(d.v))}</td></tr>`).join('') ||
          `<tr><td colspan="3">${esc(t('adm.chart.empty'))}</td></tr>`}</tbody>
      </table>
    </details>`;
}

function overviewTab() {
  const s = storeStats();
  const out = PRODUCTS.filter(p => stockState(p.id) === 'out').length;
  return `
    ${out ? `<p class="key-waiting ov-alert">${ICON.clock}<span>${esc(t('adm.k.alert', { n: out }))}</span>
      <a class="btn btn-ghost btn-sm" href="#/admin/keys">${esc(t('adm.k.alertLink'))}</a></p>` : ''}
    <div class="stat-grid">
      ${statTile(FI.dollar, t('adm.st.revenue'), esc(fmtDT(s.revenue)), delta(s.revenue, s.revenuePrev))}
      ${statTile(FI.bag, t('adm.st.orders'), fmtNum(s.orders), delta(s.orders, s.ordersPrev))}
      ${statTile(FI.box, t('adm.st.products'), fmtNum(s.products),
        `<span class="st-delta ${s.added ? 'up' : 'flat'}">${s.added ? FI.up : ''}${esc(s.added ? t('adm.st.added', { n: s.added }) : t('adm.st.catalogue'))}</span>`)}
      ${statTile(FI.folder, t('adm.st.categories'), fmtNum(s.cats), `<span class="st-delta flat">${esc(plural('subs', s.subs))}</span>`)}
    </div>
    <div class="ov-row">
      <section class="card adm-card ov-chart">
        <div class="ov-head"><h2>${esc(t('adm.chart.title'))}</h2><span class="hint">${esc(t('adm.st.last30'))}</span></div>
        ${salesChart(s.days)}
      </section>
      <section class="card adm-card ov-best">
        <h2>${esc(t('adm.best'))}</h2>
        ${s.best.length ? `<ol class="best-list">${s.best.map(({ p, q, v }) => `
          <li><a href="#/admin/product/${esc(p.id)}">${media(p, 'thumb')}<span class="txt"><b>${esc(p.short)}</b><span>${esc(t('adm.sold', { n: q }))}</span></span><em dir="ltr">${esc(fmtDT(v))}</em></a></li>`).join('')}</ol>`
          : `<p class="hint">${esc(t('adm.best.none'))}</p>`}
      </section>
    </div>`;
}

/** Crosshair + tooltip on hover, arrow keys when the chart has focus. */
function mountChart(el) {
  const box = $('#salesChart', el);
  if (!box) return () => {};
  const days = storeStats().days, svg = $('svg', box), tip = $('.chart-tip', box);
  const cross = $('.cross', svg), dot = $('.dot', svg), line = $('.line', svg);
  const pts = line.getAttribute('points').split(' ').map(p => p.split(',').map(Number));
  const W = svg.viewBox.baseVal.width, H = svg.viewBox.baseVal.height;
  let idx = -1;
  const show = i => {
    idx = Math.max(0, Math.min(days.length - 1, i));
    const [px, py] = pts[idx];
    cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.hidden = false;
    dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.hidden = false;
    const d = days[idx];
    tip.innerHTML = `<b>${esc(shortDate(d.t))}</b><span>${esc(fmtDT(d.v))}</span><small>${esc(plural('orders', d.n))}</small>`;
    tip.hidden = false;
    const left = (px / W) * box.clientWidth, w = tip.offsetWidth;
    tip.style.left = `${Math.max(0, Math.min(box.clientWidth - w, left - w / 2))}px`;
    tip.style.top = `${Math.max(0, (py / H) * box.clientHeight - tip.offsetHeight - 14)}px`;
  };
  const hide = () => { cross.hidden = dot.hidden = tip.hidden = true; idx = -1; };
  const move = e => {
    const r = svg.getBoundingClientRect(), vx = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach(([px], i) => { if (Math.abs(px - vx) < Math.abs(pts[best][0] - vx)) best = i; });
    show(best);
  };
  const key = e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx < 0 ? days.length - 1 : idx + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx < 0 ? days.length - 1 : idx - 1); }
    if (e.key === 'Escape') hide();
  };
  box.addEventListener('pointermove', move);
  box.addEventListener('pointerleave', hide);
  box.addEventListener('keydown', key);
  box.addEventListener('blur', hide);
  return () => { box.removeEventListener('pointermove', move); box.removeEventListener('pointerleave', hide); box.removeEventListener('keydown', key); };
}

/* ══════════════════════════════════════════════════════════════════════
   The page
   ══════════════════════════════════════════════════════════════════════ */
const TABS = ['overview', 'orders', 'chats', 'categories', 'products', 'keys', 'promos', 'sections', 'store', 'texts'];
const TAB_ICON = { overview: FI.overview, categories: FI.layers, products: FI.package, sections: FI.layout };
/* ══════════════════════════════════════════════════════════════════════
   Keys & stock — paste each product's keys; paid orders take them in order
   ══════════════════════════════════════════════════════════════════════ */
FI.key = fi('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>');
FI.keyBig = fi('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>', 20);
FI.check = fi('<polyline points="20 6 9 17 4 12"/>', 20);
FI.alert = fi('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', 20);
FI.slash = fi('<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>', 20);
TAB_ICON.keys = FI.key;
TAB_ICON.chats = fi('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.6-5.2A8.4 8.4 0 1 1 21 11.5z"/>');

/* ══════════════════════════════════════════════════════════════════════
   Promotions — the home page's promo banner and its checkout code, and the
   products on sale (their sale price applies everywhere until the end date)
   ══════════════════════════════════════════════════════════════════════ */
FI.tag = fi('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>');
TAB_ICON.promos = FI.tag;
const promoOf = r => (r.promo ??= clone(PROMO));
const salesOf = r => (r.sales ??= clone(SALES));
const faqOf = r => ((r.faq ??= {})[faqLang] ??= clone(faq(faqLang)));
const bundlesOf = r => (r.bundles ??= clone(BUNDLES));
const flashOf = r => (r.flash ??= clone(FLASH));
const reviewsOf = r => (r.reviews ??= clone(EXTRAS.reviews || []));
const inDays = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10) + 'T23:59:00'; };

function promosTab() {
  const pr = PROMO;
  const langFields = (f, label, max, area = false) => `<div class="adm-names">${LANG_IDS.map(l => `
    <label class="field"><span class="label">${esc(label)} · ${l.toUpperCase()}</span>
      ${area ? `<textarea data-change="promoText" data-field="${f}" data-lang="${l}" rows="3" maxlength="${max}" ${l === 'ar' ? 'dir="rtl"' : 'dir="ltr"'}>${esc(pr[f]?.[l] || '')}</textarea>`
             : `<input data-change="promoText" data-field="${f}" data-lang="${l}" maxlength="${max}" value="${esc(pr[f]?.[l] || '')}" ${l === 'ar' ? 'dir="rtl"' : 'dir="ltr"'}>`}
    </label>`).join('')}</div>`;
  const links = [['deals', t('adm.promo.linkDeals')], ...CATEGORIES.filter(c => c.id !== 'all').map(c => [`#/shop/${c.id}`, catLabel(c.id)])];
  const arts = PRODUCTS.filter(p => p.banner || (HERO.includes(p.id) || !/-\d+$/.test(p.id)) && p.cat === 'games');
  const plainSel = (change, label, opts, value) => `
    <label class="field"><span class="label">${esc(label)}</span>
      <select class="select" data-change="${change}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const sales = Object.entries(SALES).filter(([id]) => byId[id]);
  const now = Date.now();
  return `
    <section class="card adm-card">
      <div class="set-row adm-sec-head"><div><b>${esc(t('adm.promo.title'))}</b><p>${esc(t('adm.promo.d'))}</p></div>
        ${toggle('data-change="promoOn"', pr.on !== false, t('adm.promo.show'))}</div>
      ${langFields('title', t('adm.promo.headline'), 60)}
      ${langFields('text', t('adm.promo.text'), 220, true)}
      ${langFields('cta', t('adm.promo.cta'), 30)}
      <div class="field-row">
        ${plainSel('promoLink', t('adm.promo.link'), links, pr.link || 'deals')}
        ${plainSel('promoArt', t('adm.promo.art'), arts.map(p => [p.id, p.short]), pr.art)}
      </div>
      <div class="field-row">
        <label class="field"><span class="label">${esc(t('adm.promo.code'))}</span>
          <input data-change="promoCode" value="${esc(pr.code || '')}" maxlength="20" autocapitalize="characters" dir="ltr" placeholder="TECH10"></label>
        <label class="field"><span class="label">${esc(t('adm.promo.codePct'))}</span>
          <input data-change="promoCodePct" type="number" min="0" max="90" step="1" inputmode="numeric" value="${esc(pr.codePct ?? 0)}" dir="ltr"></label>
      </div>
      <p class="hint">${esc(t('adm.promo.codeD'))}</p>
    </section>

    <section class="card adm-card">
      <div class="adm-sec-head"><div><b>${esc(t('adm.flash.title'))}</b><p>${esc(t('adm.flash.d'))}</p></div></div>
      <div class="field-row">
        <label class="field"><span class="label">${esc(t('adm.flash.product'))}</span>
          <select class="select" data-change="flashProduct">${FLASH.id ? '' : `<option value="" selected hidden>${esc(t('adm.flash.pick'))}</option>`}${productOptions(FLASH.id)}</select></label>
        <label class="field"><span class="label">${esc(t('adm.flash.pct'))}</span>
          <input data-change="flashPct" type="number" min="1" max="90" step="1" inputmode="numeric" value="${esc(FLASH.pct ?? 30)}" dir="ltr"></label>
      </div>
      ${byId[FLASH.id] ? (() => { const p = byId[FLASH.id], base = p.was ?? p.price; return `<p class="hint">${esc(p.short)}: ${tnd(base)} → <strong>${tnd(salePrice(base, FLASH.pct))}</strong> · ${esc(t(PAGE_SECTIONS.hidden.flash ? 'adm.flash.off' : 'adm.flash.on'))}</p>`; })() : ''}
    </section>

    <section class="card adm-card">
      <div class="set-row adm-sec-head"><div><b>${esc(t('adm.bundles.title'))}</b><p>${esc(t('adm.bundles.d'))}</p></div>
        <button type="button" class="btn btn-ghost btn-sm" data-act="bundleNew">${ICON.plus} ${esc(t('adm.bundles.new'))}</button></div>
      ${BUNDLES.length ? BUNDLES.map(b => {
        const items = b.items.filter(id => byId[id]), full = items.reduce((s, id) => s + byId[id].price, 0);
        return `<div class="adm-bundle">
          <div class="adm-names">${LANG_IDS.map(l => `<label class="field"><span class="label">${esc(t('adm.bundles.name'))} · ${l.toUpperCase()}</span>
            <input data-change="bundleName" data-id="${esc(b.id)}" data-lang="${l}" maxlength="60" value="${esc(b.name?.[l] || '')}" ${l === 'ar' ? 'dir="rtl"' : 'dir="ltr"'}></label>`).join('')}</div>
          <ol class="adm-list">${items.map(id => { const p = byId[id]; return `<li>${media(p, 'thumb')}<span class="txt"><b>${esc(p.short)}</b><span>${tnd(p.price)}</span></span>
            <span class="adm-actions">${iconBtn('bundleItemRemove', t('adm.remove') + ' ' + p.short, ICON.trash, `data-id="${esc(b.id)}" data-key="${esc(id)}"`)}</span></li>`; }).join('')}</ol>
          <div class="adm-bundle-row">
            <select class="select adm-picker" data-change="bundleItemAdd" data-id="${esc(b.id)}" aria-label="${esc(t('adm.bundles.addItem'))}">
              <option value="" hidden>${esc(t('adm.bundles.addItem'))}</option>${productOptions('', b.items)}</select>
            <label class="adm-mini"><span>${esc(t('adm.bundles.pct'))}</span><input type="number" min="1" max="90" step="1" inputmode="numeric" value="${b.pct}" data-change="bundlePct" data-id="${esc(b.id)}" dir="ltr"></label>
          </div>
          <p class="hint">${items.length < 2 ? esc(t('adm.bundles.need2')) : `${tnd(full)} → <strong>${tnd(Math.round(full * (100 - b.pct) * 10) / 1000)}</strong>`}</p>
          <button type="button" class="btn btn-ghost btn-sm adm-danger" data-act="bundleDelete" data-id="${esc(b.id)}">${ICON.trash} ${esc(t('adm.bundles.delete'))}</button>
        </div>`; }).join('') : `<p class="hint">${esc(t('adm.bundles.none'))}</p>`}
    </section>

    <section class="card adm-card">
      <div class="adm-sec-head"><div><b>${esc(t('adm.sales.title'))}</b><p>${esc(t('adm.sales.d'))}</p></div></div>
      ${sales.length ? `<ol class="adm-list adm-sales">${sales.map(([id, s]) => {
        const p = byId[id], base = p.was ?? p.price, over = s.until && Date.parse(s.until) <= now;
        return `<li class="${over ? 'is-over' : ''}">${media(p, 'thumb')}
          <span class="txt"><b>${esc(p.short)}</b><span>${tnd(base)} → <strong>${tnd(salePrice(base, s.pct))}</strong>${over ? ` · ${esc(t('deal.over'))}` : ''}</span></span>
          <label class="adm-mini"><span>${esc(t('adm.sales.pct'))}</span><input type="number" min="1" max="90" step="1" inputmode="numeric" value="${s.pct}" data-change="salePct" data-id="${esc(id)}" dir="ltr"></label>
          <label class="adm-mini"><span>${esc(t('adm.sales.until'))}</span><input type="date" value="${esc((s.until || '').slice(0, 10))}" data-change="saleUntil" data-id="${esc(id)}" dir="ltr"></label>
          ${iconBtn('saleRemove', t('adm.sales.remove') + ' · ' + p.short, ICON.trash, `data-id="${esc(id)}"`)}</li>`; }).join('')}</ol>`
        : `<p class="hint">${esc(t('adm.sales.none'))}</p>`}
      <select class="select adm-picker" data-change="saleAdd" aria-label="${esc(t('adm.sales.add'))}">
        <option value="" hidden>${esc(t('adm.sales.add'))}</option>
        ${CATEGORIES.filter(c => c.id !== 'all').map(c => `<optgroup label="${esc(catLabel(c.id))}">
          ${PRODUCTS.filter(p => p.cat === c.id && !SALES[p.id]).map(p => `<option value="${esc(p.id)}">${esc(p.short)} — ${tnd(p.price)}</option>`).join('')}
        </optgroup>`).join('')}
      </select>
    </section>`;
}


/* ══════════════════════════════════════════════════════════════════════
   Orders — every order, its customer and total; the owner sets the status
   ══════════════════════════════════════════════════════════════════════ */
FI.store = fi('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>');
FI.type = fi('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>');
FI.clock = fi('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', 20);
TAB_ICON.orders = FI.bag;
TAB_ICON.store = FI.store;
TAB_ICON.texts = FI.type;
const ORDER_STATES = ['processing', 'shipped', 'delivered', 'cancelled'];
let orderFilter = 'all', orderQuery = '';

function ordersTab() {
  const all = allOrders(), q = orderQuery.trim().toLowerCase();
  const list = all.filter(o => (orderFilter === 'all' || o.status === orderFilter)
    && (!q || `${o.id} ${o.contact?.name || ''} ${o.contact?.email || ''} ${o.contact?.phone || ''}`.toLowerCase().includes(q)));
  const count = s => all.filter(o => o.status === s).length;
  const paid = all.filter(o => o.status !== 'cancelled').reduce((s, o) => s + orderTotal(o), 0);
  const chip = (id, label) => `<button type="button" class="fchip" data-act="orderFilter" data-id="${id}" ${orderFilter === id ? 'aria-current="true"' : ''}>${esc(label)}</button>`;
  return `
    <div class="stat-grid">
      ${statTile(FI.bag, t('adm.or.all'), fmtNum(all.length), '')}
      ${statTile(FI.clock, t('st.processing'), fmtNum(count('processing')), '')}
      ${statTile(FI.check, t('st.delivered'), fmtNum(count('delivered')), '')}
      ${statTile(FI.dollar, t('adm.or.paid'), esc(fmtDT(Math.round(paid * 1000) / 1000)), '')}
    </div>
    <div class="adm-toolbar">
      <label class="search-field">${ICON.search.replace('width="34" height="34"', 'width="16" height="16"')}
        <input type="search" id="orderSearch" value="${esc(orderQuery)}" placeholder="${esc(t('adm.or.search'))}" aria-label="${esc(t('adm.or.search'))}"></label>
      <div class="chip-row">${chip('all', t('adm.k.all'))}${ORDER_STATES.map(s => chip(s, t('st.' + s))).join('')}</div>
    </div>
    ${list.length ? `<ol class="adm-list adm-orders">${list.map(o => `<li data-order="${esc(o.id)}">
      <span class="txt"><b><a href="#/order/${esc(o.id)}">${esc(o.id)}</a> · ${esc(fmtDate(o.date))}</b>
        <span>${esc(o.contact?.name || t('adm.or.guest'))}${o.contact?.email ? ` · <span dir="ltr">${esc(o.contact.email)}</span>` : ''} · ${esc(plural('items', orderCount(o)))} · ${esc(payLabel(o.payment))}</span></span>
      <b class="adm-order-total">${tnd(orderTotal(o))}</b>
      <select class="select adm-status st-${esc(o.status)}" data-change="orderStatus" data-id="${esc(o.id)}" aria-label="${esc(t('adm.or.status', { id: o.id }))}">
        ${ORDER_STATES.filter(s => s !== 'shipped' || o.ship).map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${esc(t('st.' + s))}</option>`).join('')}</select>
      ${o.ship ? `<div class="adm-ship">
        <p class="hint">${ICON.box} <b>${esc(t('ship.' + o.ship.method))}</b> · <span dir="auto">${esc(o.ship.method === 'pickup' ? (SHIPPING.pickup.address || STORE.address)
          : [o.ship.address.line, [o.ship.address.zip, o.ship.address.city].filter(Boolean).join(' '), o.ship.address.gov || o.ship.address.region, o.ship.address.country].filter(Boolean).join(', '))}</span>
          ${o.contact?.phone ? ` · <span dir="ltr">${esc(o.contact.phone)}</span>` : ''}${o.ship.address.notes ? ` · <i dir="auto">${esc(o.ship.address.notes)}</i>` : ''}</p>
        ${o.ship.method === 'pickup' ? '' : `<div class="adm-bundle-row">
          <label class="adm-mini"><span>${esc(t('adm.or.carrier'))}</span><input data-change="orderTrack" data-id="${esc(o.id)}" data-key="carrier" value="${esc(ORDER_TRACK[o.id]?.carrier || '')}" maxlength="40" placeholder="Aramex, Rapid Poste…" dir="auto"></label>
          <label class="adm-mini"><span>${esc(t('adm.or.tracking'))}</span><input data-change="orderTrack" data-id="${esc(o.id)}" data-key="number" value="${esc(ORDER_TRACK[o.id]?.number || '')}" maxlength="60" dir="ltr"></label>
        </div>`}</div>` : ''}
    </li>`).join('')}</ol>` : `<p class="hint">${esc(t('adm.or.none'))}</p>`}
    <p class="demo-note">${ICON.shield}<span>${esc(t('adm.or.note'))}</span></p>`;
}

/* ══════════════════════════════════════════════════════════════════════
   Store settings — name, contact details, opening hours, the store's
   colour, payment methods and their fees, and the help page's questions
   ══════════════════════════════════════════════════════════════════════ */
let faqLang = 'en', legalPage = 'terms';
const textFields = (key, label, { max = 160, area = false } = {}) => `<div class="adm-names">${LANG_IDS.map(l => {
  const attrs = `data-change="text" data-key="${esc(key)}" data-lang="${l}" maxlength="${max}" placeholder="${esc(tIn(l, key))}" ${l === 'ar' ? 'dir="rtl"' : 'dir="ltr"'}`;
  const val = TEXTS[key]?.[l] || '';
  return `<label class="field"><span class="label">${esc(label)} · ${l.toUpperCase()}</span>
    ${area ? `<textarea ${attrs} rows="3">${esc(val)}</textarea>` : `<input ${attrs} value="${esc(val)}">`}</label>`;
}).join('')}</div>`;

function storeTab() {
  // load today's rates for the Currencies card; redraw once if they were out of date
  refreshRates().then(ok => { if (ok && location.hash.startsWith('#/admin/store') && !document.activeElement?.matches('input, textarea, select')) go(location.hash); });
  const hours = Object.fromEntries(STORE.hours);
  const faqList = faq(faqLang);
  const own = !!FAQ_OVR[faqLang]?.length;
  return `
    <section class="card adm-card">
      <div class="adm-sec-head"><div><b>${esc(t('adm.sto.details'))}</b><p>${esc(t('adm.sto.detailsD'))}</p></div></div>
      ${textFields('brand', t('adm.sto.name'), { max: 60 })}
      <div class="field-row">
        <label class="field"><span class="label">${esc(t('adm.sto.phone'))}</span><input data-change="storeField" data-key="phone" value="${esc(STORE.phone)}" inputmode="tel" maxlength="30" dir="ltr"></label>
        <label class="field"><span class="label">${esc(t('adm.sto.email'))}</span><input data-change="storeField" data-key="email" type="email" value="${esc(STORE.email)}" maxlength="120" dir="ltr"></label>
      </div>
      ${textFields('store.address', t('adm.sto.address'))}
      <div class="field-row three">${['legalName', 'regNo', 'taxId'].map(k => `
        <label class="field"><span class="label">${esc(t('adm.sto.' + k))}</span><input data-change="storeField" data-key="${k}" value="${esc(STORE[k] || '')}" maxlength="80" dir="auto"></label>`).join('')}</div>
      <div class="field-row three">${['day.week', 'day.sat', 'day.sun'].map(d => `
        <label class="field"><span class="label">${esc(t('adm.sto.hours'))} · ${esc(t(d))}</span><input data-change="storeHours" data-key="${d}" value="${esc(hours[d] || '')}" maxlength="40" dir="ltr" placeholder="9:00 – 20:00"></label>`).join('')}</div>
    </section>

    <section class="card adm-card">
      <div class="adm-sec-head"><div><b>${esc(t('adm.sto.colour'))}</b><p>${esc(t('adm.sto.colourD'))}</p></div></div>
      <div class="adm-swatches">${ACCENTS.map(a => `<button type="button" class="adm-swatch" data-act="siteAccent" data-id="${a.value}" style="--c:${a.value}" aria-pressed="${(SITE.accent || ACCENTS[0].value) === a.value}" aria-label="${esc(t('acc.' + a.id))}" title="${esc(t('acc.' + a.id))}"></button>`).join('')}
        <label class="adm-swatch adm-swatch-custom" title="${esc(t('adm.sto.custom'))}"><input type="color" data-change="siteAccent" value="${esc(SITE.accent || ACCENTS[0].value)}" aria-label="${esc(t('adm.sto.custom'))}"></label></div>
    </section>

    <section class="card adm-card">
      <div class="adm-sec-head"><div><b>${esc(t('adm.pay.title'))}</b><p>${esc(t('adm.pay.d'))}</p></div></div>
      ${METHODS_SHIPPED.map(m => { const fee = PAYMENT_FEES[m] || {}, kind = fee.flat !== undefined && fee.pct === undefined ? 'flat' : 'pct'; return `
        <div class="adm-pay" data-pay="${m}">
          <div class="set-row"><div><b>${esc(t('pay.' + m))}</b><p>${esc(t('pay.' + m + 'D'))}</p></div>
            ${toggle(`data-change="payOn" data-key="${m}"`, PAYMENT_METHODS.includes(m), t('adm.pay.on'))}</div>
          <div class="adm-bundle-row">
            <label class="adm-mini"><span>${esc(t('adm.pay.feeType'))}</span>
              <select class="select" data-change="payFeeType" data-key="${m}"><option value="pct" ${kind === 'pct' ? 'selected' : ''}>%</option><option value="flat" ${kind === 'flat' ? 'selected' : ''}>DT</option></select></label>
            <label class="adm-mini"><span>${esc(t('adm.pay.fee'))}</span>
              <input type="number" min="0" max="${kind === 'pct' ? 50 : 1000}" step="0.1" inputmode="decimal" value="${esc(fee[kind] ?? 0)}" data-change="payFee" data-key="${m}" dir="ltr"></label>
          </div>
          ${textFields('pay.' + m, t('adm.pay.name'), { max: 60 })}
        </div>`; }).join('')}
    </section>

    <section class="card adm-card adm-shipping">
      <div class="adm-sec-head"><div><b>${esc(t('adm.ship.title'))}</b><p>${esc(t('adm.ship.d'))}</p></div></div>
      ${['tn', 'express', 'intl', 'pickup'].map(m => { const s = SHIPPING[m]; return `
        <div class="adm-pay" data-ship="${m}">
          <div class="set-row"><div><b>${esc(t('ship.' + m))}</b></div>${toggle(`data-change="shipOn" data-key="${m}"`, s.on, t('adm.ship.on'))}</div>
          ${m === 'pickup' ? `<label class="field"><span class="label">${esc(t('adm.ship.address'))}</span><input data-change="shipText" data-key="pickup" data-f="address" value="${esc(s.address || '')}" maxlength="160" placeholder="${esc(STORE.address)}" dir="auto"></label>` : `
          <div class="adm-bundle-row">
            <label class="adm-mini"><span>${esc(t('adm.ship.fee'))}</span><input type="number" min="0" step="0.5" inputmode="decimal" value="${esc(s.fee)}" data-change="shipNum" data-key="${m}" data-f="fee" dir="ltr"></label>
            <label class="adm-mini"><span>${esc(t('adm.ship.free'))}</span><input type="number" min="0" step="1" inputmode="decimal" value="${esc(s.free)}" data-change="shipNum" data-key="${m}" data-f="free" dir="ltr"></label>
            <label class="adm-mini"><span>${esc(t('adm.ship.days'))}</span><input value="${esc(s.days)}" data-change="shipText" data-key="${m}" data-f="days" maxlength="40" dir="auto"></label>
          </div>
          ${m === 'intl' ? `<label class="field"><span class="label">${esc(t('adm.ship.countries'))}</span><input data-change="shipCountries" value="${esc((s.countries || []).join(', '))}" dir="ltr" autocapitalize="characters" placeholder="FR, DZ, LY, DE"></label>` : ''}`}
        </div>`; }).join('')}
    </section>

    <section class="card adm-card">
      <div class="adm-sec-head"><div><b>${esc(t('adm.cur.title'))}</b><p>${esc(t('adm.cur.d'))}</p></div></div>
      <div class="adm-cur-bar"><p class="hint">${esc(t('adm.cur.source'))}</p>
        <button type="button" class="btn btn-ghost btn-sm" data-act="curRefresh">${esc(t('adm.cur.refresh'))}</button></div>
      <ol class="adm-list adm-cur">${Object.entries(CURRENCY_RATES).map(([c, r]) => { const manual = RATE_MANUAL.includes(c), lv = liveRate(c); return `<li>
        <span class="txt"><b>${esc(c)}</b><span>${esc((() => { try { return new Intl.DisplayNames([langInfo().locale], { type: 'currency' }).of(c); } catch { return c; } })())}</span>
          <small class="cur-live${lv && !manual ? ' on' : ''}" dir="auto">${esc(lv ? t('adm.cur.liveNow', { rate: +lv.rate.toPrecision(5), time: new Date(lv.updated).toLocaleString(langInfo().locale, { dateStyle: 'short', timeStyle: 'short', numberingSystem: 'latn' }) }) : t('adm.cur.liveNone'))}</small></span>
        <label class="adm-mini"><span>${esc(t('adm.cur.mode'))}</span><select class="select" data-change="curMode" data-key="${esc(c)}">
          <option value="live" ${manual ? '' : 'selected'}>${esc(t('adm.cur.live'))}</option><option value="manual" ${manual ? 'selected' : ''}>${esc(t('adm.cur.manual'))}</option></select></label>
        <label class="adm-mini"><span>${esc(t('adm.cur.manualRate'))}</span><input type="number" min="0.0001" step="any" inputmode="decimal" value="${esc(r)}" data-change="curRate" data-key="${esc(c)}" dir="ltr"></label>
        <span class="adm-actions">${iconBtn('curRemove', t('adm.cur.remove', { code: c }), ICON.trash, `data-key="${esc(c)}"`)}</span></li>`; }).join('')}</ol>
      <label class="field"><span class="label">${esc(t('adm.cur.add'))}</span><input data-change="curAdd" maxlength="3" dir="ltr" autocapitalize="characters" placeholder="QAR"></label>
    </section>

    <section class="card adm-card">
      <div class="set-row adm-sec-head"><div><b>${esc(t('adm.legal.title'))}</b><p>${esc(t('adm.legal.d'))}</p></div>
        <a class="see-all" href="#/legal/${legalPage}">${esc(t('adm.legal.open'))} ${ICON.out}</a></div>
      <div class="chip-row">${['terms', 'privacy', 'refunds', 'notice'].map(p => `<button type="button" class="fchip" data-act="legalPage" data-id="${p}" ${legalPage === p ? 'aria-current="true"' : ''}>${esc(t('legal.' + p))}</button>`).join('')}</div>
      <div class="adm-legal">${LANG_IDS.map(l => `<label class="field"><span class="label">${esc(t('legal.' + legalPage))} · ${l.toUpperCase()}</span>
        <textarea data-change="legal" data-key="${legalPage}" data-lang="${l}" rows="9" maxlength="12000" ${l === 'ar' ? 'dir="rtl"' : 'dir="ltr"'} placeholder="${esc(tIn(l, 'legal.' + legalPage + '.body'))}">${esc(LEGAL_OVR[legalPage]?.[l] || '')}</textarea></label>`).join('')}</div>
    </section>

    <section class="card adm-card">
      <div class="set-row adm-sec-head"><div><b>${esc(t('adm.faq.title'))}</b><p>${esc(t('adm.faq.d'))}</p></div>
        <a class="see-all" href="#/support">${esc(t('adm.preview'))} ${ICON.out}</a></div>
      <div class="chip-row">${LANG_IDS.map(l => `<button type="button" class="fchip" data-act="faqLang" data-id="${l}" ${faqLang === l ? 'aria-current="true"' : ''}>${l.toUpperCase()}</button>`).join('')}</div>
      <ol class="adm-faq">${faqList.map(([q, a], i) => `<li>
        <label class="field"><span class="label">${esc(t('adm.faq.q'))} ${i + 1}</span><input data-change="faqQ" data-id="${i}" value="${esc(q)}" maxlength="200" dir="auto"></label>
        <label class="field"><span class="label">${esc(t('adm.faq.a'))}</span><textarea data-change="faqA" data-id="${i}" rows="3" maxlength="1200" dir="auto">${esc(a)}</textarea></label>
        <span class="adm-actions">
          ${iconBtn('faqUp', t('adm.up'), ICON.up, `data-id="${i}" ${i === 0 ? 'disabled' : ''}`)}
          ${iconBtn('faqDown', t('adm.down'), `<span class="flip">${ICON.up}</span>`, `data-id="${i}" ${i === faqList.length - 1 ? 'disabled' : ''}`)}
          ${iconBtn('faqDelete', t('adm.delete'), ICON.trash, `data-id="${i}"`)}</span>
      </li>`).join('')}</ol>
      <div class="adm-bundle-row">
        <button type="button" class="btn btn-ghost btn-sm" data-act="faqAdd">${ICON.plus} ${esc(t('adm.faq.add'))}</button>
        ${own ? `<button type="button" class="btn btn-ghost btn-sm" data-act="faqReset">${esc(t('adm.faq.reset'))}</button>` : ''}
      </div>
    </section>`;
}

/* ══════════════════════════════════════════════════════════════════════
   Texts — every word of the store, in English, French and Arabic
   ══════════════════════════════════════════════════════════════════════ */
let textQuery = '';
function textsTab() {
  const q = textQuery.trim().toLowerCase();
  const keys = textKeys();
  const hits = q ? keys.filter(k => k.toLowerCase().includes(q) || LANG_IDS.some(l => (TEXTS[k]?.[l] || tIn(l, k)).toLowerCase().includes(q)))
                 : keys.filter(k => TEXTS[k]);
  const shown = hits.slice(0, 40);
  return `
    <section class="card adm-card">
      <div class="adm-sec-head"><div><b>${esc(t('adm.tx.title'))}</b><p>${esc(t('adm.tx.d'))}</p></div></div>
      <div class="adm-toolbar">
        <label class="search-field">${ICON.search.replace('width="34" height="34"', 'width="16" height="16"')}
          <input type="search" id="textSearch" value="${esc(textQuery)}" placeholder="${esc(t('adm.tx.search'))}" aria-label="${esc(t('adm.tx.search'))}"></label>
      </div>
      <p class="hint">${esc(q ? t('adm.tx.found', { n: hits.length, shown: shown.length }) : t('adm.tx.changed', { n: Object.keys(TEXTS).length }))}</p>
      ${shown.map(k => `<div class="adm-text">
        <div class="adm-text-head"><code dir="ltr">${esc(k)}</code>
          ${TEXTS[k] ? `<button type="button" class="link-btn" data-act="textReset" data-key="${esc(k)}">${esc(t('adm.tx.reset'))}</button>` : ''}</div>
        ${textFields(k, t('adm.tx.text'), { max: 600, area: tIn('en', k).length > 70 })}
      </div>`).join('')}
      <p class="hint">${esc(t('adm.tx.vars'))}</p>
    </section>`;
}

const keyProducts = () => PRODUCTS.filter(usesKeys);
const STATE_PILL = { in: 'pill-delivered', low: 'pill-processing', out: 'pill-out', untracked: 'pill-muted' };
const statePill = id => {
  const st = stockState(id), s = stockOf(id);
  const text = st === 'untracked' ? t('stock.untracked') : st === 'out' ? t('stock.out') : st === 'low' ? t('stock.low', { n: s.available }) : t('stock.in');
  return `<span class="pill ${STATE_PILL[st]}">${esc(text)}</span>`;
};
const maskKey = c => (c.length <= 6 ? '•'.repeat(c.length) : c.slice(0, 4) + '•'.repeat(Math.min(12, c.length - 6)) + c.slice(-2));
let keyFilter = 'all', keyQuery = '';

function keysTab() {
  const list = keyProducts();
  const totals = list.reduce((a, p) => { const s = stockOf(p.id); a.av += s.available; a.sold += s.sold; const st = stockState(p.id); if (st === 'low') a.low++; if (st === 'out') a.out++; return a; }, { av: 0, sold: 0, low: 0, out: 0 });
  const q = keyQuery.toLowerCase();
  const shown = list.filter(p => {
    const st = stockState(p.id);
    if (keyFilter === 'low' && st !== 'low') return false;
    if (keyFilter === 'out' && st !== 'out') return false;
    if (keyFilter === 'none' && st !== 'untracked') return false;
    return !q || `${p.short} ${p.name} ${subLabel(p.sub)}`.toLowerCase().includes(q);
  });
  const chip = (id, label) => `<button type="button" class="fchip" data-act="keyFilter" data-id="${id}" ${keyFilter === id ? 'aria-current="true"' : ''}>${esc(label)}</button>`;
  return `
    <div class="stat-grid">
      ${statTile(FI.keyBig, t('adm.k.inStock'), fmtNum(totals.av), `<span class="st-delta flat">${esc(t('adm.k.inStockD'))}</span>`)}
      ${statTile(FI.check, t('adm.k.sold'), fmtNum(totals.sold), `<span class="st-delta flat">${esc(t('adm.k.soldD'))}</span>`)}
      ${statTile(FI.alert, t('adm.k.lowN'), fmtNum(totals.low), `<span class="st-delta flat">${esc(t('adm.k.lowD', { n: LOW_STOCK }))}</span>`)}
      ${statTile(FI.slash, t('adm.k.outN'), fmtNum(totals.out), `<span class="st-delta ${totals.out ? 'down' : 'flat'}">${esc(t('adm.k.outD'))}</span>`)}
    </div>
    <p class="demo-note">${ICON.shield}<span>${esc(t('adm.k.demoNote'))}</span></p>
    <div class="adm-toolbar">
      <label class="search-field">${ICON.search.replace('width="34" height="34"', 'width="16" height="16"')}
        <input type="search" id="keySearch" value="${esc(keyQuery)}" placeholder="${esc(t('adm.search'))}" aria-label="${esc(t('adm.search'))}"></label>
      <div class="chip-row">${chip('all', t('adm.k.all'))}${chip('low', t('adm.k.filterLow'))}${chip('out', t('adm.k.filterOut'))}${chip('none', t('adm.k.filterNone'))}</div>
    </div>
    ${shown.length ? `<div class="card adm-table" role="list">
      ${shown.map(p => { const s = stockOf(p.id); return `
        <div class="adm-row" role="listitem" data-kid="${esc(p.id)}">
          ${media(p, 'thumb')}
          <div class="txt"><b>${esc(p.short)} ${statePill(p.id)}</b><span>${esc(s.tracked ? t('adm.k.counts', { a: s.available, s: s.sold }) : t('adm.k.none'))}</span></div>
          <a class="btn btn-ghost btn-sm" href="#/admin/keys/${esc(p.id)}">${FI.key} ${esc(t('adm.k.manage'))}</a>
        </div>`; }).join('')}
    </div>` : emptyState(ICON.search, t('adm.noResults'), '')}`;
}

function keysManage(id) {
  const p = byId[id];
  if (!p || !usesKeys(p)) return emptyState(ICON.search, t('pdp.notFound'), '', `<a class="btn btn-solid" href="#/admin/keys">${esc(t('adm.k.back'))}</a>`);
  const list = stock[id] || [], free = list.filter(k => !k.order), sold = list.filter(k => k.order);
  const waiting = allOrders().filter(o => o.waiting?.[id]).reduce((n, o) => n + o.waiting[id], 0);
  const account = deliveryType(p) === 'account';
  return `
    <a class="see-all adm-back" href="#/admin/keys">${ICON.chev} ${esc(t('adm.k.back'))}</a>
    <section class="card adm-card">
      <div class="key-head">${media(p, 'thumb')}<div class="txt"><h2>${esc(p.short)}</h2><p>${statePill(id)} <span class="hint">${esc(t('adm.k.counts', { a: free.length, s: sold.length }))}</span></p></div></div>
      ${waiting ? `<p class="key-waiting">${ICON.clock}<span><b>${esc(t('adm.k.waiting'))}</b> — ${esc(t('adm.k.waitingD', { n: waiting }))}</span></p>` : ''}
      <form class="adm-form" data-form="addKeys" data-id="${esc(id)}" novalidate>
        <h3>${esc(t('adm.k.addTitle'))}</h3>
        <p class="hint">${esc(t(account ? 'adm.k.addAccount' : 'adm.k.addD'))}</p>
        <textarea name="keys" rows="6" dir="ltr" spellcheck="false" autocomplete="off" class="key-input"
          placeholder="${account ? 'player1@example.com:password123&#10;player2@example.com:password456' : 'AAAA-BBBB-CCCC-DDDD&#10;EEEE-FFFF-GGGG-HHHH'}" aria-label="${esc(t('adm.k.addTitle'))}"></textarea>
        <div class="adm-form-foot">
          <label class="btn btn-ghost btn-sm">${FI.upload} ${esc(t('adm.k.file'))}<input type="file" accept=".txt,.csv,text/plain,text/csv" id="keyFile" hidden></label>
          <button class="btn btn-solid" type="submit">${ICON.plus} ${esc(t('adm.k.addBtn'))}</button>
        </div>
      </form>
    </section>
    <section class="card adm-card">
      <h3>${esc(t('adm.k.available'))} · ${free.length}</h3>
      ${free.length ? `<ul class="key-list">${free.map(k => `
        <li class="cred" data-secret="${esc(k.code)}">
          <code class="cred-code" dir="ltr">${esc(maskKey(k.code))}</code>
          <span class="hint">${esc(shortDate(k.added))}</span>
          <span class="cred-actions">
            <button class="mini" type="button" data-act="keyReveal" aria-pressed="false">${ICON.eye}<span>${esc(t('cred.reveal'))}</span></button>
            ${iconBtn('keyRemove', t('adm.k.removeKey'), ICON.trash, `data-id="${esc(id)}" data-code="${esc(k.code)}"`)}
          </span>
        </li>`).join('')}</ul>` : `<p class="hint">${esc(t('adm.k.emptyAvail'))}</p>`}
    </section>
    <section class="card adm-card">
      <h3>${esc(t('adm.k.soldList'))} · ${sold.length}</h3>
      ${sold.length ? `<ul class="key-list">${sold.slice().reverse().map(k => `
        <li><code class="cred-code" dir="ltr">${esc(maskKey(k.code))}</code>
          ${String(k.order).startsWith('CHAT-') ? `<a class="see-all" href="#/admin/chats/${esc(k.order.slice(5))}">${esc(t('ch.a.keyInChat'))}</a>` : `<a class="see-all" href="#/order/${esc(k.order)}">${esc(t('adm.k.order', { id: k.order }))}</a>`}
          <span class="hint">${esc(shortDate(k.soldAt))}</span></li>`).join('')}</ul>` : `<p class="hint">${esc(t('adm.k.emptySold'))}</p>`}
    </section>`;
}

const adminPanel = {
  title: () => t('adm.title'),
  render(ctx) {
    const [tab, arg] = ctx.params;
    const editing = tab === 'product';
    const copying = editing && String(arg || '').startsWith('copy-');
    const cur = editing ? 'products' : TABS.includes(tab) ? tab : 'overview';
    const body = editing ? productForm(arg) : cur === 'products' ? productsTab() : cur === 'sections' ? sectionsTab()
      : cur === 'categories' ? categoriesTab() : cur === 'keys' ? (arg ? keysManage(arg) : keysTab()) : cur === 'promos' ? promosTab() : cur === 'orders' ? ordersTab() : cur === 'chats' ? chatsTab(arg) : cur === 'store' ? storeTab() : cur === 'texts' ? textsTab() : overviewTab();
    const trail = [[t('home'), '#/'], [t('adm.title'), '#/admin'], ...(editing ? [[t('adm.tab.products'), '#/admin/products'],
      [arg === 'new' ? t('adm.addTitle') : copying ? t('adm.copyTitle') : (byId[arg]?.short || ''), '']] : [[t('adm.tab.' + cur), '']])];
    return `
      <div class="page adm">
        ${pageHead(editing ? (arg === 'new' ? t('adm.addTitle') : copying ? t('adm.copyTitle') : t('adm.editTitle')) : t('adm.tab.' + cur), esc(t('adm.intro')), trail)}
        <div class="adm-shell">
          <aside class="card adm-side">
            <p class="adm-side-title">${esc(t('adm.title'))}</p>
            <nav class="adm-nav" aria-label="${esc(t('adm.title'))}">
              ${TABS.map(id => `<a href="#/admin/${id}" ${id === cur ? 'aria-current="page"' : ''}>${TAB_ICON[id]}<span>${esc(t('adm.tab.' + id))}</span>${id === 'chats' ? chatNavBadge() : ''}</a>`).join('')}
            </nav>
            <div class="adm-tools">
              <p class="adm-side-title">${esc(t('adm.data'))}</p>
              <button class="adm-tool" data-act="export" aria-label="${esc(t('adm.export'))}">${FI.download}<span>${esc(t('adm.export'))}</span></button>
              <label class="adm-tool">${FI.upload}<span>${esc(t('adm.import'))}</span><input type="file" accept="application/json,.json" id="admImport" hidden></label>
              <button class="adm-tool adm-danger-text" data-act="reset" aria-label="${esc(t('adm.reset'))}">${FI.reset}<span>${esc(t('adm.reset'))}</span></button>
              <button class="adm-tool" data-act="lock" aria-label="${esc(t('lock.lock'))}">${ICON.lock}<span>${esc(t('lock.lock'))}</span></button>
            </div>
          </aside>
          <div class="adm-body">${body}</div>
        </div>
      </div>`;
  },
  mount(el, ctx) {
    const cleanups = [];
    if (ctx.params[0] === 'product') cleanups.push(mountProductForm(el));
    if (!ctx.params[0] || ctx.params[0] === 'overview') cleanups.push(mountChart(el));
    cleanups.push(chatWatch());   // live chat: badge on the Chats tab from any admin page
    if (ctx.params[0] === 'chats') cleanups.push(mountChats(el, ctx.params[1]));

    const onClick = e => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      const { act, id, key } = b.dataset;
      switch (act) {
        case 'catUp': return moveCat(id, -1);
        case 'catDown': return moveCat(id, 1);
        case 'catDelete': return deleteGroup('cat', id);
        case 'subUp': return moveSub(id, -1);
        case 'subDown': return moveSub(id, 1);
        case 'subDelete': return deleteGroup('sub', id);
        case 'productDelete': if (deleteProduct(id) && ctx.params[0] === 'product') go('#/admin/products'); return;
        case 'keyFilter': keyFilter = id; return go(location.hash);
        case 'keyRemove': if (confirm(t('adm.deleteQ', { name: b.dataset.code }))) { removeKey(id, b.dataset.code); toast(t('adm.deleted'), true); go(location.hash); } return;
        case 'keyReveal': {
          const row = b.closest('.cred'), shown = b.getAttribute('aria-pressed') === 'true';
          row.querySelector('.cred-code').textContent = shown ? maskKey(row.dataset.secret) : row.dataset.secret;
          b.setAttribute('aria-pressed', String(!shown));
          b.innerHTML = `${shown ? ICON.eye : ICON.eyeOff}<span>${esc(t(shown ? 'cred.reveal' : 'cred.hide'))}</span>`;
          return;
        }
        case 'listUp': return change(r => move(listOf(r, key), id, -1), '');
        case 'listDown': return change(r => move(listOf(r, key), id, 1), '');
        case 'listRemove': return change(r => { r[key] = listOf(r, key).filter(x => x !== id); }, '');
        case 'saleRemove': return change(r => { delete salesOf(r)[id]; }, t('adm.sales.removed'));
        case 'orderFilter': orderFilter = id; return go(location.hash);
        case 'faqLang': faqLang = id; return go(location.hash);
        case 'legalPage': legalPage = id; return go(location.hash);
        case 'curRemove': return change(r => { r.currencies ??= clone(CURRENCY_RATES); delete r.currencies[key]; if (r.ratesManual) r.ratesManual = r.ratesManual.filter(c => c !== key); });
        case 'curRefresh': return refreshRates(true).then(ok => { toast(t(ok ? 'adm.cur.refreshed' : 'adm.cur.failed'), !!ok); if (location.hash.startsWith('#/admin/store')) go(location.hash); });
        case 'faqUp': return change(r => move(faqOf(r), faqOf(r)[+id], -1), '');
        case 'faqDown': return change(r => move(faqOf(r), faqOf(r)[+id], 1), '');
        case 'faqDelete': return change(r => { faqOf(r).splice(+id, 1); if (!faqOf(r).length) delete r.faq[faqLang]; }, t('adm.deleted'));
        case 'faqAdd': return change(r => { faqOf(r).push([t('adm.faq.newQ'), t('adm.faq.newA')]); }, '');
        case 'faqReset': return change(r => { if (r.faq) delete r.faq[faqLang]; }, t('adm.saved'));
        case 'siteAccent': return change(r => { (r.site ??= {}).accent = id; });
        case 'textReset': return change(r => { if (r.texts) delete r.texts[key]; });
        case 'gTest': {
          try { sessionStorage.removeItem(`tg.greviews.${EXTRAS.google.placeId}.${lang()}`); } catch {}
          b.disabled = true;
          googleReviews(EXTRAS.google, lang())
            .then(d => toast(t('adm.g.ok', { avg: d.rating, n: d.count, shown: d.reviews.length }), true))
            .catch(err => toast(t('adm.g.fail', { why: err.message })))
            .finally(() => { b.disabled = false; });
          return;
        }
        case 'bundleNew': return change(r => {
          const list = bundlesOf(r); let n = list.length + 1;
          while (list.some(x => x.id === `bundle-${n}`)) n++;
          list.push({ id: `bundle-${n}`, name: {}, items: [], pct: 10 });
        }, t('adm.bundles.added'));
        case 'bundleDelete': if (confirm(t('adm.deleteQ', { name: t('adm.bundles.title') }))) change(r => { r.bundles = bundlesOf(r).filter(x => x.id !== id); }, t('adm.deleted')); return;
        case 'bundleItemRemove': return change(r => { const x = bundlesOf(r).find(y => y.id === id); if (!x) return false; x.items = x.items.filter(p => p !== key); }, '');
        case 'reviewDelete': return change(r => { r.reviews = reviewsOf(r).filter((_, i) => i !== +id); }, t('adm.deleted'));
        case 'lock': return lockAdmin();
        case 'export': {
          // uploaded photos and videos travel inside the file, so the edits open in another browser
          const record = loadAdmin();
          packFiles(refsIn(record)).then(files => {
            const blob = new Blob([JSON.stringify({ app: 'techgarage-admin', version: 3, record, stock, files }, null, 2)], { type: 'application/json' });
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'techgarage-store-edits.json' });
            document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          });
          return;
        }
        case 'reset':
          if (confirm(t('adm.resetQ'))) { localStorage.removeItem(ADMIN_KEY); commitAdmin({}); toast(t('adm.resetDone'), true); }
          return;
      }
    };
    const onSubmit = e => {
      const form = e.target.closest('[data-form]');
      if (!form) return;
      e.preventDefault();
      if (form.dataset.form === 'addKeys') {
        const raw = form.elements.keys.value;
        if (!raw.trim()) { toast(t('adm.k.nothing')); form.elements.keys.focus(); return; }
        const { added, dupes } = addKeys(form.dataset.id, raw);
        toast([t('adm.k.added', { n: added }), dupes ? t('adm.k.dupes', { n: dupes }) : ''].filter(Boolean).join(' · '), added > 0);
        go(location.hash);
        return;
      }
      if (form.dataset.form === 'review') {
        const f = form.elements, name = f.rname.value.trim(), text = f.rtext.value.trim();
        if (!name || !text) { toast(t('adm.rev.need')); (name ? f.rtext : f.rname).focus(); return; }
        change(r => { reviewsOf(r).push({ name, text, stars: +f.rstars.value || 5, ...(f.rproduct.value ? { product: f.rproduct.value } : {}),
          ...(f.rgoogle.checked ? { source: 'google' } : {}), ...(f.rwhen.value.trim() ? { when: f.rwhen.value.trim() } : {}) }); }, t('adm.rev.added'));
        return;
      }
      catActions[form.dataset.form]?.(form);
    };
    const onChange = e => {
      const x = e.target;
      if (x.id === 'admImport') {
        const f = x.files[0];
        if (!f) return;
        f.text().then(text => {
          const data = JSON.parse(text);
          if (data?.app !== 'techgarage-admin' || typeof data.record !== 'object') throw new Error('bad');
          if (data.stock && typeof data.stock === 'object') replaceStock(data.stock);
          if (online) return liftFiles(data.record, data.files).then(rec => { if (commitAdmin(rec)) toast(t('adm.imported'), true); });
          return unpackFiles(data.files).then(() => { if (commitAdmin(data.record)) toast(t('adm.imported'), true); });
        }).catch(() => toast(t('adm.badFile')));
        return;
      }
      if (x.id === 'admCat') { productCat = x.value; return go(location.hash); }
      if (x.id === 'keyFile') {
        const file = x.files[0];
        if (file) file.text().then(text => { const ta = el.querySelector('.key-input'); ta.value = (ta.value ? ta.value + '\n' : '') + text.split(/[\r\n,;]+/).map(v => v.trim()).filter(Boolean).join('\n'); });
        return;
      }
      const { change: what, key, id } = x.dataset;
      if (what === 'preset') {
        const form = x.form, other = x.value === OTHER;
        form.querySelectorAll('.adm-custom').forEach(c => { c.hidden = !other; });
        if (other) form.querySelector('.adm-custom input, input.adm-custom')?.focus();
        const preset = CAT_PRESETS.find(p => p.id === x.value);
        if (preset && form.elements.grouped) form.elements.grouped.checked = !!preset.grouped;
        return;
      }
      if (what === 'renameSub') {
        const name = x.value.trim();
        if (name && name !== subLabel(id)) change(r => { (r.subNames ??= {})[id] = name; });
      } else if (what === 'show') {
        change(r => { r.hidden ??= {}; if (x.checked) delete r.hidden[key]; else r.hidden[key] = true; });
      } else if (what === 'title') {
        change(r => { const tt = ((r.titles ??= {})[key] ??= {}); const v = x.value.trim(); if (v) tt[x.dataset.lang] = v; else delete tt[x.dataset.lang]; });
      } else if (what === 'listAdd' && x.value) {
        const pid = x.value;
        change(r => { listOf(r, key).push(pid); }, '');
      } else if (what === 'promoOn') change(r => { promoOf(r).on = x.checked; });
      else if (what === 'promoText') change(r => { const p = promoOf(r); (p[x.dataset.field] ??= {})[x.dataset.lang] = x.value.trim(); });
      else if (what === 'promoLink') change(r => { promoOf(r).link = x.value; });
      else if (what === 'promoArt') change(r => { promoOf(r).art = x.value; });
      else if (what === 'promoCode') change(r => { promoOf(r).code = x.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20); });
      else if (what === 'promoCodePct') change(r => { promoOf(r).codePct = Math.min(90, Math.max(0, Math.round(+x.value || 0))); });
      else if (what === 'salePct' && id) change(r => { const s = salesOf(r)[id]; if (s) s.pct = Math.min(90, Math.max(1, Math.round(+x.value || 1))); });
      else if (what === 'saleUntil' && id) change(r => { const s = salesOf(r)[id]; if (!s) return false; if (x.value) s.until = x.value + 'T23:59:00'; else delete s.until; });
      else if (what === 'flashProduct' && x.value) change(r => { const f = flashOf(r); f.id = x.value; f.pct ??= 30; });
      else if (what === 'flashPct') change(r => { const f = flashOf(r); f.pct = Math.min(90, Math.max(1, Math.round(+x.value || 1))); });
      else if (what === 'bundleName' && id) change(r => { const b = bundlesOf(r).find(y => y.id === id); if (!b) return false; (b.name ??= {})[x.dataset.lang] = x.value.trim(); });
      else if (what === 'bundlePct' && id) change(r => { const b = bundlesOf(r).find(y => y.id === id); if (!b) return false; b.pct = Math.min(90, Math.max(1, Math.round(+x.value || 1))); });
      else if (what === 'bundleItemAdd' && id && x.value) { const pid = x.value; change(r => { const b = bundlesOf(r).find(y => y.id === id); if (!b || b.items.includes(pid) || b.items.length >= 6) return false; b.items.push(pid); }, ''); }
      else if (what === 'whatsapp') change(r => { r.whatsapp = x.value.replace(/\D/g, '').slice(0, 15); });
      else if (what === 'gPlace' || what === 'gKey') {
        const v = x.value.trim(), ok = !v || (what === 'gPlace' ? /^[\w-]{10,300}$/ : /^[\w-]{20,80}$/).test(v);
        if (!ok) { toast(t(what === 'gPlace' ? 'adm.g.badPlace' : 'adm.g.badKey')); x.focus(); return; }
        change(r => { const g = (r.google ??= {}); if (v) g[what === 'gPlace' ? 'placeId' : 'key'] = v; else delete g[what === 'gPlace' ? 'placeId' : 'key']; });
      }
      else if (what === 'text' && key) change(r => { const tt = ((r.texts ??= {})[key] ??= {}); const v = x.value.trim(); if (v) tt[x.dataset.lang] = v; else delete tt[x.dataset.lang]; if (!Object.keys(tt).length) delete r.texts[key]; });
      else if (what === 'storeField' && key) {
        if (key === 'email' && !x.checkValidity()) { toast(t('err.email')); x.focus(); return; }
        change(r => { (r.store ??= {})[key] = x.value.trim(); });
      }
      else if (what === 'storeHours' && key) change(r => { const st = (r.store ??= {}); st.hours ??= clone(STORE.hours); const h = st.hours.find(([d]) => d === key); if (h) h[1] = x.value.trim(); else st.hours.push([key, x.value.trim()]); });
      else if (what === 'siteAccent') change(r => { (r.site ??= {}).accent = x.value; });
      else if (what === 'curRate' && key) change(r => { const v = +x.value; if (!(v > 0)) return false; (r.currencies ??= clone(CURRENCY_RATES))[key] = v; });
      else if (what === 'curMode' && key) change(r => { const set = new Set(r.ratesManual || RATE_MANUAL); if (x.value === 'manual') set.add(key); else set.delete(key); r.ratesManual = [...set]; });
      else if (what === 'curAdd') {
        const c = x.value.trim().toUpperCase();
        if (!/^[A-Z]{3}$/.test(c) || c === 'TND') { toast(t('adm.cur.bad')); return; }
        change(r => { (r.currencies ??= clone(CURRENCY_RATES))[c] ??= 1; });
      }
      else if (what === 'legal' && key) change(r => { const o = ((r.legal ??= {})[key] ??= {}); const v = x.value.trim(); if (v) o[x.dataset.lang] = v; else delete o[x.dataset.lang]; if (!Object.keys(o).length) delete r.legal[key]; });
      else if (what === 'payOn' && key) {
        if (!x.checked && PAYMENT_METHODS.filter(m => m !== key).length === 0) { x.checked = true; toast(t('adm.pay.needOne')); return; }
        change(r => { ((r.payments ??= {})[key] ??= {}).on = x.checked; });
      }
      else if (what === 'payFeeType' && key) change(r => { const p = ((r.payments ??= {})[key] ??= {}); const cur = PAYMENT_FEES[key] || {}; const v = cur.pct ?? cur.flat ?? 0; p.fee = x.value === 'flat' ? { flat: v } : { pct: Math.min(50, v) }; });
      else if (what === 'payFee' && key) change(r => { const p = ((r.payments ??= {})[key] ??= {}); const cur = PAYMENT_FEES[key] || {}; const kind = cur.flat !== undefined && cur.pct === undefined ? 'flat' : 'pct';
        const v = Math.max(0, Math.min(kind === 'pct' ? 50 : 1000, Math.round((+x.value || 0) * 1000) / 1000)); p.fee = { [kind]: v }; });
      else if ((what === 'faqQ' || what === 'faqA') && id !== undefined) change(r => { const row = faqOf(r)[+id]; if (!row) return false; row[what === 'faqQ' ? 0 : 1] = x.value.trim(); }, '');
      else if (what === 'orderStatus' && id) change(r => { (r.orderStatus ??= {})[id] = x.value; }, t('adm.or.saved'));
      else if (what === 'orderTrack' && id && key) change(r => { const o = ((r.tracking ??= {})[id] ??= {}); o[key] = x.value.trim(); if (!o.carrier && !o.number) delete r.tracking[id]; }, t('adm.or.saved'));
      else if (what === 'shipOn' && key) change(r => { ((r.shipping ??= {})[key] ??= {}).on = x.checked; });
      else if (what === 'shipNum' && key) change(r => { const v = Math.max(0, Math.min(100000, Math.round((+x.value || 0) * 1000) / 1000)); ((r.shipping ??= {})[key] ??= {})[x.dataset.f] = v; });
      else if (what === 'shipText' && key) change(r => { ((r.shipping ??= {})[key] ??= {})[x.dataset.f] = x.value.trim(); });
      else if (what === 'shipCountries') change(r => { ((r.shipping ??= {}).intl ??= {}).countries = [...new Set(x.value.toUpperCase().split(/[^A-Z]+/).filter(c => /^[A-Z]{2}$/.test(c)))]; });
      else if (what === 'saleAdd' && x.value) { const pid = x.value; change(r => { salesOf(r)[pid] = { pct: 15, until: inDays(7) }; }, t('adm.sales.added')); }
    };
    let typing;
    const onInput = e => {
      if (e.target.id === 'keySearch') {
        clearTimeout(typing);
        typing = setTimeout(() => { keyQuery = e.target.value; const pos = e.target.selectionStart; emit('redraw'); const k = $('#keySearch'); if (k) { k.focus(); k.setSelectionRange(pos, pos); } }, 180);
        return;
      }
      if (e.target.id === 'orderSearch' || e.target.id === 'textSearch') {
        const box = e.target;
        clearTimeout(typing);
        typing = setTimeout(() => { if (box.id === 'orderSearch') orderQuery = box.value; else textQuery = box.value; const pos = box.selectionStart; emit('redraw'); const n = $('#' + box.id); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 220);
        return;
      }
      if (e.target.id !== 'admSearch') return;
      clearTimeout(typing);
      typing = setTimeout(() => {
        productQuery = e.target.value;
        const pos = e.target.selectionStart;
        emit('redraw');   // in place: going through the router would play the page transition and steal the box
        const s = $('#admSearch'); if (s) { s.focus(); s.setSelectionRange(pos, pos); }
      }, 180);
    };
    el.addEventListener('click', onClick);
    el.addEventListener('submit', onSubmit);
    el.addEventListener('change', onChange);
    el.addEventListener('input', onInput);
    cleanups.push(() => {
      el.removeEventListener('click', onClick); el.removeEventListener('submit', onSubmit);
      el.removeEventListener('change', onChange); el.removeEventListener('input', onInput);
      clearTimeout(typing);
    });
    return () => cleanups.forEach(f => f());
  }
};

/* ══════════════════════════════════════════════════════════════════════
   Admin lock
   The admin opens only after the owner's PIN. The first visit asks the
   owner to create one; it is stored salted and hashed (SHA-256), never as
   text. Unlocking lasts until the tab is closed or "Lock admin" is pressed;
   five wrong tries in a row lock the form for 30 seconds, then longer.
   Demo note: this all happens in the browser. A real store checks admin
   logins on its server, where nobody can read or reset them.
   ══════════════════════════════════════════════════════════════════════ */
const PIN_KEY = 'tg.adminPin', TRIES_KEY = 'tg.adminTries', OPEN_KEY = 'tg.adminUnlocked';
const readJSON = (store, k) => { try { return JSON.parse(store.getItem(k)) || null; } catch { return null; } };
const adminOpen = () => { try { return sessionStorage.getItem(OPEN_KEY) === '1' && (!online || !!adminKey()); } catch { return false; } };
const setOpen = yes => { try { yes ? sessionStorage.setItem(OPEN_KEY, '1') : sessionStorage.removeItem(OPEN_KEY); } catch {} };
const storedPin = () => { const p = readJSON(localStorage, PIN_KEY); return p && typeof p.salt === 'string' && typeof p.hash === 'string' ? p : null; };

async function pinHash(salt, pin) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 2166136261;   // no Web Crypto (very old browser): a simple stand-in
  for (const b of data) { h ^= b; h = Math.imul(h, 16777619); }
  return 'f' + (h >>> 0).toString(16);
}
const newSalt = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
const same = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

const tries = () => readJSON(localStorage, TRIES_KEY) || { fails: 0, until: 0, round: 0 };
const waitLeft = () => Math.max(0, Math.ceil((tries().until - Date.now()) / 1000));

function lockScreen() {
  const setup = !online && !storedPin();   // the live site always asks for the shared admin password
  return `
    <div class="page adm-lock-page">
      <form class="card adm-lock" id="adminLock" novalidate>
        <span class="adm-lock-icon" aria-hidden="true">${ICON.lock}</span>
        <h1>${esc(t(setup ? 'lock.setTitle' : 'lock.title'))}</h1>
        <p class="hint">${esc(t(online ? 'lock.dOnline' : setup ? 'lock.setD' : 'lock.d'))}</p>
        ${field('pin', t('lock.pin'), '', 'password', `autocomplete="${setup ? 'new-password' : 'current-password'}" maxlength="32" required`)}
        ${setup ? field('pin2', t('lock.confirm'), '', 'password', 'autocomplete="new-password" maxlength="32" required') : ''}
        <button class="btn btn-solid" type="submit">${ICON.lock}<span>${esc(t(setup ? 'lock.create' : 'lock.open'))}</span></button>
        <p class="adm-lock-msg" role="alert" aria-live="assertive"></p>
        <p class="hint adm-lock-note">${esc(t(online ? 'lock.noteOnline' : 'lock.note'))}</p>
      </form>
    </div>`;
}

function mountLock(el) {
  const form = $('#adminLock', el), msg = $('.adm-lock-msg', form), btn = $('button[type=submit]', form);
  let timer = 0;
  const say = text => { msg.textContent = text; };
  const countdown = () => {
    const s = waitLeft();
    btn.disabled = s > 0;
    if (s > 0) { say(t('lock.wait', { n: s })); timer = setTimeout(countdown, 1000); } else say('');
  };
  countdown();
  setTimeout(() => form.elements.pin.focus(), 60);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (waitLeft()) return countdown();
    const pin = form.elements.pin.value;
    const saved = storedPin();
    if (online) {
      btn.disabled = true;
      const ok = await checkKey(pin);
      btn.disabled = false;
      if (ok === 'off') return say(t('lock.notSetup'));
      if (!ok) { form.elements.pin.value = ''; form.elements.pin.focus(); return say(t('lock.wrongOnline')); }
    } else if (!saved) {
      if (pin.length < 4) { say(t('lock.short')); return form.elements.pin.focus(); }
      if (pin !== form.elements.pin2.value) { say(t('lock.mismatch')); return form.elements.pin2.focus(); }
      const salt = newSalt();
      try { localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash: await pinHash(salt, pin) })); } catch {}
    } else if (!same(await pinHash(saved.salt, pin), saved.hash)) {
      const tr = tries();
      tr.fails += 1;
      if (tr.fails >= 5) { tr.round += 1; tr.fails = 0; tr.until = Date.now() + 30000 * 2 ** (tr.round - 1); }
      try { localStorage.setItem(TRIES_KEY, JSON.stringify(tr)); } catch {}
      form.elements.pin.value = '';
      form.elements.pin.focus();
      return tr.until > Date.now() ? countdown() : say(t('lock.wrong', { n: 5 - tr.fails }));
    }
    try { localStorage.removeItem(TRIES_KEY); } catch {}
    setOpen(true);
    emit('catalog');   // draw the admin
  });
  return () => clearTimeout(timer);
}

/* Importing on the live site: files packed by a localhost export go up to
   Vercel Blob and the record points at their new public addresses. */
async function liftFiles(record, packed) {
  let text = JSON.stringify(record);
  for (const [ref, data] of Object.entries(packed || {})) {
    if (!/^idb:[a-z0-9]{6,40}$/.test(ref) || typeof data !== 'string' || !text.includes(ref)) continue;
    const m = data.match(/^data:((?:image|video)\/[\w.+-]+);base64,(.*)$/);
    if (!m) continue;
    const bin = atob(m[2]), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = await uploadToBlob(new Blob([bytes], { type: m[1] }), 'import');
    text = text.split(ref).join(url);
  }
  return JSON.parse(text);
}

export function lockAdmin() {
  forgetKey();
  setOpen(false);
  toast(t('lock.locked'), true);
  emit('catalog');
}

export const admin = {
  ...adminPanel,
  render: ctx => (adminOpen() ? adminPanel.render(ctx) : lockScreen()),
  mount: (el, ctx) => (adminOpen() ? adminPanel.mount(el, ctx) : mountLock(el))
};
