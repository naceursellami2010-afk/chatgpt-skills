/* TechGarage demo — Store admin → Chats: the staff side of the live chat.

   Every shopper chat, newest first, live: unread dots, typing / recording
   lights, ticks on what the staff send. From a conversation the staff can
   send a product straight from stock (a key is taken from Keys & stock and
   delivered in the chat), send a payment request, and press Finish — the chat
   moves to the log with a green light. The list keeps polling on every admin
   tab, so the Chats tab shows a badge when a shopper writes. */

import { t } from './i18n.js?v=20261129d';
import { esc, tnd, byId, media, toast, isListed, usesKeys, stockOf, takeKeyFor } from './core.js?v=20261129d';
import { PRODUCTS } from './data.js?v=20261129d';
import { online, adminKey } from './sync.js?v=20261129d';
import { emptyState } from './views.js?v=20261129d';
import { chatCall, chatPoller, chatThread, chatSync, chatSeen, chatSend, chatPaint, chatWhen, composerHtml, mountComposer, wireThread, CHAT_ICON } from './chat.js?v=20261129d';

const CHA_NAME = 'tg.staffName';
const chaAuth = () => ({ admin: adminKey() || (online ? '' : 'local') });
const chaBy = () => { try { return localStorage.getItem(CHA_NAME) || ''; } catch { return ''; } };

let chaList = [], chaRev = 0, chaFilter = 'active', chaQuery = '', chaTh = null, chaSeenOnce = new Map();
let chaWatchStop = null, chaListeners = new Set();

const chaUnread = c => c.status !== 'finished' && c.lastC > c.sSeen;
const chaInitials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const chaPreview = c => {
  const l = c.last;
  if (!l) return '';
  const kinds = { image: 'ch.k.image', video: 'ch.k.video', audio: 'ch.k.audio', file: 'ch.k.file', product: 'ch.k.product', pay: 'ch.k.pay', start: 'ch.started', finish: 'ch.finished', reopen: 'ch.reopened', paid: 'ch.k.paid' };
  const what = l.kind === 'text' ? l.text : t(kinds[l.kind] || 'ch.k.file');
  return (l.from === 's' ? t('ch.a.you') + ' ' : '') + what;
};

/** Keep the chat list fresh on every admin tab (badge + "new message" toasts). */
export function chatWatch() {
  if (chaWatchStop) return chaWatchStop;
  const stop = chatPoller(async () => {
    if (!chaAuth().admin) return;
    const [st, d] = await chatCall({ act: 'list', ...chaAuth(), rev: chaRev });
    if (st !== 200 || d.same) return;
    chaRev = d.rev;
    const before = new Map(chaList.map(c => [c.id, c.lastC]));
    chaList = d.chats || [];
    for (const c of chaList) {
      const was = before.get(c.id);
      const fresh = was === undefined ? chaSeenOnce.size > 0 && c.lastC > 0 : c.lastC > was;
      if (fresh && chaUnread(c) && chaTh?.id !== c.id) toast(t('ch.newFrom', { name: c.name }));
      chaSeenOnce.set(c.id, true);
    }
    if (!chaSeenOnce.size) chaSeenOnce.set('_', true);
    chaBadge();
    chaListeners.forEach(f => f());
  }, () => (location.hash.startsWith('#/admin/chats') ? 2000 : 5000));
  chaWatchStop = () => { stop(); chaWatchStop = null; };
  return chaWatchStop;
}

function chaBadge() {
  const n = chaList.filter(chaUnread).length;
  document.querySelectorAll('[data-cha-badge]').forEach(b => { b.hidden = !n; b.textContent = n > 9 ? '9+' : String(n); });
}
export const chatNavBadge = () => { const n = chaList.filter(chaUnread).length; return `<span class="adm-badge" data-cha-badge ${n ? '' : 'hidden'}>${n > 9 ? '9+' : n || ''}</span>`; };

/* ══════════════════════════════════════════════════════════════════════ */
export function chatsTab(arg) {
  if (online && !adminKey()) return emptyState(CHAT_ICON.chat, t('ch.unavailable'), '');
  return `
    <div class="cha ${arg ? 'has-open' : ''}">
      <aside class="card cha-side">
        <div class="cha-top">
          <input type="search" id="chaSearch" value="${esc(chaQuery)}" placeholder="${esc(t('ch.a.search'))}" aria-label="${esc(t('ch.a.search'))}">
          <div class="chip-row" role="tablist">
            <button type="button" class="fchip" data-cha-filter="active" ${chaFilter === 'active' ? 'aria-current="true"' : ''}>${esc(t('ch.a.active'))} <b data-cha-count="active"></b></button>
            <button type="button" class="fchip" data-cha-filter="log" ${chaFilter === 'log' ? 'aria-current="true"' : ''}>${esc(t('ch.a.log'))} <b data-cha-count="log"></b></button>
          </div>
        </div>
        <div class="cha-items" role="list"></div>
        <label class="cha-me"><span>${esc(t('ch.a.me'))}</span><input id="chaMe" maxlength="40" value="${esc(chaBy())}" placeholder="${esc(t('brand'))}"></label>
        ${online ? '' : `<p class="ch-note">${esc(t('ch.a.localNote'))}</p>`}
      </aside>
      <section class="card cha-main" aria-live="polite"></section>
    </div>`;
}

function chaItems(root, openId) {
  const box = root.querySelector('.cha-items');
  if (!box) return;
  const q = chaQuery.trim().toLowerCase();
  const act = chaList.filter(c => c.status !== 'finished'), log = chaList.filter(c => c.status === 'finished');
  root.querySelectorAll('[data-cha-filter]').forEach(b => (b.dataset.chaFilter === chaFilter ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  root.querySelector('[data-cha-count="active"]').textContent = act.length || '';
  root.querySelector('[data-cha-count="log"]').textContent = log.length || '';
  const shown = (chaFilter === 'log' ? log : act).filter(c => !q || `${c.name} ${c.phone} ${byId[c.product]?.short || ''}`.toLowerCase().includes(q));
  const html = shown.length ? shown.map(c => `
    <a class="cha-item ${c.id === openId ? 'is-open' : ''} ${chaUnread(c) ? 'unread' : ''}" role="listitem" href="#/admin/chats/${esc(c.id)}">
      <span class="ch-avatar">${esc(chaInitials(c.name))}</span>
      <span class="cha-txt"><b dir="auto">${esc(c.name)}</b><small dir="auto">${esc(chaPreview(c))}</small></span>
      <span class="cha-end"><time>${esc(chatWhen(c.updated))}</time>
        ${c.status === 'finished' ? `<span class="cha-done" title="${esc(t('ch.a.finishedPill'))}"><i></i>${esc(t('ch.a.finishedPill'))}</span>` : chaUnread(c) ? '<i class="cha-dot" aria-hidden="true"></i>' : ''}</span>
    </a>`).join('')
    : `<p class="cha-empty">${esc(chaList.length ? t('adm.noResults') : chaFilter === 'log' ? t('ch.a.emptyLog') : t('ch.a.empty'))}</p>`;
  if (box.dataset.html !== html) { box.innerHTML = html; box.dataset.html = html; }
}

function chaHeader(c) {
  const p = byId[c?.product];
  const finished = c?.status === 'finished';
  return `
    <header class="ch-head cha-head">
      <a class="ch-ibtn cha-back" href="#/admin/chats" aria-label="${esc(t('ch.a.back'))}">${CHAT_ICON.close}</a>
      <span class="ch-avatar">${esc(chaInitials(c?.name))}</span>
      <div class="ch-who"><b dir="auto">${esc(c?.name || '')}</b>
        <small class="ch-status">${c?.phone ? `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}" dir="ltr">${esc(c.phone)}</a>` : ''}${p ? ` · <a href="#/product/${esc(p.id)}">${esc(p.short)}</a>` : ''}</small></div>
      <div class="cha-actions">
        ${finished ? `<span class="cha-done big"><i></i>${esc(t('ch.a.finishedPill'))}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-cha="reopen">${esc(t('ch.a.reopen'))}</button>
          <button type="button" class="ch-ibtn danger" data-cha="remove" aria-label="${esc(t('ch.a.delete'))}" title="${esc(t('ch.a.delete'))}">${CHAT_ICON.trash}</button>`
          : `<button type="button" class="btn btn-sm cha-finish" data-cha="finish">${CHAT_ICON.done} ${esc(t('ch.a.finish'))}</button>`}
      </div>
    </header>`;
}

/** Draw the open conversation (or the "pick a chat" pane). */
function chaConversation(root, id, ctl) {
  const main = root.querySelector('.cha-main');
  ctl.composer?.stop(); ctl.composer = null;
  ctl.unwire?.(); ctl.unwire = null;
  ctl.stopPoll?.(); ctl.stopPoll = null;
  if (!id) {
    chaTh = null;
    main.innerHTML = `<div class="cha-pick">${CHAT_ICON.chat}<h3>${esc(t('ch.a.pick'))}</h3><p>${esc(t('ch.a.pickD'))}</p></div>`;
    return;
  }
  if (!chaTh || chaTh.id !== id) chaTh = chatThread(id, 's', chaAuth());
  const th = chaTh;
  const c = th.meta || chaList.find(x => x.id === id);
  const finished = c?.status === 'finished';
  main.innerHTML = `${chaHeader(c)}
    <div class="ch-list" role="log"></div>
    ${finished ? `<div class="ch-ended">${CHAT_ICON.done}<p>${esc(t('ch.a.finishedD'))}</p></div>`
      : composerHtml(`<button type="button" class="ch-ibtn" data-cha="stock" title="${esc(t('ch.a.stock'))}" aria-label="${esc(t('ch.a.stock'))}">${CHAT_ICON.box}</button>
        <button type="button" class="ch-ibtn" data-cha="pay" title="${esc(t('ch.a.payLink'))}" aria-label="${esc(t('ch.a.payLink'))}">${CHAT_ICON.card}</button>`)}`;
  const list = main.querySelector('.ch-list');
  const status = () => {
    const s = main.querySelector('.ch-status');
    if (!s) return;
    s.classList.toggle('live', !!th.typing);
    let tl = s.querySelector('.cha-typing');
    if (th.typing) {
      if (!tl) { tl = document.createElement('span'); tl.className = 'cha-typing'; s.prepend(tl); }
      tl.textContent = (th.typing === 'voice' ? t('ch.recordingVoice') : t('ch.typing')) + ' ';
    } else tl?.remove();
  };
  const paint = () => { chatPaint(list, th); status(); };
  paint();
  const send = (msg, extra = {}) => chatSend(th, msg, paint, { by: chaBy(), ...extra });
  if (!finished) {
    ctl.composer = mountComposer(main.querySelector('.ch-compose'), {
      send,
      typing: kind => chatCall({ act: 'typing', id, ...chaAuth(), kind })
    });
  }
  ctl.unwire = wireThread(main, {
    retry: cid => { const m = th.msgs.find(x => x.cid === cid && x.state === 'failed'); if (m) send(m); }
  });
  main.onclick = e => {
    const b = e.target.closest('[data-cha]');
    if (!b) return;
    const what = b.dataset.cha;
    if (what === 'finish' || what === 'reopen') {
      b.disabled = true;
      chatCall({ act: 'finish', id, ...chaAuth(), reopen: what === 'reopen', by: chaBy() }).then(([st]) => {
        if (st !== 200) { b.disabled = false; toast(t('ch.err')); return; }
        toast(t(what === 'finish' ? 'ch.a.finishedToast' : 'ch.reopened'), true);
        if (what === 'finish') chaFilter = 'log';
        th.rev = 0; chaRev = 0;
      });
    } else if (what === 'remove') {
      if (!confirm(t('ch.a.deleteQ'))) return;
      chatCall({ act: 'remove', id, ...chaAuth() }).then(([st]) => {
        if (st !== 200) { toast(t('ch.err')); return; }
        chaList = chaList.filter(x => x.id !== id); chaTh = null; chaRev = 0;
        location.hash = '#/admin/chats';
      });
    } else if (what === 'stock') chaStockSheet(main, send);
    else if (what === 'pay') chaPaySheet(main, send);
  };
  let wasFinished = finished;
  ctl.stopPoll = chatPoller(async () => {
    if (!(await chatSync(th))) return;
    if (th.gone) { toast(t('ch.a.gone')); location.hash = '#/admin/chats'; return; }
    if ((th.meta?.status === 'finished') !== wasFinished) { wasFinished = th.meta?.status === 'finished'; return chaConversation(root, id, ctl); }
    const head = main.querySelector('.cha-head');
    if (head && th.meta && head.dataset.sig !== `${th.meta.name}|${th.meta.phone}|${th.meta.status}`) {
      head.outerHTML = chaHeader(th.meta);
      main.querySelector('.cha-head').dataset.sig = `${th.meta.name}|${th.meta.phone}|${th.meta.status}`;
    }
    paint();
    chatSeen(th);
  }, () => 1200);
}

/* ── send from stock ─────────────────────────────────────────────────── */
function chaSheet(main, html, onMount) {
  main.querySelector('.ch-sheet')?.remove();
  const sheet = Object.assign(document.createElement('div'), { className: 'ch-sheet' });
  sheet.innerHTML = `<div class="ch-sheet-card">${html}</div>`;
  const close = () => sheet.remove();
  sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-x]')) close(); });
  sheet.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  main.append(sheet);
  onMount(sheet, close);
}

function chaStockSheet(main, send) {
  const rows = q => PRODUCTS.filter(p => isListed(p.id) && (!q || `${p.short} ${p.name}`.toLowerCase().includes(q))).slice(0, 40).map(p => {
    const keyed = usesKeys(p), s = stockOf(p.id);
    const tag = keyed ? (s.available ? t('ch.a.keysLeft', { n: s.available }) : t('ch.a.noKeys')) : '';
    return `<li class="cha-stock">
      ${media(p, 'thumb')}
      <span class="cha-txt"><b dir="auto">${esc(p.short)}</b><small>${tnd(p.price)}${tag ? ` · <span class="${keyed && s.available ? 'ok' : ''}">${esc(tag)}</span>` : ''}</small></span>
      <button type="button" class="btn btn-ghost btn-sm" data-sendp="${esc(p.id)}">${keyed && s.available ? esc(t('ch.a.sendKey')) : esc(t('ch.send'))}</button>
      <button type="button" class="ch-ibtn" data-payp="${esc(p.id)}" title="${esc(t('ch.a.payFor'))}" aria-label="${esc(t('ch.a.payFor'))}">${CHAT_ICON.card}</button>
    </li>`;
  }).join('') || `<li class="cha-empty">${esc(t('adm.noResults'))}</li>`;
  chaSheet(main, `
    <h3>${CHAT_ICON.box} ${esc(t('ch.a.stock'))}</h3>
    <input type="search" class="cha-stock-q" placeholder="${esc(t('ch.a.stockSearch'))}" aria-label="${esc(t('ch.a.stockSearch'))}">
    <ul class="cha-stock-list">${rows('')}</ul>
    ${online ? `<p class="ch-note">${esc(t('ch.a.stockNote'))}</p>` : ''}
    <div class="ch-sheet-foot"><button type="button" class="btn btn-ghost" data-x>${esc(t('ch.cancel'))}</button></div>`, (sheet, close) => {
    const q = sheet.querySelector('.cha-stock-q'), ul = sheet.querySelector('.cha-stock-list');
    q.addEventListener('input', () => { ul.innerHTML = rows(q.value.trim().toLowerCase()); });
    q.focus();
    sheet.addEventListener('click', e => {
      const sp = e.target.closest('[data-sendp]'), pp = e.target.closest('[data-payp]');
      if (pp) { close(); chaPaySheet(main, send, byId[pp.dataset.payp]); return; }
      if (!sp) return;
      const p = byId[sp.dataset.sendp];
      if (!p) return;
      let code = '';
      if (usesKeys(p) && stockOf(p.id).available) {
        if (!confirm(t('ch.a.sendKeyQ', { name: p.short }))) return;
        code = takeKeyFor(p.id, 'CHAT-' + chaTh.id);
        if (code) toast(t('ch.a.keyTaken'), true);
      }
      send({ kind: 'product', product: p.id, title: p.short, img: /^https:|^assets\//.test(p.img || '') ? p.img : '', price: p.price, code });
      close();
    });
  });
}

/* ── payment request ─────────────────────────────────────────────────── */
function chaPaySheet(main, send, p = null) {
  chaSheet(main, `
    <form class="cha-payform" novalidate>
      <h3>${CHAT_ICON.card} ${esc(t('ch.a.payLink'))}</h3>
      <label class="ch-field"><span>${esc(t('ch.a.amount'))}</span><input name="amount" type="number" min="0.1" step="0.001" inputmode="decimal" dir="ltr" required value="${p ? esc(p.price) : ''}"></label>
      <label class="ch-field"><span>${esc(t('ch.a.note'))}</span><input name="note" maxlength="300" dir="auto" value="${p ? esc(p.short) : ''}" placeholder="${esc(t('ch.a.noteHint'))}"></label>
      <label class="ch-field"><span>${esc(t('ch.a.link'))}</span><input name="link" type="url" dir="ltr" placeholder="https://" maxlength="1000"></label>
      <p class="ch-note">${esc(t('ch.a.linkD'))}</p>
      <div class="ch-sheet-foot"><button type="button" class="btn btn-ghost" data-x>${esc(t('ch.cancel'))}</button>
        <button type="submit" class="btn btn-solid">${CHAT_ICON.send} ${esc(t('ch.a.sendPay'))}</button></div>
    </form>`, (sheet, close) => {
    const f = sheet.querySelector('form');
    f.elements.amount.focus();
    f.addEventListener('submit', e => {
      e.preventDefault();
      const amount = Math.round((+f.elements.amount.value || 0) * 1000) / 1000;
      if (!(amount > 0)) { toast(t('ch.a.needAmount')); f.elements.amount.focus(); return; }
      const link = f.elements.link.value.trim();
      if (link && !/^https:\/\/\S+$/i.test(link)) { toast(t('ch.a.badLink')); f.elements.link.focus(); return; }
      send({ kind: 'pay', amount, note: f.elements.note.value.trim(), link });
      close();
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════ */
export function mountChats(el, id) {
  const root = el.querySelector('.cha');
  if (!root) return () => {};
  const ctl = {};
  chatWatch();
  const redrawList = () => chaItems(root, id);
  chaListeners.add(redrawList);
  redrawList();
  chaConversation(root, id, ctl);
  const onClick = e => {
    const f = e.target.closest('[data-cha-filter]');
    if (!f) return;
    chaFilter = f.dataset.chaFilter;
    root.querySelectorAll('[data-cha-filter]').forEach(b => (b === f ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    redrawList();
  };
  const onInput = e => {
    if (e.target.id === 'chaSearch') { chaQuery = e.target.value; redrawList(); }
  };
  const onChange = e => {
    if (e.target.id === 'chaMe') { try { localStorage.setItem(CHA_NAME, e.target.value.trim().slice(0, 40)); } catch {} toast(t('adm.saved'), true); }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);
  // the opened chat belongs in the right list
  const c = chaList.find(x => x.id === id);
  if (c && (c.status === 'finished') !== (chaFilter === 'log')) { chaFilter = c.status === 'finished' ? 'log' : 'active'; root.querySelectorAll('[data-cha-filter]').forEach(b => (b.dataset.chaFilter === chaFilter ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'))); redrawList(); }
  return () => {
    chaListeners.delete(redrawList);
    ctl.composer?.stop(); ctl.unwire?.(); ctl.stopPoll?.();
    root.removeEventListener('click', onClick); root.removeEventListener('input', onInput); root.removeEventListener('change', onChange);
  };
}
