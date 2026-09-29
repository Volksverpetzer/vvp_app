/**
 * Strips every `<style>...</style>` block from a raw WordPress `content`
 * HTML string, before it reaches the HTML renderer.
 *
 * Non-greedy (`.*?`) and global (`g`): an article with more than one
 * `<style>` block (seen on richer, component-heavy layouts) would otherwise
 * match from the FIRST `<style>` to the LAST `</style>` in the whole
 * document with a greedy, non-global pattern — deleting the entire article
 * body between the two blocks, not just the style blocks themselves.
 * @param html - Raw article content HTML.
 * @returns `html` with every `<style>...</style>` block removed.
 */
export const stripStyleBlocks = (html: string): string =>
  html.replaceAll(/<style>.*?<\/style>/gs, "");
