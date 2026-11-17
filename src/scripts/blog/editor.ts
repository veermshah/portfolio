import { supabase, supabaseConfigured } from '../../lib/blog/supabase';
import { IMAGE_BUCKET, RESERVED_SLUGS } from '../../lib/blog/config';
import type { Post } from '../../lib/blog/posts';
import { formatPostDate, readingMinutes, renderMarkdown, slugify } from '../../lib/blog/text';
import { adminSession, adminUrl, base } from './auth';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const AUTOSAVE_MS = 2000;

type Draft = Pick<Post, 'title' | 'slug' | 'excerpt' | 'content' | 'cover_image_url' | 'tags'>;

let post: Post | null = null;
let slugTouched = false;
let dirty = false;
let editVersion = 0;
let saving: Promise<void> | null = null;
let autosaveTimer: number | undefined;

const form = () => $<HTMLFormElement>('[data-form]');
const field = <T extends HTMLInputElement | HTMLTextAreaElement>(name: string) => form().elements.namedItem(name) as T;
const setStatus = (text: string) => ($<HTMLElement>('[data-save-status]').textContent = text);

export async function initEditor() {
  const gate = $<HTMLElement>('[data-gate]');
  if (!supabaseConfigured) {
    gate.textContent = 'Supabase is not configured for this deployment.';
    return;
  }
  if (!(await adminSession())) {
    location.replace(adminUrl());
    return;
  }
  $<HTMLAnchorElement>('[data-back]').href = adminUrl();

  const id = new URLSearchParams(location.search).get('id');
  if (id) {
    const { data, error } = await supabase().from('posts').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      gate.textContent = error ? `Couldn’t load the post: ${error.message}` : 'That post doesn’t exist.';
      return;
    }
    post = data as Post;
    fill(post);
    slugTouched = true;
  }
  gate.hidden = true;
  $<HTMLElement>('[data-editor]').hidden = false;
  bind();
  renderPreview();
  syncControls();
}

function fill(p: Post) {
  field('title').value = p.title;
  field('slug').value = p.slug;
  field('excerpt').value = p.excerpt;
  field('tags').value = p.tags.join(', ');
  field('cover_image_url').value = p.cover_image_url ?? '';
  field('content').value = p.content;
}

function read(): Draft {
  const cover = field('cover_image_url').value.trim();
  return {
    title: field('title').value.trim(),
    slug: field('slug').value.trim(),
    excerpt: field('excerpt').value.trim(),
    content: field('content').value,
    cover_image_url: cover || null,
    tags: [...new Set(field('tags').value.split(',').map((t) => t.trim()).filter(Boolean))],
  };
}

function bind() {
  const f = form();
  f.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.name === 'slug') slugTouched = target.value.trim() !== '';
    if (target.name === 'title' && !slugTouched) field('slug').value = slugify(target.value);
    if (target.type === 'file') return;
    dirty = true;
    editVersion++;
    setStatus('Unsaved changes');
    renderPreviewSoon();
    scheduleAutosave();
  });
  f.addEventListener('submit', (event) => {
    event.preventDefault();
    void save();
  });
  $('[data-publish]').addEventListener('click', () => void togglePublish());
  $('[data-delete]').addEventListener('click', () => void remove());
  for (const tab of document.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
    tab.addEventListener('click', () => {
      $<HTMLElement>('.admin-editor').dataset.mode = tab.dataset.tab;
      for (const t of document.querySelectorAll('[data-tab]')) t.setAttribute('aria-selected', String(t === tab));
    });
  }
  $<HTMLInputElement>('[data-upload-cover]').addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const url = await upload(file);
    if (!url) return;
    field('cover_image_url').value = url;
    form().dispatchEvent(new Event('input', { bubbles: true }));
  });
  $<HTMLInputElement>('[data-upload-inline]').addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    await insertImages(files);
  });
  const content = field<HTMLTextAreaElement>('content');
  content.addEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith('image/'));
    if (files.length) {
      event.preventDefault();
      void insertImages(files);
    }
  });
  content.addEventListener('dragover', (event) => event.preventDefault());
  content.addEventListener('drop', (event) => {
    const files = [...(event.dataTransfer?.files ?? [])].filter((file) => file.type.startsWith('image/'));
    if (files.length) {
      event.preventDefault();
      void insertImages(files);
    }
  });
  addEventListener('beforeunload', (event) => {
    if (dirty) event.preventDefault();
  });
}

let previewTimer: number | undefined;
function renderPreviewSoon() {
  clearTimeout(previewTimer);
  previewTimer = window.setTimeout(renderPreview, 120);
}

function renderPreview() {
  const draft = read();
  const header = $<HTMLElement>('[data-preview-header]');
  header.replaceChildren();
  const meta = document.createElement('p');
  meta.className = 'blog-meta';
  const date = post?.published_at ?? new Date().toISOString();
  meta.textContent = `${formatPostDate(date)} · ${readingMinutes(draft.content)} min read`;
  const h1 = document.createElement('h1');
  h1.textContent = draft.title || 'Untitled';
  header.append(meta, h1);
  if (draft.excerpt) {
    const p = document.createElement('p');
    p.className = 'excerpt';
    p.textContent = draft.excerpt;
    header.append(p);
  }
  if (draft.tags.length) {
    const ul = document.createElement('ul');
    ul.className = 'tags';
    for (const tag of draft.tags) {
      const li = document.createElement('li');
      li.textContent = tag;
      ul.append(li);
    }
    header.append(ul);
  }
  const cover = draft.cover_image_url ? `<img class="post-cover" src="${encodeURI(draft.cover_image_url)}" alt="">` : '';
  $<HTMLElement>('[data-preview]').innerHTML = cover + renderMarkdown(draft.content);
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  // Published posts are live, so their edits wait for an explicit Save.
  if (post?.status === 'published') return;
  autosaveTimer = window.setTimeout(() => {
    const draft = read();
    if (draft.title && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug) && !RESERVED_SLUGS.includes(draft.slug)) void save('Draft autosaved');
  }, AUTOSAVE_MS);
}

async function save(doneText = 'Saved', extra: Partial<Post> = {}): Promise<boolean> {
  clearTimeout(autosaveTimer);
  if (saving) await saving;
  const draft = read();
  if (!draft.title) {
    setStatus('Add a title before saving.');
    return false;
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug)) {
    setStatus('The slug can only use lowercase letters, numbers and single hyphens.');
    return false;
  }
  if (RESERVED_SLUGS.includes(draft.slug)) {
    setStatus(`“${draft.slug}” is used by the blog itself; pick another slug.`);
    return false;
  }
  setStatus('Saving…');
  const savedVersion = editVersion;
  let ok = false;
  saving = (async () => {
    const values = { ...draft, ...extra };
    const query = post
      ? supabase().from('posts').update(values).eq('id', post.id).select('*').single()
      : supabase().from('posts').insert({ status: 'draft', ...values }).select('*').single();
    const { data, error } = await query;
    if (error) {
      setStatus(error.code === '23505' ? 'Another post already uses that slug.' : `Save failed: ${error.message}`);
      return;
    }
    const isNew = !post;
    post = data as Post;
    if (isNew) history.replaceState(null, '', adminUrl(`edit?id=${post.id}`));
    // Edits typed while the request was in flight are still unsaved.
    dirty = editVersion !== savedVersion;
    ok = true;
    setStatus(`${dirty ? 'Unsaved changes; last saved' : doneText} at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
    syncControls();
  })();
  await saving;
  saving = null;
  return ok;
}

async function togglePublish() {
  if (post?.status === 'published') {
    if (await save('Unpublished', { status: 'draft' })) renderPreview();
    return;
  }
  if (!confirm('Publish this post? It will be public on blog.veermickey.com.')) return;
  await save('Published', { status: 'published', published_at: post?.published_at ?? new Date().toISOString() });
}

async function remove() {
  if (!post || !confirm(`Delete “${post.title || 'Untitled'}”? This can’t be undone.`)) return;
  const { error } = await supabase().from('posts').delete().eq('id', post.id);
  if (error) {
    setStatus(`Delete failed: ${error.message}`);
    return;
  }
  dirty = false;
  location.replace(adminUrl());
}

function syncControls() {
  const published = post?.status === 'published';
  $<HTMLButtonElement>('[data-publish]').textContent = published ? 'Unpublish' : 'Publish';
  $<HTMLButtonElement>('[data-delete]').hidden = !post;
  const live = $<HTMLAnchorElement>('[data-view-live]');
  live.hidden = !published;
  if (post) live.href = `${base}/${post.slug}`;
  $<HTMLElement>('[data-meta]').textContent = post
    ? `${published ? 'Published' : 'Draft'} · created ${formatPostDate(post.created_at)} · updated ${formatPostDate(post.updated_at)}`
    : 'New draft. It autosaves once it has a title.';
}

async function upload(file: File): Promise<string | null> {
  const now = new Date();
  const name = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '') || 'image';
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}-${name}`;
  setStatus(`Uploading ${file.name}…`);
  const { error } = await supabase().storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) {
    setStatus(`Upload failed: ${error.message}`);
    return null;
  }
  setStatus(`Uploaded ${file.name}`);
  return supabase().storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function insertImages(files: File[]) {
  const content = field<HTMLTextAreaElement>('content');
  for (const file of files) {
    const url = await upload(file);
    if (!url) return;
    const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    const snippet = `![${alt}](${url})\n`;
    const { selectionStart: start, selectionEnd: end, value } = content;
    const before = value.slice(0, start);
    const text = (before && !before.endsWith('\n') ? '\n' : '') + snippet;
    content.value = before + text + value.slice(end);
    content.selectionStart = content.selectionEnd = start + text.length;
  }
  content.focus();
  form().dispatchEvent(new Event('input', { bubbles: true }));
}
