/** @format */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Fetch invitation with organization details
    const { data: invitation, error } = await supabase
      .from("organization_invitations")
      .select(
        `
        *,
        organization:organization_id (
          id,
          name,
          slug
        ),
        inviter:invited_by (
          full_name,
          email
        )
      `
      )
      .eq("token", token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
      organizationId: invitation.organization.id,
      inviterName:
        invitation.inviter?.full_name ||
        invitation.inviter?.email ||
        "A team member",
    });
  } catch (error: any) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}
