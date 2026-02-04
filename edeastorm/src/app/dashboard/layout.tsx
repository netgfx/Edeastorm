/** @format */

"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Plus, Users, LogOut, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { userOrgs, selectedOrgId, setSelectedOrgId, isLoading } = useDashboard();

  const isMembersPage = pathname === "/dashboard/members";

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
            <Link href="/dashboard">
              <Button>
                <Plus className="w-4 h-4" />
                New Board
              </Button>
            </Link>

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
                <Link
                  key={org.id}
                  href="/dashboard"
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedOrgId === org.id && !isMembersPage
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
                </Link>
              ))}
            </div>
          </div>

          {selectedOrgId && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
                Quick Actions
              </h3>
              <Link
                href="/dashboard/members"
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isMembersPage
                    ? "bg-violet-500/10 text-violet-400"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <Users className="w-4 h-4" />
                Manage Members
              </Link>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  );
}
