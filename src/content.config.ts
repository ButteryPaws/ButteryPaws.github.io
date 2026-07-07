import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Two collections, one shared design system:
 *   - `blog` — general technical posts
 *   - `ctf`  — CTF challenge write-ups (richer metadata: event, category, flag…)
 *
 * Add a post by dropping a Markdown file into src/content/<collection>/.
 * The filename (minus extension) becomes the URL slug.
 */

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const ctf = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/ctf' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Name of the CTF, e.g. "picoCTF 2025". */
    event: z.string().optional(),
    /** Challenge category: pwn | web | crypto | rev | forensics | misc … */
    category: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'insane']).optional(),
    points: z.number().optional(),
    /** The captured flag — rendered in a spoiler block, not inline. */
    flag: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, ctf };
