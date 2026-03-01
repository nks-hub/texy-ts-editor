import { describe, it, expect } from 'vitest';
import { TexyParser } from '../src/parser/TexyParser';

function parse(input: string): string {
  return new TexyParser().parse(input);
}

function parseInline(input: string): string {
  return new TexyParser().parseInline(input);
}

// ── Inline phrases ────────────────────────────────────────

describe('TexyParser: inline phrases', () => {
  it('parses bold **text**', () => {
    expect(parseInline('**tučný**')).toContain('<strong>tučný</strong>');
  });

  it('parses italic *text*', () => {
    expect(parseInline('*kurzíva*')).toContain('<em>kurzíva</em>');
  });

  it('parses bold+italic ***text***', () => {
    const result = parseInline('***bold italic***');
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });

  it('parses deleted --text--', () => {
    expect(parseInline('--smazáno--')).toContain('<del>smazáno</del>');
  });

  it('parses inserted ++text++', () => {
    expect(parseInline('++vloženo++')).toContain('<ins>vloženo</ins>');
  });

  it('parses superscript ^^text^^', () => {
    expect(parseInline('^^horní^^')).toContain('<sup>horní</sup>');
  });

  it('parses subscript __text__', () => {
    expect(parseInline('__dolní__')).toContain('<sub>dolní</sub>');
  });

  it('parses inline code `text`', () => {
    expect(parseInline('`const x = 1`')).toContain('<code>const x = 1</code>');
  });

  it('parses quoted >>text<<', () => {
    expect(parseInline('>>citace<<')).toContain('<q>citace</q>');
  });

  it('does not parse bold inside code', () => {
    const result = parseInline('`**not bold**`');
    expect(result).toContain('<code>**not bold**</code>');
    expect(result).not.toContain('<strong>');
  });

  it('handles noTexy zones', () => {
    const result = parseInline("''**not bold**''");
    expect(result).not.toContain('<strong>');
    expect(result).toContain('**not bold**');
  });

  it('handles multiple inline phrases in one line', () => {
    const result = parseInline('**bold** and *italic* and `code`');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<code>code</code>');
  });
});

// ── Links ─────────────────────────────────────────────────

describe('TexyParser: links', () => {
  it('parses "text":URL link', () => {
    const result = parseInline('"Nette":https://nette.org');
    expect(result).toContain('<a href="https://nette.org">Nette</a>');
  });

  it('parses link with ftp', () => {
    const result = parseInline('"soubor":ftp://example.com/file');
    expect(result).toContain('<a href="ftp://example.com/file">soubor</a>');
  });

  it('parses link with mailto', () => {
    const result = parseInline('"email":mailto:test@example.com');
    expect(result).toContain('<a href="mailto:test@example.com">email</a>');
  });

  it('parses relative link', () => {
    const result = parseInline('"stránka":/about');
    expect(result).toContain('<a href="/about">stránka</a>');
  });

  it('auto-links bare URLs', () => {
    const result = parseInline('viz https://example.com tady');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('>https://example.com</a>');
  });

  it('auto-links www URLs', () => {
    const result = parseInline('viz www.example.com tady');
    expect(result).toContain('href="https://www.example.com"');
    expect(result).toContain('>www.example.com</a>');
  });

  it('disables auto-links when option is off', () => {
    const parser = new TexyParser({ enableAutolinks: false });
    const result = parser.parseInline('https://example.com');
    expect(result).not.toContain('<a');
  });
});

// ── Images ────────────────────────────────────────────────

describe('TexyParser: images', () => {
  it('parses simple image [* src *]', () => {
    const result = parseInline('[* image.jpg *]');
    expect(result).toContain('<img src="image.jpg"');
  });

  it('parses image with alt text', () => {
    const result = parseInline('[* photo.jpg .(Popisek) *]');
    expect(result).toContain('alt="Popisek"');
  });

  it('parses left-aligned image', () => {
    const result = parseInline('[* photo.jpg <]');
    expect(result).toContain('float:left');
  });

  it('parses right-aligned image', () => {
    const result = parseInline('[* photo.jpg >]');
    expect(result).toContain('float:right');
  });
});

// ── Acronyms ──────────────────────────────────────────────

describe('TexyParser: acronyms', () => {
  it('parses word((title))', () => {
    const result = parseInline('HTML((HyperText Markup Language))');
    expect(result).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
  });

  it('parses multiple acronyms', () => {
    const result = parseInline('CSS((Cascading Style Sheets)) a HTML((HyperText Markup Language))');
    expect(result).toContain('<abbr title="Cascading Style Sheets">CSS</abbr>');
    expect(result).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
  });
});

// ── Modifiers ─────────────────────────────────────────────

describe('TexyParser: inline modifiers', () => {
  it('parses "text" .{color: red}', () => {
    const result = parseInline('"červený" .{color: red}');
    expect(result).toContain('style="color: red"');
    expect(result).toContain('červený');
  });

  it('parses "text" .[class]', () => {
    const result = parseInline('"test" .[highlight]');
    expect(result).toContain('class="highlight"');
  });
});

// ── Typography ────────────────────────────────────────────

describe('TexyParser: typography', () => {
  it('converts ... to ellipsis', () => {
    const result = parseInline('bla bla...');
    expect(result).toContain('\u2026');
  });

  it('converts --- to em dash', () => {
    const result = parseInline('text---more');
    expect(result).toContain('\u2014');
  });

  it('converts -- to en dash between words', () => {
    const result = parseInline('10 -- 20');
    expect(result).toContain('\u2013');
  });

  it('converts (tm) to trademark', () => {
    expect(parseInline('Brand(tm)')).toContain('\u2122');
  });

  it('converts (c) to copyright', () => {
    expect(parseInline('(c) 2025')).toContain('\u00A9');
  });

  it('converts (r) to registered', () => {
    expect(parseInline('Brand(r)')).toContain('\u00AE');
  });

  it('converts --> to right arrow', () => {
    expect(parseInline('A --> B')).toContain('\u2192');
  });

  it('converts <-- to left arrow', () => {
    expect(parseInline('A <-- B')).toContain('\u2190');
  });

  it('converts <-> to left-right arrow', () => {
    expect(parseInline('A <-> B')).toContain('\u2194');
  });

  it('converts ==> to double right arrow', () => {
    expect(parseInline('A ==> B')).toContain('\u21D2');
  });

  it('converts multiplication sign', () => {
    expect(parseInline('10x20')).toContain('\u00D7');
  });

  it('disables typography when option is off', () => {
    const parser = new TexyParser({ enableTypography: false });
    const result = parser.parseInline('test...');
    expect(result).not.toContain('\u2026');
    expect(result).toContain('...');
  });
});

// ── Headings ──────────────────────────────────────────────

describe('TexyParser: headings', () => {
  it('parses h1 with ### underline', () => {
    const result = parse('Nadpis\n######');
    expect(result).toContain('<h1>');
    expect(result).toContain('Nadpis');
    expect(result).toContain('</h1>');
  });

  it('parses h2 with *** underline', () => {
    const result = parse('Podnadpis\n*********');
    expect(result).toContain('<h2>');
    expect(result).toContain('Podnadpis');
  });

  it('parses h3 with === underline', () => {
    const result = parse('Sekce\n=====');
    expect(result).toContain('<h3>');
    expect(result).toContain('Sekce');
  });

  it('parses h4 with --- underline', () => {
    const result = parse('Podsekce\n--------');
    expect(result).toContain('<h4>');
    expect(result).toContain('Podsekce');
  });

  it('parses surrounded heading === Nadpis ===', () => {
    const result = parse('=== Nadpis ===');
    expect(result).toContain('<h3>');
    expect(result).toContain('Nadpis');
  });

  it('inline markup in headings', () => {
    const result = parse('**Tučný** nadpis\n######');
    expect(result).toContain('<h1>');
    expect(result).toContain('<strong>Tučný</strong>');
  });
});

// ── Lists ─────────────────────────────────────────────────

describe('TexyParser: lists', () => {
  it('parses unordered list with -', () => {
    const result = parse('- první\n- druhý\n- třetí');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
    expect(result).toContain('první');
    expect(result).toContain('druhý');
    expect(result).toContain('třetí');
    expect(result).toContain('</ul>');
  });

  it('parses unordered list with *', () => {
    const result = parse('* a\n* b');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });

  it('parses ordered list with 1)', () => {
    const result = parse('1) první\n2) druhý\n3) třetí');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>');
  });

  it('parses ordered list with a)', () => {
    const result = parse('a) alfa\nb) beta');
    expect(result).toContain('<ol');
    expect(result).toContain('type="a"');
  });

  it('parses ordered list with A)', () => {
    const result = parse('A) alfa\nB) beta');
    expect(result).toContain('<ol');
    expect(result).toContain('type="A"');
  });

  it('handles inline formatting in list items', () => {
    const result = parse('- **bold item**\n- *italic item*');
    expect(result).toContain('<strong>bold item</strong>');
    expect(result).toContain('<em>italic item</em>');
  });
});

// ── Blockquotes ───────────────────────────────────────────

describe('TexyParser: blockquotes', () => {
  it('parses single-line blockquote', () => {
    const result = parse('> Citace textu');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('Citace textu');
    expect(result).toContain('</blockquote>');
  });

  it('parses multi-line blockquote', () => {
    const result = parse('> první řádek\n> druhý řádek');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('první řádek');
    expect(result).toContain('druhý řádek');
  });

  it('handles inline formatting in blockquotes', () => {
    const result = parse('> **důležitý** text');
    expect(result).toContain('<strong>důležitý</strong>');
  });
});

// ── Code blocks ───────────────────────────────────────────

describe('TexyParser: code blocks', () => {
  it('parses code block without language', () => {
    const result = parse('/--code\nconst x = 1;\n\\--');
    expect(result).toContain('<pre><code>');
    expect(result).toContain('const x = 1;');
    expect(result).toContain('</code></pre>');
  });

  it('parses code block with language', () => {
    const result = parse('/--code javascript\nconst x = 1;\n\\--');
    expect(result).toContain('class="language-javascript"');
    expect(result).toContain('const x = 1;');
  });

  it('escapes HTML in code blocks', () => {
    const result = parse('/--code html\n<div class="test">\n\\--');
    expect(result).toContain('&lt;div class=&quot;test&quot;&gt;');
    expect(result).not.toContain('<div class="test">');
  });

  it('preserves whitespace in code blocks', () => {
    const result = parse('/--code\n  indented\n    more indented\n\\--');
    expect(result).toContain('  indented');
    expect(result).toContain('    more indented');
  });
});

// ── HTML blocks ───────────────────────────────────────────

describe('TexyParser: HTML blocks', () => {
  it('passes HTML through as-is', () => {
    const result = parse('/--html\n<div class="custom"><p>HTML</p></div>\n\\--');
    expect(result).toContain('<div class="custom"><p>HTML</p></div>');
  });
});

// ── Div blocks ────────────────────────────────────────────

describe('TexyParser: div blocks', () => {
  it('wraps content in div', () => {
    const result = parse('/--div\nObsah bloku\n\\--');
    expect(result).toContain('<div>');
    expect(result).toContain('Obsah bloku');
    expect(result).toContain('</div>');
  });

  it('applies modifier to div', () => {
    const result = parse('/--div .[highlight]\ntext\n\\--');
    expect(result).toContain('class="highlight"');
  });
});

// ── Text blocks ───────────────────────────────────────────

describe('TexyParser: text blocks', () => {
  it('wraps content in pre', () => {
    const result = parse('/--text\npreformátovaný text\n\\--');
    expect(result).toContain('<pre>');
    expect(result).toContain('preformátovaný text');
    expect(result).toContain('</pre>');
  });
});

// ── Comment blocks ────────────────────────────────────────

describe('TexyParser: comment blocks', () => {
  it('produces HTML comment', () => {
    const result = parse('/--comment\ntoto je komentář\n\\--');
    expect(result).toContain('<!-- comment -->');
    expect(result).not.toContain('toto je komentář');
  });
});

// ── Tables ────────────────────────────────────────────────

describe('TexyParser: tables', () => {
  it('parses simple table', () => {
    const result = parse('| A | B |\n| C | D |');
    expect(result).toContain('<table>');
    expect(result).toContain('<td>A</td>');
    expect(result).toContain('<td>B</td>');
    expect(result).toContain('<td>C</td>');
    expect(result).toContain('<td>D</td>');
    expect(result).toContain('</table>');
  });

  it('parses table with header row', () => {
    const result = parse('|* Jméno |* Věk |\n|--------\n| Jan | 30 |');
    expect(result).toContain('<thead>');
    expect(result).toContain('<th>Jméno</th>');
    expect(result).toContain('<th>Věk</th>');
    expect(result).toContain('<tbody>');
    expect(result).toContain('<td>Jan</td>');
    expect(result).toContain('<td>30</td>');
  });

  it('parses table with left header', () => {
    const result = parse('|* Řádek 1 | data |\n|* Řádek 2 | data |');
    expect(result).toContain('<th>Řádek 1</th>');
    expect(result).toContain('<td>data</td>');
  });

  it('handles inline formatting in cells', () => {
    const result = parse('| text **bold** | text *italic* |');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });
});

// ── Horizontal rule ───────────────────────────────────────

describe('TexyParser: horizontal rule', () => {
  it('parses --- as hr', () => {
    const result = parse('text\n\n---\n\nmore');
    expect(result).toContain('<hr>');
  });

  it('parses longer dashes as hr', () => {
    const result = parse('-------------------');
    expect(result).toContain('<hr>');
  });

  it('parses *** as hr', () => {
    expect(parse('***')).toContain('<hr>');
  });
});

// ── Paragraphs ────────────────────────────────────────────

describe('TexyParser: paragraphs', () => {
  it('wraps text in <p>', () => {
    const result = parse('Jednoduchý odstavec.');
    expect(result).toBe('<p>Jednoduchý odstavec.</p>');
  });

  it('creates separate paragraphs from double newlines', () => {
    const result = parse('První odstavec.\n\nDruhý odstavec.');
    expect(result).toContain('<p>První odstavec.</p>');
    expect(result).toContain('<p>Druhý odstavec.</p>');
  });

  it('converts single newline to <br>', () => {
    const result = parse('řádek 1\nřádek 2');
    expect(result).toContain('<br>');
  });

  it('handles paragraph alignment modifier', () => {
    const result = parse('.<>\nCentrovaný text');
    expect(result).toContain('text-align:center');
  });

  it('handles right alignment', () => {
    const result = parse('.>\nVpravo');
    expect(result).toContain('text-align:right');
  });
});

// ── Mixed content ─────────────────────────────────────────

describe('TexyParser: mixed content', () => {
  it('parses heading + paragraph', () => {
    const result = parse('Nadpis\n######\n\nOdstavec textu.');
    expect(result).toContain('<h1>');
    expect(result).toContain('<p>Odstavec textu.</p>');
  });

  it('parses list after paragraph', () => {
    const result = parse('Text:\n\n- item 1\n- item 2');
    expect(result).toContain('<p>Text:</p>');
    expect(result).toContain('<ul>');
  });

  it('parses code block after paragraph', () => {
    const result = parse('Ukázka:\n\n/--code javascript\nconst x = 1;\n\\--');
    expect(result).toContain('<p>Ukázka:</p>');
    expect(result).toContain('<pre><code');
  });

  it('parses full document', () => {
    const doc = [
      'Hlavní nadpis',
      '##############',
      '',
      'Úvodní **tučný** a *kurzíva* text.',
      '',
      '- první',
      '- druhý',
      '- třetí',
      '',
      '"Odkaz na Nette":https://nette.org',
      '',
      '> Citace z textu',
      '',
      '/--code javascript',
      'const editor = new TexyEditor();',
      '\\--',
    ].join('\n');

    const result = parse(doc);
    expect(result).toContain('<h1>');
    expect(result).toContain('<strong>tučný</strong>');
    expect(result).toContain('<em>kurzíva</em>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<a href="https://nette.org">Odkaz na Nette</a>');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('<pre><code');
  });

  it('handles empty input', () => {
    expect(parse('')).toBe('');
    expect(parse('  ')).toBe('');
    expect(parse('\n\n')).toBe('');
  });
});

// ── Custom rules ──────────────────────────────────────────

describe('TexyParser: custom rules', () => {
  it('applies custom block rule', () => {
    const parser = new TexyParser({
      rules: [{
        name: 'custom-block',
        priority: 10,
        block: (text) => text.replace(/\[\[note\]\]([\s\S]*?)\[\[\/note\]\]/g, '!!!NOTE: $1!!!'),
      }],
    });
    const result = parser.parse('[[note]]důležité[[/note]]');
    expect(result).toContain('!!!NOTE: důležité!!!');
  });

  it('applies custom inline rule', () => {
    const parser = new TexyParser({
      rules: [{
        name: 'custom-inline',
        priority: 10,
        inline: (text) => text.replace(/@@(\w+)/g, '[@$1]'),
      }],
    });
    const result = parser.parseInline('Ahoj @@Karel');
    expect(result).toContain('[@Karel]');
  });
});

// ── Edge cases ────────────────────────────────────────────

describe('TexyParser: edge cases', () => {
  it('escapes HTML in paragraphs', () => {
    const result = parse('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('handles unclosed bold', () => {
    const result = parseInline('**unclosed bold');
    // Should not crash, text is preserved
    expect(result).toContain('**unclosed bold');
  });

  it('handles unclosed code block', () => {
    const result = parse('/--code\nunclosed code');
    // Should still produce output
    expect(result).toBeTruthy();
  });

  it('handles deeply nested markup', () => {
    const result = parseInline('**bold *italic* bold**');
    expect(result).toContain('<strong>');
  });

  it('handles special characters in URLs', () => {
    const result = parseInline('"link":https://example.com/path?a=1&b=2');
    expect(result).toContain('href="https://example.com/path?a=1&amp;b=2"');
  });
});
