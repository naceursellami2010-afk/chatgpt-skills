/* TechGarage demo — content protection.
   Discourages casual copying: no right-click menu, no text selection or
   copying outside form fields, no dragging photos out, and the usual
   shortcuts for the developer tools, view-source and save-page are blocked.
   Form fields, the store admin and the "Copy" buttons for purchased keys keep
   working. A browser always receives the page's code, so this deters casual
   visitors; it cannot stop someone determined (browser menu, extensions,
   JavaScript turned off). */

import { toast } from './core.js?v=20261129d';
import { t } from './i18n.js?v=20261129d';

/* Places where selecting and copying stay allowed. */
const FREE = 'input, textarea, select, [contenteditable="true"], .allow-copy, [data-page="admin"]';
const isFree = el => !!(el instanceof Element ? el : el?.parentElement)?.closest(FREE);

let lastNotice = 0;
function refuse(e) {
  e.preventDefault();
  e.stopPropagation();
  if (Date.now() - lastNotice > 2500) {   // one notice, not one per key press
    lastNotice = Date.now();
    toast(t('protect.toast'));
  }
  return false;
}

/** Shortcuts that open the developer tools, the page source or "Save page as". */
function blockedShortcut(e) {
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (k === 'f12') return true;
  if (mod && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) return true;   // Ctrl+Shift+I/J/C/K (Chrome, Edge, Firefox)
  if (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k)) return true;   // ⌘⌥I/J/C/U (Mac)
  if (mod && !e.shiftKey && ['u', 's'].includes(k)) return true;   // view source, save page
  return false;
}

/* Another site showing the store inside a frame could trick shoppers into
   clicking (clickjacking). The store refuses to run inside one. */
function inFrame() {
  try { return window.top !== window.self; } catch { return true; }
}
function refuseFrame() {
  document.documentElement.classList.add('framed');
  const box = document.createElement('div');
  box.className = 'frame-block';
  box.setAttribute('role', 'alert');
  const p = document.createElement('p');
  p.textContent = t('protect.frame');
  const a = document.createElement('a');
  a.className = 'btn btn-solid';
  a.href = location.href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = t('protect.openHere');
  box.append(p, a);
  document.body.append(box);
}

/* Scammers ask people to paste code into the console ("self-XSS"). */
function consoleWarning() {
  const big = 'color:#e5484d;font:700 28px -apple-system,system-ui,sans-serif';
  const body = 'font:15px -apple-system,system-ui,sans-serif';
  console.log('%cStop! · Attention ! · توقف!', big);
  console.log('%cThis is a browser feature for developers. If someone told you to copy and paste something here, it is a scam and could give them access to your account.\n' +
    'Si quelqu’un vous a demandé de coller quelque chose ici, c’est une arnaque.\nإذا طلب منك أحد لصق شيء هنا، فهذه عملية احتيال.', body);
}

export function protect() {
  if (inFrame()) refuseFrame();
  consoleWarning();
  document.documentElement.classList.add('protected');
  addEventListener('keydown', e => { if (blockedShortcut(e)) refuse(e); }, true);
  document.addEventListener('contextmenu', e => { if (!isFree(e.target)) refuse(e); }, true);
  for (const type of ['copy', 'cut']) {
    document.addEventListener(type, e => { if (!isFree(e.target) && !isFree(document.activeElement)) refuse(e); }, true);
  }
  document.addEventListener('selectstart', e => { if (!isFree(e.target)) e.preventDefault(); }, true);
  document.addEventListener('dragstart', e => { if (e.target instanceof HTMLImageElement) e.preventDefault(); }, true);
}
