# ButteryPaws.github.io

My personal site — technical blogs and CTF write-ups. Built with
[Astro](https://astro.build) and deployed to GitHub Pages.

Live at **https://butterypaws.github.io**.

---

## Stack

- **Astro 5** — static site generator, content collections, Markdown.
- **Shiki** — build-time syntax highlighting for code blocks.
- Custom terminal/phosphor theme (no CSS framework), all in
  `src/styles/global.css`.
- Deployed via **GitHub Actions** (`.github/workflows/deploy.yml`) — no manual
  build step; every push to `master` publishes.

## Local development

Requires Node 24 and pnpm.

```bash
pnpm install     # install dependencies
pnpm dev         # start dev server at http://localhost:4321
pnpm build       # build the production site into dist/
pnpm preview     # serve the built site locally
```

## Writing a post

Posts are Markdown files. **The filename becomes the URL slug.**

- **Blog post** → `src/content/blog/my-post.md` → `/blog/my-post`
- **CTF write-up** → `src/content/ctf/my-writeup.md` → `/ctf/my-writeup`

### Blog frontmatter

```yaml
---
title: 'Post title'
description: 'One line shown in listings, search results, and the RSS feed.'
date: 2026-07-07
updated: 2026-07-08   # optional
tags: ['tag-one', 'tag-two']
draft: false          # true hides it from the build
---
```

### CTF frontmatter

Everything above, plus optional challenge metadata rendered in a card:

```yaml
---
title: 'challenge-name — one-line hook'
description: 'What the challenge was and how you solved it.'
date: 2026-07-07
event: 'picoCTF 2026'
category: 'pwn'                 # pwn | web | crypto | rev | forensics | misc
difficulty: 'easy'             # easy | medium | hard | insane
points: 100
tags: ['pwn', 'ret2win']
flag: 'flag{...}'              # shown in a click-to-reveal spoiler
---
```

The schemas are enforced at build time — see `src/content.config.ts`.

## Personalizing

Most user-facing text lives in **`src/consts.ts`**:

- `SITE` — title, your name, the `user@host` shown in the terminal UI, the
  tagline/description.
- `SOCIALS` — your GitHub/Twitter/email links (uncomment and edit).
- `NAV` — the top navigation items.

Also worth editing:

- `src/pages/about.astro` — your bio.
- `src/pages/index.astro` — the `whoami` intro text on the landing page.
- Theme colors — the CSS custom properties at the top of
  `src/styles/global.css`.

## Deployment

The site auto-deploys on every push to `master`. **One-time setup** in the
GitHub repo:

> Settings → Pages → Build and deployment → **Source: GitHub Actions**

After that, push and watch the **Actions** tab. The workflow builds with pnpm
and publishes `dist/` to Pages.
