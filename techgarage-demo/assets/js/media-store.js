/* TechGarage demo — uploaded files (photos, banners, videos, redeem pictures).
   The admin's record lives in localStorage, which only holds a few MB, so
   uploaded files go to IndexedDB instead (hundreds of MB) and the record keeps
   a short reference, "idb:<id>". At start-up every file gets an object URL, so
   pages can be drawn synchronously: srcOf(ref) turns a reference into a URL.
   Demo note: the files stay in this browser; a real store would upload them
   to its server or a storage bucket. */

const MEDIA_DB = 'tg-media', MEDIA_OS = 'files';
const mediaUrls = new Map();          // ref → object URL
const mediaTypes = new Map();         // ref → mime type
let mediaDb = null;

const openMediaDb = () => new Promise((ok, fail) => {
  if (!('indexedDB' in window)) return fail(new Error('no indexedDB'));
  const req = indexedDB.open(MEDIA_DB, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(MEDIA_OS);
  req.onsuccess = () => ok(req.result);
  req.onerror = () => fail(req.error);
});
const mediaTx = (mode, fn) => new Promise((ok, fail) => {
  const t = mediaDb.transaction(MEDIA_OS, mode), s = t.objectStore(MEDIA_OS);
  const out = fn(s);
  t.oncomplete = () => ok(out?.result ?? out);
  t.onerror = t.onabort = () => fail(t.error);
});

import { online, uploadToBlob } from './sync.js?v=20261129d';

export const isRef = v => typeof v === 'string' && /^idb:[a-z0-9]{6,40}$/.test(v);

/** A URL for a picture or video: stored files resolve to their object URL, anything else passes through. */
export const srcOf = v => (isRef(v) ? mediaUrls.get(v) || '' : v || '');
export const typeOf = v => mediaTypes.get(v) || '';

/** Load every stored file once, before the store first draws. Never throws. */
export const mediaReady = (async () => {
  try {
    mediaDb = await openMediaDb();
    await new Promise((ok, fail) => {
      const req = mediaDb.transaction(MEDIA_OS).objectStore(MEDIA_OS).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return ok();
        const ref = 'idb:' + c.key, blob = c.value;
        if (blob instanceof Blob) { mediaUrls.set(ref, URL.createObjectURL(blob)); mediaTypes.set(ref, blob.type); }
        c.continue();
      };
      req.onerror = () => fail(req.error);
    });
  } catch { mediaDb = null; }   // private mode or no IndexedDB: uploads are refused, the store still works
})();

export const available = () => online || !!mediaDb;

/** Keep a file; returns its reference. */
export async function putFile(blob, name, { chat = false } = {}) {
  if (online) return uploadToBlob(blob, name);   // the live site: Vercel Blob, so every admin and shopper sees it
  await mediaReady;
  if (!mediaDb) throw new Error('storage unavailable');
  // live-chat files are kept apart ("chat…"): the admin's clean-up never touches them
  const id = (chat ? 'chat' : '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await mediaTx('readwrite', s => s.put(blob, id));
  const ref = 'idb:' + id;
  mediaUrls.set(ref, URL.createObjectURL(blob)); mediaTypes.set(ref, blob.type);
  return ref;
}

/** A stored file another tab added after this one started (the live chat on localhost). */
export async function refUrl(ref) {
  if (!isRef(ref)) return '';
  if (mediaUrls.has(ref)) return mediaUrls.get(ref);
  await mediaReady;
  if (!mediaDb) return '';
  const blob = await mediaTx('readonly', s => s.get(ref.slice(4)));
  if (!(blob instanceof Blob)) return '';
  mediaUrls.set(ref, URL.createObjectURL(blob)); mediaTypes.set(ref, blob.type);
  return mediaUrls.get(ref);
}

/** Forget files nothing points to any more (called after saving the record). */
export async function keepOnly(used) {
  await mediaReady;
  if (!mediaDb) return;
  const drop = [...mediaUrls.keys()].filter(r => !used.has(r) && !r.startsWith('idb:chat'));
  if (!drop.length) return;
  await mediaTx('readwrite', s => drop.forEach(r => s.delete(r.slice(4))));
  drop.forEach(r => { URL.revokeObjectURL(mediaUrls.get(r)); mediaUrls.delete(r); mediaTypes.delete(r); });
}

/** Every reference inside a value (the admin record), found by walking it. */
export function refsIn(v, out = new Set()) {
  if (isRef(v)) out.add(v);
  else if (Array.isArray(v)) v.forEach(x => refsIn(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach(x => refsIn(x, out));
  return out;
}

/** For export: the referenced files as data URLs (so the edits move to another browser). */
export async function packFiles(refs) {
  await mediaReady;
  const out = {};
  for (const ref of refs) {
    if (!mediaUrls.has(ref) || !mediaDb) continue;
    const blob = await mediaTx('readonly', st => st.get(ref.slice(4)));   // read the file itself: the page may not fetch blob: URLs (CSP)
    if (!(blob instanceof Blob)) continue;
    out[ref] = await new Promise((ok, fail) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = fail; fr.readAsDataURL(blob); });
  }
  return out;
}

/** For import: files packed by packFiles, kept under the same references. */
export async function unpackFiles(packed) {
  await mediaReady;
  if (!mediaDb || !packed || typeof packed !== 'object') return 0;
  let n = 0;
  for (const [ref, data] of Object.entries(packed)) {
    if (!isRef(ref) || typeof data !== 'string' || !/^data:(image|video)\/[\w.+-]+;base64,/.test(data)) continue;
    const [head, b64] = data.split(','), bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: head.slice(5, head.indexOf(';')) });
    await mediaTx('readwrite', s => s.put(blob, ref.slice(4)));
    if (mediaUrls.has(ref)) URL.revokeObjectURL(mediaUrls.get(ref));
    mediaUrls.set(ref, URL.createObjectURL(blob)); mediaTypes.set(ref, blob.type);
    n++;
  }
  return n;
}
