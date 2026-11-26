/* GET  /api/store?rev=N  → 204 when nothing changed since revision N, else { rev, record }
   POST /api/store        → save the admin record (header x-admin-key), returns { rev }
   Every save bumps the revision; open pages poll it and redraw when it moves. */

const { db, configured, KEY_RECORD, KEY_REV, isAdmin, readBody, send } = require('./_lib');

const MAX_BYTES = 3.5 * 1024 * 1024;   // a Vercel Function request body is capped at 4.5 MB

module.exports = async (req, res) => {
  // no database yet (Upstash not added in Vercel): say so plainly; pages then stop asking
  if (!configured()) return send(res, 503, { error: 'not-configured' });
  try {
    if (req.method === 'GET') {
      const rev = Number(await db().get(KEY_REV)) || 0;
      const seen = Number(new URL(req.url, 'http://x').searchParams.get('rev'));
      if (seen === rev && rev > 0) return send(res, 204);
      const record = rev ? await db().get(KEY_RECORD) : null;
      return send(res, 200, { rev, record: record || null });
    }
    if (req.method === 'POST') {
      if (!(await isAdmin(req, req.headers['x-admin-key']))) return send(res, 401, { error: 'password' });
      const body = await readBody(req);
      const record = body?.record;
      if (!record || typeof record !== 'object' || Array.isArray(record)) return send(res, 400, { error: 'record' });
      const text = JSON.stringify(record);
      if (Buffer.byteLength(text) > MAX_BYTES) return send(res, 413, { error: 'too-big' });
      const [, rev] = await db().multi().set(KEY_RECORD, text).incr(KEY_REV).exec();
      return send(res, 200, { rev });
    }
    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'method' });
  } catch (e) {
    console.error('api/store', e);
    return send(res, 500, { error: 'server' });
  }
};
