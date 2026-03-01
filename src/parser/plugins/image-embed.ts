import type { TexyParserPlugin } from '../../types';

export interface ImageEmbedPluginOptions {
  /** Max width for embedded images (default: '300px') */
  maxWidth?: string;
  /** CSS class for embedded images */
  className?: string;
  /** Enable linked images: "[* img *]":URL syntax (default: true) */
  enableLinkedImages?: boolean;
}

/**
 * Enhanced image embed plugin for TexyParser.
 *
 * Handles external image URLs in Texy image syntax:
 *   [* https://example.com/photo.jpg *]
 *   [* https://example.com/photo.jpg .(alt text) *]
 *
 * Also supports linked images:
 *   "[* https://example.com/photo.jpg *]":https://example.com
 */
export function imageEmbedPlugin(options: ImageEmbedPluginOptions = {}): TexyParserPlugin {
  const maxWidth = options.maxWidth ?? '300px';
  const className = options.className ?? 'texy-image';
  const enableLinkedImages = options.enableLinkedImages !== false;

  return {
    name: 'image-embed',

    preprocess(text: string): string {
      if (!enableLinkedImages) return text;

      // Convert linked images: "[* URL *]":LINK → {{imglink:URL|LINK}}
      text = text.replace(
        /"\[\*\s+(\S+?)(?:\s+\.\(([^)]*)\))?\s*\*?\]"\s*:\s*(\S+)/g,
        (_m, imgUrl, alt, linkUrl) => {
          const altPart = alt ? `|alt:${alt}` : '';
          return `{{imglink:${imgUrl}${altPart}|${linkUrl}}}`;
        },
      );

      return text;
    },

    processInline(text: string, placeholder: (html: string) => string): string {
      // Expand {{imglink:URL|alt:TEXT|LINK}} placeholders
      text = text.replace(
        /\{\{imglink:(\S+?)(?:\|alt:([^|]*))?\|(\S+)\}\}/g,
        (_m, imgUrl, alt, linkUrl) => {
          const altAttr = alt ? ` alt="${alt}"` : ' alt=""';
          const img = `<a href="${linkUrl}"><img src="${imgUrl}"${altAttr} class="${className}" style="max-width:${maxWidth}"></a>`;
          return placeholder(img);
        },
      );

      return text;
    },
  };
}
