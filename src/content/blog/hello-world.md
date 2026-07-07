---
title: 'Hello, world — and how this site is built'
description: 'A quick tour of the stack behind this site and how to add a new post.'
date: 2026-07-07
tags: ['meta', 'astro']
draft: false
---

Welcome. This is a placeholder post so the site has something to show — feel
free to delete it once you've written something real.

## How posts work

Every post is a Markdown file. Blog posts live in `src/content/blog/` and CTF
write-ups live in `src/content/ctf/`. The **filename becomes the URL**, so
`hello-world.md` is served at `/blog/hello-world`.

Each file starts with a small block of frontmatter between `---` fences:

```yaml
---
title: 'Your title'
description: 'One line shown in listings and search results.'
date: 2026-07-07
tags: ['tag-one', 'tag-two']
draft: false      # set true to hide it from the build
---
```

## What you get for free

- **Syntax highlighting** on code blocks, via Shiki:

  ```python
  def fibonacci(n: int) -> int:
      a, b = 0, 1
      for _ in range(n):
          a, b = b, a + b
      return a
  ```

- **Tables, quotes, and lists** styled to match the terminal theme:

  > Any sufficiently advanced bug is indistinguishable from a feature.

- **Tags** that automatically build browsable index pages at `/tags`.
- A combined **RSS feed** at `/rss.xml`.

## Adding your next post

1. Create `src/content/blog/my-post.md`.
2. Fill in the frontmatter above.
3. Write Markdown below it.
4. Commit and push — GitHub Actions builds and deploys automatically.

That's it. Happy writing.
