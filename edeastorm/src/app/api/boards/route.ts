/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAuthenticatedClient, supabaseAdmin } from "@/lib/supabase";
import { generateShortId } from "@/lib/utils";

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await request.json();

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

    // Get the board to check ownership and organization
    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("id, created_by, organization_id")
      .eq("id", boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner
    const isOwner = board.created_by === session.user.id;

    // Check if user is an admin of the organization
    let isOrgAdmin = false;
    if (board.organization_id) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", board.organization_id)
        .eq("user_id", session.user.id)
        .single();

      isOrgAdmin = membership?.role === "admin";
    }

    // Only owner or org admin can delete
    if (!isOwner && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this board" },
        { status: 403 }
      );
    }

    // Delete the board (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("boards")
      .delete()
      .eq("id", boardId);

    if (deleteError) {
      console.error("Error deleting board:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete board" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting board:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete board" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, problemStatement, description, isPublic, teamId, organizationId } =
      await request.json();

    if (!title || !organizationId) {
      return NextResponse.json(
        { error: "Title and organization ID are required" },
        { status: 400 }
      );
    }

    // Use authenticated client if we have a token, otherwise fall back to admin
    const supabase = session.supabaseAccessToken
      ? createAuthenticatedClient(session.supabaseAccessToken)
      : supabaseAdmin();

    // Verify user is a member of this organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to create boards in this organization" },
        { status: 403 }
      );
    }

    // Create the board
    const { data: board, error } = await supabase
      .from("boards")
      .insert({
        title,
        short_id: generateShortId(),
        problem_statement: problemStatement || null,
        description: description || null,
        is_public: isPublic ?? false,
        team_id: teamId || null,
        organization_id: organizationId,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating board:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create board" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, board });
  } catch (error: any) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create board" },
      { status: 500 }
    );
  }
}
