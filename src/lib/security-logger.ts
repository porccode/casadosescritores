/**
 * Sistema de Logs de Segurança
 * Monitora e registra eventos críticos de segurança
 */

// Tipos de eventos de segurança
export const SECURITY_EVENTS = {
    AUTH_FAILURE: 'AUTH_FAILURE',
    AUTH_SUCCESS: 'AUTH_SUCCESS',
    ADMIN_ACCESS: 'ADMIN_ACCESS',
    RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
    UPLOAD_ATTEMPT: 'UPLOAD_ATTEMPT',
    UPLOAD_BLOCKED: 'UPLOAD_BLOCKED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT',
    PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
    MALICIOUS_INPUT: 'MALICIOUS_INPUT'
} as const;

export type SecurityEventType = typeof SECURITY_EVENTS[keyof typeof SECURITY_EVENTS];

// Níveis de severidade
export const SEVERITY_LEVELS = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
} as const;

export type SeverityLevel = typeof SEVERITY_LEVELS[keyof typeof SEVERITY_LEVELS];

// Interfaces
interface RequestInfo {
    ip: string;
    userAgent: string;
    url: string;
    method: string;
    referer: string;
}

interface LogEntry {
    timestamp: string;
    event: SecurityEventType;
    severity: SeverityLevel;
    details: Record<string, unknown>;
    request: RequestInfo | Record<string, never>;
    sessionId: string;
}

interface SecurityStats {
    timeframe: string;
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<SeverityLevel, number>;
    eventsByIp: Record<string, number>;
    topIPs: string[];
    recentEvents: LogEntry[];
    recommendations: string[];
}

const MAX_STORED_SECURITY_EVENTS = 1000;
const securityEventBuffer: LogEntry[] = [];

import { createAdminSupabaseClient } from './supabase-admin';

/**
 * Registra evento de segurança
 */
export async function logSecurityEvent(
    event: SecurityEventType,
    severity: SeverityLevel,
    details: Record<string, unknown>,
    request: Request | null = null
): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Obter informações da requisição se disponível
    let requestInfo: RequestInfo | Record<string, never> = {};
    if (request) {
        requestInfo = {
            ip: getClientIP(request),
            userAgent: request.headers.get('user-agent') || 'unknown',
            url: request.url,
            method: request.method,
            referer: request.headers.get('referer') || 'none'
        };
    }

    const logEntry: LogEntry = {
        timestamp,
        event,
        severity,
        details,
        request: requestInfo,
        sessionId: generateSessionId()
    };

    // 1. Manter no buffer em memória para acesso rápido e fallback
    securityEventBuffer.push(logEntry);
    if (securityEventBuffer.length > MAX_STORED_SECURITY_EVENTS) {
        securityEventBuffer.splice(0, securityEventBuffer.length - MAX_STORED_SECURITY_EVENTS);
    }

    // 2. Persistir no Banco de Dados (Supabase)
    try {
        const supabaseAdmin = createAdminSupabaseClient();
        await (supabaseAdmin as any).from('security_logs').insert({
            event,
            severity,
            details,
            request_info: requestInfo,
            session_id: logEntry.sessionId,
            created_at: timestamp
        });
    } catch (dbError) {
        console.error('❌ [SECURITY] Failed to persist log to DB:', dbError);
    }

    // Log estruturado para diferentes ambientes
    if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify({
            type: 'SECURITY_EVENT',
            ...logEntry
        }));
    } else {
        console.warn(`🚨 [SECURITY] ${severity} - ${event}`, {
            timestamp,
            details,
            request: requestInfo
        });
    }

    // Em produção, aqui você enviaria para um serviço de monitoramento
    if (process.env.NODE_ENV === 'production' && severity === SEVERITY_LEVELS.CRITICAL) {
        sendCriticalAlert(logEntry);
    }
}

/**
 * Log específico para tentativas de autenticação
 */
export function logAuthAttempt(
    success: boolean,
    userId: string | null,
    email: string | null,
    request: Request
): void {
    const event = success ? SECURITY_EVENTS.AUTH_SUCCESS : SECURITY_EVENTS.AUTH_FAILURE;
    const severity = success ? SEVERITY_LEVELS.LOW : SEVERITY_LEVELS.MEDIUM;
    
    logSecurityEvent(event, severity, {
        userId: userId || 'unknown',
        email: email || 'unknown',
        success
    }, request);
}

/**
 * Log para acesso administrativo
 */
export function logAdminAction(
    adminId: string,
    action: string,
    targetId: string | null,
    request: Request
): void {
    logSecurityEvent(SECURITY_EVENTS.ADMIN_ACCESS, SEVERITY_LEVELS.HIGH, {
        adminId,
        action,
        targetId: targetId || 'none'
    }, request);
}

/**
 * Log para rate limiting
 */
export function logRateLimitHit(
    endpoint: string,
    attempts: number,
    request: Request
): void {
    const severity = attempts > 50 ? SEVERITY_LEVELS.HIGH : SEVERITY_LEVELS.MEDIUM;
    
    logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_HIT, severity, {
        endpoint,
        attempts,
        possibleAttack: attempts > 100
    }, request);
}

/**
 * Log para uploads suspeitos
 */
export function logSuspiciousUpload(
    userId: string,
    fileName: string,
    reason: string,
    request: Request
): void {
    logSecurityEvent(SECURITY_EVENTS.UPLOAD_BLOCKED, SEVERITY_LEVELS.HIGH, {
        userId,
        fileName,
        reason,
        potentialMalware: reason.includes('malware') || reason.includes('virus')
    }, request);
}

/**
 * Log para entrada maliciosa detectada
 */
export function logMaliciousInput(
    inputType: string,
    maliciousContent: string,
    userId: string | null,
    request: Request | null
): void {
    const sanitizedContent = maliciousContent
        .replace(/<script/gi, '&lt;script')
        .replace(/javascript:/gi, 'javascript-blocked:')
        .substring(0, 200);

    logSecurityEvent(SECURITY_EVENTS.MALICIOUS_INPUT, SEVERITY_LEVELS.HIGH, {
        inputType,
        sanitizedContent,
        userId: userId || 'anonymous',
        possibleXSS: maliciousContent.includes('<script') || maliciousContent.includes('javascript:'),
        possibleSQLi: maliciousContent.includes('UNION') || maliciousContent.includes('DROP TABLE')
    }, request);
}

/**
 * Log para tentativas de escalação de privilégios
 */
export function logPrivilegeEscalation(
    userId: string,
    attemptedAction: string,
    currentRole: string,
    request: Request
): void {
    logSecurityEvent(SECURITY_EVENTS.PRIVILEGE_ESCALATION, SEVERITY_LEVELS.CRITICAL, {
        userId,
        attemptedAction,
        currentRole,
        requiresImmedateAttention: true
    }, request);
}

/**
 * Obtém IP do cliente de forma segura
 */
function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP.trim();
    }
    
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP.trim();
    }
    
    return 'unknown';
}

/**
 * Gera ID de sessão único para correlacionar eventos
 */
function generateSessionId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Envia alerta crítico
 */
function sendCriticalAlert(logEntry: LogEntry): void {
    console.error('🚨 ALERTA CRÍTICO DE SEGURANÇA 🚨', {
        event: logEntry.event,
        timestamp: logEntry.timestamp,
        details: logEntry.details
    });
}

/**
 * Obtém estatísticas de eventos de segurança.
 * Atualmente lê da memória (cache rápido) mas deve ser expandido para ler do banco
 * para períodos longos ou auditoria completa.
 */
export async function getSecurityStats(hours: number = 24): Promise<SecurityStats> {
    // 1. Tentar ler do banco de dados primeiro se possível
    try {
        const supabaseAdmin = createAdminSupabaseClient();
        const cutoffDate = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
        
        const { data: logs, error } = await (supabaseAdmin as any)
            .from('security_logs')
            .select('*')
            .gte('created_at', cutoffDate)
            .order('created_at', { ascending: false });

        if (!error && logs) {
            const dbEvents: LogEntry[] = logs.map((log: any) => ({
                timestamp: log.created_at,
                event: log.event as SecurityEventType,
                severity: log.severity as SeverityLevel,
                details: log.details,
                request: log.request_info,
                sessionId: log.session_id
            }));

            return calculateStatsFromEntries(dbEvents, hours);
        }
    } catch (err) {
        console.error('Failed to fetch security stats from DB, falling back to memory:', err);
    }

    // 2. Fallback para buffer em memória
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentEvents = securityEventBuffer
        .filter((entry) => new Date(entry.timestamp).getTime() >= cutoffTime)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return calculateStatsFromEntries(recentEvents, hours);
}

/**
 * Função auxiliar para calcular estatísticas a partir de uma lista de entradas
 */
function calculateStatsFromEntries(entries: LogEntry[], hours: number): SecurityStats {
    const eventsByType: Record<string, number> = {};
    const eventsByIp: Record<string, number> = {};
    const eventsBySeverity: Record<SeverityLevel, number> = {
        [SEVERITY_LEVELS.LOW]: 0,
        [SEVERITY_LEVELS.MEDIUM]: 0,
        [SEVERITY_LEVELS.HIGH]: 0,
        [SEVERITY_LEVELS.CRITICAL]: 0
    };

    for (const entry of entries) {
        eventsByType[entry.event] = (eventsByType[entry.event] || 0) + 1;
        eventsBySeverity[entry.severity] += 1;

        const ip = 'ip' in entry.request ? entry.request.ip || 'unknown' : 'unknown';
        eventsByIp[ip] = (eventsByIp[ip] || 0) + 1;
    }

    const topIPs = Object.entries(eventsByIp)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5)
        .map(([ip]) => ip);

    return {
        timeframe: `${hours} hours`,
        totalEvents: entries.length,
        eventsByType,
        eventsBySeverity,
        eventsByIp,
        topIPs,
        recentEvents: entries.slice(0, 20),
        recommendations: []
    };
}
