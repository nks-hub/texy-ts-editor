import { describe, it, expect } from 'vitest';
import { TexyParser } from '../src/parser/TexyParser';
import { youtubePlugin } from '../src/parser/plugins/youtube';
import { smileyPlugin } from '../src/parser/plugins/smiley';
import { linkRedirectPlugin } from '../src/parser/plugins/link-redirect';
import { bbcodePlugin } from '../src/parser/plugins/bbcode';
import { imageEmbedPlugin } from '../src/parser/plugins/image-embed';

// ── Plugin System ─────────────────────────────────────────────

describe('TexyParser Plugin System', () => {
  it('accepts plugins via constructor', () => {
    const plugin = { name: 'test', preprocess: (t: string) => t };
    const parser = new TexyParser({ plugins: [plugin] });
    expect(parser.getPlugins()).toHaveLength(1);
    expect(parser.getPlugins()[0].name).toBe('test');
  });

  it('addPlugin adds a plugin at runtime', () => {
    const parser = new TexyParser();
    expect(parser.getPlugins()).toHaveLength(0);
    parser.addPlugin({ name: 'late', preprocess: (t) => t });
    expect(parser.getPlugins()).toHaveLength(1);
  });

  it('removePlugin removes by name', () => {
    const parser = new TexyParser({
      plugins: [
        { name: 'a', preprocess: (t) => t },
        { name: 'b', preprocess: (t) => t },
      ],
    });
    parser.removePlugin('a');
    expect(parser.getPlugins()).toHaveLength(1);
    expect(parser.getPlugins()[0].name).toBe('b');
  });

  it('runs preprocess before parsing', () => {
    const parser = new TexyParser({
      plugins: [{
        name: 'upper-pre',
        preprocess: (t) => t.toUpperCase(),
      }],
    });
    const result = parser.parse('hello');
    expect(result).toContain('HELLO');
  });

  it('runs postprocess after parsing', () => {
    const parser = new TexyParser({
      plugins: [{
        name: 'wrap-post',
        postprocess: (html) => `<article>${html}</article>`,
      }],
    });
    const result = parser.parse('hello');
    expect(result).toBe('<article><p>hello</p></article>');
  });

  it('runs processInline with placeholder support', () => {
    const parser = new TexyParser({
      plugins: [{
        name: 'emoji',
        processInline: (text, ph) => {
          return text.replace(/:smile:/g, ph('<span class="emoji">😊</span>'));
        },
      }],
    });
    const result = parser.parse('Hello :smile: world');
    expect(result).toContain('<span class="emoji">😊</span>');
    // Placeholder should protect HTML from escaping
    expect(result).not.toContain('&lt;span');
  });

  it('runs plugins in order', () => {
    const order: string[] = [];
    const parser = new TexyParser({
      plugins: [
        { name: 'first', preprocess: (t) => { order.push('first'); return t; } },
        { name: 'second', preprocess: (t) => { order.push('second'); return t; } },
      ],
    });
    parser.parse('test');
    expect(order).toEqual(['first', 'second']);
  });
});

// ── YouTube Plugin ────────────────────────────────────────────

describe('YouTube Plugin', () => {
  it('converts [* youtube:ID *] to iframe', () => {
    const parser = new TexyParser({ plugins: [youtubePlugin()] });
    const result = parser.parse('[* youtube:dQw4w9WgXcQ *]');
    expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
    expect(result).toContain('<iframe');
    expect(result).toContain('allowfullscreen');
  });

  it('converts YouTube watch URL to iframe', () => {
    const parser = new TexyParser({ plugins: [youtubePlugin()] });
    const result = parser.parse('[* https://www.youtube.com/watch?v=dQw4w9WgXcQ *]');
    expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('converts youtu.be short URL to iframe', () => {
    const parser = new TexyParser({ plugins: [youtubePlugin()] });
    const result = parser.parse('[* https://youtu.be/dQw4w9WgXcQ *]');
    expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('converts YouTube shorts URL to iframe', () => {
    const parser = new TexyParser({ plugins: [youtubePlugin()] });
    const result = parser.parse('[* https://www.youtube.com/shorts/abc123 *]');
    expect(result).toContain('youtube.com/embed/abc123');
  });

  it('uses custom dimensions', () => {
    const parser = new TexyParser({
      plugins: [youtubePlugin({ width: 800, height: 450 })],
    });
    const result = parser.parse('[* youtube:test123 *]');
    expect(result).toContain('width="800"');
    expect(result).toContain('height="450"');
  });

  it('uses custom wrapper class', () => {
    const parser = new TexyParser({
      plugins: [youtubePlugin({ wrapperClass: 'video-container' })],
    });
    const result = parser.parse('[* youtube:test123 *]');
    expect(result).toContain('class="video-container"');
  });

  it('can disable fullscreen', () => {
    const parser = new TexyParser({
      plugins: [youtubePlugin({ allowFullscreen: false })],
    });
    const result = parser.parse('[* youtube:test123 *]');
    expect(result).not.toContain('allowfullscreen');
  });

  it('handles multiple YouTube embeds', () => {
    const parser = new TexyParser({ plugins: [youtubePlugin()] });
    const result = parser.parse('[* youtube:aaa *]\n\n[* youtube:bbb *]');
    expect(result).toContain('embed/aaa');
    expect(result).toContain('embed/bbb');
  });
});

// ── Smiley Plugin ─────────────────────────────────────────────

describe('Smiley Plugin', () => {
  it('converts *ID* to smiley image', () => {
    const parser = new TexyParser({ plugins: [smileyPlugin({ baseUrl: '/smileys/' })] });
    const result = parser.parse('Hello *123* world');
    expect(result).toContain('<img src="/smileys/123.gif"');
    expect(result).toContain('class="smiley"');
  });

  it('uses custom base URL', () => {
    const parser = new TexyParser({
      plugins: [smileyPlugin({ baseUrl: '/assets/smileys/' })],
    });
    const result = parser.parse('Hi *42*');
    expect(result).toContain('src="/assets/smileys/42.gif"');
  });

  it('uses ARIA labels when provided', () => {
    const parser = new TexyParser({
      plugins: [smileyPlugin({ baseUrl: '/smileys/', ariaLabels: { '1': 'happy face' } })],
    });
    const result = parser.parse('*1*');
    expect(result).toContain('alt="happy face"');
  });

  it('uses custom class name', () => {
    const parser = new TexyParser({
      plugins: [smileyPlugin({ baseUrl: '/smileys/', className: 'emoji-img' })],
    });
    const result = parser.parse('*99*');
    expect(result).toContain('class="emoji-img"');
  });

  it('does not match bold syntax **text**', () => {
    const parser = new TexyParser({ plugins: [smileyPlugin({ baseUrl: '/smileys/' })] });
    const result = parser.parse('**bold**');
    expect(result).toContain('<strong>');
    expect(result).not.toContain('/smileys/');
  });

  it('handles multi-digit IDs up to 6 digits', () => {
    const parser = new TexyParser({ plugins: [smileyPlugin({ baseUrl: '/smileys/' })] });
    const result = parser.parse('*999999*');
    expect(result).toContain('/999999.gif');
  });

  it('does not match IDs longer than 6 digits', () => {
    const parser = new TexyParser({ plugins: [smileyPlugin({ baseUrl: '/smileys/' })] });
    const result = parser.parse('*1234567*');
    expect(result).not.toContain('/smileys/');
  });
});

// ── BBCode Plugin ─────────────────────────────────────────────

describe('BBCode Plugin', () => {
  it('converts [b] to strong', () => {
    const parser = new TexyParser({ plugins: [bbcodePlugin()] });
    const result = parser.parse('[b]bold text[/b]');
    expect(result).toContain('<strong>bold text</strong>');
  });

  it('converts [i] to em', () => {
    const parser = new TexyParser({ plugins: [bbcodePlugin()] });
    const result = parser.parse('[i]italic[/i]');
    expect(result).toContain('<em>italic</em>');
  });

  it('converts [u] to u', () => {
    const parser = new TexyParser({ plugins: [bbcodePlugin()] });
    const result = parser.parse('[u]underline[/u]');
    expect(result).toContain('<u>underline</u>');
  });

  it('converts [s] to del', () => {
    const parser = new TexyParser({ plugins: [bbcodePlugin()] });
    const result = parser.parse('[s]deleted[/s]');
    expect(result).toContain('<del>deleted</del>');
  });

  it('converts [url=] to link', () => {
    const parser = new TexyParser({ plugins: [bbcodePlugin()] });
    const result = parser.parse('[url=https://example.com]click here[/url]');
    expect(result).toContain('<a href="https://example.com">click here</a>');
  });

  it('converts [color=] to span with color', () => {
    const parser = new TexyParser({ plugins: [bbcodePlugin()] });
    const result = parser.parse('[color=red]red text[/color]');
    expect(result).toContain('<span style="color:red">red text</span>');
  });

  it('handles case-insensitive tags', () => {
    const parser = new TexyParser({ plugins: [bbcodePlugin()] });
    const result = parser.parse('[B]bold[/B]');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('handles sequential BBCode tags', () => {
    const parser = new TexyParser({ plugins: [bbcodePlugin()] });
    const result = parser.parse('[b]bold[/b] and [i]italic[/i]');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });
});

// ── Link Redirect Plugin ──────────────────────────────────────

describe('Link Redirect Plugin', () => {
  it('rewrites external links through redirect', () => {
    const parser = new TexyParser({ plugins: [linkRedirectPlugin({ redirectUrl: '/redirect' })] });
    const result = parser.parse('"click":https://example.com');
    expect(result).toContain('/redirect?url=');
    expect(result).toContain(encodeURIComponent('https://example.com'));
  });

  it('adds target="_blank" by default', () => {
    const parser = new TexyParser({ plugins: [linkRedirectPlugin({ redirectUrl: '/redirect' })] });
    const result = parser.parse('"test":https://example.com');
    expect(result).toContain('target="_blank"');
  });

  it('adds rel="noopener noreferrer"', () => {
    const parser = new TexyParser({ plugins: [linkRedirectPlugin({ redirectUrl: '/redirect' })] });
    const result = parser.parse('"test":https://example.com');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('excludes specified domains from redirect', () => {
    const parser = new TexyParser({
      plugins: [linkRedirectPlugin({ redirectUrl: '/redirect', excludeDomains: ['example.org'] })],
    });
    const result = parser.parse('"link":https://example.org/page');
    expect(result).not.toContain('redirect?url=');
    expect(result).toContain('href="https://example.org/page"');
  });

  it('excludes subdomains of excluded domains', () => {
    const parser = new TexyParser({
      plugins: [linkRedirectPlugin({ redirectUrl: '/redirect', excludeDomains: ['example.org'] })],
    });
    const result = parser.parse('"link":https://cdn.example.org/img.jpg');
    expect(result).not.toContain('redirect?url=');
  });

  it('uses custom redirect URL', () => {
    const parser = new TexyParser({
      plugins: [linkRedirectPlugin({ redirectUrl: '/go' })],
    });
    const result = parser.parse('"test":https://example.com');
    expect(result).toContain('href="/go?url=');
  });

  it('can disable target="_blank"', () => {
    const parser = new TexyParser({
      plugins: [linkRedirectPlugin({ targetBlank: false })],
    });
    const result = parser.parse('"test":https://example.com');
    expect(result).not.toContain('target="_blank"');
  });
});

// ── Image Embed Plugin ────────────────────────────────────────

describe('Image Embed Plugin', () => {
  it('handles linked images with preprocess', () => {
    const parser = new TexyParser({ plugins: [imageEmbedPlugin()] });
    const result = parser.parse('"[* https://img.com/photo.jpg *]":https://example.com');
    expect(result).toContain('<a href="https://example.com">');
    expect(result).toContain('<img src="https://img.com/photo.jpg"');
    expect(result).toContain('class="texy-image"');
    expect(result).toContain('max-width:300px');
  });

  it('handles linked images with alt text', () => {
    const parser = new TexyParser({ plugins: [imageEmbedPlugin()] });
    const result = parser.parse('"[* https://img.com/photo.jpg .(My photo) *]":https://example.com');
    expect(result).toContain('alt="My photo"');
  });

  it('uses custom max-width and class', () => {
    const parser = new TexyParser({
      plugins: [imageEmbedPlugin({ maxWidth: '500px', className: 'gallery-img' })],
    });
    const result = parser.parse('"[* https://img.com/photo.jpg *]":https://example.com');
    expect(result).toContain('max-width:500px');
    expect(result).toContain('class="gallery-img"');
  });

  it('can disable linked images', () => {
    const parser = new TexyParser({
      plugins: [imageEmbedPlugin({ enableLinkedImages: false })],
    });
    const result = parser.parse('"[* https://img.com/photo.jpg *]":https://example.com');
    // Without the plugin preprocessing, the linked image syntax won't be parsed
    expect(result).not.toContain('<a href="https://example.com"><img');
  });
});

// ── Combined plugins usage ────────────────────────────────────

describe('Combined Plugins', () => {
  it('multiple plugins work together', () => {
    const parser = new TexyParser({
      plugins: [youtubePlugin(), smileyPlugin({ baseUrl: '/smileys/' }), bbcodePlugin()],
    });

    const yt = parser.parse('[* youtube:abc *]');
    expect(yt).toContain('youtube.com/embed/abc');

    const sm = parser.parse('ahoj *5* jak se mas');
    expect(sm).toContain('/smileys/5.gif');

    const bb = parser.parse('[b]tucne[/b]');
    expect(bb).toContain('<strong>tucne</strong>');

    // Standard Texy still works
    const texy = parser.parse('**bold** and *italic*');
    expect(texy).toContain('<strong>bold</strong>');
    expect(texy).toContain('<em>italic</em>');
  });

  it('handles mixed plugin and Texy content', () => {
    const parser = new TexyParser({
      plugins: [youtubePlugin(), smileyPlugin({ baseUrl: '/smileys/' }), linkRedirectPlugin({ redirectUrl: '/redirect' })],
    });
    const input = `**Ahoj!** *5*

[* youtube:dQw4w9WgXcQ *]

"Odkaz":https://example.com`;

    const result = parser.parse(input);
    expect(result).toContain('<strong>Ahoj!</strong>');
    expect(result).toContain('/smileys/5.gif');
    expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
    expect(result).toContain('redirect?url=');
  });
});
