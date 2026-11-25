// Pointer effects for mouse and trackpad users: cards and the portrait tilt toward the pointer with a
// soft highlight, and buttons lean toward it. One shared requestAnimationFrame loop eases every active
// element toward its target and stops once they settle. Touch and reduced motion get none of this;
// their hover and press states are plain CSS.
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

type State = { el: HTMLElement; max: number; magnet: boolean; x: number; y: number; tx: number; ty: number };
const states = new Map<HTMLElement, State>();
const active = new Set<State>();
let frame = 0;

function tick() {
  for (const s of active) {
    s.x += (s.tx - s.x) * 0.16;
    s.y += (s.ty - s.y) * 0.16;
    if (s.magnet) {
      s.el.style.setProperty('--tx', `${(s.x * s.max).toFixed(2)}px`);
      s.el.style.setProperty('--ty', `${(s.y * s.max).toFixed(2)}px`);
    } else {
      s.el.style.setProperty('--ry', `${(s.x * s.max).toFixed(2)}deg`);
      s.el.style.setProperty('--rx', `${(-s.y * s.max).toFixed(2)}deg`);
      s.el.style.setProperty('--mx', `${((s.x + 0.5) * 100).toFixed(1)}%`);
      s.el.style.setProperty('--my', `${((s.y + 0.5) * 100).toFixed(1)}%`);
    }
    if (Math.abs(s.tx - s.x) < 0.001 && Math.abs(s.ty - s.y) < 0.001) active.delete(s);
  }
  frame = active.size ? requestAnimationFrame(tick) : 0;
}

function wake(s: State) {
  active.add(s);
  if (!frame) frame = requestAnimationFrame(tick);
}

function bind(el: HTMLElement, magnet: boolean) {
  const s: State = { el, magnet, max: Number(el.dataset.tilt || el.dataset.magnetic) || (magnet ? 6 : 6), x: 0, y: 0, tx: 0, ty: 0 };
  states.set(el, s);
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !fine.matches || reduce.matches) return;
    const r = el.getBoundingClientRect();
    s.tx = (e.clientX - r.left) / r.width - 0.5;
    s.ty = (e.clientY - r.top) / r.height - 0.5;
    wake(s);
  }, { passive: true });
  el.addEventListener('pointerleave', () => {
    s.tx = 0;
    s.ty = 0;
    wake(s);
  }, { passive: true });
}

document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => bind(el, false));
document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => bind(el, true));
