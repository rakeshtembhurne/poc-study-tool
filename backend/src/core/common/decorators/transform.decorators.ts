import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Transform decorators for data transformation with type safety
 */

/**
 * Transform a string to lowercase
 */
export function ToLowerCase() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });
}

/**
 * Transform a string to uppercase
 */
export function ToUpperCase() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  });
}

/**
 * Trim whitespace from string
 */
export function Trim() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });
}

/**
 * Transform string to boolean
 */
export function ToBoolean() {
  return Transform(({ value }: TransformFnParams): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  });
}

/**
 * Transform to integer
 */
export function ToInt() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value === 'number') {
      return Math.floor(value);
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  });
}

/**
 * Transform to float
 */
export function ToFloat() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  });
}

/**
 * Transform to Date
 */
export function ToDate() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }
    return value;
  });
}

/**
 * Transform to array
 */
export function ToArray<T = any>() {
  return Transform(({ value }: TransformFnParams): T[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()) as T[];
    }
    return [value];
  });
}

/**
 * Default value transformer
 */
export function Default<T>(defaultValue: T) {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return value;
  });
}

/**
 * Sanitize HTML content
 */
export function SanitizeHtml() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value !== 'string') {
      return value;
    }
    // Basic HTML sanitization (in production, use a proper library like DOMPurify)
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  });
}

/**
 * Normalize email
 */
export function NormalizeEmail() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.toLowerCase().trim();
  });
}

/**
 * Remove special characters
 */
export function RemoveSpecialChars(allowed: string = '') {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value !== 'string') {
      return value;
    }
    const pattern = new RegExp(`[^a-zA-Z0-9${allowed}]`, 'g');
    return value.replace(pattern, '');
  });
}

/**
 * Parse JSON string
 */
export function ParseJson<T = any>() {
  return Transform(({ value }: TransformFnParams): T | string => {
    if (typeof value !== 'string') {
      return value;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value;
    }
  });
}

/**
 * Stringify to JSON
 */
export function StringifyJson() {
  return Transform(({ value }: TransformFnParams): string => {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return value;
    }
  });
}

/**
 * Round number to specific decimal places
 */
export function Round(decimals: number = 0) {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value !== 'number') {
      return value;
    }
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  });
}

/**
 * Clamp number between min and max
 */
export function Clamp(min: number, max: number) {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (typeof value !== 'number') {
      return value;
    }
    return Math.min(Math.max(value, min), max);
  });
}
