/** @format */

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid or expired invitation");
          setLoading(false);
          return;
        }

        setInviteData(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load invitation");
        setLoading(false);
      }
    };

    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    fetchInvitation();
  }, [token, errorParam]);

  const handleAcceptInvite = async () => {
    // Navigate to completion page
    // The completion page will handle:
    // 1. Auth check (redirect to signin if needed)
    // 2. Profile creation (via API)
    // 3. Organization joining
    router.push(`/invite/complete?token=${token}`);
  };

  if (loading || accepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {accepting ? "Processing..." : "Loading invitation..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if user is authenticated - if so, show retry option
    const canRetry = session?.user?.id && inviteData;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Logo size="large" />
          </div>
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {canRetry ? "Something Went Wrong" : "Invalid Invitation"}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            {canRetry && (
              <Button
                onClick={() => {
                  setError(null);
                  handleAcceptInvite();
                }}
                className="w-full"
              >
                Try Again
              </Button>
            )}
            <Link href="/">
              <Button
                variant={canRetry ? "outline" : "default"}
                className="w-full"
              >
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="mb-6 text-center">
          <Logo size="large" />
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You&apos;re Invited!
          </h1>
          <p className="text-gray-600">
            Join <strong>{inviteData.organizationName}</strong> on EdeaStorm
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Organization:</span>
            <span className="font-semibold text-gray-900">
              {inviteData.organizationName}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Your Role:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {inviteData.role.charAt(0).toUpperCase() +
                inviteData.role.slice(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Invited by:</span>
            <span className="text-sm text-gray-900">
              {inviteData.inviterName}
            </span>
          </div>
        </div>

        {!session ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center mb-4">
              Sign in or create an account to accept this invitation
            </p>
            <Button
              onClick={handleAcceptInvite}
              className="w-full"
              disabled={accepting}
            >
              Sign in to Accept Invitation
            </Button>
          </div>
        ) : session.user.email !== inviteData.email ? (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                This invitation was sent to <strong>{inviteData.email}</strong>,
                but you&apos;re signed in as{" "}
                <strong>{session.user.email}</strong>.
              </p>
            </div>
            <Button
              onClick={() => router.push("/auth/signin")}
              variant="outline"
              className="w-full"
            >
              Sign in with Different Account
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleAcceptInvite}
            className="w-full"
            disabled={accepting}
          >
            {accepting ? "Accepting..." : "Accept Invitation"}
          </Button>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          By accepting this invitation, you agree to EdeaStorm&apos;s{" "}
          <Link href="/terms" className="text-indigo-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
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
      <AcceptInviteContent />
    </Suspense>
  );
}
