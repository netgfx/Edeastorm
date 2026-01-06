// Canvas configuration constants
export const CANVAS_WIDTH = 10000;
export const CANVAS_HEIGHT = 10000;

// Default note dimensions
export const TILE_WIDTH = 140;
export const TILE_HEIGHT = 140;

// Default note color
export const DEFAULT_NOTE_COLOR = 'yellow';

// Note color palette - 6 readable colors with good contrast
export const NOTE_COLORS: Record<string, string> = {
  yellow: '#FEF3C7',    // Soft yellow
  pink: '#FBCFE8',      // Soft pink
  blue: '#DBEAFE',      // Soft blue
  green: '#D1FAE5',     // Soft green
  purple: '#E9D5FF',    // Soft purple
  orange: '#FED7AA',    // Soft orange
};

// Color names for UI display
export const NOTE_COLOR_NAMES: Record<string, string> = {
  yellow: 'Yellow',
  pink: 'Pink',
  blue: 'Blue',
  green: 'Green',
  purple: 'Purple',
  orange: 'Orange',
};

// Color swatches in RGB format (for certain UI elements)
export const SWATCHES_RGB: Record<string, string> = {
  purple: '106, 69, 208',
  green: '82, 184, 126',
  blue: '80, 120, 223',
  red: '228, 71, 71',
  orange: '231, 141, 51',
  pink: '239, 105, 151',
  brown: '124, 99, 91',
  teal: '0, 188, 215',
  grey: '148, 148, 148',
};

// Zoom constraints
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

// Presence update threshold (in milliseconds)
export const PRESENCE_UPDATE_INTERVAL = 50;
export const LAST_SEEN_UPDATE_THRESHOLD = 15 * 60 * 1000; // 15 minutes

// Canvas item types
export const ITEM_TYPES = {
  STICKY_NOTE: 'sticky_note',
  IMAGE: 'image',
  HEADER: 'header',
  SHAPE: 'shape',
  CONNECTOR: 'connector',
} as const;

// User roles
export const USER_ROLES = {
  VIEWER: 'viewer',
  CONTRIBUTOR: 'contributor',
  EDITOR: 'editor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

// Board access roles
export const BOARD_ROLES = {
  VIEWER: 'viewer',
  CONTRIBUTOR: 'contributor',
  EDITOR: 'editor',
  ADMIN: 'admin',
} as const;

// Team member roles
export const TEAM_ROLES = {
  MEMBER: 'member',
  MODERATOR: 'moderator',
  OWNER: 'owner',
} as const;

// Animation durations (in seconds)
export const ANIMATION = {
  FAST: 0.1,
  NORMAL: 0.2,
  SLOW: 0.3,
  ZOOM: 0.15,
};

// Snap settings
export const SNAP_RADIUS = 25;
export const SNAP_ENABLED = true;

// Text size constraints
export const MIN_TEXT_SIZE = 10;
export const MAX_TEXT_SIZE = 24;
export const DEFAULT_TEXT_SIZE = 14;

// Max content length
export const MAX_NOTE_CONTENT_LENGTH = 200;

// Cursors update throttle
export const CURSOR_UPDATE_THROTTLE = 50; // ms
