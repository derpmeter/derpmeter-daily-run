'use client';

import { useTranslations } from 'next-intl';
import WebtoonCard from './WebtoonCard';
import { MOCK_WEEKLY_WEBTOONS, MOCK_NEW_ARRIVALS } from '@/lib/mockLandingData';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '@/navigation';

export default function WebtoonGridSection() {
    const t = useTranslations('Landing.Features');
    const router = useRouter();

    return (
        <section className="py-24 sm:py-48 bg-black text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-32">

                {/* Section 1: Weekly / Popular */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                            {t('weekly')}
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white text-sm sm:text-base"
                            onClick={() => router.push('/login')}
                        >
                            View All <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 sm:gap-x-4 gap-y-6 sm:gap-y-8">
                        {MOCK_WEEKLY_WEBTOONS.map((toon, idx) => (
                            <WebtoonCard key={toon.id} webtoon={toon} index={idx} />
                        ))}
                    </div>
                </div>

                {/* Section 2: New Arrivals */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                            {t('new')}
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white text-sm sm:text-base"
                            onClick={() => router.push('/login')}
                        >
                            View All <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 sm:gap-x-4 gap-y-6 sm:gap-y-8">
                        {MOCK_NEW_ARRIVALS.slice(0, 6).map((toon, idx) => (
                            <WebtoonCard key={toon.id} webtoon={toon} index={idx} />
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
