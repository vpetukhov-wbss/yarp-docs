import { escapeHtml, highlightCode, stripTags } from './highlight.mjs';

describe('highlightCode', () => {
  const SAMPLES = {
    csharp: 'var builder = WebApplication.CreateBuilder(args);\n// a comment\nbuilder.Services.AddReverseProxy();',
    json: '{\n  "ReverseProxy": {\n    "Routes": { "route1": { "ClusterId": "cluster1" } }\n  }\n}',
    markup: '<Project Sdk="Microsoft.NET.Sdk.Web">\n  <PropertyGroup>\n    <TargetFramework>net8.0</TargetFramework>\n  </PropertyGroup>\n</Project>',
    bash: 'dotnet run --urls https://localhost:5001',
    powershell: '$env:ASPNETCORE_ENVIRONMENT = "Development"',
    yaml: 'ReverseProxy:\n  Routes:\n    route1:\n      ClusterId: cluster1',
  };

  it.each(Object.entries(SAMPLES))('round-trips %s exactly (stripTags(highlight(code)) === escapeHtml(code))', (lang, code) => {
    const html = highlightCode(code, lang);
    expect(stripTags(html)).toBe(escapeHtml(code));
  });

  it('preserves newlines and indentation byte-for-byte', () => {
    const code = 'if (x) {\n    return 1;\n}\n';
    const html = highlightCode(code, 'csharp');
    expect(stripTags(html)).toBe(code);
  });

  it('wraps a JSON property key in tok-prop and a string value in tok-str', () => {
    // Quotes are literal here, not &quot; - this text lands inside <code>
    // element content, not an HTML attribute, so only &/</> need escaping.
    const html = highlightCode('{"Address": "https://example.com/"}', 'json');
    expect(html).toContain('<span class="tok-prop">"Address"</span>');
    expect(html).toContain('<span class="tok-str">"https://example.com/"</span>');
  });

  it('escapes plain text with no highlighting for an unknown/null grammar key', () => {
    const html = highlightCode('plain <output> text & stuff', null);
    expect(html).toBe('plain &lt;output&gt; text &amp; stuff');
  });

  it('escapes HTML-significant characters', () => {
    expect(escapeHtml('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
  });
});
