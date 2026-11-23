/* TechGarage demo — store admin (#/admin).
   Three tabs: categories (and their subcategories), products, and what each
   page section shows. Every change is a small edit to the owner's record
   (see applyAdmin in data.js), saved with commitAdmin(), which re-indexes
   the catalogue and redraws the store — no reload, no server. */

import { PRODUCTS, CATEGORIES, SUB_NAMES, HERO, NEW_DROPS, CAT_NAMES, PAGE_SECTIONS, ADMIN_KEY, loadAdmin, shipped } from './data.js?v=20261124k';
import { LANGS, t, tIn, plural, lang, langInfo } from './i18n.js?v=20261124k';
import {
  $, $$, byId, tnd, esc, catLabel, subLabel, subsOf, go, ICON, media, fitAll, toast, commitAdmin,
  isListed, listed, regionOf, valueOf, deliveryType, topupMethod, allOrders, orderTotal
} from './core.js?v=20261124k';
import { pageHead, field, emptyState, toggle } from './views.js?v=20261124k';

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
            ${iconBtn('productDelete', t('adm.delete') + ' ' + p.short, ICON.trash, `data-id="${esc(p.id)}"`)}
          </div>
        </div>`).join('')}
    </div>` : emptyState(ICON.search, t('adm.noResults'), '')}`;
}

const REGIONS = ['GL', 'FR', 'US', 'EU', 'TR', 'IN'];
const DELIVERIES = [['', 'adm.dAuto'], ['code', 'adm.dCode'], ['key', 'adm.dKey'], ['account', 'adm.dAccount'], ['topup', 'adm.dTopup']];
const TOPUPS = [['id', 'adm.tId'], ['login', 'adm.tLogin'], ['loginFull', 'adm.tLoginFull']];

const options = (list, sel) => list.map(([v, label]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(label)}</option>`).join('');
const subOptions = (cat, sel) => options(subsOf(cat).map(s => [s, subLabel(s)]), sel);

function productForm(id) {
  const isNew = id === 'new';
  const p = isNew ? null : byId[id];
  if (!isNew && (!p || !isListed(id))) return emptyState(ICON.search, t('pdp.notFound'), '', `<a class="btn btn-solid" href="#/admin/products">${esc(t('adm.tab.products'))}</a>`);
  const cats = CATEGORIES.filter(c => c.id !== 'all');
  const cat = p?.cat || cats[0]?.id || '';
  const v = p || { tags: [] };
  const sel = (name, label, inner, extra = '') => `
    <div class="field"><label for="${name}">${esc(label)}</label>
      <select class="select" id="${name}" name="${name}" ${extra}>${inner}</select><span class="msg" aria-live="polite"></span></div>`;
  const delivery = p?.delivery || '';
  const showTopup = (delivery || (p && deliveryType(p))) === 'topup';
  return `
    <form class="card form adm-product" id="productForm" data-id="${esc(isNew ? '' : id)}" novalidate>
      <div class="adm-product-grid">
        <div class="adm-photo">
          <span class="label">${esc(t('adm.photo'))}</span>
          <div class="adm-photo-box" id="photoBox">${p ? media(p, 'adm-photo-media', { adapt: false, eager: true }) : `<span class="adm-photo-empty">${ICON.box}</span>`}</div>
          <input type="hidden" name="img" value="${esc(p?.img || '')}">
          <label class="btn btn-ghost btn-wide adm-upload">${ICON.plus} ${esc(t('adm.upload'))}<input type="file" accept="image/*" id="photoFile" hidden></label>
          <input class="adm-inline" id="photoUrl" type="url" dir="ltr" placeholder="${esc(t('adm.photoUrl'))}" aria-label="${esc(t('adm.photoUrl'))}">
          <span class="msg" id="photoMsg" aria-live="polite"></span>
        </div>
        <div class="adm-fields">
          ${field('short', t('adm.short'), v.short || '', 'text', 'required')}
          ${field('name', t('adm.fullName'), v.name && v.name !== v.short ? v.name : '', 'text')}
          <div class="field-row">
            ${field('price', t('adm.price'), v.price ?? '', 'number', 'min="0" step="0.001" inputmode="decimal" dir="ltr"')}
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
            ${sel('delivery', t('adm.delivery'), options(DELIVERIES.map(([d, k]) => [d, t(k)]), delivery))}
            <div id="topupWrap" ${showTopup ? '' : 'hidden'}>${sel('topup', t('adm.topup'), options(TOPUPS.map(([d, k]) => [d, t(k)]), p ? topupMethod(p) : 'id'))}</div>
          </div>
          <div class="field">
            <label for="tags">${esc(t('adm.tags'))}</label>
            <input id="tags" name="tags" value="${esc((v.tags || []).join(', '))}" dir="auto">
            <span class="hint">${esc(t('adm.tagsD'))}</span>
          </div>
          <div class="field">
            <label for="desc">${esc(t('adm.desc'))}</label>
            <textarea id="desc" name="desc" rows="3" dir="auto">${esc(v.custom ? v.blurb : (v.blurb || ''))}</textarea>
          </div>
          ${field('url', t('adm.link'), v.url || '', 'url', 'dir="ltr" placeholder="https://techgarage.tn/…"')}
        </div>
      </div>
      <div class="adm-form-foot">
        ${p ? `<a class="btn btn-ghost" href="#/product/${esc(p.id)}">${esc(t('adm.view'))} ${ICON.out}</a>` : '<span></span>'}
        <div class="adm-actions">
          ${p ? `<button class="btn btn-ghost adm-danger" type="button" data-act="productDelete" data-id="${esc(p.id)}">${ICON.trash} ${esc(t('adm.delete'))}</button>` : ''}
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
  form.elements.cat.addEventListener('change', e => { form.elements.sub.innerHTML = subOptions(e.target.value); });
  form.elements.delivery.addEventListener('change', e => {
    const cat = form.elements.cat.value;
    const auto = e.target.value || (cat === 'mobile' ? 'topup' : '');
    $('#topupWrap', form).hidden = auto !== 'topup';
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
    const hasPhoto = !!f.img.value;
    $('#photoMsg', form).textContent = hasPhoto ? '' : t('adm.photoNeeded');
    if (ok.includes(false) || !hasPhoto) { (ok.indexOf(false) >= 0 ? [f.short, f.price, f.sub][ok.indexOf(false)] : $('#photoFile', form).parentElement).focus?.(); return; }

    const tags = f.tags.value.split(',').map(s => s.trim()).filter(Boolean);
    const desc = f.desc.value.trim();
    const fields = {
      short, name: f.name.value.trim() || short, price: Math.round(priceVal * 1000) / 1000,
      cat: f.cat.value, sub: f.sub.value, img: f.img.value,
      tags: tags.length ? tags : [subLabel(f.sub.value)],
      badge: f.badge.value.trim() || undefined,
      url: f.url.value.trim() || undefined,
      region: f.region.value || undefined, value: f.value.value.trim() || undefined,
      delivery: f.delivery.value || undefined,
      topup: !$('#topupWrap', form).hidden ? f.topup.value : undefined
    };
    const id = form.dataset.id;
    if (!id) {                                    // a new product
      const taken = new Set([...Object.keys(byId), ...(loadAdmin().added || []).map(p => p.id)]);
      const pid = freshId(short, taken, 'p');
      change(r => {
        (r.added ??= []).push({ id: pid, kind: 'art', ...fields, specs: [subLabel(fields.sub), 'Instant delivery'],
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
    go('#/admin/products');
  };
  form.addEventListener('submit', onSubmit);
  return () => form.removeEventListener('submit', onSubmit);
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
  { key: 'recent', label: 'adm.sec.recent', title: 'home.recent',       note: 'adm.recentD' }
];
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
      ${titleInputs(s.key, s.title)}
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
const listOf = (r, key) => (r[key] ??= key === 'hero' ? [...HERO] : key === 'drops' ? [...NEW_DROPS] : [...PAGE_SECTIONS.shelf]);

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
  const orders = allOrders();
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
  return `
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
const TABS = ['overview', 'categories', 'products', 'sections'];
const TAB_ICON = { overview: FI.overview, categories: FI.layers, products: FI.package, sections: FI.layout };

export const admin = {
  title: () => t('adm.title'),
  render(ctx) {
    const [tab, arg] = ctx.params;
    const editing = tab === 'product';
    const cur = editing ? 'products' : TABS.includes(tab) ? tab : 'overview';
    const body = editing ? productForm(arg) : cur === 'products' ? productsTab() : cur === 'sections' ? sectionsTab()
      : cur === 'categories' ? categoriesTab() : overviewTab();
    const trail = [[t('home'), '#/'], [t('adm.title'), '#/admin'], ...(editing ? [[t('adm.tab.products'), '#/admin/products'],
      [arg === 'new' ? t('adm.addTitle') : (byId[arg]?.short || ''), '']] : [[t('adm.tab.' + cur), '']])];
    return `
      <div class="page adm">
        ${pageHead(editing ? (arg === 'new' ? t('adm.addTitle') : t('adm.editTitle')) : t('adm.tab.' + cur), esc(t('adm.intro')), trail)}
        <div class="adm-shell">
          <aside class="card adm-side">
            <p class="adm-side-title">${esc(t('adm.title'))}</p>
            <nav class="adm-nav" aria-label="${esc(t('adm.title'))}">
              ${TABS.map(id => `<a href="#/admin/${id}" ${id === cur ? 'aria-current="page"' : ''}>${TAB_ICON[id]}<span>${esc(t('adm.tab.' + id))}</span></a>`).join('')}
            </nav>
            <div class="adm-tools">
              <p class="adm-side-title">${esc(t('adm.data'))}</p>
              <button class="adm-tool" data-act="export" aria-label="${esc(t('adm.export'))}">${FI.download}<span>${esc(t('adm.export'))}</span></button>
              <label class="adm-tool" aria-label="${esc(t('adm.import'))}">${FI.upload}<span>${esc(t('adm.import'))}</span><input type="file" accept="application/json,.json" id="admImport" hidden></label>
              <button class="adm-tool adm-danger-text" data-act="reset" aria-label="${esc(t('adm.reset'))}">${FI.reset}<span>${esc(t('adm.reset'))}</span></button>
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
        case 'listUp': return change(r => move(listOf(r, key), id, -1), '');
        case 'listDown': return change(r => move(listOf(r, key), id, 1), '');
        case 'listRemove': return change(r => { r[key] = listOf(r, key).filter(x => x !== id); }, '');
        case 'export': {
          const blob = new Blob([JSON.stringify({ app: 'techgarage-admin', version: 1, record: loadAdmin() }, null, 2)], { type: 'application/json' });
          const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'techgarage-store-edits.json' });
          document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
          if (commitAdmin(data.record)) toast(t('adm.imported'), true);
        }).catch(() => toast(t('adm.badFile')));
        return;
      }
      if (x.id === 'admCat') { productCat = x.value; return go(location.hash); }
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
      }
    };
    let typing;
    const onInput = e => {
      if (e.target.id !== 'admSearch') return;
      clearTimeout(typing);
      typing = setTimeout(() => {
        productQuery = e.target.value;
        const pos = e.target.selectionStart;
        go(location.hash);
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
