import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    parseApiError, 
    isAuthError, 
    dispatchErrorEvent, 
    type ErrorEventDetail,
    type ErrorCode,
} from '@/lib/errorUtils';
import { createLogger, getTraceId, setTraceId } from '@/lib/logger';

// Environment variable for API URL or default to localhost
import { config } from '@/lib/config';

const apiLogger = createLogger('API');

// Generate a unique request ID
function generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Environment variable for API URL or default to localhost
const API_URL = config.API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token and request ID
api.interceptors.request.use(
    (config) => {
        // Generate and attach request ID for tracing
        const requestId = generateRequestId();
        config.headers['X-Request-ID'] = requestId;
        
        const token = useAuthStore.getState().token;
        apiLogger.debug('Request started', {
            url: config.url,
            method: config.method?.toUpperCase(),
            requestId,
            hasToken: !!token,
        });
        
        if (token && token !== 'undefined' && token !== 'null') {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // Explicitly remove it if it was set by default
            delete config.headers.Authorization;
        }

        // Set Accept-Language from cookie if available
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'));
            if (match) {
                config.headers['Accept-Language'] = match[2];
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for global error handling with error code support
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            const parsedError = parseApiError(data);
            const errorCode = parsedError.code as ErrorCode | undefined;

            if (status === 401) {
                // 401 Unauthorized - Trigger logout
                // Check if already logging out to prevent infinite loop
                if (useAuthStore.getState().isLoggingOut) {
                    apiLogger.debug('401 received but logout already in progress, skipping');
                    return Promise.reject(error);
                }

                // Check if the token has changed since the request was made (Race Condition protection)
                const currentToken = useAuthStore.getState().token;
                const requestToken = error.config?.headers?.Authorization?.replace('Bearer ', '');

                // Only logout/notify if the 401 comes from the CURRENT token.
                // If the user has already re-logged in (new token), ignore this old 401.
                if (currentToken && requestToken && currentToken !== requestToken) {
                    apiLogger.warn('Ignoring 401 from stale token');
                    return Promise.reject(error);
                }

                apiLogger.info('401 received, logging out user');
                
                // Dispatch error event with error code for i18n
                if (typeof window !== 'undefined') {
                    dispatchErrorEvent({
                        type: 'sessionExpired',
                        code: errorCode,
                        shouldLogout: true,
                    });
                }

                // Clear auth state - logout() handles redirect
                useAuthStore.getState().logout();
            } else if (status === 403) {
                if (typeof window !== 'undefined') {
                    dispatchErrorEvent({
                        type: 'accessDenied',
                        code: errorCode,
                    });
                    window.location.href = '/dashboard';
                }
            } else if (status === 404) {
                if (typeof window !== 'undefined') {
                    dispatchErrorEvent({
                        type: 'notFound',
                        code: errorCode,
                    });
                }
            } else if (status === 402) {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-recharge-modal'));
                    dispatchErrorEvent({
                        type: 'insufficientCredits',
                        code: errorCode,
                    });
                }
            } else if (status === 422 || status === 400) {
                let detailMsg = parsedError.detail || "Invalid input data.";
                if (data.detail && Array.isArray(data.detail)) {
                    detailMsg = data.detail.map((err: { loc: string[]; msg: string }) => 
                        `${err.loc.slice(1).join('.')} ${err.msg}`
                    ).join('\n');
                }
                if (typeof window !== 'undefined') {
                    dispatchErrorEvent({
                        type: 'validationError',
                        code: errorCode,
                        message: detailMsg,
                    });
                }
            } else if (status === 429) {
                if (typeof window !== 'undefined') {
                    dispatchErrorEvent({
                        type: 'apiError',
                        code: errorCode || 'RATE_LIMIT_EXCEEDED',
                    });
                }
            } else if (status >= 500) {
                if (typeof window !== 'undefined') {
                    dispatchErrorEvent({
                        type: 'serverError',
                        code: errorCode,
                    });
                }
            } else {
                const msg = parsedError.detail || 
                    (data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : undefined);
                if (typeof window !== 'undefined') {
                    dispatchErrorEvent({
                        type: 'default',
                        code: errorCode,
                        message: msg,
                    });
                }
            }
        } else if (error.request) {
            if (typeof window !== 'undefined') {
                dispatchErrorEvent({
                    type: 'networkError',
                });
            }
        }

        return Promise.reject(error);
    }
);

export default api;
