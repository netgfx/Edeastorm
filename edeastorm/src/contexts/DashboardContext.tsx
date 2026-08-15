/** @format */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getUserOrganizations,
  getOrganizationBoards,
  getOrganizationMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
  updateOrganization,
  deleteBoard,
} from "@/lib/api";
import type { Tables } from "@/types/database";
import { OrgWithRole, MemberWithProfile } from "@/types/dashboard";
import { usePermissions } from "@/hooks/usePermissions";
import toast from "react-hot-toast";

interface DashboardContextType {
  // State
  userOrgs: OrgWithRole[];
  selectedOrgId: string | null;
  organization: Tables<"organizations"> | null;
  boards: Tables<"boards">[];
  orgMembers: MemberWithProfile[];
  isLoading: boolean;

  // Permissions
  currentUserRole: "admin" | "editor" | "viewer" | undefined;
  canManageTeam: boolean;
  canManageOrganization: boolean;
  canCreateBoard: boolean;

  // Actions
  setSelectedOrgId: (id: string) => void;
  refreshMembers: () => Promise<void>;
  refreshBoards: () => Promise<void>;
  handleInviteMember: (email: string, role: "admin" | "editor" | "viewer") => Promise<{ success: boolean }>;
  handleRemoveMember: (userId: string) => Promise<void>;
  handleUpdateRole: (userId: string, newRole: "admin" | "editor" | "viewer") => Promise<void>;
  handleRenameOrganization: (newName: string) => Promise<void>;
  handleDeleteBoard: (boardId: string, boardTitle: string) => Promise<boolean>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [boards, setBoards] = useState<Tables<"boards">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState<Tables<"organizations"> | null>(null);
  const [userOrgs, setUserOrgs] = useState<OrgWithRole[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<MemberWithProfile[]>([]);

  const currentUserRole = userOrgs.find((o) => o.id === selectedOrgId)?.role;
  const { canManageTeam, canManageOrganization, canCreateBoard } = usePermissions(currentUserRole);

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
          const orgs = await getUserOrganizations();
          // @ts-ignore
          setUserOrgs(orgs);

          if (orgs.length > 0) {
            const defaultOrg =
              orgs.find((o) => o.id === session.user.organizationId) || orgs[0];
            setSelectedOrgId(defaultOrg.id);
            setOrganization(defaultOrg as any);
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

          const currentOrg = userOrgs.find((o) => o.id === selectedOrgId);
          if (currentOrg) {
            setOrganization(currentOrg as any);
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

  const refreshMembers = async () => {
    if (selectedOrgId) {
      const members = await getOrganizationMembers(selectedOrgId);
      // @ts-ignore
      setOrgMembers(members);
    }
  };

  const refreshBoards = async () => {
    if (selectedOrgId) {
      const orgBoards = await getOrganizationBoards(selectedOrgId);
      setBoards(orgBoards);
    }
  };

  const handleInviteMember = async (email: string, role: "admin" | "editor" | "viewer") => {
    if (!email.trim() || !selectedOrgId) return { success: false };

    try {
      const result = await inviteMember(selectedOrgId, email, role);
      if (result.success) {
        toast.success(result.message || "Invitation sent");
        await refreshMembers();
        return { success: true };
      } else {
        toast.error(result.error || "Failed to invite member");
        return { success: false };
      }
    } catch (error) {
      toast.error("An error occurred");
      return { success: false };
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
        await refreshMembers();
      } else {
        toast.error("Failed to remove member");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "admin" | "editor" | "viewer") => {
    if (!selectedOrgId) return;
    if (!canManageTeam) {
      toast.error("Only admins can manage roles");
      return;
    }

    try {
      const success = await updateMemberRole(selectedOrgId, userId, newRole);
      if (success) {
        toast.success("Role updated");
        await refreshMembers();
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleRenameOrganization = async (newName: string) => {
    if (!newName.trim() || !organization) return;
    if (!canManageOrganization) {
      toast.error("Only admins can rename the organization");
      return;
    }

    try {
      const updated = await updateOrganization(organization.id, { name: newName });
      if (updated) {
        setOrganization(updated);
        setUserOrgs((prev) =>
          prev.map((o) => (o.id === updated.id ? { ...o, name: updated.name } : o))
        );
        toast.success("Organization renamed!");
      }
    } catch (error) {
      toast.error("Failed to rename organization");
    }
  };

  const handleDeleteBoard = async (boardId: string, boardTitle: string): Promise<boolean> => {
    try {
      const result = await deleteBoard(boardId);
      if (result.success) {
        toast.success("Board deleted");
        await refreshBoards();
        return true;
      } else {
        toast.error(result.error || "Failed to delete board");
        return false;
      }
    } catch (error) {
      toast.error("An error occurred while deleting the board");
      return false;
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        userOrgs,
        selectedOrgId,
        organization,
        boards,
        orgMembers,
        isLoading,
        currentUserRole,
        canManageTeam,
        canManageOrganization,
        canCreateBoard,
        setSelectedOrgId,
        refreshMembers,
        refreshBoards,
        handleInviteMember,
        handleRemoveMember,
        handleUpdateRole,
        handleRenameOrganization,
        handleDeleteBoard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
