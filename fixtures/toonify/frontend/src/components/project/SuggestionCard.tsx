'use client';

import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomLoader } from '@/components/ui/custom-loader';

export interface Suggestion {
    id: string;
    name: string;
    role?: string;
    theme_color?: string;
    bio?: string;
    personality?: string;
    stats?: Record<string, number>;
    visual_keywords?: string[];
    age?: string;
    personality_tags?: string[];
}

interface SuggestionCardProps {
    suggestion: Suggestion;
    onClick: () => void;
    onReject?: (e: React.MouseEvent) => void;
    isPromoting?: boolean;
    className?: string;
}

export default function SuggestionCard({
    suggestion,
    onClick,
    onReject,
    isPromoting = false,
    className,
}: SuggestionCardProps) {
    return (
        <div
            onClick={isPromoting ? undefined : onClick}
            className={cn(
                "group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#15121c] border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col p-2 sm:p-3",
                isPromoting 
                    ? "cursor-wait border-purple-500/50" 
                    : "cursor-pointer",
                className
            )}
            style={{ borderTop: suggestion.theme_color ? `3px solid ${suggestion.theme_color}` : undefined }}
        >
            {/* Promoting Overlay - Same style as ImageGeneratingPlaceholder */}
            {isPromoting && (
                <div className="absolute inset-0 z-30 overflow-hidden bg-black/40 backdrop-blur-sm">
                    {/* Animated Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />

                    {/* Pulse Effect */}
                    <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                                {/* Outer Glow */}
                                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 animate-pulse" />
                                <CustomLoader size={32} className="relative text-purple-400" />
                            </div>
                            <span className="text-purple-200 font-bold tracking-widest text-xs animate-pulse drop-shadow-lg text-center px-2">
                                생성 중...
                            </span>
                        </div>
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-500/50 rounded-tl-lg m-2" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-500/50 rounded-br-lg m-2" />
                </div>
            )}

            {/* Reject Button - Only show if onReject is provided and not promoting */}
            {onReject && !isPromoting && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onReject(e);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors z-20 opacity-0 group-hover:opacity-100"
                >
                    <X size={14} />
                </button>
            )}

            <div className="flex-1 flex flex-col justify-center items-center gap-1">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="text-white text-[10px] font-bold uppercase tracking-tight text-center">
                    {suggestion.name}
                </h4>
                <p className="text-[9px] text-purple-300/70 font-medium">
                    {suggestion.role || "Potential Cast"}
                </p>
            </div>
            <div className="mt-auto pt-2 border-t border-white/5">
                <p className="text-[9px] text-gray-500 line-clamp-2 leading-tight italic">
                    "{suggestion.bio || suggestion.personality}"
                </p>
            </div>
        </div>
    );
}

