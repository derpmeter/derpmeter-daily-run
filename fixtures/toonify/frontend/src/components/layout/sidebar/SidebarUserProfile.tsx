'use client';

import { Link, useRouter } from '@/navigation';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useTranslations } from 'next-intl';
import { UserButton, useUser } from '@clerk/nextjs';

export default function SidebarUserProfile() {
    const router = useRouter();
    const { isSidebarCollapsed } = useUIStore();
    const { user: clerkUser, isLoaded } = useUser();
    const { user: legacyUser, logout } = useAuthStore();
    const t = useTranslations('Dashboard');

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/login');
        }
    };

    if (!isLoaded) return null;

    if (clerkUser) {
        return (
            <div className={cn("flex items-center gap-3 mt-2", isSidebarCollapsed ? "justify-center" : "px-1")}>
                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "size-9"
                        }
                    }}
                />
                {!isSidebarCollapsed && (
                    <div className="flex flex-col min-w-0 overflow-hidden">
                        <p className="text-white text-sm font-medium leading-normal truncate">
                            {clerkUser.fullName || clerkUser.username || "User"}
                        </p>
                        <p className="text-gray-400 text-xs font-normal leading-normal truncate">
                            {clerkUser.primaryEmailAddress?.emailAddress}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-3 mt-2", isSidebarCollapsed ? "justify-center flex-col" : "justify-between px-1")}>
            <Link
                href="/dashboard/settings"
                title={t('profileSettings')}
                className={cn(
                    "flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity",
                    isSidebarCollapsed && "w-full justify-center"
                )}
            >
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 shrink-0"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDt162HoprwUvAfkIffAk7g_psL0UaRy25zgFtGaXcXyJz630egcVpIYDzYA0ixPxpVPquJLNEx4ZV74u4Bz7hTYnD9FqwuLTBLiyiG10hudXU1ScUybYIokJira71mt4ZaujtmgVCAKCBS2OanpmP0MIDIKs4x2kA6x9M1Es0Tyrvy12jCdsCzHFNSK9bNSsG4vcsF_ZAc6ynihPA35wHzJSvE4ybOejxdtr5pKz7E5E3jnU-92N1dtbTLPiYpcvKnPAZzjRGsc3U")' }}
                />
                {!isSidebarCollapsed && (
                    <div className="flex flex-col min-w-0">
                        <p className="text-white text-sm font-medium leading-normal truncate">
                            {legacyUser?.email?.split('@')[0] || "Guest"}
                        </p>
                        <p className="text-gray-400 text-xs font-normal leading-normal truncate">
                            {legacyUser?.email || "guest@toonify.com"}
                        </p>
                    </div>
                )}
            </Link>

            {!isSidebarCollapsed && (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 shrink-0 h-8 w-8"
                        onClick={handleLogout}
                        title={t('logout')}
                    >
                        <LogOut size={16} />
                    </Button>
                </div>
            )}
            {isSidebarCollapsed && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 shrink-0 h-8 w-8 mt-2"
                    onClick={handleLogout}
                    title={t('logout')}
                >
                    <LogOut size={16} />
                </Button>
            )}
        </div>
    );
}
