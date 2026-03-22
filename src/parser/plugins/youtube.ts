import type { TexyParserPlugin } from '../../types';
import { escapeHtml } from '../../utils/escapeHtml';

export interface YouTubePluginOptions {
  /** Iframe width (default: 560) */
  width?: number;
  /** Iframe height (default: 315) */
  height?: number;
  /** Allow fullscreen (default: true) */
  allowFullscreen?: boolean;
  /** Responsive wrapper CSS class */
  wrapperClass?: string;
}

/**
 * YouTube embed plugin for TexyParser.
 *
 * Supports Texy image syntax with youtube: prefix:
 *   [* youtube:VIDEO_ID *]
 *
 * Also converts YouTube URLs in image syntax:
 *   [* https://www.youtube.com/watch?v=ID *]
 *   [* https://youtu.be/ID *]
 *   [* https://www.youtube.com/shorts/ID *]
 */
export function youtubePlugin(options: YouTubePluginOptions = {}): TexyParserPlugin {
  const width = options.width ?? 560;
  const height = options.height ?? 315;
  const allowFs = options.allowFullscreen !== false;
  const wrapperClass = options.wrapperClass ?? 'texy-youtube';

  return {
    name: 'youtube',

    preprocess(text: string): string {
      // Convert [* youtube:ID *] to placeholder
      text = text.replace(
        /\[\*\s+youtube:([a-zA-Z0-9_-]+)\s*\*?\]/g,
        `{{youtube:$1}}`,
      );

      // Convert [* YOUTUBE_URL *] to placeholder (full URLs)
      text = text.replace(
        /\[\*\s+(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s]*)\s*\*?\]/g,
        (_m, _url, id) => `{{youtube:${id}}}`,
      );

      // YouTube shorts
      text = text.replace(
        /\[\*\s+https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)[^\s]*\s*\*?\]/g,
        `{{youtube:$1}}`,
      );

      // youtu.be short URLs
      text = text.replace(
        /\[\*\s+https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s]*\s*\*?\]/g,
        `{{youtube:$1}}`,
      );

      return text;
    },

    processInline(text: string, placeholder: (html: string) => string): string {
      return text.replace(/\{\{youtube:([a-zA-Z0-9_-]+)\}\}/g, (_m, id) => {
        const fsAttr = allowFs ? ' allowfullscreen' : '';
        const iframe = `<div class="${escapeHtml(wrapperClass)}"><iframe width="${width}" height="${height}" src="https://www.youtube.com/embed/${id}" frameborder="0"${fsAttr}></iframe></div>`;
        return placeholder(iframe);
      });
    },
  };
}
