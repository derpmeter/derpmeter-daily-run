'use client';

import { Link, usePathname, useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Clapperboard, ArrowLeft, Coins, Plus, Menu } from 'lucide-react';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem, SidebarToggle } from '@/components/layout/sidebar/Sidebar';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';
import RechargeModal from '@/components/dashboard/RechargeModal';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useTranslations } from 'next-intl';
import SidebarUserProfile from '@/components/layout/sidebar/SidebarUserProfile';
import WorkspaceSelector from '@/components/layout/sidebar/WorkspaceSelector';

interface ProjectLayoutProps {
    children: React.ReactNode;
    projectId?: string; // Make optional since we prefer URL params
    projectTitle?: string;
}

export default function ProjectLayout({ children, projectId: propProjectId, projectTitle }: ProjectLayoutProps) {
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();
    const { isSidebarCollapsed, setMobileSidebarOpen } = useUIStore();
    const { fetchWorkspaces, currentWorkspace } = useWorkspaceStore();
    const t = useTranslations('Dashboard');

    // Prefer URL params over props for navigation integrity
    // URL params are immediately available during routing, avoiding race conditions
    const urlProjectId = params?.projectId as string;
    const projectId = urlProjectId || propProjectId;

    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

    // Guard: Redirect if projectId is missing or invalid
    useEffect(() => {
        if (!projectId || projectId === 'undefined') {
            console.warn('ProjectLayout: Invalid projectId, redirecting to dashboard');
            router.replace('/dashboard');
        }
    }, [projectId, router]);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    // Only build navItems if projectId is valid
    const safeProjectId = projectId && projectId !== 'undefined' ? projectId : null;
    
    const navItems = safeProjectId ? [
        { name: 'Overview', href: `/project/${safeProjectId}`, icon: LayoutDashboard, exact: true },
        { name: 'Characters', href: `/project/${safeProjectId}/characters`, icon: Users, exact: false },
        { name: 'Episodes', href: `/project/${safeProjectId}/episodes`, icon: Clapperboard, exact: false },
    ] : [];

    return (
        <div className="flex h-full min-h-screen bg-[#0A0A0B]">
            {/* Mobile Menu Button Only */}
            <button
                onClick={() => setMobileSidebarOpen(true)}
                className="fixed top-4 left-4 z-40 w-11 h-11 flex items-center justify-center bg-[#1A1A1F] border border-gray-700/50 rounded-xl shadow-lg shadow-black/30 text-gray-300 hover:text-white hover:bg-[#252530] transition-all md:hidden"
                aria-label="Open menu"
            >
                <Menu size={22} />
            </button>


            {/* Project Sidebar */}
            <Sidebar>
                <SidebarHeader>
                    {/* Back to Dashboard */}
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium px-2 py-2 mb-2 hover:bg-[#15151A] rounded-lg mt-8 md:mt-0",
                            isSidebarCollapsed ? "md:justify-center md:w-10 md:h-10 md:p-0" : ""
                        )}
                        title={t('backToDashboard')}
                    >
                        <ArrowLeft size={isSidebarCollapsed ? 20 : 16} />
                        <span className={cn(isSidebarCollapsed && "md:hidden")}>{t('backToDashboard')}</span>
                    </Link>

                    {/* Workspace Info (Read-only) */}
                    <div className="mb-2 mt-1">
                        <WorkspaceSelector
                            readOnly
                            isCollapsed={isSidebarCollapsed}
                            onOpenRecharge={() => setIsRechargeModalOpen(true)}
                        />
                    </div>
                </SidebarHeader>

                {/* Navigation */}
                <SidebarContent>
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            label={item.name}
                        />
                    ))}
                </SidebarContent>

                {/* Footer Settings */}
                <SidebarFooter>
                    {/* Profile Section */}
                    <SidebarUserProfile />

                    {/* Modals */}
                    <RechargeModal
                        open={isRechargeModalOpen}
                        onOpenChange={setIsRechargeModalOpen}
                    />
                </SidebarFooter>

                <SidebarToggle />
            </Sidebar>

            {/* Main Content - add left margin to account for fixed sidebar */}
            <main className={cn(
                "flex-1 min-w-0 bg-[#0A0A0B] relative",
                // Add left margin for fixed sidebar on desktop
                isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
            )}>
                {children}
            </main>
        </div>
    );
}

