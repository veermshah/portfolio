// Dot field behind the home hero. Dots lean away from and light up near the pointer or finger;
// with no pointer a slow wave drifts across. Static with reduced motion; paused off screen.

export function initHeroField() {
  const canvas = document.querySelector<HTMLCanvasElement>('.hero-field');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const GAP = 26;
  const RADIUS = 150;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let ink = '';
  let accent = '';
  let pointer: { x: number; y: number; t: number } | null = null;
  let running = false;
  let frame = 0;

  const colors = () => {
    const style = getComputedStyle(document.documentElement);
    ink = style.getPropertyValue('--muted').trim() || '#888';
    accent = style.getPropertyValue('--accent').trim() || '#c2410c';
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  };

  function draw(now: number) {
    ctx!.clearRect(0, 0, w, h);
    const t = now / 1000;
    const active = pointer && now - pointer.t < 2500 ? pointer : null;
    const fade = active ? Math.max(0, 1 - (now - active.t) / 2500) : 0;
    for (let gy = GAP / 2; gy < h; gy += GAP) {
      for (let gx = GAP / 2; gx < w; gx += GAP) {
        let x = gx;
        let y = gy;
        let glow = reduce.matches ? 0 : Math.max(0, Math.sin(gx / 140 + gy / 220 - t * 0.9)) ** 6 * 0.5;
        if (active) {
          const dx = gx - active.x;
          const dy = gy - active.y;
          const d = Math.hypot(dx, dy);
          if (d < RADIUS) {
            const f = (1 - d / RADIUS) ** 2 * fade;
            x += (dx / (d || 1)) * f * 14;
            y += (dy / (d || 1)) * f * 14;
            glow = Math.max(glow, f);
          }
        }
        ctx!.globalAlpha = 0.22 + glow * 0.78;
        ctx!.fillStyle = glow > 0.15 ? accent : ink;
        ctx!.beginPath();
        ctx!.arc(x, y, 1.1 + glow * 1.6, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    ctx!.globalAlpha = 1;
  }

  const loop = (now: number) => {
    draw(now);
    frame = running ? requestAnimationFrame(loop) : 0;
  };
  const start = () => {
    if (running || reduce.matches || document.hidden) return;
    running = true;
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  const track = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() };
    if (reduce.matches) draw(performance.now());
  };
  const hero = canvas.parentElement!;
  hero.addEventListener('pointermove', track, { passive: true });
  hero.addEventListener('pointerdown', track, { passive: true });

  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduce.addEventListener('change', () => (reduce.matches ? (stop(), draw(0)) : start()));
  new MutationObserver(() => { colors(); draw(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('resize', resize);
  colors();
  resize();
}
