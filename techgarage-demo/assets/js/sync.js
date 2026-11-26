/* TechGarage demo — shared store on the live site.
   On localhost nothing changes: the admin's edits stay in this browser.
   Online (Vercel), the admin record is kept by the server (/api/store):
   every page polls it every few seconds, so two admins — and every shopper —
   see the same products, prices, banners and layout, live. Saving needs the
   admin password, which the admin lock screen checks with /api/auth.
   Uploaded photos and videos go to Vercel Blob instead of this browser.
   No imports: core.js and media-store.js both use it. */

export const online = location.protocol === 'https:' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

const SYNC_KEY = 'tg.adminKey';   // the password, for this tab only (sessionStorage)
const SYNC_POLL_MS = 2500;
let syncRev = 0;
let syncOff = false;               // the server has no database set up: stop asking
let syncApply = null;
const syncSaving = new Set();    // revisions we wrote ourselves, so we don't redraw for our own save

export const adminKey = () => { try { return sessionStorage.getItem(SYNC_KEY) || ''; } catch { return ''; } };
export const forgetKey = () => { try { sessionStorage.removeItem(SYNC_KEY); } catch {} };

/** Online lock screen: is this the admin password? Kept for the tab when it is.
    'off' when the server has no database or password set up yet. */
export async function checkKey(key) {
  try {
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
    if (r.status === 503) return 'off';
    if (!r.ok) return false;
    try { sessionStorage.setItem(SYNC_KEY, key); } catch {}
    return true;
  } catch { return false; }
}

async function syncPull() {
  try {
    const r = await fetch(`/api/store?rev=${syncRev}`, { cache: 'no-store' });
    if (r.status === 503) { syncOff = true; return; }
    if (r.status === 204 || !r.ok) return;
    const d = await r.json();
    if (typeof d.rev !== 'number' || d.rev === syncRev) return;
    const mine = syncSaving.has(d.rev);
    syncRev = d.rev;
    if (!mine && d.record) syncApply?.(d.record);
  } catch { /* offline for a moment: the next poll tries again */ }
}

/** Load the shared store once (before the first page is drawn), then keep polling. */
export async function startSync(apply) {
  if (!online) return;
  syncApply = apply;
  await Promise.race([syncPull(), new Promise(ok => setTimeout(ok, 3500))]);
  if (syncOff) return;
  const timer = setInterval(() => { if (syncOff) return clearInterval(timer); if (!document.hidden) syncPull(); }, SYNC_POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !syncOff) syncPull(); });
}

/** Save the admin record for everyone. Returns false when the password is missing or wrong. */
export async function pushRecord(record) {
  if (!online) return true;
  try {
    const r = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey() },
      body: JSON.stringify({ record })
    });
    if (r.status === 401) { forgetKey(); return false; }
    if (!r.ok) return false;
    const d = await r.json();
    syncSaving.add(d.rev); syncRev = Math.max(syncRev, d.rev);
    return true;
  } catch { return false; }
}

/** Online uploads: straight to Vercel Blob; returns the file's public https URL.
    The live chat passes its own payload ({"chat", "token"}) and folder. */
export async function uploadToBlob(blob, name, payload = adminKey(), folder = 'tg') {
  const { upload } = await import('../vendor/blob-client.js');
  const type = (blob.type || 'application/octet-stream').split(';')[0];
  const ext = String(name || '').match(/\.([a-z0-9]{1,5})$/i)?.[1]?.toLowerCase() || (type.split('/')[1] || 'bin').replace(/[^a-z0-9]/g, '').slice(0, 5);
  const safe = String(name || 'file').replace(/\.[a-z0-9]{1,5}$/i, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40) || 'file';
  const out = await upload(`${folder}/${safe}.${ext}`, blob, { access: 'public', handleUploadUrl: '/api/upload', clientPayload: payload, contentType: type });
  return out.url;
}
