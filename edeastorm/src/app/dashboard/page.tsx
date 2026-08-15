/** @format */

"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createBoard, getOrganizationBoards } from "@/lib/api";
import toast from "react-hot-toast";
import { BoardCard } from "@/components/canvas/BoardCard";
import { useDashboard } from "@/contexts/DashboardContext";
import { CreateBoardModal } from "@/components/dashboard/CreateBoardModal";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const {
    boards,
    organization,
    selectedOrgId,
    currentUserRole,
    canManageOrganization,
    canCreateBoard,
    handleRenameOrganization,
    handleDeleteBoard,
    refreshBoards,
  } = useDashboard();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenamingOrg, setIsRenamingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState(organization?.name || "");

  // Update newOrgName when organization changes
  if (organization?.name && newOrgName !== organization.name && !isRenamingOrg) {
    setNewOrgName(organization.name);
  }

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
        await refreshBoards();
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

  const onRenameOrganization = async () => {
    await handleRenameOrganization(newOrgName);
    setIsRenamingOrg(false);
  };

  return (
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
                  onKeyDown={(e) => e.key === "Enter" && onRenameOrganization()}
                />
                <Button size="xs" onClick={onRenameOrganization}>
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
          {boards.map((board) => {
            // User can delete if they're the owner or an org admin
            const isOwner = board.created_by === session?.user?.id;
            const isOrgAdmin = currentUserRole === "admin";
            const canDelete = isOwner || isOrgAdmin;

            return (
              <BoardCard
                key={board.id}
                board={board}
                canDelete={canDelete}
                onDelete={handleDeleteBoard}
              />
            );
          })}
        </div>
      )}

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreate={handleCreateBoard}
        isCreating={isCreating}
      />
    </>
  );
}
