/* TechGarage demo — shared helpers for the API routes (Vercel Functions).
   The store's admin record lives in Upstash Redis so every admin and every
   shopper sees the same catalogue. Writes need the admin password
   (ADMIN_PASSWORD, set in the Vercel project), checked here. */

const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

let redis = null;
function db() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('Redis is not configured');
    redis = new Redis({ url, token });
  }
  return redis;
}

/** Is the shared database set up in the Vercel project? */
const configured = () => !!((process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN));

const KEY_RECORD = 'tg:record', KEY_REV = 'tg:rev';

/** Constant-time password check. */
function sameSecret(a, b) {
  const x = crypto.createHash('sha256').update(String(a || '')).digest();
  const y = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(x, y);
}

const clientIp = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

/** Is this request from an admin? Wrong guesses are limited to 20 per 15 minutes per address. */
async function isAdmin(req, given) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const tries = `tg:tries:${clientIp(req)}`;
  const n = Number(await db().get(tries)) || 0;
  if (n >= 20) return false;
  if (sameSecret(given, expected)) return true;
  await db().multi().incr(tries).expire(tries, 15 * 60).exec();
  return false;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const send = (res, status, data) => {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  if (data === undefined) return res.end();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

module.exports = { db, configured, KEY_RECORD, KEY_REV, isAdmin, readBody, send };
