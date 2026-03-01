export type ShortcutHandler = () => void;

interface ShortcutBinding {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  handler: ShortcutHandler;
}

const DEFAULT_SHORTCUTS: Record<string, string> = {
  'bold': 'Ctrl+B',
  'italic': 'Ctrl+I',
  'link': 'Ctrl+K',
  'undo': 'Ctrl+Z',
  'redo': 'Ctrl+Shift+Z',
  'submit': 'Ctrl+S',
  'fullscreen': 'F11',
  'indent': 'Tab',
  'unindent': 'Shift+Tab',
};

export class KeyboardManager {
  private bindings: ShortcutBinding[] = [];
  private boundHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    private textarea: HTMLTextAreaElement,
    private customShortcuts?: Record<string, string>,
  ) {}

  register(actionName: string, handler: ShortcutHandler): void {
    const shortcutStr = this.customShortcuts?.[actionName] ?? DEFAULT_SHORTCUTS[actionName];
    if (!shortcutStr) return;

    const binding = this.parseShortcut(shortcutStr);
    if (binding) {
      binding.handler = handler;
      this.bindings.push(binding);
    }
  }

  attach(): void {
    this.boundHandler = (e: KeyboardEvent) => this.handleKeydown(e);
    this.textarea.addEventListener('keydown', this.boundHandler);
  }

  detach(): void {
    if (this.boundHandler) {
      this.textarea.removeEventListener('keydown', this.boundHandler);
      this.boundHandler = null;
    }
    this.bindings = [];
  }

  private handleKeydown(e: KeyboardEvent): void {
    for (const binding of this.bindings) {
      const ctrlMatch = e.ctrlKey === binding.ctrl || e.metaKey === binding.ctrl;
      const shiftMatch = e.shiftKey === binding.shift;
      const altMatch = e.altKey === binding.alt;
      const keyMatch = e.key.toLowerCase() === binding.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        e.stopPropagation();
        binding.handler();
        return;
      }
    }
  }

  private parseShortcut(str: string): ShortcutBinding | null {
    const parts = str.split('+').map((p) => p.trim());
    if (parts.length === 0) return null;

    return {
      key: parts[parts.length - 1],
      ctrl: parts.some((p) => p.toLowerCase() === 'ctrl'),
      shift: parts.some((p) => p.toLowerCase() === 'shift'),
      alt: parts.some((p) => p.toLowerCase() === 'alt'),
      handler: () => {},
    };
  }
}
