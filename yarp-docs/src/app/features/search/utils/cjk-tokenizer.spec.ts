import { cjkAwareTokenize } from './cjk-tokenizer';

describe('cjkAwareTokenize', () => {
  it('splits Latin text on whitespace and punctuation like a normal tokenizer', () => {
    expect(cjkAwareTokenize('Load balancing, and routing!')).toEqual([
      'Load',
      'balancing',
      'and',
      'routing',
    ]);
  });

  it('bigrams a run of CJK characters instead of treating it as one unsearchable word', () => {
    expect(cjkAwareTokenize('反向代理')).toEqual(['反向', '向代', '代理']);
  });

  it('keeps a lone CJK character as its own token instead of producing zero tokens', () => {
    expect(cjkAwareTokenize('代')).toEqual(['代']);
  });

  it('tokenizes mixed Latin and CJK text by run, not as one blended token', () => {
    expect(cjkAwareTokenize('YARP 文档索引')).toEqual(['YARP', '文档', '档索', '索引']);
  });

  it('produces a token set where a short query shares a bigram with a longer indexed phrase containing it', () => {
    // "反向代理服务器" (reverse proxy server) indexed; "代理" (proxy) queried -
    // this is the substring-matching property the bigram scheme exists for.
    const indexed = cjkAwareTokenize('反向代理服务器');
    const query = cjkAwareTokenize('代理');
    expect(query.every((token) => indexed.includes(token))).toBe(true);
  });
});
