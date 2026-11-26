/* TechGarage demo — create an account.
   One glass card, one question at a time: pick Google, email or phone, then
   fill in your details (name, address, postal code, city, governorate,
   country). The details land in the profile, so checkout fills them in.

   Demo note: there is no server. Google sign-in and the SMS code are
   simulated, and passwords are only checked, never saved (guard.js drops
   them anyway). A real store would create the account on its backend. */

import { t, langInfo } from './i18n.js?v=20261129d';
import { $, $$, esc, ICON, state, saveProfile, calm, signIn, savedAccountName, toast, go } from './core.js?v=20261129d';
import { splitWords, motionOn } from './motion.js?v=20261129d';
import { glassSelects, closeGlassSelect } from './glass-select.js?v=20261129d';

const ARROW = '<svg class="dir" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const BACK = '<svg class="dir" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
const WA = '<svg class="su-wa-ico" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/><path fill="#fff" d="M8.6 7.2c.2-.5.5-.5.7-.5h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.4 0 .6.6 1 1.5 1.9 2.6 2.5.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.4.1.6-.2 1.4-.8 1.8-.6.4-1.4.6-2.4.3-2.5-.8-4.6-2.7-5.6-5.1-.4-1-.4-2.1.3-3.5z"/></svg>';
const SMS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>';
const GOOGLE = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

/* Tunisia's 24 governorates, Latin and Arabic names. */
const GOVERNORATES = [
  ['Ariana', 'أريانة'], ['Béja', 'باجة'], ['Ben Arous', 'بن عروس'], ['Bizerte', 'بنزرت'], ['Gabès', 'قابس'],
  ['Gafsa', 'قفصة'], ['Jendouba', 'جندوبة'], ['Kairouan', 'القيروان'], ['Kasserine', 'القصرين'], ['Kébili', 'قبلي'],
  ['Le Kef', 'الكاف'], ['Mahdia', 'المهدية'], ['La Manouba', 'منوبة'], ['Médenine', 'مدنين'], ['Monastir', 'المنستير'],
  ['Nabeul', 'نابل'], ['Sfax', 'صفاقس'], ['Sidi Bouzid', 'سيدي بوزيد'], ['Siliana', 'سليانة'], ['Sousse', 'سوسة'],
  ['Tataouine', 'تطاوين'], ['Tozeur', 'توزر'], ['Tunis', 'تونس'], ['Zaghouan', 'زغوان']
];
/* Tunisia first, then neighbours and the countries Tunisians shop from most. Names come from the browser in the page's language. */
const COUNTRIES = ['TN', 'DZ', 'LY', 'MA', 'EG', 'FR', 'BE', 'DE', 'IT', 'ES', 'CH', 'GB', 'CA', 'US', 'SA', 'AE', 'QA', 'TR'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = s => (s || '').replace(/\D/g, '');
const pwOk = s => s.length >= 8 && /[a-z]/i.test(s) && /\d/.test(s);

/* Where the shopper is. Kept outside the page so a language change (which
   redraws the page) doesn't lose their place. The password lives only here,
   in memory, until the account is made — it is never written anywhere. */
const draft = { step: 'method', via: '', email: '', phone: '', code: '', channel: 'whatsapp', sent: '', details: {} };
let secret = '';
const resetDraft = () => { Object.assign(draft, { step: 'method', via: '', email: '', phone: '', code: '', channel: 'whatsapp', sent: '', details: {} }); secret = ''; hideBanner(); };

const FLOWS = { email: ['email', 'password', 'confirm'], phone: ['phone', 'code'], google: [] };
const flow = () => ['method', ...(FLOWS[draft.via] || []), 'details'];

/* ── pieces ─────────────────────────────────────────────────────────── */
const head = (title, sub) => `
  <h1 class="su-title" data-su-title>${esc(title)}</h1>
  ${sub ? `<p class="su-sub su-in">${sub}</p>` : ''}`;

const backBtn = () => `<button type="button" class="su-back su-in" data-back>${BACK}<span>${esc(t('su.back'))}</span></button>`;

/** The glass pill: icon, input and a round "go" button that lights up when the answer looks right. */
const signPill = ({ id, icon, type = 'text', value = '', ph = '', label, extra = '', toggle = false, go = true }) => `
  <div class="su-pill su-in" data-pill>
    <span class="su-pill-ico">${icon}</span>
    <label class="sr" for="${id}">${esc(label)}</label>
    <input id="${id}" name="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(ph)}" ${extra}>
    ${toggle ? `<button type="button" class="su-eye" data-eye="${id}" aria-pressed="false" aria-label="${esc(t('acc.show'))}">${ICON.eye}</button>` : ''}
    ${go ? `<button type="submit" class="su-go" aria-label="${esc(t('su.continue'))}">${ARROW}</button>` : ''}
  </div>
  <p class="su-msg" role="alert"></p>`;

function steps() {
  const list = flow(), at = list.indexOf(draft.step);
  if (draft.step === 'done' || draft.step === 'method' || at < 0) return '';
  return `<div class="su-dots su-in" role="img" aria-label="${esc(t('su.stepOf', { n: at + 1, total: list.length }))}">
    ${list.map((_, i) => `<i class="${i < at ? 'past' : i === at ? 'now' : ''}"></i>`).join('')}</div>`;
}

/* ── each step ─────────────────────────────────────────────────────── */
const STEPS = {
  method: () => `
    ${head(t('su.title'), esc(t('su.sub')))}
    <div class="su-methods">
      <button type="button" class="su-method su-in" data-via="google">${GOOGLE}<span>${esc(t('su.google'))}</span></button>
      <div class="su-or su-in" aria-hidden="true"><span>${esc(t('su.or'))}</span></div>
      <button type="button" class="su-method su-in" data-via="email">${ICON.mail}<span>${esc(t('su.email'))}</span></button>
      <button type="button" class="su-method su-in" data-via="phone">${ICON.phone}<span>${esc(t('su.phone'))}</span></button>
    </div>
    ${!state.signedIn && savedAccountName() ? `<button type="button" class="su-switch su-in" data-backin>${ICON.user}<span>${esc(t('su.backIn', { name: savedAccountName() }))}</span></button>` : ''}
    <p class="su-fine su-in">${ICON.shield}<span>${esc(t('su.demo'))}</span></p>`,

  email: () => `
    ${head(t('su.emailT'), esc(t('su.emailD')))}
    <form class="su-form" data-step="email" novalidate>
      ${signPill({ id: 'suEmail', icon: ICON.mail, type: 'email', value: draft.email, ph: t('su.emailPh'), label: t('co.email'), extra: 'autocomplete="email" dir="ltr" inputmode="email" required' })}
    </form>
    ${backBtn()}`,

  password: () => `
    ${head(t('su.pwT'), esc(t('set.pwHint')))}
    <form class="su-form" data-step="password" novalidate>
      <input type="email" name="username" value="${esc(draft.email)}" autocomplete="username" hidden>
      ${signPill({ id: 'suPw', icon: ICON.lock, type: 'password', value: secret, ph: t('su.pwPh'), label: t('su.pwPh'), extra: 'autocomplete="new-password" dir="ltr" maxlength="64" required', toggle: true })}
      <div class="su-meter su-in" aria-hidden="true"><i id="suMeter"></i></div>
    </form>
    ${backBtn()}`,

  confirm: () => `
    ${head(t('su.confirmT'), esc(t('su.confirmD')))}
    <form class="su-form" data-step="confirm" novalidate>
      <input type="email" name="username" value="${esc(draft.email)}" autocomplete="username" hidden>
      ${signPill({ id: 'suPw2', icon: ICON.lock, type: 'password', ph: t('su.confirmPh'), label: t('su.confirmPh'), extra: 'autocomplete="new-password" dir="ltr" maxlength="64" required', toggle: true })}
    </form>
    ${backBtn()}`,

  phone: () => `
    ${head(t('su.phoneT'), esc(t('su.phoneD')))}
    <form class="su-form" data-step="phone" novalidate>
      ${signPill({ id: 'suPhone', icon: `<span class="su-cc" dir="ltr">+216</span>`, type: 'tel', value: draft.phone, ph: '20 123 456', label: t('co.phone'), extra: 'autocomplete="tel-national" dir="ltr" inputmode="tel" maxlength="20" required', go: false })}
      <div class="su-send">
        <button type="submit" class="su-method su-wa su-in" value="whatsapp">${WA}<span>${esc(t('su.sendWa'))}</span></button>
        <button type="submit" class="su-method su-in" value="sms">${SMS}<span>${esc(t('su.sendSms'))}</span></button>
      </div>
    </form>
    ${backBtn()}`,

  /* "Let's verify your number": rounded glass boxes, the one you're on
     glows, each digit pops in; right code turns them green in a wave,
     a wrong one shakes them. */
  code: () => {
    const wa = draft.channel === 'whatsapp', phone = '+216 ' + draft.phone;
    return `
    <div class="su-verify${wa ? ' wa' : ''}">
      <span class="su-grab" aria-hidden="true"></span>
      <span class="su-channel su-in">${wa ? WA : SMS}<b>${esc(t(wa ? 'su.waName' : 'su.smsName'))}</b></span>
      ${head(t('su.verifyT'), `${esc(t(wa ? 'su.codeWa' : 'su.codeSms', { phone }))}<br><span class="su-auto">${esc(t('su.auto'))}</span>`)}
      <form class="su-form" data-step="code" novalidate>
        <div class="su-otp su-in" role="group" aria-label="${esc(t('su.codeT'))}" dir="ltr">
          <span class="su-otp-done" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></span>
          ${Array.from({ length: 6 }, (_, i) => `<input name="d${i}" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="${i ? 'off' : 'one-time-code'}" aria-label="${esc(t('su.digit', { n: i + 1 }))}" value="${esc(draft.code[i] || '')}"${draft.code[i] ? ' class="filled"' : ''}>`).join('')}
        </div>
        <p class="su-msg" role="alert"></p>
        <div class="su-row su-in">
          <button type="button" class="su-link" id="suResend" disabled></button>
          <button type="submit" class="btn btn-solid">${esc(t('su.verify'))}</button>
        </div>
        <button type="button" class="su-switch su-in" data-switch>${wa ? SMS : WA}<span>${esc(t(wa ? 'su.switchSms' : 'su.switchWa'))}</span></button>
        <p class="su-fine su-in">${ICON.shield}<span>${esc(t('su.codeDemo'))}</span></p>
      </form>
      ${backBtn()}
    </div>`;
  },

  details: () => {
    const d = draft.details, cc = d.country || 'TN';
    const names = new Intl.DisplayNames([langInfo().locale], { type: 'region' });
    const ar = langInfo().id === 'ar';
    const fld = (id, label, value, type = 'text', extra = '') => `
      <div class="field"><label for="${id}">${esc(label)}</label>
        <input id="${id}" name="${id}" type="${type}" value="${esc(value || '')}" ${extra}><span class="msg" aria-live="polite"></span></div>`;
    return `
      ${head(t('su.detailsT'), esc(t('su.detailsD')))}
      ${draft.via === 'google' ? `<p class="su-fine su-in">${ICON.shield}<span>${esc(t('su.googleNote'))}</span></p>` : ''}
      <form class="form su-details" data-step="details" novalidate>
        <div class="field-row su-in">
          ${fld('first', t('su.first'), d.first, 'text', 'autocomplete="given-name" maxlength="40" required')}
          ${fld('last', t('su.last'), d.last, 'text', 'autocomplete="family-name" maxlength="40" required')}
        </div>
        <div class="field-row su-in">
          ${fld('email', t('co.email'), d.email ?? draft.email, 'email', 'autocomplete="email" dir="ltr" required')}
          ${fld('phone', t('co.phone'), d.phone ?? (draft.phone ? '+216 ' + draft.phone : ''), 'tel', 'autocomplete="tel" dir="ltr" required')}
        </div>
        <div class="su-in">${fld('address', t('su.address'), d.address, 'text', 'autocomplete="street-address" maxlength="120" required')}</div>
        <div class="field-row su-in">
          ${fld('city', t('su.city'), d.city, 'text', 'autocomplete="address-level2" maxlength="60" required')}
          ${fld('zip', t('su.zip'), d.zip, 'text', `autocomplete="postal-code" dir="ltr" maxlength="10" ${cc === 'TN' ? 'inputmode="numeric"' : ''} required`)}
        </div>
        <div class="field-row su-in">
          <div class="field"><label for="country">${esc(t('su.country'))}</label>
            <select id="country" name="country" class="select" autocomplete="country">
              ${COUNTRIES.map(c => `<option value="${c}" ${c === cc ? 'selected' : ''}>${esc(names.of(c) || c)}</option>`).join('')}
            </select><span class="msg" aria-live="polite"></span></div>
          ${cc === 'TN' ? `<div class="field"><label for="state">${esc(t('su.state'))}</label>
              <select id="state" name="state" class="select" autocomplete="address-level1">
                <option value="">${esc(t('su.statePick'))}</option>
                ${GOVERNORATES.map(([la, a]) => `<option value="${esc(la)}" ${d.state === la ? 'selected' : ''}>${esc(ar ? a : la)}</option>`).join('')}
              </select><span class="msg" aria-live="polite"></span></div>`
            : fld('state', t('su.stateOther'), d.state, 'text', 'autocomplete="address-level1" maxlength="60"')}
        </div>
        <button class="btn btn-solid btn-wide su-in" type="submit">${esc(t('su.create'))}</button>
      </form>
      ${backBtn()}`;
  },

  done: () => `
    <div class="su-done">
      <svg class="su-tick" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29"/><path d="M19 33l9 9 17-19"/></svg>
      <h1 class="su-title" data-su-title>${esc(t('su.doneT', { name: state.profile.firstName || state.profile.name.split(' ')[0] }))}</h1>
      <p class="su-sub su-in">${esc(t('su.doneD'))}</p>
      <div class="su-row center su-in">
        <a class="btn btn-solid" href="#/">${esc(t('su.shop'))}</a>
        <a class="btn btn-ghost" href="#/profile">${esc(t('su.profile'))}</a>
      </div>
    </div>`
};

/* ── the message with the code ─────────────────────────────────────
   No message is really sent in this demo, so the code arrives the way a
   phone shows it: a glass banner sliding in at the top, with "Fill in". */
let banner = null, bannerTimer = 0, bannerIn = 0;
function hideBanner() {
  clearTimeout(bannerTimer); clearTimeout(bannerIn);
  const b = banner; banner = null;
  if (!b) return;
  b.classList.add('out');
  setTimeout(() => b.remove(), calm() ? 0 : 400);
}
function sendCode(onFill) {
  hideBanner();
  draft.sent = String(Math.floor(100000 + Math.random() * 900000));
  const wa = draft.channel === 'whatsapp', code = draft.sent;
  bannerIn = setTimeout(() => {
    const b = document.createElement('div');
    b.className = 'su-banner' + (wa ? ' wa' : '');
    b.setAttribute('role', 'status');
    b.innerHTML = `
      <span class="su-banner-ico">${wa ? WA : SMS}</span>
      <div class="su-banner-txt">
        <p class="su-banner-top"><b>${esc(t(wa ? 'su.waName' : 'su.smsName'))}</b><time>${esc(t('su.now'))}</time></p>
        <p>${esc(t('su.message', { code: code.slice(0, 3) + ' ' + code.slice(3) }))}</p>
      </div>
      <button type="button" class="su-banner-use">${esc(t('su.useCode'))}</button>`;
    b.querySelector('button').addEventListener('click', () => { hideBanner(); onFill(code); });
    document.body.append(b);
    banner = b;
    bannerTimer = setTimeout(hideBanner, 25000);
  }, calm() ? 0 : 1100);
}

/* ── confetti: a short, quiet burst from both lower corners ─────────── */
function confetti() {
  if (calm()) return;
  const c = document.createElement('canvas');
  c.className = 'su-confetti';
  c.setAttribute('aria-hidden', 'true');
  document.body.append(c);
  const ctx = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  const W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--teal').trim() || '#38a699';
  const colours = [accent, '#ffffff', '#d9dce3', '#9fe7dc'];
  const bits = Array.from({ length: 140 }, (_, i) => {
    const left = i % 2 === 0, a = (left ? -60 : -120) * Math.PI / 180 + (Math.random() - 0.5) * 0.9, v = (14 + Math.random() * 12) * dpr;
    return { x: left ? 0 : W, y: H, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: (5 + Math.random() * 5) * dpr, h: (8 + Math.random() * 6) * dpr,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, c: colours[i % colours.length] };
  });
  const start = performance.now();
  const tick = now => {
    const life = (now - start) / 2600;
    ctx.clearRect(0, 0, W, H);
    for (const b of bits) {
      b.vy += 0.42 * dpr; b.vx *= 0.985; b.vy *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - life); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2))); ctx.restore();
    }
    if (life < 1) requestAnimationFrame(tick); else c.remove();
  };
  requestAnimationFrame(tick);
}

/* ── the page ──────────────────────────────────────────────────────── */
export const signup = {
  title: () => t('su.title'),
  render() {
    if (draft.step === 'confirm' && !secret) draft.step = 'password';   // a redraw lost nothing but the page; the password is still in memory or must be retyped
    if (draft.step === 'done' && !state.profile.firstName) resetDraft();
    return `
      <div class="page su-page">
        <div class="su-wrap${draft.step === 'details' ? ' wide' : ''}">
          <a class="su-brand" href="#/"><span class="su-logo" aria-hidden="true">TG</span><b>${esc(t('brand'))}</b></a>
          <section class="su-card" aria-labelledby="suTitle">
            ${steps()}
            <div class="su-stage">${STEPS[draft.step]()}</div>
          </section>
        </div>
      </div>`;
  },

  mount(el) {
    const card = $('.su-card', el), wrap = $('.su-wrap', el);
    let resendTimer = 0, leaving = 0;

    /* swap the card's content: the old step fades, the new one builds up */
    const show = (step, focus = true) => {
      draft.step = step;
      const draw = () => {
        closeGlassSelect();
        wrap.classList.toggle('wide', step === 'details');
        card.innerHTML = `${steps()}<div class="su-stage">${STEPS[step]()}</div>`;
        enter(focus);
      };
      if (!motionOn()) return draw();
      card.classList.add('su-leave');
      clearTimeout(leaving);
      leaving = setTimeout(() => { card.classList.remove('su-leave'); draw(); }, 170);
    };

    /* the new step builds itself up, then the right field gets the cursor */
    const enter = (focus = true) => {
      const title = $('[data-su-title]', card);
      title.id = 'suTitle';
      splitWords(title);
      $$('.su-in', card).forEach((n, i) => n.style.setProperty('--i', i));
      card.classList.remove('su-play'); void card.offsetWidth; card.classList.add('su-play');
      glassSelects(card);
      if (draft.step === 'code') { startResend(); if (!draft.sent) sendCode(fillCode); markActive(); }
      if (draft.step === 'done') confetti();
      if (focus) setTimeout(() => (card.querySelector('input:not([hidden]), .su-method, .btn') || title).focus({ preventScroll: true }), motionOn() ? 380 : 0);
    };

    const say = (form, msg) => {
      const m = $('.su-msg', form) || $('.su-msg', card);
      if (m) m.textContent = msg || '';
      $('[data-pill]', form)?.classList.toggle('err', !!msg);
      return !msg;
    };

    /* the go-button lights up once the answer looks right */
    const VALID = {
      suEmail: v => EMAIL.test(v.trim()),
      suPw: v => pwOk(v),
      suPw2: v => v.length > 0,
      suPhone: v => digits(v).length >= 8
    };
    card.addEventListener('input', e => {
      const inp = e.target;
      const pillEl = inp.closest('[data-pill]');
      if (pillEl && VALID[inp.id]) { pillEl.classList.toggle('ok', VALID[inp.id](inp.value)); pillEl.classList.remove('err'); }
      if (inp.id === 'suPw') {
        const s = inp.value, n = [s.length >= 8, /[a-z]/i.test(s), /\d/.test(s), /[^a-z0-9]/i.test(s), s.length >= 12].filter(Boolean).length;
        const m = $('#suMeter', card);
        m.style.width = s ? (n / 5 * 100) + '%' : '0';
        m.dataset.level = n <= 2 ? 'weak' : n <= 3 ? 'ok' : 'strong';
      }
      if (inp.closest('.su-otp')) otpInput(inp);
      if (inp.closest('.su-details')) inp.closest('.field')?.classList.remove('err');
    });

    /* one-time code: one digit per box, moves along, takes a pasted code.
       The box you're on glows; a digit pops in as it lands. */
    const boxes = () => $$('.su-otp input', card);
    const markActive = () => {
      const all = boxes(), on = all.indexOf(document.activeElement);
      all.forEach((b, i) => b.classList.toggle('on', i === on || (on < 0 && i === Math.min(draft.code.length, 5))));
    };
    const pop = b => { b.classList.toggle('filled', !!b.value); if (b.value && motionOn()) { b.classList.remove('su-bump'); void b.offsetWidth; b.classList.add('su-bump'); } };
    const otpInput = inp => {
      const all = boxes(), i = all.indexOf(inp), d = digits(inp.value);
      const otp = $('.su-otp', card);
      otp.classList.remove('bad');
      if (d.length > 1) { d.slice(0, 6 - i).split('').forEach((ch, k) => { all[i + k].value = ch; pop(all[i + k]); }); all[Math.min(i + d.length, 5)].focus(); }
      else { inp.value = d; pop(inp); if (d && i < 5) all[i + 1].focus(); }
      draft.code = all.map(b => b.value).join('');
      say($('form', card), '');
      if (draft.code.length === 6) $('form', card).requestSubmit();
    };
    /* "Fill in" on the banner: the digits drop in one by one, then it checks */
    const fillCode = code => {
      const all = boxes();
      if (!all.length) return;
      $('.su-otp', card).classList.remove('bad');
      code.split('').forEach((ch, k) => setTimeout(() => {
        if (!all[k].isConnected) return;
        all[k].value = ch; pop(all[k]); all[k].focus();
        if (k === 5) { draft.code = code; $('form', card).requestSubmit(); }
      }, motionOn() ? k * 70 : 0));
    };
    /* Right code — the reel's sequence: borders fade and a light rises over
       each digit, every box charges up with a glow, they slide together
       into one box, the title becomes "Verified successfully" and a check
       draws in. Reduced motion: straight to the check. */
    const celebrate = (otp, next) => {
      const all = boxes(), title = $('[data-su-title]', card), sub = $('.su-sub', card);
      $('.su-verify', card)?.classList.add('su-done-run');   // everything but the boxes steps back
      const swapTitle = () => {
        title.textContent = t('su.verified'); delete title.dataset.split; splitWords(title);
        sub?.classList.add('su-fade');
      };
      if (!motionOn()) { otp.classList.add('merged', 'checked'); swapTitle(); return setTimeout(next, 700); }
      otp.classList.add('charging');                                  // borders out, light bars up
      setTimeout(() => { otp.classList.remove('charging'); otp.classList.add('lit'); }, 380);                // boxes glow back, one by one
      setTimeout(() => {                                              // slide together into one
        const r = otp.getBoundingClientRect(), mid = r.left + r.width / 2;
        all.forEach((b, i) => {
          const br = b.getBoundingClientRect(), dx = mid - (br.left + br.width / 2);
          // slide to the middle; digits fade on the way, only the middle pair is still faintly there on arrival
          b.animate([
            { transform: 'none', color: '#fff', opacity: 1 },
            { offset: .45, color: 'rgba(255,255,255,0)' },
            { transform: `translateX(${dx}px) scale(.94)`, color: 'rgba(255,255,255,0)', opacity: i === 2 || i === 3 ? .9 : 0 }
          ], { duration: 520, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards', delay: Math.abs(i - 2.5) * 24 });
        });
        swapTitle();
      }, 1050);
      setTimeout(() => otp.classList.add('merged'), 1520);           // the single box takes over
      setTimeout(() => otp.classList.add('checked'), 1700);          // check draws in
      setTimeout(next, 2700);
    };
    card.addEventListener('focusin', e => { if (e.target.closest('.su-otp')) markActive(); });
    card.addEventListener('focusout', e => { if (e.target.closest('.su-otp')) setTimeout(markActive, 0); });
    card.addEventListener('keydown', e => {
      const inp = e.target.closest('.su-otp input');
      if (!inp) return;
      const all = boxes(), i = all.indexOf(inp);
      if (e.key === 'Backspace' && !inp.value && i > 0) { all[i - 1].value = ''; pop(all[i - 1]); all[i - 1].focus(); e.preventDefault(); draft.code = all.map(b => b.value).join(''); }
      if (e.key === 'ArrowLeft' && i > 0) all[i - 1].focus();
      if (e.key === 'ArrowRight' && i < 5) all[i + 1].focus();
    });

    const startResend = () => {
      const b = $('#suResend', card);
      let n = 30;
      clearInterval(resendTimer);
      const paint = () => { b.disabled = n > 0; b.textContent = n > 0 ? t('su.resendIn', { n }) : t('su.resend'); };
      paint();
      resendTimer = setInterval(() => { n--; paint(); if (n <= 0) clearInterval(resendTimer); }, 1000);
    };

    card.addEventListener('click', e => {
      if (e.target.closest('[data-backin]')) {   // no passwords in this demo: the saved account simply signs back in
        signIn(); toast(t('toast.signin', { name: state.profile.firstName || state.profile.name.split(' ')[0] }), true);
        resetDraft(); return go('#/');
      }
      const via = e.target.closest('[data-via]');
      if (via) { draft.via = via.dataset.via; return show(flow()[1]); }
      if (e.target.closest('[data-back]')) {
        const list = flow(), at = list.indexOf(draft.step);
        if (draft.step === 'details') draft.details = readDetails($('form', card));
        if (draft.step === 'code') { draft.sent = ''; draft.code = ''; clearInterval(resendTimer); hideBanner(); }
        if (at <= 1) { draft.via = ''; return show('method'); }
        return show(list[at - 1]);
      }
      const eye = e.target.closest('[data-eye]');
      if (eye) {
        const input = $('#' + eye.dataset.eye, card), on = input.type === 'password';
        input.type = on ? 'text' : 'password';
        eye.innerHTML = on ? ICON.eyeOff : ICON.eye;
        eye.setAttribute('aria-pressed', String(on));
        eye.setAttribute('aria-label', t(on ? 'acc.hide' : 'acc.show'));
        input.focus();
      }
      if (e.target.closest('#suResend')) {
        draft.code = ''; boxes().forEach(b => { b.value = ''; pop(b); }); boxes()[0].focus();
        startResend(); sendCode(fillCode); say($('form', card), ''); toastNote(t('su.resent'));
      }
      if (e.target.closest('[data-switch]')) {   // WhatsApp ↔ SMS: a fresh code on the other channel
        draft.channel = draft.channel === 'whatsapp' ? 'sms' : 'whatsapp';
        draft.sent = ''; draft.code = ''; hideBanner();
        return show('code');
      }
    });
    const toastNote = msg => { const m = $('.su-msg', card); if (m) { m.classList.add('good'); m.textContent = msg; setTimeout(() => m.classList.remove('good'), 2400); } };

    /* country decides whether the region is a governorate menu or free text */
    card.addEventListener('change', e => {
      if (e.target.id === 'country') {
        draft.details = { ...readDetails($('form', card)), country: e.target.value, state: '' };
        card.innerHTML = `${steps()}<div class="su-stage">${STEPS.details()}</div>`;
        glassSelects(card);
        $('#country', card).closest('.field').querySelector('.gsel-btn')?.focus();
      }
      if (e.target.id === 'state') e.target.closest('.field')?.classList.remove('err');
    });

    card.addEventListener('submit', e => {
      e.preventDefault();
      const form = e.target, step = form.dataset.step;
      if (step === 'email') {
        const v = form.elements.suEmail.value.trim();
        if (!say(form, EMAIL.test(v) ? '' : t('err.email'))) return;
        draft.email = v; return show('password');
      }
      if (step === 'password') {
        const v = form.elements.suPw.value;
        if (!say(form, pwOk(v) ? '' : t('set.pwHint'))) return;
        secret = v; return show('confirm');
      }
      if (step === 'confirm') {
        if (!say(form, form.elements.suPw2.value === secret ? '' : t('err.match'))) return;
        secret = '';   // checked; not needed any more and never stored
        return show('details');
      }
      if (step === 'phone') {
        const v = form.elements.suPhone.value.trim();
        if (!say(form, digits(v).length >= 8 ? '' : t('err.phone'))) return;
        draft.phone = v; draft.code = ''; draft.sent = '';
        draft.channel = e.submitter?.value === 'sms' ? 'sms' : 'whatsapp';
        return show('code');
      }
      if (step === 'code') {
        draft.code = boxes().map(b => b.value).join('');
        if (!say(form, draft.code.length === 6 ? '' : t('su.errCode'))) return;
        const otp = $('.su-otp', card);
        if (draft.code !== draft.sent) {   // wrong: the boxes shake and empty
          otp.classList.remove('bad'); void otp.offsetWidth; otp.classList.add('bad');
          say(form, t('su.errWrong'));
          setTimeout(() => { boxes().forEach(b => { b.value = ''; pop(b); }); draft.code = ''; boxes()[0]?.focus(); }, motionOn() ? 420 : 0);
          return;
        }
        boxes().forEach(b => { b.readOnly = true; b.blur(); });
        clearInterval(resendTimer); hideBanner();
        draft.sent = ''; draft.code = '';
        return celebrate(otp, () => show('details'));
      }
      if (step === 'details') {
        const d = readDetails(form), cc = d.country;
        const err = (name, msg) => {
          const box = form.elements[name].closest('.field');
          box.classList.toggle('err', !!msg);
          box.querySelector('.msg').textContent = msg || '';
          return !msg;
        };
        const ok = [
          err('first', d.first.length >= 2 ? '' : t('su.errFirst')),
          err('last', d.last.length >= 2 ? '' : t('su.errLast')),
          err('email', EMAIL.test(d.email) ? '' : t('err.email')),
          err('phone', digits(d.phone).length >= 8 ? '' : t('err.phone')),
          err('address', d.address.length >= 5 ? '' : t('su.errAddress')),
          err('city', d.city.length >= 2 ? '' : t('su.errCity')),
          err('zip', (cc === 'TN' ? /^\d{4}$/ : /^[a-z0-9][a-z0-9 -]{1,9}$/i).test(d.zip) ? '' : t('su.errZip')),
          err('state', cc !== 'TN' || d.state ? '' : t('su.errState'))
        ].every(Boolean);
        if (!ok) { form.querySelector('.field.err input, .field.err .gsel-btn')?.focus(); return; }
        if (!state.signedIn) signIn();   // the new account becomes the signed-in one
        const slug = (d.first + d.last).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 20);
        saveProfile({
          name: `${d.first} ${d.last}`, firstName: d.first, lastName: d.last, email: d.email, phone: d.phone,
          address: d.address, city: d.city, zip: d.zip, state: d.state, country: cc,
          handle: '@' + (slug.length >= 3 ? slug : 'player' + Math.floor(1000 + Math.random() * 9000))
        });
        draft.details = {}; draft.code = '';
        return show('done');
      }
    });

    enter(false);
    return () => { clearInterval(resendTimer); clearTimeout(leaving); hideBanner(); if (draft.step === 'code') draft.sent = ''; if (draft.step === 'done') resetDraft(); };
  }
};

function readDetails(form) {
  const v = n => (form.elements[n]?.value || '').trim();
  return { first: v('first'), last: v('last'), email: v('email'), phone: v('phone'), address: v('address'), city: v('city'), zip: v('zip').toUpperCase(), state: v('state'), country: v('country') || 'TN' };
}
