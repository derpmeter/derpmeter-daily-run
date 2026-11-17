'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, Zap, Crown, Coins, Star, Rocket, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sendGAEvent } from '@next/third-parties/google';
import { useToast } from '@/hooks/use-toast';

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

interface PricingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: 'plans' | 'credits';
}

export default function PricingModal({ open, onOpenChange, initialTab = 'plans' }: PricingModalProps) {
    const t = useTranslations('Landing.Pricing');
    const { toast } = useToast();

    const handlePlanSelect = (plan: Plan) => {
        sendGAEvent('event', 'select_subscription_plan', {
            plan_key: plan.key,
            price: plan.price,
            value: parseFloat(plan.price.replace('$', ''))
        });
        toast({
            title: t('comingSoon'),
            description: t('comingSoonDesc'),
        });
    };

    const handleCreditSelect = (pack: CreditPack) => {
        sendGAEvent('event', 'select_credit_pack', {
            pack_key: pack.key,
            credits: pack.credits,
            price: pack.price,
            value: parseFloat(pack.price.replace('$', ''))
        });
        toast({
            title: t('comingSoon'),
            description: t('comingSoonDesc'),
        });
    };

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0D0D12] border border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">{t('title')}</DialogTitle>
                    <DialogDescription className="text-center text-gray-400">
                        {t('subtitle')}
                    </DialogDescription>
                </DialogHeader>

                {/* Coming Soon Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6"
                >
                    <Construction className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                        <p className="font-semibold text-amber-400">{t('comingSoon')}</p>
                        <p className="text-sm text-amber-300/80">{t('comingSoonDesc')}</p>
                    </div>
                </motion.div>

                {/* Subscription Plans */}
                <div className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan, idx) => {
                            const Icon = plan.icon;
                            return (
                                <motion.div
                                    key={plan.key}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                                    className={`relative flex flex-col rounded-xl border p-4 ${
                                        plan.popular
                                            ? 'border-purple-500/50 bg-purple-500/5 ring-1 ring-purple-500/20'
                                            : 'border-white/10 bg-white/5'
                                    }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                            <span className="bg-purple-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                {t('mostPopular')}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2 mb-3 pt-2">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                            plan.popular ? 'bg-purple-600/30 text-purple-400' : 'bg-indigo-600/20 text-indigo-400'
                                        }`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-base font-semibold text-white">{t(`plans.${plan.key}.name`)}</h3>
                                    </div>

                                    <div className="mb-3">
                                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                                        <span className="text-gray-400 text-sm ml-1">/ {t('perMonth')}</span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-white/5">
                                        <Coins className="h-4 w-4 text-yellow-500" />
                                        <span className="text-white font-medium text-sm">{plan.coins}</span>
                                        <span className="text-gray-400 text-xs">{t('coinsPerMonth')}</span>
                                    </div>

                                    <ul className="flex-1 space-y-2 mb-4">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-xs text-gray-300">{t(`features.${feature}`)}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={() => handlePlanSelect(plan)}
                                        className={`w-full text-sm ${
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
                </div>

                {/* Credit Packs */}
                <div>
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-white">{t('creditPacksTitle')}</h3>
                        <p className="text-sm text-gray-400">{t('creditPacksSubtitle')}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {creditPacks.map((pack, idx) => {
                            const Icon = pack.icon;
                            return (
                                <motion.div
                                    key={pack.key}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                                    onClick={() => handleCreditSelect(pack)}
                                    className={`relative flex flex-col items-center rounded-xl border p-4 cursor-pointer transition-all hover:scale-105 ${
                                        pack.popular
                                            ? 'border-yellow-500/50 bg-yellow-500/5 hover:border-yellow-500 hover:bg-yellow-500/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                    }`}
                                >
                                    {pack.popular && (
                                        <div className="absolute -top-2 right-2">
                                            <span className="bg-yellow-600 text-black text-xs font-semibold px-2 py-0.5 rounded-full">
                                                {t('bestValue')}
                                            </span>
                                        </div>
                                    )}
                                    <Icon className={`h-6 w-6 mb-2 ${pack.popular ? 'text-yellow-500' : 'text-gray-400'}`} />
                                    <div className="text-xl font-bold text-white mb-1">{pack.credits}</div>
                                    <div className="text-xs text-gray-400 mb-2">{t('credits')}</div>
                                    <div className="text-sm font-semibold text-white">{pack.price}</div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
