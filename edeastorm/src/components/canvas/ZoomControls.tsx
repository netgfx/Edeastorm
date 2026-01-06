'use client';

import { Minus, Plus, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onRecenter }: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-full px-2 py-1.5 shadow-2xl">
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        title="Zoom Out"
      >
        <Minus className="w-4 h-4 text-zinc-300" />
      </button>

      <button
        onClick={onRecenter}
        className="px-3 py-1 min-w-[70px] text-center text-sm font-medium text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Reset Zoom"
      >
        {(scale * 100).toFixed(0)}%
      </button>

      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        title="Zoom In"
      >
        <Plus className="w-4 h-4 text-zinc-300" />
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <button
        onClick={onRecenter}
        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        title="Fit to Screen"
      >
        <Maximize2 className="w-4 h-4 text-zinc-300" />
      </button>
    </div>
  );
}
