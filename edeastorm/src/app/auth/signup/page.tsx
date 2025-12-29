'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // This ensures the confirmation link brings them to our handler
          emailRedirectTo: `${window.location.origin}/api/auth/confirm`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Registration successful!');
        setIsSent(true);
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-white">Check your email</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            We've sent a confirmation link to <span className="text-zinc-200 font-medium">{email}</span>. 
            Please verify your email to activate your account.
          </p>
          <Link href="/auth/signin">
            <Button variant="outline" className="gap-2">
              Back to Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
      <div className="w-full max-w-md relative">
        {/* Background glow decorative elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="text-center mb-8 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">Edeastorm</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="relative z-10 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
            <p className="text-zinc-400 text-sm">Join the next generation of collaborative ideation</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300 pl-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="John Doe"
                  className="pl-11 h-12 bg-zinc-950/50 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-xl"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300 pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-11 h-12 bg-zinc-950/50 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300 pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-zinc-950/50 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <p className="text-[10px] text-zinc-500 pl-1 mt-1">Must be at least 8 characters long</p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none shadow-lg shadow-violet-500/20 rounded-xl mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign Up
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-zinc-600 px-8 leading-relaxed">
          By signing up, you agree to our <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
          Your ideation data is encrypted and secure.
        </div>
      </div>
    </div>
  );
}
