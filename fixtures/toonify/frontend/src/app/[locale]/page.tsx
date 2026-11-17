'use client';

import { useRouter } from '@/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';
import WebtoonGridSection from '@/components/landing/WebtoonGridSection';
import GenreNav from '@/components/landing/GenreNav';
import RankingSection from '@/components/landing/RankingSection';
import CheckItOutSection from '@/components/landing/CheckItOutSection';
import { motion } from 'framer-motion';

export default function Home() {
    const { token, logout } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const t = useTranslations('Landing');

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (token) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black opacity-60" />

                <div className="z-10 text-center space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold"
                    >
                        {t('loggedIn')}
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex gap-4 justify-center"
                    >
                        <Button
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => router.push('/dashboard')}
                        >
                            {t('dashboard')}
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="bg-transparent border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                            onClick={logout}
                        >
                            {t('logout')}
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <HeroSection />
            <GenreNav />
            <WebtoonGridSection />
            <RankingSection />
            <CheckItOutSection />
            <FeaturesSection />
            <HowItWorksSection />
            <PricingSection />
            <Footer />
        </main>
    );
}
