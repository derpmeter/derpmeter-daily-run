'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const GENRES = [
    'Romance', 'Action', 'Fantasy', 'Drama', 'Thriller', 'Sci-Fi',
    'Comedy', 'Slice of Life', 'Historical', 'Sports', 'Horror', 'Mystery'
];

export default function GenreNav() {
    const t = useTranslations('Landing.Features');
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 200;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-white/10 py-3">
            <div className="mx-auto max-w-7xl px-4 flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scroll('left')}
                    className="shrink-0 text-gray-400 hover:text-white hidden sm:flex"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <div
                    ref={scrollRef}
                    className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth px-2"
                >
                    <Button
                        variant="default"
                        size="sm"
                        className="rounded-full bg-white text-black hover:bg-gray-200 font-semibold shrink-0"
                    >
                        ALL
                    </Button>
                    {GENRES.map((genre) => (
                        <Button
                            key={genre}
                            variant="outline"
                            size="sm"
                            className="rounded-full border-gray-700 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/50 shrink-0"
                        >
                            {genre}
                        </Button>
                    ))}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scroll('right')}
                    className="shrink-0 text-gray-400 hover:text-white hidden sm:flex"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
