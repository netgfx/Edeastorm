'use client';

import { Sparkles } from 'lucide-react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/constants';

interface ProblemCardProps {
  title: string;
  problemStatement: string;
}

export function ProblemCard({ title, problemStatement }: ProblemCardProps) {
  const cardWidth = 400;
  const cardHeight = 200;
  
  // Position at the exact center of the 10000x10000 canvas
  const x = CANVAS_WIDTH / 2 - cardWidth / 2;
  const y = CANVAS_HEIGHT / 2 - cardHeight / 2;

  return (
    <div 
      className="absolute bg-white rounded-[2rem] p-10 border border-zinc-200/50 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] flex flex-col gap-6 z-0 pointer-events-auto group"
      style={{
        left: x,
        top: y,
        width: cardWidth,
        minHeight: cardHeight,
        transform: 'translateZ(0)',
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-500">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight leading-none mb-1">
            {title}
          </h2>
          <span className="text-[10px] font-bold text-violet-500/80 uppercase tracking-widest">
            Problem Statement
          </span>
        </div>
      </div>
      
      <div className="flex-1">
        <p className="text-zinc-600 text-lg leading-relaxed font-normal">
          {problemStatement}
        </p>
      </div>
      
      <div className="pt-6 border-t border-zinc-100/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
           <div className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
           </div>
           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
             Live Context
           </span>
        </div>
        <div className="px-4 py-1.5 bg-zinc-50 rounded-full border border-zinc-100 transition-colors group-hover:bg-zinc-100/50">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Ideation Board
          </span>
        </div>
      </div>
    </div>
  );
}
