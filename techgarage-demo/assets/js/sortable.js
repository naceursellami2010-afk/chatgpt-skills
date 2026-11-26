/* TechGarage demo — drag to reorder.
   Pointer events, so it works with a mouse, a trackpad and a finger. Items
   carry [data-sort]; dragging starts on their [data-grip] handle. Neighbours
   slide out of the way (FLIP), and keyboard users get the same result with
   the item's up/down buttons ([data-move="-1|1"]). onChange() runs once the
   order has changed. */

const sortFlip = (items, fn) => {
  const before = new Map(items.map(el => [el, el.getBoundingClientRect()]));
  fn();
  for (const el of items) {
    if (el.classList.contains('dragging')) continue;
    const a = before.get(el), b = el.getBoundingClientRect();
    const dx = a.left - b.left, dy = a.top - b.top;
    if (!dx && !dy) continue;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
};

export function sortable(list, { grid = false, onChange } = {}) {
  let drag = null;
  const items = () => [...list.querySelectorAll(':scope > [data-sort]')];

  const down = e => {
    const grip = e.target.closest('[data-grip]');
    if (!grip || !list.contains(grip) || e.button > 0) return;
    const el = grip.closest('[data-sort]');
    if (!el || el.parentElement !== list) return;
    e.preventDefault();
    try { grip.setPointerCapture(e.pointerId); } catch { /* some pointers can't be captured; dragging still works */ }
    drag = { el, grip, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    el.classList.add('dragging');
    list.classList.add('sorting');
  };
  const move = e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) return up(e);   // the button was let go somewhere we didn't hear about
    const { el } = drag;
    el.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
    const over = items().find(o => {
      if (o === el) return false;
      const r = o.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (!over) return;
    const r = over.getBoundingClientRect();
    const after = grid ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
    if ((after ? over.nextElementSibling : over.previousElementSibling) === el) return;
    const was = el.getBoundingClientRect();
    sortFlip(items(), () => (after ? over.after(el) : over.before(el)));
    const now = el.getBoundingClientRect();
    drag.x += now.left - was.left; drag.y += now.top - was.top;   // the dragged item stays under the pointer
    el.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
    drag.moved = true;
  };
  const up = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { el, moved } = drag;
    drag = null;
    el.classList.remove('dragging');
    list.classList.remove('sorting');
    el.animate([{ transform: el.style.transform || 'none' }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.22,1,.36,1)' });
    el.style.transform = '';
    if (moved) onChange?.();
  };
  /* keyboard and screen readers: the item's own up / down buttons */
  const click = e => {
    const b = e.target.closest('[data-move]');
    if (!b || !list.contains(b)) return;
    const el = b.closest('[data-sort]'), dir = +b.dataset.move;
    const sib = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    if (!sib?.matches('[data-sort]')) return;
    sortFlip(items(), () => (dir < 0 ? sib.before(el) : sib.after(el)));
    b.focus();
    onChange?.();
  };

  list.addEventListener('pointerdown', down);
  list.addEventListener('pointermove', move);
  list.addEventListener('pointerup', up);
  list.addEventListener('pointercancel', up);
  list.addEventListener('click', click);
  return () => {
    list.removeEventListener('pointerdown', down);
    list.removeEventListener('pointermove', move);
    list.removeEventListener('pointerup', up);
    list.removeEventListener('pointercancel', up);
    list.removeEventListener('click', click);
  };
}
