/* TechGarage demo — live chat between a shopper and the store's staff.

   For what can't be bought with a key (game currency, top-ups, hardware,
   anything special), a shopper opens the chat from the round button or a
   product page. The staff answer from Store admin → Chats.

   - Text with links, photos, videos, voice messages and documents.
   - Ticks on your own messages: sending (clock), sent (✓), delivered (✓✓),
     seen (✓✓ coloured), or "not sent" (tap to retry).
   - Each side sees when the other is typing or recording a voice message.
   - The staff can send a product straight from stock (with its key) and a
     payment request; when it's all done they press Finish and the chat goes
     to the log with a green light.

   On the live site the chat runs on the server (api/chat.js): pages poll a
   revision number, so an idle check is a single tiny request. On localhost
   there is no server, so the same requests are answered from localStorage
   and the chat works between tabs of one browser (shopper in one tab, admin
   in another). This module holds the transport, the message bubbles and the
   composer (shared with the admin's Chats tab) and the shopper's chat window. */

import { t, lang, langInfo } from './i18n.js?v=20261129d';
import { $, esc, tnd, ICON, byId, media, state, toast, payLabel } from './core.js?v=20261129d';
import { PAYMENT_METHODS } from './data.js?v=20261129d';
import { online, uploadToBlob } from './sync.js?v=20261129d';
import { putFile, refUrl, isRef } from './media-store.js?v=20261129d';
import { payLogos } from './views.js?v=20261129d';

/* ══════════════════════════════════════════════════════════════════════
   Transport — the server online, localStorage on localhost
   ══════════════════════════════════════════════════════════════════════ */
const CH_LOCAL = 'tg.chatdb';
const CH_MAX_MB = 50;
const chWake = new Set();   // pollers to run now (a local write, or another tab's)

const chDbLoad = () => { try { const d = JSON.parse(localStorage.getItem(CH_LOCAL)); return d && d.chats ? d : { v: 0, chats: {} }; } catch { return { v: 0, chats: {} }; } };
const chDbSave = d => {
  try { localStorage.setItem(CH_LOCAL, JSON.stringify(d)); }
  catch { throw new Error('full'); }
  setTimeout(() => chWake.forEach(f => f()), 0);
};
window.addEventListener('storage', e => { if (e.key === CH_LOCAL) chWake.forEach(f => f()); });

const chRand = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => (b % 36).toString(36)).join('');
const chClip = (s, n) => String(s ?? '').trim().slice(0, n);

/** The server's rules, answered from localStorage (localhost only). */
function chLocal(body) {
  const d = chDbLoad(), now = Date.now();
  const c = d.chats[body.id];
  const role = body.admin ? 'staff' : c && body.token && c.token === body.token ? 'client' : null;
  const pub = x => { const { token, msgs, tc, ts, v, ...meta } = x; return { ...meta, count: msgs.length }; };
  const push = (x, msg) => {
    x.msgs.push(msg);
    const seq = x.msgs.length;
    x.updated = msg.at; x.v++; d.v++;
    const done = msg.kind === 'text' || msg.kind === 'audio';   // a typed or recorded message ends the typing light; a photo doesn't
    if (msg.from === 'c') { x.lastC = seq; if (done) x.tc = null; }
    if (msg.from === 's') { x.lastS = seq; if (done) x.ts = null; }
    x.last = { kind: msg.kind, text: msg.kind === 'text' ? msg.text.slice(0, 90) : msg.kind === 'pay' ? String(msg.amount) : (msg.title || msg.name || ''), from: msg.from, at: msg.at };
    return seq;
  };
  switch (body.act) {
    case 'open': {
      const name = chClip(body.name, 60);
      if (!name) return [400, { error: 'name' }];
      const id = chRand(16), token = chRand(32);
      d.chats[id] = { id, token, name, phone: chClip(body.phone, 30), product: chClip(body.product, 80), lang: chClip(body.lang, 5), status: 'open',
        created: now, updated: now, finishedAt: 0, cRecv: 0, cSeen: 0, sRecv: 0, sSeen: 0, lastC: 0, lastS: 0, msgs: [], v: 1, tc: null, ts: null };
      push(d.chats[id], { from: 'sys', kind: 'start', at: now });
      chDbSave(d);
      return [200, { id, token }];
    }
    case 'list': {
      if (!body.admin) return [401, { error: 'auth' }];
      if (body.rev && body.rev === d.v) return [200, { same: true, rev: d.v }];
      let changed = false;
      const chats = Object.values(d.chats).sort((a, b) => b.updated - a.updated).slice(0, 80);
      chats.forEach(x => { if (x.msgs.length > x.sRecv) { x.sRecv = x.msgs.length; x.v++; changed = true; } });
      if (changed) chDbSave(d);
      return [200, { rev: d.v, chats: chats.map(pub) }];
    }
  }
  if (!c) return [404, { error: 'gone' }];
  if (!role) return [401, { error: 'auth' }];
  const other = role === 'staff' ? 'tc' : 'ts', mineT = role === 'staff' ? 'ts' : 'tc';
  switch (body.act) {
    case 'poll': {
      if (body.rev && body.rev === c.v && !body.full) return [200, { same: true, rev: c.v }];
      const since = Math.max(0, +body.since || 0);
      const msgs = c.msgs.slice(since).map((m, i) => ({ ...m, seq: since + i + 1 }));
      const recv = role === 'staff' ? 'sRecv' : 'cRecv';
      if (c.msgs.length > c[recv]) { c[recv] = c.msgs.length; c.v++; chDbSave(d); }
      const typing = c[other] && c[other].until > now ? c[other].kind : '';
      return [200, { rev: c.v, meta: pub(c), msgs, typing }];
    }
    case 'send': {
      if (c.status === 'finished') return [409, { error: 'finished' }];
      const m = { ...body.msg, from: role === 'staff' ? 's' : 'c', at: now };
      if (m.kind === 'pay') m.status = 'pending';
      if (role === 'staff') m.by = chClip(body.by, 40);
      else if (m.kind === 'product' || m.kind === 'pay') return [400, { error: 'msg' }];
      const seq = push(c, m);
      chDbSave(d);
      return [200, { seq, at: now }];
    }
    case 'seen': {
      const f = role === 'staff' ? 'sSeen' : 'cSeen', r = role === 'staff' ? 'sRecv' : 'cRecv';
      const seq = Math.min(c.msgs.length, +body.seq || 0);
      if (seq > c[f]) { c[f] = seq; c[r] = Math.max(c[r], seq); c.v++; d.v++; chDbSave(d); }
      return [200, { ok: true }];
    }
    case 'typing': {
      c[mineT] = body.kind ? { kind: body.kind === 'voice' ? 'voice' : 'text', until: now + 6000 } : null;
      c.v++; chDbSave(d);
      return [200, { ok: true }];
    }
    case 'paid': {
      const m = c.msgs[(+body.seq || 0) - 1];
      if (!m || m.kind !== 'pay' || role !== 'client') return [400, { error: 'seq' }];
      if (m.status !== 'paid') {
        Object.assign(m, { status: 'paid', method: chClip(body.method, 20), paidAt: now });
        push(c, { from: 'sys', kind: 'paid', ref: +body.seq, amount: m.amount, method: m.method, at: now });
        chDbSave(d);
      }
      return [200, { ok: true }];
    }
    case 'finish': {
      if (role !== 'staff') return [401, { error: 'auth' }];
      const reopen = !!body.reopen;
      if (reopen !== (c.status !== 'finished')) {
        c.status = reopen ? 'open' : 'finished'; c.finishedAt = reopen ? 0 : now;
        push(c, { from: 'sys', kind: reopen ? 'reopen' : 'finish', by: chClip(body.by, 40), at: now });
        chDbSave(d);
      }
      return [200, { ok: true }];
    }
    case 'remove': {
      if (role !== 'staff') return [401, { error: 'auth' }];
      delete d.chats[body.id]; d.v++; chDbSave(d);
      return [200, { ok: true }];
    }
  }
  return [400, { error: 'act' }];
}

/** One request to the chat: [status, data]. Status 0 when the network failed. */
export async function chatCall(body) {
  if (!online) { try { return chLocal(body); } catch { return [507, { error: 'full' }]; } }
  try {
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    let data = {};
    try { data = await r.json(); } catch {}
    return [r.status, data || {}];
  } catch { return [0, {}]; }
}

/** Run `fn` every `ms()` milliseconds while the tab is visible, at once when woken. Returns a stop function. */
export function chatPoller(fn, ms) {
  let timer = 0, busy = false, stopped = false;
  const tick = async () => {
    clearTimeout(timer);
    if (stopped) return;
    if (!document.hidden && !busy) { busy = true; try { await fn(); } catch {} busy = false; }
    if (!stopped) timer = setTimeout(tick, ms());
  };
  const wake = () => { if (!busy) tick(); };
  const vis = () => { if (!document.hidden) wake(); };
  chWake.add(wake);
  document.addEventListener('visibilitychange', vis);
  timer = setTimeout(tick, 0);
  return () => { stopped = true; clearTimeout(timer); chWake.delete(wake); document.removeEventListener('visibilitychange', vis); };
}

/* ══════════════════════════════════════════════════════════════════════
   A conversation — messages kept in order, own messages tracked until sent
   ══════════════════════════════════════════════════════════════════════ */
/** role 'c' (shopper) or 's' (staff); auth is { token } or { admin }. */
export function chatThread(id, role, auth) {
  return { id, role, auth, rev: 0, meta: null, msgs: [], typing: '', typingAt: 0, gone: false, seenSent: 0 };
}

/** Fetch what changed. Returns true when something on screen should change. */
export async function chatSync(th, full = false) {
  const since = th.msgs.reduce((n, m) => (m.seq ? Math.max(n, m.seq) : n), 0);
  const [st, d] = await chatCall({ act: 'poll', id: th.id, ...th.auth, rev: full ? 0 : th.rev, since, full });
  if (st === 404 || st === 401) { th.gone = true; return true; }
  if (st !== 200 || d.same) {
    // the other side's typing light goes out on its own after a few seconds
    if (th.typing && Date.now() - th.typingAt > 7000) { th.typing = ''; return true; }
    return false;
  }
  th.rev = d.rev;
  th.meta = d.meta;
  if (d.typing) th.typingAt = Date.now();
  th.typing = d.typing || '';
  for (const m of d.msgs || []) {
    const mine = m.cid ? th.msgs.findIndex(x => !x.seq && x.cid === m.cid) : -1;
    if (mine >= 0) th.msgs.splice(mine, 1);
    if (th.msgs.some(x => x.seq === m.seq)) continue;
    th.msgs.push(m);
    if (m.kind === 'paid') { const p = th.msgs.find(x => x.seq === m.ref); if (p) Object.assign(p, { status: 'paid', method: m.method }); }
  }
  th.msgs.sort((a, b) => (a.seq || 1e9) - (b.seq || 1e9) || (a.at - b.at));
  return true;
}

/** Tell the other side we've seen everything they sent. */
export function chatSeen(th) {
  const theirs = th.role === 'c' ? 's' : 'c';
  const last = th.msgs.reduce((n, m) => (m.seq && (m.from === theirs || m.from === 'sys') ? Math.max(n, m.seq) : n), 0);
  if (last > th.seenSent && !document.hidden) { th.seenSent = last; chatCall({ act: 'seen', id: th.id, ...th.auth, seq: last }); }
}

/** Send a message: it shows at once (clock), then gets its ticks, or "not sent". */
export async function chatSend(th, msg, paint, extra = {}) {
  const again = th.msgs.includes(msg);   // a retry of a message that wasn't sent
  const local = again ? Object.assign(msg, { state: 'sending' }) : { ...msg, cid: msg.cid || chRand(10), from: th.role, at: Date.now(), state: 'sending' };
  if (!again) th.msgs.push(local);
  paint();
  try {
    if (local.file) {   // upload first, then send the link to it
      local.state = 'uploading'; paint();
      local.url = await chatUpload(th, local.file, local.name);
      delete local.file; local.state = 'sending'; paint();
    }
    const { preview, state: _s, file, ...clean } = local;
    const [st, d] = await chatCall({ act: 'send', id: th.id, ...th.auth, msg: clean, ...extra });
    if (st !== 200) throw new Error(d.error || 'net');
    local.seq = d.seq; local.at = d.at; delete local.state;
  } catch (e) {
    local.state = 'failed';
    if (e.message === 'finished') toast(t('ch.finishedD'));
    else if (e.message === 'type') toast(t('ch.badType'));
  }
  paint();
  return local;
}

/** Upload a file for this chat: Vercel Blob online, this browser's IndexedDB on localhost. */
async function chatUpload(th, file, name) {
  if (file.size > CH_MAX_MB * 1024 * 1024) { toast(t('ch.tooBig', { n: CH_MAX_MB })); throw new Error('big'); }
  if (!online) return putFile(file, name, { chat: true });
  const payload = th.auth.admin || JSON.stringify({ chat: th.id, token: th.auth.token });
  try { return await uploadToBlob(file, name, payload, 'tg/chat'); }
  catch (e) { if (/content type|not allowed/i.test(String(e?.message))) { toast(t('ch.badType')); throw new Error('type'); } throw e; }
}

/* ══════════════════════════════════════════════════════════════════════
   Message bubbles
   ══════════════════════════════════════════════════════════════════════ */
const CH_I = (d, s = 18, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const CHAT_ICON = {
  chat: CH_I('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.6-5.2A8.4 8.4 0 1 1 21 11.5z"/>', 24, 1.9),
  send: CH_I('<path d="M5 12l14-7-5 15-2.5-6.5L5 12z"/><path d="M11.5 13.5L19 5"/>', 20),
  mic: CH_I('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>', 20),
  clip: CH_I('<path d="M20.5 11.5l-8.2 8.2a5.3 5.3 0 0 1-7.5-7.5l8.6-8.6a3.5 3.5 0 0 1 5 5l-8.6 8.6a1.8 1.8 0 0 1-2.5-2.5l7.9-7.9"/>', 20),
  close: CH_I('<path d="M6 6l12 12M18 6L6 18"/>', 18, 2.2),
  file: CH_I('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>', 22, 1.8),
  card: CH_I('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>', 20, 1.8),
  box: CH_I('<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>', 20, 1.8),
  tick: CH_I('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 15, 2.4),
  ticks: '<svg width="19" height="15" viewBox="0 0 30 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12.5l4.5 4.5L17 7.5M13 16l1 1 9.5-9.5"/></svg>',
  wait: CH_I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 13, 2.2),
  alert: CH_I('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>', 15, 2.4),
  trash: CH_I('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>', 18),
  play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8z"/></svg>',
  pause: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg>',
  done: CH_I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>', 18, 2)
};

const chTime = at => new Date(at).toLocaleTimeString(langInfo().locale, { hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' });
const chDay = at => new Date(at).toLocaleDateString(langInfo().locale, { weekday: 'short', day: 'numeric', month: 'short', numberingSystem: 'latn' });
export const chatWhen = at => (Date.now() - at < 864e5 && new Date(at).getDate() === new Date().getDate() ? chTime(at) : chDay(at));
const chSize = n => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const chDur = s => { s = Math.round(s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** Text with its links made clickable (http and https only). */
function chLinkify(text) {
  const re = /\b((?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,;:!?)\]])/gi;
  let out = '', last = 0, m;
  while ((m = re.exec(text))) {
    out += esc(text.slice(last, m.index));
    const href = m[1].startsWith('www.') ? 'https://' + m[1] : m[1];
    out += `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer nofollow" dir="ltr">${esc(m[1])}</a>`;
    last = m.index + m[1].length;
  }
  return (out + esc(text.slice(last))).replace(/\n/g, '<br>');
}

/** A file's address on screen: local previews, then this browser's stored files, then the web address. */
const chSrc = m => (m.preview ? m.preview : isRef(m.url) ? '' : m.url || '');
const chRefAttr = m => (!m.preview && isRef(m.url) ? ` data-ref="${esc(m.url)}"` : '');

function chBody(m, role) {
  const src = esc(chSrc(m)), ref = chRefAttr(m);
  switch (m.kind) {
    case 'text': return `<p class="ch-text" dir="auto">${chLinkify(m.text || '')}</p>`;
    case 'image': return `<button type="button" class="ch-photo" data-zoom aria-label="${esc(t('ch.openPhoto'))}"><img src="${src}"${ref} alt="${esc(m.name || '')}" loading="lazy"></button>${m.text ? `<p class="ch-text" dir="auto">${chLinkify(m.text)}</p>` : ''}`;
    case 'video': return `<video class="ch-video" src="${src}"${ref} controls playsinline preload="metadata"></video>`;
    case 'audio': return `<div class="ch-voice" data-voice>
        <button type="button" class="ch-play" data-play aria-label="${esc(t('ch.play'))}">${CHAT_ICON.play}</button>
        <span class="ch-wave" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => `<i style="--h:${30 + Math.round(Math.abs(Math.sin((i + 1) * 1.7 + (m.dur || 3))) * 70)}%;--i:${(i / 26).toFixed(3)}"></i>`).join('')}</span>
        <span class="ch-dur">${chDur(m.dur)}</span>
        <audio src="${src}"${ref} preload="metadata"></audio></div>`;
    case 'file': return `<a class="ch-file" href="${src || '#'}"${ref} target="_blank" rel="noopener" download="${esc(m.name || 'file')}">
        ${CHAT_ICON.file}<span><b dir="auto">${esc(m.name || t('ch.file'))}</b><small>${esc(chSize(m.size || 0))} · ${esc(t('ch.download'))}</small></span></a>`;
    case 'product': {
      const p = byId[m.product];
      return `<div class="ch-product">
        ${p ? media(p, 'thumb') : m.img ? `<img class="thumb" src="${esc(m.img)}" alt="">` : ''}
        <div><b dir="auto">${esc(m.title)}</b>${m.price ? `<span>${tnd(m.price)}</span>` : ''}
        ${p ? `<a class="see-all" href="#/product/${esc(p.id)}">${esc(t('ch.viewProduct'))}</a>` : ''}</div></div>
        ${m.code ? `<div class="ch-code"><small>${esc(t('ch.yourCode'))}</small><code dir="ltr">${esc(m.code)}</code>
          <button type="button" class="mini" data-copy="${esc(m.code)}">${ICON.copy}<span>${esc(t('ch.copy'))}</span></button></div>` : ''}`;
    }
    case 'pay': {
      const paid = m.status === 'paid';
      return `<div class="ch-pay ${paid ? 'is-paid' : ''}">
        <div class="ch-pay-head">${CHAT_ICON.card}<span>${esc(t('ch.pay'))}</span></div>
        <strong>${tnd(m.amount)}</strong>
        ${m.note ? `<p dir="auto">${esc(m.note)}</p>` : ''}
        ${paid ? `<span class="pill pill-delivered">${ICON.check} ${esc(m.method ? t('ch.paidVia', { method: payLabel(m.method) }) : t('ch.paid'))}</span>`
          : role === 'c' && m.seq ? `<button type="button" class="btn btn-solid btn-sm" data-pay="${m.seq}">${esc(t('ch.payNow', { amount: tnd(m.amount) }))}</button>`
          : `<span class="pill pill-processing">${esc(t('ch.waitingPay'))}</span>`}</div>`;
    }
  }
  return '';
}

/** The ticks on your own message. */
function chTick(m, th) {
  if (m.state === 'failed') return `<span class="ch-tick failed">${CHAT_ICON.alert}</span>`;
  if (m.state === 'uploading') return `<span class="ch-tick"><i class="ch-spin"></i></span>`;
  if (!m.seq) return `<span class="ch-tick" title="${esc(t('ch.sending'))}">${CHAT_ICON.wait}</span>`;
  const meta = th.meta || {}, recv = th.role === 'c' ? meta.sRecv : meta.cRecv, seen = th.role === 'c' ? meta.sSeen : meta.cSeen;
  if (seen >= m.seq) return `<span class="ch-tick seen" title="${esc(t('ch.seen'))}">${CHAT_ICON.ticks}</span>`;
  if (recv >= m.seq) return `<span class="ch-tick" title="${esc(t('ch.delivered'))}">${CHAT_ICON.ticks}</span>`;
  return `<span class="ch-tick" title="${esc(t('ch.sent'))}">${CHAT_ICON.tick}</span>`;
}

function chSys(m) {
  const text = m.kind === 'start' ? t('ch.started') : m.kind === 'finish' ? t('ch.finished') : m.kind === 'reopen' ? t('ch.reopened')
    : m.kind === 'paid' ? t('ch.paidLine', { amount: tnd(m.amount || 0) }) : '';
  return `<div class="ch-sys ${m.kind === 'finish' || m.kind === 'paid' ? 'ok' : ''}">${m.kind === 'finish' || m.kind === 'paid' ? CHAT_ICON.done : ''}<span>${esc(text)}</span><small>${esc(chatWhen(m.at))}</small></div>`;
}

const chKey = m => (m.cid ? 'c' + m.cid : 's' + m.seq);
const chSig = m => [m.kind, m.status || '', m.url || '', m.preview ? 1 : 0, m.seq ? 1 : 0].join('|');

/** Draw the conversation into `list`, touching only what changed (a playing voice note keeps playing). */
export function chatPaint(list, th, { by = '' } = {}) {
  if (!list) return;
  const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  const seenKeys = new Set();
  let prev = null;
  for (const m of th.msgs) {
    const key = chKey(m);
    seenKeys.add(key);
    let node = list.querySelector(`[data-k="${CSS.escape(key)}"]`);
    const sig = chSig(m);
    if (!node || node.dataset.sig !== sig) {
      const mine = m.from === th.role;
      const html = m.from === 'sys' ? chSys(m)
        : `<div class="ch-msg ${mine ? 'mine' : 'theirs'} k-${esc(m.kind)}">
            ${!mine && th.role === 's' ? '' : !mine && m.by ? `<small class="ch-by">${esc(m.by)}</small>` : ''}
            <div class="ch-bubble">${chBody(m, th.role)}
              <span class="ch-meta"><time>${esc(chTime(m.at))}</time>${mine ? '<span class="ch-tk"></span>' : ''}</span></div>
            ${mine ? `<button type="button" class="ch-retry" data-retry="${esc(m.cid || '')}" hidden>${esc(t('ch.notSent'))}</button>` : ''}
          </div>`;
      const tmp = document.createElement('div');
      tmp.innerHTML = html.trim();
      const fresh = tmp.firstElementChild;
      fresh.dataset.k = key; fresh.dataset.sig = sig;
      if (node) node.replaceWith(fresh);
      else if (prev) prev.after(fresh);
      else list.prepend(fresh);
      node = fresh;
      chResolve(node);
    } else if (prev ? node.previousElementSibling !== prev : node !== list.firstElementChild) {
      if (prev) prev.after(node); else list.prepend(node);
    }
    if (m.from === th.role) {
      const tk = node.querySelector('.ch-tk'), r = node.querySelector('.ch-retry');
      if (tk) { const h = chTick(m, th); if (tk.innerHTML !== h) tk.innerHTML = h; }
      if (r) r.hidden = m.state !== 'failed';
      node.classList.toggle('failed', m.state === 'failed');
    }
    prev = node;
  }
  list.querySelectorAll('[data-k]').forEach(n => { if (!seenKeys.has(n.dataset.k)) n.remove(); });
  // typing / recording light
  let dots = list.querySelector('.ch-typing');
  if (th.typing) {
    if (!dots) { dots = document.createElement('div'); dots.className = 'ch-typing'; list.append(dots); }
    const h = th.typing === 'voice' ? `${CHAT_ICON.mic}<span>${esc(t('ch.recordingVoice'))}</span>` : `<i></i><i></i><i></i>`;
    if (dots.dataset.kind !== th.typing) { dots.innerHTML = h; dots.dataset.kind = th.typing; dots.classList.toggle('voice', th.typing === 'voice'); }
    list.append(dots);
  } else dots?.remove();
  if (nearBottom || th.msgs.at(-1)?.state === 'sending') list.scrollTop = list.scrollHeight;
}

/** Files kept in this browser (localhost): find their address once loaded. */
function chResolve(node) {
  node.querySelectorAll('[data-ref]').forEach(el => refUrl(el.dataset.ref).then(u => {
    if (!u) return;
    if (el.tagName === 'A') el.href = u; else el.src = u;
  }));
}

/* ══════════════════════════════════════════════════════════════════════
   Composer — text, files, voice; tells the other side we're typing
   ══════════════════════════════════════════════════════════════════════ */
export const composerHtml = (extra = '') => `
  <form class="ch-compose" novalidate>
    <div class="ch-rec" hidden>
      <button type="button" class="ch-ibtn danger" data-rec-cancel aria-label="${esc(t('ch.cancelRec'))}">${CHAT_ICON.trash}</button>
      <span class="ch-rec-dot" aria-hidden="true"></span><span class="ch-rec-time" aria-live="off">0:00</span>
      <span class="ch-rec-label">${esc(t('ch.recording'))}</span>
    </div>
    <div class="ch-tools">
      <label class="ch-ibtn" title="${esc(t('ch.attach'))}">${CHAT_ICON.clip}<span class="sr-only">${esc(t('ch.attach'))}</span>
        <input type="file" data-attach multiple hidden accept="image/*,video/*,audio/*,.pdf,.txt,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"></label>
      ${extra}
    </div>
    <textarea rows="1" name="text" dir="auto" maxlength="4000" placeholder="${esc(t('ch.placeholder'))}" aria-label="${esc(t('ch.placeholder'))}"></textarea>
    <button type="button" class="ch-ibtn ch-mic" data-mic aria-label="${esc(t('ch.voice'))}" title="${esc(t('ch.voice'))}">${CHAT_ICON.mic}</button>
    <button type="submit" class="ch-ibtn ch-send" aria-label="${esc(t('ch.send'))}" title="${esc(t('ch.send'))}" hidden>${CHAT_ICON.send}</button>
  </form>`;

const chKindOf = f => (/^image\//.test(f.type) ? 'image' : /^video\//.test(f.type) ? 'video' : /^audio\//.test(f.type) ? 'audio' : 'file');

/** Wire a composer. `send(msg)` sends; `typing(kind)` reports typing ('text' | 'voice' | ''). Returns a stop function. */
export function mountComposer(form, { send, typing }) {
  const ta = form.querySelector('textarea'), mic = form.querySelector('[data-mic]'), sendBtn = form.querySelector('.ch-send');
  const rec = form.querySelector('.ch-rec'), recTime = form.querySelector('.ch-rec-time');
  let typingNow = '', typingSent = 0, idle = 0;
  const report = kind => {
    clearTimeout(idle);
    if (kind && kind === typingNow && Date.now() - typingSent < 3000) { idle = setTimeout(() => report(''), 4000); return; }
    if (kind === typingNow && !kind) return;
    typingNow = kind; typingSent = Date.now();
    typing(kind);
    if (kind === 'text') idle = setTimeout(() => report(''), 4000);
  };
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 132) + 'px'; };
  const swap = () => { const has = !!ta.value.trim(); sendBtn.hidden = !has || recording; mic.hidden = has || recording; };
  const submit = () => {
    const text = ta.value.trim();
    if (!text) return;
    ta.value = ''; grow(); swap(); report('');
    send({ kind: 'text', text });
    ta.focus();
  };
  const onInput = () => { grow(); swap(); report(ta.value.trim() ? 'text' : ''); };
  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(hover: hover)').matches) { e.preventDefault(); submit(); } };
  const onSubmit = e => { e.preventDefault(); if (recording) stopRec(true); else submit(); };
  const onFile = e => {
    const files = [...(e.target.files || [])].slice(0, 10);
    e.target.value = '';
    files.forEach(f => {
      if (f.size > CH_MAX_MB * 1024 * 1024) { toast(t('ch.tooBig', { n: CH_MAX_MB })); return; }
      const kind = chKindOf(f);
      send({ kind, file: f, name: f.name.slice(0, 120), mime: (f.type || '').split(';')[0], size: f.size,
        preview: kind === 'file' ? '' : URL.createObjectURL(f) });
    });
  };
  form.querySelector('[data-attach]').addEventListener('change', onFile);
  // paste a screenshot straight into the box
  const onPaste = e => {
    const files = [...(e.clipboardData?.files || [])].filter(f => /^image\//.test(f.type));
    if (!files.length) return;
    e.preventDefault();
    files.forEach(f => send({ kind: 'image', file: f, name: f.name || 'screenshot.png', mime: f.type, size: f.size, preview: URL.createObjectURL(f) }));
  };

  /* voice messages */
  let recording = false, mr = null, chunks = [], started = 0, clock = 0, stream = null, keepAlive = 0;
  const showRec = on => {
    rec.hidden = !on; ta.hidden = on; form.querySelector('.ch-tools').hidden = on;
    form.classList.toggle('is-rec', on);
    mic.hidden = on; sendBtn.hidden = !on;
    if (!on) swap();
  };
  async function startRec() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast(t('ch.noMic')); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { toast(t('ch.micDenied')); return; }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(x => MediaRecorder.isTypeSupported?.(x)) || '';
    mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    chunks = [];
    mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    mr.start(250);
    recording = true; started = Date.now();
    showRec(true);
    recTime.textContent = '0:00';
    clock = setInterval(() => { recTime.textContent = chDur((Date.now() - started) / 1000); if (Date.now() - started > 5 * 60e3) stopRec(true); }, 250);
    typing('voice'); typingNow = 'voice';
    keepAlive = setInterval(() => typing('voice'), 3000);
  }
  function stopRec(keep) {
    if (!recording) return;
    recording = false;
    clearInterval(clock); clearInterval(keepAlive);
    const dur = (Date.now() - started) / 1000;
    mr.onstop = () => {
      stream?.getTracks().forEach(tr => tr.stop());
      if (keep && dur >= 0.6 && chunks.length) {
        const type = (mr.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(chunks, { type });
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        send({ kind: 'audio', file: blob, name: `voice-${new Date().toISOString().slice(0, 19).replace(/\D/g, '')}.${ext}`, mime: type, size: blob.size, dur, preview: URL.createObjectURL(blob) });
      }
    };
    mr.stop();
    showRec(false);
    typingNow = ''; typing('');
  }
  const onMic = () => (recording ? stopRec(true) : startRec());
  const onCancel = () => stopRec(false);

  ta.addEventListener('input', onInput);
  ta.addEventListener('keydown', onKey);
  ta.addEventListener('paste', onPaste);
  ta.addEventListener('blur', () => { if (!recording) report(''); });
  form.addEventListener('submit', onSubmit);
  mic.addEventListener('click', onMic);
  form.querySelector('[data-rec-cancel]').addEventListener('click', onCancel);
  swap();
  return {
    stop() { clearTimeout(idle); if (recording) stopRec(false); if (typingNow) typing(''); },
    insert(text) { ta.value = text; grow(); swap(); ta.focus(); }
  };
}

/* Clicks inside a conversation: voice notes, photos, copy, retry, pay. */
export function wireThread(root, { retry, pay } = {}) {
  const onClick = e => {
    const play = e.target.closest('[data-play]');
    if (play) {
      const box = play.closest('[data-voice]'), au = box.querySelector('audio');
      root.querySelectorAll('[data-voice] audio').forEach(a => { if (a !== au) a.pause(); });
      if (au.paused) au.play().catch(() => toast(t('ch.cantPlay'))); else au.pause();
      return;
    }
    const zoom = e.target.closest('[data-zoom]');
    if (zoom) { chZoom(zoom.querySelector('img').src); return; }
    const copy = e.target.closest('[data-copy]');
    if (copy) { navigator.clipboard?.writeText(copy.dataset.copy).then(() => toast(t('ch.copied'), true), () => {}); return; }
    const r = e.target.closest('[data-retry]');
    if (r) { retry?.(r.dataset.retry); return; }
    const p = e.target.closest('[data-pay]');
    if (p) { pay?.(+p.dataset.pay); return; }
    const wave = e.target.closest('.ch-wave');
    if (wave) {
      const au = wave.closest('[data-voice]').querySelector('audio'), r2 = wave.getBoundingClientRect();
      if (au.duration && isFinite(au.duration)) { let x = (e.clientX - r2.left) / r2.width; if (getComputedStyle(wave).direction === 'rtl') x = 1 - x; au.currentTime = au.duration * x; }
    }
  };
  const onMedia = e => {
    const au = e.target;
    if (au.tagName !== 'AUDIO') return;
    const box = au.closest('[data-voice]');
    if (!box) return;
    const btn = box.querySelector('[data-play]');
    if (e.type === 'play') { btn.innerHTML = CHAT_ICON.pause; box.classList.add('playing'); }
    if (e.type === 'pause' || e.type === 'ended') { btn.innerHTML = CHAT_ICON.play; box.classList.remove('playing'); }
    if (e.type === 'ended') au.currentTime = 0;
    const d = isFinite(au.duration) ? au.duration : 0;
    if (e.type === 'timeupdate' || e.type === 'ended') {
      box.style.setProperty('--p', d ? (au.currentTime / d).toFixed(3) : 0);
      box.querySelector('.ch-dur').textContent = chDur(au.paused && !au.currentTime ? d || 0 : au.currentTime);
    }
  };
  root.addEventListener('click', onClick);
  ['play', 'pause', 'ended', 'timeupdate'].forEach(ev => root.addEventListener(ev, onMedia, true));
  return () => { root.removeEventListener('click', onClick); ['play', 'pause', 'ended', 'timeupdate'].forEach(ev => root.removeEventListener(ev, onMedia, true)); };
}

function chZoom(src) {
  if (!src) return;
  const box = Object.assign(document.createElement('div'), { className: 'ch-zoom', role: 'dialog', tabIndex: -1 });
  box.innerHTML = `<img src="${esc(src)}" alt=""><button type="button" class="ch-ibtn" aria-label="${esc(t('ch.close'))}">${CHAT_ICON.close}</button>`;
  const close = () => { box.remove(); document.removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'Escape') close(); };
  box.addEventListener('click', close);
  document.addEventListener('keydown', key);
  document.body.append(box);
  box.focus();
}

/* ══════════════════════════════════════════════════════════════════════
   The shopper's chat window
   ══════════════════════════════════════════════════════════════════════ */
const CH_MINE = 'tg.chat';   // { id, token } of this browser's chat
const chMine = () => { try { const c = JSON.parse(localStorage.getItem(CH_MINE)); return c && c.id && c.token ? c : null; } catch { return null; } };
const chSetMine = c => { try { c ? localStorage.setItem(CH_MINE, JSON.stringify(c)) : localStorage.removeItem(CH_MINE); } catch {} };

let chOpen = false, chTh = null, chStopPoll = null, chComposer = null, chUnwire = null, chAbout = '', chUnread = 0, chOff = false;
const CH_HIDE_ON = new Set(['admin', 'checkout', 'signup']);

/** The round chat button (store pages only). Called by the router on every page. */
export function chatFab(page) {
  let fab = document.getElementById('chatFab');
  const off = CH_HIDE_ON.has(page) || chOff;
  document.body.classList.toggle('has-chat', !off);
  if (off) { fab?.remove(); if (CH_HIDE_ON.has(page)) chClose(); return; }
  if (!fab) {
    fab = Object.assign(document.createElement('button'), { id: 'chatFab', className: 'ch-fab', type: 'button' });
    fab.addEventListener('click', () => (chOpen ? chClose() : chatOpen()));
    document.body.append(fab);
    chBackground();
  }
  fab.innerHTML = `${CHAT_ICON.chat}<span class="ch-badge" ${chUnread ? '' : 'hidden'}>${chUnread > 9 ? '9+' : chUnread}</span>`;
  fab.setAttribute('aria-label', t('ch.fab'));
  fab.title = t('ch.fab');
  fab.setAttribute('aria-expanded', String(chOpen));
}

/** Open the chat window; `product` names what the shopper is asking about. */
export function chatOpen(product = '') {
  if (product) chAbout = product;
  if (!chOpen) {
    chOpen = true;
    const panel = Object.assign(document.createElement('section'), { id: 'chatPanel', className: 'ch-panel', role: 'dialog' });
    panel.setAttribute('aria-label', t('ch.title'));
    document.body.append(panel);
    document.addEventListener('keydown', chEsc);
    requestAnimationFrame(() => panel.classList.add('open'));
    document.getElementById('chatFab')?.setAttribute('aria-expanded', 'true');
  }
  chDraw();
}

function chClose() {
  if (!chOpen) return;
  chOpen = false;
  chComposer?.stop(); chComposer = null;
  chUnwire?.(); chUnwire = null;
  const panel = document.getElementById('chatPanel');
  document.removeEventListener('keydown', chEsc);
  document.getElementById('chatFab')?.setAttribute('aria-expanded', 'false');
  if (panel) { panel.classList.remove('open'); setTimeout(() => panel.remove(), 260); }
  chBackground();
}
const chEsc = e => { if (e.key === 'Escape' && !document.querySelector('.ch-zoom, .ch-sheet')) chClose(); };

const chHead = sub => `
  <header class="ch-head">
    <span class="ch-avatar brand" aria-hidden="true">${CHAT_ICON.chat}</span>
    <div class="ch-who"><b>${esc(t('brand'))}</b><small class="ch-status">${sub}</small></div>
    <button type="button" class="ch-ibtn" data-close aria-label="${esc(t('ch.close'))}">${CHAT_ICON.close}</button>
  </header>`;

function chAboutCard(id) {
  const p = byId[id];
  return p ? `<a class="ch-about" href="#/product/${esc(p.id)}">${media(p, 'thumb')}<span><small>${esc(t('ch.aboutL'))}</small><b dir="auto">${esc(p.short)}</b></span><span class="now">${tnd(p.price)}</span></a>` : '';
}

/** Draw the window for where the shopper is: start form, conversation, or finished. */
function chDraw() {
  const panel = document.getElementById('chatPanel');
  if (!panel) return;
  chComposer?.stop(); chComposer = null;
  chUnwire?.(); chUnwire = null;
  const mine = chMine();
  if (!mine) {
    const p = state.profile || {};
    panel.innerHTML = `${chHead(esc(t('ch.sub')))}
      <form class="ch-start" novalidate>
        <div class="ch-hello">${CHAT_ICON.chat}<h2>${esc(t('ch.startTitle'))}</h2><p>${esc(t('ch.startD'))}</p></div>
        ${chAboutCard(chAbout)}
        <label class="ch-field"><span>${esc(t('ch.name'))}</span><input name="name" autocomplete="name" maxlength="60" required value="${esc([p.firstName || p.name || '', p.lastName || ''].join(' ').trim())}"></label>
        <label class="ch-field"><span>${esc(t('ch.phone'))}</span><input name="phone" type="tel" autocomplete="tel" maxlength="30" dir="ltr" value="${esc(p.phone || '')}"></label>
        <button class="btn btn-solid" type="submit">${CHAT_ICON.chat} ${esc(t('ch.start'))}</button>
        ${online ? '' : `<p class="ch-note">${esc(t('ch.localNote'))}</p>`}
      </form>`;
    panel.querySelector('[data-close]').addEventListener('click', chClose);
    const f = panel.querySelector('.ch-start');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const name = f.elements.name.value.trim();
      if (!name) { f.elements.name.focus(); toast(t('ch.needName')); return; }
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      const [st, d] = await chatCall({ act: 'open', name, phone: f.elements.phone.value.trim(), product: chAbout, lang: lang() });
      btn.disabled = false;
      if (st !== 200) { toast(t(st === 429 ? 'ch.tooMany' : st === 503 ? 'ch.unavailable' : 'ch.err')); return; }
      chSetMine({ id: d.id, token: d.token });
      chAbout = '';
      chDraw();
    });
    setTimeout(() => f.elements.name.value ? f.elements.phone.focus() : f.elements.name.focus(), 50);
    return;
  }
  if (!chTh || chTh.id !== mine.id) chTh = chatThread(mine.id, 'c', { token: mine.token });
  const finished = chTh.meta?.status === 'finished';
  panel.innerHTML = `${chHead(esc(t('ch.sub')))}
    <div class="ch-list" role="log" aria-live="polite"></div>
    ${finished ? `<div class="ch-ended">${CHAT_ICON.done}<p>${esc(t('ch.finishedD'))}</p><button type="button" class="btn btn-solid btn-sm" data-new>${esc(t('ch.new'))}</button></div>` : composerHtml()}`;
  panel.querySelector('[data-close]').addEventListener('click', chClose);
  panel.querySelector('[data-new]')?.addEventListener('click', () => { chSetMine(null); chTh = null; chDraw(); });
  const list = panel.querySelector('.ch-list');
  const about = chTh.meta?.product || '';
  if (about) list.insertAdjacentHTML('beforebegin', chAboutCard(about).replace('class="ch-about"', 'class="ch-about pinned"'));
  const paint = () => { chatPaint(list, chTh); chHeadStatus(panel); };
  paint();
  if (!finished) {
    const form = panel.querySelector('.ch-compose');
    chComposer = mountComposer(form, {
      send: msg => chatSend(chTh, msg, paint),
      typing: kind => chatCall({ act: 'typing', id: chTh.id, token: mine.token, kind })
    });
    if (chAbout && chAbout !== about && byId[chAbout]) chComposer.insert(t('ch.askAbout', { name: byId[chAbout].short }));
    chAbout = '';
  }
  chUnwire = wireThread(panel, {
    retry: cid => { const m = chTh.msgs.find(x => x.cid === cid && x.state === 'failed'); if (m) chatSend(chTh, m, paint); },
    pay: seq => chPaySheet(seq)
  });
  chStartPoll();
}

function chHeadStatus(panel) {
  const s = panel.querySelector('.ch-status');
  if (!s || !chTh) return;
  const h = chTh.typing === 'voice' ? esc(t('ch.recordingVoice')) : chTh.typing ? esc(t('ch.typing')) : esc(t('ch.sub'));
  if (s.innerHTML !== h) s.innerHTML = h;
  s.classList.toggle('live', !!chTh.typing);
}

/** Poll quickly while the window is open, slowly (for the unread badge) when closed. */
function chStartPoll() {
  chStopPoll?.();
  if (!chMine()) { chStopPoll = null; return; }
  chStopPoll = chatPoller(async () => {
    const mine = chMine();
    if (!mine) return;
    if (!chTh || chTh.id !== mine.id) chTh = chatThread(mine.id, 'c', { token: mine.token });
    const wasFinished = chTh.meta?.status === 'finished';
    const before = chTh.msgs.filter(m => m.from === 's').length;
    if (!(await chatSync(chTh))) return;
    if (chTh.gone) { chSetMine(null); chTh = null; if (chOpen) chDraw(); return; }
    const panel = document.getElementById('chatPanel');
    if (chOpen && panel) {
      if ((chTh.meta?.status === 'finished') !== wasFinished || !panel.querySelector('.ch-list')) return chDraw();
      chatPaint(panel.querySelector('.ch-list'), chTh); chHeadStatus(panel);
      chatSeen(chTh);
      chUnread = 0;
    } else {
      const seen = chTh.meta?.cSeen || 0;
      chUnread = chTh.msgs.filter(m => m.from === 's' && m.seq > seen).length;
      if (chTh.msgs.filter(m => m.from === 's').length > before && before >= 0 && chUnread) {
        const last = chTh.msgs.filter(m => m.from === 's').at(-1);
        if (last && Date.now() - last.at < 15000) toast(t('ch.newMsg'));
      }
    }
    chBadge();
  }, () => (chOpen ? 1200 : chTh?.meta?.status === 'finished' ? 30000 : 5000));
}
function chBackground() { if (chMine()) chStartPoll(); }
function chBadge() {
  const b = document.querySelector('#chatFab .ch-badge');
  if (!b) return;
  b.hidden = !chUnread;
  b.textContent = chUnread > 9 ? '9+' : String(chUnread);
}

/* A payment request: pick a method, pay (demo — no money moves). */
function chPaySheet(seq) {
  const m = chTh?.msgs.find(x => x.seq === seq);
  if (!m || m.status === 'paid') return;
  if (m.link) { window.open(m.link, '_blank', 'noopener'); return; }
  const methods = PAYMENT_METHODS.filter(x => x !== 'cod');
  const logos = { clictopay: payLogos('visa', 'mc', 'edinar'), cardintl: payLogos('visa', 'mc'), d17: payLogos('d17'), ooredoo: payLogos('ooredoo') };
  const sheet = Object.assign(document.createElement('div'), { className: 'ch-sheet' });
  sheet.innerHTML = `<form class="ch-sheet-card" novalidate>
      <h3>${esc(t('ch.payTitle', { amount: tnd(m.amount) }))}</h3>
      ${m.note ? `<p dir="auto">${esc(m.note)}</p>` : ''}
      <div class="ch-methods">${methods.map((x, i) => `<label class="ch-method"><input type="radio" name="method" value="${esc(x)}" ${i ? '' : 'checked'}><span>${esc(payLabel(x))}</span><span class="pay-brands">${logos[x] || ''}</span></label>`).join('')}</div>
      <p class="ch-note">${esc(t('ch.payDemo'))}</p>
      <div class="ch-sheet-foot"><button type="button" class="btn btn-ghost" data-x>${esc(t('ch.cancel'))}</button>
      <button type="submit" class="btn btn-solid">${esc(t('ch.payNow', { amount: tnd(m.amount) }))}</button></div></form>`;
  const close = () => sheet.remove();
  sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-x]')) close(); });
  sheet.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.classList.add('busy');
    await new Promise(ok => setTimeout(ok, 900));
    const [st] = await chatCall({ act: 'paid', id: chTh.id, ...chTh.auth, seq, method: e.target.elements.method.value });
    if (st !== 200) { btn.disabled = false; btn.classList.remove('busy'); toast(t('ch.err')); return; }
    close();
    toast(t('ch.payDone'), true);
    chWake.forEach(f => f());
  });
  (document.getElementById('chatPanel') || document.body).append(sheet);
  sheet.querySelector('input')?.focus();
}

/** Off until the server answers that chat is set up (the live site without a database). */
export async function chatInit() {
  if (!online) return;
  const [st] = await chatCall({ act: 'ping' });
  if (st === 503) { chOff = true; document.getElementById('chatFab')?.remove(); document.body.classList.remove('has-chat'); }
}
