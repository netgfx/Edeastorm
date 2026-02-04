/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAuthenticatedClient, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("boardId");

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

    const { data, error } = await supabase
      .from("room_users")
      .select("*")
      .eq("board_id", boardId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching room users:", error);
      return NextResponse.json(
        { error: "Failed to fetch room users" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, users: data ?? [] });
  } catch (error: any) {
    console.error("Error in get room users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch room users" },
      { status: 500 }
    );
  }
}
