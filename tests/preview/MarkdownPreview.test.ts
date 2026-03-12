import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownPreview } from '../../src/preview/MarkdownPreview';

describe('MarkdownPreview', () => {
  let preview: MarkdownPreview;

  beforeEach(() => {
    preview = new MarkdownPreview();
  });

  // ── Headings ─────────────────────────────────────────────────

  describe('headings', () => {
    it('renders # as h1', () => {
      expect(preview.render('# Hello')).toContain('<h1>Hello</h1>');
    });

    it('renders ## as h2', () => {
      expect(preview.render('## Sub')).toContain('<h2>Sub</h2>');
    });

    it('renders ### as h3', () => {
      expect(preview.render('### Section')).toContain('<h3>Section</h3>');
    });

    it('renders #### as h4', () => {
      expect(preview.render('#### Deep')).toContain('<h4>Deep</h4>');
    });
  });

  // ── Inline formatting ────────────────────────────────────────

  describe('inline formatting', () => {
    it('renders **bold** as strong', () => {
      const result = preview.render('**bold**');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('renders *italic* as em', () => {
      const result = preview.render('*italic*');
      expect(result).toContain('<em>italic</em>');
    });

    it('renders `code` as code span', () => {
      const result = preview.render('`code`');
      expect(result).toContain('<code>code</code>');
    });

    it('renders ~~strikethrough~~ as del (GFM)', () => {
      const result = preview.render('~~text~~');
      expect(result).toContain('<s>text</s>');
    });
  });

  // ── Links ────────────────────────────────────────────────────

  describe('links', () => {
    it('renders [text](url) as anchor', () => {
      const result = preview.render('[Nette](https://nette.org)');
      expect(result).toContain('<a href="https://nette.org">Nette</a>');
    });

    it('linkifies bare URLs (linkify: true)', () => {
      const result = preview.render('Visit https://example.com today');
      expect(result).toContain('href="https://example.com"');
    });
  });

  // ── Images ──────────────────────────────────────────────────

  describe('images', () => {
    it('renders ![alt](src) as img', () => {
      const result = preview.render('![Cat](cat.jpg)');
      expect(result).toContain('<img src="cat.jpg"');
      expect(result).toContain('alt="Cat"');
    });
  });

  // ── Code blocks ──────────────────────────────────────────────

  describe('code blocks', () => {
    it('renders fenced code block', () => {
      const result = preview.render('```\nconst x = 1;\n```');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
    });

    it('renders fenced code block with language', () => {
      const result = preview.render('```javascript\nconst x = 1;\n```');
      expect(result).toContain('<code');
      // highlight.js wraps tokens in spans, so the raw text may be split
      expect(result).toContain('class="language-javascript"');
    });

    it('applies highlight.js to known language', () => {
      const result = preview.render('```javascript\nconst x = 1;\n```');
      // highlight.js produces spans with class names
      expect(result).toContain('<span');
    });

    it('does not apply syntax highlighting for unknown language', () => {
      const result = preview.render('```unknownlang\nsome code\n```');
      expect(result).toContain('some code');
    });

    it('escapes HTML inside code blocks', () => {
      const result = preview.render('```\n<script>alert(1)</script>\n```');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  // ── Lists ────────────────────────────────────────────────────

  describe('lists', () => {
    it('renders unordered list', () => {
      const result = preview.render('- item 1\n- item 2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>item 1</li>');
      expect(result).toContain('<li>item 2</li>');
    });

    it('renders ordered list', () => {
      const result = preview.render('1. first\n2. second');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>first</li>');
      expect(result).toContain('<li>second</li>');
    });
  });

  // ── Blockquotes ──────────────────────────────────────────────

  describe('blockquotes', () => {
    it('renders > as blockquote', () => {
      const result = preview.render('> cited text');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('cited text');
    });
  });

  // ── Tables (GFM) ─────────────────────────────────────────────

  describe('GFM tables', () => {
    it('renders pipe table', () => {
      const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |';
      const result = preview.render(md);
      expect(result).toContain('<table>');
      expect(result).toContain('<th>Name</th>');
      expect(result).toContain('<th>Age</th>');
      expect(result).toContain('<td>Alice</td>');
      expect(result).toContain('<td>30</td>');
    });
  });

  // ── Horizontal rule ──────────────────────────────────────────

  describe('horizontal rule', () => {
    it('renders --- as hr', () => {
      const result = preview.render('---');
      expect(result).toContain('<hr');
    });
  });

  // ── Paragraphs ───────────────────────────────────────────────

  describe('paragraphs', () => {
    it('wraps plain text in p', () => {
      const result = preview.render('Hello world');
      expect(result).toContain('<p>Hello world</p>');
    });

    it('creates two paragraphs from double newline', () => {
      const result = preview.render('First\n\nSecond');
      expect(result).toContain('<p>First</p>');
      expect(result).toContain('<p>Second</p>');
    });
  });

  // ── Security ─────────────────────────────────────────────────

  describe('security', () => {
    it('does not pass raw HTML (html: false)', () => {
      const result = preview.render('<script>alert(1)</script>');
      expect(result).not.toContain('<script>');
    });

    it('escapes angle brackets in paragraphs', () => {
      const result = preview.render('text <b>not html</b> text');
      expect(result).not.toContain('<b>not html</b>');
    });
  });

  // ── Typographer ──────────────────────────────────────────────

  describe('typographer', () => {
    it('converts straight quotes to smart quotes (typographer: true)', () => {
      const result = preview.render('"hello"');
      // markdown-it typographer converts " to curly quotes
      expect(result).toMatch(/\u201c|\u201d|&ldquo;|&rdquo;|&#x201[CD];/);
    });
  });

  // ── Highlight (==mark==) ────────────────────────────────────

  describe('highlight/mark', () => {
    it('renders ==text== as <mark>', () => {
      const result = preview.render('This is ==highlighted== text');
      expect(result).toContain('<mark>highlighted</mark>');
    });
  });

  // ── Task lists ─────────────────────────────────────────────

  describe('task lists', () => {
    it('renders unchecked task', () => {
      const result = preview.render('- [ ] Todo item');
      expect(result).toContain('type="checkbox"');
    });

    it('renders checked task', () => {
      const result = preview.render('- [x] Done item');
      expect(result).toContain('checked');
    });
  });

  // ── Footnotes ──────────────────────────────────────────────

  describe('footnotes', () => {
    it('renders footnote reference and definition', () => {
      const md = 'Text with footnote[^1]\n\n[^1]: Footnote content';
      const result = preview.render(md);
      expect(result).toContain('Footnote content');
      expect(result).toContain('footnote');
    });
  });

  // ── Return type ──────────────────────────────────────────────

  describe('render()', () => {
    it('returns a non-empty string for non-empty input', () => {
      const result = preview.render('hello');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns empty-ish output for empty input', () => {
      const result = preview.render('');
      expect(result.trim()).toBe('');
    });
  });
});
