/**
 * Sistema de proteção CSRF
 */

import { logSecurityEvent, SECURITY_EVENTS, SEVERITY_LEVELS } from './security-logger';

/**
 * Verifica o Origin header para validar requisições
 */
export function validateOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    const allowedOrigins: string[] = [
        'https://casadosescritores.com.br',
        'https://www.casadosescritores.com.br',
        'https://casa-dos-escritores.com.br',
        'https://www.casa-dos-escritores.com.br',
        'https://casa-dos-escritores.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];

    if (origin && allowedOrigins.some(o => o.toLowerCase() === origin.toLowerCase())) {
        return true;
    }

    if (!origin && referer) {
        try {
            const refererUrl = new URL(referer);
            const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`.toLowerCase();
            return allowedOrigins.some(o => o.toLowerCase() === refererOrigin);
        } catch {
            return false;
        }
    }

    return false;
}

/**
 * Middleware de proteção CSRF para operações sensíveis
 */
export function csrfProtection(request: Request, operation: string = 'general'): Response | null {
    const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    if (!protectedMethods.includes(request.method)) {
        return null;
    }

    // Permitir Server Actions do Next.js (eles possuem proteção CSRF própria)
    if (request.headers.get('next-action')) {
        return null;
    }

    if (!validateOrigin(request)) {
        logSecurityEvent(
            SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
            SEVERITY_LEVELS.HIGH,
            {
                operation,
                reason: 'Invalid origin header',
                origin: request.headers.get('origin'),
                referer: request.headers.get('referer'),
                userAgent: request.headers.get('user-agent')
            },
            request
        );

        return new Response(
            JSON.stringify({
                error: 'Requisição bloqueada por proteção CSRF'
            }),
            {
                status: 403,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type');

        const allowedContentTypes = [
            'application/json',
            'multipart/form-data',
            'application/x-www-form-urlencoded'
        ];

        if (!contentType || !allowedContentTypes.some(type => contentType.includes(type))) {
            console.warn(`[CSRF] Blocked: Invalid content-type. Expected one of: ${allowedContentTypes.join(', ')}. Got: "${contentType}" on ${request.method} ${request.url}`);
            logSecurityEvent(
                SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
                SEVERITY_LEVELS.MEDIUM,
                {
                    operation,
                    reason: 'Invalid content-type',
                    contentType,
                    method: request.method,
                    url: request.url
                },
                request
            );

            return new Response(
                JSON.stringify({
                    error: 'Tipo de conteúdo não permitido'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    }

    return null;
}

/**
 * Adiciona headers de segurança para proteção CSRF
 */
export function addCSRFHeaders(response: Response): Response {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}
