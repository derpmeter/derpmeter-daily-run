'use client';

import { Link, usePathname, useRouter } from '@/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { cn } from '@/lib/utils';
import { LayoutDashboard, LayoutTemplate, Settings, Plus, Palette, Home, FolderOpen, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import CreateWorkspaceModal from '@/components/dashboard/CreateWorkspaceModal';
import RechargeModal from '@/components/dashboard/RechargeModal';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem, SidebarToggle } from '@/components/layout/sidebar/Sidebar';
import WorkspaceSelector from '@/components/layout/sidebar/WorkspaceSelector';
import { useUIStore } from '@/store/useUIStore';
import SidebarUserProfile from '@/components/layout/sidebar/SidebarUserProfile';

import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
    children: React.ReactNode;
    accessToken?: string;
}

export default function DashboardLayout({ children, accessToken }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname() || '';
    const { token, hasHydrated, setToken } = useAuthStore();
    const { isSidebarCollapsed, setMobileSidebarOpen } = useUIStore();
    const t = useTranslations('Dashboard');
    const tErrors = useTranslations('Errors');
    const { toast } = useToast();

    // Server-Side Token Sync
    if (accessToken && !token) {
        // Direct state mutation or use store (using store inside render is discouraged usually, 
        // but for hydration sync it might be okay or use useEffect)
    }

    useEffect(() => {
        if (accessToken && accessToken !== token) {
            setToken(accessToken);
        }
    }, [accessToken, token, setToken]);

    // Only need fetchWorkspaces to initialize data
    const { fetchWorkspaces } = useWorkspaceStore();

    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

    // Listen for Recharge Event
    useEffect(() => {
        const handleOpenRecharge = () => setIsRechargeModalOpen(true);
        window.addEventListener('open-recharge-modal', handleOpenRecharge);
        return () => window.removeEventListener('open-recharge-modal', handleOpenRecharge);
    }, []);

    // Listen for API Errors
    useEffect(() => {
        const handleApiError = (event: CustomEvent) => {
            const { type, code, message } = event.detail;
            let titleKey = 'defaultTitle';
            let descKey = 'defaultMessage';
            let customDesc = message;

            // If we have an error code from the server, try to use it for i18n
            if (code) {
                // Try to get the localized message for the error code
                try {
                    const codeMessage = tErrors(`codes.${code}`);
                    // If translation exists and is not the key itself, use it
                    if (codeMessage && !codeMessage.startsWith('codes.')) {
                        customDesc = codeMessage;
                    }
                } catch {
                    // Translation not found, fall back to type-based messages
                }
            }

            switch (type) {
                case 'sessionExpired':
                    titleKey = 'sessionExpired';
                    descKey = 'sessionExpiredDesc';
                    break;
                case 'accessDenied':
                    titleKey = 'accessDenied';
                    descKey = 'accessDeniedDesc';
                    break;
                case 'notFound':
                    titleKey = 'notFound';
                    descKey = 'notFoundDesc';
                    break;
                case 'insufficientCredits':
                    titleKey = 'insufficientCredits';
                    descKey = 'insufficientCreditsDesc';
                    break;
                case 'validationError':
                    titleKey = 'validationError';
                    descKey = 'invalidInput';
                    break;
                case 'serverError':
                    titleKey = 'serverError';
                    descKey = 'serverErrorDesc';
                    break;
                case 'networkError':
                    titleKey = 'networkError';
                    descKey = 'networkErrorDesc';
                    break;
                case 'apiError':
                    // Generic API error with code
                    titleKey = 'defaultTitle';
                    break;
                default:
                    break;
            }

            toast({
                title: tErrors(titleKey),
                description: customDesc || tErrors(descKey),
                variant: 'destructive',
            });
        };

        window.addEventListener('api-error', handleApiError as EventListener);
        return () => window.removeEventListener('api-error', handleApiError as EventListener);
    }, [tErrors, toast]);

    // Auth Guard Logic
    const { userId, isLoaded: isClerkLoaded } = useAuth();

    useEffect(() => {
        // If we have a server token, we are authenticated.
        if (accessToken) return;

        // Wait for both stores to be ready
        if (!hasHydrated || !isClerkLoaded) return;

        // Only redirect if we have updated and still have no token AND no Clerk user
        if (!token && !userId) {
            router.push('/login');
        }
    }, [hasHydrated, isClerkLoaded, token, userId, router, accessToken]);

    // Data Fetching
    useEffect(() => {
        if ((hasHydrated && token) || accessToken) {
            fetchWorkspaces();
        }
    }, [hasHydrated, token, accessToken]);

    // Waiting for hydration
    // If we have a server token, we don't need to wait for client hydration to show the page
    if (!hasHydrated && !accessToken) {
        return <div className="flex h-screen w-full items-center justify-center bg-[#0A0A0B] text-white">Loading...</div>;
    }

    // If hydrated but no token, return null (guard will redirect)
    // But if we have accessToken or Clerk userId, we are good
    if (!token && !accessToken && !userId) return null;

    const navItems = [
        { name: t('nav.home'), href: '/dashboard', icon: Home, exact: true },
        { name: t('nav.projects'), href: '/dashboard/projects', icon: FolderOpen },
        { name: t('nav.styles'), href: '/dashboard/styles', icon: Palette },
        { name: t('nav.templates'), href: '/templates', icon: LayoutTemplate },
        { name: t('nav.settings'), href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen w-full bg-[#0A0A0B] font-display text-gray-900 dark:text-white">
            {/* Mobile Menu Button Only */}
            <button
                onClick={() => setMobileSidebarOpen(true)}
                className="fixed top-4 left-4 z-40 w-11 h-11 flex items-center justify-center bg-[#1A1A1F] border border-gray-700/50 rounded-xl shadow-lg shadow-black/30 text-gray-300 hover:text-white hover:bg-[#252530] transition-all md:hidden"
                aria-label="Open menu"
            >
                <Menu size={22} />
            </button>

            <Sidebar>
                <SidebarHeader>
                    {/* Logo Area */}
                    <Link href="/dashboard" className={cn("flex items-center gap-3 px-2 hover:opacity-80 transition-opacity mt-8 md:mt-0", isSidebarCollapsed && "md:justify-center")}>
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col animate-in fade-in duration-300">
                                <h1 className="text-white text-xl font-bold leading-normal">Toonify</h1>
                                <p className="text-gray-400 text-sm font-normal leading-normal">{t('subtitle')}</p>
                            </div>
                        )}
                        {/* Show on mobile regardless of collapsed state */}
                        {isSidebarCollapsed && (
                            <div className="flex flex-col animate-in fade-in duration-300 md:hidden">
                                <h1 className="text-white text-xl font-bold leading-normal">Toonify</h1>
                                <p className="text-gray-400 text-sm font-normal leading-normal">{t('subtitle')}</p>
                            </div>
                        )}
                    </Link>

                    {/* Workspace Selector */}
                    <WorkspaceSelector
                        onOpenCreateWorkspace={() => setIsCreateModalOpen(true)}
                        onOpenRecharge={() => setIsRechargeModalOpen(true)}
                        isCollapsed={isSidebarCollapsed}
                    />

                    {/* New Project Button */}
                    <div className="px-1 mt-1 mb-2">
                        <Link href="/new-project">
                            <div className={cn(
                                "w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                                isSidebarCollapsed ? "md:h-10 md:w-10 p-3 md:p-0 md:mx-auto md:aspect-square gap-2 md:gap-0" : "p-3 gap-2"
                            )} title={isSidebarCollapsed ? t('newProject') : undefined}>
                                <Plus size={isSidebarCollapsed ? 20 : 16} strokeWidth={3} className="md:block" />
                                <span className={cn("pt-[1px]", isSidebarCollapsed && "md:hidden")}>{t('newProject')}</span>
                            </div>
                        </Link>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            label={item.name}
                        />
                    ))}
                </SidebarContent>

                <SidebarFooter>
                    {/* Profile Section */}
                    <SidebarUserProfile />

                    <CreateWorkspaceModal
                        open={isCreateModalOpen}
                        onOpenChange={setIsCreateModalOpen}
                    />
                    <RechargeModal
                        open={isRechargeModalOpen}
                        onOpenChange={setIsRechargeModalOpen}
                    />
                </SidebarFooter>

                <SidebarToggle />
            </Sidebar>

            {/* Main Content - add left margin to account for fixed sidebar */}
            <main className={cn(
                "flex-1 overflow-auto bg-[#0A0A0B]",
                isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
            )}>
                {children}
            </main>
        </div>
    );
}


