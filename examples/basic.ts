/**
 * Basic usage — attach Texy editor to a textarea
 */
import { TexyEditor } from '@nks-hub/texy-editor';
import '@nks-hub/texy-editor/css';

const editor = new TexyEditor('#my-textarea', {
  language: 'en',
  theme: 'light',
  livePreview: true,
  livePreviewDelay: 300,
});

// Listen for changes
editor.on('change', ({ value }) => {
  console.log('Content changed:', value.length, 'chars');
});

// Programmatic access
editor.setValue('**Hello** from Texy!');
console.log(editor.getValue());
