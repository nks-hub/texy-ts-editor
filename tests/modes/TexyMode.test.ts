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

  // ── Inline phrases ──────────────────────────────────────────

  describe('bold()', () => {
    it('wraps text with **', () => {
      expect(mode.bold('hello')).toBe('**hello**');
    });

    it('handles empty string', () => {
      expect(mode.bold('')).toBe('****');
    });
  });

  describe('italic()', () => {
    it('wraps text with *', () => {
      expect(mode.italic('hello')).toBe('*hello*');
    });
  });

  describe('deleted()', () => {
    it('wraps text with --', () => {
      expect(mode.deleted('old')).toBe('--old--');
    });
  });

  describe('inserted()', () => {
    it('wraps text with ++', () => {
      expect(mode.inserted('new')).toBe('++new++');
    });
  });

  describe('superscript()', () => {
    it('wraps text with ^^', () => {
      expect(mode.superscript('2')).toBe('^^2^^');
    });
  });

  describe('subscript()', () => {
    it('wraps text with __', () => {
      expect(mode.subscript('2')).toBe('__2__');
    });
  });

  describe('code()', () => {
    it('wraps text with backticks', () => {
      expect(mode.code('const x')).toBe('`const x`');
    });
  });

  // ── Headings ────────────────────────────────────────────────

  describe('heading()', () => {
    it('produces underline with 6 # for level 1', () => {
      const result = mode.heading('Title', 1);
      const lines = result.split('\n');
      expect(lines[0]).toBe('Title');
      // 7 - 1 = 6 chars
      expect(lines[1]).toBe('######');
    });

    it('produces underline with 5 # for level 2', () => {
      const result = mode.heading('Sub', 2);
      const lines = result.split('\n');
      expect(lines[1]).toBe('#####');
    });

    it('produces underline with 4 # for level 3', () => {
      const result = mode.heading('Section', 3);
      const lines = result.split('\n');
      expect(lines[1]).toBe('####');
    });

    it('produces underline with minimum 3 chars for level 4', () => {
      const result = mode.heading('Sub', 4);
      const lines = result.split('\n');
      expect(lines[1]).toBe('###');
    });

    it('includes heading text on first line', () => {
      const result = mode.heading('My Heading', 1);
      expect(result.startsWith('My Heading\n')).toBe(true);
    });
  });

  // ── Links ────────────────────────────────────────────────────

  describe('link()', () => {
    it('produces Texy link syntax', () => {
      expect(mode.link('Nette', 'https://nette.org')).toBe('"Nette":https://nette.org');
    });

    it('handles relative URLs', () => {
      expect(mode.link('page', '/about')).toBe('"page":/about');
    });
  });

  // ── Images ──────────────────────────────────────────────────

  describe('image()', () => {
    it('produces Texy image syntax without alt', () => {
      expect(mode.image('', 'photo.jpg')).toBe('[* photo.jpg *]');
    });

    it('produces Texy image syntax with alt text', () => {
      expect(mode.image('Cat photo', 'cat.jpg')).toBe('[* cat.jpg .( Cat photo) *]');
    });
  });

  // ── Code block ──────────────────────────────────────────────

  describe('codeBlock()', () => {
    it('wraps with /--code and \\--', () => {
      const result = mode.codeBlock('const x = 1;');
      expect(result).toBe('/--code\nconst x = 1;\n\\--');
    });

    it('includes language specifier', () => {
      const result = mode.codeBlock('const x = 1;', 'javascript');
      expect(result).toBe('/--code javascript\nconst x = 1;\n\\--');
    });

    it('handles empty code', () => {
      const result = mode.codeBlock('');
      expect(result).toBe('/--code\n\n\\--');
    });
  });

  // ── Lists ────────────────────────────────────────────────────

  describe('unorderedList()', () => {
    it('uses - bullet', () => {
      const result = mode.unorderedList(['apple', 'banana']);
      expect(result).toBe('- apple\n- banana');
    });

    it('handles single item', () => {
      expect(mode.unorderedList(['one'])).toBe('- one');
    });
  });

  describe('orderedList()', () => {
    it('uses ) not . after number (Texy convention)', () => {
      const result = mode.orderedList(['first', 'second', 'third']);
      expect(result).toBe('1) first\n2) second\n3) third');
    });

    it('handles single item', () => {
      expect(mode.orderedList(['only'])).toBe('1) only');
    });
  });

  // ── Blockquote ───────────────────────────────────────────────

  describe('blockquote()', () => {
    it('prefixes each line with >', () => {
      const result = mode.blockquote('line one\nline two');
      expect(result).toBe('> line one\n> line two');
    });

    it('handles single line', () => {
      expect(mode.blockquote('quote')).toBe('> quote');
    });
  });

  // ── Horizontal rule ──────────────────────────────────────────

  describe('horizontalRule()', () => {
    it('returns a sequence of dashes', () => {
      const result = mode.horizontalRule();
      expect(result).toMatch(/^-{3,}$/);
    });
  });

  // ── Table ────────────────────────────────────────────────────

  describe('table()', () => {
    it('returns empty string for empty rows', () => {
      expect(mode.table([])).toBe('');
    });

    it('produces pipe-delimited table without header', () => {
      const result = mode.table([['A', 'B'], ['C', 'D']]);
      expect(result).toContain('|');
      expect(result).toContain('A');
      expect(result).toContain('D');
    });

    it('marks first row as header when header=true', () => {
      const result = mode.table([['Name', 'Age'], ['Alice', '30']], true);
      const lines = result.split('\n');
      // First line should contain * markers for header cells
      expect(lines[0]).toContain('*');
      // Second line should be separator
      expect(lines[1]).toMatch(/^\|[-|]+\|$/);
    });

    it('data rows do not use * marker', () => {
      const result = mode.table([['H1', 'H2'], ['r1c1', 'r1c2']], true);
      const lines = result.split('\n');
      // Third line is data row, should not start with |*
      expect(lines[2]).not.toMatch(/^\|\*/);
    });
  });
});
