import React from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface AiSuggestionCardProps {
    suggestion: {
        id: number | string;
        title: string;
        tagline: string;
        logline: string;
        tags: string[];
        description: string;
        accentColor: string;
    };
    index: number;
    total: number;
    onNext: () => void;
    onPrev: () => void;
    onSelect: (suggestion: any) => void;
    onDismiss: () => void;
}

export const AiSuggestionCard = ({ suggestion, index, total, onNext, onPrev, onSelect, onDismiss }: AiSuggestionCardProps) => {
    // Helper to safely get color classes to avoid tailwind purging issues if dynamic
    // In a real app, define these in config or use style objects if dynamic is necessary.
    // For now, assuming standard tailwind colors, we might need a mapping or inline styles for dynamic colors.
    // However, the reference used `from-${suggestion.accentColor}-500`, which might be purged.
    // I will map them safely.
    
    const getColorClass = (color: string, type: 'text' | 'bg' | 'from' | 'border') => {
        const map: Record<string, string> = {
            indigo: { text: 'text-indigo-400', bg: 'bg-indigo-600', from: 'from-indigo-500', border: 'border-indigo-500' },
            amber: { text: 'text-amber-400', bg: 'bg-amber-600', from: 'from-amber-500', border: 'border-amber-500' },
            red: { text: 'text-red-400', bg: 'bg-red-600', from: 'from-red-500', border: 'border-red-500' },
            // default fallback
            purple: { text: 'text-purple-400', bg: 'bg-purple-600', from: 'from-purple-500', border: 'border-purple-500' },
        }[color] || { text: 'text-purple-400', bg: 'bg-purple-600', from: 'from-purple-500', border: 'border-purple-500' };
        
        // @ts-ignore
        return map[type];
    };

    const gradientFrom = getColorClass(suggestion.accentColor, 'from');
    const bgBlur = getColorClass(suggestion.accentColor, 'bg');
    const textColor = getColorClass(suggestion.accentColor, 'text');

    return (
        <div className="bg-[#0b0c15] border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-fade-in w-full max-w-2xl mx-auto relative overflow-hidden text-left">
            {/* Glow Effect */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradientFrom} to-purple-600`} />
            <div className={`absolute -top-20 -right-20 w-64 h-64 ${bgBlur}/10 rounded-full blur-[80px]`} />

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1 leading-tight">{suggestion.title}</h3>
                    <p className={`text-[10px] font-black tracking-widest ${textColor} uppercase`}>
                        {suggestion.tagline}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {index + 1} / {total}
                    </span>
                </div>
            </div>

            {/* Logline */}
            <div className="mb-5 pl-4 border-l-2 border-purple-500/50">
                <p className="text-slate-300 text-sm italic font-medium leading-relaxed">
                    "{suggestion.logline}"
                </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
                {suggestion.tags.map((tag, idx) => (
                    <span
                        key={idx}
                        className="text-[10px] text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            {/* Main Description */}
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 mb-6">
                <p className="text-xs text-slate-400 leading-relaxed text-justify">
                    {suggestion.description}
                </p>
            </div>

            {/* Footer Navigation & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                <div className="flex gap-1">
                    <button
                        onClick={onPrev}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={onNext}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <button
                        onClick={onDismiss}
                        className="ml-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Dismiss
                    </button>
                </div>

                <button
                    onClick={() => onSelect(suggestion)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all hover:translate-y-[-1px]"
                >
                    Select & Create Project <Check size={14} />
                </button>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-1 h-1 rounded-full transition-all ${i === index ? 'bg-purple-500 w-3' : 'bg-slate-700'}`}
                    />
                ))}
            </div>
        </div>
    );
};
