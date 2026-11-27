// Slow crossfade between a few of Veer's photos behind the home hero. Only the first photo is in
// the HTML; the rest load a few seconds after the page has loaded, and only on a decent connection without
// Save-Data. No crossfade with reduced motion. Pauses off screen and in a hidden tab.

const HOLD_MS = 7000;

type Frame = { src: string; srcset: string; page?: string };

export function initHeroPhotos() {
  const hero = document.querySelector<HTMLElement>('.hero');
  const stage = hero?.querySelector<HTMLElement>('.hero-photos');
  if (!hero || !stage) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /2g|3g/.test(connection?.effectiveType ?? '')) return;

  let rest: Frame[] = [];
  try {
    rest = JSON.parse(stage.dataset.frames ?? '[]');
  } catch {}
  if (!rest.length) return;

  const first = stage.querySelector<HTMLImageElement>('.hero-photo')!;
  const credit = hero.querySelector<HTMLAnchorElement>('[data-photo-link]');
  const frames: HTMLImageElement[] = [first];
  const ready = new Set([0]);
  let current = 0;
  let timer = 0;
  let visible = true;

  const show = (i: number) => {
    frames[current].classList.remove('is-active');
    frames[i].classList.add('is-active');
    current = i;
    const page = frames[i].dataset.page;
    if (credit && page) credit.href = page;
  };
  const advance = () => {
    for (let step = 1; step < frames.length; step++) {
      const next = (current + step) % frames.length;
      if (ready.has(next)) return show(next);
    }
  };
  const schedule = () => {
    clearInterval(timer);
    timer = 0;
    if (ready.size > 1 && visible && !document.hidden) timer = window.setInterval(advance, HOLD_MS);
  };

  const loadRest = () => {
    rest.forEach((frame, i) => {
      const img = new Image();
      img.className = 'hero-photo';
      img.alt = '';
      img.decoding = 'async';
      img.sizes = first.sizes;
      img.srcset = frame.srcset;
      img.src = frame.src;
      if (frame.page) img.dataset.page = frame.page;
      frames.push(img);
      stage.append(img);
      img.decode().then(() => {
        ready.add(i + 1);
        if (!timer) schedule();
      }, () => {});
    });
  };

  // The first crossfade is 7 s away, so wait a few seconds after load before fetching the rest:
  // the first screen gets the whole connection, and the extra photos don't count against it.
  const later = () => setTimeout(loadRest, 3000);
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }).observe(hero);
  document.addEventListener('visibilitychange', schedule);
}
