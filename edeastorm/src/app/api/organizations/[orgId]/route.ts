import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;
  if (!UUID_PATTERN.test(orgId)) {
    return NextResponse.json(
      { error: "Invalid organization ID" },
      { status: 400 }
    );
  }

  try {
    const supabase = supabaseAdmin();
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resource = request.nextUrl.searchParams.get("resource");

    if (resource === "boards") {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ boards: data || [] });
    }

    if (resource === "members") {
      const { data, error } = await supabase
        .from("organization_members")
        .select(
          `
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .eq("organization_id", orgId);

      if (error) throw error;
      return NextResponse.json({ members: data || [] });
    }

    return NextResponse.json(
      { error: "A supported resource is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Unable to load organization data:", error);
    return NextResponse.json(
      { error: "Unable to load organization data" },
      { status: 500 }
    );
  }
}
