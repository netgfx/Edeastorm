import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureUserWorkspace } from "@/lib/workspace-provisioning";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureUserWorkspace({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });

    const supabase = supabaseAdmin();
    const { data: memberships, error: membershipsError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", session.user.id);

    if (membershipsError) throw membershipsError;

    const organizationIds = (memberships || []).map(
      (membership) => membership.organization_id
    );

    if (organizationIds.length === 0) {
      return NextResponse.json({ organizations: [] });
    }

    const { data: organizations, error: organizationsError } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .in("id", organizationIds);

    if (organizationsError) throw organizationsError;

    const organizationsById = new Map(
      (organizations || []).map((organization) => [
        organization.id,
        organization,
      ])
    );

    return NextResponse.json({
      organizations: (memberships || []).flatMap((membership) => {
        const organization = organizationsById.get(
          membership.organization_id
        );
        return organization
          ? [{ ...organization, role: membership.role }]
          : [];
      }),
    });
  } catch (error) {
    console.error("Unable to bootstrap the user's workspace:", error);
    return NextResponse.json(
      { error: "Unable to load or create your workspace" },
      { status: 500 }
    );
  }
}
