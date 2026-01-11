/** @format */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Suspense, useEffect, useState } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl");
  const [retrying, setRetrying] = useState(false);

  // Auto-redirect to signin for Configuration errors (likely network timeouts)
  useEffect(() => {
    if (error === "Configuration") {
      const timer = setTimeout(() => {
        const signInUrl = callbackUrl
          ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&retry=true`
          : "/auth/signin?retry=true";
        router.push(signInUrl);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, callbackUrl, router]);

  const handleRetry = () => {
    setRetrying(true);
    const signInUrl = callbackUrl
      ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&retry=true`
      : "/auth/signin?retry=true";
    router.push(signInUrl);
  };

  const errorMessages: Record<
    string,
    { title: string; description: string; autoRetry?: boolean }
  > = {
    Configuration: {
      title: "Connection Timeout",
      description:
        "The authentication service took too long to respond. You will be automatically redirected to try again in a few seconds...",
      autoRetry: true,
    },
    AccessDenied: {
      title: "Access Denied",
      description: "You do not have permission to sign in.",
    },
    Verification: {
      title: "Verification Error",
      description:
        "The verification link may have expired or already been used.",
    },
    Default: {
      title: "Authentication Error",
      description: "An error occurred during authentication. Please try again.",
    },
  };

  const errorInfo = errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="flex justify-center">
            <Logo width={64} height={64} />
          </div>
        </div>

        {errorInfo.autoRetry ? (
          <>
            <div className="text-yellow-600 text-5xl mb-4">⏳</div>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            </div>
          </>
        ) : (
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {errorInfo.title}
        </h1>

        <p className="text-gray-600 mb-6">{errorInfo.description}</p>

        {error && !errorInfo.autoRetry && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600">Error code:</p>
            <p className="font-mono text-sm text-gray-900">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {errorInfo.autoRetry ? (
            <Button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full"
            >
              {retrying ? "Redirecting..." : "Retry Now"}
            </Button>
          ) : (
            <>
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-6">
          If this problem persists, please contact{" "}
          <a
            href="mailto:support@edeastorm.app"
            className="text-indigo-600 hover:underline"
          >
            support@edeastorm.app
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
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
      <ErrorContent />
    </Suspense>
  );
}
