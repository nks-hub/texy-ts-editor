import { describe, it, expect, vi, afterEach } from 'vitest';
import { escapeHtml, isSafeUrl, sanitizeUrl } from '../src/utils/escapeHtml';
import { bbcodePlugin } from '../src/parser/plugins/bbcode';
import { imageEmbedPlugin } from '../src/parser/plugins/image-embed';
import { TexyParser } from '../src/parser/TexyParser';
import { TexyEditor } from '../src/core/TexyEditor';

const URL_ATTRS = ['href', 'src', 'xlink:href', 'action', 'formaction'];
const SCRIPT_SCHEMES = ['javascript:', 'data:', 'vbscript:'];

/** Scheme as a browser resolves it (WHATWG URL parser), independent of the code under test. */
function scheme(url: string): string {
  try {
    return new URL(url, 'https://example.com/').protocol;
  } catch {
    return '';
  }
}

/** Everything in `html` that could run script once it lands in innerHTML. */
function dangers(html: string): string[] {
  const root = document.createElement('div');
  root.innerHTML = html;
  const found: string[] = [];
  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (['script', 'noscript', 'svg', 'math'].includes(el.localName)) found.push(`<${el.localName}>`);
    for (const { name, value } of Array.from(el.attributes)) {
      if (name.startsWith('on') || name === 'srcdoc') found.push(`${el.localName}[${name}]`);
      if (URL_ATTRS.includes(name) && SCRIPT_SCHEMES.includes(scheme(value))) found.push(`${el.localName}[${name}=${value}]`);
    }
  }
  return found;
}

function elapsedMs(fn: () => unknown): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

// ── escapeHtml ──────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('" onclick="alert(1)"')).toBe('&quot; onclick=&quot;alert(1)&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("' onmouseover='alert(1)'")).toBe("&#039; onmouseover=&#039;alert(1)&#039;");
  });

  it('escapes all special chars together', () => {
    expect(escapeHtml('<img src="x" onerror=\'alert(1)\'&>')).toContain('&lt;');
    expect(escapeHtml('<img src="x" onerror=\'alert(1)\'&>')).toContain('&#039;');
  });

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// ── isSafeUrl ───────────────────────────────────────────────

describe('isSafeUrl', () => {
  it('allows http URLs', () => {
    expect(isSafeUrl('http://example.com')).toBe(true);
  });

  it('allows https URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
  });

  it('allows mailto URLs', () => {
    expect(isSafeUrl('mailto:user@example.com')).toBe(true);
  });

  it('allows relative URLs', () => {
    expect(isSafeUrl('/path/to/page')).toBe(true);
  });

  it('allows anchor-only URLs', () => {
    expect(isSafeUrl('#section')).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects JavaScript: (case-insensitive)', () => {
    expect(isSafeUrl('JavaScript:alert(1)')).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects vbscript: URLs', () => {
    expect(isSafeUrl('vbscript:MsgBox("XSS")')).toBe(false);
  });

  it('handles whitespace-padded javascript:', () => {
    expect(isSafeUrl('  javascript:alert(1)')).toBe(false);
  });

  it.each([
    'JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'java\rscript:alert(1)',
    '\u0001javascript:alert(1)',
    '\u0000 \u001fjavascript:alert(1)',
    '\t\r\n vbscript:msgbox(1)',
    'DATA:text/html,<script>alert(1)</script>',
  ])('rejects %j, which a browser still runs as a script URL', (url) => {
    expect(SCRIPT_SCHEMES).toContain(scheme(url));
    expect(isSafeUrl(url)).toBe(false);
  });

  it('allows tel: and ftp: as before', () => {
    expect(isSafeUrl('tel:+420123456789')).toBe(true);
    expect(isSafeUrl('ftp://example.com/file')).toBe(true);
  });
});

// ── sanitizeUrl ─────────────────────────────────────────────

describe('sanitizeUrl', () => {
  it('returns escaped URL for safe URLs', () => {
    expect(sanitizeUrl('https://example.com/a&b')).toBe('https://example.com/a&amp;b');
  });

  it('returns empty string for javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });
});

// ── BBCode plugin XSS prevention ────────────────────────────

describe('BBCode plugin XSS prevention', () => {
  const plugin = bbcodePlugin();
  const placeholder = (html: string) => html;

  it('escapes javascript: in [url]', () => {
    const result = plugin.processInline!('[url=javascript:alert(1)]click[/url]', placeholder);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('href=""');
  });

  it('escapes attribute breakout in [url]', () => {
    const result = plugin.processInline!('[url=" onmouseover="alert(1)]text[/url]', placeholder);
    // Quotes are escaped, preventing attribute breakout
    expect(result).toContain('&quot;');
    expect(result).not.toContain('href="" onmouseover=');
  });

  it('escapes content in [url]', () => {
    const result = plugin.processInline!('[url=https://ok.com]<img src=x onerror=alert(1)>[/url]', placeholder);
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('strips dangerous chars from [color]', () => {
    const result = plugin.processInline!('[color=red" onclick="alert(1)]text[/color]', placeholder);
    // Quotes and parens are stripped from color value
    expect(result).not.toContain('onclick="alert');
    expect(result).toContain('style="color:');
  });

  it('escapes content in [color]', () => {
    const result = plugin.processInline!('[color=blue]<script>alert(1)</script>[/color]', placeholder);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

// ── Image embed plugin XSS prevention ───────────────────────

describe('Image embed plugin XSS prevention', () => {
  const plugin = imageEmbedPlugin();
  const placeholder = (html: string) => html;

  it('sanitizes javascript: in image URL', () => {
    const result = plugin.processInline!('{{imglink:javascript:alert(1)|https://ok.com}}', placeholder);
    expect(result).not.toContain('javascript:');
  });

  it('escapes alt text with HTML', () => {
    const result = plugin.processInline!('{{imglink:https://ok.com/img.jpg|alt:" onload="alert(1)|https://ok.com}}', placeholder);
    // Quotes in alt are escaped, preventing attribute breakout
    expect(result).toContain('&quot;');
    expect(result).not.toContain('alt="" onload=');
  });
});

// ── BBCode content escaping ─────────────────────────────────

describe('BBCode plugin escapes tag content', () => {
  const plugin = bbcodePlugin();
  const placeholder = (html: string) => html;

  it.each(['b', 'i', 'u', 's'])('[%s] does not pass HTML through', (tag) => {
    const html = plugin.processInline!(`[${tag}]<img src=x onerror=alert(1)><script>alert(1)</script>[/${tag}]`, placeholder);
    expect(dangers(html)).toEqual([]);
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('keeps unclosed and empty-parameter tags as text', () => {
    expect(plugin.processInline!('[b]open [url=]x[/url] [color=red]y', placeholder)).toBe('[b]open [url=]x[/url] [color=red]y');
  });

  it('pairs each opening tag with the nearest closing tag', () => {
    expect(plugin.processInline!('[B]a[/b] [b]b[/B] [url=/x]c[/URL]', placeholder))
      .toBe('<strong>a</strong> <strong>b</strong> <a href="/x">c</a>');
  });
});

// ── TexyParser output ───────────────────────────────────────

describe('TexyParser output has no script URLs or raw HTML', () => {
  const parser = new TexyParser();

  it.each([
    '"click":javascript:alert(1)',
    '"click":JaVaScRiPt:alert(1)',
    '"click":\u0001javascript:alert(1)',
    '"click":&#106;avascript:alert(1)',
    '"click":&#x6A;avascript&#x3A;alert(1)',
    '"click":vbscript:msgbox(1)',
    '"click":data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    '"click":\tjavascript:alert(1)',
    '[* image.jpg *]:javascript:alert(1)',
    '[* image.jpg *]:JAVASCRIPT:alert(1) *** caption',
    "''<img src=x onerror=alert(1)>''",
    "''<script>alert(1)</script>''",
    "''<a href=\"javascript:alert(1)\">x</a>''",
  ])('%j', (source) => {
    expect(dangers(parser.parse(source))).toEqual([]);
  });

  it('drops the href of a link with a script URL but keeps its text', () => {
    expect(parser.parseInline('"click":javascript:alert(1)')).toBe('<a href="">click</a>');
  });

  it('keeps safe links', () => {
    expect(parser.parseInline('"a":https://example.com/x "b":/relative "c":mailto:a@example.com'))
      .toBe('<a href="https://example.com/x">a</a> <a href="/relative">b</a> <a href="mailto:a@example.com">c</a>');
  });

  it('shows noTexy content as text', () => {
    expect(parser.parseInline("''<b>x</b> & y''")).toBe('&lt;b&gt;x&lt;/b&gt; &amp; y');
  });
});

// ── Editor preview ──────────────────────────────────────────

describe('Editor preview sanitizes what it renders', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const payload = [
    '<p><a href="https://example.com/ok">ok</a> <a href="/relative">rel</a> <a href="mailto:a@example.com">mail</a></p>',
    '<a href="JaVaScRiPt:alert(1)">1</a>',
    '<a href="&#106;avascript:alert(1)">2</a>',
    '<a href="java&#x09;script:alert(1)">3</a>',
    '<a href="&#x01; javascript:alert(1)">4</a>',
    '<a href="data:text/html,<script>alert(1)</script>">5</a>',
    '<a href="vbscript:msgbox(1)">6</a>',
    '<img src="x" onerror="alert(1)">',
    '<iframe src="javascript:alert(1)//youtube.com/embed/x"></iframe>',
    '<iframe src="https://www.youtube.com/embed/abc" srcdoc="<script>alert(1)</script>"></iframe>',
    '<svg><a xlink:href="javascript:alert(1)"><text>7</text></a></svg>',
    '<math><mi xlink:href="javascript:alert(1)">8</mi></math>',
    '<form action="javascript:alert(1)"><button formaction="javascript:alert(1)">9</button></form>',
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript>',
    '<script>alert(1)</script>',
  ].join('\n');

  function editorWith(value: string, options = {}): { editor: TexyEditor; preview: Element } {
    const ta = document.createElement('textarea');
    ta.value = value;
    document.body.appendChild(ta);
    const editor = new TexyEditor(ta, { language: 'en', autoResize: false, livePreview: true, ...options });
    return { editor, preview: editor.getContainer().querySelector('.te-preview-content')! };
  }

  function assertSafe(html: string): void {
    expect(dangers(html)).toEqual([]);
    expect(html).toContain('href="https://example.com/ok"');
    expect(html).toContain('href="/relative"');
    expect(html).toContain('href="mailto:a@example.com"');
    expect(html).toContain('src="https://www.youtube.com/embed/abc"');
  }

  it('server preview HTML', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => payload })));
    const { editor, preview } = editorWith('anything', { previewPath: '/preview' });
    editor.setView('preview');
    await vi.waitFor(() => expect(preview.innerHTML).toContain('example.com/ok'));
    assertSafe(preview.innerHTML);
    editor.destroy();
  });

  it('client-side Texy preview, including a /--html block', () => {
    const { editor, preview } = editorWith(`"click":javascript:alert(1)\n\n/--html\n${payload}\n\\--`);
    editor.setView('preview');
    assertSafe(preview.innerHTML);
    expect(preview.innerHTML).toContain('>click</a>');
    editor.destroy();
  });
});

// ── ReDoS ───────────────────────────────────────────────────

describe('plugin patterns stay linear on adversarial input', () => {
  const placeholder = (html: string) => html;
  const LIMIT_MS = 250;

  it.each([
    ['[b]a', 50_000],
    ['[url=', 50_000],
    ['[color=x]', 50_000],
    ['[url=/x]a', 50_000],
  ])('bbcode: %j repeated %i times', (chunk, times) => {
    const plugin = bbcodePlugin();
    expect(elapsedMs(() => plugin.processInline!(chunk.repeat(times), placeholder))).toBeLessThan(LIMIT_MS);
  });

  it('image-embed preprocess: many unterminated linked images', () => {
    const plugin = imageEmbedPlugin();
    expect(elapsedMs(() => plugin.preprocess!('"[* ! .('.repeat(40_000)))).toBeLessThan(LIMIT_MS);
  });

  it.each([
    ['{{imglink:!', ''],
    ['!|!', '{{imglink:!|'],
    ['{{imglink:!|', ''],
  ])('image-embed placeholders: %j repeated after %j', (chunk, prefix) => {
    const plugin = imageEmbedPlugin();
    expect(elapsedMs(() => plugin.processInline!(prefix + chunk.repeat(40_000), placeholder))).toBeLessThan(LIMIT_MS);
  });

  it('image-embed still expands adjacent linked images separately', () => {
    const parser = new TexyParser({ plugins: [imageEmbedPlugin()] });
    const html = parser.parse('"[* /a.jpg .(A) *]":/one "[* /b.jpg *]":/two');
    expect(html).toContain('<a href="/one"><img src="/a.jpg" alt="A"');
    expect(html).toContain('<a href="/two"><img src="/b.jpg" alt=""');
  });
});
