/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entity_type");
    const userId = searchParams.get("user_id");
    const organizationId = searchParams.get("organization_id");

    const supabase = supabaseAdmin();

    // Build query - activity_log table not in generated types yet, using any
    let query = (supabase as any)
      .from("activity_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) {
      query = query.eq("action", action);
    }

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    // Filter by organization - check if user has access to this org
    if (organizationId) {
      // Verify user is member of this organization
      const { data: membership } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", session.user.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: "You don't have access to this organization" },
          { status: 403 }
        );
      }

      // Filter by organization_id in metadata
      query = query.contains("metadata", { organization_id: organizationId });
    } else {
      // If no specific org, only show activities for user's organizations
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", session.user.id);

      if (memberships && memberships.length > 0) {
        // This is a simplified filter - in production you might want a more sophisticated approach
        // For now, show user's own activities
        query = query.eq("user_id", session.user.id);
      }
    }

    const { data: activities, error, count } = await query;

    if (error) {
      console.error("Error fetching activities:", error);
      throw error;
    }

    return NextResponse.json({
      activities,
      total: count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching activity log:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch activity log" },
      { status: 500 }
    );
  }
}
