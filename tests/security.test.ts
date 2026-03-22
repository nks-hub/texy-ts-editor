import { describe, it, expect } from 'vitest';
import { escapeHtml, isSafeUrl, sanitizeUrl } from '../src/utils/escapeHtml';
import { bbcodePlugin } from '../src/parser/plugins/bbcode';
import { imageEmbedPlugin } from '../src/parser/plugins/image-embed';

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
