/**
 * Site-wide constants. Edit these to make the site yours — most user-facing
 * text (name, handles, taglines, nav) is centralized here.
 */

export const SITE = {
  /** Shown in <title>, headers, and the RSS feed. */
  title: 'ButteryPaws',
  /** The shell "user@host" used throughout the terminal UI. */
  user: 'visitor',
  host: 'butterypaws',
  /** Default meta description / RSS description. */
  description:
    'Technical blogs and CTF write-ups on security, systems, and whatever I break next.',
  /** Your display name for the About page / footer. */
  author: 'ButteryPaws',
  /** Canonical origin — keep in sync with `site` in astro.config.mjs. */
  url: 'https://butterypaws.github.io',
  /** Default social/OG image (relative to /public). Optional. */
  ogImage: '/og-default.svg',
} as const;

/** External links rendered in the header/footer and About page. */
export const SOCIALS: { label: string; href: string }[] = [
  { label: 'github', href: 'https://github.com/ButteryPaws' },
  // { label: 'twitter', href: 'https://twitter.com/yourhandle' },
  // { label: 'mastodon', href: 'https://infosec.exchange/@yourhandle' },
  // { label: 'email', href: 'mailto:you@example.com' },
];

/** Primary navigation. `cmd` is the terminal-style label. */
export const NAV: { label: string; href: string }[] = [
  { label: 'home', href: '/' },
  { label: 'blog', href: '/blog' },
  { label: 'ctf', href: '/ctf' },
  { label: 'tags', href: '/tags' },
  { label: 'about', href: '/about' },
];
