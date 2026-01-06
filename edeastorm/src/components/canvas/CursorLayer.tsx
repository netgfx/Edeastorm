'use client';

import { useGlobalStore } from '@/store/globalStore';
import { useEditorStore } from '@/store/editorStore';
import { uuidToColor } from '@/lib/utils';

interface CursorLayerProps {
  currentPresenceId: string | null;
}

export function CursorLayer({ currentPresenceId }: CursorLayerProps) {
  const { users } = useGlobalStore();
  const { canvasScale } = useEditorStore();

  // Filter out current user's presence
  const otherUsers = users.filter((u) => u.id !== currentPresenceId);

  if (otherUsers.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {otherUsers.map((user) => (
        <div
          key={user.id}
          className="absolute transition-all duration-75 ease-out"
          style={{
            left: user.cursor.x * canvasScale,
            top: user.cursor.y * canvasScale,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor - Arrow facing left */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-lg"
          >
            <path
              d="M5.5 3.5l11 11-4 1 3 7-2 1-3-7-4 4V3.5z"
              fill={user.color || uuidToColor(user.id)}
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>

          {/* Username label */}
          <div
            className="absolute left-4 top-4 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white whitespace-nowrap shadow-xl border border-white/20"
            style={{ backgroundColor: user.color || uuidToColor(user.id) }}
          >
            {user.username}
          </div>
        </div>
      ))}
    </div>
  );
}
