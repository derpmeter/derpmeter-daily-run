import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format date based on locale
 * Korean: "2025년 12월 25일"
 * Other: "12/25/2025" or locale default
 */
export function formatDate(date: Date | string | null | undefined, locale: string = 'en'): string {
    if (!date) return 'N/A';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return 'N/A';
    
    if (locale === 'ko') {
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${year}년 ${month}월 ${day}일`;
    }
    
    return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
}
