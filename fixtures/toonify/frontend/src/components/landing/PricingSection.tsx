'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, Zap, Crown, Coins, Star, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from '@/navigation';

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

type Plan = {
    key: string;
    price: string;
    coins: string;
    icon: typeof Sparkles;
    popular?: boolean;
    features: string[];
};

type CreditPack = {
    key: string;
    credits: number;
    price: string;
    icon: typeof Coins;
    popular?: boolean;
};

export default function PricingSection() {
    const t = useTranslations('Landing.Pricing');
    const { toast } = useToast();
    const router = useRouter();

    const plans: Plan[] = [
        {
            key: 'plus',
            price: '$12',
            coins: '800',
            icon: Sparkles,
            features: ['textPromptOnly', 'standardQuality', 'communitySupport'],
        },
        {
            key: 'pro',
            price: '$39',
            coins: '3,000',
            icon: Zap,
            popular: true,
            features: ['multimodalRef', 'hdQuality', 'prioritySupport', 'advancedTools'],
        },
        {
            key: 'studio',
            price: '$119',
            coins: '10,000',
            icon: Crown,
            features: ['dedicatedPrompt', 'premiumQuality', 'dedicatedSupport', 'chatbotRevenue', 'apiAccess'],
        },
    ];

    const creditPacks: CreditPack[] = [
        { key: 'starter', credits: 100, price: '$2.99', icon: Coins },
        { key: 'creator', credits: 500, price: '$9.99', icon: Star, popular: true },
        { key: 'proPack', credits: 1200, price: '$19.99', icon: Rocket },
    ];

    const handlePurchase = (type: string, name: string) => {
        // Redirect to signup page for non-logged-in users
        router.push('/signup');
    };

    return (
        <section id="pricing" className="relative py-16 sm:py-32 bg-black overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
            
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10 sm:mb-16"
                >
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                        {t('title')}
                    </h2>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </motion.div>

                {/* Subscription Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20">
                    {plans.map((plan, idx) => {
                        const Icon = plan.icon;
                        return (
                            <motion.div
                                key={plan.key}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 ${
                                    plan.popular
                                        ? 'border-purple-500/50 bg-purple-500/5 ring-2 ring-purple-500/20'
                                        : 'border-white/10 bg-white/5'
                                } hover:bg-white/10 transition-colors`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                            {t('mostPopular')}
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                        plan.popular ? 'bg-purple-600/30 text-purple-400' : 'bg-indigo-600/20 text-indigo-400'
                                    }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white">{t(`plans.${plan.key}.name`)}</h3>
                                </div>

                                <div className="mb-4 sm:mb-6">
                                    <span className="text-3xl sm:text-4xl font-bold text-white">{plan.price}</span>
                                    <span className="text-gray-400 ml-1">/ {t('perMonth')}</span>
                                </div>

                                <div className="flex items-center gap-2 mb-4 sm:mb-6 p-2 sm:p-3 rounded-lg bg-white/5">
                                    <Coins className="h-5 w-5 text-yellow-500" />
                                    <span className="text-white font-medium">{plan.coins}</span>
                                    <span className="text-gray-400 text-sm">{t('coinsPerMonth')}</span>
                                </div>

                                <ul className="flex-1 space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-300">{t(`features.${feature}`)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handlePurchase('plan', plan.key)}
                                    className={`w-full ${
                                        plan.popular
                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                                    }`}
                                >
                                    {t('subscribe')}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Credit Packs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6 sm:mb-10"
                >
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{t('creditPacksTitle')}</h3>
                    <p className="mt-2 text-sm sm:text-base text-gray-400">{t('creditPacksSubtitle')}</p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
                    {creditPacks.map((pack, idx) => {
                        const Icon = pack.icon;
                        return (
                            <motion.div
                                key={pack.key}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className={`relative flex flex-col items-center rounded-xl border p-5 sm:p-6 ${
                                    pack.popular
                                        ? 'border-yellow-500/50 bg-yellow-500/5'
                                        : 'border-white/10 bg-white/5'
                                } hover:bg-white/10 transition-colors cursor-pointer`}
                                onClick={() => handlePurchase('pack', pack.key)}
                            >
                                {pack.popular && (
                                    <div className="absolute -top-2 right-4">
                                        <span className="bg-yellow-600 text-black text-xs font-semibold px-2 py-0.5 rounded-full">
                                            {t('bestValue')}
                                        </span>
                                    </div>
                                )}
                                <Icon className={`h-7 w-7 sm:h-8 sm:w-8 mb-2 sm:mb-3 ${pack.popular ? 'text-yellow-500' : 'text-gray-400'}`} />
                                <div className="text-xl sm:text-2xl font-bold text-white mb-1">{pack.credits}</div>
                                <div className="text-sm text-gray-400 mb-2 sm:mb-3">{t('credits')}</div>
                                <div className="text-base sm:text-lg font-semibold text-white">{pack.price}</div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
