/**
 * Escapes HTML special characters to prevent XSS.
 * Handles &, <, >, ", and ' (single quote).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates a URL scheme against an allowlist.
 * Returns true if the URL uses an allowed scheme (http, https, mailto, tel, ftp).
 * Returns false for javascript:, data:, vbscript:, etc.
 */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (/^[a-z][a-z0-9+.-]*:/.test(trimmed)) {
    return /^(https?|mailto|tel|ftp):/.test(trimmed);
  }
  // Relative URLs, anchors, protocol-relative are allowed
  return true;
}

/**
 * Sanitizes a URL: if unsafe, returns empty string; otherwise returns escaped URL.
 */
export function sanitizeUrl(url: string): string {
  return isSafeUrl(url) ? escapeHtml(url) : '';
}
