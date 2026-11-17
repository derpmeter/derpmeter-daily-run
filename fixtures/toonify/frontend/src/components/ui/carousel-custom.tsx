'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CarouselOption {
    id: string;
    title: string;
    description: string;
    content: string;
    tone?: string;
    key_features?: string[];
}

interface WorldviewCarouselProps {
    options: any[];
    onSelect: (option: any) => void;
    onDismiss: () => void;
}

export function WorldviewCarousel({ options, onSelect, onDismiss }: WorldviewCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % options.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + options.length) % options.length);
    };

    const currentOption = options[currentIndex];

    const handleDismiss = () => {
        onDismiss();
    };

    // Safety check if options are empty
    if (!options || options.length === 0) return null;

    const handleSelect = () => {
        onSelect(options[currentIndex].content);
    };

    return (
        <div className="relative w-full overflow-hidden bg-[#0F0F12] rounded-xl border border-gray-800 p-8 min-h-[420px] flex flex-col justify-between shadow-2xl">
            {/* Header / Title of current card */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-bold text-white tracking-wide">{options[currentIndex].title}</h3>
                    <div className="flex gap-3 items-center">
                        {options[currentIndex].tone && (
                            <span className="text-[10px] uppercase tracking-widest font-black text-purple-400">
                                {options[currentIndex].tone}
                            </span>
                        )}
                        {currentOption.key_features && currentOption.key_features.length > 0 && (
                            <>
                                <span className="text-gray-700 mx-1">•</span>
                                {currentOption.key_features.map((feature: string, idx: number) => (
                                    <span key={idx} className="text-[10px] uppercase tracking-widest font-bold text-blue-400">
                                        {feature}
                                    </span>
                                ))}
                            </>
                        )}
                    </div>
                </div>
                <div className="bg-[#15151A] px-3 py-1.5 rounded-md border border-gray-800">
                    <span className="text-xs font-mono text-gray-400">
                        {currentIndex + 1} / {options.length}
                    </span>
                </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 mb-8 flex flex-col gap-5">
                <div className="relative pl-4 border-l-2 border-purple-500/50">
                    <p className="text-lg text-gray-200 font-medium italic leading-relaxed">
                        "{currentOption.description}"
                    </p>
                </div>

                {/* Tags row was moved up to title section for cleaner look, let's keep specific tags here if needed or just rely on the top ones */}

                <div className="flex-1 overflow-y-auto text-sm text-gray-400 bg-[#15151A]/50 p-5 rounded-xl border border-gray-800/50 leading-relaxed font-light">
                    {currentOption.content}
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center gap-6 pt-4 border-t border-gray-800/50">
                <div className="flex gap-4">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handlePrev} 
                        className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full w-10 h-10"
                    >
                        <ChevronLeft size={20} />
                    </Button>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleNext} 
                        className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full w-10 h-10"
                    >
                        <ChevronRight size={20} />
                    </Button>
                </div>
               
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={handleDismiss}
                        className="text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors px-4"
                    >
                       Dismiss
                    </button>

                    <Button 
                        onClick={() => onSelect(currentOption)} 
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold px-6 h-11 rounded-lg shadow-lg shadow-purple-900/20"
                    >
                        Select & Create Project <Check size={18} className="ml-2" />
                    </Button>
                </div>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
                {options.map((_, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            idx === currentIndex ? "w-6 bg-[#8B5CF6]" : "w-1.5 bg-gray-700"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
