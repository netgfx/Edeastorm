/** @format */

import Link from "next/link";
import { ArrowRight, Sparkles, Users, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PricingNavLink } from "@/components/PricingNavLink";
import { Logo } from "@/components/ui/Logo";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const isAuthed = Boolean(session?.user);
  const logoHref = isAuthed ? "/dashboard" : "/";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={logoHref} className="flex items-center gap-3">
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
            <PricingNavLink />
            {isAuthed ? (
              <Link href="/dashboard">
                <Button>
                  My Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/dashboard">
                  <Button>
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Real-time collaborative ideation
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
            Brainstorm together,
            <br />
            <span className="gradient-text">build better ideas</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 animate-fade-in">
            A beautiful, infinite canvas for team ideation sessions. Create
            sticky notes, share thoughts in real-time, and turn brainstorming
            into actionable insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in">
            <Link href="/dashboard">
              <Button size="xl" className="min-w-50">
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="xl" className="min-w-50">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Preview Image Placeholder */}
          <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl animate-scale-in">
            <div className="aspect-video bg-zinc-900 grid-bg relative">
              {/* Mock canvas preview */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-4 -rotate-3">
                  <div className="w-32 h-32 bg-yellow-300 rounded-lg shadow-lg transform rotate-2 flex items-center justify-center p-4 text-zinc-800 text-sm font-medium">
                    💡 Big idea here
                  </div>
                  <div className="w-32 h-32 bg-pink-300 rounded-lg shadow-lg transform -rotate-3 flex items-center justify-center p-4 text-zinc-800 text-sm font-medium">
                    🚀 Launch plan
                  </div>
                  <div className="w-32 h-32 bg-blue-300 rounded-lg shadow-lg transform rotate-1 flex items-center justify-center p-4 text-zinc-800 text-sm font-medium">
                    ✨ Innovation
                  </div>
                </div>
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything you need for
            <span className="gradient-text"> better ideation</span>
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-16">
            Designed for teams who want to think together, not just meet
            together.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                <Users className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Real-time Collaboration
              </h3>
              <p className="text-zinc-400">
                See teammates&apos; cursors and edits instantly. No refresh
                needed, just seamless collaboration.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Infinite Canvas</h3>
              <p className="text-zinc-400">
                Never run out of space. Pan, zoom, and organize your ideas on an
                unlimited workspace.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                <Globe className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Workspaces</h3>
              <p className="text-zinc-400">
                Organize boards by team, manage permissions, and keep your
                ideation sessions secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Edeastorm</span>
          </div>
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Edeastorm. Built for creative teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
