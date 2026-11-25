import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { notes } from '../data/notes';
import { profile } from '../data/profile';

/** RSS feed for the notes at /notes/. The blog on blog.veermickey.com has its own feed. */
export const GET: APIRoute = async ({ site }) => {
  const origin = new URL('/', site).href;
  const items = await Promise.all(
    notes.map(async (note) => ({
      title: note.frontmatter.title,
      link: `/notes/${note.slug}/`,
      pubDate: new Date(`${note.frontmatter.date}T00:00:00Z`),
      description: note.frontmatter.description,
      // Root-relative links in the note body would break in a feed reader, so make them absolute.
      content: (await note.compiledContent()).replace(/(href|src)="\/(?!\/)/g, `$1="${origin}`),
    })),
  );
  return rss({
    title: `${profile.name}, notes`,
    description: `Short technical notes by ${profile.name} on LLM compilers, AI systems and experiments, written alongside the projects on this site.`,
    site: new URL('/notes/', site).href,
    items,
    customData: '<language>en</language>',
  });
};
