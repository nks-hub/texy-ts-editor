import { TexyEditor } from '../src/index';
import '../src/themes/base.css';

let editor: TexyEditor | null = null;
const logEl = document.getElementById('eventLog')!;
const rawEl = document.getElementById('rawSource')!;
const previewEl = document.getElementById('previewHtml')!;

function log(event: string, data?: unknown) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const time = new Date().toLocaleTimeString('cs-CZ', { hour12: false });
  const dataStr = data ? ` ${JSON.stringify(data).substring(0, 80)}` : '';
  entry.innerHTML = `<span style="color:#6c7086">${time}</span> <span class="event-name">${event}</span><span class="event-data">${dataStr}</span>`;
  logEl.prepend(entry);

  // Keep max 50 entries
  while (logEl.children.length > 50) {
    logEl.lastChild?.remove();
  }
}

function updateComparison() {
  if (!editor) return;
  rawEl.textContent = editor.getValue();
  // For now show the raw value, preview HTML would come from the preview content
  const previewContent = editor.getContainer().querySelector('.te-preview-content');
  previewEl.textContent = previewContent?.innerHTML || '(switch to preview mode)';
}

function createEditor(theme: string = 'dark', lang: string = 'cs') {
  if (editor) {
    editor.destroy();
    editor = null;
  }

  editor = new TexyEditor('#demo-textarea', {
    theme,
    language: lang,
    width: '100%',
    autoResize: true,
    livePreview: true,
    livePreviewDelay: 300,
    fullscreen: true,
    splitView: true,
    toolbar: [
      'bold', 'italic', 'deleted', null,
      'ul', 'ol', 'blockquote', null,
      'heading1', 'heading2', 'heading3', null,
      'link', 'image', null,
      'code', 'codeBlock', null,
      'hr', 'table', null,
      'color', 'symbol', 'acronym', null,
      'alignLeft', 'alignCenter', 'alignRight', null,
      'indent', 'unindent',
    ],
    bottomLeftToolbar: ['edit', 'preview', 'splitView'],
    bottomRightEditToolbar: ['undo', 'redo', 'fullscreen'],
    bottomRightPreviewToolbar: [],
    imageLinkAutoFill: true,
  });

  // Subscribe to events
  editor.on('change', (data) => {
    log('change', { length: data.value.length });
    updateComparison();
  });

  editor.on('toolbar:action', (data) => {
    log('toolbar:action', data);
  });

  editor.on('view:change', (data) => {
    log('view:change', data);
    updateComparison();
  });

  editor.on('fullscreen:toggle', (data) => {
    log('fullscreen:toggle', data);
  });

  editor.on('undo', () => log('undo'));
  editor.on('redo', () => log('redo'));
  editor.on('plugin:init', (data) => log('plugin:init', data));
  editor.on('destroy', () => log('destroy'));

  log('editor:created', { theme, lang });
  updateComparison();
}

// Initialize
createEditor('dark', 'cs');

// Controls
document.getElementById('themeSelect')!.addEventListener('change', (e) => {
  const theme = (e.target as HTMLSelectElement).value;
  const lang = (document.getElementById('langSelect') as HTMLSelectElement).value;
  createEditor(theme, lang);
});

document.getElementById('langSelect')!.addEventListener('change', (e) => {
  const lang = (e.target as HTMLSelectElement).value;
  const theme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
  createEditor(theme, lang);
});

// View buttons
const viewBtns = ['viewEdit', 'viewPreview', 'viewSplit'];
const viewMap: Record<string, 'edit' | 'preview' | 'split'> = {
  viewEdit: 'edit',
  viewPreview: 'preview',
  viewSplit: 'split',
};

for (const btnId of viewBtns) {
  document.getElementById(btnId)!.addEventListener('click', () => {
    if (!editor) return;
    const mode = viewMap[btnId];
    editor.setView(mode);

    // Update active state
    for (const id of viewBtns) {
      document.getElementById(id)!.classList.toggle('active', id === btnId);
    }
  });
}

document.getElementById('btnDestroy')!.addEventListener('click', () => {
  if (editor) {
    editor.destroy();
    editor = null;
    log('editor:destroyed');
  }
});

document.getElementById('btnRecreate')!.addEventListener('click', () => {
  const theme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
  const lang = (document.getElementById('langSelect') as HTMLSelectElement).value;
  createEditor(theme, lang);
});

document.getElementById('btnFullscreen')!.addEventListener('click', () => {
  editor?.toggleFullscreen();
});

// Inject build commit hash into header
declare const __GIT_COMMIT__: string;
if (typeof __GIT_COMMIT__ !== 'undefined') {
  const commitEl = document.getElementById('buildCommit');
  const linkEl = document.getElementById('buildCommitLink');
  if (commitEl) commitEl.textContent = __GIT_COMMIT__;
  if (linkEl) linkEl.setAttribute('href', `https://github.com/nks-hub/texy-ts-editor/commit/${__GIT_COMMIT__}`);
}
