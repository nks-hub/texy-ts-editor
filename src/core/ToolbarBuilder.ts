import type {
  ToolbarConfig,
  ToolbarItem,
  ToolbarGroup,
  ToolbarCustomButton,
  TexyEditorStrings,
} from '../types';

/** SVG icon paths for built-in toolbar buttons (Lucide-inspired, 24×24 viewBox) */
const ICONS: Record<string, string> = {
  // ── Inline formatting ─────────────────────────────────
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
  italic: '<line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  deleted: '<text x="5" y="17" font-size="16" font-weight="600" font-family="-apple-system,sans-serif" fill="currentColor">S</text><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  inserted: '<path d="M7 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 19h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  superscript: '<path d="M4 19l7-12 7 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 3h3l-3 4h3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  subscript: '<path d="M4 5l7 12 7-12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 17h3l-3 4h3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  code: '<polyline points="16 18 22 12 16 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="8 6 2 12 8 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  codeBlock: '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><polyline points="10 8 7 12 10 16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 8 17 12 14 16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',

  // ── Headings ──────────────────────────────────────────
  heading1: '<path d="M4 12h8M4 5v14M12 5v14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M19.5 7v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 9l2.5-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  heading2: '<path d="M4 12h8M4 5v14M12 5v14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16.5 8.5a2 2 0 0 1 3.5 1.3c0 1.5-3.5 3-3.5 4.7h4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  heading3: '<path d="M4 12h8M4 5v14M12 5v14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16.5 7h3.5l-2.5 3.5a2 2 0 1 1-1.5 3.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  heading4: '<path d="M4 12h8M4 5v14M12 5v14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16.5 7v6h4M20.5 7v12" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',

  // ── Links & media ─────────────────────────────────────
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',

  // ── Lists ─────────────────────────────────────────────
  ul: '<line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
  ol: '<line x1="10" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 6h1v4H4M5 10H3M4 16.5a1.5 1.5 0 0 0 3 0c0-1.5-3-1.5-3-3a1.5 1.5 0 0 1 3 0" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/>',
  blockquote: '<rect x="2" y="4" width="3" height="16" rx="1.5" fill="currentColor"/><line x1="10" y1="8" x2="21" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // ── Block elements ────────────────────────────────────
  hr: '<line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="7" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="17" cy="12" r="1" fill="currentColor"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" stroke-width="1.5"/><line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" stroke-width="1.5"/>',

  // ── Modifiers ─────────────────────────────────────────
  color: '<text x="5" y="16" font-size="16" font-weight="700" font-family="-apple-system,sans-serif" fill="currentColor">A</text><rect x="4" y="18" width="16" height="3" rx="1" fill="currentColor"/>',
  symbol: '<text x="4" y="18" font-size="18" font-weight="400" font-family="serif" fill="currentColor">&#937;</text>',
  acronym: '<text x="3" y="15" font-size="13" font-weight="600" font-family="-apple-system,sans-serif" fill="currentColor">Ab</text><line x1="3" y1="18" x2="19" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>',

  // ── Alignment ─────────────────────────────────────────
  alignLeft: '<line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="15" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  alignRight: '<line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  alignCenter: '<line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="18" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  alignJustify: '<line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  indent: '<line x1="12" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="18" x2="20" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="4 8 8 12 4 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  unindent: '<line x1="12" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="18" x2="20" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="8 8 4 12 8 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',

  // ── Actions ───────────────────────────────────────────
  undo: '<path d="M3 7v6h6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  redo: '<path d="M21 7v6h-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  fullscreen: '<polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="9 21 3 21 3 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="3" x2="14" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="21" x2="10" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // ── View modes ────────────────────────────────────────
  preview: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  edit: '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M15 5l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  splitView: '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};

function createSvgIcon(name: string): string {
  const path = ICONS[name];
  if (!path) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" class="te-icon">${path}</svg>`;
}

export class ToolbarBuilder {
  private toolbar!: HTMLElement;
  private bottomBar!: HTMLElement;

  constructor(
    private strings: TexyEditorStrings,
    private actionHandler: (name: string) => void,
  ) {}

  build(config: ToolbarConfig): HTMLElement {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'te-toolbar';
    this.toolbar.setAttribute('role', 'toolbar');
    this.toolbar.setAttribute('aria-label', 'Editor toolbar');

    for (const item of config) {
      const el = this.renderItem(item);
      if (el) this.toolbar.appendChild(el);
    }

    return this.toolbar;
  }

  buildBottomBar(
    left: string[],
    rightEdit: string[],
    rightPreview: string[],
  ): HTMLElement {
    this.bottomBar = document.createElement('div');
    this.bottomBar.className = 'te-bottom-bar';

    // Left side (view tabs)
    const leftDiv = document.createElement('div');
    leftDiv.className = 'te-bottom-left';
    for (const name of left) {
      leftDiv.appendChild(this.createButton(name));
    }
    this.bottomBar.appendChild(leftDiv);

    // Right side
    const rightDiv = document.createElement('div');
    rightDiv.className = 'te-bottom-right';

    const editGroup = document.createElement('div');
    editGroup.className = 'te-bottom-right-edit';
    for (const name of rightEdit) {
      editGroup.appendChild(this.createButton(name));
    }
    rightDiv.appendChild(editGroup);

    const previewGroup = document.createElement('div');
    previewGroup.className = 'te-bottom-right-preview';
    previewGroup.style.display = 'none';
    for (const name of rightPreview) {
      previewGroup.appendChild(this.createButton(name));
    }
    rightDiv.appendChild(previewGroup);

    this.bottomBar.appendChild(rightDiv);
    return this.bottomBar;
  }

  private renderItem(item: ToolbarItem): HTMLElement | null {
    if (item === null) {
      return this.createSeparator();
    }

    if (typeof item === 'string') {
      return this.createButton(item);
    }

    if (this.isGroup(item)) {
      return this.createDropdown(item);
    }

    if (this.isCustomButton(item)) {
      return this.createCustomButton(item);
    }

    return null;
  }

  private createButton(name: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `te-btn te-btn-${name}`;
    btn.setAttribute('data-action', name);

    const label = (this.strings as unknown as Record<string, string>)[name] ?? name;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);

    const icon = createSvgIcon(name);
    if (icon) {
      btn.innerHTML = icon;
    } else {
      btn.textContent = label;
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.actionHandler(name);
    });

    return btn;
  }

  private createCustomButton(config: ToolbarCustomButton): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `te-btn te-btn-custom te-btn-${config.name}`;
    btn.setAttribute('aria-label', config.label);
    btn.setAttribute('title', config.label);

    if (config.icon) {
      btn.innerHTML = config.icon;
    } else {
      btn.textContent = config.label;
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.actionHandler(config.name);
    });

    return btn;
  }

  private createSeparator(): HTMLElement {
    const sep = document.createElement('span');
    sep.className = 'te-separator';
    sep.setAttribute('role', 'separator');
    sep.setAttribute('aria-orientation', 'vertical');
    return sep;
  }

  private createDropdown(group: ToolbarGroup): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'te-dropdown';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'te-btn te-dropdown-trigger';
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.textContent = group.label ?? '...';

    const menu = document.createElement('div');
    menu.className = 'te-dropdown-menu';
    menu.setAttribute('role', 'menu');

    for (const itemName of group.items) {
      const menuItem = this.createButton(itemName);
      menuItem.setAttribute('role', 'menuitem');
      menu.appendChild(menuItem);
    }

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = wrapper.classList.toggle('te-dropdown-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on outside click
    document.addEventListener('click', () => {
      wrapper.classList.remove('te-dropdown-open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    return wrapper;
  }

  private isGroup(item: ToolbarItem): item is ToolbarGroup {
    return typeof item === 'object' && item !== null && 'type' in item && item.type === 'group';
  }

  private isCustomButton(item: ToolbarItem): item is ToolbarCustomButton {
    return typeof item === 'object' && item !== null && 'type' in item && item.type === 'button';
  }
}
