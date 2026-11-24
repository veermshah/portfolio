// First-party engagement tracker. Private: events are insert-only for visitors and
// readable only by the site owner. No tracking cookies, IPs or user agents; honors DNT/GPC.
// Opt yourself out on a device by visiting any page with ?notrack=1 (?notrack=0 undoes it);
// the opt-out is a localStorage flag plus a .veermickey.com cookie so it covers the blog too.

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const HOSTS = ['www.veermickey.com', 'veermickey.com', 'blog.veermickey.com'];

type Event = {
  type: 'pageview' | 'section' | 'scroll' | 'click' | 'outbound';
  target?: string;
  x?: number;
  y?: number;
  value?: number;
};

function optedOut() {
  const flag = new URLSearchParams(location.search).get('notrack');
  const domain = location.hostname.endsWith('veermickey.com') ? '; domain=.veermickey.com' : '';
  try {
    if (flag === '1') {
      localStorage.setItem('notrack', '1');
      document.cookie = `notrack=1${domain}; path=/; max-age=31536000; samesite=lax; secure`;
    }
    if (flag === '0') {
      localStorage.removeItem('notrack');
      document.cookie = `notrack=${domain}; path=/; max-age=0`;
    }
    if (localStorage.getItem('notrack') === '1' || /(?:^|;\s*)notrack=1/.test(document.cookie)) return true;
  } catch {}
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return navigator.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

function sessionId() {
  try {
    let id = sessionStorage.getItem('sid');
    if (!id) sessionStorage.setItem('sid', (id = crypto.randomUUID().replace(/-/g, '').slice(0, 24)));
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 14).padEnd(12, '0');
  }
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number(n.toFixed(4))));
const docHeight = () => Math.max(document.documentElement.scrollHeight, 1);
const docWidth = () => Math.max(document.documentElement.scrollWidth, 1);

function label(el: Element) {
  const text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
  const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') : null;
  return (href ? `${text.slice(0, 80)} → ${href}` : text.slice(0, 120)) || el.tagName.toLowerCase();
}

if (url && key && HOSTS.includes(location.hostname) && window === window.top && !location.pathname.includes('/admin') && !optedOut()) {
  const sid = sessionId();
  const vw = innerWidth;
  const device = vw < 640 ? 'mobile' : vw < 1024 ? 'tablet' : 'desktop';
  const referrer = (() => {
    try {
      const r = new URL(document.referrer);
      return HOSTS.includes(r.hostname) ? null : r.hostname;
    } catch {
      return null;
    }
  })();
  const queue: Record<string, unknown>[] = [];

  const push = (e: Event) =>
    queue.push({
      session_id: sid,
      host: location.hostname,
      path: location.pathname.slice(0, 300),
      viewport_w: vw,
      doc_h: docHeight(),
      device,
      referrer,
      theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
      // PostgREST bulk inserts require every row to have the same keys.
      target: null,
      x: null,
      y: null,
      value: null,
      ...e,
    });

  const flush = () => {
    if (!queue.length) return;
    const body = JSON.stringify(queue.splice(0));
    fetch(`${url}/rest/v1/analytics_events`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body,
    }).catch(() => {});
  };

  push({ type: 'pageview' });
  flush();

  // Time each section (or the post body) while 40% of it, or 40% of the viewport, shows it.
  const sections = [...document.querySelectorAll<HTMLElement>('main section[id], main [data-track]')];
  const visibleSince = new Map<HTMLElement, number>();
  const dwell = new Map<HTMLElement, number>();
  const updateSections = () => {
    const now = performance.now();
    for (const el of sections) {
      const rect = el.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
      const shown = rect.height > 0 && (visible >= rect.height * 0.4 || visible >= innerHeight * 0.4);
      if (shown) {
        if (!visibleSince.has(el)) visibleSince.set(el, now);
      } else if (visibleSince.has(el)) {
        dwell.set(el, (dwell.get(el) ?? 0) + now - visibleSince.get(el)!);
        visibleSince.delete(el);
      }
    }
  };
  let sectionFrame = 0;
  const scheduleSections = () => {
    if (!sectionFrame) sectionFrame = requestAnimationFrame(() => { sectionFrame = 0; updateSections(); });
  };
  addEventListener('scroll', scheduleSections, { passive: true });
  addEventListener('resize', scheduleSections, { passive: true });
  updateSections();

  let maxDepth = 0;
  const onScroll = () => {
    maxDepth = Math.max(maxDepth, Math.round(((scrollY + innerHeight) / docHeight()) * 100));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  let engagedMs = 0;
  let visibleAt = performance.now();

  addEventListener(
    'click',
    (event) => {
      const target = (event.target as Element).closest('a, button, summary, [role="button"], [data-track], section[id]') ?? (event.target as Element);
      const a = target instanceof HTMLAnchorElement ? target : null;
      const outbound = a && a.hostname && !HOSTS.includes(a.hostname) && a.hostname !== location.hostname;
      push({
        type: outbound ? 'outbound' : 'click',
        target: outbound ? a!.href.slice(0, 300) : label(target),
        x: clamp01(event.pageX / docWidth()),
        y: clamp01(event.pageY / docHeight()),
      });
      if (queue.length >= 10 || a) flush();
    },
    { capture: true, passive: true },
  );

  const report = () => {
    const now = performance.now();
    engagedMs += now - visibleAt;
    visibleAt = now;
    for (const [el, since] of visibleSince) {
      dwell.set(el, (dwell.get(el) ?? 0) + now - since);
      visibleSince.set(el, now);
    }
    for (const [el, ms] of dwell) if (ms >= 500) push({ type: 'section', target: el.id || el.dataset.track, value: Math.round(ms) });
    dwell.clear();
    push({ type: 'scroll', value: Math.min(100, maxDepth) });
    push({ type: 'pageview', target: 'engaged', value: Math.round(engagedMs) });
    engagedMs = 0;
    flush();
  };

  addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') report();
    else visibleAt = performance.now();
  });
  addEventListener('pagehide', () => { if (document.visibilityState !== 'hidden') report(); });
}
