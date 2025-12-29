import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random short ID
 */
export function generateShortId(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Find the center of the canvas viewport
 */
export function findCenter(live: boolean = false) {
  const container = document.querySelector('.draggable-wrapper');
  const area = document.querySelector('.draggable-area');

  if (!container || !area) return { x: 0, y: 0 };

  const cBounds = container.getBoundingClientRect();
  const aBounds = area.getBoundingClientRect();

  if (live) {
    // Get scale from the area's transform style
    const style = window.getComputedStyle(area);
    const matrix = new DOMMatrix(style.transform);
    const scale = matrix.a || 1;

    return {
      x: Math.round((-1 * aBounds.left + cBounds.left + cBounds.width / 2) / scale),
      y: Math.round((-1 * aBounds.top + cBounds.top + cBounds.height / 2) / scale),
    };
  }

  return {
    x: Math.round((area as HTMLElement).offsetWidth / 2 - (container as HTMLElement).offsetWidth / 2),
    y: Math.round((area as HTMLElement).offsetHeight / 2 - (container as HTMLElement).offsetHeight / 2),
  };
}

/**
 * Calculate click coordinates accounting for canvas scale and position
 */
export function calcClickCoords(
  clientX: number,
  clientY: number,
  mainAreaRef: HTMLElement,
  scale: number
) {
  const mainRef = mainAreaRef.getBoundingClientRect();
  return {
    x: Math.round((-1 * mainRef.x) / scale + clientX / scale),
    y: Math.round((-1 * mainRef.y) / scale + clientY / scale),
  };
}

/**
 * Calculate distance between two points (hypotenuse)
 */
export function getHypotenuse(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

/**
 * Darken a hex color
 */
export function darkenColor(hexColor: string): string {
  const defaultColor = '#92CFFF';
  const hex = hexColor ?? defaultColor;

  const hexToRgb = (h: string) => {
    const clean = h.replace('#', '');
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  };

  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const rgb = hexToRgb(hex);

  const darkened = {
    r: clamp(rgb.r - 8),
    g: clamp(rgb.g - 20),
    b: clamp(rgb.b - 29),
  };

  return '#' + [darkened.r, darkened.g, darkened.b]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a unique color from a UUID
 */
export function uuidToColor(uuid: string): string {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  hash = Math.abs(hash);

  const r = (150 + (hash % 50)) % 256;
  const g = (150 + ((hash >> 8) % 50)) % 256;
  const b = (150 + ((hash >> 16) % 50)) % 256;

  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

/**
 * Decode HTML entities
 */
export function htmlDecode(input: string): string | null {
  const result = new DOMParser().parseFromString(input, 'text/html');
  return result.documentElement.textContent;
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString();
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
