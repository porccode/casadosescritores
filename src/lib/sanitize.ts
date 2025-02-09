/**
 * Utilitários de sanitização server-side para proteger contra XSS
 */

import { logMaliciousInput } from './security-logger';

// Tags HTML permitidas para conteúdo de histórias
const ALLOWED_TAGS: string[] = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 'i',
    'ul', 'ol', 'li', 'blockquote',
    'a', 'img', 'pre', 'code',
    'div', 'span', 'iframe', 'mark'
];

// Atributos permitidos por tag
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'data-width', 'data-alignment', 'style'],
    'div': ['class', 'data-align', 'data-lexical-youtube', 'data-alignment', 'data-width', 'style'],
    'iframe': ['src', 'title', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'style'],
    'span': ['class', 'style'],
    'p': ['class', 'data-align', 'style'],
    'h1': ['class'], 'h2': ['class'], 'h3': ['class'],
    'h4': ['class'], 'h5': ['class'], 'h6': ['class'],
    'blockquote': ['class'],
    'pre': ['class'],
    'code': ['class'],
    'mark': ['class', 'style']
};

// Protocolos permitidos para links
const ALLOWED_PROTOCOLS: string[] = ['http:', 'https:', 'mailto:'];

// Interfaces
interface SanitizeOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    userId?: string;
    request?: Request;
    htmlOptions?: SanitizeOptions;
}

interface ValidationRule {
    type: 'text' | 'html' | 'comment' | 'email' | 'url';
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    default?: string;
    htmlOptions?: SanitizeOptions;
}

interface ValidationResult {
    isValid: boolean;
    sanitizedData: Record<string, any>;
    errors: string[];
}

/**
 * Destaca termo de busca de forma segura contra XSS
 */
export function safeHighlightText(text: string | null | undefined, query: string | null | undefined): string {
    if (!text || !query || typeof text !== 'string' || typeof query !== 'string') {
        return escapeHtml(text || '');
    }

    const escapedText = escapeHtml(text);
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeQuery})`, "gi");

    return escapedText.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export function escapeHtml(text: string | null | undefined): string {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const htmlEscapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Sanitiza HTML removendo tags e atributos perigosos
 */
export function sanitizeHTML(html: any, options: SanitizeOptions = {}): any {
    if (typeof html !== 'string') {
        return html;
    }

    const allowedTags = options.allowedTags || ALLOWED_TAGS;
    const allowedAttributes = options.allowedAttributes || ALLOWED_ATTRIBUTES;

    // Detectar conteúdo malicioso antes da sanitização
    const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i,
        /expression\s*\(/i,
        /<object/i,
        /<embed/i
    ];

    const isMalicious = maliciousPatterns.some(pattern => pattern.test(html));
    if (isMalicious && options.userId) {
        logMaliciousInput('html_content', html, options.userId, options.request || null);
    }

    // Remover scripts e outros elementos perigosos
    let sanitized = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:(?!image\/)/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');

    // Validar e limpar tags
    sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tagName) => {
        const tag = tagName.toLowerCase();

        if (!allowedTags.includes(tag)) {
            return '';
        }

        if (match.startsWith('</')) {
            return `</${tag}>`;
        }

        const allowedAttrs = allowedAttributes[tag] || [];
        const cleanedMatch = match.replace(/\s+([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/g, (attrMatch, attrName, attrValue) => {
            const attr = attrName.toLowerCase();

            if (!allowedAttrs.includes(attr)) {
                return '';
            }

            if (attr === 'href' || attr === 'src') {
                if (!isValidURL(attrValue)) {
                    return '';
                }
            }

            return ` ${attr}="${escapeAttribute(attrValue)}"`;
        });

        return cleanedMatch;
    });

    return sanitized.trim();
}

/**
 * Sanitiza texto simples removendo caracteres perigosos
 */
export function sanitizeText(text: string | null | undefined, maxLength: number = 1000): string {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .trim()
        .substring(0, maxLength);
}

/**
 * Sanitiza entrada de comentário
 */
export function sanitizeComment(comment: string | null | undefined): string {
    if (!comment || typeof comment !== 'string') {
        return '';
    }

    const commentOptions: SanitizeOptions = {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'a'],
        allowedAttributes: {
            'a': ['href', 'title']
        }
    };

    return sanitizeHTML(comment, commentOptions);
}

/**
 * Valida se uma URL é segura
 */
function isValidURL(url: string | null | undefined): boolean {
    if (!url || typeof url !== 'string') {
        return false;
    }

    try {
        const urlObj = new URL(url);

        if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
            return false;
        }

        const suspiciousPatterns = [
            /javascript:/i,
            /vbscript:/i,
            /data:/i,
            /file:/i,
            /ftp:/i
        ];

        return !suspiciousPatterns.some(pattern => pattern.test(url));
    } catch {
        return false;
    }
}

/**
 * Escapa atributos HTML
 */
function escapeAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Valida e sanitiza dados de entrada de formulário
 */
export function validateAndSanitizeForm(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
): ValidationResult {
    const sanitizedData: Record<string, any> = {};
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
        const value = data[field];

        if (rule.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
            errors.push(`Campo ${field} é obrigatório`);
            continue;
        }

        if (!value) {
            sanitizedData[field] = rule.default || '';
            continue;
        }

        if (typeof value === 'string' && rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${field} deve ter no máximo ${rule.maxLength} caracteres`);
        }

        switch (rule.type) {
            case 'text':
                sanitizedData[field] = sanitizeText(value);
                break;
            case 'html':
                sanitizedData[field] = sanitizeHTML(value, rule.htmlOptions);
                break;
            case 'comment':
                sanitizedData[field] = sanitizeComment(value);
                break;
            case 'email':
                sanitizedData[field] = sanitizeText(value, 255).toLowerCase();
                if (sanitizedData[field] && !isValidEmail(sanitizedData[field])) {
                    errors.push(`${field} deve ser um email válido`);
                }
                break;
            case 'url':
                sanitizedData[field] = sanitizeText(value, 240);
                if (sanitizedData[field] && !isValidURL(sanitizedData[field])) {
                    errors.push(`${field} deve ser uma URL válida`);
                }
                break;
            default:
                sanitizedData[field] = sanitizeText(value);
        }

        if (rule.minLength && typeof sanitizedData[field] === 'string' && sanitizedData[field].length < rule.minLength) {
            errors.push(`${field} deve ter pelo menos ${rule.minLength} caracteres`);
        }
    }

    return {
        isValid: errors.length === 0,
        sanitizedData,
        errors
    };
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
