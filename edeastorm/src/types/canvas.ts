/** @format */

import type { Tables } from "./database";

// Canvas item types
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasItemMetadata {
  title?: string;
  description?: string;
  color?: string;
  textSize?: number;
  size?: Size;
  url?: string;
  alt?: string;
}

export interface CanvasItem extends Omit<Tables<"canvas_items">, "metadata"> {
  metadata: CanvasItemMetadata;
}

// User presence types
export interface UserPresence {
  id: string;
  username: string;
  cursor: Position;
  color: string;
  lastSeen: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
}

// Board image types
export interface BoardImage {
  id: string;
  board_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  display_order: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

// Board types
export interface Board extends Tables<"boards"> {
  creator?: Tables<"profiles">;
  collaborators?: Tables<"board_collaborators">[];
  images?: BoardImage[];
  itemCount?: number;
}

export interface BoardSettings {
  canvasWidth: number;
  canvasHeight: number;
  defaultNoteColor: string;
  allowAnonymous: boolean;
  moderationEnabled: boolean;
}

// Snapshot types
export interface SnapshotItem {
  id: string;
  item_type: string;
  x: number;
  y: number;
  z_index: number;
  metadata: CanvasItemMetadata;
  created_by: string | null;
}

// Realtime payload types
export interface RealtimePayload<T> {
  type: "broadcast" | "postgres_changes";
  event: string;
  payload: T;
}

export interface EntityChangePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: CanvasItem | null;
  old: { id: string } | null;
}

export interface PresencePayload {
  id: string;
  position: Position;
  last_seen: string;
}

// Room state
export interface RoomState {
  connectedUsers: Record<string, UserPresence>;
  roomData: Tables<"boards"> | null;
  isConnected: boolean;
  error: Error | null;
}

// Draggable context
export interface DraggableContextType {
  dragStart?: boolean;
  dragEnd?: boolean;
  clickedNode?: boolean;
  draggableInstance?: any;
  htmlRef?: React.RefObject<HTMLDivElement | null>;
  data?: CanvasItem;
}

// Tool types
export type ToolType = "select" | "pan" | "note" | "image" | "header";

// Access check result
export interface AccessCheckResult {
  hasAccess: boolean;
  role: "viewer" | "contributor" | "editor" | "admin" | null;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Form types
export interface CreateBoardFormData {
  title: string;
  problemStatement: string;
  description?: string;
  isPublic?: boolean;
  teamId?: string;
}

export interface UpdateBoardFormData {
  title?: string;
  problemStatement?: string;
  description?: string;
  isPublic?: boolean;
  isArchived?: boolean;
}
