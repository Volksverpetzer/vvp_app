/**
 * Minimal inline-markdown tokenizer for short UI copy (e.g. announcement
 * cards). Supports **bold**, *italic*, and [text](url) links only — no block
 * elements (headings, lists, blockquotes) and no nesting (a token is bold *or*
 * italic *or* a link, never a combination). Anything that doesn't match is
 * emitted verbatim as text, so plain strings round-trip unchanged.
 */
export type InlineToken =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "link"; content: string; url: string };

// Order matters: **bold** is tried before *italic* so a `**` boundary isn't
// mis-read as an empty italic span.
const INLINE_PATTERN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|\*(.+?)\*/g;

export const parseInlineMarkdown = (input: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        content: input.slice(lastIndex, match.index),
      });
    }

    const [, bold, linkText, linkUrl, italic] = match;
    if (bold !== undefined) {
      tokens.push({ type: "bold", content: bold });
    } else if (linkText !== undefined && linkUrl !== undefined) {
      tokens.push({ type: "link", content: linkText, url: linkUrl });
    } else if (italic !== undefined) {
      tokens.push({ type: "italic", content: italic });
    }

    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < input.length) {
    tokens.push({ type: "text", content: input.slice(lastIndex) });
  }

  return tokens;
};
