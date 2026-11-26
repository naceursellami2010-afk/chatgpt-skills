/* TechGarage demo — frosted-glass dropdowns.
   Every <select class="select"> gets a glass button and a glass panel with
   large, clearly separated rows, group headings, a check on the current
   choice and, for long lists, a search box — so a choice is hard to get
   wrong on a phone or a trackpad. The real <select> stays underneath and
   keeps the value, so forms, change events and screen readers work as before. */

import { esc, ICON } from './core.js?v=20261129d';
import { t } from './i18n.js?v=20261129d';

const CHEVRON = '<svg class="gsel-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
let openPanel = null;
let uid = 0;

export function glassSelects(root = document) {
  root.querySelectorAll('select.select:not([data-glass])').forEach(enhance);
}

function enhance(sel) {
  sel.dataset.glass = '1';
  const wrap = document.createElement('div');
  wrap.className = 'gsel' + (sel.classList.contains('adm-preset') || sel.closest('.field, .adm-fields') ? ' gsel-block' : '');
  sel.before(wrap);
  wrap.append(sel);
  sel.tabIndex = -1;
  sel.setAttribute('aria-hidden', 'true');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gsel-btn';
  btn.id = `gsel-${++uid}`;
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  const label = sel.getAttribute('aria-label') || sel.labels?.[0]?.textContent.trim();
  if (label) btn.setAttribute('aria-label', label);
  if (sel.id) document.querySelectorAll(`label[for="${CSS.escape(sel.id)}"]`).forEach(l => { l.htmlFor = btn.id; });
  wrap.append(btn);

  const sync = () => {
    const o = sel.selectedOptions[0];
    const placeholder = !o || o.hidden;
    btn.innerHTML = `<span class="gsel-val${placeholder ? ' ph' : ''}">${esc(o?.textContent.trim() || '')}</span>${CHEVRON}`;
    if (label) btn.setAttribute('aria-label', `${label}: ${o?.textContent.trim() || ''}`);
  };
  sync();
  sel.addEventListener('change', sync);
  new MutationObserver(sync).observe(sel, { childList: true, subtree: true });   // options replaced in code
  btn.addEventListener('click', () => (openPanel?.btn === btn ? closeGlassSelect() : openGlassSelect(sel, btn)));
  btn.addEventListener('keydown', e => {
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); openGlassSelect(sel, btn); }
  });
}

function rowsOf(sel) {
  const rows = [];
  for (const node of sel.children) {
    if (node.tagName === 'OPTGROUP') {
      const opts = [...node.children].filter(o => !o.hidden);
      if (opts.length) rows.push({ group: node.label }, ...opts.map(o => ({ o })));
    } else if (!node.hidden) rows.push({ o: node });
  }
  return rows;
}

function openGlassSelect(sel, btn) {
  closeGlassSelect();
  const rows = rowsOf(sel);
  const count = rows.filter(r => r.o).length;
  const panel = document.createElement('div');
  panel.className = 'gsel-pop';
  panel.setAttribute('role', 'listbox');
  if (btn.getAttribute('aria-label')) panel.setAttribute('aria-label', btn.getAttribute('aria-label').split(':')[0]);
  panel.dir = document.documentElement.dir;
  panel.innerHTML = `
    ${count > 9 ? `<label class="gsel-search">${ICON.search.replace(/width="34" height="34"/, 'width="15" height="15"')}<input type="search" autocomplete="off" aria-label="${esc(t('gsel.search'))}" placeholder="${esc(t('gsel.search'))}"></label>` : ''}
    <div class="gsel-list">
      ${rows.map(r => r.group
        ? `<div class="gsel-group" role="presentation">${esc(r.group)}</div>`
        : `<button type="button" class="gsel-opt${r.o.value === '__other' ? ' gsel-other' : ''}" role="option" data-v="${esc(r.o.value)}"
             aria-selected="${r.o.selected && !r.o.hidden}" ${r.o.disabled ? 'disabled' : ''}>
             <span>${esc(r.o.textContent.trim())}</span>${ICON.check}</button>`).join('')}
      <p class="gsel-empty" hidden>—</p>
    </div>`;
  document.body.append(panel);
  btn.setAttribute('aria-expanded', 'true');
  btn.closest('.gsel').classList.add('open');

  const place = () => {
    const r = btn.getBoundingClientRect();
    const below = innerHeight - r.bottom, above = r.top;
    const up = below < 260 && above > below;
    panel.style.minWidth = `${Math.max(r.width, 220)}px`;
    panel.style.maxHeight = `${Math.min(380, (up ? above : below) - 16)}px`;
    panel.style.top = up ? '' : `${r.bottom + 8}px`;
    panel.style.bottom = up ? `${innerHeight - r.top + 8}px` : '';
    const rtl = panel.dir === 'rtl';
    const w = Math.min(Math.max(r.width, 220, panel.offsetWidth), innerWidth - 24);
    let left = rtl ? r.right - w : r.left;
    left = Math.max(12, Math.min(left, innerWidth - w - 12));
    panel.style.left = `${left}px`;
    panel.classList.toggle('up', up);
  };
  place();

  const opts = () => [...panel.querySelectorAll('.gsel-opt:not([hidden]):not([disabled])')];
  const choose = b => {
    sel.value = b.dataset.v;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    closeGlassSelect();
    btn.focus();
  };
  panel.addEventListener('click', e => { const b = e.target.closest('.gsel-opt'); if (b && !b.disabled) choose(b); });
  panel.addEventListener('keydown', e => {
    const list = opts(), i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (list[i + 1] || list[0])?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (i <= 0 ? panel.querySelector('.gsel-search input') || list.at(-1) : list[i - 1])?.focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); closeGlassSelect(); btn.focus(); }
    else if (e.key === 'Tab') closeGlassSelect();
  });
  const search = panel.querySelector('.gsel-search input');
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let any = false;
    for (const el of panel.querySelectorAll('.gsel-list > *')) {
      if (el.classList.contains('gsel-opt')) { const hit = !q || el.textContent.toLowerCase().includes(q); el.hidden = !hit; any ||= hit; }
      else if (el.classList.contains('gsel-group')) el.hidden = !!q;
    }
    panel.querySelector('.gsel-empty').hidden = any;
  });
  search?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); const first = opts()[0]; if (first) choose(first); }
  });

  const current = panel.querySelector('.gsel-opt[aria-selected="true"]');
  // on touch screens don't jump straight into the search box (it would pop up the keyboard)
  const touch = matchMedia('(pointer: coarse)').matches;
  ((touch ? null : search) || current || opts()[0])?.focus({ preventScroll: true });
  current?.scrollIntoView({ block: 'nearest' });

  const outside = e => { if (!panel.contains(e.target) && !btn.contains(e.target)) closeGlassSelect(); };
  // the page scrolls: the panel follows its button, and closes once the button leaves the screen
  const onScroll = e => {
    if (panel.contains(e.target)) return;
    const r = btn.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) closeGlassSelect(); else place();
  };
  setTimeout(() => document.addEventListener('pointerdown', outside), 0);
  addEventListener('scroll', onScroll, true);
  addEventListener('resize', place);
  openPanel = {
    btn,
    close() {
      document.removeEventListener('pointerdown', outside);
      removeEventListener('scroll', onScroll, true);
      removeEventListener('resize', place);
      btn.setAttribute('aria-expanded', 'false');
      btn.closest('.gsel')?.classList.remove('open');
      panel.remove();
    }
  };
}

export function closeGlassSelect() {
  openPanel?.close();
  openPanel = null;
}
