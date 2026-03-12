import { Selection } from './Selection';
import type { SyntaxMode } from '../modes/SyntaxMode';
import { TexyMode } from '../modes/TexyMode';

/**
 * Markup insertion and toggle operations.
 * Delegates ALL syntax decisions to the active SyntaxMode.
 * Contains zero hardcoded syntax — only selection manipulation logic.
 */
export class TexyFormatter {
  private mode: SyntaxMode;

  constructor(private selection: Selection, mode?: SyntaxMode) {
    this.mode = mode ?? new TexyMode();
  }

  setMode(mode: SyntaxMode): void {
    this.mode = mode;
  }

  getMode(): SyntaxMode {
    return this.mode;
  }

  // ── Inline Phrases ──────────────────────────────────────────

  bold(): void {
    this.toggleInline(this.mode.markers.bold);
  }

  italic(): void {
    this.toggleInline(this.mode.markers.italic);
  }

  deleted(): void {
    this.toggleInline(this.mode.markers.deleted);
  }

  inserted(): void {
    this.toggleInline(this.mode.markers.inserted);
  }

  superscript(): void {
    this.toggleInline(this.mode.markers.superscript);
  }

  subscript(): void {
    this.toggleInline(this.mode.markers.subscript);
  }

  inlineCode(): void {
    this.toggleInline(this.mode.markers.code);
  }

  highlight(): void {
    this.toggleInline(this.mode.markers.highlight);
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
      this.selection.replace(this.mode.link(text, url));
    } else if (this.selection.isCursor()) {
      this.selection.replace(this.mode.linkEmpty(url));
      const state = this.selection.getState();
      this.selection.setCursor(state.start + this.mode.linkCursorOffset());
    } else {
      this.selection.phrase(
        this.mode.linkPhrasePrefix(),
        this.mode.linkPhraseSuffix(url),
      );
    }
  }

  acronym(title: string): void {
    if (!title) return;
    const text = this.selection.text();
    const result = this.mode.acronym(text, title);

    if (result) {
      this.selection.replace(result);
    }
  }

  // ── Images ────────────────────────────────────────────────────

  image(
    src: string,
    alt?: string,
    align?: '<' | '>' | '<>' | '*',
    options?: { width?: number; height?: number; caption?: string; link?: string },
  ): void {
    const markup = this.mode.imageWithOptions(src, alt, align, options);
    this.selection.replace(markup);
  }

  // ── Headings ──────────────────────────────────────────────────

  heading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
    this.selection.selectBlock();

    if (this.selection.isCursor()) {
      return; // Need text or prompt — handled by toolbar action
    }

    const text = this.selection.text();
    this.selection.replace(this.mode.heading(text, level));
  }

  headingWithPrompt(level: 1 | 2 | 3 | 4 | 5 | 6, text: string): void {
    if (!text) return;
    const lf = this.selection.lf;
    this.selection.tag(this.mode.heading(text, level) + lf, '');
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

  taskList(): void {
    this.applyList('taskList');
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

  alignLeft(): void { this.insertAlignment('<'); }
  alignRight(): void { this.insertAlignment('>'); }
  alignCenter(): void { this.insertAlignment('<>'); }
  alignJustify(): void { this.insertAlignment('='); }

  // ── Block Elements ────────────────────────────────────────────

  codeBlock(language?: string): void {
    const wrap = this.mode.codeBlockWrap(language);
    this.selection.tag(wrap.open, wrap.close);
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
    const rule = `${lf}${lf}${this.mode.horizontalRule()}${lf}${lf}`;

    if (this.selection.isCursor()) {
      this.selection.tag(rule, '');
    } else {
      this.selection.replace(rule);
    }
  }

  // ── Tables ────────────────────────────────────────────────────

  table(cols: number, rows: number, header?: 'none' | 'top' | 'left'): void {
    const lf = this.selection.lf;
    const markup = lf + this.mode.tableGrid(cols, rows, header) + lf;
    this.selection.replace(markup);
  }

  // ── Modifiers ─────────────────────────────────────────────────

  colorModifier(color: string): void {
    const text = this.selection.text();
    const result = this.mode.colorModifier(text, color);
    if (result !== text) {
      this.selection.replace(result);
    } else {
      // Mode doesn't support modifiers — wrap as plain phrase
      this.selection.phrase(this.mode.linkPhrasePrefix(), this.mode.linkPhraseSuffix(''));
    }
  }

  classModifier(className: string): void {
    const text = this.selection.text();
    const result = this.mode.classModifier(text, className);
    if (result !== text) {
      this.selection.replace(result);
    }
  }

  // ── Footnotes ────────────────────────────────────────────────

  footnote(id: string, text: string): void {
    const lf = this.selection.lf;
    const ref = this.mode.footnoteRef(id);
    const def = this.mode.footnoteDefinition(id, text);

    if (this.selection.isCursor()) {
      // Insert reference at cursor, definition at end
      this.selection.tag(ref, '');
      if (def) {
        const value = this.selection.getValue();
        this.selection.setValue(value + lf + lf + def);
      }
    } else {
      // Wrap selection as footnote text
      const selectedText = this.selection.text();
      this.selection.replace(ref);
      if (def) {
        const value = this.selection.getValue();
        this.selection.setValue(value + lf + lf + this.mode.footnoteDefinition(id, selectedText));
      }
    }
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
      case 'ol': return this.mode.orderedBullet(index);
      case 'bq': return '>';
      case 'taskList': return '- [ ]';
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
    if (!this.mode.supportsModifiers()) return;

    const value = this.selection.getValue();
    const start = this.selection.getState().start;
    const lf = this.selection.lf;
    const newPar = lf + lf;
    const prefix = this.mode.alignmentPrefix(type);

    if (!prefix) return;

    const found = value.substring(0, start).lastIndexOf(newPar);

    if (found === -1) {
      this.selection.setValue(prefix + value);
      this.selection.setCursor(start + prefix.length);
    } else {
      const beforePar = found + newPar.length;
      this.selection.setValue(
        value.substring(0, beforePar) + prefix + value.substring(beforePar),
      );
      this.selection.setCursor(start + prefix.length);
    }
  }
}
