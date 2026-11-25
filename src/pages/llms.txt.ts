import type { APIRoute } from 'astro';
import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { experience } from '../data/experience';
import { education } from '../data/education';
import { notes } from '../data/notes';
import { BLOG_ORIGIN } from '../lib/blog/config';

/**
 * /llms.txt (https://llmstxt.org): a plain summary of the site for language models,
 * built from src/data at build time so it stays in step with the pages.
 */
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const plain = (s: string) => s.replace(/`/g, '').replace(/\s+/g, ' ').trim();
  const profiles = profile.links.filter((l) => l.href?.startsWith('https://'));
  const medium = profile.sameAs.filter((href) => href.includes('medium.com'));

  const lines = [
    `# ${profile.name}`,
    '',
    `> ${plain(profile.description)}`,
    '',
    plain(profile.bio),
    '',
    `Also known as ${profile.alternateNames.join(' and ')}. Based in the Dallas, Texas area (${profile.locality.city}, ${profile.locality.region}).`,
    '',
    '## Pages',
    '',
    `- [Home](${url('/')}): introduction, featured work, experience, education and skills, and every project`,
    `- [Resume](${url('/resume.pdf')}): PDF resume`,
    `- [Notes](${url('/notes/')}): short technical notes (RSS: ${url('/rss.xml')})`,
    `- [Photography](${url('/photography/')}): photos, also published on Unsplash`,
    `- [Blog](${BLOG_ORIGIN}): posts (RSS: ${BLOG_ORIGIN}/rss.xml)`,
    '',
    '## Experience',
    '',
    ...experience.map((e) => `- ${e.company}: ${e.role}, ${e.period}, ${e.location}`),
    '',
    '## Education',
    '',
    ...education.map((e) => `- ${e.school}: ${e.degree}, ${e.period}`),
    '',
    '## Projects',
    '',
    ...projects.map((p) => `- [${p.title}](${url(`/projects/${p.slug}/`)}): ${plain(p.pitch)}${p.award ? ` (${p.award})` : ''}`),
    '',
    '## Notes',
    '',
    ...notes.map((n) => `- [${n.frontmatter.title}](${url(`/notes/${n.slug}/`)}): ${n.frontmatter.description}`),
    '',
    '## Profiles',
    '',
    ...profiles.map((l) => `- ${l.label}: ${l.href}`),
    ...medium.map((href) => `- Medium: ${href}`),
    '',
  ];

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
