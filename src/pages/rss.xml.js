import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

// Combined feed: blog posts + CTF write-ups, newest first.
export async function GET(context) {
  const notDraft = ({ data }) => !data.draft;
  const blog = await getCollection('blog', notDraft);
  const ctf = await getCollection('ctf', notDraft);

  const items = [
    ...blog.map((p) => ({ ...p, _section: 'blog' })),
    ...ctf.map((p) => ({ ...p, _section: 'ctf' })),
  ]
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: `/${post._section}/${post.id}/`,
    }));

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items,
  });
}
