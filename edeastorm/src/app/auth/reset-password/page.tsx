'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the user has a valid recovery session
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
      
      if (!session) {
        toast.error('Session expired or invalid. Please request a new reset link.');
      }
    }
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully!');
        setIsSuccess(true);
        // NextAuth will need them to sign in anyway to get a proper NextAuth session
        setTimeout(() => router.push('/auth/signin'), 2000);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-white">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Password reset complete</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Your password has been updated. You are being redirected to the sign-in page...
          </p>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-progress" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-white">
      <div className="w-full max-w-md relative">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold">Edeastorm</span>
          </div>
        </div>

        <div className="relative z-10 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
          
          <h1 className="text-2xl font-bold mb-2">Set new password</h1>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Please choose a strong password that you haven't used before.
          </p>

          {hasSession === false && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p>Your session is missing or expired. Make sure you clicked the link from your email.</p>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 pl-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-zinc-950/50 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || hasSession === false}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 pl-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-zinc-950/50 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-xl"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || hasSession === false}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-500/20 rounded-xl"
              disabled={isLoading || hasSession === false}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  Update password
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
