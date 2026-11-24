import { supabase, supabaseConfigured } from '../../lib/blog/supabase';
import { adminSession, adminUrl } from './auth';

type Row = {
  created_at: string;
  session_id: string;
  host: string;
  path: string;
  type: string;
  target: string | null;
  x: number | null;
  y: number | null;
  value: number | null;
  viewport_w: number | null;
  doc_h: number | null;
  device: string | null;
  referrer: string | null;
};

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const SITE_HOSTS = ['www.veermickey.com', 'blog.veermickey.com'];
const page = (r: Row) => `${r.host.replace(/^veermickey\.com$/, 'www.veermickey.com')}${r.path}`;
const secs = (ms: number) => (ms >= 60000 ? `${(ms / 60000).toFixed(1)} min` : `${(ms / 1000).toFixed(1)} s`);
const median = (a: number[]) => (a.length ? [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)] : 0);
const WIDTH: Record<string, number> = { desktop: 1280, tablet: 820, mobile: 390 };

let rows: Row[] = [];

export async function initAnalytics() {
  const gate = $<HTMLElement>('[data-gate]');
  for (const a of document.querySelectorAll<HTMLAnchorElement>('[data-admin-link]')) a.href = adminUrl();
  if (!supabaseConfigured) {
    gate.textContent = 'Supabase is not configured for this deployment.';
    return;
  }
  const session = await adminSession();
  gate.hidden = true;
  if (!session) {
    $<HTMLElement>('[data-signin]').hidden = false;
    return;
  }
  $<HTMLElement>('[data-view="analytics"]').hidden = false;
  const form = $<HTMLFormElement>('[data-filters]');
  const params = new URLSearchParams(location.search);
  for (const name of ['days', 'device']) if (params.get(name)) (form.elements.namedItem(name) as HTMLSelectElement).value = params.get(name)!;
  form.addEventListener('change', (e) => ((e.target as HTMLSelectElement).name === 'days' ? load() : render()));
  addEventListener('resize', () => drawHeatmap());
  await load(params.get('page') ?? '');
}

async function load(selected = $<HTMLSelectElement>('[data-pages]').value) {
  const status = $<HTMLElement>('[data-status]');
  const days = Number(($<HTMLFormElement>('[data-filters]').elements.namedItem('days') as HTMLSelectElement).value);
  const since = new Date(Date.now() - days * 864e5).toISOString();
  status.textContent = 'Loading…';
  rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase()
      .from('analytics_events')
      .select('created_at,session_id,host,path,type,target,x,y,value,viewport_w,doc_h,device,referrer')
      .gte('created_at', since)
      .order('id')
      .range(from, from + 999);
    if (error) {
      status.textContent = `Couldn’t load events: ${error.message}`;
      return;
    }
    rows.push(...(data as Row[]));
    if (data.length < 1000 || rows.length >= 50000) break;
  }
  status.textContent = `${rows.length.toLocaleString()} events since ${new Date(since).toLocaleString()}.`;
  const pages = [...new Set(rows.filter((r) => r.type === 'pageview').map(page))].sort();
  const select = $<HTMLSelectElement>('[data-pages]');
  select.replaceChildren(new Option('All pages', ''), ...pages.map((p) => new Option(p, p)));
  select.value = pages.includes(selected) ? selected : '';
  render();
}

function table(name: string, head: string[], body: (string | number)[][]) {
  const el = $<HTMLTableElement>(`[data-table="${name}"]`);
  const tr = (cells: (string | number)[], tag: 'th' | 'td') => {
    const row = document.createElement('tr');
    for (const c of cells) {
      const cell = document.createElement(tag);
      cell.textContent = String(c);
      row.append(cell);
    }
    return row;
  };
  el.replaceChildren(tr(head, 'th'), ...(body.length ? body.slice(0, 25).map((r) => tr(r, 'td')) : [tr(['No data yet'], 'td')]));
}

function countBy<T>(items: T[], key: (t: T) => string | null) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

function render() {
  const selected = $<HTMLSelectElement>('[data-pages]').value;
  const scoped = selected ? rows.filter((r) => page(r) === selected) : rows;
  const views = scoped.filter((r) => r.type === 'pageview' && !r.target);
  const engaged = scoped.filter((r) => r.type === 'pageview' && r.target === 'engaged').map((r) => r.value ?? 0);
  const depth = scoped.filter((r) => r.type === 'scroll').map((r) => r.value ?? 0);
  const sessions = new Set(scoped.map((r) => r.session_id));

  $('[data-stats]').replaceChildren(
    ...[
      ['Page views', views.length.toLocaleString()],
      ['Sessions', sessions.size.toLocaleString()],
      ['Median engaged time', secs(median(engaged))],
      ['Median scroll depth', `${median(depth)}%`],
    ].flatMap(([k, v]) => {
      const div = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = v;
      div.append(dt, dd);
      return [div];
    }),
  );

  table('pages', ['Page', 'Views', 'Sessions'], countBy(rows.filter((r) => r.type === 'pageview' && !r.target), page).map(([p, n]) => [p, n, new Set(rows.filter((r) => page(r) === p).map((r) => r.session_id)).size]));

  const sections = new Map<string, { ms: number[]; sessions: Set<string> }>();
  for (const r of scoped.filter((r) => r.type === 'section' && r.target)) {
    const key = selected ? r.target! : `${r.path} #${r.target}`;
    const s = sections.get(key) ?? { ms: [], sessions: new Set() };
    s.ms.push(r.value ?? 0);
    s.sessions.add(r.session_id);
    sections.set(key, s);
  }
  table('sections', ['Section', 'Sessions', 'Median time'], [...sections].sort((a, b) => b[1].sessions.size - a[1].sessions.size).map(([k, s]) => [k, s.sessions.size, secs(median(s.ms))]));
  table('clicks', ['Target', 'Clicks'], countBy(scoped.filter((r) => r.type === 'click'), (r) => r.target));
  table('outbound', ['Link', 'Clicks'], countBy(scoped.filter((r) => r.type === 'outbound'), (r) => r.target));
  table('referrers', ['Referrer', 'Views'], countBy(views, (r) => r.referrer ?? 'Direct / none'));
  table('devices', ['Device', 'Views'], countBy(views, (r) => r.device));

  drawHeatmap();
}

function drawHeatmap() {
  const selected = $<HTMLSelectElement>('[data-pages]').value;
  const device = ($<HTMLFormElement>('[data-filters]').elements.namedItem('device') as HTMLSelectElement).value;
  const frame = $<HTMLElement>('[data-frame]');
  const iframe = $<HTMLIFrameElement>('[data-iframe]');
  const canvas = $<HTMLCanvasElement>('[data-canvas]');
  const meta = $<HTMLElement>('[data-heat-meta]');
  frame.hidden = !selected;
  if (!selected) {
    meta.textContent = '';
    return;
  }
  const scoped = rows.filter((r) => page(r) === selected && r.device === device);
  const clicks = scoped.filter((r) => (r.type === 'click' || r.type === 'outbound') && r.x != null && r.y != null);
  const docH = median(scoped.map((r) => r.doc_h ?? 0).filter(Boolean)) || 3000;
  const width = WIDTH[device];
  const scale = Math.min(1, frame.parentElement!.clientWidth / width);
  meta.textContent = `· ${clicks.length} clicks on ${device}`;

  const pageUrl = new URL(`https://${selected}`);
  if (!SITE_HOSTS.includes(pageUrl.hostname)) {
    meta.textContent = '· not a veermickey.com page';
    return;
  }
  pageUrl.searchParams.set('notrack', '1');
  const src = pageUrl.href;
  if (iframe.dataset.src !== src) iframe.src = iframe.dataset.src = src;
  Object.assign(iframe.style, { width: `${width}px`, height: `${docH}px`, transform: `scale(${scale})` });
  frame.style.width = `${width * scale}px`;
  frame.style.height = `${docH * scale}px`;

  const dpr = devicePixelRatio || 1;
  canvas.width = width * scale * dpr;
  canvas.height = docH * scale * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const r = 22 * Math.max(scale, 0.5);
  for (const c of clicks) {
    const x = c.x! * width * scale;
    const y = c.y! * docH * scale;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255, 60, 0, 0.45)');
    g.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const depths = scoped.filter((r) => r.type === 'scroll').map((r) => r.value ?? 0);
  const reach = $<HTMLElement>('[data-reach]');
  reach.replaceChildren(
    ...Array.from({ length: 10 }, (_, i) => {
      const pct = depths.length ? Math.round((depths.filter((d) => d >= (i + 1) * 10).length / depths.length) * 100) : 0;
      const band = document.createElement('span');
      band.style.setProperty('--reach', String(pct / 100));
      band.title = `${pct}% of sessions reached ${(i + 1) * 10}% of the page`;
      band.textContent = `${pct}%`;
      return band;
    }),
  );
}
