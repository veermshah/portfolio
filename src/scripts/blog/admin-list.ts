import { supabase, supabaseConfigured } from '../../lib/blog/supabase';
import { ADMIN_EMAIL } from '../../lib/blog/config';
import type { Post } from '../../lib/blog/posts';
import { formatPostDate } from '../../lib/blog/text';
import { adminSession, adminUrl, base } from './auth';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;

export async function initAdminList() {
  const gate = $<HTMLElement>('[data-gate]');
  if (!supabaseConfigured) {
    gate.textContent = 'Supabase is not configured for this deployment.';
    return;
  }
  $<HTMLAnchorElement>('[data-new]').href = adminUrl('edit');
  $('[data-signout]').addEventListener('click', async () => {
    await supabase().auth.signOut();
    location.reload();
  });
  $<HTMLFormElement>('[data-login]').addEventListener('submit', signIn);

  const session = await adminSession();
  gate.hidden = true;
  if (!session) {
    $<HTMLElement>('[data-view="login"]').hidden = false;
    return;
  }
  $<HTMLElement>('[data-view="posts"]').hidden = false;
  await loadPosts();
}

async function signIn(event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const status = $<HTMLElement>('[data-login-status]');
  const email = String(new FormData(form).get('email')).trim().toLowerCase();
  const password = String(new FormData(form).get('password'));
  if (email !== ADMIN_EMAIL) {
    status.textContent = 'This account cannot sign in here.';
    return;
  }
  status.textContent = 'Signing in…';
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) {
    status.textContent = error.message;
    return;
  }
  location.reload();
}

async function loadPosts() {
  const status = $<HTMLElement>('[data-list-status]');
  const list = $<HTMLOListElement>('[data-list]');
  const { data, error } = await supabase()
    .from('posts')
    .select('id,title,slug,status,published_at,updated_at')
    .order('updated_at', { ascending: false });
  if (error) {
    status.textContent = `Couldn’t load posts: ${error.message}`;
    return;
  }
  const posts = data as Pick<Post, 'id' | 'title' | 'slug' | 'status' | 'published_at' | 'updated_at'>[];
  $<HTMLElement>('[data-empty]').hidden = posts.length > 0;
  list.replaceChildren(
    ...posts.map((post) => {
      const li = document.createElement('li');
      const meta = document.createElement('p');
      meta.className = 'blog-meta';
      const badge = document.createElement('span');
      badge.className = post.status === 'published' ? 'award' : 'admin-draft';
      badge.textContent = post.status === 'published' ? 'Published' : 'Draft';
      const when = post.status === 'published' && post.published_at
        ? `Published ${formatPostDate(post.published_at)}`
        : `Updated ${formatPostDate(post.updated_at)}`;
      meta.append(badge, ` ${when} · /${post.slug}`);
      const h2 = document.createElement('h2');
      const a = document.createElement('a');
      a.href = adminUrl(`edit?id=${post.id}`);
      a.textContent = post.title || 'Untitled';
      h2.append(a);
      li.append(meta, h2);
      if (post.status === 'published') {
        const live = document.createElement('a');
        live.href = `${base}/${post.slug}`;
        live.textContent = 'View live';
        live.className = 'admin-live';
        li.append(live);
      }
      return li;
    }),
  );
}
