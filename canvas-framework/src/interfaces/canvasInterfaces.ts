import { ReactNode } from "react";

export type Coords = {
  clientX: number;
  scrollLeft: number;
  scrollTop: number;
  clientY: number;
};

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface MainNodeItemMetadata {
  size?: Size;
  color?: string;
  textSize?: number;
  title?: string;
  description: string;
}

export interface MainNodeItemInterface {
  id: string;
  x: number;
  y: number;
  metadata?: MainNodeItemMetadata;
  [key: string]: any;
}

export interface SupaUser {
  id: string;
  username: string;
  createdAt: string;
  last_seen: string;
  room_id: string;
  metadata?: any;
}

export interface UserStatus {
  id: string;
  last_seen: string;
  position: Position;
}

export interface RoomProviderProps {
  children: ReactNode;
  initialUsername: string;
  roomId: string | null;
}

export type RGB = {
  r: number;
  g: number;
  b: number;
};
