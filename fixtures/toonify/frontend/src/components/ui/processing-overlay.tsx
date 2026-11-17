'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomLoader } from './custom-loader';

interface ProcessingOverlayProps {
    isVisible: boolean;
    title?: string;
    description?: string;
    className?: string;
}

export function ProcessingOverlay({
    isVisible,
    title = "Processing...",
    description,
    className
}: ProcessingOverlayProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                        "absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-6",
                        className
                    )}
                >
                    <div className="relative w-24 h-24">
                        <CustomLoader size={96} className="w-full h-full" />
                    </div>

                    <div className="text-center space-y-2 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {title && <h3 className="text-xl font-bold tracking-tight text-white/90">{title}</h3>}
                        {description && <p className="text-gray-400 text-sm max-w-xs mx-auto">{description}</p>}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
