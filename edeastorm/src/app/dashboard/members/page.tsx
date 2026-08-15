/** @format */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/contexts/DashboardContext";
import { TeamMembersList } from "@/components/dashboard/TeamMembersList";
import { InviteMemberModal } from "@/components/dashboard/InviteMemberModal";

export default function MembersPage() {
  const {
    organization,
    orgMembers,
    canManageTeam,
    handleInviteMember,
    handleUpdateRole,
    handleRemoveMember,
  } = useDashboard();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const onInvite = async (email: string, role: "admin" | "editor" | "viewer") => {
    setIsInviting(true);
    try {
      const result = await handleInviteMember(email, role);
      if (result.success) {
        setIsInviteModalOpen(false);
      }
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Team Members</h1>
            <p className="text-zinc-400">
              Manage access to {organization?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost">Back to Boards</Button>
            </Link>
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

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        orgName={organization?.name}
        onInvite={onInvite}
        isInviting={isInviting}
      />
    </>
  );
}
