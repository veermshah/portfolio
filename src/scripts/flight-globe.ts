// Flight globe: a dotted Earth on a 2D canvas with an arc for every route in src/data/flights.json.
// No library. Land is a ~2 KB bitset over a Fibonacci sphere (see scripts/build-globe-dots.mjs).
// It turns slowly, can be dragged sideways, pauses when off screen or in a hidden tab, and stays
// still under prefers-reduced-motion. Colors follow the site's --ink and --rule, so it tracks the theme.
import { LAND_MASK, LAND_POINTS } from '../data/globe-land';
import flights from '../data/flights.json';

type Vec = [number, number, number];
type Airport = { lat: number; lon: number };

const RAD = Math.PI / 180;
const TILT = 24 * RAD; // look down a little so the northern routes read well
const SPEED = 0.05; // radians per second, about two minutes a turn
const START_LON = -45; // the Atlantic, so the Americas and Europe both show on first view

function toVec(lat: number, lon: number): Vec {
  const la = lat * RAD;
  const lo = lon * RAD;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

function landPoints(): Vec[] {
  const bytes = Uint8Array.from(atob(LAND_MASK), (c) => c.charCodeAt(0));
  const golden = Math.PI * (3 - Math.sqrt(5));
  const out: Vec[] = [];
  for (let i = 0; i < LAND_POINTS; i++) {
    if (!(bytes[i >> 3] & (1 << (i & 7)))) continue;
    const y = 1 - (2 * (i + 0.5)) / LAND_POINTS;
    const r = Math.sqrt(1 - y * y);
    const lon = i * golden;
    out.push([r * Math.sin(lon), y, r * Math.cos(lon)]);
  }
  return out;
}

// Great circle from a to b, lifted off the surface in the middle so long routes arch.
function arc(a: Vec, b: Vec): Vec[] {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const steps = Math.max(12, Math.round(omega * 40));
  const lift = Math.min(0.32, 0.04 + omega * 0.16);
  const s = Math.sin(omega) || 1;
  const pts: Vec[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const k1 = Math.sin((1 - t) * omega) / s;
    const k2 = Math.sin(t * omega) / s;
    const h = 1 + lift * Math.sin(Math.PI * t);
    pts.push([(a[0] * k1 + b[0] * k2) * h, (a[1] * k1 + b[1] * k2) * h, (a[2] * k1 + b[2] * k2) * h]);
  }
  return pts;
}

export function mountFlightGlobe(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const airports = flights.airports as Record<string, Airport>;
  const land = landPoints();
  const hubs = Object.values(airports).map((a) => toVec(a.lat, a.lon));
  const routes = flights.routes.map((r) => arc(toVec(airports[r.a].lat, airports[r.a].lon), toVec(airports[r.b].lat, airports[r.b].lon)));

  let lon = -START_LON * RAD;
  let tilt = TILT;
  let size = 0;
  let dpr = 1;
  let ink = '#0a0a0a';
  let rule = '#e5e5e5';
  let visible = false;
  let raf = 0;
  let last = 0;
  let traceStart = 0; // when the arcs start drawing in, once the globe is first seen
  let dragging = false;
  let dragX = 0;
  let dragY = 0;

  function readColors() {
    const cs = getComputedStyle(canvas);
    ink = cs.getPropertyValue('--ink').trim() || ink;
    rule = cs.getPropertyValue('--rule').trim() || rule;
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    size = Math.round(box.width * dpr);
    canvas.width = size;
    canvas.height = size;
    draw(performance.now());
  }

  // Rotate a point into view space: x right, y up, z toward the viewer.
  function view(p: Vec, cl: number, sl: number, ct: number, st: number): Vec {
    const x = p[0] * cl + p[2] * sl;
    const z1 = -p[0] * sl + p[2] * cl;
    return [x, p[1] * ct - z1 * st, p[1] * st + z1 * ct];
  }

  function draw(now: number) {
    if (!size) return;
    const R = size * 0.46;
    const c = size / 2;
    const cl = Math.cos(lon), sl = Math.sin(lon), ct = Math.cos(tilt), st = Math.sin(tilt);
    ctx!.clearRect(0, 0, size, size);

    // Outline of the sphere.
    ctx!.globalAlpha = 1;
    ctx!.strokeStyle = rule;
    ctx!.lineWidth = dpr;
    ctx!.beginPath();
    ctx!.arc(c, c, R, 0, Math.PI * 2);
    ctx!.stroke();

    // Land dots, brighter toward the middle of the disc. Four alpha bands keep it to four fills.
    const dot = Math.max(1, 1.15 * dpr);
    const bands: Path2D[] = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    for (const p of land) {
      const v = view(p, cl, sl, ct, st);
      if (v[2] <= 0) continue;
      const band = Math.min(3, Math.floor(v[2] * 4));
      bands[band].rect(c + v[0] * R - dot / 2, c - v[1] * R - dot / 2, dot, dot);
    }
    ctx!.fillStyle = ink;
    bands.forEach((path, i) => {
      ctx!.globalAlpha = 0.12 + i * 0.09;
      ctx!.fill(path);
    });

    // Routes trace in one after another the first time the globe is seen, then stay.
    const traced = reduce.matches || !traceStart ? (traceStart ? 1 : 0) : Math.min(1, (now - traceStart) / 2600);
    ctx!.strokeStyle = ink;
    ctx!.lineWidth = Math.max(1, 1.1 * dpr);
    ctx!.lineCap = 'round';
    routes.forEach((pts, i) => {
      const startAt = (i / routes.length) * 0.6;
      const local = Math.min(1, Math.max(0, (traced - startAt) / 0.4));
      if (local <= 0) return;
      const end = Math.max(1, Math.round(local * (pts.length - 1)));
      ctx!.beginPath();
      let pen = false;
      for (let j = 0; j <= end; j++) {
        const v = view(pts[j], cl, sl, ct, st);
        const shown = v[2] > 0 || v[0] * v[0] + v[1] * v[1] > 1;
        if (!shown) { pen = false; continue; }
        const x = c + v[0] * R, y = c - v[1] * R;
        if (pen) ctx!.lineTo(x, y); else { ctx!.moveTo(x, y); pen = true; }
      }
      ctx!.globalAlpha = 0.7;
      ctx!.stroke();
    });

    // Airports.
    ctx!.globalAlpha = 1;
    ctx!.fillStyle = ink;
    ctx!.beginPath();
    for (const h of hubs) {
      const v = view(h, cl, sl, ct, st);
      if (v[2] <= 0) continue;
      const x = c + v[0] * R, y = c - v[1] * R;
      ctx!.moveTo(x + 2.2 * dpr, y);
      ctx!.arc(x, y, 2.2 * dpr, 0, Math.PI * 2);
    }
    ctx!.fill();
  }

  function frame(now: number) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!dragging && !reduce.matches) lon += SPEED * dt;
    draw(now);
    const tracing = traceStart && now - traceStart < 2700;
    raf = visible && (!reduce.matches || dragging || tracing) ? requestAnimationFrame(frame) : 0;
  }

  function start() {
    if (!raf && visible && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !traceStart) traceStart = performance.now();
    if (visible) start(); else stop();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(() => { readColors(); draw(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); draw(performance.now()); });
  reduce.addEventListener('change', start);

  // Drag sideways to spin, up and down to tilt. touch-action: pan-y keeps page scrolling on phones.
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragX = e.clientX;
    dragY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    start();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const k = 3 / Math.max(1, canvas.clientWidth);
    lon += (e.clientX - dragX) * k;
    tilt = Math.min(1.1, Math.max(-0.3, tilt + (e.clientY - dragY) * k));
    dragX = e.clientX;
    dragY = e.clientY;
    if (reduce.matches) draw(performance.now());
  });
  const release = () => { dragging = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  readColors();
  resize();
}
