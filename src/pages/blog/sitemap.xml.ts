import type { APIRoute } from 'astro';
import { publishedPosts } from '../../lib/blog/posts';
import { CDN_CACHE, canonicalFor } from '../../lib/blog/http';

export const prerender = false;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = async () => {
  const posts = await publishedPosts();
  const tags = [...new Set(posts.flatMap((p) => p.tags))];
  const urls = [
    { loc: canonicalFor('/'), lastmod: posts[0]?.updated_at },
    ...posts.map((p) => ({ loc: canonicalFor(`/${p.slug}`), lastmod: p.updated_at })),
    ...tags.map((t) => ({ loc: canonicalFor(`/tags/${encodeURIComponent(t)}`), lastmod: undefined })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': CDN_CACHE } });
};
