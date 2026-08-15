import { splitTemplate } from './split-template';

describe('splitTemplate', () => {
  it('returns a single text segment for a template with no tokens', () => {
    expect(splitTemplate('Search documentation')).toEqual([{ kind: 'text', value: 'Search documentation' }]);
  });

  it('splits leading text, a token, and trailing text', () => {
    expect(splitTemplate('Hello {{name}}!')).toEqual([
      { kind: 'text', value: 'Hello ' },
      { kind: 'token', name: 'name' },
      { kind: 'text', value: '!' },
    ]);
  });

  it('handles two tokens with text between and around them, matching article.attribution', () => {
    expect(splitTemplate('Adapted from {{learnLink}}, licensed under {{ccByLink}}.')).toEqual([
      { kind: 'text', value: 'Adapted from ' },
      { kind: 'token', name: 'learnLink' },
      { kind: 'text', value: ', licensed under ' },
      { kind: 'token', name: 'ccByLink' },
      { kind: 'text', value: '.' },
    ]);
  });

  it('handles a template that starts and ends with a token, with no surrounding text', () => {
    expect(splitTemplate('{{a}}{{b}}')).toEqual([
      { kind: 'token', name: 'a' },
      { kind: 'token', name: 'b' },
    ]);
  });

  it('supports reordering and Chinese full-width punctuation, matching the zh-Hans translation', () => {
    expect(splitTemplate('改编自 {{learnLink}}，遵循 {{ccByLink}} 许可协议。')).toEqual([
      { kind: 'text', value: '改编自 ' },
      { kind: 'token', name: 'learnLink' },
      { kind: 'text', value: '，遵循 ' },
      { kind: 'token', name: 'ccByLink' },
      { kind: 'text', value: ' 许可协议。' },
    ]);
  });

  it('ignores whitespace inside the braces', () => {
    expect(splitTemplate('{{ name }}')).toEqual([{ kind: 'token', name: 'name' }]);
  });

  it('returns an empty array for an empty string', () => {
    expect(splitTemplate('')).toEqual([]);
  });
});
