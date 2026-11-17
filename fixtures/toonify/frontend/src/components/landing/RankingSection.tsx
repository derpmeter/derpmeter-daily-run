'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { MOCK_RANKING_DATA } from '@/lib/mockLandingData';
import { ArrowUp, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RankingSection() {
    const t = useTranslations('Landing.Features');

    return (
        <section className="py-48 bg-zinc-900/50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        {t('realtimeRanking')}
                    </h2>
                    <span className="text-xs text-stone-500 self-end mb-1">Updated 14:00 PM</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {MOCK_RANKING_DATA.map((toon, idx) => (
                        <div key={toon.id} className="relative flex items-center gap-4 p-3 rounded-lg bg-black/40 hover:bg-black/60 transition-colors cursor-pointer group">
                            <div className="relative text-4xl font-black text-white/20 italic select-none font-serif w-8 text-center">{idx + 1}</div>

                            <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-gray-800">
                                <Image
                                    src={toon.image}
                                    alt={toon.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-white truncate">{toon.title}</h3>
                                <p className="text-xs text-gray-500 truncate">{toon.author}</p>
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                                    <span className="text-white font-medium">{toon.views}</span> views
                                </div>
                            </div>

                            {/* Rank Change Indicator Badge (Mock) */}
                            <div className="absolute top-2 right-2">
                                {idx === 0 || idx === 2 ?
                                    <span className="flex h-2 w-2 rounded-full bg-red-500"></span> :
                                    <span className="flex h-2 w-2 rounded-full bg-gray-600"></span>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
