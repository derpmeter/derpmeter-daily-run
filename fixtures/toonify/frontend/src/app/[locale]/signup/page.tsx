'use client';

import { useForm } from 'react-hook-form';
import { useRouter, Link } from '@/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { SignUp } from '@clerk/nextjs';
import { createLogger } from '@/lib/logger';

const signupLogger = createLogger('SignupPage');

export default function SignupPage() {
    const { register, handleSubmit } = useForm();
    const router = useRouter();
    const [error, setError] = useState('');
    const t = useTranslations('Auth');

    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'hybrid';
    const showClerk = authMode === 'clerk_only' || authMode === 'hybrid';
    const showLegacy = authMode === 'legacy' || authMode === 'hybrid';

    const onSubmit = async (data: any) => {
        signupLogger.info('Signup form submitted');
        try {
            signupLogger.debug('Sending API request to /auth/signup');
            const response = await api.post('/auth/signup', {
                email: data.email,
                password: data.password,
                username: data.email.split('@')[0]
            });
            signupLogger.info('Signup successful');
            router.push('/login');
        } catch (err: any) {
            signupLogger.error('Signup failed', err);
            if (err.response) {
                signupLogger.debug('Error response data', { data: err.response.data });
                const detail = err.response.data.detail;
                if (detail) {
                    if (Array.isArray(detail)) {
                        setError(detail.map((d: any) => d.msg).join(', '));
                    } else {
                        setError(String(detail));
                    }
                } else {
                    setError('Signup failed. Unknown server error.');
                }
            } else if (err.request) {
                signupLogger.debug('No response received');
                setError('Network error. Check your connection.');
            } else {
                signupLogger.debug('Error setting up request', { message: err.message });
                setError(t('unknownError'));
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg flex flex-col gap-6">
                <h2 className="mb-2 text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                    {t('signupTitle')}
                </h2>

                {showClerk && (
                    <div className="flex justify-center w-full">
                        <SignUp forceRedirectUrl="/dashboard" />
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
                        {error && <p className="mb-4 text-red-500 text-center">{error}</p>}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm text-gray-400">{t('email')}</label>
                                <input
                                    {...register('email')}
                                    data-testid="signup-email"
                                    type="email"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-green-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-gray-400">{t('password')}</label>
                                <input
                                    {...register('password')}
                                    data-testid="signup-password"
                                    type="password"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-green-500"
                                    required
                                />
                            </div>
                            <Button type="submit" data-testid="signup-submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                {t('submitSignup')}
                            </Button>
                        </form>

                        <p className="mt-4 text-center text-sm text-gray-500">
                            {t('hasAccount')} <Link href="/login" className="text-blue-400 hover:text-blue-300">{t('loginLink')}</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
