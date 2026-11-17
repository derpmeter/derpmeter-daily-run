'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, CreditCard, Shield, Globe, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import PricingModal from '@/components/dashboard/PricingModal';

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const { currentWorkspace } = useWorkspaceStore();
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');
    const ct = useTranslations('Common.languages');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    const handleLanguageChange = async (newLanguage: string) => {
        if (newLanguage === locale) return;

        startTransition(async () => {
            try {
                // Update backend
                if (user) {
                    const response = await api.put('/users/me', {
                        language: newLanguage
                    });

                    if (response.data) {
                        setUser({ ...user, language: newLanguage });
                    }
                }

                // Redirect to new locale using next-intl router
                router.replace(pathname, { locale: newLanguage });
                router.refresh();

            } catch (error) {
                console.error("Failed to update language", error);
                toast({
                    title: "Error",
                    description: "Failed to update language preference.",
                    variant: "destructive"
                });
            }
        });
    };

    return (
        <>
            <div className="flex-1 min-h-screen bg-[#05050a] text-slate-200 font-sans relative selection:bg-purple-500/30 overflow-x-hidden">
                {/* Header */}
                <header className="py-4 md:py-6 pl-16 md:pl-6 lg:pl-10 pr-4 md:pr-6 lg:pr-10 sticky top-0 bg-[#05050a]/80 backdrop-blur-md z-30 border-b border-slate-800/30">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-xl md:text-3xl font-bold text-white mb-1">{t('title')}</h1>
                        <p className="text-slate-400 text-sm">{t('description')}</p>
                    </div>
                </header>

                {/* Content */}
                <div className="p-4 md:p-6 lg:p-10 max-w-4xl mx-auto">
                    <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-[#15151A] border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">{t('profile')}</h2>
                                <p className="text-sm text-gray-400">{t('profileDescription')}</p>
                            </div>
                        </div>

                        <div className="grid gap-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('email')}</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0A0A0B] text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('userId')}</label>
                                <input
                                    type="text"
                                    value={user?.id || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0A0A0B] text-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('language')}</label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={locale === 'en' ? 'default' : 'outline'}
                                        onClick={() => handleLanguageChange('en')}
                                        disabled={isPending}
                                        className={`w-24 ${locale !== 'en' ? 'bg-[#0A0A0B] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' : ''}`}
                                    >
                                        {isPending && locale !== 'en' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {ct('en')}
                                    </Button>
                                    <Button
                                        variant={locale === 'ko' ? 'default' : 'outline'}
                                        onClick={() => handleLanguageChange('ko')}
                                        disabled={isPending}
                                        className={`w-24 ${locale !== 'ko' ? 'bg-[#0A0A0B] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' : ''}`}
                                    >
                                        {isPending && locale !== 'ko' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {ct('ko')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Workspace Section */}
                    {currentWorkspace && (
                        <div className="bg-[#15151A] border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">{t('workspace')} <span className="text-purple-400">{currentWorkspace.name}</span></h2>
                                    <p className="text-sm text-gray-400">{t('workspaceDescription')}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-4 rounded-xl bg-[#0A0A0B] border border-gray-800 hover:border-gray-700 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="text-gray-500" size={16} />
                                        <span className="text-sm font-medium text-gray-400">{t('currentPlan')}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white capitalize">{currentWorkspace.tier}</p>
                                    <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80 mt-2" onClick={() => setIsPricingModalOpen(true)}>{t('upgradePlan')}</Button>
                                </div>

                                <div className="p-4 rounded-xl bg-[#0A0A0B] border border-gray-800 hover:border-gray-700 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="size-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                            <div className="size-2 rounded-full bg-yellow-500" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-400">{t('creditsAvailable')}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{currentWorkspace.credits.toLocaleString()}</p>
                                    <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80 mt-2" onClick={() => setIsPricingModalOpen(true)}>{t('purchaseCredits')}</Button>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>
            <PricingModal open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen} />
        </>
    );
}
