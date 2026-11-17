'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { createLogger } from '@/lib/logger';

const authProviderLogger = createLogger('AuthProvider');

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { token, logout, setUser, setToken, setAuthProvider, authProvider, clearAuthState } = useAuthStore();
    const { user: clerkUser, isLoaded } = useUser();
    const isSyncing = useRef(false);
    const wasClerkUser = useRef(false);

    useEffect(() => {
        const verifySession = async () => {
            if (!token) return;

            try {
                // Verify token and get latest user data
                const response = await api.get('/users/me');
                setUser(response.data);
            } catch (error) {
                // api.ts interceptor handles 401/403, but we can add fallback here
                authProviderLogger.error('Session verification failed', error);
            }
        };

        verifySession();
    }, [token, setUser]);

    // Sync Clerk User with Backend
    useEffect(() => {
        const syncClerkUser = async () => {
            // Only sync if:
            // 1. Clerk is loaded and we have a user
            // 2. We don't have a backend token yet (or we want to ensure it matches?)
            //    For now, only if missing token to avoid duplicate calls.
            // 3. Not already syncing
            if (!isLoaded || !clerkUser || token || isSyncing.current) return;

            isSyncing.current = true;
            try {
                const res = await axios.post('/api/auth/sync');
                const { access_token, user } = res.data;

                if (access_token) {
                    setToken(access_token);
                    setAuthProvider('clerk');
                    setUser(user);
                }
            } catch (error) {
                authProviderLogger.error('Failed to sync Clerk user with backend', error);
            } finally {
                isSyncing.current = false;
            }
        };

        syncClerkUser();
    }, [isLoaded, clerkUser, token, setToken, setUser, setAuthProvider]);

    // Detect Clerk sign-out: if we had a Clerk user and now we don't, clear auth state
    useEffect(() => {
        if (!isLoaded) return;

        // Track if we have a Clerk user
        if (clerkUser) {
            wasClerkUser.current = true;
        } else if (wasClerkUser.current && authProvider === 'clerk') {
            // Was a Clerk user, now signed out - clear backend session
            wasClerkUser.current = false;
            
            // Check if already logging out to prevent duplicate calls
            if (useAuthStore.getState().isLoggingOut) {
                authProviderLogger.debug('Logout already in progress, skipping clearSession');
                return;
            }
            
            // Clear the backend token and user (without redirect - Clerk handles that)
            const clearSession = async () => {
                authProviderLogger.info('Clerk sign-out detected, clearing backend session');
                try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                } catch (e) {
                    authProviderLogger.error('Failed to logout server-side', e);
                }
                // Reset auth state without redirecting (Clerk handles redirect)
                clearAuthState();
            };
            
            clearSession();
        }
    }, [isLoaded, clerkUser, authProvider, clearAuthState]);

    return <>{children}</>;
}
