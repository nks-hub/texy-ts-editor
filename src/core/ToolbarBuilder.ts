import type {
  ToolbarConfig,
  ToolbarItem,
  ToolbarGroup,
  ToolbarCustomButton,
  TexyEditorStrings,
} from '../types';

/** SVG icon paths for built-in toolbar buttons */
const ICONS: Record<string, string> = {
  bold: '<path d="M6 4h5a3 3 0 0 1 0 6H6zm0 6h6a3 3 0 0 1 0 6H6z" stroke="currentColor" stroke-width="2" fill="none"/>',
  italic: '<path d="M10 4h4M8 20h4M14 4l-4 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  deleted: '<path d="M6 12h12M7 6h10a2 2 0 0 1 0 4H7M7 14h10a2 2 0 0 1 0 4H7" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  inserted: '<path d="M6 18h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 4v10M16 4v10" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  superscript: '<path d="M4 18l6-10 6 10M15 4h4l-4 5h4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  subscript: '<path d="M4 4l6 10 6-10M15 16h4l-4 5h4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  code: '<path d="M8 7l-4 5 4 5M16 7l4 5-4 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  codeBlock: '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 9l-2 3 2 3M16 9l2 3-2 3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  heading1: '<path d="M4 6v12M12 6v12M4 12h8M17 8v10M15 8h4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  heading2: '<path d="M4 6v12M12 6v12M4 12h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M15 9a2 2 0 0 1 4 0c0 2-4 3-4 5h4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  heading3: '<path d="M4 6v12M12 6v12M4 12h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M15 8h3l-2 3 2 0a2 2 0 0 1-3 2" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  heading4: '<path d="M4 6v12M12 6v12M4 12h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M15 8v5h4M19 8v8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  link: '<path d="M10 14a3.5 3.5 0 0 0 5-5l-1-1M14 10a3.5 3.5 0 0 0-5 5l1 1" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="8.5" cy="10" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 19" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  ul: '<path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor"/><circle cx="4.5" cy="12" r="1.5" fill="currentColor"/><circle cx="4.5" cy="18" r="1.5" fill="currentColor"/>',
  ol: '<path d="M10 6h10M10 12h10M10 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><text x="4" y="8" font-size="8" fill="currentColor" font-family="sans-serif">1</text><text x="4" y="14" font-size="8" fill="currentColor" font-family="sans-serif">2</text><text x="4" y="20" font-size="8" fill="currentColor" font-family="sans-serif">3</text>',
  blockquote: '<path d="M6 10c0-3 2-5 5-5M13 10c0-3 2-5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M6 14c0 3 2 5 5 5M13 14c0 3 2 5 5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  hr: '<path d="M3 12h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M3 10h18M3 16h18M10 4v16" stroke="currentColor" stroke-width="1.5"/>',
  color: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  symbol: '<text x="6" y="17" font-size="16" fill="currentColor" font-family="serif">&#937;</text>',
  acronym: '<path d="M4 16h4l2-6 2 6h4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M6 13h4" stroke="currentColor" stroke-width="1.5"/><path d="M16 8a2 2 0 1 0 4 0 2 2 0 0 0-4 0" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  alignLeft: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  alignRight: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  alignCenter: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  alignJustify: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  indent: '<path d="M12 6h8M12 12h8M12 18h8M4 8l4 4-4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  unindent: '<path d="M12 6h8M12 12h8M12 18h8M8 8l-4 4 4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  undo: '<path d="M4 8h12a4 4 0 0 1 0 8H8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M7 5l-3 3 3 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  redo: '<path d="M20 8H8a4 4 0 0 0 0 8h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M17 5l3 3-3 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  fullscreen: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  preview: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  edit: '<path d="M14 3l3 3L7 16l-4 1 1-4L14 3z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>',
  splitView: '<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 4v16" stroke="currentColor" stroke-width="1.5"/>',
  upload: '<path d="M12 16V4M8 8l4-4 4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
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
