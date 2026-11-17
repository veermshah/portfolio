import { supabase, supabaseConfigured } from './supabase';

export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const LIST_COLUMNS = 'id,title,slug,excerpt,content,cover_image_url,tags,status,published_at,created_at,updated_at';

/** Published posts, newest first. RLS hides drafts from anonymous callers. */
export async function publishedPosts(tag?: string): Promise<Post[]> {
  if (!supabaseConfigured) return [];
  let query = supabase()
    .from('posts')
    .select(LIST_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (tag) query = query.contains('tags', [tag]);
  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

export async function publishedPost(slug: string): Promise<Post | null> {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase()
    .from('posts')
    .select(LIST_COLUMNS)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as Post | null;
}
