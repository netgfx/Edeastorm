/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendInvitationEmail } from "@/lib/email";
import {
  logInvitationSent,
  logMemberAdded,
  activityLogger,
} from "@/lib/activity-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;
    const { email, role = "viewer" } = await request.json();

    if (!email || !orgId) {
      return NextResponse.json(
        { error: "Email and organization ID are required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Verify user is admin or editor of this organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", session.user.id)
      .single();

    if (!membership || !["admin", "editor"].includes(membership.role)) {
      return NextResponse.json(
        { error: "You don't have permission to invite members" },
        { status: 403 }
      );
    }

    // Check if user already exists with this email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingProfile) {
      // User exists, add to members directly
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: orgId,
          user_id: existingProfile.id,
          role,
        });

      if (memberError) {
        // Check for duplicate
        if (memberError.code === "23505") {
          return NextResponse.json(
            { success: false, error: "User is already a member" },
            { status: 400 }
          );
        }
        throw memberError;
      }

      // Log member added activity
      await logMemberAdded(
        session.user.id,
        orgId,
        existingProfile.id,
        role,
        activityLogger.extractRequestMetadata(request)
      );

      return NextResponse.json({
        success: true,
        message: "User added to team",
      });
    } else {
      // User does not exist, create invitation
      const token =
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      const { error: inviteError } = await supabase
        .from("organization_invitations")
        .insert({
          organization_id: orgId,
          email,
          role,
          token,
          invited_by: session.user.id,
        });

      if (inviteError) {
        if (inviteError.code === "23505") {
          return NextResponse.json(
            { success: false, error: "Invitation already sent" },
            { status: 400 }
          );
        }
        throw inviteError;
      }

      // Get organization details for email
      const { data: organization } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single();

      // Get inviter details for email
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", session.user.id)
        .single();

      // Send invitation email
      const emailResult = await sendInvitationEmail({
        to: email,
        organizationName: organization?.name || "the organization",
        inviterName: inviterProfile?.full_name || inviterProfile?.email || "A team member",
        role,
        inviteToken: token,
      });

      if (!emailResult.success) {
        console.error("Failed to send invitation email:", emailResult.error);
        // Don't fail the request if email fails - invitation is still in DB
      }

      // Log invitation sent activity
      await logInvitationSent(
        session.user.id,
        orgId,
        email,
        role,
        {
          ...activityLogger.extractRequestMetadata(request),
          organization_name: organization?.name,
          email_sent: emailResult.success,
        }
      );

      return NextResponse.json({
        success: true,
        message: "Invitation sent",
        emailSent: emailResult.success,
      });
    }
  } catch (error: any) {
    console.error("Error inviting member:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to invite member" },
      { status: 500 }
    );
  }
}
