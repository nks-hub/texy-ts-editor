import { describe, it, expect, beforeEach } from 'vitest';
import { TexyMode } from '../../src/modes/TexyMode';

describe('TexyMode', () => {
  let mode: TexyMode;

  beforeEach(() => {
    mode = new TexyMode();
  });

  it('has name "texy"', () => {
    expect(mode.name).toBe('texy');
  });

  // ── Markers ─────────────────────────────────────────────────

  describe('markers', () => {
    it('bold marker is **', () => { expect(mode.markers.bold).toBe('**'); });
    it('italic marker is *', () => { expect(mode.markers.italic).toBe('*'); });
    it('deleted marker is --', () => { expect(mode.markers.deleted).toBe('--'); });
    it('inserted marker is ++', () => { expect(mode.markers.inserted).toBe('++'); });
    it('superscript marker is ^^', () => { expect(mode.markers.superscript).toBe('^^'); });
    it('subscript marker is __', () => { expect(mode.markers.subscript).toBe('__'); });
    it('code marker is `', () => { expect(mode.markers.code).toBe('`'); });
  });

  // ── Inline phrases ──────────────────────────────────────────

  describe('inline', () => {
    it('bold', () => { expect(mode.bold('hello')).toBe('**hello**'); });
    it('italic', () => { expect(mode.italic('hello')).toBe('*hello*'); });
    it('deleted', () => { expect(mode.deleted('old')).toBe('--old--'); });
    it('inserted', () => { expect(mode.inserted('new')).toBe('++new++'); });
    it('superscript', () => { expect(mode.superscript('2')).toBe('^^2^^'); });
    it('subscript', () => { expect(mode.subscript('2')).toBe('__2__'); });
    it('code', () => { expect(mode.code('const x')).toBe('`const x`'); });
    it('bold empty', () => { expect(mode.bold('')).toBe('****'); });
  });

  // ── Headings ──────────────────────────────────────────────

  describe('heading()', () => {
    it('level 1 uses underline chars', () => {
      const result = mode.heading('Title', 1);
      const lines = result.split('\n');
      expect(lines[0]).toBe('Title');
      expect(lines[1]).toMatch(/^#{3,}$/);
    });

    it('level 2 uses * underline', () => {
      const result = mode.heading('Sub', 2);
      const lines = result.split('\n');
      expect(lines[1]).toMatch(/^\*{3,}$/);
    });

    it('level 3 uses = underline', () => {
      const result = mode.heading('Section', 3);
      const lines = result.split('\n');
      expect(lines[1]).toMatch(/^={3,}$/);
    });

    it('level 4 uses - underline', () => {
      const result = mode.heading('Sub', 4);
      const lines = result.split('\n');
      expect(lines[1]).toMatch(/^-{3,}$/);
    });
  });

  // ── Links ─────────────────────────────────────────────────

  describe('links', () => {
    it('link() produces Texy syntax', () => {
      expect(mode.link('Nette', 'https://nette.org')).toBe('"Nette":https://nette.org');
    });

    it('linkEmpty()', () => {
      expect(mode.linkEmpty('https://ex.com')).toBe('"":https://ex.com');
    });

    it('linkCursorOffset() is 1', () => {
      expect(mode.linkCursorOffset()).toBe(1);
    });

    it('linkPhrasePrefix() is "', () => {
      expect(mode.linkPhrasePrefix()).toBe('"');
    });

    it('linkPhraseSuffix()', () => {
      expect(mode.linkPhraseSuffix('https://ex.com')).toBe('":https://ex.com');
    });
  });

  // ── Images ────────────────────────────────────────────────

  describe('images', () => {
    it('image() without alt', () => {
      expect(mode.image('', 'photo.jpg')).toBe('[* photo.jpg *]');
    });

    it('image() with alt', () => {
      expect(mode.image('Cat', 'cat.jpg')).toBe('[* cat.jpg .( Cat) *]');
    });

    it('imageWithOptions() basic', () => {
      const result = mode.imageWithOptions('photo.jpg', 'Photo');
      expect(result).toContain('[* photo.jpg');
      expect(result).toContain('.( Photo)');
    });

    it('imageWithOptions() with dimensions', () => {
      const result = mode.imageWithOptions('photo.jpg', undefined, '*', { width: 200, height: 100 });
      expect(result).toContain('200x100');
    });

    it('imageWithOptions() with link', () => {
      const result = mode.imageWithOptions('photo.jpg', undefined, '*', { link: '/detail' });
      expect(result).toContain(':/detail');
    });

    it('imageWithOptions() with caption', () => {
      const result = mode.imageWithOptions('photo.jpg', undefined, '*', { caption: 'A photo' });
      expect(result).toContain('*** A photo');
    });
  });

  // ── Code blocks ───────────────────────────────────────────

  describe('codeBlock', () => {
    it('wraps with /--code', () => {
      expect(mode.codeBlock('x = 1;')).toBe('/--code\nx = 1;\n\\--');
    });

    it('includes language', () => {
      expect(mode.codeBlock('x = 1;', 'js')).toBe('/--code js\nx = 1;\n\\--');
    });

    it('codeBlockWrap()', () => {
      const wrap = mode.codeBlockWrap('php');
      expect(wrap.open).toBe('/--code php\n');
      expect(wrap.close).toBe('\n\\--');
    });
  });

  // ── Lists ─────────────────────────────────────────────────

  describe('lists', () => {
    it('unorderedList', () => {
      expect(mode.unorderedList(['a', 'b'])).toBe('- a\n- b');
    });

    it('orderedList uses )', () => {
      expect(mode.orderedList(['a', 'b'])).toBe('1) a\n2) b');
    });

    it('orderedBullet()', () => {
      expect(mode.orderedBullet(1)).toBe('1)');
      expect(mode.orderedBullet(3)).toBe('3)');
    });
  });

  // ── Blockquote & HR ───────────────────────────────────────

  describe('blockquote', () => {
    it('prefixes lines with >', () => {
      expect(mode.blockquote('a\nb')).toBe('> a\n> b');
    });
  });

  describe('horizontalRule', () => {
    it('returns long dashes', () => {
      expect(mode.horizontalRule()).toMatch(/^-{3,}$/);
    });
  });

  // ── Tables ────────────────────────────────────────────────

  describe('table', () => {
    it('empty returns empty', () => {
      expect(mode.table([])).toBe('');
    });

    it('basic table', () => {
      const result = mode.table([['A', 'B'], ['C', 'D']]);
      expect(result).toContain('|');
      expect(result).toContain('A');
    });

    it('header uses * marker', () => {
      const result = mode.table([['H1', 'H2'], ['a', 'b']], true);
      expect(result).toContain('*');
    });

    it('tableGrid() generates grid', () => {
      const result = mode.tableGrid(2, 2, 'top');
      expect(result).toContain('|');
      expect(result).toContain('--------');
    });
  });

  // ── Markdown-specific fallbacks ──────────────────────────────

  describe('taskListItem (fallback)', () => {
    it('returns plain list item', () => {
      expect(mode.taskListItem('item', false)).toBe('- item');
    });

    it('ignores checked state', () => {
      expect(mode.taskListItem('item', true)).toBe('- item');
    });
  });

  describe('footnoteRef (fallback)', () => {
    it('uses Texy inline footnote', () => {
      expect(mode.footnoteRef('1')).toBe('((1))');
    });
  });

  describe('footnoteDefinition (fallback)', () => {
    it('returns empty (Texy has inline footnotes)', () => {
      expect(mode.footnoteDefinition('1', 'text')).toBe('');
    });
  });

  describe('highlight (fallback)', () => {
    it('uses bold as fallback', () => {
      expect(mode.highlight('text')).toBe('**text**');
    });
  });

  // ── Syntax-specific ───────────────────────────────────────

  describe('syntax-specific', () => {
    it('supportsModifiers() is true', () => {
      expect(mode.supportsModifiers()).toBe(true);
    });

    it('acronym() single word', () => {
      expect(mode.acronym('NATO', 'North Atlantic Treaty Organisation'))
        .toBe('NATO((North Atlantic Treaty Organisation))');
    });

    it('acronym() phrase', () => {
      expect(mode.acronym('some phrase', 'title'))
        .toBe('"some phrase"((title))');
    });

    it('colorModifier()', () => {
      const result = mode.colorModifier('text', 'red');
      expect(result).toContain('color: red');
    });

    it('classModifier()', () => {
      const result = mode.classModifier('text', 'highlight');
      expect(result).toContain('highlight');
    });

    it('alignmentPrefix()', () => {
      expect(mode.alignmentPrefix('<')).toBe('.<\n');
    });
  });
});
