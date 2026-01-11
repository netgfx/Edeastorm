/**
 * Custom Yjs provider that uses Supabase Realtime broadcast
 * instead of WebSocket or WebRTC providers
 */

import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { Awareness } from "y-protocols/awareness";
import * as awarenessProtocol from "y-protocols/awareness";

export interface SupabaseProviderOptions {
  supabase: SupabaseClient;
  documentId: string;
  awareness?: Awareness;
  onSynced?: () => void;
  onStatus?: (status: "connected" | "disconnected" | "connecting") => void;
}

export class SupabaseProvider {
  private doc: Y.Doc;
  private channel: RealtimeChannel | null = null;
  private supabase: SupabaseClient;
  private documentId: string;
  public awareness: Awareness;
  private synced = false;
  private onSynced?: () => void;
  private onStatus?: (
    status: "connected" | "disconnected" | "connecting"
  ) => void;
  private updateHandler: (update: Uint8Array, origin: any) => void;
  private awarenessUpdateHandler: ({ added, updated, removed }: any) => void;

  constructor(doc: Y.Doc, options: SupabaseProviderOptions) {
    this.doc = doc;
    this.supabase = options.supabase;
    this.documentId = options.documentId;
    this.onSynced = options.onSynced;
    this.onStatus = options.onStatus;

    // Initialize awareness
    this.awareness = options.awareness || new Awareness(doc);

    // Bind handlers
    this.updateHandler = this.handleDocUpdate.bind(this);
    this.awarenessUpdateHandler = this.handleAwarenessUpdate.bind(this);

    // Listen to document updates
    this.doc.on("update", this.updateHandler);

    // Listen to awareness updates (cursor positions, user info)
    this.awareness.on("update", this.awarenessUpdateHandler);

    // Connect to Supabase channel
    this.connect();
  }

  private async connect() {
    this.onStatus?.("connecting");

    // Create channel for this document
    this.channel = this.supabase.channel(`yjs:${this.documentId}`, {
      config: {
        broadcast: {
          ack: false, // Faster, no acknowledgment needed
        },
      },
    });

    // Listen for document updates from other clients
    this.channel.on(
      "broadcast",
      { event: "yjs-update" },
      (payload: { payload: { update: number[] } }) => {
        // Convert array back to Uint8Array and apply
        const update = new Uint8Array(payload.payload.update);
        Y.applyUpdate(this.doc, update, this);
      }
    );

    // Listen for awareness updates (cursors, user info)
    this.channel.on(
      "broadcast",
      { event: "yjs-awareness" },
      (payload: { payload: { update: number[]; clientId: number } }) => {
        const update = new Uint8Array(payload.payload.update);
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this);
      }
    );

    // Subscribe to channel
    this.channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        this.onStatus?.("connected");

        // Request initial sync from other clients
        await this.requestSync();

        // Mark as synced after a brief delay (waiting for sync responses)
        setTimeout(() => {
          if (!this.synced) {
            this.synced = true;
            this.onSynced?.();
          }
        }, 500);
      } else if (status === "CLOSED") {
        this.onStatus?.("disconnected");
      }
    });

    // Listen for sync requests from new clients
    this.channel.on("broadcast", { event: "yjs-sync-request" }, async () => {
      // Send full document state to help new client sync
      await this.sendSync();
    });

    // Listen for sync responses
    this.channel.on(
      "broadcast",
      { event: "yjs-sync-response" },
      (payload: { payload: { state: number[] } }) => {
        const state = new Uint8Array(payload.payload.state);
        Y.applyUpdate(this.doc, state, this);

        if (!this.synced) {
          this.synced = true;
          this.onSynced?.();
        }
      }
    );
  }

  private handleDocUpdate(update: Uint8Array, origin: any) {
    // Don't broadcast updates that came from the network
    if (origin === this) return;

    // Broadcast update to other clients
    this.channel?.send({
      type: "broadcast",
      event: "yjs-update",
      payload: {
        update: Array.from(update), // Convert to array for JSON
      },
    });
  }

  private handleAwarenessUpdate({ added, updated, removed }: any) {
    const changedClients = added.concat(updated).concat(removed);

    // Encode awareness update using the protocol's built-in encoder
    const update = awarenessProtocol.encodeAwarenessUpdate(
      this.awareness,
      changedClients
    );

    // Broadcast awareness to other clients
    this.channel?.send({
      type: "broadcast",
      event: "yjs-awareness",
      payload: {
        update: Array.from(update),
        clientId: this.doc.clientID,
      },
    });
  }

  private async requestSync() {
    // Request full document state from connected clients
    await this.channel?.send({
      type: "broadcast",
      event: "yjs-sync-request",
      payload: {},
    });
  }

  private async sendSync() {
    // Send full document state
    const state = Y.encodeStateAsUpdate(this.doc);

    await this.channel?.send({
      type: "broadcast",
      event: "yjs-sync-response",
      payload: {
        state: Array.from(state),
      },
    });
  }

  public destroy() {
    // Cleanup
    this.doc.off("update", this.updateHandler);
    this.awareness.off("update", this.awarenessUpdateHandler);

    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.awareness.destroy();
  }

  public get connected(): boolean {
    return this.channel?.state === "joined";
  }
}
