// Prism, used only for its tokenizer (Prism.tokenize), never Prism.highlight
// - that method emits its own `class="token keyword"` markup, which would
// need post-processing to become this app's tok-* classes. Walking the
// token tree ourselves is more code but gives an exact, testable mapping.
import Prism from 'prismjs';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-markup.js'; // XML
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-powershell.js';
import 'prismjs/components/prism-yaml.js';

// Keyed by the same Prism grammar key used in markdown.mjs's fence-language
// table - not by the fence info string directly, so the two concerns
// (which languages exist, and what to call them in a fence) stay separate.
const GRAMMARS = {
  csharp: () => Prism.languages.csharp,
  json: () => Prism.languages.json,
  markup: () => Prism.languages.markup,
  bash: () => Prism.languages.bash,
  powershell: () => Prism.languages.powershell,
  yaml: () => Prism.languages.yaml,
};

// Every Prism token type actually produced by the six grammars above,
// mapped onto the app's existing seven hand-authored --tok-* classes
// (doc-body's CSS, ported from the mockup). Anything not listed renders
// with no span at all, which is the same as tok-punc visually (both
// inherit --ink-soft) but avoids implying a token category that doesn't
// exist.
const TOKEN_CLASS_MAP = {
  keyword: 'tok-kw',
  boolean: 'tok-kw',
  null: 'tok-kw',
  important: 'tok-kw', // Bash/YAML control words to Prism, e.g. "return", "!!"
  builtin: 'tok-type',
  'class-name': 'tok-type',
  function: 'tok-type',
  namespace: 'tok-type',
  'function-variable': 'tok-type',
  string: 'tok-str',
  char: 'tok-str',
  'attr-value': 'tok-str',
  'template-string': 'tok-str',
  'interpolation-string': 'tok-str',
  comment: 'tok-com',
  'doc-comment': 'tok-com',
  prolog: 'tok-com',
  cdata: 'tok-com',
  property: 'tok-prop',
  'property-access': 'tok-prop',
  'attr-name': 'tok-prop',
  tag: 'tok-prop',
  punctuation: 'tok-punc',
  operator: 'tok-punc',
  number: 'tok-num',
};

export function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Strips every tag, leaving only (already-escaped) text content
// concatenated in source order - used by the round-trip invariant test:
// stripTags(highlightCode(code, x)) must equal escapeHtml(code) for any
// code and any grammar, since Prism's tokenizer is content-preserving
// (concatenating every token's content recovers the input exactly) and
// this module escapes every text node it emits, matched or not.
export function stripTags(html) {
  return html.replace(/<[^>]*>/g, '');
}

function renderToken(token) {
  if (typeof token === 'string') {
    return escapeHtml(token);
  }
  const content = token.content;
  const inner = Array.isArray(content)
    ? content.map(renderToken).join('')
    : typeof content === 'string'
      ? escapeHtml(content)
      : renderToken(content); // a handful of grammars nest a single child token object directly
  const cls = TOKEN_CLASS_MAP[token.type];
  return cls ? `<span class="${cls}">${inner}</span>` : inner;
}

// grammarKey is one of this module's own GRAMMARS keys (csharp/json/markup/
// bash/powershell/yaml), or null/unknown - in which case the code is
// escaped and returned with no highlighting at all, which is also the
// correct behavior for `output`/`console` fences (real program output,
// nothing to tokenize).
export function highlightCode(code, grammarKey) {
  const grammarFn = grammarKey ? GRAMMARS[grammarKey] : null;
  if (!grammarFn) {
    return escapeHtml(code);
  }
  const tokens = Prism.tokenize(code, grammarFn());
  return tokens.map(renderToken).join('');
}
