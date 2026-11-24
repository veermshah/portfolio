import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** Unsplash photos for the photography page, fetched at build time. */
export type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  color: string;
  alt: string;
  raw: string;
  page: string;
};

const USER = 'veermickey';
// Unsplash asks API users to add these to every link back to unsplash.com.
export const UTM = 'utm_source=veermickey_com&utm_medium=referral';
// Demo keys allow 50 requests/hour, so cache results for dev reloads and repeat builds.
const CACHE = 'node_modules/.cache/unsplash-photos.json';
const CACHE_MS = 60 * 60 * 1000;

let pending: Promise<UnsplashPhoto[]> | undefined;

/** All of the user's photos, most popular first. Empty when no key is set or the API fails. */
export function getUnsplashPhotos() {
  return (pending ??= load());
}

async function load(): Promise<UnsplashPhoto[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY ?? import.meta.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  try {
    const cached = JSON.parse(await readFile(CACHE, 'utf8'));
    // Dev only: production builds always refetch so new uploads ship on the next deploy.
    if (import.meta.env.DEV && Date.now() - cached.at < CACHE_MS && cached.photos.length) return cached.photos;
  } catch {}
  try {
    const photos: UnsplashPhoto[] = [];
    for (let page = 1; page <= 50; page++) {
      const res = await fetch(`https://api.unsplash.com/users/${USER}/photos?per_page=30&order_by=popular&page=${page}`, {
        headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
      });
      if (!res.ok) throw new Error(`Unsplash API ${res.status} on page ${page}`);
      const batch = (await res.json()) as any[];
      for (const p of batch) {
        photos.push({
          id: p.id,
          width: p.width,
          height: p.height,
          color: p.color ?? '#888',
          alt: p.alt_description ?? p.description ?? 'Photo by Veer Shah',
          raw: p.urls.raw,
          page: p.links.html,
        });
      }
      if (batch.length < 30) break;
    }
    await mkdir('node_modules/.cache', { recursive: true }).catch(() => {});
    await writeFile(CACHE, JSON.stringify({ at: Date.now(), photos })).catch(() => {});
    return photos;
  } catch (err) {
    console.warn(`[unsplash] falling back to local photos: ${(err as Error).message}`);
    return [];
  }
}

/** Unsplash image CDN URL at a given width (imgix params). */
export const sized = (photo: UnsplashPhoto, width: number) => `${photo.raw}&w=${width}&auto=format&fit=max&q=75`;
