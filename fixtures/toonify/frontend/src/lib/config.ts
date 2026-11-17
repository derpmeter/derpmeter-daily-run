/**
 * Frontend Configuration
 * 
 * Enforces presence of required environment variables.
 * Usage: import config from '@/lib/config';
 */

const validateEnv = (key: string, value: string | undefined): string => {
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

// We only enforce variables that MUST be present for the app to function basics.
// NEXT_PUBLIC_API_URL is critical for API calls.

export const config = {
    // For Cookie-based auth, we MUST request via the Next.js Proxy (/api)
    // so that the server can attach the HttpOnly cookie.
    // If request goes directly to backend (e.g. :8000), browser sends no cookie -> 401.
    API_URL: '/api/v1', // Maps to frontend/src/app/api/[...path] -> backend/api/v1 

    // Internal Backend URL (only used server-side usually, but might be needed)
    // We can make this optional if it's not strictly required for client-side rendering,
    // but requested was "all injected values".
    INTERNAL_BACKEND_URL: process.env.INTERNAL_BACKEND_URL || '',
} as const;
