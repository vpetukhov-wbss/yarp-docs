const CJK_CHAR = /[一-鿿]/;
const CJK_OR_OTHER_RUN = /[一-鿿]+|[^一-鿿]+/g;
const WORD_SPLIT = /[\s\p{P}]+/u;

// MiniSearch's default tokenizer splits on whitespace/punctuation, which
// doesn't work for CJK text - Chinese has no spaces between words, so an
// entire run would index as one giant, unsearchable "word". Runs of CJK
// characters are bigrammed instead (overlapping 2-character windows), the
// standard fallback substring-matching technique when no real CJK word
// segmenter is available; runs of everything else still split on
// whitespace/punctuation as normal. Passed as MiniSearch's `tokenize`
// option, which applies to both indexing and querying by default, so a
// two-character CJK query bigrams down to the same single token produced
// for that pair at index time.
export function cjkAwareTokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const run of text.match(CJK_OR_OTHER_RUN) ?? []) {
    if (CJK_CHAR.test(run)) {
      if (run.length === 1) {
        tokens.push(run);
      } else {
        for (let i = 0; i < run.length - 1; i++) {
          tokens.push(run.slice(i, i + 2));
        }
      }
    } else {
      tokens.push(...run.split(WORD_SPLIT).filter(Boolean));
    }
  }
  return tokens;
}
