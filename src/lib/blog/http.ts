/** Vercel's CDN caches SSR responses briefly, so new posts show up within a minute without a redeploy. */
export const CDN_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=600';

export function canonicalFor(path: string): string {
  return new URL(path, 'https://blog.veermickey.com').href;
}
