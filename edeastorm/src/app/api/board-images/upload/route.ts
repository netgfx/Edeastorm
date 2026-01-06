/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const boardId = formData.get("boardId") as string;
    const caption = formData.get("caption") as string | null;
    const displayOrder = parseInt(formData.get("displayOrder") as string);

    if (!file || !boardId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user is board creator
    const admin = supabaseAdmin();
    const { data: board, error: boardError } = await admin
      .from("boards")
      .select("created_by")
      .eq("id", boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (board.created_by !== session.user.id) {
      return NextResponse.json(
        { error: "Only board creator can upload images" },
        { status: 403 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const storagePath = `${boardId}/${fileName}`;

    // Upload to Supabase Storage using admin client
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from("board-images")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file", details: uploadError.message },
        { status: 500 }
      );
    }

    // Get image dimensions if it's an image
    let width: number | null = null;
    let height: number | null = null;

    if (file.type.startsWith("image/")) {
      // Note: Getting dimensions server-side requires additional libraries
      // For now, we'll let the client send dimensions or set to null
      width = parseInt(formData.get("width") as string) || null;
      height = parseInt(formData.get("height") as string) || null;
    }

    // Save metadata to database
    const { data: imageData, error: dbError } = await admin
      .from("board_images")
      .insert({
        board_id: boardId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        width,
        height,
        caption: caption || null,
        display_order: displayOrder,
        uploaded_by: session.user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Cleanup: delete the uploaded file
      await admin.storage.from("board-images").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to save metadata", details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: imageData });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
