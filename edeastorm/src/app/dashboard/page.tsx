'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Sparkles, 
  MoreHorizontal, 
  Clock, 
  Users,
  Archive,
  Trash2,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { getUserBoards, createBoard, getOrganization, updateOrganization } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Tables } from '@/types/database';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [boards, setBoards] = useState<Tables<'boards'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoard, setNewBoard] = useState({
    title: '',
    problemStatement: '',
  });

  const [organization, setOrganization] = useState<Tables<'organizations'> | null>(null);
  const [isRenamingOrg, setIsRenamingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch boards
  useEffect(() => {
    async function fetchBoards() {
      if (status === 'unauthenticated') {
        setIsLoading(false);
        return;
      }

      if (status === 'authenticated' && session?.user?.id) {
        try {
          const data = await getUserBoards(session.user.id);
          setBoards(data);
        } catch (error) {
          console.error('Error fetching boards:', error);
          toast.error('Failed to load boards');
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'authenticated' && !session?.user?.id) {
        // Session exists but ID is not yet available - might be a race condition
        // We'll wait a bit, but eventually stop the spinner
        const timeout = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timeout);
      }
    }
    fetchBoards();
  }, [session?.user?.id, status]);

  // Fetch organization
  useEffect(() => {
    async function fetchOrg() {
      if (session?.user?.organizationId) {
        const org = await getOrganization(session.user.organizationId);
        if (org) {
          setOrganization(org);
          setNewOrgName(org.name);
        }
      }
    }
    fetchOrg();
  }, [session?.user?.organizationId]);

  // Create new board
  const handleCreateBoard = async () => {
    if (!newBoard.title.trim()) {
      toast.error('Please enter a board title');
      return;
    }

    if (!session?.user?.id) {
      toast.error('Please sign in to create a board');
      return;
    }

    setIsCreating(true);

    try {
      const organizationId = session.user.organizationId;
      
      if (!organizationId) {
        toast.error('Unable to create board. You are not assigned to an organization.');
        return;
      }

      const board = await createBoard({
        title: newBoard.title,
        problemStatement: newBoard.problemStatement,
        organizationId: organizationId,
        createdBy: session.user.id,
      });

      if (board) {
        toast.success('Board created successfully!');
        router.push(`/board/${board.short_id}`);
      } else {
        toast.error('Failed to create board');
      }
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameOrganization = async () => {
    if (!newOrgName.trim() || !organization) return;

    try {
      const updated = await updateOrganization(organization.id, { name: newOrgName });
      if (updated) {
        setOrganization(updated);
        setIsRenamingOrg(false);
        toast.success('Organization renamed!');
      }
    } catch (error) {
      toast.error('Failed to rename organization');
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (status === 'loading' || isLoading) {
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
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Edeastorm</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              New Board
            </Button>

            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <Avatar className="w-9 h-9">
                  {session?.user?.image && (
                    <AvatarImage src={session.user.image} alt={session.user.name || ''} />
                  )}
                  <AvatarFallback>
                    {getInitials(session?.user?.name || session?.user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-4 py-2 border-b border-zinc-700">
                  <p className="font-medium truncate">{session?.user?.name}</p>
                  <p className="text-sm text-zinc-400 truncate">{session?.user?.email}</p>
                </div>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 flex items-center gap-2 text-zinc-300">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 group">
              {isRenamingOrg ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="h-8 w-48 bg-zinc-900"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameOrganization()}
                  />
                  <Button size="xs" onClick={handleRenameOrganization}>Save</Button>
                  <Button size="xs" variant="ghost" onClick={() => setIsRenamingOrg(false)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <h2 className="text-sm font-medium text-violet-400 uppercase tracking-wider">
                    {organization?.name || 'Personal Workspace'}
                  </h2>
                  <button 
                    onClick={() => setIsRenamingOrg(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded text-zinc-500"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold">Your Boards</h1>
          </div>
          <p className="text-zinc-400">Manage your ideation boards</p>
        </div>

        {/* Boards grid */}
        {boards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-zinc-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No boards yet</h2>
            <p className="text-zinc-400 mb-6">
              Create your first board to start brainstorming with your team
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Your First Board
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create new board card */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-48 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-violet-500/50 flex flex-col items-center justify-center gap-3 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-zinc-400 group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="text-zinc-400 group-hover:text-white transition-colors">
                New Board
              </span>
            </button>

            {/* Board cards */}
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/board/${board.short_id}`}
                className="h-48 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 p-5 flex flex-col transition-all hover:shadow-lg hover:shadow-violet-500/5 group"
              >
                {/* Thumbnail preview */}
                <div className="flex-1 rounded-lg bg-zinc-800/50 mb-4 overflow-hidden grid-bg relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-6 h-6 bg-yellow-300/80 rounded" />
                      <div className="w-6 h-6 bg-pink-300/80 rounded" />
                      <div className="w-6 h-6 bg-blue-300/80 rounded" />
                    </div>
                  </div>
                </div>

                {/* Board info */}
                <div>
                  <h3 className="font-semibold truncate group-hover:text-violet-400 transition-colors">
                    {board.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(board.created_at)}
                    </span>
                    {board.is_public && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Public
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Start a new ideation session with your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Board Title *
              </label>
              <Input
                placeholder="e.g., Product Roadmap Brainstorm"
                value={newBoard.title}
                onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Problem Statement / Challenge
              </label>
              <Textarea
                placeholder="What problem are we trying to solve? What's the challenge we're addressing?"
                value={newBoard.problemStatement}
                onChange={(e) => setNewBoard({ ...newBoard, problemStatement: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-zinc-500 mt-1">
                This will be displayed at the top of the board to guide ideation
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={isCreating}>
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Board
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
