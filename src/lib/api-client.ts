
import { toast } from '@/lib/toast';
import { createBrowserClient } from '@/lib/supabase-browser';

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code: string = 'UNKNOWN_ERROR',
        public originalError?: any
    ) {
        super(message);
        this.name = 'AppError';
    }
}

interface RequestConfig extends RequestInit {
    timeout?: number;
    retries?: number; // Number of retries for 5xx/Network errors
    retryDelay?: number; // Base delay in ms
}

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000;

let refreshPromise: Promise<any> | null = null;

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, config: RequestConfig = {}): Promise<Response> {
    const {
        timeout = DEFAULT_TIMEOUT,
        retries = DEFAULT_RETRIES,
        retryDelay = DEFAULT_RETRY_DELAY,
        ...fetchOptions
    } = config;

    let attempt = 0;

    while (attempt <= retries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Don't retry on 4xx/3xx errors here, only 5xx
            if (response.status >= 500 && attempt < retries) {
                throw new Error(`Server Error: ${response.status}`);
            }

            return response;

        } catch (error: any) {
            clearTimeout(timeoutId);

            const isAbort = error.name === 'AbortError';
            const isNetworkError = error.message === 'Failed to fetch' || isAbort;

            if (attempt < retries && (isNetworkError || error.message.includes('Server Error'))) {
                attempt++;
                const backoff = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
                console.warn(`[API] Attempt ${attempt} failed for ${url}. Retrying in ${Math.round(backoff)}ms...`, error);
                await delay(backoff);
                continue;
            }

            if (isAbort) {
                throw new AppError('A requisição demorou muito para responder.', 408, 'TIMEOUT', error);
            }

            throw error;
        }
    }

    throw new AppError('Falha desconhecida na requisição', 500);
}

async function request<T = any>(
    url: string,
    config: RequestConfig = {},
    isRetry: boolean = false
): Promise<T> {
    try {
        const response = await fetchWithRetry(url, config);

        if (response.status === 401 && !isRetry) {
            return await handleUnauthorized<T>(url, config);
        }

        if (response.status === 204) return {} as T;

        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                throw new AppError('Resposta inválida do servidor (JSON malformado).', 500, 'PARSE_ERROR', e);
            }
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const errorMessage = data?.error || data?.message || `Erro ${response.status}: Falha na requisição`;
            throw new AppError(errorMessage, response.status, data?.code || 'API_ERROR', data);
        }

        return data as T;
    } catch (error: any) {
        if (error.statusCode >= 500 || error.code === 'PARSE_ERROR' || error.code === 'TIMEOUT') {
            console.error('[API Error]', { url, error });
        }
        if (error instanceof AppError) throw error;
        throw new AppError(error.message || 'Erro inesperado de conexão', 500, 'NETWORK_ERROR', error);
    }
}

async function handleUnauthorized<T>(url: string, config: RequestConfig): Promise<T> {
    const supabase = createBrowserClient();

    try {
        if (!refreshPromise) {
            console.log('[API] Token expired, attempting refresh...');
            refreshPromise = supabase.auth.refreshSession();
        }

        const { data, error } = await refreshPromise;
        if (refreshPromise) refreshPromise = null;

        if (error || !data.session) throw new Error('Refresh failed');

        console.log('[API] Token refreshed, retrying request...');
        return await request<T>(url, config, true);
    } catch (err) {
        console.warn('[API] Auth session expired and refresh failed. Redirecting to login.');
        if (typeof window !== 'undefined') {
            const redirectPath = encodeURIComponent(window.location.pathname);
            window.location.href = `/login?redirectTo=${redirectPath}`;
        }
        throw new AppError('Sessão expirada. Por favor, faça login novamente.', 401, 'AUTH_EXPIRED');
    }
}

export const apiClient = {
    request,
    get: <T = any>(url: string, config?: RequestConfig) => request<T>(url, { ...config, method: 'GET' }),
    post: <T = any>(url: string, body: any, config?: RequestConfig) =>
        request<T>(url, {
            ...config,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(config?.headers || {}) },
            body: JSON.stringify(body),
        }),
    put: <T = any>(url: string, body: any, config?: RequestConfig) =>
        request<T>(url, {
            ...config,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(config?.headers || {}) },
            body: JSON.stringify(body),
        }),
    delete: <T = any>(url: string, config?: RequestConfig) => request<T>(url, { ...config, method: 'DELETE' }),
};

