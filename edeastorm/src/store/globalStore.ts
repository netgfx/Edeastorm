import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Tables } from '@/types/database';
import type { UserPresence, Position } from '@/types/canvas';

interface GlobalState {
  // Current user
  currentUser: Tables<'profiles'> | null;
  setCurrentUser: (user: Tables<'profiles'> | null) => void;

  // Active users in room
  users: UserPresence[];
  setUsers: (users: UserPresence[]) => void;
  addUser: (user: UserPresence) => void;
  removeUser: (userId: string) => void;
  updateUserPosition: (userId: string, position: Position) => void;

  // Current room/board
  currentRoom: string | null;
  setCurrentRoom: (roomId: string | null) => void;

  // Last updated timestamp for presence
  lastUpdated: number;
  setLastUpdated: (timestamp: number) => void;

  // Username (for anonymous users)
  username: string;
  setUsername: (name: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentUser: null,
  users: [],
  currentRoom: null,
  lastUpdated: 0,
  username: '',
};

export const useGlobalStore = create<GlobalState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setCurrentUser: (user) => set({ currentUser: user }, false, 'global/setCurrentUser'),

        setUsers: (users) => set({ users }, false, 'global/setUsers'),

        addUser: (user) =>
          set(
            (state) => {
              const exists = state.users.find((u) => u.id === user.id);
              if (exists) {
                return {
                  users: state.users.map((u) => (u.id === user.id ? user : u)),
                };
              }
              return { users: [...state.users, user] };
            },
            false,
            'global/addUser'
          ),

        removeUser: (userId) =>
          set(
            (state) => ({
              users: state.users.filter((u) => u.id !== userId),
            }),
            false,
            'global/removeUser'
          ),

        updateUserPosition: (userId, position) =>
          set(
            (state) => ({
              users: state.users.map((u) =>
                u.id === userId ? { ...u, cursor: position } : u
              ),
            }),
            false,
            'global/updateUserPosition'
          ),

        setCurrentRoom: (roomId) => set({ currentRoom: roomId }, false, 'global/setCurrentRoom'),

        setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }, false, 'global/setLastUpdated'),

        setUsername: (name) => set({ username: name }, false, 'global/setUsername'),

        reset: () => set(initialState, false, 'global/reset'),
      }),
      {
        name: 'edeastorm-global-storage',
        partialize: (state) => ({
          username: state.username,
        }),
      }
    ),
    { name: 'GlobalStore' }
  )
);
