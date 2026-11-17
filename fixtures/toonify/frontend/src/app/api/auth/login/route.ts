import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createLogger } from '@/lib/logger';

const authLogger = createLogger('Auth');

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.formData();
        const username = body.get('username');
        const password = body.get('password');

        // Prepare request to backend
        const formData = new URLSearchParams();
        if (username) formData.append('username', username as string);
        if (password) formData.append('password', password as string);

        const cleanBackendUrl = BACKEND_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
        const targetUrl = `${cleanBackendUrl}/api/v1/auth/login/access-token`;

        authLogger.info('Proxying login request', { targetUrl });

        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            cache: 'no-store',
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            authLogger.warn('Login failed', { status: res.status, errorData });
            return NextResponse.json(
                { error: 'Login failed', details: errorData },
                { status: res.status }
            );
        }

        const data = await res.json();
        const accessToken = data.access_token;
        const expiresIn = 60 * 60 * 24 * 7; // 7 days (adjust based on backend token life)

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: expiresIn,
            path: '/',
        });

        // Return token to client so it can hydrate useAuthStore
        return NextResponse.json({ success: true, user: data.user, access_token: accessToken }, { status: 200 });

    } catch (error) {
        authLogger.error('Unexpected error during login', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
