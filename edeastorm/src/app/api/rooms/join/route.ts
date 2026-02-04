/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAuthenticatedClient, supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, username } = await request.json();

    if (!boardId) {
      return NextResponse.json(
        { error: "Board ID is required" },
        { status: 400 }
      );
    }

    // Use authenticated client if we have a token, otherwise fall back to admin
    const supabase = session.supabaseAccessToken
      ? createAuthenticatedClient(session.supabaseAccessToken)
      : supabaseAdmin();
    const userId = session.user.id;
    const displayName = username || session.user.name || "Anonymous";

    // Check if user already exists in room
    const { data: existing } = await supabase
      .from("room_users")
      .select("*")
      .eq("board_id", boardId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update last_seen and is_active
      const { data, error } = await supabase
        .from("room_users")
        .update({ last_seen: new Date().toISOString(), is_active: true })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating room user:", error);
        return NextResponse.json(
          { error: "Failed to update room presence" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, roomUser: data });
    }

    // Create new room user
    const { data, error } = await supabase
      .from("room_users")
      .insert({
        board_id: boardId,
        user_id: userId,
        username: displayName,
        color:
          "#" +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0"),
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === "23505") {
        // Fetch the existing record instead
        const { data: existingUser } = await supabase
          .from("room_users")
          .select("*")
          .eq("board_id", boardId)
          .eq("user_id", userId)
          .single();

        if (existingUser) {
          // Update and return the existing user
          const { data: updated } = await supabase
            .from("room_users")
            .update({ last_seen: new Date().toISOString(), is_active: true })
            .eq("id", existingUser.id)
            .select()
            .single();

          return NextResponse.json({ success: true, roomUser: updated || existingUser });
        }
      }

      console.error("Error joining room:", error);
      return NextResponse.json(
        { error: error.message || "Failed to join room" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, roomUser: data });
  } catch (error: any) {
    console.error("Error in join room:", error);
    return NextResponse.json(
      { error: error.message || "Failed to join room" },
      { status: 500 }
    );
  }
}
