import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createLogger } from '@/lib/logger';

const authLogger = createLogger('AuthStore');

interface User {
    id: string;
    email: string;
    language?: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    authProvider: 'legacy' | 'clerk';
    hasHydrated: boolean;
    isLoggingOut: boolean;
    setToken: (token: string | null) => void;
    setUser: (user: User | null) => void;
    setAuthProvider: (provider: 'legacy' | 'clerk') => void;
    setHasHydrated: (state: boolean) => void;
    logout: () => Promise<void>;
    clearAuthState: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            authProvider: 'legacy',
            hasHydrated: false,
            isLoggingOut: false,
            setToken: (token) => set({ token }),
            setUser: (user) => set({ user }),
            setAuthProvider: (provider) => set({ authProvider: provider }),
            setHasHydrated: (state) => set({ hasHydrated: state }),
            // Clear auth state without redirect (for use by AuthProvider when Clerk handles logout)
            clearAuthState: () => {
                set({ token: null, user: null, authProvider: 'legacy' });
                // Clear all browser storage
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.clear();
                        sessionStorage.clear();
                        authLogger.debug('Cleared all browser storage via clearAuthState');
                    } catch (e) {
                        authLogger.error('Failed to clear browser storage', e);
                    }
                }
            },
            logout: async () => {
                // Prevent duplicate logout calls (infinite loop protection)
                if (get().isLoggingOut) {
                    authLogger.debug('Logout already in progress, skipping duplicate call');
                    return;
                }
                
                set({ isLoggingOut: true });
                authLogger.info('Starting logout process');
                
                try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                } catch (e) {
                    authLogger.error('Failed to logout server-side', e);
                }
                
                // Clear local state
                set({ token: null, user: null, authProvider: 'legacy' });
                
                // Clear all browser storage (localStorage and sessionStorage)
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.clear();
                        sessionStorage.clear();
                        authLogger.debug('Cleared all browser storage');
                    } catch (e) {
                        authLogger.error('Failed to clear browser storage', e);
                    }
                }
                
                // Small delay to ensure state is cleared before redirect
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Redirect to landing page
                if (typeof window !== 'undefined') {
                    window.location.href = '/';
                }
            },
        }),
        {
            name: 'auth-storage', // unique name
            // Exclude runtime flags from persistence - they should reset on page reload
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                authProvider: state.authProvider,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
