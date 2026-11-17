import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import blogHost from './integrations/blog-host.mjs';

// Canonical origin used for the sitemap, canonical links and the OG image URL.
// Change this to https://veermickey.com when the domain moves (see README).
export const SITE = process.env.SITE_URL ?? 'https://portfolio-wheat-xi-reyo27zre0.vercel.app';
export const BLOG_HOST = process.env.BLOG_HOST ?? 'blog.veermickey.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  adapter: vercel(),
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/blog') }), blogHost({ host: BLOG_HOST })],
  image: {
    responsiveStyles: false,
  },
});
