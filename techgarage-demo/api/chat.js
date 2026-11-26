/* POST /api/chat { act, … } — live chat between a shopper and the store's staff.

   A shopper opens a chat (act "open") and gets an id and a secret token; the
   staff use the admin password. Every change bumps a revision number, and open
   pages poll it ("poll" / "list"): an unchanged revision costs one Redis read.

   Redis keys, per chat <id>:
     tg:chat:<id>       hash  — name, phone, product, status, created, updated,
                                cRecv/cSeen (what the shopper has received / seen),
                                sRecv/sSeen (same for the staff), lastC/lastS, last
     tg:chat:<id>:m     list  — the messages, JSON; a message's seq is its position + 1
     tg:chat:<id>:v     revision of this chat
     tg:chat:<id>:tc    "text" | "voice" while the shopper types / records (expires)
     tg:chat:<id>:ts    the same for the staff
     tg:chats           sorted set of chat ids by last activity
     tg:chats:v         revision of the chat list (new chats, messages, finishing) */

const crypto = require('crypto');
const { db, configured, isAdmin, readBody, send } = require('./_lib');

const K = id => `tg:chat:${id}`;
const MAX_MSGS = 2000, MAX_TEXT = 4000, LIST_MAX = 80, TYPING_TTL = 6;
const MEDIA = ['image', 'video', 'audio', 'file'];
const LIMITS = { open: { max: 8, secs: 3600 }, send: { max: 40, secs: 60 } };   // per address

const sha = s => crypto.createHash('sha256').update(String(s || '')).digest('hex');
const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const num = v => Number(v) || 0;
const parse = v => (typeof v === 'string' ? (() => { try { return JSON.parse(v); } catch { return null; } })() : v);
const okId = id => typeof id === 'string' && /^[a-z0-9]{10,24}$/.test(id);
const httpsUrl = (u, blobOnly) => {
  try {
    const x = new URL(String(u));
    if (x.protocol !== 'https:') return '';
    if (blobOnly && !x.hostname.endsWith('.blob.vercel-storage.com')) return '';
    return x.href.slice(0, 1000);
  } catch { return ''; }
};
const ip = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

/** The chat's meta, numbers as numbers and strings as strings (Upstash turns "123" into 123). */
function cleanMeta(id, h) {
  if (!h) return null;
  const s = k => (h[k] === undefined || h[k] === null ? '' : String(h[k]));
  return {
    id, name: s('name'), phone: s('phone'), product: s('product'), lang: s('lang'), status: s('status') || 'open',
    created: num(h.created), updated: num(h.updated), finishedAt: num(h.finishedAt),
    cRecv: num(h.cRecv), cSeen: num(h.cSeen), sRecv: num(h.sRecv), sSeen: num(h.sSeen),
    lastC: num(h.lastC), lastS: num(h.lastS), count: num(h.count), last: parse(h.last) || null, tokenHash: s('token')
  };
}
const publicMeta = m => { const { tokenHash, ...rest } = m; return rest; };

/** A message as the sender wrote it, checked field by field. Returns null when it isn't acceptable. */
function cleanMsg(raw, staff) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = String(raw.kind || 'text');
  const m = { kind };
  if (kind === 'text') {
    m.text = clip(raw.text, MAX_TEXT);
    if (!m.text) return null;
  } else if (MEDIA.includes(kind)) {
    m.url = httpsUrl(raw.url, true);
    if (!m.url) return null;
    m.name = clip(raw.name, 120);
    m.mime = clip(raw.mime, 80);
    m.size = Math.max(0, Math.min(5e8, num(raw.size)));
    if (kind === 'audio' || kind === 'video') m.dur = Math.max(0, Math.min(3600, num(raw.dur)));
    if (raw.text) m.text = clip(raw.text, 1000);
  } else if (staff && kind === 'product') {
    m.product = clip(raw.product, 80);
    m.title = clip(raw.title, 160);
    m.img = httpsUrl(raw.img) || (/^assets\/[\w./-]+$/.test(String(raw.img || '')) ? String(raw.img) : '');
    m.price = Math.max(0, Math.min(1e7, num(raw.price)));
    m.code = clip(raw.code, 400);
    if (!m.title) return null;
  } else if (staff && kind === 'pay') {
    m.amount = Math.round(Math.max(0, Math.min(1e7, num(raw.amount))) * 1000) / 1000;
    m.note = clip(raw.note, 300);
    m.link = raw.link ? httpsUrl(raw.link) : '';
    m.status = 'pending';
    if (!m.amount) return null;
  } else return null;
  return m;
}
const preview = m => ({ kind: m.kind, text: m.kind === 'text' ? m.text.slice(0, 90) : m.kind === 'pay' ? String(m.amount) : (m.title || m.name || '').slice(0, 60) });

/** Who is asking: 'staff', 'client' (with the right token) or null. */
async function who(req, body, meta) {
  if (body.admin) return (await isAdmin(req, body.admin)) ? 'staff' : null;
  return meta && meta.tokenHash && body.token && meta.tokenHash === sha(body.token) ? 'client' : null;
}

async function bump(id, list = false) {
  const p = db().pipeline().incr(`${K(id)}:v`);
  if (list) p.incr('tg:chats:v');
  await p.exec();
}

async function append(id, msg, list = true) {
  const seq = await db().rpush(`${K(id)}:m`, JSON.stringify(msg));
  const who = msg.from === 'c' ? { lastC: seq } : msg.from === 's' ? { lastS: seq } : {};   // system lines count for neither side
  const p = db().pipeline()
    .hset(K(id), { updated: msg.at, ...who, count: seq, last: JSON.stringify({ ...preview(msg), from: msg.from, at: msg.at }) })
    .zadd('tg:chats', { score: msg.at, member: id })
    .incr(`${K(id)}:v`);
  if (list) p.incr('tg:chats:v');
  if ((msg.from === 'c' || msg.from === 's') && (msg.kind === 'text' || msg.kind === 'audio')) p.del(`${K(id)}:t${msg.from}`);
  await p.exec();
  return seq;
}

const ACTS = {
  /* is the chat set up? (no database → 503 before this runs) */
  async ping() { return [200, { ok: true }]; },

  /* a shopper starts a chat */
  async open(req, body) {
    const gate = `tg:chatnew:${ip(req)}`;
    const n = num(await db().incr(gate));
    if (n === 1) await db().expire(gate, 3600);
    if (n > 8) return [429, { error: 'too-many' }];
    const name = clip(body.name, 60), phone = clip(body.phone, 30).replace(/[^\d+ ]/g, '');
    if (!name) return [400, { error: 'name' }];
    const id = crypto.randomBytes(9).toString('hex').slice(0, 16);
    const token = crypto.randomBytes(24).toString('base64url');
    const now = Date.now();
    await db().hset(K(id), { name, phone, product: clip(body.product, 80), lang: clip(body.lang, 5), status: 'open',
      token: sha(token), created: now, updated: now, cRecv: 0, cSeen: 0, sRecv: 0, sSeen: 0, lastC: 0, lastS: 0, count: 0 });
    await append(id, { from: 'sys', kind: 'start', at: now });
    return [200, { id, token }];
  },

  /* both sides: what changed since revision `rev` (messages after `since`) */
  async poll(req, body) {
    const id = body.id;
    if (!okId(id)) return [400, { error: 'id' }];
    const rev = num(await db().get(`${K(id)}:v`));
    if (body.rev && num(body.rev) === rev && !body.full) return [200, { same: true, rev }];
    const meta = cleanMeta(id, await db().hgetall(K(id)));
    if (!meta || !meta.created) return [404, { error: 'gone' }];
    const role = await who(req, body, meta);
    if (!role) return [401, { error: 'auth' }];
    const since = Math.max(0, num(body.since));
    const [rows, typing] = await Promise.all([
      since < meta.count ? db().lrange(`${K(id)}:m`, since, -1) : [],
      db().get(`${K(id)}:t${role === 'staff' ? 'c' : 's'}`)
    ]);
    const msgs = rows.map(parse).filter(Boolean).map((m, i) => ({ ...m, seq: since + i + 1 }));
    // what this side has now received: the other side's ticks turn to "delivered"
    const mine = role === 'staff' ? 'sRecv' : 'cRecv';
    let out = rev;
    if (meta.count > meta[mine]) {
      await db().hset(K(id), { [mine]: meta.count });
      meta[mine] = meta.count;
      out = num(await db().incr(`${K(id)}:v`));
    }
    return [200, { rev: out, meta: publicMeta(meta), msgs, typing: typing ? String(typing) : '' }];
  },

  async send(req, body) {
    const id = body.id;
    if (!okId(id)) return [400, { error: 'id' }];
    const meta = cleanMeta(id, await db().hgetall(K(id)));
    if (!meta || !meta.created) return [404, { error: 'gone' }];
    const role = await who(req, body, meta);
    if (!role) return [401, { error: 'auth' }];
    if (meta.status === 'finished') return [409, { error: 'finished' }];
    if (meta.count >= MAX_MSGS) return [413, { error: 'full' }];
    const msg = cleanMsg(body.msg, role === 'staff');
    if (!msg) return [400, { error: 'msg' }];
    msg.from = role === 'staff' ? 's' : 'c';
    msg.at = Date.now();
    msg.cid = clip(body.msg.cid, 24);   // the sender's own id for it, so a retry isn't shown twice
    if (role === 'staff') msg.by = clip(body.by, 40);
    const seq = await append(id, msg);
    return [200, { seq, at: msg.at }];
  },

  /* "seen up to seq" */
  async seen(req, body) {
    const id = body.id;
    if (!okId(id)) return [400, { error: 'id' }];
    const meta = cleanMeta(id, await db().hgetall(K(id)));
    if (!meta || !meta.created) return [404, { error: 'gone' }];
    const role = await who(req, body, meta);
    if (!role) return [401, { error: 'auth' }];
    const f = role === 'staff' ? 'sSeen' : 'cSeen', r = role === 'staff' ? 'sRecv' : 'cRecv';
    const seq = Math.min(meta.count, num(body.seq));
    if (seq <= meta[f]) return [200, { ok: true }];
    await db().hset(K(id), { [f]: seq, [r]: Math.max(meta[r], seq) });
    await bump(id, role === 'staff');   // the staff list shows unread dots
    return [200, { ok: true }];
  },

  /* typing / recording indicator: kind "text" | "voice" | "" (stopped) */
  async typing(req, body) {
    const id = body.id;
    if (!okId(id)) return [400, { error: 'id' }];
    const meta = cleanMeta(id, await db().hgetall(K(id)));
    if (!meta || !meta.created) return [404, { error: 'gone' }];
    const role = await who(req, body, meta);
    if (!role) return [401, { error: 'auth' }];
    const key = `${K(id)}:t${role === 'staff' ? 's' : 'c'}`;
    const kind = body.kind === 'voice' ? 'voice' : body.kind === 'text' ? 'text' : '';
    if (kind) await db().set(key, kind, { ex: TYPING_TTL }); else await db().del(key);
    await bump(id);
    return [200, { ok: true }];
  },

  /* the shopper paid a payment request (demo: no money moves) */
  async paid(req, body) {
    const id = body.id;
    if (!okId(id)) return [400, { error: 'id' }];
    const meta = cleanMeta(id, await db().hgetall(K(id)));
    if (!meta || !meta.created) return [404, { error: 'gone' }];
    if ((await who(req, body, meta)) !== 'client') return [401, { error: 'auth' }];
    const seq = num(body.seq);
    if (seq < 1 || seq > meta.count) return [400, { error: 'seq' }];
    const m = parse(await db().lindex(`${K(id)}:m`, seq - 1));
    if (!m || m.kind !== 'pay') return [400, { error: 'seq' }];
    if (m.status === 'paid') return [200, { ok: true }];
    const method = clip(body.method, 20);
    const at = Date.now();
    await db().lset(`${K(id)}:m`, seq - 1, JSON.stringify({ ...m, status: 'paid', method, paidAt: at }));
    await append(id, { from: 'sys', kind: 'paid', ref: seq, amount: m.amount, method, at });
    return [200, { ok: true }];
  },

  /* staff: the chat is done — it moves to the log, with a green light */
  async finish(req, body) {
    const id = body.id;
    if (!okId(id)) return [400, { error: 'id' }];
    if (!(await isAdmin(req, body.admin))) return [401, { error: 'auth' }];
    const meta = cleanMeta(id, await db().hgetall(K(id)));
    if (!meta || !meta.created) return [404, { error: 'gone' }];
    const reopen = !!body.reopen, at = Date.now();
    if (reopen === (meta.status !== 'finished')) return [200, { ok: true }];
    await db().hset(K(id), { status: reopen ? 'open' : 'finished', finishedAt: reopen ? 0 : at });
    await append(id, { from: 'sys', kind: reopen ? 'reopen' : 'finish', by: clip(body.by, 40), at });
    return [200, { ok: true }];
  },

  /* staff: every chat, newest first */
  async list(req, body) {
    if (!(await isAdmin(req, body.admin))) return [401, { error: 'auth' }];
    const rev = num(await db().get('tg:chats:v'));
    if (body.rev && num(body.rev) === rev) return [200, { same: true, rev }];
    const ids = (await db().zrange('tg:chats', 0, LIST_MAX - 1, { rev: true })).map(String).filter(okId);
    if (!ids.length) return [200, { rev, chats: [] }];
    const p = db().pipeline();
    ids.forEach(id => p.hgetall(K(id)));
    const metas = (await p.exec()).map((h, i) => cleanMeta(ids[i], h)).filter(m => m && m.created);
    // the staff have now received every shopper message: their ticks turn to "delivered"
    const late = metas.filter(m => m.count > m.sRecv);
    if (late.length) {
      const q = db().pipeline();
      late.forEach(m => { q.hset(K(m.id), { sRecv: m.count }); q.incr(`${K(m.id)}:v`); m.sRecv = m.count; });
      await q.exec();
    }
    return [200, { rev, chats: metas.map(publicMeta) }];
  },

  /* staff: delete a finished chat for good */
  async remove(req, body) {
    const id = body.id;
    if (!okId(id)) return [400, { error: 'id' }];
    if (!(await isAdmin(req, body.admin))) return [401, { error: 'auth' }];
    await db().pipeline().del(K(id), `${K(id)}:m`, `${K(id)}:tc`, `${K(id)}:ts`).zrem('tg:chats', id).incr(`${K(id)}:v`).incr('tg:chats:v').exec();
    return [200, { ok: true }];
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'method' }); }
  if (!configured()) return send(res, 503, { error: 'not-configured' });
  try {
    const body = await readBody(req);
    const act = ACTS[body?.act];
    if (!act) return send(res, 400, { error: 'act' });
    // flood guard: new chats and messages are limited per address (staff included)
    const rule = LIMITS[body.act];
    if (rule) {
      const key = `tg:rl:${body.act}:${ip(req)}`;
      const [n] = await db().multi().incr(key).expire(key, rule.secs, 'NX').exec();
      if (num(n) > rule.max) return send(res, 429, { error: 'slow-down' });
    }
    const [status, data] = await act(req, body);
    return send(res, status, data);
  } catch (e) {
    console.error('api/chat', e);
    return send(res, 500, { error: 'server' });
  }
};
