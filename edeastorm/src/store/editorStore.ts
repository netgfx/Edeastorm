import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ToolType } from '@/types/canvas';

interface EditorState {
  // Canvas transform
  canvasScale: number;
  setCanvasScale: (scale: number) => void;
  
  panPosition: { x: number; y: number };
  setPanPosition: (position: { x: number; y: number }) => void;

  // Current tool
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // UI state
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  isToolbarVisible: boolean;
  setToolbarVisible: (visible: boolean) => void;

  // Cursor coordinates on canvas
  cursorPosition: { x: number; y: number };
  setCursorPosition: (position: { x: number; y: number }) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  isSaving: boolean;
  setSaving: (saving: boolean) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Reset
  reset: () => void;
}

const initialState = {
  canvasScale: 1,
  panPosition: { x: 0, y: 0 },
  activeTool: 'select' as ToolType,
  isSidebarOpen: true,
  isToolbarVisible: true,
  cursorPosition: { x: 0, y: 0 },
  isLoading: false,
  isSaving: false,
  theme: 'dark' as 'dark' | 'light',
};

export const useEditorStore = create<EditorState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCanvasScale: (scale) =>
        set({ canvasScale: Math.max(0.25, Math.min(2, scale)) }, false, 'editor/setScale'),

      setPanPosition: (position) =>
        set({ panPosition: position }, false, 'editor/setPan'),

      setActiveTool: (tool) =>
        set({ activeTool: tool }, false, 'editor/setTool'),

      setSidebarOpen: (open) =>
        set({ isSidebarOpen: open }, false, 'editor/setSidebar'),

      setToolbarVisible: (visible) =>
        set({ isToolbarVisible: visible }, false, 'editor/setToolbar'),

      setCursorPosition: (position) =>
        set({ cursorPosition: position }, false, 'editor/setCursor'),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'editor/setLoading'),

      setSaving: (saving) =>
        set({ isSaving: saving }, false, 'editor/setSaving'),

      setTheme: (theme) =>
        set({ theme }, false, 'editor/setTheme'),

      reset: () => set(initialState, false, 'editor/reset'),
    }),
    { name: 'EditorStore' }
  )
);
