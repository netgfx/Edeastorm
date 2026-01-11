import type { Tables } from "@/types/database";

export type OrgWithRole = Pick<
  Tables<"organizations">,
  "id" | "name" | "slug"
> & {
  role: "admin" | "editor" | "viewer";
};

export type MemberWithProfile = Tables<"organization_members"> & {
  profiles: Pick<
    Tables<"profiles">,
    "id" | "full_name" | "email" | "avatar_url"
  > | null;
};
