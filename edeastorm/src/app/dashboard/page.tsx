/** @format */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  MoreHorizontal,
  Clock,
  Users,
  Archive,
  Trash2,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  getUserBoards,
  createBoard,
  getOrganization,
  updateOrganization,
  getUserOrganizations,
  getOrganizationBoards,
  getOrganizationMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { Tables } from "@/types/database";
import toast from "react-hot-toast";

type OrgWithRole = Pick<Tables<"organizations">, "id" | "name" | "slug"> & {
  role: "admin" | "editor" | "viewer";
};

type MemberWithProfile = Tables<"organization_members"> & {
  profiles: Pick<Tables<"profiles">, "id" | "full_name" | "email" | "avatar_url">;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [boards, setBoards] = useState<Tables<"boards">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoard, setNewBoard] = useState({
    title: "",
    problemStatement: "",
  });

  const [organization, setOrganization] =
    useState<Tables<"organizations"> | null>(null);
  const [isRenamingOrg, setIsRenamingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  // Team Management State
  const [userOrgs, setUserOrgs] = useState<OrgWithRole[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<MemberWithProfile[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [isInviting, setIsInviting] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      if (status === "authenticated" && session?.user?.id) {
        try {
          // Fetch user's organizations
          const orgs = await getUserOrganizations(session.user.id);
          // @ts-ignore
          setUserOrgs(orgs);
          
          // Set default selected org (personal or first one)
          // Ideally we check session.user.organizationId but let's use the list
          if (orgs.length > 0) {
             // Prefer the one in session if available
             const defaultOrg = orgs.find(o => o.id === session.user.organizationId) || orgs[0];
             setSelectedOrgId(defaultOrg.id);
             setOrganization(defaultOrg as any); // Type mismatch workaround for now
             setNewOrgName(defaultOrg.name);
          }

        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Failed to load dashboard");
        } finally {
          setIsLoading(false);
        }
      } else if (status === "authenticated" && !session?.user?.id) {
        const timeout = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timeout);
      }
    }
    fetchData();
  }, [session?.user?.id, status]);

  // Fetch boards and members when selected org changes
  useEffect(() => {
    async function fetchOrgData() {
      if (selectedOrgId) {
        setIsLoading(true);
        try {
          const [orgBoards, members] = await Promise.all([
            getOrganizationBoards(selectedOrgId),
            getOrganizationMembers(selectedOrgId)
          ]);
          setBoards(orgBoards);
          // @ts-ignore
          setOrgMembers(members);
          
          // Update current organization object
          const currentOrg = userOrgs.find(o => o.id === selectedOrgId);
          if (currentOrg) {
             setOrganization(currentOrg as any);
             setNewOrgName(currentOrg.name);
          }
        } catch (error) {
          console.error("Error fetching org data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchOrgData();
  }, [selectedOrgId, userOrgs]);

  // Create new board
  const handleCreateBoard = async () => {
    if (!newBoard.title.trim()) {
      toast.error("Please enter a board title");
      return;
    }

    if (!session?.user?.id) {
      toast.error("Please sign in to create a board");
      return;
    }

    setIsCreating(true);

    try {
      const organizationId = selectedOrgId || session.user.organizationId;

      if (!organizationId) {
        toast.error(
          "Unable to create board. You are not assigned to an organization."
        );
        return;
      }

      const board = await createBoard({
        title: newBoard.title,
        problemStatement: newBoard.problemStatement,
        organizationId: organizationId,
        createdBy: session.user.id,
      });

      if (board) {
        toast.success("Board created successfully!");
        router.push(`/board/${board.short_id}`);
        // Refresh boards
        const updatedBoards = await getOrganizationBoards(organizationId);
        setBoards(updatedBoards);
        setIsCreateModalOpen(false);
      } else {
        toast.error("Failed to create board");
      }
    } catch (error) {
      console.error("Error creating board:", error);
      toast.error("An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedOrgId) return;
    
    setIsInviting(true);
    try {
      const result = await inviteMember(selectedOrgId, inviteEmail, inviteRole);
      if (result.success) {
        toast.success(result.message || "Invitation sent");
        setInviteEmail("");
        setIsInviteModalOpen(false);
        // Refresh members
        const members = await getOrganizationMembers(selectedOrgId);
        // @ts-ignore
        setOrgMembers(members);
      } else {
        toast.error(result.error || "Failed to invite member");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrgId) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const success = await removeMember(selectedOrgId, userId);
      if (success) {
        toast.success("Member removed");
        const members = await getOrganizationMembers(selectedOrgId);
        // @ts-ignore
        setOrgMembers(members);
      } else {
        toast.error("Failed to remove member");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "admin" | "editor" | "viewer") => {
    if (!selectedOrgId) return;
    
    try {
      const success = await updateMemberRole(selectedOrgId, userId, newRole);
      if (success) {
        toast.success("Role updated");
        const members = await getOrganizationMembers(selectedOrgId);
        // @ts-ignore
        setOrgMembers(members);
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleRenameOrganization = async () => {
    if (!newOrgName.trim() || !organization) return;

    try {
      const updated = await updateOrganization(organization.id, {
        name: newOrgName,
      });
      if (updated) {
        setOrganization(updated);
        // Update in list too
        setUserOrgs(prev => prev.map(o => o.id === updated.id ? { ...o, name: updated.name } : o));
        setIsRenamingOrg(false);
        toast.success("Organization renamed!");
      }
    } catch (error) {
      toast.error("Failed to rename organization");
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Logo
                width={38}
                height={38}
                colors={["#ffffff"]}
                withStroke={true}
                strokeWidth={0.5}
                className="drop-shadow-md"
              />
            </div>
            <span className="text-xl font-bold gradient-text">Edeastorm</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              New Board
            </Button>

            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <Avatar className="w-9 h-9">
                  {session?.user?.image && (
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.name || ""}
                    />
                  )}
                  <AvatarFallback>
                    {getInitials(
                      session?.user?.name || session?.user?.email || "U"
                    )}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-4 py-2 border-b border-zinc-700">
                  <p className="font-medium truncate">{session?.user?.name}</p>
                  <p className="text-sm text-zinc-400 truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 flex items-center gap-2 text-zinc-300"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 flex items-center gap-2 text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-8">
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
              Workspaces
            </h3>
            <div className="space-y-1">
              {userOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrgId(org.id);
                    setShowTeamManagement(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedOrgId === org.id && !showTeamManagement
                      ? "bg-violet-500/10 text-violet-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  {org.role === 'admin' && (
                    <span className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/20">
                      Admin
                    </span>
                  )}
                  {org.role === 'editor' && (
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                      Editor
                    </span>
                  )}
                  {org.role === 'viewer' && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">
                      Viewer
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedOrgId && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
                Quick Actions
              </h3>
              <button
                onClick={() => setShowTeamManagement(true)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showTeamManagement
                    ? "bg-violet-500/10 text-violet-400"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <Users className="w-4 h-4" />
                Manage Members
              </button>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {showTeamManagement ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Team Members</h1>
                  <p className="text-zinc-400">Manage access to {organization?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowTeamManagement(false)}
                  >
                    Back to Boards
                  </Button>
                  <Button onClick={() => setIsInviteModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Invite Member
                  </Button>
                </div>
              </div>

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
                    {orgMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-zinc-800/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              {member.profiles?.avatar_url && (
                                <AvatarImage src={member.profiles.avatar_url} />
                              )}
                              <AvatarFallback>
                                {getInitials(member.profiles?.full_name || member.profiles?.email || "U")}
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
                            onChange={(e) => handleUpdateRole(member.user_id, e.target.value as any)}
                            disabled={member.user_id === session?.user?.id} // Can't change own role
                            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {member.user_id !== session?.user?.id && (
                            <button
                              onClick={() => handleRemoveMember(member.user_id)}
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
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 group">
                    {isRenamingOrg ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          className="h-8 w-48 bg-zinc-900"
                          autoFocus
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleRenameOrganization()
                          }
                        />
                        <Button size="xs" onClick={handleRenameOrganization}>
                          Save
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setIsRenamingOrg(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-sm font-medium text-violet-400 uppercase tracking-wider">
                          {organization?.name || "Personal Workspace"}
                        </h2>
                        <button
                          onClick={() => setIsRenamingOrg(true)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded text-zinc-500"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold">Boards</h1>
                </div>
                <p className="text-zinc-400">
                  {boards.length} board{boards.length !== 1 ? "s" : ""} in this workspace
                </p>
              </div>

              {/* Boards grid */}
              {boards.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No boards yet</h2>
                  <p className="text-zinc-400 mb-6">
                    Create your first board to start brainstorming with your team
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Create Your First Board
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Create new board card */}
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-48 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-violet-500/50 flex flex-col items-center justify-center gap-3 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                      <Plus className="w-6 h-6 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <span className="text-zinc-400 group-hover:text-white transition-colors">
                      New Board
                    </span>
                  </button>

                  {/* Board cards */}
                  {boards.map((board) => (
                    <Link
                      key={board.id}
                      href={`/board/${board.short_id}`}
                      className="h-48 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 p-5 flex flex-col transition-all hover:shadow-lg hover:shadow-violet-500/5 group"
                    >
                      {/* Thumbnail preview */}
                      <div className="flex-1 rounded-lg bg-zinc-800/50 mb-4 overflow-hidden grid-bg relative">
                        {/* We could add a preview image here later */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                          <span className="text-xs font-medium bg-black/50 px-2 py-1 rounded text-white">Open Board</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate group-hover:text-violet-400 transition-colors">
                            {board.title}
                          </h3>
                          <p className="text-xs text-zinc-500 truncate">
                            Edited {formatRelativeTime(board.updated_at || board.created_at)}
                          </p>
                        </div>
                        {board.is_public && (
                          <div className="shrink-0" title="Public Board">
                            <Users className="w-3 h-3 text-zinc-500" />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join {organization?.name}. They will receive an email with instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Email Address</label>
              <Input
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['admin', 'editor', 'viewer'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setInviteRole(role)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                      inviteRole === role
                        ? "bg-violet-500/10 border-violet-500 text-violet-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-medium capitalize">{role}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {inviteRole === 'admin' && "Can manage team members and all boards."}
                {inviteRole === 'editor' && "Can create and edit boards."}
                {inviteRole === 'viewer' && "Can only view boards. No editing allowed."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail.trim()}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Create Board Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Start a new ideation session with your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Board Title *
              </label>
              <Input
                placeholder="e.g., Product Roadmap Brainstorm"
                value={newBoard.title}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, title: e.target.value })
                }
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Problem Statement / Challenge
              </label>
              <Textarea
                placeholder="What problem are we trying to solve? What's the challenge we're addressing?"
                value={newBoard.problemStatement}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, problemStatement: e.target.value })
                }
                rows={3}
              />
              <p className="text-xs text-zinc-500 mt-1">
                This will be displayed at the top of the board to guide ideation
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={isCreating}>
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Board
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
