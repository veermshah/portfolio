-- Blog schema for blog.veermickey.com. Only the anon key is used by the site;
-- Row Level Security below decides what each caller can see or change.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- These paths are already used by the blog's own pages.
  constraint posts_slug_not_reserved check (slug not in ('admin', 'blog', 'tags')),
  excerpt text not null default '',
  content text not null default '',
  cover_image_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_posts_have_date check (status = 'draft' or published_at is not null)
);

create index posts_published_idx on public.posts (published_at desc) where status = 'published';
create index posts_tags_idx on public.posts using gin (tags);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_set_updated_at before update on public.posts
for each row execute function public.set_updated_at();

-- The one account allowed to write. Sign-ups are disabled, so this account
-- can only exist because it was created from the Supabase dashboard/admin API.
create function public.is_blog_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'veermickey@gmail.com'
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

alter table public.posts enable row level security;

create policy "Published posts are public" on public.posts
  for select to anon, authenticated
  using (status = 'published');

create policy "Admin reads every post" on public.posts
  for select to authenticated using ((select public.is_blog_admin()));
create policy "Admin creates posts" on public.posts
  for insert to authenticated with check ((select public.is_blog_admin()));
create policy "Admin edits posts" on public.posts
  for update to authenticated
  using ((select public.is_blog_admin())) with check ((select public.is_blog_admin()));
create policy "Admin deletes posts" on public.posts
  for delete to authenticated using ((select public.is_blog_admin()));

-- Images used in posts. Public bucket so <img> tags work without signed URLs;
-- only the admin can upload, replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 10485760,
        array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']);

create policy "Admin uploads post images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (select public.is_blog_admin()));
create policy "Admin updates post images" on storage.objects
  for update to authenticated
  using (bucket_id = 'post-images' and (select public.is_blog_admin()))
  with check (bucket_id = 'post-images' and (select public.is_blog_admin()));
create policy "Admin deletes post images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (select public.is_blog_admin()));
