// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// This is a GitHub Pages *user* site (butterypaws.github.io), so it is served
// from the domain root. `site` is used for canonical URLs, RSS, and sitemap.
export default defineConfig({
  site: 'https://butterypaws.github.io',
  base: '/',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    // Shiki powers code-block syntax highlighting. `github-dark` blends nicely
    // with the terminal palette; tweak in one place here if you change themes.
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
