/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activityLogger } from "@/lib/activity-logger";
import type { ActivityAction, EntityType } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      entity_type,
      entity_id,
      board_id,
      metadata = {},
    } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Extract request metadata
    const requestMetadata = activityLogger.extractRequestMetadata(request);

    // Log the activity
    await activityLogger.log({
      user_id: session.user.id,
      action: action as ActivityAction,
      entity_type: entity_type as EntityType,
      entity_id,
      board_id,
      metadata: {
        ...requestMetadata,
        ...metadata,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log activity" },
      { status: 500 }
    );
  }
}
