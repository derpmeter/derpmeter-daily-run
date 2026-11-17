/**
 * Error Handling Utilities for Toonify Frontend
 * 
 * This module provides utilities for handling API errors with i18n support.
 * Error codes from the backend are mapped to localized messages.
 */

import { toast } from '@/components/ui/toaster';

// Type for error codes from backend
export type ErrorCode = 
    // Auth errors (401)
    | 'AUTH_TOKEN_EXPIRED'
    | 'AUTH_TOKEN_INVALID'
    | 'AUTH_CREDENTIALS_INVALID'
    | 'AUTH_SESSION_EXPIRED'
    | 'AUTH_USER_NOT_FOUND'
    // Forbidden errors (403)
    | 'FORBIDDEN_RESOURCE'
    | 'FORBIDDEN_WORKSPACE'
    | 'FORBIDDEN_PROJECT'
    // Not found errors (404)
    | 'NOT_FOUND_USER'
    | 'NOT_FOUND_PROJECT'
    | 'NOT_FOUND_EPISODE'
    | 'NOT_FOUND_CUT'
    | 'NOT_FOUND_CHARACTER'
    | 'NOT_FOUND_STYLE'
    | 'NOT_FOUND_WORKSPACE'
    | 'NOT_FOUND_SUGGESTION'
    | 'NOT_FOUND_GENRE'
    // Payment errors (402)
    | 'PAYMENT_INSUFFICIENT_CREDITS'
    | 'PAYMENT_REQUIRED'
    // Validation errors (400/422)
    | 'VALIDATION_INVALID_INPUT'
    | 'VALIDATION_INVALID_UUID'
    | 'VALIDATION_DUPLICATE_ENTRY'
    | 'VALIDATION_MISSING_REQUIRED'
    // Conflict errors (409)
    | 'CONFLICT_DUPLICATE_NAME'
    | 'CONFLICT_RESOURCE_EXISTS'
    // Rate limiting (429)
    | 'RATE_LIMIT_EXCEEDED'
    // Server errors (500)
    | 'SERVER_INTERNAL_ERROR'
    | 'SERVER_AI_SERVICE_ERROR'
    | 'SERVER_STORAGE_ERROR'
    | 'SERVER_DATABASE_ERROR'
    // Generation errors
    | 'GENERATION_FAILED'
    | 'GENERATION_TIMEOUT'
    | 'GENERATION_QUOTA_EXCEEDED';

export interface ApiErrorResponse {
    code?: ErrorCode;
    detail?: string;
    extra?: Record<string, unknown>;
}

export interface ErrorEventDetail {
    type: 'sessionExpired' | 'accessDenied' | 'notFound' | 'insufficientCredits' | 
          'validationError' | 'serverError' | 'networkError' | 'default' | 'apiError';
    code?: ErrorCode;
    message?: string;
    shouldLogout?: boolean;
}

/**
 * Check if an error code requires immediate logout
 */
export function isAuthError(code?: ErrorCode): boolean {
    const authErrorCodes: ErrorCode[] = [
        'AUTH_TOKEN_EXPIRED',
        'AUTH_TOKEN_INVALID',
        'AUTH_SESSION_EXPIRED',
        'AUTH_USER_NOT_FOUND',
    ];
    return code !== undefined && authErrorCodes.includes(code);
}

/**
 * Get the i18n key for an error code
 */
export function getErrorMessageKey(code?: ErrorCode): string {
    if (!code) return 'Errors.defaultMessage';
    return `Errors.codes.${code}`;
}

/**
 * Get the error title key based on status code
 */
export function getErrorTitleKey(statusCode: number): string {
    if (statusCode === 401) return 'Errors.sessionExpired';
    if (statusCode === 403) return 'Errors.accessDenied';
    if (statusCode === 404) return 'Errors.notFound';
    if (statusCode === 402) return 'Errors.insufficientCredits';
    if (statusCode === 422 || statusCode === 400) return 'Errors.validationError';
    if (statusCode >= 500) return 'Errors.serverError';
    return 'Errors.defaultTitle';
}

/**
 * Dispatch a custom error event for global error handling
 */
export function dispatchErrorEvent(detail: ErrorEventDetail): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-error', { detail }));
    }
}

/**
 * Parse error response from API
 */
export function parseApiError(data: unknown): ApiErrorResponse {
    if (typeof data === 'object' && data !== null) {
        const parsed = data as Record<string, unknown>;
        return {
            code: parsed.code as ErrorCode | undefined,
            detail: typeof parsed.detail === 'string' ? parsed.detail : undefined,
            extra: typeof parsed.extra === 'object' ? parsed.extra as Record<string, unknown> : undefined,
        };
    }
    return {};
}
