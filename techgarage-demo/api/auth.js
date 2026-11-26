/* POST /api/auth { key } → 200 when it is the admin password, 401 otherwise.
   Used by the admin lock screen on the live site. */

const { configured, isAdmin, readBody, send } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'method' }); }
  if (!configured() || !process.env.ADMIN_PASSWORD) return send(res, 503, { error: 'not-configured' });
  try {
    const { key } = await readBody(req);
    return (await isAdmin(req, key)) ? send(res, 200, { ok: true }) : send(res, 401, { error: 'password' });
  } catch (e) {
    console.error('api/auth', e);
    return send(res, 500, { error: 'server' });
  }
};
