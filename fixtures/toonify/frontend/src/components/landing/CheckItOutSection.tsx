'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/navigation';

export default function CheckItOutSection() {
    const t = useTranslations('Landing.Features');

    return (
        <section className="py-48 bg-black">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-2xl bg-indigo-900 border border-indigo-500/30">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0 opacity-40">
                        <Image
                            src="/images/mock/promo_banner.png"
                            alt="Creator Challenge"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-indigo-950/80 to-transparent" />
                    </div>

                    <div className="relative z-10 p-8 sm:p-16 flex flex-col items-start gap-4">
                        <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                            Creator Event
                        </span>
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl max-w-lg">
                            {t('promoTitle')}
                        </h2>
                        <p className="max-w-xl text-lg text-gray-300">
                            {t('promoDesc')}
                        </p>
                        <div className="mt-4">
                            <Link href="/signup">
                                <Button
                                    size="lg"
                                    className="bg-white text-indigo-950 hover:bg-gray-100 font-bold"
                                >
                                    {t('promoBtn')} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
