/** @format */

"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/ui/Logo";
import toast from "react-hot-toast";

function CompleteInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [processing, setProcessing] = useState(true);

  // Use a ref to prevent double-firing in strict mode or due to re-renders
  const hasStarted = useRef(false);

  const token = searchParams.get("token");

  const completeInvitation = async (retryAttempt = 0) => {
    if (!session?.user?.id && retryAttempt === 0) {
      // Should not happen due to unauthenticated check above, but safe guard
      return;
    }

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle Invalid Session (FK violation / User not found)
        if (response.status === 401 && result.code === "INVALID_SESSION") {
          toast.error("Session expired or invalid. Please sign in again.");
          await signOut({ callbackUrl: `/invite/complete?token=${token}` });
          return;
        }

        // If it's a 503 (account still being set up), retry a few times
        if (response.status === 503) {
          if (retryAttempt < 3) {
            toast.loading("Setting up your account, please wait...", {
              id: "setup-loading", // prevent duplicate toasts
              duration: 2000,
            });

            setTimeout(() => {
              completeInvitation(retryAttempt + 1);
            }, 2000);
            return;
          } else {
            toast.dismiss("setup-loading");
            toast.error("Account setup timed out. Please try again.");
          }
        } else {
          toast.error(result.error || "Failed to accept invitation");
        }

        // Redirect back to invite page to show error
        setProcessing(false);
        setTimeout(() => {
          router.push(
            `/invite/accept?token=${token}&error=${encodeURIComponent(result.error || "Failed to accept invitation")}`
          );
        }, 2000);
        return;
      }

      // Success! Redirect to dashboard
      toast.dismiss("setup-loading");
      toast.success("Successfully joined the organization!");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to accept invitation. Please try again.");
      setProcessing(false);
      setTimeout(() => {
        router.push(
          `/invite/accept?token=${token}&error=Failed to accept invitation`
        );
      }, 2000);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Invalid invitation link");
      router.push("/");
      return;
    }

    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/invite/complete?token=${token}`);
      return;
    }

    // Only start once when authenticated
    if (status === "authenticated" && !hasStarted.current) {
      hasStarted.current = true;
      completeInvitation(0);
    }
  }, [token, status]); // Removed session from deps to avoid re-triggering

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Logo width={64} height={64} />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing your invitation...</p>
      </div>
    </div>
  );
}

export default function CompleteInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CompleteInviteContent />
    </Suspense>
  );
}
