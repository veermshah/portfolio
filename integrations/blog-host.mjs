// Serves src/pages/blog/* at the root of the blog subdomain from the same Vercel project.
// Runs after @astrojs/vercel writes .vercel/output/config.json and prepends host-matched
// routes so they apply before Vercel's filesystem lookup (vercel.json rewrites run after it).
import { readFile, writeFile } from 'node:fs/promises';

export default function blogHost({ host, mainHosts = [] }) {
  let root;
  return {
    name: 'blog-host',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = config.root;
      },
      'astro:build:done': async ({ logger }) => {
        const file = new URL('./.vercel/output/config.json', root);
        const config = JSON.parse(await readFile(file, 'utf8'));
        const onBlog = [{ type: 'host', value: host }];
        config.routes.unshift(
          // Already-prefixed paths and shared build assets pass through unchanged.
          { src: '^/(blog(?:/.*)?|_astro/.*|_vercel/.*|favicon\\.(?:svg|ico)|apple-touch-icon\\.png|og\\.png)$', has: onBlog, continue: true },
          { src: '^/(?!blog(?:/|$)|_astro/|_vercel/|favicon\\.(?:svg|ico)$|apple-touch-icon\\.png$|og\\.png$)(.*)$', has: onBlog, dest: '/blog/$1', continue: true },
          // The main domains send /blog/* to the subdomain; previews keep /blog/* for testing.
          ...mainHosts.map((main) => ({
            src: '^/blog(?:/(.*))?$',
            has: [{ type: 'host', value: main }],
            status: 308,
            headers: { Location: `https://${host}/$1` },
          })),
        );
        await writeFile(file, JSON.stringify(config, null, 2));
        logger.info(`routes for ${host} added`);
      },
    },
  };
}
