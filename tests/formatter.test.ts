import { describe, it, expect, beforeEach } from 'vitest';
import { Selection } from '../src/core/Selection';
import { TexyFormatter } from '../src/core/TexyFormatter';

describe('TexyFormatter', () => {
  let textarea: HTMLTextAreaElement;
  let sel: Selection;
  let fmt: TexyFormatter;

  beforeEach(() => {
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    sel = new Selection(textarea);
    fmt = new TexyFormatter(sel);
  });

  // ── Bold ──────────────────────────────────────────────

  describe('bold()', () => {
    it('wraps selected text with **', () => {
      textarea.value = 'Hello World';
      textarea.setSelectionRange(6, 11); // "World"
      fmt.bold();
      expect(textarea.value).toBe('Hello **World**');
    });

    it('removes ** from already bold text', () => {
      textarea.value = 'Hello **World**';
      textarea.setSelectionRange(6, 15); // "**World**"
      fmt.bold();
      expect(textarea.value).toBe('Hello World');
    });

    it('inserts ** at cursor position', () => {
      textarea.value = 'Hello';
      textarea.setSelectionRange(5, 5);
      fmt.bold();
      expect(textarea.value).toBe('Hello****');
    });
  });

  // ── Italic ────────────────────────────────────────────

  describe('italic()', () => {
    it('wraps selected text with *', () => {
      textarea.value = 'Hello World';
      textarea.setSelectionRange(6, 11);
      fmt.italic();
      expect(textarea.value).toBe('Hello *World*');
    });

    it('removes * from already italic text', () => {
      textarea.value = 'Hello *World*';
      textarea.setSelectionRange(6, 13); // "*World*"
      fmt.italic();
      expect(textarea.value).toBe('Hello World');
    });
  });

  // ── Deleted ───────────────────────────────────────────

  describe('deleted()', () => {
    it('wraps with --', () => {
      textarea.value = 'test text';
      textarea.setSelectionRange(5, 9); // "text"
      fmt.deleted();
      expect(textarea.value).toBe('test --text--');
    });

    it('removes -- from already deleted text', () => {
      textarea.value = 'test --text--';
      textarea.setSelectionRange(5, 13); // "--text--"
      fmt.deleted();
      expect(textarea.value).toBe('test text');
    });
  });

  // ── Inserted ──────────────────────────────────────────

  describe('inserted()', () => {
    it('wraps with ++', () => {
      textarea.value = 'new text';
      textarea.setSelectionRange(4, 8);
      fmt.inserted();
      expect(textarea.value).toBe('new ++text++');
    });
  });

  // ── Superscript / Subscript ───────────────────────────

  describe('superscript()', () => {
    it('wraps with ^^', () => {
      textarea.value = 'x2';
      textarea.setSelectionRange(1, 2);
      fmt.superscript();
      expect(textarea.value).toBe('x^^2^^');
    });
  });

  describe('subscript()', () => {
    it('wraps with __', () => {
      textarea.value = 'H2O';
      textarea.setSelectionRange(1, 2);
      fmt.subscript();
      expect(textarea.value).toBe('H__2__O');
    });
  });

  // ── Inline code ───────────────────────────────────────

  describe('inlineCode()', () => {
    it('wraps with `', () => {
      textarea.value = 'use const';
      textarea.setSelectionRange(4, 9);
      fmt.inlineCode();
      expect(textarea.value).toBe('use `const`');
    });

    it('removes ` from already code text', () => {
      textarea.value = 'use `const`';
      textarea.setSelectionRange(4, 11); // "`const`"
      fmt.inlineCode();
      expect(textarea.value).toBe('use const');
    });
  });

  // ── Link ──────────────────────────────────────────────

  describe('link()', () => {
    it('creates link with text and URL', () => {
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fmt.link('https://nette.org', 'Nette');
      expect(textarea.value).toContain('"Nette":https://nette.org');
    });

    it('wraps selection as link text', () => {
      textarea.value = 'visit Nette here';
      textarea.setSelectionRange(6, 11); // "Nette"
      fmt.link('https://nette.org');
      expect(textarea.value).toContain('"Nette":https://nette.org');
    });

    it('does nothing with empty URL', () => {
      textarea.value = 'test';
      textarea.setSelectionRange(0, 4);
      fmt.link('');
      expect(textarea.value).toBe('test');
    });
  });

  // ── Image ─────────────────────────────────────────────

  describe('image()', () => {
    it('creates simple image', () => {
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fmt.image('photo.jpg');
      expect(textarea.value).toContain('[* photo.jpg *]');
    });

    it('creates image with alt text', () => {
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fmt.image('photo.jpg', 'Popisek');
      expect(textarea.value).toContain('[* photo.jpg .( Popisek) *]');
    });

    it('creates left-aligned image', () => {
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fmt.image('photo.jpg', undefined, '<');
      expect(textarea.value).toContain('[* photo.jpg <]');
    });

    it('creates right-aligned image', () => {
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fmt.image('photo.jpg', undefined, '>');
      expect(textarea.value).toContain('[* photo.jpg >]');
    });
  });

  // ── Heading ───────────────────────────────────────────

  describe('heading()', () => {
    it('adds # underline for h1', () => {
      textarea.value = 'Nadpis';
      textarea.setSelectionRange(0, 6);
      fmt.heading(1);
      expect(textarea.value).toContain('######');
    });

    it('adds * underline for h2', () => {
      textarea.value = 'Nadpis';
      textarea.setSelectionRange(0, 6);
      fmt.heading(2);
      expect(textarea.value).toContain('******');
    });

    it('adds = underline for h3', () => {
      textarea.value = 'Nadpis';
      textarea.setSelectionRange(0, 6);
      fmt.heading(3);
      expect(textarea.value).toContain('======');
    });

    it('adds - underline for h4', () => {
      textarea.value = 'Nadpis';
      textarea.setSelectionRange(0, 6);
      fmt.heading(4);
      expect(textarea.value).toContain('------');
    });
  });

  describe('headingWithPrompt()', () => {
    it('inserts heading text with underline', () => {
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fmt.headingWithPrompt(1, 'Test');
      expect(textarea.value).toContain('Test');
      expect(textarea.value).toContain('####');
    });

    it('does nothing with empty text', () => {
      textarea.value = 'original';
      textarea.setSelectionRange(0, 0);
      fmt.headingWithPrompt(1, '');
      expect(textarea.value).toBe('original');
    });
  });

  // ── Lists ─────────────────────────────────────────────

  describe('unorderedList()', () => {
    it('prepends - to selected lines', () => {
      textarea.value = 'první\ndruhý\ntřetí';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.unorderedList();
      expect(textarea.value).toContain('- první');
      expect(textarea.value).toContain('- druhý');
      expect(textarea.value).toContain('- třetí');
    });
  });

  describe('orderedList()', () => {
    it('prepends numbered bullets', () => {
      textarea.value = 'první\ndruhý';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.orderedList();
      expect(textarea.value).toContain('1) první');
      expect(textarea.value).toContain('2) druhý');
    });
  });

  describe('blockquote()', () => {
    it('prepends > to lines', () => {
      textarea.value = 'citace\ntext';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.blockquote();
      expect(textarea.value).toContain('> citace');
      expect(textarea.value).toContain('> text');
    });
  });

  // ── Code block ────────────────────────────────────────

  describe('codeBlock()', () => {
    it('wraps with /--code and \\--', () => {
      textarea.value = 'const x = 1;';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.codeBlock();
      expect(textarea.value).toContain('/--code');
      expect(textarea.value).toContain('const x = 1;');
      expect(textarea.value).toContain('\\--');
    });

    it('includes language', () => {
      textarea.value = 'const x = 1;';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.codeBlock('javascript');
      expect(textarea.value).toContain('/--code javascript');
    });
  });

  // ── Horizontal rule ───────────────────────────────────

  describe('horizontalRule()', () => {
    it('inserts dashes', () => {
      textarea.value = 'text';
      textarea.setSelectionRange(4, 4);
      fmt.horizontalRule();
      expect(textarea.value).toContain('---');
    });
  });

  // ── Table ─────────────────────────────────────────────

  describe('table()', () => {
    it('creates a 3x3 table', () => {
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fmt.table(3, 3, 'top');
      expect(textarea.value).toContain('|');
      // Should have separator row after first row
      expect(textarea.value).toContain('|---');
    });

    it('creates left header table', () => {
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fmt.table(2, 2, 'left');
      expect(textarea.value).toContain('|*');
    });
  });

  // ── Modifiers ─────────────────────────────────────────

  describe('colorModifier()', () => {
    it('wraps with color style', () => {
      textarea.value = 'red text';
      textarea.setSelectionRange(0, 8);
      fmt.colorModifier('red');
      expect(textarea.value).toContain('.{color: red}');
    });
  });

  describe('classModifier()', () => {
    it('wraps with class', () => {
      textarea.value = 'styled text';
      textarea.setSelectionRange(0, 11);
      fmt.classModifier('highlight');
      expect(textarea.value).toContain('.[highlight]');
    });
  });

  // ── Symbol ────────────────────────────────────────────

  describe('insertSymbol()', () => {
    it('inserts symbol at cursor', () => {
      textarea.value = 'text';
      textarea.setSelectionRange(4, 4);
      fmt.insertSymbol('€');
      expect(textarea.value).toContain('€');
    });

    it('replaces selection with symbol', () => {
      textarea.value = 'text';
      textarea.setSelectionRange(0, 4);
      fmt.insertSymbol('€');
      expect(textarea.value).toBe('€');
    });
  });

  // ── Indent / Unindent ─────────────────────────────────

  describe('indent()', () => {
    it('inserts blank prefix for indentation', () => {
      textarea.value = 'test';
      textarea.setSelectionRange(0, 4);
      fmt.indent();
      // applyList with 'indent' produces '' bullet + ' ' + content
      expect(textarea.value).toContain(' test');
    });
  });

  describe('unindent()', () => {
    it('removes leading space', () => {
      textarea.value = ' indented';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.unindent();
      expect(textarea.value).toBe('indented');
    });

    it('removes leading tab', () => {
      textarea.value = '\tindented';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.unindent();
      expect(textarea.value).toBe('indented');
    });

    it('does nothing if not indented', () => {
      textarea.value = 'not indented';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.unindent();
      expect(textarea.value).toBe('not indented');
    });
  });

  // ── Alignment ─────────────────────────────────────────

  describe('alignment', () => {
    it('alignLeft inserts .< modifier', () => {
      textarea.value = 'text';
      textarea.setSelectionRange(0, 0);
      fmt.alignLeft();
      expect(textarea.value).toContain('.<');
    });

    it('alignRight inserts .> modifier', () => {
      textarea.value = 'text';
      textarea.setSelectionRange(0, 0);
      fmt.alignRight();
      expect(textarea.value).toContain('.>');
    });

    it('alignCenter inserts .<> modifier', () => {
      textarea.value = 'text';
      textarea.setSelectionRange(0, 0);
      fmt.alignCenter();
      expect(textarea.value).toContain('.<>');
    });

    it('alignJustify inserts .= modifier', () => {
      textarea.value = 'text';
      textarea.setSelectionRange(0, 0);
      fmt.alignJustify();
      expect(textarea.value).toContain('.=');
    });
  });

  // ── Special blocks ────────────────────────────────────

  describe('htmlBlock()', () => {
    it('wraps with /--html and \\--', () => {
      textarea.value = '<div>test</div>';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.htmlBlock();
      expect(textarea.value).toContain('/--html');
      expect(textarea.value).toContain('\\--');
    });
  });

  describe('divBlock()', () => {
    it('wraps with /--div and \\--', () => {
      textarea.value = 'content';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.divBlock();
      expect(textarea.value).toContain('/--div');
    });

    it('includes modifier', () => {
      textarea.value = 'content';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.divBlock('.[my-class]');
      expect(textarea.value).toContain('/--div .[my-class]');
    });
  });

  describe('textBlock()', () => {
    it('wraps with /--text and \\--', () => {
      textarea.value = 'preformatted';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.textBlock();
      expect(textarea.value).toContain('/--text');
    });
  });

  describe('commentBlock()', () => {
    it('wraps with /--comment and \\--', () => {
      textarea.value = 'hidden';
      textarea.setSelectionRange(0, textarea.value.length);
      fmt.commentBlock();
      expect(textarea.value).toContain('/--comment');
    });
  });

  // ── Acronym ───────────────────────────────────────────

  describe('acronym()', () => {
    it('adds ((title)) for single word', () => {
      textarea.value = 'HTML';
      textarea.setSelectionRange(0, 4);
      fmt.acronym('HyperText Markup Language');
      expect(textarea.value).toContain('HTML((HyperText Markup Language))');
    });

    it('does nothing with empty title', () => {
      textarea.value = 'HTML';
      textarea.setSelectionRange(0, 4);
      fmt.acronym('');
      expect(textarea.value).toBe('HTML');
    });
  });

  // ── Quoted / NoTexy ───────────────────────────────────

  describe('quoted()', () => {
    it('wraps with >> and <<', () => {
      textarea.value = 'quoted text';
      textarea.setSelectionRange(0, 11);
      fmt.quoted();
      expect(textarea.value).toContain('>>quoted text<<');
    });
  });

  describe('noTexy()', () => {
    it("wraps with '' and ''", () => {
      textarea.value = '**not bold**';
      textarea.setSelectionRange(0, 12);
      fmt.noTexy();
      expect(textarea.value).toContain("''**not bold**''");
    });
  });
});
