'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import type { StoryCut } from './types';

interface PositionIndicatorProps {
  cuts: StoryCut[];
  activeCutId: string | null;
  cutRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onNavigate: (direction: 'prev' | 'next') => void;
  onCutClick: (cutId: string, index: number) => void;
}

export function PositionIndicator({
  cuts,
  activeCutId,
  cutRefs,
  onNavigate,
  onCutClick,
}: PositionIndicatorProps) {
  if (cuts.length === 0) return null;

  return (
    <div className="hidden md:flex flex-col items-center justify-center w-12 py-8 shrink-0">
      {/* Up Navigation */}
      <button
        onClick={() => onNavigate('prev')}
        className="p-1.5 mb-3 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        title="Previous (↑)"
      >
        <ChevronUp size={16} />
      </button>
      
      {/* Position Dots */}
      <div className="flex flex-col gap-1.5 py-2">
        {cuts.map((cut, idx) => (
          <button
            key={cut.id}
            onClick={() => {
              onCutClick(cut.id, idx);
              cutRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              activeCutId === cut.id 
                ? 'bg-purple-500 scale-125 shadow-lg shadow-purple-500/50' 
                : cut.image_path 
                  ? 'bg-slate-500 hover:bg-slate-400' 
                  : 'bg-slate-700 hover:bg-slate-600'
            }`}
            title={`장면 #${String(cut.cut_order).padStart(2, '0')}`}
          />
        ))}
      </div>
      
      {/* Down Navigation */}
      <button
        onClick={() => onNavigate('next')}
        className="p-1.5 mt-3 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        title="Next (↓)"
      >
        <ChevronDown size={16} />
      </button>

      {/* Position Counter */}
      <div className="mt-4 text-[10px] text-slate-500 font-mono">
        {activeCutId ? cuts.findIndex(c => c.id === activeCutId) + 1 : '-'}/{cuts.length}
      </div>
    </div>
  );
}
