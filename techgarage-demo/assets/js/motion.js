/* TechGarage demo — motion.
   How pages arrive, how content builds up, and the small touches that make
   the store feel physical. Modelled on the reference build's GSAP timings
   (expo-out, 0.9–1.1 s, 50–80 ms staggers) but done with CSS animations,
   the View Transitions API and an IntersectionObserver — no library.
   Everything here steps aside when the shopper (or their device) asks for
   reduced motion. */

import { calm, esc } from './core.js?v=20261124o';

/** Is rich motion wanted right now? Also mirrored as html.motion for the CSS. */
export function motionOn() {
  const on = !calm();
  document.documentElement.classList.toggle('motion', on);
  return on;
}

/** Can the browser morph one page into the next? */
export const canMorph = () => typeof document.startViewTransition === 'function' && motionOn();

/* ── headings: words rise out of a mask, one after another ───────────── */
export function splitWords(el, first = 0) {
  if (!el || el.dataset.split || !motionOn()) return;
  const words = el.textContent.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;
  el.dataset.split = '1';
  el.classList.add('split');
  el.innerHTML = words.map((w, i) => `<span class="w"><span style="--wi:${i + first}">${esc(w)}</span></span>`).join(' ');
}

/* ── a new page builds itself up ─────────────────────────────────────── */
/* The pieces of each page that lift in, in reading order. */
const INTRO = [
  '.page > .crumbs', '.page-head .crumbs', '.page-head > div > p', '.page-head > :not(div)',
  '.cat-hero [data-intro]', '.cat-covers', '.shop-bar', '.sub-chips', '.filters',
  '.pdp > .media', '.pdp-info > :not(h1)', '.demo-note', '.success',
  '.checkout > *', '.order-layout > *', '.timeline', '.stats', '.order-list',
  '.settings > *', '.support-layout > *', '.adm-side', '.adm-toolbar', '.adm-body > .card', '.stat-tile', '.ov-row > .card',
  '.empty-state > *', '.not-found > *', '.note-list', '.page > .grid-tiles'
].join(',');
const TITLES = '.page-head h1, .cat-hero h1, .pdp-info h1, .not-found h1';

export function introduce(view) {
  if (!motionOn()) return;
  view.querySelectorAll(TITLES).forEach(h => splitWords(h));
  const below = innerHeight * 0.96;
  let i = 0;
  for (const el of view.querySelectorAll(INTRO)) {
    if (i >= 14 || el.getBoundingClientRect().top > below) continue;
    el.style.setProperty('--i', i++);
    el.classList.add('intro');
    el.addEventListener('animationend', () => el.classList.remove('intro'), { once: true });
  }
}

/* ── further down: content fades up as it scrolls into view ──────────── */
let watcher = null;
const REVEAL = '.grid-tiles > *, .block, .order-row, .adm-card, .adm-row, .faq details, .set-row';

export function revealOnScroll(view) {
  watcher?.disconnect();
  if (!motionOn() || !('IntersectionObserver' in window)) return;
  watcher = new IntersectionObserver(entries => {
    let n = 0;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      el.style.setProperty('--r', n++);
      el.classList.add('in');
      watcher.unobserve(el);
      // hand the element back to its own hover / press transitions afterwards
      setTimeout(() => el.classList.remove('reveal', 'in'), 1300 + n * 60);
    }
  }, { rootMargin: '0px 0px -6% 0px' });
  const below = innerHeight * 0.96;
  for (const el of view.querySelectorAll(REVEAL)) {
    if (el.closest('.intro') || el.getBoundingClientRect().top <= below) continue;
    el.classList.add('reveal');
    watcher.observe(el);
  }
}

/* ── cards tilt toward the pointer, with a sheen that follows it ─────── */
export function tiltCards(root) {
  if (matchMedia('(pointer: coarse)').matches) return;
  let frame = 0, last = null;
  const update = () => {
    frame = 0;
    const { card, x, y } = last;
    const r = card.getBoundingClientRect();
    const px = (x - r.left) / r.width, py = (y - r.top) / r.height;
    card.style.setProperty('--rx', `${(px - 0.5) * 7}deg`);
    card.style.setProperty('--ry', `${(0.5 - py) * 6}deg`);
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
  };
  root.addEventListener('pointermove', e => {
    if (!document.documentElement.classList.contains('motion')) return;
    const card = e.target.closest('.tile, .drop');
    if (!card) return;
    last = { card, x: e.clientX, y: e.clientY };
    if (!frame) frame = requestAnimationFrame(update);
  });
  root.addEventListener('pointerout', e => {
    const card = e.target.closest('.tile, .drop');
    if (card && !card.contains(e.relatedTarget)) for (const v of ['--rx', '--ry']) card.style.removeProperty(v);
  });
}

/* ── pointer parallax for layered artwork ([data-depth] children) ────── */
export function parallax(host) {
  if (!host || matchMedia('(pointer: coarse)').matches) return () => {};
  const move = e => {
    if (!document.documentElement.classList.contains('motion')) return;
    const r = host.getBoundingClientRect();
    host.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    host.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const leave = () => { host.style.setProperty('--px', 0); host.style.setProperty('--py', 0); };
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', leave);
  return () => { host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); };
}
