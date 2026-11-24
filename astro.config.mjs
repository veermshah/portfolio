import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import blogHost from './integrations/blog-host.mjs';

// Canonical origin used for the sitemap, canonical links and the OG image URL.
// Vercel redirects the apex veermickey.com to www, so www is canonical.
export const SITE = process.env.SITE_URL ?? 'https://www.veermickey.com';
export const BLOG_HOST = process.env.BLOG_HOST ?? 'blog.veermickey.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  adapter: vercel({ isr: { expiration: 60 } }),
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/blog') }), blogHost({ host: BLOG_HOST, mainHosts: ['veermickey.com', 'www.veermickey.com'] })],
  image: {
    responsiveStyles: false,
  },
});
