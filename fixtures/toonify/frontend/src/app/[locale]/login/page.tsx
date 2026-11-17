'use client';

import { useForm } from 'react-hook-form';
import { useRouter, Link } from '@/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { SignIn } from '@clerk/nextjs';
import { createLogger } from '@/lib/logger';

const loginLogger = createLogger('LoginPage');

export default function LoginPage() {
    const { register, handleSubmit } = useForm();
    const router = useRouter();
    const setToken = useAuthStore((state) => state.setToken);
    const [error, setError] = useState('');
    const t = useTranslations('Auth');
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'hybrid';
    const showClerk = authMode === 'clerk_only' || authMode === 'hybrid';
    const showLegacy = authMode === 'legacy' || authMode === 'hybrid';

    const onSubmit = async (data: any) => {
        try {
            // Form Data for Next.js Auth Route (which proxies to backend)
            const formData = new FormData();
            formData.append('username', data.email);
            formData.append('password', data.password);

            // POST to our new Next.js internal route
            const res = await axios.post('/api/auth/login', formData);

            loginLogger.info('Login response received', { success: res.data.success });

            // Update client store for reactivity (Cookie handles the real auth)
            // Ideally we also get the user object back
            if (res.data.success) {
                // Sync client store so DashboardLayout and API interceptors work immediately
                // The middleware/cookie handles the route protection, but the access token 
                // is still needed for client-side API calls and UI state.

                // Note: The login route proxy returns { success: true, user: ... } 
                // We need the token too if we want to store it in Zustand.
                // Currently `route.ts` extracts token from backend response but only sets cookie.
                // Let's modify `route.ts` to return the token as well, or just rely on the cookie 
                // and make `useAuthStore` purely a "User State" store?
                // For now, easiest fix is to return the token from `route.ts` so we can set it.

                // Wait, I need to check if `route.ts` returns the token. 
                // It does NOT currently returning access_token in JSON, only in Cookie.
                // I will update `route.ts` first to return it.
                // BUT, for now, let's assume I fix route.ts next.

                if (res.data.access_token) {
                    setToken(res.data.access_token);
                }
                // If user data is returned
                // setUser(res.data.user);

                router.push('/dashboard');
            }
        } catch (err) {
            setError(t('invalidCredentials'));
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white px-4 sm:px-6">
            <div className="w-full max-w-md p-6 sm:p-8 bg-gray-800 rounded-lg shadow-lg flex flex-col gap-5 sm:gap-6">
                <h2 className="mb-1 sm:mb-2 text-2xl sm:text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    {t('loginTitle')}
                </h2>

                {showClerk && (
                    <div className="flex justify-center w-full overflow-hidden">
                        {/* Using SignIn with no specific path config to allow it to function as a standalone unit 
                             Using forceRedirectUrl to ensure we go to dashboard after sign in
                         */}
                        <SignIn forceRedirectUrl="/auth/callback" />
                    </div>
                )}

                {showClerk && showLegacy && (
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-600"></span></div>
                        <div className="relative flex justify-center text-sm uppercase">
                            <span className="bg-gray-800 px-2 text-gray-400">{t('orContinueWithEmail')}</span>
                        </div>
                    </div>
                )}

                {showLegacy && (
                    <>
                        {error && <p className="mb-3 sm:mb-4 text-red-500 text-center text-sm">{error}</p>}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm text-gray-400">{t('email')}</label>
                                <input
                                    {...register('email')}
                                    data-testid="login-email"
                                    type="email"
                                    className="w-full px-4 py-2.5 sm:py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500 text-base sm:text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-gray-400">{t('password')}</label>
                                <input
                                    {...register('password')}
                                    data-testid="login-password"
                                    type="password"
                                    className="w-full px-4 py-2.5 sm:py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500 text-base sm:text-sm"
                                    required
                                />
                            </div>
                            <Button type="submit" data-testid="login-submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-2 px-4 rounded">
                                {t('submitLogin')}
                            </Button>
                        </form>

                        <p className="mt-3 sm:mt-4 text-center text-sm text-gray-500">
                            {t('noAccount')} <Link href="/signup" className="text-purple-400 hover:text-purple-300">{t('createAccount')}</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
