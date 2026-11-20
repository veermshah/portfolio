import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { publishedPosts } from '../../lib/blog/posts';
import { BLOG_DESCRIPTION, BLOG_ORIGIN } from '../../lib/blog/config';
import { CDN_CACHE } from '../../lib/blog/http';
import { renderMarkdown } from '../../lib/blog/text';

export const prerender = false;

export const GET: APIRoute = async () => {
  const posts = await publishedPosts();
  const response = await rss({
    title: 'Veer Shah, blog',
    description: BLOG_DESCRIPTION,
    site: BLOG_ORIGIN,
    items: posts.map((post) => ({
      title: post.title,
      link: `/${post.slug}`,
      pubDate: new Date(post.published_at!),
      description: post.excerpt,
      content: renderMarkdown(post.content),
      categories: post.tags,
    })),
  });
  response.headers.set('Cache-Control', CDN_CACHE);
  return response;
};
