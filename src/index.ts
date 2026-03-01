// Core
export { TexyEditor } from './core/TexyEditor';
export { Selection } from './core/Selection';
export { TexyFormatter } from './core/TexyFormatter';
export { EventBus } from './core/EventBus';
export { UndoManager } from './core/UndoManager';
export { KeyboardManager } from './core/KeyboardManager';
export { ToolbarBuilder } from './core/ToolbarBuilder';
export { DialogManager } from './core/DialogManager';

// Parser
export { TexyParser } from './parser';

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
} from './types';

// CSS (side-effect import for bundlers)
import './themes/base.css';
