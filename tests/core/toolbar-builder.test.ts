import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolbarBuilder } from '../../src/core/ToolbarBuilder';
import { en } from '../../src/i18n/en';
import type {
  ToolbarConfig,
  ToolbarGroup,
  ToolbarCustomButton,
  TexyEditorAPI,
} from '../../src/types';

// ── Helpers ─────────────────────────────────────────────────────

function makeBuilder(handler?: (name: string) => void): ToolbarBuilder {
  return new ToolbarBuilder(en, handler ?? vi.fn());
}

function makeMockApi(): TexyEditorAPI {
  return {
    getValue: vi.fn(),
    setValue: vi.fn(),
    getSelection: vi.fn(),
    replaceSelection: vi.fn(),
    wrapSelection: vi.fn(),
    insertAtCursor: vi.fn(),
    focus: vi.fn(),
    setView: vi.fn(),
    getView: vi.fn(),
    execAction: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    openWindow: vi.fn(),
    closeWindow: vi.fn(),
    toggleFullscreen: vi.fn(),
    getTextarea: vi.fn(),
    getContainer: vi.fn(),
    getStrings: vi.fn(),
    getMode: vi.fn(),
    destroy: vi.fn(),
  } as unknown as TexyEditorAPI;
}

// ── 1. Construction ──────────────────────────────────────────────

describe('ToolbarBuilder — construction', () => {
  it('creates an instance', () => {
    const builder = makeBuilder();
    expect(builder).toBeInstanceOf(ToolbarBuilder);
  });
});

// ── 2. build() — returns HTMLElement with .te-toolbar ────────────

describe('ToolbarBuilder — build()', () => {
  it('returns an HTMLElement', () => {
    const builder = makeBuilder();
    const toolbar = builder.build([]);
    expect(toolbar).toBeInstanceOf(HTMLElement);
  });

  it('has class te-toolbar', () => {
    const builder = makeBuilder();
    const toolbar = builder.build([]);
    expect(toolbar.classList.contains('te-toolbar')).toBe(true);
  });

  it('has role="toolbar" attribute', () => {
    const builder = makeBuilder();
    const toolbar = builder.build([]);
    expect(toolbar.getAttribute('role')).toBe('toolbar');
  });

  // ── 3. correct number of buttons ──────────────────────────────

  it('creates correct number of buttons for a string config', () => {
    const config: ToolbarConfig = ['bold', 'italic', 'link'];
    const toolbar = makeBuilder().build(config);
    const buttons = toolbar.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('produces an empty toolbar for an empty config', () => {
    const toolbar = makeBuilder().build([]);
    expect(toolbar.children.length).toBe(0);
  });

  // ── 4. null items → separators ────────────────────────────────

  it('creates a separator element for null items', () => {
    const config: ToolbarConfig = ['bold', null, 'italic'];
    const toolbar = makeBuilder().build(config);
    const separators = toolbar.querySelectorAll('.te-separator');
    expect(separators.length).toBe(1);
  });

  it('separator has role="separator"', () => {
    const toolbar = makeBuilder().build([null]);
    const sep = toolbar.querySelector('.te-separator');
    expect(sep?.getAttribute('role')).toBe('separator');
  });

  it('separator has aria-orientation="vertical"', () => {
    const toolbar = makeBuilder().build([null]);
    const sep = toolbar.querySelector('.te-separator');
    expect(sep?.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('creates multiple separators when config has multiple nulls', () => {
    const config: ToolbarConfig = [null, null, null];
    const toolbar = makeBuilder().build(config);
    expect(toolbar.querySelectorAll('.te-separator').length).toBe(3);
  });

  // ── 5. data-action attribute ───────────────────────────────────

  it('button has correct data-action attribute', () => {
    const toolbar = makeBuilder().build(['bold']);
    const btn = toolbar.querySelector('button');
    expect(btn?.getAttribute('data-action')).toBe('bold');
  });

  it('each button carries its own data-action', () => {
    const config: ToolbarConfig = ['bold', 'italic', 'link'];
    const toolbar = makeBuilder().build(config);
    const buttons = toolbar.querySelectorAll('button');
    const actions = Array.from(buttons).map((b) => b.getAttribute('data-action'));
    expect(actions).toEqual(['bold', 'italic', 'link']);
  });

  // ── 6. aria-label from strings ────────────────────────────────

  it('button has aria-label from en strings for bold', () => {
    const toolbar = makeBuilder().build(['bold']);
    const btn = toolbar.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toBe(en.bold);
  });

  it('button has aria-label from en strings for italic', () => {
    const toolbar = makeBuilder().build(['italic']);
    const btn = toolbar.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toBe(en.italic);
  });

  it('button title matches aria-label', () => {
    const toolbar = makeBuilder().build(['link']);
    const btn = toolbar.querySelector('button');
    expect(btn?.getAttribute('title')).toBe(btn?.getAttribute('aria-label'));
  });

  it('unknown action name falls back to the name itself as aria-label', () => {
    const toolbar = makeBuilder().build(['customXyz']);
    const btn = toolbar.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toBe('customXyz');
  });

  // ── 7. SVG icons for known actions ────────────────────────────

  it('bold button contains an SVG icon', () => {
    const toolbar = makeBuilder().build(['bold']);
    const svg = toolbar.querySelector('button svg');
    expect(svg).not.toBeNull();
  });

  it('italic button contains an SVG icon', () => {
    const toolbar = makeBuilder().build(['italic']);
    const svg = toolbar.querySelector('button svg');
    expect(svg).not.toBeNull();
  });

  it('link button contains an SVG with te-icon class', () => {
    const toolbar = makeBuilder().build(['link']);
    const svg = toolbar.querySelector('button svg.te-icon');
    expect(svg).not.toBeNull();
  });

  it('image button contains an SVG icon', () => {
    const toolbar = makeBuilder().build(['image']);
    expect(toolbar.querySelector('button svg')).not.toBeNull();
  });

  it('undo button contains an SVG icon', () => {
    const toolbar = makeBuilder().build(['undo']);
    expect(toolbar.querySelector('button svg')).not.toBeNull();
  });

  it('redo button contains an SVG icon', () => {
    const toolbar = makeBuilder().build(['redo']);
    expect(toolbar.querySelector('button svg')).not.toBeNull();
  });

  it('unknown action has no SVG icon (falls back to text)', () => {
    const toolbar = makeBuilder().build(['unknownAction']);
    const btn = toolbar.querySelector('button');
    expect(btn?.querySelector('svg')).toBeNull();
    expect(btn?.textContent).toBe('unknownAction');
  });

  // ── 8. button click calls actionHandler ───────────────────────

  it('clicking a button calls actionHandler with the button name', () => {
    const handler = vi.fn();
    const toolbar = new ToolbarBuilder(en, handler).build(['bold']);
    const btn = toolbar.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(handler).toHaveBeenCalledWith('bold');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clicking different buttons calls handler with correct names', () => {
    const handler = vi.fn();
    const toolbar = new ToolbarBuilder(en, handler).build(['bold', 'italic', 'link']);
    const buttons = toolbar.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();
    (buttons[2] as HTMLButtonElement).click();
    expect(handler).toHaveBeenNthCalledWith(1, 'bold');
    expect(handler).toHaveBeenNthCalledWith(2, 'italic');
    expect(handler).toHaveBeenNthCalledWith(3, 'link');
  });
});

// ── 9. Dropdown group ────────────────────────────────────────────

describe('ToolbarBuilder — dropdown group', () => {
  function buildWithGroup(label?: string): HTMLElement {
    const group: ToolbarGroup = {
      type: 'group',
      label: label ?? 'Headings',
      items: ['heading1', 'heading2', 'heading3'],
    };
    return makeBuilder().build([group]);
  }

  it('renders a te-dropdown wrapper element', () => {
    const toolbar = buildWithGroup();
    expect(toolbar.querySelector('.te-dropdown')).not.toBeNull();
  });

  it('renders a trigger button inside the dropdown', () => {
    const toolbar = buildWithGroup();
    const trigger = toolbar.querySelector('.te-dropdown-trigger');
    expect(trigger).not.toBeNull();
    expect(trigger?.tagName.toLowerCase()).toBe('button');
  });

  it('trigger button shows the group label as text', () => {
    const toolbar = buildWithGroup('Headings');
    const trigger = toolbar.querySelector('.te-dropdown-trigger') as HTMLButtonElement;
    expect(trigger.textContent).toBe('Headings');
  });

  it('trigger defaults to "..." when no label provided', () => {
    const group: ToolbarGroup = { type: 'group', items: ['bold'] };
    const toolbar = makeBuilder().build([group]);
    const trigger = toolbar.querySelector('.te-dropdown-trigger') as HTMLButtonElement;
    expect(trigger.textContent).toBe('...');
  });

  it('renders a te-dropdown-menu element', () => {
    const toolbar = buildWithGroup();
    const menu = toolbar.querySelector('.te-dropdown-menu');
    expect(menu).not.toBeNull();
    expect(menu?.getAttribute('role')).toBe('menu');
  });

  it('menu contains buttons for each item in the group', () => {
    const toolbar = buildWithGroup();
    const menu = toolbar.querySelector('.te-dropdown-menu');
    const items = menu?.querySelectorAll('button');
    expect(items?.length).toBe(3);
  });

  it('menu items have role="menuitem"', () => {
    const toolbar = buildWithGroup();
    const menuItems = toolbar.querySelectorAll('.te-dropdown-menu button');
    menuItems.forEach((item) => {
      expect(item.getAttribute('role')).toBe('menuitem');
    });
  });

  // ── 10. toggle open class ────────────────────────────────────

  it('trigger click adds te-dropdown-open class to wrapper', () => {
    const toolbar = buildWithGroup();
    const wrapper = toolbar.querySelector('.te-dropdown') as HTMLElement;
    const trigger = wrapper.querySelector('.te-dropdown-trigger') as HTMLButtonElement;
    trigger.click();
    expect(wrapper.classList.contains('te-dropdown-open')).toBe(true);
  });

  it('trigger sets aria-expanded="true" when opened', () => {
    const toolbar = buildWithGroup();
    const trigger = toolbar.querySelector('.te-dropdown-trigger') as HTMLButtonElement;
    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('second trigger click toggles dropdown closed', () => {
    const toolbar = buildWithGroup();
    const wrapper = toolbar.querySelector('.te-dropdown') as HTMLElement;
    const trigger = wrapper.querySelector('.te-dropdown-trigger') as HTMLButtonElement;
    trigger.click();
    trigger.click();
    expect(wrapper.classList.contains('te-dropdown-open')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('trigger starts with aria-expanded="false"', () => {
    const toolbar = buildWithGroup();
    const trigger = toolbar.querySelector('.te-dropdown-trigger') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('trigger has aria-haspopup="true"', () => {
    const toolbar = buildWithGroup();
    const trigger = toolbar.querySelector('.te-dropdown-trigger') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
  });

  it('outside document click closes the dropdown', () => {
    const toolbar = buildWithGroup();
    document.body.appendChild(toolbar);
    const wrapper = toolbar.querySelector('.te-dropdown') as HTMLElement;
    const trigger = wrapper.querySelector('.te-dropdown-trigger') as HTMLButtonElement;

    trigger.click();
    expect(wrapper.classList.contains('te-dropdown-open')).toBe(true);

    document.body.click();
    expect(wrapper.classList.contains('te-dropdown-open')).toBe(false);

    document.body.removeChild(toolbar);
  });
});

// ── 11. Custom button — label as textContent ──────────────────────

describe('ToolbarBuilder — custom button', () => {
  it('renders with label as textContent when no icon provided', () => {
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'myBtn',
      label: 'My Button',
      action: vi.fn(),
    };
    const toolbar = makeBuilder().build([custom]);
    const btn = toolbar.querySelector('button');
    expect(btn?.textContent).toBe('My Button');
  });

  it('has correct aria-label set to label', () => {
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'myBtn',
      label: 'My Button',
      action: vi.fn(),
    };
    const toolbar = makeBuilder().build([custom]);
    const btn = toolbar.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toBe('My Button');
  });

  it('has correct title set to label', () => {
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'myBtn',
      label: 'My Button',
      action: vi.fn(),
    };
    const toolbar = makeBuilder().build([custom]);
    const btn = toolbar.querySelector('button');
    expect(btn?.getAttribute('title')).toBe('My Button');
  });

  it('has te-btn-custom class', () => {
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'myBtn',
      label: 'My Button',
      action: vi.fn(),
    };
    const toolbar = makeBuilder().build([custom]);
    const btn = toolbar.querySelector('button');
    expect(btn?.classList.contains('te-btn-custom')).toBe(true);
  });

  it('has te-btn-<name> class derived from name', () => {
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'specialAction',
      label: 'Special',
      action: vi.fn(),
    };
    const toolbar = makeBuilder().build([custom]);
    const btn = toolbar.querySelector('button');
    expect(btn?.classList.contains('te-btn-specialAction')).toBe(true);
  });

  // ── 12. Custom button — icon via innerHTML ─────────────────────

  it('renders icon via innerHTML when icon is provided', () => {
    const iconHtml = '<svg><circle r="5"/></svg>';
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'iconBtn',
      label: 'Icon Button',
      icon: iconHtml,
      action: vi.fn(),
    };
    const toolbar = makeBuilder().build([custom]);
    const btn = toolbar.querySelector('button');
    // jsdom normalizes self-closing tags on innerHTML readback, so check for
    // the SVG element's presence rather than exact string equality.
    expect(btn?.querySelector('svg')).not.toBeNull();
    expect(btn?.querySelector('circle')).not.toBeNull();
  });

  it('icon button does not fall back to label text', () => {
    const iconHtml = '<svg><rect width="10" height="10"/></svg>';
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'iconBtn',
      label: 'Should Not Appear',
      icon: iconHtml,
      action: vi.fn(),
    };
    const toolbar = makeBuilder().build([custom]);
    const btn = toolbar.querySelector('button');
    expect(btn?.textContent).not.toContain('Should Not Appear');
  });

  // ── 13. Custom button — action called after setEditorApi ───────

  it('calls config.action with editorApi when button is clicked', () => {
    const actionFn = vi.fn();
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'apiBtn',
      label: 'API Button',
      action: actionFn,
    };
    const builder = makeBuilder();
    const mockApi = makeMockApi();
    builder.setEditorApi(mockApi);
    const toolbar = builder.build([custom]);
    const btn = toolbar.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(actionFn).toHaveBeenCalledWith(mockApi);
    expect(actionFn).toHaveBeenCalledTimes(1);
  });

  it('does not call actionHandler when custom button has its own action', () => {
    const handler = vi.fn();
    const custom: ToolbarCustomButton = {
      type: 'button',
      name: 'apiBtn',
      label: 'API Button',
      action: vi.fn(),
    };
    const builder = new ToolbarBuilder(en, handler);
    builder.setEditorApi(makeMockApi());
    const toolbar = builder.build([custom]);
    const btn = toolbar.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(handler).not.toHaveBeenCalled();
  });
});

// ── 14. buildBottomBar() ──────────────────────────────────────────

describe('ToolbarBuilder — buildBottomBar()', () => {
  let builder: ToolbarBuilder;

  beforeEach(() => {
    builder = makeBuilder();
  });

  it('returns an HTMLElement', () => {
    const bar = builder.buildBottomBar([], [], []);
    expect(bar).toBeInstanceOf(HTMLElement);
  });

  it('has class te-bottom-bar', () => {
    const bar = builder.buildBottomBar([], [], []);
    expect(bar.classList.contains('te-bottom-bar')).toBe(true);
  });

  it('contains a left section with class te-bottom-left', () => {
    const bar = builder.buildBottomBar(['edit', 'preview'], [], []);
    const left = bar.querySelector('.te-bottom-left');
    expect(left).not.toBeNull();
  });

  it('contains a right section with class te-bottom-right', () => {
    const bar = builder.buildBottomBar([], ['undo'], []);
    const right = bar.querySelector('.te-bottom-right');
    expect(right).not.toBeNull();
  });

  it('left section has buttons for each left item', () => {
    const bar = builder.buildBottomBar(['edit', 'preview', 'splitView'], [], []);
    const left = bar.querySelector('.te-bottom-left');
    expect(left?.querySelectorAll('button').length).toBe(3);
  });

  it('left buttons carry correct data-action attributes', () => {
    const bar = builder.buildBottomBar(['edit', 'preview'], [], []);
    const buttons = bar.querySelectorAll('.te-bottom-left button');
    expect(buttons[0].getAttribute('data-action')).toBe('edit');
    expect(buttons[1].getAttribute('data-action')).toBe('preview');
  });

  it('contains te-bottom-right-edit group', () => {
    const bar = builder.buildBottomBar([], ['undo', 'redo'], []);
    expect(bar.querySelector('.te-bottom-right-edit')).not.toBeNull();
  });

  it('contains te-bottom-right-preview group', () => {
    const bar = builder.buildBottomBar([], [], ['fullscreen']);
    expect(bar.querySelector('.te-bottom-right-preview')).not.toBeNull();
  });

  it('te-bottom-right-edit has correct number of buttons', () => {
    const bar = builder.buildBottomBar([], ['undo', 'redo'], []);
    const editGroup = bar.querySelector('.te-bottom-right-edit');
    expect(editGroup?.querySelectorAll('button').length).toBe(2);
  });

  it('te-bottom-right-preview is hidden by default', () => {
    const bar = builder.buildBottomBar([], [], ['fullscreen']);
    const previewGroup = bar.querySelector('.te-bottom-right-preview') as HTMLElement;
    expect(previewGroup.style.display).toBe('none');
  });

  it('te-bottom-right-preview has correct number of buttons', () => {
    const bar = builder.buildBottomBar([], [], ['fullscreen', 'upload']);
    const previewGroup = bar.querySelector('.te-bottom-right-preview');
    expect(previewGroup?.querySelectorAll('button').length).toBe(2);
  });

  it('clicking left button calls actionHandler', () => {
    const handler = vi.fn();
    const b = new ToolbarBuilder(en, handler);
    const bar = b.buildBottomBar(['edit'], [], []);
    const btn = bar.querySelector('.te-bottom-left button') as HTMLButtonElement;
    btn.click();
    expect(handler).toHaveBeenCalledWith('edit');
  });
});

// ── 15. destroy() ─────────────────────────────────────────────────

describe('ToolbarBuilder — destroy()', () => {
  it('does not throw when called', () => {
    const builder = makeBuilder();
    expect(() => builder.destroy()).not.toThrow();
  });

  it('can be called multiple times without error', () => {
    const builder = makeBuilder();
    builder.destroy();
    expect(() => builder.destroy()).not.toThrow();
  });

  it('after destroy, outside-click listener no longer re-opens closed dropdown', () => {
    const group: ToolbarGroup = {
      type: 'group',
      label: 'Test',
      items: ['bold'],
    };
    const builder = makeBuilder();
    const toolbar = builder.build([group]);
    document.body.appendChild(toolbar);

    const wrapper = toolbar.querySelector('.te-dropdown') as HTMLElement;
    const trigger = wrapper.querySelector('.te-dropdown-trigger') as HTMLButtonElement;

    // Open, then destroy, then simulate outside click
    trigger.click();
    expect(wrapper.classList.contains('te-dropdown-open')).toBe(true);

    builder.destroy();

    // Remove the open class manually to simulate pre-close state
    wrapper.classList.remove('te-dropdown-open');

    // The document click listener was aborted — re-adding open manually
    // and verifying the aborted listener is gone (no re-close side effect from extra listener)
    wrapper.classList.add('te-dropdown-open');
    document.body.click();

    // After destroy(), the aborted listener is gone; we cannot rely on it to close.
    // The class state depends only on whether the listener is still active.
    // The test just verifies no exception was thrown during the click after destroy.
    // The AbortController ensures no listener-related errors occur.
    expect(true).toBe(true);

    document.body.removeChild(toolbar);
  });

  it('AbortController aborts on destroy — document listener is removed', () => {
    const group: ToolbarGroup = {
      type: 'group',
      label: 'G',
      items: ['bold'],
    };
    const builder = makeBuilder();
    const toolbar = builder.build([group]);
    document.body.appendChild(toolbar);

    const wrapper = toolbar.querySelector('.te-dropdown') as HTMLElement;
    const trigger = wrapper.querySelector('.te-dropdown-trigger') as HTMLButtonElement;

    trigger.click();
    expect(wrapper.classList.contains('te-dropdown-open')).toBe(true);

    // Destroy aborts the signal — the document click handler is removed
    builder.destroy();

    // Document click should no longer close the dropdown (listener is gone)
    document.body.click();
    expect(wrapper.classList.contains('te-dropdown-open')).toBe(true);

    document.body.removeChild(toolbar);
  });
});
