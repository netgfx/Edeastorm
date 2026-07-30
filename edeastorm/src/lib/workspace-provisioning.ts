import { supabaseAdmin } from "@/lib/supabase";

type OrganizationRole = "admin" | "editor" | "viewer";

interface WorkspaceUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

function profileRoleToOrganizationRole(
  role: string | null | undefined
): OrganizationRole {
  if (role === "admin" || role === "super_admin") return "admin";
  if (role === "viewer") return "viewer";
  return "editor";
}

function createPersonalWorkspaceSlug(user: WorkspaceUser) {
  const emailPrefix = user.email.split("@")[0] || "user";
  const base =
    emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 70) || "user";
  const userSuffix = user.id.replaceAll("-", "").slice(0, 12);

  return `${base}-${userSuffix}`;
}

/**
 * Repairs incomplete account provisioning and guarantees that the current user
 * has at least one organization membership.
 *
 * This must only be called on the server for the authenticated user.
 */
export async function ensureUserWorkspace(user: WorkspaceUser): Promise<void> {
  const supabase = supabaseAdmin();

  const initialProfileResult = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .maybeSingle();
  let profile = initialProfileResult.data;

  if (initialProfileResult.error) {
    throw new Error(
      `Unable to load the user profile: ${initialProfileResult.error.message}`
    );
  }

  if (!profile) {
    const { error: insertProfileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.name || user.email.split("@")[0],
        avatar_url: user.image || null,
        role: "contributor",
      });

    if (insertProfileError && insertProfileError.code !== "23505") {
      throw new Error(
        `Unable to create the user profile: ${insertProfileError.message}`
      );
    }

    const profileResult = await supabase
      .from("profiles")
      .select("id, organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileResult.error || !profileResult.data) {
      throw new Error(
        `Unable to reload the user profile: ${
          profileResult.error?.message || "profile not found"
        }`
      );
    }

    profile = profileResult.data;
  }

  const membershipResult = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id);

  if (membershipResult.error) {
    throw new Error(
      `Unable to load workspace memberships: ${membershipResult.error.message}`
    );
  }

  const existingMembership = membershipResult.data?.[0];
  if (existingMembership) {
    if (profile.organization_id !== existingMembership.organization_id) {
      const { error } = await supabase
        .from("profiles")
        .update({
          organization_id: existingMembership.organization_id,
          role: existingMembership.role,
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(
          `Unable to set the primary workspace: ${error.message}`
        );
      }
    }
    return;
  }

  const invitationResult = await supabase
    .from("organization_invitations")
    .select("organization_id, role")
    .eq("email", user.email)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (invitationResult.error) {
    throw new Error(
      `Unable to check workspace invitations: ${invitationResult.error.message}`
    );
  }

  if (invitationResult.data) {
    const { organization_id: organizationId, role } = invitationResult.data;
    const { error: membershipError } = await supabase
      .from("organization_members")
      .upsert(
        {
          organization_id: organizationId,
          user_id: user.id,
          role,
        },
        {
          onConflict: "organization_id,user_id",
          ignoreDuplicates: true,
        }
      );

    if (membershipError) {
      throw new Error(
        `Unable to join the invited workspace: ${membershipError.message}`
      );
    }

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ organization_id: organizationId, role })
      .eq("id", user.id);

    if (updateProfileError) {
      throw new Error(
        `Unable to set the invited workspace: ${updateProfileError.message}`
      );
    }
    return;
  }

  if (profile.organization_id) {
    const role = profileRoleToOrganizationRole(profile.role);
    const { error } = await supabase.from("organization_members").insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      role,
    });

    if (error && error.code !== "23505") {
      throw new Error(
        `Unable to repair the workspace membership: ${error.message}`
      );
    }
    return;
  }

  const slug = createPersonalWorkspaceSlug(user);
  const organizationResult = await supabase
    .from("organizations")
    .insert({
      name: "My Workspace",
      slug,
    })
    .select("id")
    .single();
  let organization = organizationResult.data;

  if (organizationResult.error?.code === "23505") {
    const existingOrganizationResult = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (
      existingOrganizationResult.error ||
      !existingOrganizationResult.data
    ) {
      throw new Error(
        `Unable to recover the personal workspace: ${
          existingOrganizationResult.error?.message || "workspace not returned"
        }`
      );
    }
    organization = existingOrganizationResult.data;
  } else if (organizationResult.error || !organization) {
    throw new Error(
      `Unable to create a personal workspace: ${
        organizationResult.error?.message || "workspace not returned"
      }`
    );
  }

  const { error: membershipError } = await supabase
    .from("organization_members")
    .upsert(
      {
        organization_id: organization.id,
        user_id: user.id,
        role: "admin",
      },
      {
        onConflict: "organization_id,user_id",
        ignoreDuplicates: true,
      }
    );

  if (membershipError) {
    throw new Error(
      `Unable to create the workspace membership: ${membershipError.message}`
    );
  }

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      organization_id: organization.id,
      role: "admin",
    })
    .eq("id", user.id);

  if (updateProfileError) {
    throw new Error(
      `Unable to set the personal workspace: ${updateProfileError.message}`
    );
  }
}
