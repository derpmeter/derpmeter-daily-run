'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomLoader } from './custom-loader';

interface ImageGeneratingPlaceholderProps {
    className?: string;
    text?: string;
}

export default function ImageGeneratingPlaceholder({ className, text = "GENERATING..." }: ImageGeneratingPlaceholderProps) {
    return (
        <div className={cn("absolute inset-0 z-20 overflow-hidden bg-black/40 backdrop-blur-sm", className)}>
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />

            {/* Pulse Effect */}
            <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 animate-pulse" />
                        <CustomLoader size={40} className="relative text-purple-400" />
                    </div>
                    <span className="text-purple-200 font-bold tracking-widest text-lg animate-pulse drop-shadow-lg text-center px-4">
                        {text}
                    </span>
                </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500/50 rounded-tl-lg m-4" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500/50 rounded-br-lg m-4" />
        </div>
    );
}
