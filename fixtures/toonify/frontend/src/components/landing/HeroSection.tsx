'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { ArrowRight, Play } from 'lucide-react';
import Image from 'next/image';

export default function HeroSection() {
    const t = useTranslations('Landing.Hero');

    return (
        <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-black text-white">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/mock/hero_bg.png"
                    alt="Hero Background"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                {/* Vignette Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
            </div>

            <div className="z-10 px-4 sm:px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                <div className="flex flex-col items-start gap-4 sm:gap-6 pt-28 sm:pt-20">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                            #1 AI Webtoon Platform
                        </span>
                        <h1 className="whitespace-pre-wrap text-3xl font-black tracking-tight sm:text-5xl lg:text-7xl leading-tight">
                            {t('headline')}
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="max-w-xl text-base text-gray-300 sm:text-lg lg:text-xl leading-relaxed"
                    >
                        {t('subheadline')}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto"
                    >
                        <Link
                            href="/login"
                            className="group flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white transition-all hover:bg-indigo-700 hover:scale-105 shadow-lg shadow-indigo-600/25"
                        >
                            {t('startBtn')}
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="#features"
                            className="flex items-center justify-center gap-2 rounded-full border border-gray-600 bg-white/5 backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all hover:bg-white/10 hover:border-gray-500"
                        >
                            <Play className="h-4 w-4 fill-current" />
                            {t('learnMoreBtn')}
                        </a>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10"
            >
                <div className="flex flex-col items-center gap-2 text-xs text-gray-500">
                    <span>SCROLL</span>
                    <div className="h-10 w-6 rounded-full border-2 border-gray-600 p-1">
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            className="h-2 w-full rounded-full bg-gray-400"
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
