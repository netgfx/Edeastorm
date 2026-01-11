/** @format */

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Mail, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-zinc-400">
          Loading...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const verified = searchParams.get("verified");
  const retry = searchParams.get("retry");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Show retry toast on mount if retry parameter is present
  useEffect(() => {
    if (retry === "true") {
      toast.error("Authentication timed out. Please try signing in again.", {
        duration: 5000,
        icon: "⏳",
      });
    }
  }, [retry]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // NextAuth often returns 'CredentialsSignin', we check if we can get more
        toast.error(
          result.error === "CredentialsSignin"
            ? "Invalid email or password. Check your confirmation status."
            : result.error
        );
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
      <div className="w-full max-w-md relative">
        {/* Background glow decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="text-center mb-8 relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform group-hover:scale-105">
              <Logo
                width={48}
                height={48}
                colors={["#ffffff"]}
                withStroke={true}
                strokeWidth={0.5}
                className="drop-shadow-md"
              />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">
              Edeastorm
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="relative z-10 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />

          <h1 className="text-2xl font-bold text-center mb-2 text-white">
            Welcome back
          </h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">
            Sign in to continue to your workspace
          </p>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
              {error === "OAuthAccountNotLinked"
                ? "This email is already associated with another account."
                : "An error occurred during sign in. Please try again."}
            </div>
          )}

          {verified && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Email verified! You can now sign in.
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="email"
                  placeholder="Email address"
                  className="pl-11 h-12 bg-zinc-950/50 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between pl-1">
                <label className="text-sm font-medium text-zinc-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="pl-11 h-12 bg-zinc-950/50 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-500 border-none shadow-lg shadow-violet-500/20 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-950/50 text-zinc-500 backdrop-blur-xl rounded-full">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Providers */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="h-12 bg-white text-zinc-950 hover:bg-zinc-100 border-none rounded-xl"
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-0 md:mr-2">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="hidden md:inline">Google</span>
            </Button>

            <Button
              onClick={() => signIn("github", { callbackUrl })}
              variant="outline"
              className="h-12 bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700 rounded-xl"
              disabled={isLoading}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-0 md:mr-2"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="hidden md:inline">GitHub</span>
            </Button>
          </div>
        </div>

        {/* Footer links */}
        <p className="mt-8 text-center text-sm text-zinc-500">
          New to Edeastorm?{" "}
          <Link
            href="/auth/signup"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
