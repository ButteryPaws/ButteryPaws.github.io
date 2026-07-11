import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';

/**
 * Render short Markdown strings that live in frontmatter (e.g. a CTF `problem`
 * prompt or a `hint`) to HTML, using Astro's own Markdown engine so the output
 * matches the rest of the site. `remark-breaks` keeps a single newline as a
 * line break, so a pasted challenge prompt keeps its original shape while still
 * supporting links, bold, inline code, etc.
 *
 * The processor is created once and reused across every render in the build.
 */
let processorPromise: ReturnType<typeof createMarkdownProcessor> | null = null;

function getProcessor() {
  return (processorPromise ??= createMarkdownProcessor({
    remarkPlugins: [remarkBreaks],
  }));
}

export async function renderMarkdown(md: string): Promise<string> {
  const processor = await getProcessor();
  const { code } = await processor.render(md);
  return code;
}
