/**
 * Input Validation Middleware
 *
 * Provides validation and sanitization utilities for API routes
 * to prevent security vulnerabilities like XSS, injection attacks, etc.
 */

import sanitizeHtml from 'sanitize-html';

/**
 * UUID v4 validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validates if a string is a valid UUID v4
 */
export function validateUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return UUID_REGEX.test(value);
}

/**
 * Validates if a string is a valid email
 */
export function validateEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > 320) return false; // Max email length per RFC
  return EMAIL_REGEX.test(value);
}

/**
 * Validates if a string is within acceptable length limits
 */
export function validateLength(value: unknown, min: number, max: number): boolean {
  if (typeof value !== 'string') return false;
  const length = value.length;
  return length >= min && length <= max;
}

/**
 * Validates if a value is a positive integer
 */
export function validatePositiveInteger(value: unknown): boolean {
  let numValue: number;

  if (typeof value !== 'number') {
    const parsed = parseInt(value as string, 10);
    if (isNaN(parsed)) return false;
    numValue = parsed;
  } else {
    numValue = value;
  }

  return Number.isInteger(numValue) && numValue > 0;
}

/**
 * Validates if a value is a valid URL
 */
export function validateURL(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes HTML input to prevent XSS attacks
 * Allows only safe tags and attributes
 */
export function sanitizeInput(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'code': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto']
    },
    // Disallow nested tags that could be used for XSS
    disallowedTagsMode: 'discard',
    // Remove any style attributes
    allowedStyles: {},
  });
}

/**
 * Sanitizes plain text input (removes all HTML tags)
 */
export function sanitizePlainText(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Validates file size (in bytes)
 */
export function validateFileSize(size: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Validates file type based on MIME type
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Common file type groups for validation
 */
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL_IMAGES: ['image/*'],
};

/**
 * Validates request body size to prevent DoS attacks
 * @param contentLength Content-Length header value
 * @param maxSizeMB Maximum allowed size in MB
 */
export function validateRequestSize(contentLength: string | null, maxSizeMB: number = 10): boolean {
  if (!contentLength) return true; // Allow if Content-Length not provided
  const sizeBytes = parseInt(contentLength, 10);
  if (isNaN(sizeBytes)) return true;
  return sizeBytes <= maxSizeMB * 1024 * 1024;
}

/**
 * Validates JSON structure to prevent malformed data attacks
 */
export function validateJSON(value: unknown): boolean {
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }
  return typeof value === 'object' && value !== null;
}

/**
 * Sanitizes and validates a boardId parameter
 */
export function validateBoardId(boardId: unknown): { valid: boolean; error?: string } {
  if (!boardId) {
    return { valid: false, error: 'Board ID is required' };
  }
  if (!validateUUID(boardId)) {
    return { valid: false, error: 'Invalid board ID format' };
  }
  return { valid: true };
}

/**
 * Sanitizes and validates a userId parameter
 */
export function validateUserId(userId: unknown): { valid: boolean; error?: string } {
  if (!userId) {
    return { valid: false, error: 'User ID is required' };
  }
  if (!validateUUID(userId)) {
    return { valid: false, error: 'Invalid user ID format' };
  }
  return { valid: true };
}

/**
 * Validates enum values
 */
export function validateEnum<T extends string>(value: unknown, allowedValues: readonly T[]): value is T {
  if (typeof value !== 'string') return false;
  return (allowedValues as readonly string[]).includes(value);
}

/**
 * Role validation
 */
export const VALID_ROLES = ['viewer', 'contributor', 'editor', 'admin', 'super_admin'] as const;
export type ValidRole = typeof VALID_ROLES[number];

export function validateRole(role: unknown): role is ValidRole {
  return validateEnum(role, VALID_ROLES);
}

/**
 * Board role validation
 */
export const VALID_BOARD_ROLES = ['viewer', 'contributor', 'editor', 'admin'] as const;
export type ValidBoardRole = typeof VALID_BOARD_ROLES[number];

export function validateBoardRole(role: unknown): role is ValidBoardRole {
  return validateEnum(role, VALID_BOARD_ROLES);
}

/**
 * Comprehensive input validation helper
 * Validates multiple fields at once and returns errors
 */
export interface ValidationRule {
  field: string;
  value: unknown;
  rules: Array<{
    type: 'required' | 'uuid' | 'email' | 'length' | 'positive' | 'url' | 'enum' | 'custom';
    message?: string;
    // For length validation
    min?: number;
    max?: number;
    // For enum validation
    allowedValues?: readonly string[];
    // For custom validation
    validator?: (value: unknown) => boolean;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateFields(rules: ValidationRule[]): ValidationResult {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    for (const validation of rule.rules) {
      let isValid = true;
      let errorMessage = validation.message || `Invalid ${rule.field}`;

      switch (validation.type) {
        case 'required':
          isValid = rule.value !== null && rule.value !== undefined && rule.value !== '';
          errorMessage = validation.message || `${rule.field} is required`;
          break;

        case 'uuid':
          isValid = validateUUID(rule.value);
          errorMessage = validation.message || `${rule.field} must be a valid UUID`;
          break;

        case 'email':
          isValid = validateEmail(rule.value);
          errorMessage = validation.message || `${rule.field} must be a valid email`;
          break;

        case 'length':
          if (validation.min !== undefined && validation.max !== undefined) {
            isValid = validateLength(rule.value, validation.min, validation.max);
            errorMessage = validation.message || `${rule.field} must be between ${validation.min} and ${validation.max} characters`;
          }
          break;

        case 'positive':
          isValid = validatePositiveInteger(rule.value);
          errorMessage = validation.message || `${rule.field} must be a positive integer`;
          break;

        case 'url':
          isValid = validateURL(rule.value);
          errorMessage = validation.message || `${rule.field} must be a valid URL`;
          break;

        case 'enum':
          if (validation.allowedValues) {
            isValid = validateEnum(rule.value, validation.allowedValues);
            errorMessage = validation.message || `${rule.field} must be one of: ${validation.allowedValues.join(', ')}`;
          }
          break;

        case 'custom':
          if (validation.validator) {
            isValid = validation.validator(rule.value);
          }
          break;
      }

      if (!isValid) {
        errors[rule.field] = errorMessage;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Example usage in API route:
 *
 * const validation = validateFields([
 *   {
 *     field: 'boardId',
 *     value: body.boardId,
 *     rules: [
 *       { type: 'required' },
 *       { type: 'uuid' }
 *     ]
 *   },
 *   {
 *     field: 'title',
 *     value: body.title,
 *     rules: [
 *       { type: 'required' },
 *       { type: 'length', min: 1, max: 255 }
 *     ]
 *   },
 *   {
 *     field: 'role',
 *     value: body.role,
 *     rules: [
 *       { type: 'required' },
 *       { type: 'enum', allowedValues: VALID_BOARD_ROLES }
 *     ]
 *   }
 * ]);
 *
 * if (!validation.valid) {
 *   return NextResponse.json({ errors: validation.errors }, { status: 400 });
 * }
 */
