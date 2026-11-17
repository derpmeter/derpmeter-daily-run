'use client';

import { useEffect } from 'react';
import { useRouter } from '@/navigation'; // Use localized router
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { CustomLoader } from '@/components/ui/custom-loader';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthCallbackPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const setToken = useAuthStore((state) => state.setToken);
    const setAuthUser = useAuthStore((state) => state.setUser);

    useEffect(() => {
        if (isLoaded) {
            if (!isSignedIn) {
                router.push('/login');
            } else {
                // Trigger Sync
                axios.post('/api/auth/sync')
                    .then((res) => {
                        // Success -> Set Token & Dashboard
                        if (res.data.access_token) {
                            setToken(res.data.access_token);
                        }
                        // if (res.data.user) {
                        //     setAuthUser(res.data.user);
                        // }

                        router.push('/dashboard');
                    })
                    .catch((err) => {
                        console.error("Sync failed", err);
                        // Fallback -> Dashboard (maybe sync happened or transient error)
                        // Ideally we show an error, but blocking login is annoying.
                        // Backend ensures essential data on sync.
                        router.push('/dashboard');
                    });
            }
        }
    }, [isLoaded, isSignedIn, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
                <h2 className="text-xl mb-4">Setting up your workspace...</h2>
                <CustomLoader size={32} className="mx-auto" />
            </div>
        </div>
    );
}
