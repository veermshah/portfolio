import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical origin used for the sitemap, canonical links and the OG image URL.
// Change this to https://veermickey.com when the domain moves (see README).
export const SITE = process.env.SITE_URL ?? 'https://portfolio-wheat-xi-reyo27zre0.vercel.app';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
  image: {
    responsiveStyles: false,
  },
});
