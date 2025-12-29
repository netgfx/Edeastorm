'use client';

import { useGlobalStore } from '@/store/globalStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { uuidToColor } from '@/lib/utils';
import type { UserPresence } from '@/types/canvas';

export function UserBar() {
  const { users, currentUser } = useGlobalStore();

  if (users.length === 0) return null;

  // Get initials from username
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-2 bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/30 rounded-full px-3 py-1.5 shadow-xl">
        <span className="text-xs text-zinc-400 font-medium mr-1">
          {users.length} online
        </span>

        <div className="flex -space-x-2">
          {users.slice(0, 5).map((user) => {
            const isCurrentUser = user.id === currentUser?.id;

            return (
              <div
                key={user.id}
                className="relative group"
              >
                <Avatar
                  className={`w-8 h-8 ring-2 ${
                    isCurrentUser ? 'ring-violet-500' : 'ring-zinc-700'
                  } transition-transform hover:scale-110 hover:z-10`}
                >
                  <AvatarFallback
                    style={{ backgroundColor: user.color || uuidToColor(user.id) }}
                  >
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {user.username}
                  {isCurrentUser && ' (you)'}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45" />
                </div>

                {/* Active indicator */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900"
                  title="Online"
                />
              </div>
            );
          })}

          {/* Overflow indicator */}
          {users.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300 ring-2 ring-zinc-700">
              +{users.length - 5}
            </div>
          )}
        </div>
      </div>
    
  );
}
