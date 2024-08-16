/**
 * Utilitário de Rate Limiting para proteger APIs
 */

import { logRateLimitHit } from './security-logger';

// Interfaces
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface ViewAbuseEntry {
    timestamps: number[];
    blockedUntil: number;
}

interface ViewSuspiciousEntry {
    count: number;
    lastHit: number;
}

interface RateLimitConfig {
    requests: number;
    window: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter: number;
}

interface RateLimitStats {
    totalEntries: number;
    activeEntries: number;
    expiredEntries: number;
    topEndpoints: Record<string, number>;
    topIPs: Record<string, number>;
    averageRequestsPerEntry: number;
    totalRequests: number;
    limits: Record<string, RateLimitConfig>;
}

// Armazenamento em memória para rate limiting (em produção, usar Redis)
const requests = new Map<string, RateLimitEntry>();

// Armazenamento para rastreador de abuso de visualizações (anti-F5)
const viewAbuseTrackers = new Map<string, ViewAbuseEntry>();
const viewSuspiciousTrackers = new Map<string, ViewSuspiciousEntry>();

const ABUSE_INTERVAL_MS = 2500;
const ABUSE_MAX_HITS = 3;
const ABUSE_BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueio

const VIEW_COOLDOWN_MS = 10000; // 10 segundos entre views legítimas
const VIEW_MAX_SUSPICIOUS_HITS = 3;

// Configurações de rate limiting por endpoint
const RATE_LIMITS: Record<string, RateLimitConfig> = {
    default: { requests: 100, window: 15 * 60 * 1000 },
    auth: { requests: 10, window: 15 * 60 * 1000 },
    upload: { requests: 20, window: 60 * 1000 },
    admin: { requests: 50, window: 60 * 1000 },
    comments: { requests: 60, window: 60 * 1000 },
    chapters: { requests: 30, window: 60 * 60 * 1000 }
};

/**
 * Verifica se uma requisição deve ser limitada
 */
export function checkRateLimit(identifier: string, endpoint: string = 'default'): RateLimitResult {
    const now = Date.now();
    const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;

    // Only cleanup occasionally to avoid overhead
    if (Math.random() < 0.05) {
        cleanupExpiredEntries(now);
    }

    if (!requests.has(identifier)) {
        requests.set(identifier, {
            count: 0,
            resetTime: now + limit.window
        });
    }

    const entry = requests.get(identifier)!;

    if (now >= entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + limit.window;
    }

    if (entry.count >= limit.requests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        };
    }

    entry.count++;

    return {
        allowed: true,
        remaining: limit.requests - entry.count,
        resetTime: entry.resetTime,
        retryAfter: 0
    };
}

/**
 * Middleware de rate limiting para Next.js API routes
 */
export function rateLimitMiddleware(request: Request, endpoint: string = 'default'): Response | null {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
        request.headers.get('x-real-ip') ||
        'unknown';

    const identifier = `${ip}:${endpoint}`;
    const result = checkRateLimit(identifier, endpoint);

    if (!result.allowed) {
        const entry = requests.get(identifier);
        logRateLimitHit(endpoint, entry?.count || 0, request);

        return new Response(
            JSON.stringify({
                error: 'Muitas requisições. Tente novamente mais tarde.',
                retryAfter: result.retryAfter
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': String(RATE_LIMITS[endpoint]?.requests || RATE_LIMITS.default.requests),
                    'X-RateLimit-Remaining': String(result.remaining),
                    'X-RateLimit-Reset': String(result.resetTime),
                    'Retry-After': String(result.retryAfter)
                }
            }
        );
    }

    return null;
}


/**
 * Lógica detalhada de abuso de visualizações (F5) conforme política do usuário.
 * Retorna o status de abuso e o contador de hits suspeitos.
 */
export function checkViewAbuseDetailed(request: Request, contentId: string): { 
    isAbuse: boolean; 
    suspiciousCount: number;
    isPenalty: boolean;
} {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
        request.headers.get('x-real-ip') ||
        'unknown';
        
    const identifier = `${ip}:${contentId}`;
    const now = Date.now();
    
    if (!viewSuspiciousTrackers.has(identifier)) {
        viewSuspiciousTrackers.set(identifier, { count: 0, lastHit: now });
        return { isAbuse: false, suspiciousCount: 0, isPenalty: false };
    }

    const entry = viewSuspiciousTrackers.get(identifier)!;
    const timeDiff = now - entry.lastHit;
    
    // ✅ SEGURANÇA: Se o intervalo for MENOR que 2 segundos, ignoramos o hit para fins de abuso.
    // Isso evita falsos positivos causados pelo React Strict Mode (que roda 2x) ou re-renders rápidos.
    if (timeDiff < 2000) {
        return { isAbuse: false, suspiciousCount: entry.count, isPenalty: false };
    }

    // Se passaram mais de 60 segundos, resetamos o contador de suspeitas para dar uma "segunda chance"
    if (timeDiff > 60000) {
        entry.count = 0;
        entry.lastHit = now;
        return { isAbuse: false, suspiciousCount: 0, isPenalty: false };
    }

    // Se o intervalo for menor que 10 segundos (mas maior que 2s), é um hit suspeito (F5)
    if (timeDiff < VIEW_COOLDOWN_MS) {
        entry.count += 1;
        entry.lastHit = now;

        // Aumentado para 4 hits suspeitos antes do alerta para ser mais tolerante
        if (entry.count >= 4 && entry.count < 6) {
            return { isAbuse: true, suspiciousCount: entry.count, isPenalty: false };
        }
        
        // Se continuou após o alerta repetidamente, é penalidade
        if (entry.count >= 6) {
            return { isAbuse: true, suspiciousCount: entry.count, isPenalty: true };
        }
    } else {
        // Hit legítimo (mais de 10s se passaram)
        entry.lastHit = now;
        // Reduzimos o contador de suspeitas gradualmente para recompensar bom comportamento
        if (entry.count > 0) entry.count--;
    }

    return { isAbuse: false, suspiciousCount: entry.count, isPenalty: false };
}

/**
 * Adiciona headers de rate limit à resposta
 */
export function addRateLimitHeaders(
    response: Response,
    rateLimitResult: RateLimitResult,
    endpoint: string = 'default'
): Response {
    const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;

    response.headers.set('X-RateLimit-Limit', String(limit.requests));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));

    return response;
}

/**
 * Remove entradas expiradas do cache
 */
function cleanupExpiredEntries(now: number): void {
    for (const [key, entry] of requests.entries()) {
        if (now >= entry.resetTime) {
            requests.delete(key);
        }
    }

    if (requests.size > 10000) {
        const entries = Array.from(requests.entries());
        entries.sort((a, b) => a[1].resetTime - b[1].resetTime);

        const toRemove = Math.floor(entries.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
            requests.delete(entries[i][0]);
        }
    }

    // Limpar view trackers expirados
    for (const [key, entry] of viewAbuseTrackers.entries()) {
        const lastTimestamp = entry.timestamps[entry.timestamps.length - 1] || 0;
        if (entry.blockedUntil < now && (now - lastTimestamp > ABUSE_BLOCK_DURATION_MS)) {
            viewAbuseTrackers.delete(key);
        }
    }

    // Limpar rastreadores de suspeitas antigos
    for (const [key, entry] of viewSuspiciousTrackers.entries()) {
        if (now - entry.lastHit > 5 * 60 * 1000) { // 5 minutos sem atividade
            viewSuspiciousTrackers.delete(key);
        }
    }
}

/**
 * Reseta rate limit para um identificador específico
 */
export function resetRateLimit(identifier: string): void {
    requests.delete(identifier);
}

/**
 * Obtém estatísticas de rate limiting
 */
export function getRateLimitStats(): RateLimitStats {
    const now = Date.now();
    const stats: RateLimitStats = {
        totalEntries: requests.size,
        activeEntries: 0,
        expiredEntries: 0,
        topEndpoints: {},
        topIPs: {},
        averageRequestsPerEntry: 0,
        totalRequests: 0,
        limits: RATE_LIMITS
    };

    for (const [key, entry] of requests.entries()) {
        if (now <= entry.resetTime) {
            stats.activeEntries++;

            const [ip, endpoint] = key.split(':');

            stats.topEndpoints[endpoint] = (stats.topEndpoints[endpoint] || 0) + entry.count;
            stats.topIPs[ip] = (stats.topIPs[ip] || 0) + entry.count;
            stats.totalRequests += entry.count;
        } else {
            stats.expiredEntries++;
        }
    }

    if (stats.activeEntries > 0) {
        stats.averageRequestsPerEntry = Math.round(stats.totalRequests / stats.activeEntries);
    }

    stats.topEndpoints = Object.entries(stats.topEndpoints)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    stats.topIPs = Object.entries(stats.topIPs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    return stats;
}
