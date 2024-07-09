import { createHash } from "crypto";

/**
 * Gera um hash SHA-256 do endereço IP do visitante.
 * Nunca armazenamos o IP bruto no banco de dados — apenas o hash.
 * 
 * Usa um salt do ambiente para dificultar ataques de rainbow table,
 * garantindo que mesmo com acesso ao banco, os IPs não possam ser
 * revertidos facilmente.
 */
export function hashIP(ip: string): string {
    const salt = process.env.IP_HASH_SALT || "casadosescritores-view-salt-2024";
    return createHash("sha256")
        .update(`${salt}:${ip}`)
        .digest("hex")
        .substring(0, 32); // Primeiros 32 chars são suficientes para dedup
}

/**
 * Extrai o IP real do request, considerando headers de proxy/CDN.
 * Ordem de prioridade:
 * 1. x-forwarded-for (primeiro IP da lista = IP do cliente)
 * 2. x-real-ip 
 * 3. Fallback para "unknown"
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        // x-forwarded-for pode conter múltiplos IPs: "client, proxy1, proxy2"
        const clientIP = forwarded.split(",")[0]?.trim();
        if (clientIP) return clientIP;
    }

    const realIP = request.headers.get("x-real-ip");
    if (realIP) return realIP;

    return "unknown";
}
