import type { TexyEditorStrings } from '../types';
import { cs } from './cs';
import { en } from './en';

const languages: Record<string, TexyEditorStrings> = { cs, en };

export function getStrings(lang: string): TexyEditorStrings {
  return languages[lang] ?? languages['en'];
}

export function registerLanguage(lang: string, strings: TexyEditorStrings): void {
  languages[lang] = strings;
}

export { cs, en };
