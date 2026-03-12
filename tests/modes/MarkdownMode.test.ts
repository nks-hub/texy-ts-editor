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

  // ── Inline phrases ──────────────────────────────────────────

  describe('bold()', () => {
    it('wraps text with **', () => {
      expect(mode.bold('hello')).toBe('**hello**');
    });
  });

  describe('italic()', () => {
    it('wraps text with *', () => {
      expect(mode.italic('hello')).toBe('*hello*');
    });
  });

  describe('deleted()', () => {
    it('uses GFM strikethrough ~~', () => {
      expect(mode.deleted('old')).toBe('~~old~~');
    });
  });

  describe('inserted()', () => {
    it('uses ++ extension', () => {
      expect(mode.inserted('new')).toBe('++new++');
    });
  });

  describe('superscript()', () => {
    it('uses single ^ markers', () => {
      expect(mode.superscript('2')).toBe('^2^');
    });
  });

  describe('subscript()', () => {
    it('uses single ~ markers', () => {
      expect(mode.subscript('2')).toBe('~2~');
    });
  });

  describe('code()', () => {
    it('wraps text with backticks', () => {
      expect(mode.code('const x')).toBe('`const x`');
    });
  });

  // ── Headings ────────────────────────────────────────────────

  describe('heading()', () => {
    it('produces ATX # for level 1', () => {
      expect(mode.heading('Title', 1)).toBe('# Title');
    });

    it('produces ## for level 2', () => {
      expect(mode.heading('Sub', 2)).toBe('## Sub');
    });

    it('produces ### for level 3', () => {
      expect(mode.heading('Section', 3)).toBe('### Section');
    });

    it('produces #### for level 4', () => {
      expect(mode.heading('Sub', 4)).toBe('#### Sub');
    });

    it('clamps at level 6 maximum', () => {
      const result = mode.heading('Deep', 7);
      expect(result.startsWith('######')).toBe(true);
    });

    it('clamps at level 1 minimum', () => {
      const result = mode.heading('Top', 0);
      expect(result.startsWith('# ')).toBe(true);
    });
  });

  // ── Links ────────────────────────────────────────────────────

  describe('link()', () => {
    it('produces standard Markdown link', () => {
      expect(mode.link('Nette', 'https://nette.org')).toBe('[Nette](https://nette.org)');
    });

    it('handles relative URLs', () => {
      expect(mode.link('page', '/about')).toBe('[page](/about)');
    });
  });

  // ── Images ──────────────────────────────────────────────────

  describe('image()', () => {
    it('produces standard Markdown image syntax', () => {
      expect(mode.image('Cat', 'cat.jpg')).toBe('![Cat](cat.jpg)');
    });

    it('handles empty alt text', () => {
      expect(mode.image('', 'photo.jpg')).toBe('![](photo.jpg)');
    });
  });

  // ── Code block ──────────────────────────────────────────────

  describe('codeBlock()', () => {
    it('wraps with triple-backtick fences', () => {
      const result = mode.codeBlock('const x = 1;');
      expect(result).toBe('```\nconst x = 1;\n```');
    });

    it('includes language specifier', () => {
      const result = mode.codeBlock('const x = 1;', 'javascript');
      expect(result).toBe('```javascript\nconst x = 1;\n```');
    });

    it('handles empty code', () => {
      const result = mode.codeBlock('');
      expect(result).toBe('```\n\n```');
    });

    it('handles language without code', () => {
      const result = mode.codeBlock('', 'python');
      expect(result).toBe('```python\n\n```');
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
    it('uses . not ) after number (standard Markdown)', () => {
      const result = mode.orderedList(['first', 'second', 'third']);
      expect(result).toBe('1. first\n2. second\n3. third');
    });

    it('handles single item', () => {
      expect(mode.orderedList(['only'])).toBe('1. only');
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
    it('returns ---', () => {
      expect(mode.horizontalRule()).toBe('---');
    });
  });

  // ── Table ────────────────────────────────────────────────────

  describe('table()', () => {
    it('returns empty string for empty rows', () => {
      expect(mode.table([])).toBe('');
    });

    it('produces GFM pipe table without header', () => {
      const result = mode.table([['A', 'B'], ['C', 'D']]);
      expect(result).toContain('| A | B |');
      expect(result).toContain('| C | D |');
    });

    it('inserts separator row after header when header=true', () => {
      const result = mode.table([['Name', 'Age'], ['Alice', '30']], true);
      const lines = result.split('\n');
      expect(lines[0]).toBe('| Name | Age |');
      expect(lines[1]).toBe('| --- | --- |');
      expect(lines[2]).toBe('| Alice | 30 |');
    });

    it('creates 3-column table correctly', () => {
      const result = mode.table([['H1', 'H2', 'H3'], ['a', 'b', 'c']], true);
      expect(result).toContain('| H1 | H2 | H3 |');
      expect(result).toContain('| --- | --- | --- |');
      expect(result).toContain('| a | b | c |');
    });

    it('produces table with single column', () => {
      const result = mode.table([['Only'], ['val']], true);
      expect(result).toContain('| Only |');
      expect(result).toContain('| --- |');
      expect(result).toContain('| val |');
    });
  });

  // ── Differences from TexyMode ────────────────────────────────

  describe('Markdown vs Texy differences', () => {
    it('deleted uses ~~ not --', () => {
      expect(mode.deleted('text')).not.toContain('--');
      expect(mode.deleted('text')).toContain('~~');
    });

    it('ordered list uses . not )', () => {
      expect(mode.orderedList(['a'])).toContain('1. a');
      expect(mode.orderedList(['a'])).not.toContain('1) a');
    });

    it('heading is ATX style (# prefix) not underline style', () => {
      const result = mode.heading('Test', 1);
      expect(result).toBe('# Test');
      expect(result).not.toContain('\n');
    });

    it('link uses [text](url) not "text":url', () => {
      const result = mode.link('click', 'https://example.com');
      expect(result).toBe('[click](https://example.com)');
    });

    it('image uses ![alt](url) not [* url .(alt) *]', () => {
      const result = mode.image('desc', 'img.png');
      expect(result).toBe('![desc](img.png)');
    });

    it('codeBlock uses backtick fences not /--code', () => {
      const result = mode.codeBlock('code', 'js');
      expect(result).toContain('```js');
      expect(result).not.toContain('/--');
    });
  });
});
