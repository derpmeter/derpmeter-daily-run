'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, usePathname } from '@/navigation';

// Context
const SidebarContext = createContext<{ isCollapsed: boolean } | undefined>(undefined);

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) throw new Error('useSidebar must be used within Sidebar');
    return context;
}

interface SidebarProps {
    children: React.ReactNode;
    className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
    const { isSidebarCollapsed, isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
    const pathname = usePathname();

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [pathname, setMobileSidebarOpen]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileSidebarOpen]);

    // On mobile drawer, always show expanded view regardless of desktop collapsed state
    return (
        <SidebarContext.Provider value={{ isCollapsed: isMobileSidebarOpen ? false : isSidebarCollapsed }}>
            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    // Base styles
                    "flex flex-col border-r border-gray-800 bg-[#0F0F12] transition-all duration-300 ease-in-out h-screen shrink-0 z-50",
                    // Desktop: fixed sidebar (not sticky) so it doesn't scroll with content
                    "md:fixed md:top-0 md:left-0",
                    // Mobile: fixed drawer
                    "fixed top-0 left-0",
                    // Mobile visibility
                    isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    // Width
                    isSidebarCollapsed ? "md:w-20" : "w-72 md:w-64",
                    className
                )}
            >
                {/* Mobile Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </Button>
                {children}
            </aside>
        </SidebarContext.Provider>
    );
}

// Subcomponents

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    const { isCollapsed } = useSidebar();
    return (
        <div className={cn("flex flex-col gap-4 p-4", className)}>
            {children}
        </div>
    );
}

export function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scrollbar", className)}>
            {children}
        </div>
    );
}

export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    const { isCollapsed } = useSidebar();
    return (
        <div className={cn("p-3 border-t border-gray-800 mt-auto overflow-hidden", className)}>
            {children}
        </div>
    );
}

export function SidebarToggle() {
    const { isSidebarCollapsed, toggleSidebar } = useUIStore();
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex absolute -right-3 top-6 w-6 h-6 rounded-full border border-gray-700 bg-[#15151A] hover:bg-gray-800 text-gray-400 p-0 shadow-sm z-50 items-center justify-center"
        >
            {isSidebarCollapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
        </Button>
    );
}

interface SidebarItemProps {
    href?: string;
    icon: React.ElementType;
    label: string;
    active?: boolean;
    onClick?: () => void;
    className?: string;
    exact?: boolean;
    rightSlot?: React.ReactNode;
}

export function SidebarItem({ href, icon: Icon, label, active, onClick, className, rightSlot, exact }: SidebarItemProps) {
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();

    const isActive = active !== undefined
        ? active
        : (href ? (exact ? pathname === href : pathname?.startsWith(href || '')) : false);

    const content = (
        <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group min-h-[44px]",
            isActive
                ? "bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20"
                : "text-gray-400 hover:text-white hover:bg-[#15151A] border border-transparent",
            isCollapsed && "md:justify-center md:px-0",
            className
        )}>
            <Icon size={20} className={cn(
                "shrink-0 transition-colors",
                isActive ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300"
            )} />

            {/* Always show label on mobile, hide when collapsed on desktop */}
            <span className={cn(
                "truncate flex-1 text-sm animate-in fade-in duration-200",
                isCollapsed && "md:hidden"
            )}>
                {label}
            </span>

            {!isCollapsed && isActive && rightSlot}
            {!isCollapsed && isActive && !rightSlot && (
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] hidden md:block" />
            )}
            {/* Mobile: always show indicator */}
            {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] md:hidden" />
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} onClick={onClick} title={isCollapsed ? label : undefined} className="block w-full">
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} title={isCollapsed ? label : undefined} className="block w-full text-left">
            {content}
        </button>
    );
}

// Sidebar Group Label
export function SidebarLabel({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();
    if (isCollapsed) return <div className="h-4 hidden md:block" />; // Spacer only on desktop
    return (
        <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider animate-in fade-in">
            {children}
        </div>
    );
}
