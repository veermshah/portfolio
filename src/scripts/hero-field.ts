// Dots that form the name in the home hero. The background dot grid gathers into the name, and
// dots scatter away from a pointer or finger and spring back. The real <h1> stays in the DOM
// (visually hidden while the dots show) for screen readers and search engines.
// Skipped with reduced motion or when canvas is unavailable; the
// plain h1 shows then. The loop pauses off screen, in a hidden tab and once every dot is still.

const MAX_DOTS = 3200;
const GRID = 26; // spacing of the starting grid, matches the old dot field
const STEP_MS = 1000 / 60;
const DAMP = 0.86;
const TAU = Math.PI * 2;

export function initHeroField() {
  const hero = document.querySelector<HTMLElement>('.hero');
  const canvas = hero?.querySelector<HTMLCanvasElement>('.hero-field');
  const title = hero?.querySelector<HTMLElement>('h1');
  const slot = hero?.querySelector<HTMLElement>('.name-slot');
  if (!hero || !canvas || !title || !slot) return;
  const giveUp = () => hero.classList.remove('dot-pending');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return giveUp();
  const ctx = canvas.getContext('2d');
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx || !probe) return giveUp();

  let w = 0;
  let h = 0;
  let n = 0;
  let radius = 1;
  let step = 3;
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let vx = new Float32Array(0);
  let vy = new Float32Array(0);
  let tx = new Float32Array(0);
  let ty = new Float32Array(0);
  let k = new Float32Array(0);
  let accent = new Uint8Array(0);
  // White dots read on the dark photo scrim in both themes. The site is black and white only.
  const ink = '#fff';
  const hot = '#fff';
  let pointer = { x: 0, y: 0, active: false };
  let pushRadius = 120;
  let visible = true;
  let running = false;
  let frame = 0;
  let last = 0;
  let lag = 0;
  let introAt = 0;
  let alive = true;

  const colors = () => {};

  // Lay the name out like the h1 (same font, size, spacing and wrapping), draw it on an offscreen
  // canvas and pick dot targets from its filled pixels.
  function sample() {
    const p = probe!;
    const cs = getComputedStyle(slot!);
    const size = parseFloat(cs.fontSize);
    const lineHeight = parseFloat(cs.lineHeight) || size * 0.9;
    const spacing = parseFloat(cs.letterSpacing) || 0;
    const width = slot!.clientWidth;
    if (!size || !width) return false;
    const font = (sz: number) => `${cs.fontWeight} ${sz}px ${cs.fontFamily}`;
    // Canvas letterSpacing is missing in older Safari; fall back to placing characters one by one.
    const spaced = typeof (p as { letterSpacing?: unknown }).letterSpacing === 'string';
    let gap = spacing;
    const measure = (t: string) => (spaced ? p.measureText(t).width : [...t].reduce((sum, ch) => sum + p.measureText(ch).width + gap, 0));
    const fill = (t: string, y: number) => {
      if (spaced) return p.fillText(t, 0, y);
      let x = 0;
      for (const ch of t) {
        p.fillText(ch, x, y);
        x += p.measureText(ch).width + gap;
      }
    };

    p.font = font(size);
    if (spaced) p.letterSpacing = `${spacing}px`;
    const words = `${(title!.textContent ?? '').trim()}.`.split(/\s+/);
    const lines: string[] = [];
    for (const word of words) {
      const joined = lines.length ? `${lines[lines.length - 1]} ${word}` : word;
      if (lines.length && measure(joined) <= width) lines[lines.length - 1] = joined;
      else lines.push(word);
    }
    // Scale down only if a single word is still too wide (very narrow screens).
    const scale = Math.min(1, width / Math.max(...lines.map(measure)));
    const lh = lineHeight * scale;
    const height = Math.ceil(lines.length * lh);
    slot!.style.height = `${height}px`;

    const S = size * scale < 90 ? 2 : 1; // sample small text at 2x so thin strokes still get dots
    p.canvas.width = Math.ceil(width * S);
    p.canvas.height = Math.ceil(height * S);
    p.font = font(size * scale * S);
    gap = spacing * scale * S;
    if (spaced) p.letterSpacing = `${gap}px`;
    p.textBaseline = 'alphabetic';
    const m = p.measureText('Veer Shah.');
    const ascent = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent;
    const descent = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent;
    // CSS centres the font's ascent + descent inside each line box.
    const baseline = (i: number) => (i * lh + (lh - (ascent + descent) / S) / 2) * S + ascent;
    // Draw everything blue, then everything but the final period red on top: blue pixels left over
    // belong to the period, which takes the accent colour like the h1's.
    p.fillStyle = '#00f';
    lines.forEach((l, i) => fill(l, baseline(i)));
    p.fillStyle = '#f00';
    lines.forEach((l, i) => fill(i === lines.length - 1 ? l.replace(/\.$/, '') : l, baseline(i)));
    const { data, width: pw, height: ph } = p.getImageData(0, 0, p.canvas.width, p.canvas.height);

    let filled = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 127) filled++;
    if (!filled) return false;
    step = Math.max(2.2, (size * scale) / 45, Math.sqrt(filled / (S * S) / (MAX_DOTS * 0.866))); // hex rows are 0.866 steps apart
    radius = Math.max(0.9, step * 0.38);

    const cRect = canvas!.getBoundingClientRect();
    const sRect = slot!.getBoundingClientRect();
    const ox = sRect.left - cRect.left;
    const oy = sRect.top - cRect.top;
    const targets: number[] = [];
    const marks: number[] = [];
    // Hex grid: offset every other row by half a step.
    for (let row = 0, y = step / 2; y < height; row++, y += step * 0.866) {
      const sy = Math.floor(y * S);
      if (sy >= ph) break;
      for (let x = row % 2 ? step : step / 2; x < width; x += step) {
        const sx = Math.floor(x * S);
        if (sx >= pw) break;
        const at = (sy * pw + sx) * 4;
        if (data[at + 3] < 128) continue;
        targets.push(ox + x, oy + y);
        marks.push(data[at + 2] > data[at] ? 1 : 0);
      }
    }
    if (!marks.length) return false;
    adopt(targets, marks);
    pushRadius = Math.min(170, Math.max(80, size * scale * 0.95));
    return true;
  }

  // Swap in new targets. Existing dots keep their place and fly to their new spots; the first time,
  // dots start on the old background grid so the field visibly gathers into the name.
  function adopt(targets: number[], marks: number[]) {
    const count = marks.length;
    const old = { px, py, vx, vy, n };
    px = new Float32Array(count);
    py = new Float32Array(count);
    vx = new Float32Array(count);
    vy = new Float32Array(count);
    tx = new Float32Array(count);
    ty = new Float32Array(count);
    k = new Float32Array(count);
    accent = Uint8Array.from(marks);
    const cols = Math.max(1, Math.floor(w / GRID));
    const rows = Math.max(1, Math.floor(h / GRID));
    const cells = cols * rows;
    for (let i = 0; i < count; i++) {
      tx[i] = targets[i * 2];
      ty[i] = targets[i * 2 + 1];
      k[i] = 0.035 + Math.random() * 0.03;
      if (i < old.n) {
        px[i] = old.px[i];
        py[i] = old.py[i];
        vx[i] = old.vx[i];
        vy[i] = old.vy[i];
      } else {
        const cell = count <= cells ? Math.floor((i * cells) / count) : i % cells;
        px[i] = (cell % cols) * GRID + GRID / 2 + (Math.random() - 0.5) * 3;
        py[i] = Math.floor(cell / cols) * GRID + GRID / 2 + (Math.random() - 0.5) * 3;
      }
    }
    n = count;
  }

  // One fixed 60 Hz physics step: spring to target, push away from the pointer, damp.
  // Returns the largest remaining movement so the loop knows when to rest.
  function physics() {
    const R = pushRadius;
    const R2 = R * R;
    const on = pointer.active;
    const qx = pointer.x;
    const qy = pointer.y;
    let motion = 0;
    for (let i = 0; i < n; i++) {
      let x = px[i];
      let y = py[i];
      let ux = vx[i] + (tx[i] - x) * k[i];
      let uy = vy[i] + (ty[i] - y) * k[i];
      if (on) {
        const dx = x - qx;
        const dy = y - qy;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / R) ** 2 * 4;
          ux += (dx / d) * f;
          uy += (dy / d) * f;
        }
      }
      ux *= DAMP;
      uy *= DAMP;
      x += ux;
      y += uy;
      px[i] = x;
      py[i] = y;
      vx[i] = ux;
      vy[i] = uy;
      const moved = Math.abs(ux) + Math.abs(uy) + Math.abs(tx[i] - x) + Math.abs(ty[i] - y);
      if (moved > motion) motion = moved;
    }
    return motion;
  }

  function draw(now: number) {
    ctx!.clearRect(0, 0, w, h);
    const intro = introAt ? Math.min(1, (now - introAt) / 1400) : 0;
    const far = step * 1.2;
    // Two batched paths per frame: plain dots, then accent dots (the period, and dots pushed out of place).
    for (const pass of [0, 1]) {
      ctx!.beginPath();
      for (let i = 0; i < n; i++) {
        const out = intro === 1 && Math.abs(px[i] - tx[i]) + Math.abs(py[i] - ty[i]) > far;
        if ((accent[i] === 1 || out ? 1 : 0) !== pass) continue;
        ctx!.moveTo(px[i] + radius, py[i]);
        ctx!.arc(px[i], py[i], radius, 0, TAU);
      }
      ctx!.globalAlpha = 0.3 + 0.7 * intro;
      ctx!.fillStyle = pass ? hot : ink;
      ctx!.fill();
    }
    ctx!.globalAlpha = 1;
  }

  const loop = (now: number) => {
    lag = Math.min(lag + now - last, STEP_MS * 4);
    last = now;
    let motion = Infinity;
    while (lag >= STEP_MS) {
      motion = physics();
      lag -= STEP_MS;
    }
    draw(now);
    // Rest once the dots stop moving: snap home if nothing pushes them, else hold until the next move.
    if (motion < 0.06 && now - introAt > 1400) {
      if (!pointer.active) {
        px.set(tx);
        py.set(ty);
        vx.fill(0);
        vy.fill(0);
        draw(now);
      }
      running = false;
      frame = 0;
      return;
    }
    frame = running ? requestAnimationFrame(loop) : 0;
  };
  const start = () => {
    if (!alive || running || !visible || document.hidden || !n) return;
    if (!introAt) introAt = performance.now();
    running = true;
    last = performance.now();
    lag = 0;
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Show the dot name in place of the h1. The slot takes the h1's height first so nothing shifts.
  function mount() {
    slot!.style.height = `${title!.offsetHeight}px`;
    slot!.hidden = false;
    title!.classList.add('visually-hidden');
    hero!.classList.add('has-dot-name');
    hero!.classList.remove('dot-pending');
  }
  function unmount() {
    alive = false;
    stop();
    slot!.hidden = true;
    title!.classList.remove('visually-hidden');
    hero!.classList.remove('has-dot-name', 'dot-pending');
    ctx!.clearRect(0, 0, w, h);
  }

  const relayout = () => {
    if (!alive) return;
    resize();
    if (!sample()) return unmount();
    draw(performance.now());
    start();
  };

  const track = (x: number, y: number) => {
    if (!alive) return;
    const rect = canvas.getBoundingClientRect();
    pointer = { x: x - rect.left, y: y - rect.top, active: true };
    start();
  };
  const release = () => {
    pointer.active = false;
    start();
  };

  (async () => {
    try {
      const style = getComputedStyle(slot);
      await document.fonts.load(`${style.fontWeight} 1em ${style.fontFamily}`, 'Veer Shah.');
      await document.fonts.ready;
    } catch {}
    if (reduce.matches) return giveUp();
    try {
      mount();
      colors();
      resize();
      if (!sample()) return unmount();
    } catch {
      return unmount();
    }
    draw(performance.now());
    start();

    hero.addEventListener('pointermove', (e) => track(e.clientX, e.clientY), { passive: true });
    hero.addEventListener('pointerdown', (e) => track(e.clientX, e.clientY), { passive: true });
    hero.addEventListener('pointerleave', release, { passive: true });
    hero.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && release(), { passive: true });
    // Touch events keep firing while the page scrolls, after pointer events are cancelled.
    hero.addEventListener('touchmove', (e) => e.touches[0] && track(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    hero.addEventListener('touchend', release, { passive: true });
    hero.addEventListener('touchcancel', release, { passive: true });

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    reduce.addEventListener('change', () => reduce.matches && unmount());
    new MutationObserver(() => {
      colors();
      if (!running) draw(performance.now());
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    let pending = 0;
    let size = `${hero.clientWidth}x${hero.clientHeight}`;
    new ResizeObserver(() => {
      const next = `${hero.clientWidth}x${hero.clientHeight}`;
      if (next === size) return;
      size = next;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(relayout);
    }).observe(hero);
  })();
}
