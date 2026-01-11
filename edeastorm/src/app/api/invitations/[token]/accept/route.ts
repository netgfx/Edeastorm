/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Fetch invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
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

    // Check if the signed-in user's email matches the invitation
    if (session.user.email !== invitation.email) {
      return NextResponse.json(
        {
          error:
            "This invitation was sent to a different email address. Please sign in with the correct account.",
        },
        { status: 403 }
      );
    }

    // Look up the user profile by email (more reliable than session.user.id)
    // This handles cases where session.user.id might not match the actual profile ID
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (profileError || !userProfile) {
      // Profile doesn't exist - create it now
      // NOTE: Profile should have been created in signIn callback, but if we're here, it failed or wasn't triggered
      console.log(
        "Profile not found for email, creating now:",
        session.user.email
      );

      // The profile ID must use session.user.id which is the Supabase Auth user ID
      if (!session.user.id) {
        return NextResponse.json(
          { error: "Invalid session user ID" },
          { status: 401 }
        );
      }

      const profileId = session.user.id;

      // Attempt to create the profile
      const { error: createError } = await supabase.from("profiles").insert({
        id: profileId,
        email: session.user.email!,
        full_name: session.user.name || session.user.email!.split("@")[0],
        avatar_url: session.user.image,
        organization_id: invitation.organization_id, // Set from invitation
        role: invitation.role, // Use role from invitation
      });

      if (createError) {
        console.error("Error creating profile:", createError);

        // Handle FK violation (retry once)
        if (createError.code === "23503") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const { error: retryError } = await supabase.from("profiles").insert({
            id: profileId,
            email: session.user.email!,
            full_name: session.user.name || session.user.email!.split("@")[0],
            avatar_url: session.user.image,
            organization_id: invitation.organization_id,
            role: invitation.role,
          });

          if (retryError && retryError.code !== "23505") {
            if (retryError.code === "23503") {
              return NextResponse.json(
                { error: "Session invalid", code: "INVALID_SESSION" },
                { status: 401 }
              );
            }
            return NextResponse.json(
              { error: "Failed to create profile" },
              { status: 500 }
            );
          }
        } else if (createError.code !== "23505") {
          return NextResponse.json(
            { error: "Failed to create profile" },
            { status: 500 }
          );
        }
      }

      // Profile created (or existed), now add member
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: invitation.organization_id,
          user_id: profileId,
          role: invitation.role,
        });

      if (memberError && memberError.code !== "23505") throw memberError;

      // Delete the invitation
      await supabase
        .from("organization_invitations")
        .delete()
        .eq("id", invitation.id);

      return NextResponse.json({
        success: true,
        message: "Successfully joined",
      });
    }

    // Use the profile ID from the database
    const profileId = userProfile.id;

    // Update profile with organization if it's not set (onboarding)
    // or just leave it. The organization_members is the source of truth for access.
    // We can update default org context if we want.
    await supabase
      .from("profiles")
      .update({
        organization_id: invitation.organization_id,
        role: invitation.role,
      })
      .eq("id", profileId);

    // Add user to organization
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: invitation.organization_id,
        user_id: profileId,
        role: invitation.role,
      });

    if (memberError && memberError.code !== "23505") throw memberError;

    // Delete the invitation after successful acceptance
    await supabase
      .from("organization_invitations")
      .delete()
      .eq("id", invitation.id);

    return NextResponse.json({
      success: true,
      message: "Successfully joined the organization",
    });
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
