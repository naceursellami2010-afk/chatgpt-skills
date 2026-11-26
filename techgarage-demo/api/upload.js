/* POST /api/upload — hands a browser a short-lived token to upload a file
   straight to Vercel Blob (no 4.5 MB function limit).
   - The admin sends the admin password as clientPayload: photos and videos.
   - A shopper in a live chat sends {"chat": id, "token": …}: photos, videos,
     voice notes and documents for that chat (smaller limit).
   Anyone else is refused. */

const crypto = require('crypto');
const { handleUpload } = require('@vercel/blob/client');
const { db, configured, isAdmin, readBody, send } = require('./_lib');

const ADMIN_TYPES = ['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'video/mp4', 'video/webm'];
const CHAT_TYPES = [...ADMIN_TYPES, 'video/quicktime',
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/x-m4a',
  'application/pdf', 'text/plain', 'application/zip', 'application/x-zip-compressed',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

/** A shopper's chat payload: is the token right for that open chat? */
async function chatAllowed(payload) {
  let p;
  try { p = JSON.parse(payload); } catch { return false; }
  if (!p || typeof p.chat !== 'string' || !/^[a-z0-9]{10,24}$/.test(p.chat) || typeof p.token !== 'string') return false;
  const h = await db().hmget(`tg:chat:${p.chat}`, 'token', 'status');
  const [hash, status] = Array.isArray(h) ? h : [h?.token, h?.status];
  return !!hash && String(status) !== 'finished' && String(hash) === crypto.createHash('sha256').update(p.token).digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'method' }); }
  if (!configured() || !process.env.BLOB_READ_WRITE_TOKEN) return send(res, 503, { error: 'not-configured' });
  try {
    const body = await readBody(req);
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const chat = String(clientPayload || '').startsWith('{');
        if (chat ? !(await chatAllowed(clientPayload)) : !(await isAdmin(req, clientPayload))) throw new Error('not allowed');
        const fromChat = chat || pathname.startsWith('tg/chat/');
        return {
          allowedContentTypes: fromChat ? CHAT_TYPES : ADMIN_TYPES,
          maximumSizeInBytes: (chat ? 50 : 300) * 1024 * 1024,
          addRandomSuffix: true
        };
      },
      onUploadCompleted: async () => {}
    });
    return send(res, 200, result);
  } catch (e) {
    return send(res, 400, { error: String(e.message || e) });
  }
};
