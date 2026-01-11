import { Trash2 } from "lucide-react";
import { MemberWithProfile } from "@/types/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useSession } from "next-auth/react";

interface TeamMembersListProps {
  members: MemberWithProfile[];
  canManageTeam: boolean;
  onUpdateRole: (
    userId: string,
    newRole: "admin" | "editor" | "viewer"
  ) => void;
  onRemoveMember: (userId: string) => void;
}

export function TeamMembersList({
  members,
  canManageTeam,
  onUpdateRole,
  onRemoveMember,
}: TeamMembersListProps) {
  const { data: session } = useSession();

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
          <tr>
            <th className="px-6 py-4 font-medium">User</th>
            <th className="px-6 py-4 font-medium">Role</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-zinc-800/30">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    {member.profiles?.avatar_url && (
                      <AvatarImage src={member.profiles.avatar_url} />
                    )}
                    <AvatarFallback>
                      {getInitials(
                        member.profiles?.full_name ||
                          member.profiles?.email ||
                          "U"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-zinc-200">
                      {member.profiles?.full_name || "Unknown User"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {member.profiles?.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <select
                  value={member.role}
                  onChange={(e) =>
                    onUpdateRole(member.user_id, e.target.value as any)
                  }
                  disabled={
                    member.user_id === session?.user?.id || !canManageTeam
                  }
                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-50"
                  aria-label="Select Role"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </td>
              <td className="px-6 py-4 text-right">
                {member.user_id !== session?.user?.id && canManageTeam && (
                  <button
                    onClick={() => onRemoveMember(member.user_id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
