import { createClient } from "@supabase/supabase-js";

let supabase: any = null;
let boardChannel: any = null;

// Types for messages
// IN: INIT, SUBSCRIBE, UNSUBSCRIBE, BROADCAST_CURSOR
// OUT: STATUS, ITEM_CHANGE, PRESENCE_CHANGE, CURSOR_MOVE

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  try {
    switch (type) {
      case "INIT":
        if (!supabase) {
          const { url, key } = payload;
          supabase = createClient(url, key, {
            realtime: {
              params: {
                eventsPerSecond: 20, // Limit updates?
              },
            },
          });
          self.postMessage({
            type: "STATUS",
            payload: { status: "INITIALIZED" },
          });
        }
        break;

      case "SUBSCRIBE":
        if (!supabase) return;
        const { boardId } = payload;

        // Clean up existing if any (simplification: one board per worker for now)
        if (boardChannel) {
          await supabase.removeChannel(boardChannel);
        }

        // Create new channel
        boardChannel = supabase.channel(`board:${boardId}`);

        // 1. Broadcast (Cursors)
        boardChannel.on(
          "broadcast",
          { event: "cursor" },
          (event: { payload: any }) => {
            self.postMessage({
              type: "CURSOR_MOVE",
              payload: event.payload,
            });
          }
        );

        // 2. Postgres Changes (Items)
        boardChannel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "canvas_items",
            filter: `board_id=eq.${boardId}`,
          },
          (payload: any) => {
            self.postMessage({
              type: "ITEM_CHANGE",
              payload: payload,
            });
          }
        );

        // 3. Postgres Changes (Presence/Users)
        boardChannel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_users",
            filter: `board_id=eq.${boardId}`,
          },
          (payload: any) => {
            self.postMessage({
              type: "PRESENCE_CHANGE",
              payload: payload,
            });
          }
        );

        // Subscribe
        boardChannel.subscribe((status: any) => {
          self.postMessage({ type: "STATUS", payload: { status } });
        });
        break;

      case "UNSUBSCRIBE":
        if (boardChannel && supabase) {
          await supabase.removeChannel(boardChannel);
          boardChannel = null;
        }
        break;

      case "BROADCAST_CURSOR":
        if (boardChannel) {
          const { userId, position } = payload;
          boardChannel.send({
            type: "broadcast",
            event: "cursor",
            payload: { userId, position },
          });
        }
        break;

      default:
        // Ignore unknown
        break;
    }
  } catch (err) {
    console.error("Worker Error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: "ERROR", payload: errorMessage });
  }
};
