// Core
export { TexyEditor } from './core/TexyEditor';
export { Selection } from './core/Selection';
export { TexyFormatter } from './core/TexyFormatter';
export { EventBus } from './core/EventBus';
export { UndoManager } from './core/UndoManager';
export { KeyboardManager } from './core/KeyboardManager';
export { ToolbarBuilder } from './core/ToolbarBuilder';
export { DialogManager } from './core/DialogManager';
export type { DialogConfig } from './core/DialogManager';

// Parser
export { TexyParser } from './parser';
export {
  youtubePlugin,
  smileyPlugin,
  linkRedirectPlugin,
  bbcodePlugin,
  imageEmbedPlugin,
} from './parser';
export type { YouTubePluginOptions } from './parser/plugins/youtube';
export type { SmileyPluginOptions } from './parser/plugins/smiley';
export type { LinkRedirectPluginOptions } from './parser/plugins/link-redirect';
export type { ImageEmbedPluginOptions } from './parser/plugins/image-embed';

// Modes — Texy is built in. MarkdownMode / MarkdownPreview live in the
// '@nks-hub/texy-editor/markdown' entry to keep markdown-it out of the core.
export { TexyMode } from './modes/TexyMode';
export type { SyntaxMode } from './modes/SyntaxMode';

// i18n
export { getStrings, registerLanguage, cs, en } from './i18n';

// Types
export type {
  TexyEditorOptions,
  TexyEditorAPI,
  TexyEditorEvents,
  TexyEditorStrings,
  TexyEventHandler,
  TexyPlugin,
  TexyPluginWindowConfig,
  ToolbarConfig,
  ToolbarItem,
  ToolbarGroup,
  ToolbarCustomButton,
  ViewMode,
  SelectionState,
  UploadHandler,
  UploadResult,
  MentionSource,
  MentionItem,
  TexyParseRule,
  TexyParserOptions,
  TexyParserPlugin,
  PreviewRenderer,
} from './types';

// Utilities
export { escapeHtml, isSafeUrl, sanitizeUrl } from './utils/escapeHtml';

// CSS (side-effect import for bundlers)
import './themes/base.css';
