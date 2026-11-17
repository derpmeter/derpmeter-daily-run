import React from 'react';
import { cn } from '@/lib/utils';

interface CustomLoaderProps {
    className?: string; // Container class
    size?: number; // Size in pixels
}

export function CustomLoader({ className, size = 24 }: CustomLoaderProps) {
    return (
        <div
            className={cn("relative", className)}
            style={{ width: size, height: size }}
        >
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
            <div className="absolute inset-[10%] rounded-full border-r-2 border-indigo-500 animate-spin [animation-duration:1.5s]"></div>
            <div className="absolute inset-[20%] rounded-full border-b-2 border-blue-500 animate-spin [animation-duration:2s]"></div>
        </div>
    );
}
