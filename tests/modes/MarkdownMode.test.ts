import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownMode } from '../../src/modes/MarkdownMode';

describe('MarkdownMode', () => {
  let mode: MarkdownMode;

  beforeEach(() => {
    mode = new MarkdownMode();
  });

  it('has name "markdown"', () => {
    expect(mode.name).toBe('markdown');
  });

  // ── Markers ─────────────────────────────────────────────────

  describe('markers', () => {
    it('bold marker is **', () => { expect(mode.markers.bold).toBe('**'); });
    it('italic marker is *', () => { expect(mode.markers.italic).toBe('*'); });
    it('deleted marker is ~~', () => { expect(mode.markers.deleted).toBe('~~'); });
    it('inserted marker is ++', () => { expect(mode.markers.inserted).toBe('++'); });
    it('superscript marker is ^', () => { expect(mode.markers.superscript).toBe('^'); });
    it('subscript marker is ~', () => { expect(mode.markers.subscript).toBe('~'); });
    it('code marker is `', () => { expect(mode.markers.code).toBe('`'); });
  });

  // ── Inline phrases ──────────────────────────────────────────

  describe('inline', () => {
    it('bold', () => { expect(mode.bold('hello')).toBe('**hello**'); });
    it('italic', () => { expect(mode.italic('hello')).toBe('*hello*'); });
    it('deleted (GFM strikethrough)', () => { expect(mode.deleted('old')).toBe('~~old~~'); });
    it('inserted', () => { expect(mode.inserted('new')).toBe('++new++'); });
    it('superscript (single ^)', () => { expect(mode.superscript('2')).toBe('^2^'); });
    it('subscript (single ~)', () => { expect(mode.subscript('2')).toBe('~2~'); });
    it('code', () => { expect(mode.code('const x')).toBe('`const x`'); });
    it('bold empty', () => { expect(mode.bold('')).toBe('****'); });
  });

  // ── Headings ──────────────────────────────────────────────

  describe('heading()', () => {
    it('level 1 uses # prefix', () => {
      expect(mode.heading('Title', 1)).toBe('# Title');
    });

    it('level 2 uses ##', () => {
      expect(mode.heading('Sub', 2)).toBe('## Sub');
    });

    it('level 3 uses ###', () => {
      expect(mode.heading('Section', 3)).toBe('### Section');
    });

    it('level 4 uses ####', () => {
      expect(mode.heading('Sub', 4)).toBe('#### Sub');
    });

    it('level 6 max', () => {
      expect(mode.heading('Deep', 6)).toBe('###### Deep');
    });

    it('clamps to level 1 minimum', () => {
      expect(mode.heading('Title', 0)).toBe('# Title');
    });

    it('clamps to level 6 maximum', () => {
      expect(mode.heading('Title', 9)).toBe('###### Title');
    });
  });

  // ── Links ─────────────────────────────────────────────────

  describe('links', () => {
    it('link() produces Markdown syntax', () => {
      expect(mode.link('Nette', 'https://nette.org')).toBe('[Nette](https://nette.org)');
    });

    it('link() with relative URL', () => {
      expect(mode.link('page', '/about')).toBe('[page](/about)');
    });

    it('linkEmpty()', () => {
      expect(mode.linkEmpty('https://ex.com')).toBe('[](https://ex.com)');
    });

    it('linkCursorOffset() is 1', () => {
      expect(mode.linkCursorOffset()).toBe(1);
    });

    it('linkPhrasePrefix() is [', () => {
      expect(mode.linkPhrasePrefix()).toBe('[');
    });

    it('linkPhraseSuffix()', () => {
      expect(mode.linkPhraseSuffix('https://ex.com')).toBe('](https://ex.com)');
    });
  });

  // ── Images ────────────────────────────────────────────────

  describe('images', () => {
    it('image() without alt', () => {
      expect(mode.image('', 'photo.jpg')).toBe('![](photo.jpg)');
    });

    it('image() with alt', () => {
      expect(mode.image('Cat', 'cat.jpg')).toBe('![Cat](cat.jpg)');
    });

    it('imageWithOptions() basic', () => {
      expect(mode.imageWithOptions('photo.jpg', 'Photo')).toBe('![Photo](photo.jpg)');
    });

    it('imageWithOptions() without alt', () => {
      expect(mode.imageWithOptions('photo.jpg')).toBe('![](photo.jpg)');
    });

    it('imageWithOptions() with link wraps in []', () => {
      const result = mode.imageWithOptions('photo.jpg', 'Photo', '*', { link: '/detail' });
      expect(result).toBe('[![Photo](photo.jpg)](/detail)');
    });

    it('imageWithOptions() ignores align (no Markdown equivalent)', () => {
      const basic = mode.imageWithOptions('photo.jpg', 'A');
      const aligned = mode.imageWithOptions('photo.jpg', 'A', '<>');
      expect(aligned).toBe(basic);
    });

    it('imageWithOptions() ignores dimensions (no standard Markdown support)', () => {
      const result = mode.imageWithOptions('photo.jpg', 'A', '*', { width: 200, height: 100 });
      expect(result).toBe('![A](photo.jpg)');
    });
  });

  // ── Code blocks ───────────────────────────────────────────

  describe('codeBlock', () => {
    it('wraps with fenced code blocks', () => {
      expect(mode.codeBlock('x = 1;')).toBe('```\nx = 1;\n```');
    });

    it('includes language', () => {
      expect(mode.codeBlock('x = 1;', 'js')).toBe('```js\nx = 1;\n```');
    });

    it('handles empty code', () => {
      expect(mode.codeBlock('')).toBe('```\n\n```');
    });

    it('codeBlockWrap() with language', () => {
      const wrap = mode.codeBlockWrap('php');
      expect(wrap.open).toBe('```php\n');
      expect(wrap.close).toBe('\n```');
    });

    it('codeBlockWrap() without language', () => {
      const wrap = mode.codeBlockWrap();
      expect(wrap.open).toBe('```\n');
      expect(wrap.close).toBe('\n```');
    });
  });

  // ── Lists ─────────────────────────────────────────────────

  describe('lists', () => {
    it('unorderedList', () => {
      expect(mode.unorderedList(['a', 'b'])).toBe('- a\n- b');
    });

    it('unorderedList single item', () => {
      expect(mode.unorderedList(['one'])).toBe('- one');
    });

    it('orderedList uses .', () => {
      expect(mode.orderedList(['a', 'b'])).toBe('1. a\n2. b');
    });

    it('orderedList single item', () => {
      expect(mode.orderedList(['only'])).toBe('1. only');
    });

    it('orderedBullet()', () => {
      expect(mode.orderedBullet(1)).toBe('1.');
      expect(mode.orderedBullet(3)).toBe('3.');
    });
  });

  // ── Blockquote & HR ───────────────────────────────────────

  describe('blockquote', () => {
    it('prefixes lines with >', () => {
      expect(mode.blockquote('a\nb')).toBe('> a\n> b');
    });

    it('single line', () => {
      expect(mode.blockquote('quote')).toBe('> quote');
    });
  });

  describe('horizontalRule', () => {
    it('returns ---', () => {
      expect(mode.horizontalRule()).toBe('---');
    });
  });

  // ── Tables ────────────────────────────────────────────────

  describe('table', () => {
    it('empty returns empty', () => {
      expect(mode.table([])).toBe('');
    });

    it('basic table without header', () => {
      const result = mode.table([['A', 'B'], ['C', 'D']]);
      expect(result).toBe('| A | B |\n| C | D |');
    });

    it('header adds --- separator row', () => {
      const result = mode.table([['H1', 'H2'], ['a', 'b']], true);
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('| H1 | H2 |');
      expect(lines[1]).toBe('| --- | --- |');
      expect(lines[2]).toBe('| a | b |');
    });

    it('3-column table', () => {
      const result = mode.table([['H1', 'H2', 'H3'], ['a', 'b', 'c']], true);
      expect(result).toContain('| --- | --- | --- |');
    });

    it('tableGrid() with top header', () => {
      const result = mode.tableGrid(2, 2, 'top');
      expect(result).toContain('Header');
      expect(result).toContain('---');
    });

    it('tableGrid() without header', () => {
      const result = mode.tableGrid(2, 2);
      expect(result).not.toContain('Header');
      expect(result).not.toContain('---');
    });

    it('tableGrid() has correct number of rows', () => {
      const result = mode.tableGrid(3, 4);
      const lines = result.trim().split('\n');
      expect(lines).toHaveLength(4);
    });
  });

  // ── Syntax-specific (no-ops for Markdown) ───────────────────

  describe('syntax-specific (no-ops)', () => {
    it('supportsModifiers() is false', () => {
      expect(mode.supportsModifiers()).toBe(false);
    });

    it('acronym() returns empty string', () => {
      expect(mode.acronym('NATO', 'North Atlantic Treaty Organisation')).toBe('');
    });

    it('colorModifier() returns text unchanged', () => {
      expect(mode.colorModifier('text', 'red')).toBe('text');
    });

    it('classModifier() returns text unchanged', () => {
      expect(mode.classModifier('text', 'highlight')).toBe('text');
    });

    it('alignmentPrefix() returns empty string', () => {
      expect(mode.alignmentPrefix('<')).toBe('');
    });
  });

  // ── Differences from TexyMode ────────────────────────────────

  describe('Markdown vs Texy differences', () => {
    it('deleted uses ~~ not --', () => {
      expect(mode.markers.deleted).toBe('~~');
    });

    it('superscript uses ^ not ^^', () => {
      expect(mode.markers.superscript).toBe('^');
    });

    it('subscript uses ~ not __', () => {
      expect(mode.markers.subscript).toBe('~');
    });

    it('ordered list uses . not )', () => {
      expect(mode.orderedBullet(1)).toBe('1.');
    });

    it('heading is ATX style (no newline)', () => {
      expect(mode.heading('Test', 1)).not.toContain('\n');
    });

    it('link uses [text](url) syntax', () => {
      expect(mode.link('click', 'https://example.com')).toBe('[click](https://example.com)');
    });

    it('image uses ![alt](url) syntax', () => {
      expect(mode.image('desc', 'img.png')).toBe('![desc](img.png)');
    });

    it('codeBlock uses backtick fences', () => {
      expect(mode.codeBlock('code', 'js')).toContain('```js');
    });
  });
});
