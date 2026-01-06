/** @format */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  CreditCard,
  Download,
  User,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { getOrganization, updateOrganization } from "@/lib/api";
import type { Tables } from "@/types/database";
import toast from "react-hot-toast";

// Mock receipts data
const MOCK_RECEIPTS = [
  {
    id: "rcpt_1",
    date: "2025-12-01",
    amount: "$29.00",
    status: "Paid",
    invoiceUrl: "#",
  },
  {
    id: "rcpt_2",
    date: "2025-11-01",
    amount: "$29.00",
    status: "Paid",
    invoiceUrl: "#",
  },
  {
    id: "rcpt_3",
    date: "2025-10-01",
    amount: "$29.00",
    status: "Paid",
    invoiceUrl: "#",
  },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [organization, setOrganization] =
    useState<Tables<"organizations"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgName, setOrgName] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch organization
  useEffect(() => {
    async function fetchData() {
      if (status === "authenticated" && session?.user?.organizationId) {
        try {
          const org = await getOrganization(session.user.organizationId);
          if (org) {
            setOrganization(org);
            setOrgName(org.name);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (status === "authenticated" && !session?.user?.organizationId) {
        // User might not have an organization yet or it's not in session
        setIsLoading(false);
      }
    }
    fetchData();
  }, [session, status]);

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveOrgName = async () => {
    if (!organization || !orgName.trim()) return;

    setIsSavingOrg(true);
    try {
      const updated = await updateOrganization(organization.id, {
        name: orgName,
      });
      if (updated) {
        setOrganization(updated);
        toast.success("Organization name updated");
      }
    } catch (error) {
      toast.error("Failed to update organization name");
    } finally {
      setIsSavingOrg(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">Account Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Profile Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-violet-400">
            <User className="w-5 h-5" />
            <h2 className="text-lg font-medium uppercase tracking-wider">
              Personal Profile
            </h2>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <Avatar className="w-24 h-24 border-4 border-zinc-800">
                {session?.user?.image && (
                  <AvatarImage
                    src={session.user.image}
                    alt={session.user.name || ""}
                  />
                )}
                <AvatarFallback className="text-2xl bg-zinc-800">
                  {getInitials(
                    session?.user?.name || session?.user?.email || "U"
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-sm text-zinc-500 font-medium mb-1 block">
                    Full Name
                  </label>
                  <div className="text-lg font-medium">
                    {session?.user?.name || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-zinc-500 font-medium mb-1 block">
                    Email Address
                  </label>
                  <div className="text-lg font-medium text-zinc-300">
                    {session?.user?.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Organization Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-violet-400">
            <Building className="w-5 h-5" />
            <h2 className="text-lg font-medium uppercase tracking-wider">
              Organization Settings
            </h2>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <div className="max-w-md space-y-4">
              <div>
                <label className="text-sm text-zinc-500 font-medium mb-1 block">
                  Organization Name
                </label>
                <div className="flex gap-3">
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="My Organization"
                    className="bg-zinc-950 border-zinc-800"
                  />
                  <Button
                    onClick={handleSaveOrgName}
                    disabled={
                      isSavingOrg ||
                      !orgName.trim() ||
                      orgName === organization?.name
                    }
                  >
                    {isSavingOrg ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span className="ml-2">Save</span>
                  </Button>
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  This is the name displayed on your team&apos;s workspace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Billing & Receipts Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-violet-400">
            <CreditCard className="w-5 h-5" />
            <h2 className="text-lg font-medium uppercase tracking-wider">
              Billing & Receipts
            </h2>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {MOCK_RECEIPTS.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-zinc-300">
                        {receipt.date}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {receipt.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-zinc-400 hover:text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
