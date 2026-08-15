// Splits a translated string containing {{token}} placeholders into an
// ordered list of plain-text and token segments, so a template can render
// each token as a real Angular-bound element (an <a> with its own [href],
// here) instead of the translation JSON carrying raw HTML through
// [innerHTML] - the surrounding prose, punctuation, and even token order
// are entirely the translator's call; only the token names themselves are
// fixed contract between article.attribution and doc-article.html.
export interface TemplateTextSegment {
  readonly kind: 'text';
  readonly value: string;
}

export interface TemplateTokenSegment {
  readonly kind: 'token';
  readonly name: string;
}

export type TemplateSegment = TemplateTextSegment | TemplateTokenSegment;

const TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;

export function splitTemplate(template: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ kind: 'text', value: template.slice(lastIndex, index) });
    }
    segments.push({ kind: 'token', name: match[1] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < template.length) {
    segments.push({ kind: 'text', value: template.slice(lastIndex) });
  }

  return segments;
}
