export const BLOG_HOST = 'blog.veermickey.com';
export const BLOG_ORIGIN = `https://${BLOG_HOST}`;
export const BLOG_TITLE = 'Blog | Veer Shah';
export const BLOG_DESCRIPTION = 'Posts by Veer Shah.';
export const ADMIN_EMAIL = 'veermickey@gmail.com';
export const IMAGE_BUCKET = 'post-images';

/** On blog.veermickey.com pages live at the root; on any other host (local dev, previews) under /blog. */
export const blogBase = (hostname: string) => (hostname === BLOG_HOST ? '' : '/blog');

/** Paths the blog itself uses; posts can't take these slugs (also enforced in SQL). */
export const RESERVED_SLUGS = ['admin', 'blog', 'tags'];
