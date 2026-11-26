/* TechGarage demo — the product form's extra panels (admin → product).
   More photos, a banner, an uploaded video, system requirements, the owner's
   "how to redeem" steps with pictures, and the order of the blocks on the
   product page. Uploaded files go to IndexedDB (media-store.js); the product
   keeps only their references. Lists reorder by dragging (sortable.js) or
   with each item's up / down buttons. */

import { t } from './i18n.js?v=20261129d';
import { $, $$, esc, ICON, toast } from './core.js?v=20261129d';
import { srcOf, putFile, available } from './media-store.js?v=20261129d';
import { sortable } from './sortable.js?v=20261129d';
import { PDP_BLOCKS, SYSREQ_KEYS } from './guard.js?v=20261129d';
import { unmangle } from './views.js?v=20261129d';

const AX_GRIP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
const AX_X = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const AX_STAR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>';
const AX_UP = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const AX_DOWN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

const AX_MAX_PHOTOS = 12, AX_MAX_STEPS = 12, AX_MAX_VIDEO_MB = 300;
const axMoveBtns = () => `<span class="ax-move"><button type="button" data-move="-1" aria-label="${esc(t('adm.up'))}">${AX_UP}</button><button type="button" data-move="1" aria-label="${esc(t('adm.down'))}">${AX_DOWN}</button></span>`;
const axGripBtn = label => `<button type="button" class="ax-grip" data-grip aria-label="${esc(label)}" title="${esc(t('ax.drag'))}">${AX_GRIP}</button>`;

/** A picture shrunk to `max` px on its long side, as WebP. */
function axShrink(file, max) {
  return new Promise((ok, fail) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => (b ? ok(b) : fail(new Error('encode'))), 'image/webp', 0.86);
    };
    img.onerror = () => { URL.revokeObjectURL(url); fail(new Error('image')); };
    img.src = url;
  });
}
const axKeepImage = async (file, max) => putFile(await axShrink(file, max));
const axIsLink = u => /^https:\/\/[a-z0-9.-]+\/[^\s"'<>\\]*$/i.test(u);

/* ── system requirements: read the text copied from a store page ──────────
   Understands Steam's layout ("MINIMUM:" / "RECOMMENDED:" then "OS: …"
   lines) and the same in French; anything unlabelled goes to Notes. */
const AX_SYS_MATCH = [
  ['os', /^(os|operating system|syst[eè]me d'exploitation|syst[eè]me)\b/i],
  ['cpu', /^(processor|cpu|processeur)\b/i],
  ['ram', /^(memory|ram|m[ée]moire)\b/i],
  ['gpu', /^(graphics|graphics card|video card|gpu|graphiques|carte graphique)\b/i],
  ['storage', /^(storage|hard drive|hard disk|disk space|espace disque|stockage|espace)\b/i],
  ['dx', /^(directx)\b/i],
  ['net', /^(network|r[ée]seau|internet)\b/i],
  ['notes', /^(additional notes|notes|sound card|carte son|remarques)\b/i]
];
export function parseSysreq(text) {
  const out = { min: {}, rec: {} };
  let side = 'min';
  for (let line of unmangle(String(text)).split(/\r?\n/)) {   // "WindowsÂ®" pasted through a wrong encoding is repaired first
    line = line.replace(/ /g, ' ').trim();
    if (!line) continue;
    if (/^(minimum|minimale?s?|config(uration)? minimale)\s*:?\s*$/i.test(line)) { side = 'min'; continue; }
    if (/^(recommended|recommand[ée]e?s?|config(uration)? recommand[ée]e)\s*:?\s*$/i.test(line)) { side = 'rec'; continue; }
    const m = line.match(/^([^:]{2,40}):\s*(.+)$/);
    if (!m) { if (!/requires a 64-bit|n[ée]cessite un processeur/i.test(line)) out[side].notes = [out[side].notes, line].filter(Boolean).join(' · '); continue; }
    const key = AX_SYS_MATCH.find(([, re]) => re.test(m[1].trim()))?.[0] || 'notes';
    out[side][key] = key === 'notes' && out[side].notes ? `${out[side].notes} · ${m[2].trim()}` : m[2].trim();
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════════ */
export function extrasForm(v) {
  const sys = v.sysreq || { min: {}, rec: {} };
  return `
    <section class="adm-extras" aria-label="${esc(t('ax.title'))}">
      <div class="card ax-card">
        <h3>${esc(t('ax.photos'))}</h3>
        <p class="hint">${esc(t('ax.photosD'))}</p>
        <div class="ax-gallery" id="axGallery"></div>
        <div class="ax-row">
          <label class="btn btn-ghost">${ICON.plus} ${esc(t('ax.addPhotos'))}<input type="file" accept="image/*" multiple id="axGalleryFile" hidden></label>
          <input class="adm-inline" id="axGalleryUrl" type="url" dir="ltr" placeholder="${esc(t('adm.photoUrl'))}" aria-label="${esc(t('adm.photoUrl'))}">
        </div>
      </div>

      <div class="card ax-card">
        <h3>${esc(t('ax.banner'))}</h3>
        <p class="hint">${esc(t('ax.bannerD'))}</p>
        <div class="ax-banner" id="axBanner"></div>
        <div class="ax-row">
          <label class="btn btn-ghost">${ICON.plus} ${esc(t('ax.upBanner'))}<input type="file" accept="image/*" id="axBannerFile" hidden></label>
          <input class="adm-inline" id="axBannerUrl" type="url" dir="ltr" placeholder="${esc(t('adm.photoUrl'))}" aria-label="${esc(t('adm.photoUrl'))}">
        </div>
        <label class="check"><input type="checkbox" id="axWallBg" ${v.wallBg ? 'checked' : ''}><span>${esc(t('ax.wallBg'))}</span></label>
      </div>

      <div class="card ax-card">
        <h3>${esc(t('ax.video'))}</h3>
        <p class="hint">${esc(t('ax.videoD', { mb: AX_MAX_VIDEO_MB }))}</p>
        <div class="ax-video" id="axVideo"></div>
        <label class="btn btn-ghost">${ICON.plus} ${esc(t('ax.upVideo'))}<input type="file" accept="video/mp4,video/webm" id="axVideoFile" hidden></label>
      </div>

      <div class="card ax-card ax-wide">
        <h3>${esc(t('pdp.sysreq'))}</h3>
        <p class="hint">${esc(t('ax.sysD'))}</p>
        <div class="ax-row">
          <a class="btn btn-ghost" id="axSysFind" target="_blank" rel="noopener">${esc(t('ax.sysFind'))} ${ICON.out}</a>
        </div>
        <details class="ax-paste">
          <summary>${esc(t('ax.sysPaste'))}</summary>
          <textarea id="axSysText" rows="7" dir="auto" placeholder="${esc(t('ax.sysPasteP'))}"></textarea>
          <button type="button" class="btn btn-ghost" id="axSysFill">${esc(t('ax.sysFill'))}</button>
        </details>
        <div class="ax-sys" role="group" aria-label="${esc(t('pdp.sysreq'))}">
          <span></span><b>${esc(t('sys.min'))}</b><b>${esc(t('sys.rec'))}</b>
          ${SYSREQ_KEYS.map(k => `
            <label for="sys-min-${k}">${esc(t('sys.' + k))}</label>
            <input id="sys-min-${k}" data-sys="min.${k}" value="${esc(sys.min?.[k] || '')}" dir="auto" maxlength="200" aria-label="${esc(t('sys.' + k) + ' · ' + t('sys.min'))}">
            <input id="sys-rec-${k}" data-sys="rec.${k}" value="${esc(sys.rec?.[k] || '')}" dir="auto" maxlength="200" aria-label="${esc(t('sys.' + k) + ' · ' + t('sys.rec'))}">`).join('')}
        </div>
      </div>

      <div class="card ax-card ax-wide">
        <h3>${esc(t('pdp.redeem'))}</h3>
        <p class="hint">${esc(t('ax.redeemD'))}</p>
        <ol class="ax-steps" id="axSteps"></ol>
        <button type="button" class="btn btn-ghost" id="axStepAdd">${ICON.plus} ${esc(t('ax.stepAdd'))}</button>
      </div>

      <div class="card ax-card ax-wide">
        <h3>${esc(t('ax.layout'))}</h3>
        <p class="hint">${esc(t('ax.layoutD'))}</p>
        <div class="ax-fixed">${ICON.lock}<span>${esc(t('ax.layoutTop'))}</span></div>
        <ul class="ax-blocks" id="axBlocks"></ul>
      </div>
    </section>`;
}

/** Wires the panels; returns read() for the form's submit handler (or null while an upload is running). */
export function mountExtras(form, v, { setMain } = {}) {
  const st = {
    gallery: [...(v.gallery || [])],
    wall: v.wall || '',
    video: v.video?.hd?.startsWith('idb:') ? v.video.hd : '',
    redeem: (v.redeem || []).map(s => ({ ...s })),
    layout: [...new Set([...(v.layout || []), ...PDP_BLOCKS])],
    off: new Set(v.off || [])
  };
  let busy = 0;
  const work = async (fn, okMsg) => {
    if (!available()) return toast(t('ax.noStore'));
    busy++;
    form.classList.add('ax-busy');
    try { await fn(); if (okMsg) toast(okMsg, true); }
    catch { toast(t('ax.failed')); }
    finally { if (!--busy) form.classList.remove('ax-busy'); }
  };

  /* ── more photos ── */
  const gal = $('#axGallery', form);
  const drawGallery = () => {
    gal.innerHTML = st.gallery.length ? st.gallery.map((src, i) => `
      <figure class="ax-shot" data-sort data-i="${i}">
        <img src="${esc(srcOf(src))}" alt="">
        ${axGripBtn(t('ax.photoN', { n: i + 1 }))}
        <span class="ax-shot-tools">
          <button type="button" data-main="${i}" aria-label="${esc(t('ax.makeMain'))}" title="${esc(t('ax.makeMain'))}">${AX_STAR}</button>
          <button type="button" data-drop="${i}" aria-label="${esc(t('ax.remove'))}" title="${esc(t('ax.remove'))}">${AX_X}</button>
        </span>
        ${axMoveBtns()}
      </figure>`).join('') : `<p class="ax-empty">${esc(t('ax.noPhotos'))}</p>`;
  };
  const stopGal = sortable(gal, { grid: true, onChange: () => { st.gallery = $$('[data-sort]', gal).map(f => st.gallery[+f.dataset.i]); drawGallery(); } });
  gal.addEventListener('click', e => {
    const drop = e.target.closest('[data-drop]'), main = e.target.closest('[data-main]');
    if (drop) { st.gallery.splice(+drop.dataset.drop, 1); drawGallery(); }
    if (main && setMain) { const i = +main.dataset.main, old = setMain(st.gallery[i]); st.gallery[i] = old; st.gallery = st.gallery.filter(Boolean); drawGallery(); }
  });
  $('#axGalleryFile', form).addEventListener('change', e => {
    const files = [...e.target.files].slice(0, AX_MAX_PHOTOS - st.gallery.length);
    e.target.value = '';
    if (!files.length) return toast(t('ax.tooMany', { n: AX_MAX_PHOTOS }));
    work(async () => { for (const f of files) { st.gallery.push(await axKeepImage(f, 1280)); drawGallery(); } }, t('ax.added'));
  });
  $('#axGalleryUrl', form).addEventListener('change', e => {
    const u = e.target.value.trim();
    if (!axIsLink(u)) return;
    if (st.gallery.length >= AX_MAX_PHOTOS) return toast(t('ax.tooMany', { n: AX_MAX_PHOTOS }));
    st.gallery.push(u); e.target.value = ''; drawGallery();
  });

  /* ── banner ── */
  const ban = $('#axBanner', form);
  const drawBanner = () => {
    ban.innerHTML = st.wall
      ? `<img src="${esc(srcOf(st.wall))}" alt=""><button type="button" class="ax-x" data-unbanner aria-label="${esc(t('ax.remove'))}">${AX_X}</button>`
      : `<p class="ax-empty">${esc(t('ax.noBanner'))}</p>`;
  };
  ban.addEventListener('click', e => { if (e.target.closest('[data-unbanner]')) { st.wall = ''; drawBanner(); } });
  $('#axBannerFile', form).addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = '';
    if (f) work(async () => { st.wall = await axKeepImage(f, 1920); drawBanner(); }, t('ax.added'));
  });
  $('#axBannerUrl', form).addEventListener('change', e => { const u = e.target.value.trim(); if (axIsLink(u)) { st.wall = u; e.target.value = ''; drawBanner(); } });

  /* ── video ── */
  const vid = $('#axVideo', form);
  const drawVideo = () => {
    vid.innerHTML = st.video
      ? `<video src="${esc(srcOf(st.video))}" muted loop playsinline controls preload="metadata"></video><button type="button" class="ax-x" data-unvideo aria-label="${esc(t('ax.remove'))}">${AX_X}</button>`
      : `<p class="ax-empty">${esc(t('ax.noVideo'))}</p>`;
  };
  vid.addEventListener('click', e => { if (e.target.closest('[data-unvideo]')) { st.video = ''; drawVideo(); } });
  $('#axVideoFile', form).addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (f.size > AX_MAX_VIDEO_MB * 1024 * 1024) return toast(t('ax.videoBig', { mb: AX_MAX_VIDEO_MB }));
    work(async () => { st.video = await putFile(f); drawVideo(); }, t('ax.added'));
  });

  /* ── system requirements ── */
  const find = $('#axSysFind', form);
  const setFind = () => { find.href = `https://store.steampowered.com/search/?term=${encodeURIComponent(form.elements.short?.value || v.short || '')}`; };
  setFind();
  form.elements.short?.addEventListener('input', setFind);
  $('#axSysFill', form).addEventListener('click', () => {
    const r = parseSysreq($('#axSysText', form).value);
    let n = 0;
    for (const side of ['min', 'rec']) for (const [k, val] of Object.entries(r[side])) {
      const input = form.querySelector(`[data-sys="${side}.${k}"]`);
      if (input) { input.value = val.slice(0, 200); n++; }
    }
    toast(n ? t('ax.sysFilled', { n }) : t('ax.sysNone'), n > 0);
  });

  /* ── how to redeem ── */
  const steps = $('#axSteps', form);
  const syncSteps = () => $$('[data-sort]', steps).forEach((li, i) => { st.redeem[+li.dataset.i].text = li.querySelector('textarea').value; });
  const drawSteps = () => {
    steps.innerHTML = st.redeem.map((s, i) => `
      <li class="ax-step" data-sort data-i="${i}">
        ${axGripBtn(t('ax.stepN', { n: i + 1 }))}
        <span class="step-n">${i + 1}</span>
        <textarea rows="2" dir="auto" maxlength="600" placeholder="${esc(t('ax.stepP'))}" aria-label="${esc(t('ax.stepN', { n: i + 1 }))}">${esc(s.text || '')}</textarea>
        <span class="ax-step-pic">
          ${s.img ? `<img src="${esc(srcOf(s.img))}" alt=""><button type="button" class="ax-x" data-unpic="${i}" aria-label="${esc(t('ax.remove'))}">${AX_X}</button>`
                  : `<label class="ax-pic-add" title="${esc(t('ax.stepPic'))}">${ICON.plus}<span>${esc(t('ax.stepPic'))}</span><input type="file" accept="image/*" data-pic="${i}" hidden></label>`}
        </span>
        ${axMoveBtns()}
        <button type="button" class="ax-del" data-unstep="${i}" aria-label="${esc(t('ax.remove'))}">${ICON.trash}</button>
      </li>`).join('');
  };
  const stopSteps = sortable(steps, { onChange: () => { syncSteps(); st.redeem = $$('[data-sort]', steps).map(li => st.redeem[+li.dataset.i]); drawSteps(); } });
  steps.addEventListener('click', e => {
    const del = e.target.closest('[data-unstep]'), unpic = e.target.closest('[data-unpic]');
    if (del) { syncSteps(); st.redeem.splice(+del.dataset.unstep, 1); drawSteps(); }
    if (unpic) { syncSteps(); delete st.redeem[+unpic.dataset.unpic].img; drawSteps(); }
  });
  steps.addEventListener('change', e => {
    const inp = e.target.closest('[data-pic]');
    if (!inp?.files[0]) return;
    const i = +inp.dataset.pic, f = inp.files[0];
    syncSteps();
    work(async () => { st.redeem[i].img = await axKeepImage(f, 1280); drawSteps(); });
  });
  $('#axStepAdd', form).addEventListener('click', () => {
    if (st.redeem.length >= AX_MAX_STEPS) return toast(t('ax.tooMany', { n: AX_MAX_STEPS }));
    syncSteps(); st.redeem.push({ text: '' }); drawSteps();
    steps.lastElementChild?.querySelector('textarea')?.focus();
  });

  /* ── page layout ── */
  const blocks = $('#axBlocks', form);
  const drawBlocks = () => {
    blocks.innerHTML = st.layout.map(id => `
      <li class="ax-block${st.off.has(id) ? ' is-off' : ''}" data-sort data-id="${id}">
        ${axGripBtn(t('ax.b.' + id))}
        <span class="ax-block-txt"><b>${esc(t('ax.b.' + id))}</b><small>${esc(t('ax.bd.' + id))}</small></span>
        <label class="ax-show"><input type="checkbox" data-show="${id}" ${st.off.has(id) ? '' : 'checked'}><span>${esc(t('ax.show'))}</span></label>
        ${axMoveBtns()}
      </li>`).join('');
  };
  const stopBlocks = sortable(blocks, { onChange: () => { st.layout = $$('[data-sort]', blocks).map(li => li.dataset.id); } });
  blocks.addEventListener('change', e => {
    const c = e.target.closest('[data-show]');
    if (!c) return;
    c.checked ? st.off.delete(c.dataset.show) : st.off.add(c.dataset.show);
    c.closest('.ax-block').classList.toggle('is-off', !c.checked);
  });

  drawGallery(); drawBanner(); drawVideo(); drawSteps(); drawBlocks();

  const read = () => {
    if (busy) return null;
    syncSteps();
    const sys = { min: {}, rec: {} };
    $$('[data-sys]', form).forEach(i => { const [side, k] = i.dataset.sys.split('.'); if (i.value.trim()) sys[side][k] = i.value.trim(); });
    return {
      gallery: st.gallery.length ? [...st.gallery] : undefined,
      wall: st.wall || undefined,
      wallBg: st.wall && $('#axWallBg', form).checked ? true : undefined,
      uploadedVideo: st.video || '',
      sysreq: Object.keys(sys.min).length || Object.keys(sys.rec).length ? sys : undefined,
      redeem: st.redeem.filter(s => s.text?.trim() || s.img).map(s => ({ text: s.text.trim(), ...(s.img ? { img: s.img } : {}) })),
      layout: [...st.layout],
      off: [...st.off]
    };
  };
  return { read, stop: () => { stopGal(); stopSteps(); stopBlocks(); } };
}
