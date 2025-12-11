import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

/**
 * Configuration for different sanitization levels
 */
const SANITIZE_CONFIG = {
  // Strict: Remove ALL HTML tags (for titles, names, etc.)
  strict: {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard' as const,
  },

  // Markdown: Allow basic formatting tags (for content, descriptions)
  markdown: {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'code': ['class'], // For syntax highlighting
      '*': ['class'], // Allow class on all elements for styling
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard' as const,
  },
};

/**
 * Fields that should use markdown sanitization (allow some HTML)
 * All other string fields will use strict sanitization
 */
const MARKDOWN_FIELDS = ['content', 'description', 'summary', 'text'];

/**
 * SanitizePipe - Removes malicious HTML/scripts from input data
 *
 * This pipe protects against XSS (Cross-Site Scripting) attacks by sanitizing
 * all string inputs. It applies different levels of sanitization based on
 * the field type:
 *
 * - Strict (default): Removes ALL HTML tags - used for titles, names, etc.
 * - Markdown: Allows safe HTML tags - used for content, description fields
 *
 * @example
 * // Applied to controller
 * @UsePipes(SanitizePipe)
 * @Post()
 * create(@Body() dto: CreateIdeaDto) { ... }
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Only transform body parameters
    if (metadata.type !== 'body') {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value, false);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  /**
   * Sanitize a string value
   * @param value - The string to sanitize
   * @param allowMarkdown - Whether to allow markdown-safe HTML
   */
  private sanitizeString(value: string, allowMarkdown: boolean): string {
    const config = allowMarkdown ? SANITIZE_CONFIG.markdown : SANITIZE_CONFIG.strict;
    return sanitizeHtml(value, config);
  }

  /**
   * Recursively sanitize all string values in an object
   * @param obj - The object to sanitize
   * @param parentKey - The parent key (for context-aware sanitization)
   */
  private sanitizeObject(obj: unknown, parentKey?: string): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item, parentKey));
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof value === 'string') {
          // Check if this field should allow markdown
          const allowMarkdown = MARKDOWN_FIELDS.includes(key.toLowerCase());
          sanitized[key] = this.sanitizeString(value, allowMarkdown);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value, key);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }

    return obj;
  }
}
