import type { MarkdownInstance } from 'astro';

interface NoteFrontmatter {
  title: string;
  description: string;
  date: string;
  draft?: boolean;
}

const files = import.meta.glob<MarkdownInstance<NoteFrontmatter>>('../content/notes/*.md', { eager: true });
export const notes = Object.entries(files)
  .filter(([, note]) => !note.frontmatter.draft)
  .map(([path, note]) => ({ ...note, slug: path.split('/').pop()!.replace(/\.md$/, '') }))
  .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));

export const formatDate = (date: string) => new Intl.DateTimeFormat('en', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));
