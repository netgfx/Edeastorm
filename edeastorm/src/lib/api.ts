/** @format */

// @ts-nocheck
import { supabase } from "@/lib/supabase";
import type { Tables, InsertTables, UpdateTables } from "@/types/database";
import type {
  CanvasItem,
  UserPresence,
  Position,
  BoardImage,
} from "@/types/canvas";
import { useGlobalStore } from "@/store/globalStore";
import { useNodeStore } from "@/store/nodeStore";
import { LAST_SEEN_UPDATE_THRESHOLD } from "@/lib/constants";
import { generateShortId } from "@/lib/utils";

// ============================================
// BOARD OPERATIONS
// ============================================

export async function createBoard(data: {
  title: string;
  problemStatement?: string;
  description?: string;
  isPublic?: boolean;
  teamId?: string;
  organizationId: string;
  createdBy: string;
}): Promise<Tables<"boards"> | null> {
  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      title: data.title,
      short_id: generateShortId(),
      problem_statement: data.problemStatement,
      description: data.description,
      is_public: data.isPublic ?? false,
      team_id: data.teamId ?? null,
      organization_id: data.organizationId,
      created_by: data.createdBy,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating board:", error);
    return null;
  }

  return board;
}

export async function getBoardByShortId(
  shortId: string
): Promise<Tables<"boards"> | null> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("short_id", shortId)
    .single();

  if (error) {
    console.error("Error getting board:", error);
    return null;
  }

  return data;
}

export async function updateBoard(
  boardId: string,
  updates: UpdateTables<"boards">
): Promise<Tables<"boards"> | null> {
  const { data, error } = await supabase
    .from("boards")
    // @ts-ignore
    .update(updates)
    .eq("id", boardId)
    .select()
    .single();

  if (error) {
    console.error("Error updating board:", error);
    return null;
  }

  return data;
}

export async function deleteBoard(boardId: string): Promise<boolean> {
  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) {
    console.error("Error deleting board:", error);
    return false;
  }

  return true;
}

export async function getUserBoards(
  userId: string
): Promise<Tables<"boards">[]> {
  if (
    !userId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      userId
    )
  ) {
    return [];
  }

  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      `Error fetching user boards for ${userId}:`,
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return data ?? [];
}

// ============================================
// CANVAS ITEM OPERATIONS
// ============================================

export async function getCanvasItems(boardId: string): Promise<CanvasItem[]> {
  const { data, error } = await supabase
    .from("canvas_items")
    .select("*")
    .eq("board_id", boardId)
    .order("z_index", { ascending: true });

  if (error) {
    console.error("Error fetching canvas items:", error.message || error);
    return [];
  }

  return (data ?? []) as CanvasItem[];
}

export async function createCanvasItem(
  boardId: string,
  item: Omit<InsertTables<"canvas_items">, "board_id">
): Promise<CanvasItem | null> {
  const { data, error } = await supabase
    .from("canvas_items")
    .insert({
      ...item,
      board_id: boardId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating canvas item:", error);
    return null;
  }

  return data as CanvasItem;
}

export async function updateCanvasItem(
  itemId: string,
  updates: UpdateTables<"canvas_items">
): Promise<CanvasItem | null> {
  const { data, error } = await supabase
    .from("canvas_items")
    // @ts-ignore
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("Error updating canvas item:", error);
    return null;
  }

  return data as CanvasItem;
}

export async function deleteCanvasItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from("canvas_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting canvas item:", error);
    return false;
  }

  return true;
}

// ============================================
// ROOM/PRESENCE OPERATIONS
// ============================================

export async function joinRoom(
  boardId: string,
  userId: string | null,
  username: string
): Promise<Tables<"room_users"> | null> {
  // Check if user already exists in room
  if (userId) {
    const { data: existing } = await supabase
      .from("room_users")
      .select("*")
      .eq("board_id", boardId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update last_seen
      const { data } = await supabase
        .from("room_users")
        // @ts-ignore
        .update({ last_seen: new Date().toISOString(), is_active: true })
        .eq("id", existing.id)
        .select()
        .single();
      return data;
    }
  }

  // Create new room user
  const { data, error } = await supabase
    .from("room_users")
    .insert({
      board_id: boardId,
      user_id: userId,
      username,
      color:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error joining room:", JSON.stringify(error, null, 2));
    return null;
  }

  return data;
}

export async function leaveRoom(roomUserId: string): Promise<boolean> {
  const { error } = await supabase
    .from("room_users")
    // @ts-ignore
    .update({ is_active: false })
    .eq("id", roomUserId);

  if (error) {
    console.error("Error leaving room:", error);
    return false;
  }

  return true;
}

export async function getRoomUsers(
  boardId: string
): Promise<Tables<"room_users">[]> {
  const { data, error } = await supabase
    .from("room_users")
    .select("*")
    .eq("board_id", boardId)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching room users:", JSON.stringify(error, null, 2));
    return [];
  }

  return data ?? [];
}

export async function updateUserCursor(
  roomUserId: string,
  position: Position
): Promise<void> {
  const store = useGlobalStore.getState();
  const now = Date.now();

  // Only update DB if threshold exceeded
  if (now - store.lastUpdated > LAST_SEEN_UPDATE_THRESHOLD) {
    await supabase
      .from("room_users")
      // @ts-ignore
      .update({
        cursor_x: position.x,
        cursor_y: position.y,
        last_seen: new Date().toISOString(),
      })
      .eq("id", roomUserId);

    store.setLastUpdated(now);
  }
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToBoard(
  boardId: string,
  callbacks: {
    onItemChange?: (payload: any) => void;
    onPresenceChange?: (payload: any) => void;
  }
) {
  const channels: ReturnType<typeof supabase.channel>[] = [];

  // Subscribe to canvas items changes
  if (callbacks.onItemChange) {
    const itemChannel = supabase
      .channel(`board:${boardId}:items`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "canvas_items",
          filter: `board_id=eq.${boardId}`,
        },
        callbacks.onItemChange
      )
      .subscribe();
    channels.push(itemChannel);
  }

  // Subscribe to room users changes
  if (callbacks.onPresenceChange) {
    const presenceChannel = supabase
      .channel(`board:${boardId}:presence`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_users",
          filter: `board_id=eq.${boardId}`,
        },
        callbacks.onPresenceChange
      )
      .subscribe();
    channels.push(presenceChannel);
  }

  // Return cleanup function
  return () => {
    channels.forEach((channel) => channel.unsubscribe());
  };
}

export function subscribeToBroadcast(
  roomId: string,
  callbacks: {
    onCursorMove?: (payload: { userId: string; position: Position }) => void;
  }
) {
  const channel = supabase.channel(roomId);

  if (callbacks.onCursorMove) {
    channel.on("broadcast", { event: "cursor" }, (payload) => {
      callbacks.onCursorMove!(payload.payload);
    });
  }

  channel.subscribe();

  return {
    broadcast: (event: string, payload: any) => {
      channel.send({ type: "broadcast", event, payload });
    },
    unsubscribe: () => channel.unsubscribe(),
  };
}

// ============================================
// SNAPSHOT OPERATIONS
// ============================================

export async function createSnapshot(
  boardId: string,
  name: string,
  description: string,
  userId: string
): Promise<Tables<"board_snapshots"> | null> {
  const items = useNodeStore.getState().nodes;

  const { data, error } = await supabase
    .from("board_snapshots")
    .insert({
      board_id: boardId,
      name,
      description,
      snapshot_data: items,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating snapshot:", error);
    return null;
  }

  return data;
}

export async function getSnapshots(
  boardId: string
): Promise<Tables<"board_snapshots">[]> {
  const { data, error } = await supabase
    .from("board_snapshots")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching snapshots:", error);
    return [];
  }

  return data ?? [];
}

// ============================================
// PROFILE OPERATIONS
// ============================================

export async function getProfile(
  userId: string
): Promise<Tables<"profiles"> | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: UpdateTables<"profiles">
): Promise<Tables<"profiles"> | null> {
  const { data, error } = await supabase
    .from("profiles")
    // @ts-ignore
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data;
}

// ============================================
// ORGANIZATION OPERATIONS
// ============================================

export async function getOrganizations(): Promise<Tables<"organizations">[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }

  return data ?? [];
}

export async function getOrganization(
  orgId: string
): Promise<Tables<"organizations"> | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) {
    console.error(
      "Error fetching organization:",
      JSON.stringify(error, null, 2)
    );
    return null;
  }

  return data;
}

export async function updateOrganization(
  orgId: string,
  updates: UpdateTables<"organizations">
): Promise<Tables<"organizations"> | null> {
  const { data, error } = await supabase
    .from("organizations")
    // @ts-ignore
    .update(updates)
    .eq("id", orgId)
    .select()
    .single();

  if (error) {
    console.error(
      "Error updating organization:",
      JSON.stringify(error, null, 2)
    );
    return null;
  }

  return data;
}

export async function getDefaultOrganization(): Promise<Tables<"organizations"> | null> {
  // Try to get the user's specific organization from their session first
  const session = await useGlobalStore.getState(); // Generic state check if possible

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", "demo")
    .maybeSingle();

  if (error) {
    console.error(
      "Error fetching demo organization:",
      JSON.stringify(error, null, 2)
    );
  }

  if (data) return data;

  // Fallback: get the first available organization
  const { data: firstOrg } = await supabase
    .from("organizations")
    .select("*")
    .limit(1)
    .maybeSingle();

  return firstOrg;
}

// ============================================
// BOARD IMAGE OPERATIONS
// ============================================

export async function getBoardImages(boardId: string): Promise<BoardImage[]> {
  const { data, error } = await supabase
    .from("board_images")
    .select("*")
    .eq("board_id", boardId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching board images:", error);
    return [];
  }

  return data ?? [];
}

export async function deleteBoardImage(imageId: string): Promise<boolean> {
  // First get the image to find its storage path
  const { data: image, error: fetchError } = await supabase
    .from("board_images")
    .select("storage_path")
    .eq("id", imageId)
    .single();

  if (fetchError || !image) {
    console.error("Error fetching image for deletion:", fetchError);
    return false;
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("board-images")
    .remove([image.storage_path]);

  if (storageError) {
    console.error("Error deleting image from storage:", storageError);
    return false;
  }

  // Delete from database (will trigger reordering via trigger)
  const { error: dbError } = await supabase
    .from("board_images")
    .delete()
    .eq("id", imageId);

  if (dbError) {
    console.error("Error deleting image from database:", dbError);
    return false;
  }

  return true;
}

export async function updateBoardImageCaption(
  imageId: string,
  caption: string
): Promise<boolean> {
  const { error } = await supabase
    .from("board_images")
    .update({ caption })
    .eq("id", imageId);

  if (error) {
    console.error("Error updating image caption:", error);
    return false;
  }

  return true;
}

export async function reorderBoardImages(
  boardId: string,
  imageIds: string[]
): Promise<boolean> {
  // Update display_order for all images
  const updates = imageIds.map((id, index) =>
    supabase
      .from("board_images")
      .update({ display_order: index })
      .eq("id", id)
      .eq("board_id", boardId)
  );

  const results = await Promise.all(updates);

  const hasError = results.some(({ error }) => error !== null);
  if (hasError) {
    console.error("Error reordering images");
    return false;
  }

  return true;
}
