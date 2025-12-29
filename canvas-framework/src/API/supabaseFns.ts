import { createClient, RealtimePresenceState } from "@supabase/supabase-js";
import {
  SUPABASE_API_KEY,
  SUPABASE_URL,
  UPDATE_LAST_SEEN_THRESHOLD,
} from "../helpers/constants";
import { getRoomIdFromUrl, setRoomIdInUrl } from "../helpers/utils";
import { UserStatus } from "../interfaces/canvasInterfaces";
import { MainNodeChild } from "../models/MainNodeChild";
import { useGlobalStore } from "../state/globalState";

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

// Create a new room
export const createRoom = async () => {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .insert([{}]) // Empty object - let Postgres generate the UUID and short_id
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

// Get room by short ID
export const getRoomByShortId = async (shortId: string) => {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("short_id", shortId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting room:", error);
    throw error;
  }
};

// Join a room using short ID
export const joinRoom = async (shortId: string, username: string) => {
  try {
    if (username === "") {
      console.log("Username cannot be empty");
      return { user: null, room: null };
    }
    // First get the full room data
    const room = await getRoomByShortId(shortId);
    if (!room) {
      throw new Error("Room not found");
    }

    // save the current room to the global state
    useGlobalStore.getState().setCurrentRoom(room.id);

    // Check if username is already taken in this room
    const { data: existingUser } = await supabase
      .from("room_users")
      .select("*") // Explicitly select all columns
      .eq("room_id", room.id)
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      // Update last_seen for existing user
      const { data, error } = await supabase
        .from("room_users")
        .update({ last_seen: new Date().toISOString() })
        .eq("room_id", room.id)
        .eq("username", username)
        .select()
        .single();

      if (error) throw error;
      return { user: data, room };
    }

    // Create new user
    const { data, error } = await supabase
      .from("room_users")
      .insert([{ room_id: room.id, username }])
      .select()
      .single();

    if (error) throw error;
    return { user: data, room };
  } catch (error) {
    console.error("Error joining room:", error);
    throw error;
  }
};

// Get all entities for a room
export const getRoomEntities = async (shortId: string) => {
  try {
    const room = await getRoomByShortId(shortId);
    if (!room) {
      throw new Error("Room not found");
    }

    const { data, error } = await supabase
      .from("room_entities")
      .select(
        `
        id,
        entity_id,
        x,
        y,
        metadata,
        created_at,
        updated_at,
        room_users!created_by(username)
      `
      )
      .eq("room_id", room.id);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching room entities:", error);
    throw error;
  }
};

export const getInitialEntities = async (roomId: string) => {
  const { data: entities } = await supabase
    .from("room_entities")
    .select("*")
    .eq("room_id", roomId);

  return entities;
};

export const getInitialConnectedUsers = async (roomId: string) => {
  const { data: users } = await supabase
    .from("room_users")
    .select("*")
    .eq("room_id", roomId);

  return users;
};

// Subscribe to room changes using short ID
export const subscribeToRoom = async (
  shortId: string,
  onEntityChange: (payload: any) => void,
  onUserChange: (payload: any) => void
) => {
  try {
    const room = await getRoomByShortId(shortId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Subscribe to entity changes
    const entitySubscription = supabase
      .channel(`room:${room.id}:entities`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_entities",
          filter: `room_id=eq.${room.id}`,
        },
        onEntityChange
      )
      .subscribe();

    // Subscribe to user presence changes
    const userSubscription = supabase
      .channel(`room:${room.id}:users`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_users",
          filter: `room_id=eq.${room.id}`,
        },
        onUserChange
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      entitySubscription.unsubscribe();
      userSubscription.unsubscribe();
    };
  } catch (error) {
    console.error("Error subscribing to room:", error);
    throw error;
  }
};

export const subscribeToPresence = (
  roomId: string,
  syncFn?: (newState: RealtimePresenceState) => void
) => {
  const roomOne = supabase.channel(roomId);

  console.log("subscribing to room: ", roomId);

  // Setup channel with all event handlers first
  const channel = roomOne
    .on("presence", { event: "sync" }, () => {
      const newState = roomOne.presenceState();
      console.log("sync event received", newState);
    })
    .on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log("join", key, newPresences);
    })
    .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log("leave", key, leftPresences);
    })
    .on(
      "broadcast",
      { event: "POS" },
      (payload: Record<string, UserStatus>) => {
        useGlobalStore
          .getState()
          .updateUserPosition(payload.payload.id, payload.payload.position);
      }
    );

  // Single subscribe with callback that handles initial tracking
  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      console.log("Successfully subscribed!");

      try {
        await channel.track({
          id: useGlobalStore.getState().currentUser?.id,
          last_seen: new Date().toISOString(),
          position: { x: 0, y: 0 },
        });
        console.log("Successfully tracked presence");
      } catch (error) {
        console.error("Error tracking presence:", error);
      }
    } else {
      console.log("Subscription status:", status);
    }
  });

  // Return the channel for cleanup purposes
  return channel;
};

export const syncPresence = async (userStatus: UserStatus) => {
  const roomId = useGlobalStore.getState().currentRoom;
  const username = useGlobalStore.getState().currentUser?.username;
  if (roomId && username) {
    const roomOne = supabase.channel(roomId);

    roomOne
      .send({
        type: "broadcast",
        event: "POS",
        payload: userStatus,
      })
      .catch(() => {});

    if (
      Math.round(
        Math.abs(Date.now() - useGlobalStore.getState().lastUpdated) / 1000
      ) > UPDATE_LAST_SEEN_THRESHOLD
    ) {
      console.log("should update DB");
      await supabase
        .from("room_users")
        .update({ last_seen: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("username", username);
      useGlobalStore.getState().setLastUpdated(Date.now());
    }
  }
};

// Example usage with room creation/joining logic
export const initializeRoom = async (
  providedRoomId: string | null = null,
  username: string
) => {
  try {
    // First check URL params
    const urlRoomId = getRoomIdFromUrl();

    // Use provided room ID if no URL param exists
    const targetRoomId = urlRoomId || providedRoomId;

    if (targetRoomId) {
      try {
        // Try to join existing room
        const joinResult = await joinRoom(targetRoomId, username);
        setRoomIdInUrl(targetRoomId); // Ensure room ID is in URL
        return {
          ...joinResult,
          short_id: targetRoomId,
          isNewRoom: false,
        };
      } catch (error: any) {
        if (error.message === "Room not found") {
          // If room doesn't exist, create new one
          const newRoom = await createRoom();
          const joinResult = await joinRoom(newRoom.short_id, username);
          setRoomIdInUrl(newRoom.short_id);
          return {
            ...joinResult,
            short_id: newRoom.short_id,
            isNewRoom: true,
          };
        }
        throw error; // Re-throw if it's a different error
      }
    } else {
      console.log("no room id provided");
      // No room ID provided, create new room
      const newRoom = await createRoom();
      const joinResult = await joinRoom(newRoom.short_id, username);
      setRoomIdInUrl(newRoom.short_id);
      return {
        ...joinResult,
        short_id: newRoom.short_id,
        isNewRoom: true,
      };
    }
  } catch (error) {
    console.error("Error initializing room:", error);
    throw error;
  }
};

// Entity operations
export const updateEntity = async (roomId: string, entity: MainNodeChild) => {
  console.log("updating entity: ", entity, roomId);
  await supabase
    .from("room_entities")
    .update(entity)
    .eq("room_id", roomId)
    .eq("id", entity.id);
};

export const deleteEntity = async (roomId: string, entityId: string) => {
  await supabase
    .from("room_entities")
    .delete()
    .eq("room_id", roomId)
    .eq("id", entityId);
};

export const createEntity = async (
  roomId: string,
  entity: Omit<MainNodeChild, "id">
) => {
  await supabase.from("room_entities").insert({
    ...entity,
    room_id: roomId,
    entity_id: crypto.randomUUID(),
  });
};
