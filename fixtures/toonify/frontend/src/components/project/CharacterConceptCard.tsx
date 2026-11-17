import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Sparkles, AlertCircle, ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';

interface ConceptOption {
    name: string;
    age: string;
    personality: string;
    features: string[];
    pros: string[];
    cons: string[];
    visual_description: string;
    reason?: string;
}

interface CharacterConceptCardProps {
    option: ConceptOption;
    isSelected: boolean;
    onSelect: () => void;
}

export default function CharacterConceptCard({ option, isSelected, onSelect }: CharacterConceptCardProps) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative group transition-all duration-300 h-full",
                isSelected ? "" : "hover:scale-[1.02] cursor-pointer"
            )}
        >
            <div className={cn(
                "absolute inset-0 rounded-2xl transition-all duration-300",
                isSelected
                    ? "bg-gradient-to-br from-primary via-purple-500 to-indigo-600 blur opacity-75"
                    : "bg-white/5 blur-sm opacity-0 group-hover:opacity-100"
            )} />

            <Card className={cn(
                "relative h-full bg-[#1a1726]/95 border backdrop-blur-xl p-5 flex flex-col gap-4 overflow-hidden rounded-2xl transition-all duration-300",
                isSelected ? "border-primary/50 ring-1 ring-primary/50" : "border-white/10 group-hover:border-white/20"
            )}>
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white leading-tight mb-1">{option.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="bg-white/5 px-2 py-0.5 rounded text-gray-300">{option.age}</span>
                            <span className="italic">{option.reason}</span>
                        </div>
                    </div>
                    {isSelected && (
                        <div className="bg-primary rounded-full p-1 animate-in zoom-in spin-in-90 duration-300">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>

                {/* Personality */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                        <Sparkles className="w-3 h-3" /> Personality
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed font-light">
                        {option.personality}
                    </p>
                </div>

                {/* Features (Tags) */}
                <div className="flex flex-wrap gap-1.5">
                    {option.features.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-black/40 border border-white/10 text-gray-400 px-2 py-1 rounded-full whitespace-nowrap">
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-2 gap-3 mt-auto pt-3 border-t border-white/5">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-green-400/80 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> Strengths
                        </span>
                        {option.pros.map((pro, i) => (
                            <span key={i} className="text-xs text-gray-400 truncate block">• {pro}</span>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-red-400/80 flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" /> Weaknesses
                        </span>
                        {option.cons.map((con, i) => (
                            <span key={i} className="text-xs text-gray-400 truncate block">• {con}</span>
                        ))}
                    </div>
                </div>

                {/* Visual Description Preview (Hidden/Collapsed) */}
                {/* Could add a toggle to see full prompt if needed, but keeping clean for now */}
            </Card>
        </div>
    );
}
