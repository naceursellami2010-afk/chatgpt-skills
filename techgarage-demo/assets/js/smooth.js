/* TechGarage demo — smooth scrolling and scroll scenes.
   Lenis gives the wheel a soft, weighted glide; GSAP's ScrollTrigger runs the
   scroll-linked motion on top of it:
     · content further down fades up in staggered batches as it arrives
       (ScrollTrigger.batch), including the shop's later batches of tiles;
     · a little depth while scrolling: the home banner eases back, the
       category covers drift up, the product photo trails the page (scrub).
   On wide screens the content panel (#view) is what scrolls; on phones it is
   the page itself, where touch scrolling stays native. Lenis and GSAP are
   loaded from assets/vendor (no CDN, so the security policy stays 'self').
   Everything steps aside for reduced motion. */

import { calm } from './core.js?v=20261129d';

/* Phones and tablets scroll natively by touch, so they skip the libraries
   entirely (less work on a slow processor) and use motion.js's light reveal. */
const touchFirst = matchMedia('(hover: none) and (pointer: coarse)').matches || matchMedia('(max-width: 760px)').matches;
const lib = () => (!touchFirst && window.Lenis && window.gsap && window.ScrollTrigger ? { Lenis: window.Lenis, gsap: window.gsap, ST: window.ScrollTrigger } : null);

let lenis = null;
let host = null;          // #view
let scroller = null;      // #view (wide screens) or window (phones)
let scenes = [];          // ScrollTriggers and tweens of the current page

/* Nested scroll areas outside the page keep their own native scrolling. */
const PREVENT = '.gsel-pop, #drawer, #results, #mega, dialog, [data-lenis-prevent]';

const panelScrolls = () => getComputedStyle(host).overflowY !== 'visible';

function build() {
  const L = lib();
  if (!L) return;
  const next = panelScrolls() ? host : window;
  const wanted = !calm();
  if (lenis && scroller === next && wanted) return;
  lenis?.destroy();
  lenis = null;
  if (scroller !== next) killScenes(true);
  scroller = next;
  L.ST.defaults({ scroller: next === window ? window : next });
  if (!wanted) return;
  lenis = new L.Lenis({
    wrapper: next, content: next === window ? document.documentElement : next,
    duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),   // expo-out, as in the Lenis guide
    smoothWheel: true, allowNestedScroll: true, autoRaf: false,
    prevent: node => node.matches?.(PREVENT)
  });
  lenis.on('scroll', L.ST.update);
}

/* Lenis and GSAP are fetched only on computers: a phone never uses them, and
   parsing them cost a phone about 1.5 s of processor time at start-up. (The
   one-file build already has them inline, so nothing is fetched there.) */
const VENDOR = ['lenis.min.js', 'gsap.min.js', 'ScrollTrigger.min.js'];
function loadLibs() {
  if (touchFirst || (window.Lenis && window.gsap && window.ScrollTrigger)) return Promise.resolve();
  const tag = new URL(import.meta.url).search;   // same cache tag as this file
  return VENDOR.reduce((done, file) => done.then(() => new Promise(ok => {
    const s = Object.assign(document.createElement('script'), { src: new URL(`../vendor/${file}${tag}`, import.meta.url).href, async: false });
    s.onload = s.onerror = ok;
    document.head.append(s);
  })), Promise.resolve());
}

const libsReady = loadLibs();   // starts at once, alongside the app's own start-up

/** Start once, when the app boots (after the libraries arrive, on computers). */
export function initSmooth(view) {
  host = view;
  libsReady.then(() => { if (lib()) { startSmooth(); scrollScenes(view); } });
}
function startSmooth() {
  const L = lib();
  L.gsap.registerPlugin(L.ST);
  L.ST.config({ ignoreMobileResize: true });
  L.gsap.ticker.add(time => lenis?.raf(time * 1000));   // one clock for Lenis and GSAP
  L.gsap.ticker.lagSmoothing(0);
  build();
  document.addEventListener('tg:prefs', smoothSettingsChanged);
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 200); });
}

/** Motion settings changed (reduced motion on/off). */
export const smoothSettingsChanged = () => { build(); if (calm()) killScenes(true); };

/** A new page was drawn, or the scroll position set in code: jump there, no glide. */
export function syncScroll(y = null) {
  if (!lenis) return;
  lenis.resize();
  lenis.scrollTo(y ?? (scroller === window ? scrollY : host.scrollTop), { immediate: true, force: true });
}

/** More content arrived on the same page (e.g. the shop's next batch). */
export function contentGrew(root) {
  lenis?.resize();
  const L = lib();
  if (L && !calm()) { reveal(root); L.ST.refresh(); }
}

function killScenes(showAll = false) {
  for (const s of scenes) s.kill?.();
  scenes = [];
  watch?.disconnect(); watch = null;
  sizes?.disconnect(); sizes = null;
  if (showAll) host?.querySelectorAll('.reveal').forEach(el => { el.classList.remove('reveal'); el.style.removeProperty('opacity'); el.style.removeProperty('transform'); });
  // Anything still waiting to fade in has just lost its trigger (e.g. the home page's lower
  // sections can arrive before the page's scenes are set up): un-mark it, so the next
  // reveal() takes it on again instead of leaving it invisible for good.
  else host?.querySelectorAll('.reveal[data-rv]').forEach(el => { el.classList.remove('reveal'); delete el.dataset.rv; el.style.removeProperty('opacity'); el.style.removeProperty('transform'); });
}

/* Positions are measured when the page is drawn; pictures and the home page's
   later sections arrive afterwards and move everything, so a stale trigger could
   leave a section waiting (invisible) for a scroll position it never reaches.
   Two guards: re-measure whenever the content changes size, and show any
   waiting section that is actually on screen. */
let watch = null, sizes = null, remeasure = 0;
function guard(root, els) {
  const L = lib();
  const show = el => {
    if (!el.classList.contains('reveal')) return;
    L.gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', overwrite: true,
      onComplete: () => { el.classList.replace('reveal', 'revealed'); L.gsap.set(el, { clearProps: 'opacity,transform' }); } });
  };
  if ('IntersectionObserver' in window) {
    watch ??= new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      watch.unobserve(e.target);
      setTimeout(() => show(e.target), 250);   // ScrollTrigger normally gets there first; this only catches stragglers
    }), { root: scroller === window ? null : scroller, threshold: 0.05 });
    els.forEach(el => watch.observe(el));
  }
  if ('ResizeObserver' in window && !sizes) {
    sizes = new ResizeObserver(() => { clearTimeout(remeasure); remeasure = setTimeout(() => L.ST.refresh(), 150); });
    sizes.observe(host.firstElementChild || host);   // the whole page, not just the part that was added
  }
}

/* ── content further down fades up in staggered batches ────────────── */
const REVEAL_SCENE = '.grid-tiles > *, .block, .home-block, .ticker, .order-row, .adm-card, .adm-row, .faq details, .set-row';

function reveal(root) {
  const L = lib();
  const below = innerHeight * 0.96;
  const els = [...root.querySelectorAll(REVEAL_SCENE)].filter(el => !el.dataset.rv && !el.closest('.intro') && el.getBoundingClientRect().top > below);
  if (!els.length) return;
  els.forEach(el => { el.dataset.rv = '1'; el.classList.add('reveal'); });
  scenes.push(...L.ST.batch(els, {
    start: 'top 94%', once: true, interval: 0.08, batchMax: 8,
    onEnter: batch => L.gsap.to(batch, {
      opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, overwrite: true,
      onComplete: () => batch.forEach(el => { el.classList.replace('reveal', 'revealed'); L.gsap.set(el, { clearProps: 'opacity,transform' }); })
    })
  }));
  guard(root, els);
}

/* ── depth while scrolling (scrubbed to the scroll position) ───────── */
function depth(root) {
  const L = lib();
  const scrub = (target, vars, trigger = target) => {
    if (!target) return;
    const tw = L.gsap.to(target, { ...vars, ease: 'none', scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: 0.6 } });
    scenes.push(tw.scrollTrigger, tw);
  };
  scrub(root.querySelector('#hero'), { scale: 0.94, opacity: 0.55, y: 40, transformOrigin: '50% 0%' });
  scrub(root.querySelector('.cat-covers'), { y: -60, opacity: 0.35 }, root.querySelector('.cat-hero'));
  const art = root.querySelector('.pdp > .media');
  if (art && innerWidth > 900) scrub(art, { y: 70 }, root.querySelector('.pdp'));
}

/** Set up the scroll scenes for the page that was just drawn. */
export function scrollScenes(root) {
  killScenes();
  const L = lib();
  if (!L || calm()) return false;
  build();
  syncScroll();
  reveal(root);
  depth(root);
  L.ST.refresh();
  return true;
}
