import type { SelectionState } from '../types';

/**
 * Textarea selection manager.
 * Provides methods to read, manipulate, and replace selected text
 * in a standard HTMLTextAreaElement without any external dependencies.
 */
export class Selection {
  constructor(private textarea: HTMLTextAreaElement) {}

  /** Detect the line-feed character used in the textarea value */
  get lf(): string {
    const val = this.textarea.value;
    if (val.includes('\r\n')) return '\r\n';
    if (val.includes('\r')) return '\r';
    return '\n';
  }

  /** Get current selection state snapshot */
  getState(): SelectionState {
    const { selectionStart: start, selectionEnd: end, value } = this.textarea;
    return {
      start,
      end,
      text: value.substring(start, end),
      before: value.substring(0, start),
      after: value.substring(end),
    };
  }

  /** Get selected text */
  text(): string {
    return this.getState().text;
  }

  /** Length of current selection */
  length(): number {
    return this.textarea.selectionEnd - this.textarea.selectionStart;
  }

  /** Whether selection is collapsed (cursor without selection) */
  isCursor(): boolean {
    return this.textarea.selectionStart === this.textarea.selectionEnd;
  }

  /** Set selection range programmatically */
  select(start: number, length: number): void {
    this.textarea.focus();
    this.textarea.setSelectionRange(start, start + length);
  }

  /** Place cursor at a specific position */
  setCursor(position: number): void {
    this.select(position, 0);
  }

  /**
   * Replace currently selected text with new content.
   * After replacement, the new text is selected.
   */
  replace(replacement: string): void {
    const state = this.getState();
    const scrollTop = this.textarea.scrollTop;

    this.textarea.value = state.before + replacement + state.after;
    this.select(state.start, replacement.length);
    this.textarea.scrollTop = scrollTop;

    this.dispatchInput();
  }

  /**
   * Wrap selection with prefix and suffix.
   * If nothing is selected (cursor), places cursor between prefix and suffix.
   */
  tag(prefix: string, suffix: string): void {
    const state = this.getState();
    const scrollTop = this.textarea.scrollTop;

    const newValue = state.before + prefix + state.text + suffix + state.after;
    this.textarea.value = newValue;

    if (this.isCursorAt(state)) {
      // Place cursor between prefix and suffix
      this.setCursor(state.start + prefix.length);
    } else {
      // Select the wrapped content (without prefix/suffix)
      this.select(state.start + prefix.length, state.text.length);
    }

    this.textarea.scrollTop = scrollTop;
    this.dispatchInput();
  }

  /**
   * Wrap selection as an inline phrase.
   * Trims trailing whitespace from selection before wrapping.
   */
  phrase(prefix: string, suffix?: string): void {
    this.trimSelect();
    this.tag(prefix, suffix ?? prefix);
  }

  /**
   * Remove trailing whitespace from the selection boundary.
   * Useful when double-clicking selects a trailing space.
   */
  trimSelect(): void {
    const state = this.getState();
    const trimmed = state.text.replace(/\s+$/, '');
    if (trimmed.length < state.text.length) {
      this.select(state.start, trimmed.length);
    }
  }

  /**
   * Expand selection to cover complete lines.
   * Useful for block-level operations (lists, headings).
   */
  selectBlock(): void {
    const { value } = this.textarea;
    let start = this.textarea.selectionStart;
    let end = this.textarea.selectionEnd;

    // Expand start to beginning of line
    while (start > 0 && value[start - 1] !== '\n') {
      start--;
    }

    // Expand end to end of line
    while (end < value.length && value[end] !== '\n') {
      end++;
    }

    this.select(start, end - start);
  }

  /** Get the full value of the textarea */
  getValue(): string {
    return this.textarea.value;
  }

  /** Set the full value of the textarea */
  setValue(value: string): void {
    this.textarea.value = value;
    this.dispatchInput();
  }

  /** Focus the textarea */
  focus(): void {
    this.textarea.focus();
  }

  /** Get the underlying textarea element */
  getElement(): HTMLTextAreaElement {
    return this.textarea;
  }

  private isCursorAt(state: SelectionState): boolean {
    return state.start === state.end;
  }

  private dispatchInput(): void {
    this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
