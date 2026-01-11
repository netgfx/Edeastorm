/** @format */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  Users,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  createBoard,
  updateOrganization,
  getUserOrganizations,
  getOrganizationBoards,
  getOrganizationMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/lib/api";
import type { Tables } from "@/types/database";
import toast from "react-hot-toast";
import { BoardCard } from "@/components/canvas/BoardCard";
import { usePermissions } from "@/hooks/usePermissions";
import { OrgWithRole, MemberWithProfile } from "@/types/dashboard";
import { TeamMembersList } from "@/components/dashboard/TeamMembersList";
import { InviteMemberModal } from "@/components/dashboard/InviteMemberModal";
import { CreateBoardModal } from "@/components/dashboard/CreateBoardModal";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [boards, setBoards] = useState<Tables<"boards">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [organization, setOrganization] =
    useState<Tables<"organizations"> | null>(null);
  const [isRenamingOrg, setIsRenamingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  // Team Management State
  const [userOrgs, setUserOrgs] = useState<OrgWithRole[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<MemberWithProfile[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);

  const currentUserRole = userOrgs.find((o) => o.id === selectedOrgId)?.role;
  const { canManageTeam, canManageOrganization, canCreateBoard } =
    usePermissions(currentUserRole);

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
          if (orgs.length > 0) {
            const defaultOrg =
              orgs.find((o) => o.id === session.user.organizationId) || orgs[0];
            setSelectedOrgId(defaultOrg.id);
            setOrganization(defaultOrg as any);
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
            getOrganizationMembers(selectedOrgId),
          ]);
          setBoards(orgBoards);
          // @ts-ignore
          setOrgMembers(members);

          // Update current organization object
          const currentOrg = userOrgs.find((o) => o.id === selectedOrgId);
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
  const handleCreateBoard = async (title: string, problemStatement: string) => {
    if (!title.trim()) {
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
        title: title,
        problemStatement: problemStatement,
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

  const handleInviteMember = async (
    email: string,
    role: "admin" | "editor" | "viewer"
  ) => {
    if (!email.trim() || !selectedOrgId) return;

    setIsInviting(true);
    try {
      const result = await inviteMember(selectedOrgId, email, role);
      if (result.success) {
        toast.success(result.message || "Invitation sent");
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
    if (!canManageTeam) {
      toast.error("Only admins can remove members");
      return;
    }
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

  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "editor" | "viewer"
  ) => {
    if (!selectedOrgId) return;

    if (!canManageTeam) {
      toast.error("Only admins can manage roles");
      return;
    }

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
    if (!canManageOrganization) {
      toast.error("Only admins can rename the organization");
      return;
    }

    try {
      const updated = await updateOrganization(organization.id, {
        name: newOrgName,
      });
      if (updated) {
        setOrganization(updated);
        // Update in list too
        setUserOrgs((prev) =>
          prev.map((o) =>
            o.id === updated.id ? { ...o, name: updated.name } : o
          )
        );
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
                  {org.role === "admin" && (
                    <span className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/20">
                      Admin
                    </span>
                  )}
                  {org.role === "editor" && (
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                      Editor
                    </span>
                  )}
                  {org.role === "viewer" && (
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
                  <p className="text-zinc-400">
                    Manage access to {organization?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowTeamManagement(false)}
                  >
                    Back to Boards
                  </Button>
                  {canManageTeam && (
                    <Button onClick={() => setIsInviteModalOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Invite Member
                    </Button>
                  )}
                </div>
              </div>

              <TeamMembersList
                members={orgMembers}
                canManageTeam={canManageTeam}
                onUpdateRole={handleUpdateRole}
                onRemoveMember={handleRemoveMember}
              />
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
                        {canManageOrganization && (
                          <button
                            onClick={() => setIsRenamingOrg(true)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded text-zinc-500"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold">Boards</h1>
                </div>
                <p className="text-zinc-400">
                  {boards.length} board{boards.length !== 1 ? "s" : ""} in this
                  workspace
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
                    {canCreateBoard
                      ? "Create your first board to start brainstorming with your team"
                      : "There are no boards in this workspace yet"}
                  </p>
                  {canCreateBoard && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Create Your First Board
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Create new board card */}
                  {canCreateBoard && (
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
                  )}

                  {/* Board cards */}
                  {boards.map((board) => (
                    <BoardCard key={board.id} board={board} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        orgName={organization?.name}
        onInvite={handleInviteMember}
        isInviting={isInviting}
      />

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreate={handleCreateBoard}
        isCreating={isCreating}
      />
    </div>
  );
}
