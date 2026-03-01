import { Selection } from './Selection';

/**
 * Texy markup insertion and toggle operations.
 * Each method manipulates the textarea selection to insert or toggle
 * Texy-formatted markup.
 */
export class TexyFormatter {
  constructor(private selection: Selection) {}

  // ── Inline Phrases ──────────────────────────────────────────

  bold(): void {
    this.selection.trimSelect();
    const text = this.selection.text();

    if (text.match(/^\*\*.*\*\*$/)) {
      this.selection.replace(text.substring(2, text.length - 2));
    } else {
      this.selection.tag('**', '**');
    }
  }

  italic(): void {
    this.selection.trimSelect();
    const text = this.selection.text();

    if (text.match(/^\*\*\*.*\*\*\*$/) || text.match(/^\*[^*]+\*$/)) {
      this.selection.replace(text.substring(1, text.length - 1));
    } else {
      this.selection.tag('*', '*');
    }
  }

  deleted(): void {
    this.toggleInline('--');
  }

  inserted(): void {
    this.toggleInline('++');
  }

  superscript(): void {
    this.toggleInline('^^');
  }

  subscript(): void {
    this.toggleInline('__');
  }

  inlineCode(): void {
    this.toggleInline('`');
  }

  noTexy(): void {
    this.selection.phrase("''", "''");
  }

  quoted(): void {
    this.selection.phrase('>>', '<<');
  }

  // ── Links & References ────────────────────────────────────────

  link(url: string, text?: string): void {
    if (!url) return;

    if (text) {
      this.selection.replace(`"${text}":${url}`);
    } else if (this.selection.isCursor()) {
      this.selection.replace(`"":${url}`);
      // Place cursor inside the quotes
      const state = this.selection.getState();
      this.selection.setCursor(state.start + 1);
    } else {
      this.selection.phrase('"', `":${url}`);
    }
  }

  acronym(title: string): void {
    if (!title) return;

    const text = this.selection.text();

    // Single word - no quotes needed: word((title))
    if (text.match(/^[\p{L}\p{N}]{2,}$/u)) {
      this.selection.tag('', `((${title}))`);
    } else {
      // Phrase - needs quotes: "phrase"((title))
      this.selection.phrase('"', `"((${title}))`);
    }
  }

  // ── Images ────────────────────────────────────────────────────

  image(src: string, alt?: string, align?: '<' | '>' | '<>' | '*', caption?: string): void {
    let markup = '';

    // Center alignment needs paragraph modifier
    if (align === '<>') {
      markup += this.selection.lf + '.<>' + this.selection.lf;
      align = '*';
    }

    markup += '[* ' + src + ' ';
    if (alt) markup += `.( ${alt}) `;
    markup += (align || '*') + ']';
    if (caption) markup += ' *** ' + caption;

    this.selection.replace(markup);
  }

  // ── Headings ──────────────────────────────────────────────────

  heading(level: 1 | 2 | 3 | 4): void {
    const underlineChars: Record<number, string> = { 1: '#', 2: '*', 3: '=', 4: '-' };
    const char = underlineChars[level];
    const lf = this.selection.lf;

    this.selection.selectBlock();

    if (this.selection.isCursor()) {
      return; // Need text or prompt - handled by toolbar action
    }

    const text = this.selection.text();
    const underline = char.repeat(Math.max(3, text.length));
    this.selection.tag('', lf + underline);
  }

  headingWithPrompt(level: 1 | 2 | 3 | 4, text: string): void {
    if (!text) return;
    const underlineChars: Record<number, string> = { 1: '#', 2: '*', 3: '=', 4: '-' };
    const char = underlineChars[level];
    const lf = this.selection.lf;
    const underline = char.repeat(Math.max(3, text.length));
    this.selection.tag(text + lf + underline + lf, '');
  }

  // ── Lists ─────────────────────────────────────────────────────

  unorderedList(): void {
    this.applyList('ul');
  }

  orderedList(): void {
    this.applyList('ol');
  }

  orderedListRoman(): void {
    this.applyList('romans');
  }

  orderedListRomanSmall(): void {
    this.applyList('smallRomans');
  }

  orderedListAlpha(): void {
    this.applyList('bigAlphabet');
  }

  orderedListAlphaSmall(): void {
    this.applyList('smallAlphabet');
  }

  blockquote(): void {
    this.applyList('bq');
  }

  // ── Indentation ───────────────────────────────────────────────

  indent(): void {
    this.applyList('indent');
  }

  unindent(): void {
    this.selection.selectBlock();
    const lf = this.selection.lf;
    const lines = this.selection.text().split(lf);

    const unindented = lines.map((line) => {
      const first = line[0];
      if (first === ' ' || first === '\t') {
        return line.substring(1);
      }
      return line;
    });

    this.selection.replace(unindented.join(lf));
  }

  // ── Alignment ─────────────────────────────────────────────────

  alignLeft(): void {
    this.insertAlignment('<');
  }

  alignRight(): void {
    this.insertAlignment('>');
  }

  alignCenter(): void {
    this.insertAlignment('<>');
  }

  alignJustify(): void {
    this.insertAlignment('=');
  }

  // ── Block Elements ────────────────────────────────────────────

  codeBlock(language?: string): void {
    const lf = this.selection.lf;
    const lang = language ? ' ' + language : '';
    this.selection.tag(`/--code${lang}${lf}`, `${lf}\\--`);
  }

  htmlBlock(): void {
    const lf = this.selection.lf;
    this.selection.tag(`/--html${lf}`, `${lf}\\--`);
  }

  divBlock(modifier?: string): void {
    const lf = this.selection.lf;
    const mod = modifier ? ` ${modifier}` : '';
    this.selection.tag(`/--div${mod}${lf}`, `${lf}\\--`);
  }

  textBlock(): void {
    const lf = this.selection.lf;
    this.selection.tag(`/--text${lf}`, `${lf}\\--`);
  }

  commentBlock(): void {
    const lf = this.selection.lf;
    this.selection.tag(`/--comment${lf}`, `${lf}\\--`);
  }

  horizontalRule(): void {
    const lf = this.selection.lf;
    const rule = `${lf}${lf}-------------------${lf}${lf}`;

    if (this.selection.isCursor()) {
      this.selection.tag(rule, '');
    } else {
      this.selection.replace(rule);
    }
  }

  // ── Tables ────────────────────────────────────────────────────

  table(cols: number, rows: number, header?: 'none' | 'top' | 'left'): void {
    const lf = this.selection.lf;
    let markup = lf;

    for (let i = 0; i < rows; i++) {
      // Top header separator
      if (header === 'top' && i === 1) {
        markup += '|';
        for (let j = 0; j < cols; j++) {
          markup += '--------';
        }
        markup += lf;
      }

      for (let j = 0; j < cols; j++) {
        if (header === 'left' && j === 0) {
          markup += '|* \t';
        } else {
          markup += '| \t';
        }
      }
      markup += '|' + lf;
    }
    markup += lf;

    this.selection.replace(markup);
  }

  // ── Modifiers ─────────────────────────────────────────────────

  colorModifier(color: string): void {
    this.selection.phrase(`"`, `" .{color: ${color}}`);
  }

  classModifier(className: string): void {
    this.selection.phrase(`"`, `" .[${className}]`);
  }

  // ── Symbols ───────────────────────────────────────────────────

  insertSymbol(symbol: string): void {
    if (this.selection.isCursor()) {
      this.selection.tag(symbol, '');
    } else {
      this.selection.replace(symbol);
    }
  }

  // ── Private Helpers ───────────────────────────────────────────

  private toggleInline(marker: string): void {
    this.selection.trimSelect();
    const text = this.selection.text();
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}.*${escaped}$`);

    if (regex.test(text)) {
      this.selection.replace(text.substring(marker.length, text.length - marker.length));
    } else {
      this.selection.tag(marker, marker);
    }
  }

  private applyList(type: string): void {
    this.selection.selectBlock();
    const lf = this.selection.lf;
    const lines = this.selection.text().split(lf);
    const lineCount = this.selection.isCursor() ? 3 : lines.length;

    const parts: string[] = [];
    for (let i = 1; i <= lineCount; i++) {
      const bullet = this.getBullet(type, i);
      const content = !this.selection.isCursor() ? lines[i - 1] : '';
      parts.push(bullet + ' ' + content);
    }

    if (this.selection.isCursor()) {
      // Place cursor after first bullet
      const firstLine = parts[0];
      const rest = parts.slice(1).join(lf);
      this.selection.tag(firstLine, lf + rest);
    } else {
      this.selection.replace(parts.join(lf));
    }
  }

  private getBullet(type: string, index: number): string {
    switch (type) {
      case 'ul': return '-';
      case 'ol': return index + ')';
      case 'bq': return '>';
      case 'indent': return '';
      case 'romans': return this.toRoman(index) + ')';
      case 'smallRomans': return this.toRoman(index).toLowerCase() + ')';
      case 'smallAlphabet': return this.toLetter(index) + ')';
      case 'bigAlphabet': return this.toLetter(index).toUpperCase() + ')';
      default: return '-';
    }
  }

  private toRoman(num: number): string {
    num = Math.min(num, 5999);
    const mill = ['', 'M', 'MM', 'MMM', 'MMMM', 'MMMMM'];
    const cent = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM'];
    const tens = ['', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC'];
    const ones = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

    const m = Math.floor(num / 1000);
    const c = Math.floor((num % 1000) / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;

    return mill[m] + cent[c] + tens[t] + ones[o];
  }

  private toLetter(n: number): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    return alphabet[Math.max(0, Math.min(n, 26) - 1)];
  }

  private insertAlignment(type: string): void {
    const value = this.selection.getValue();
    const start = this.selection.getState().start;
    const lf = this.selection.lf;
    const newPar = lf + lf;
    const prefix = '.' + type + lf;

    const found = value.substring(0, start).lastIndexOf(newPar);

    if (found === -1) {
      this.selection.setValue(prefix + value);
      this.selection.setCursor(start + prefix.length);
    } else {
      const beforePar = found + newPar.length;
      this.selection.setValue(
        value.substring(0, beforePar) + prefix + value.substring(beforePar)
      );
      this.selection.setCursor(start + prefix.length);
    }
  }
}
