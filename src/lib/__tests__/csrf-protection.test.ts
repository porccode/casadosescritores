import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateOrigin, csrfProtection, addCSRFHeaders } from '../csrf-protection';

// Mock security-logger to avoid side effects
vi.mock('../security-logger', () => ({
    logSecurityEvent: vi.fn(),
    SECURITY_EVENTS: {
        SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    },
    SEVERITY_LEVELS: {
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
    },
}));

describe('validateOrigin', () => {
    it('should accept localhost origin', () => {
        const request = new Request('http://localhost:3000/api/test', {
            headers: { origin: 'http://localhost:3000' },
        });
        expect(validateOrigin(request)).toBe(true);
    });

    it('should accept production origin', () => {
        const request = new Request('https://casadosescritores.com.br/api/test', {
            headers: { origin: 'https://casadosescritores.com.br' },
        });
        expect(validateOrigin(request)).toBe(true);
    });

    it('should accept www subdomain', () => {
        const request = new Request('https://www.casadosescritores.com.br/api/test', {
            headers: { origin: 'https://www.casadosescritores.com.br' },
        });
        expect(validateOrigin(request)).toBe(true);
    });

    it('should accept Vercel preview origin', () => {
        const request = new Request('https://casa-dos-escritores.vercel.app/api/test', {
            headers: { origin: 'https://casa-dos-escritores.vercel.app' },
        });
        expect(validateOrigin(request)).toBe(true);
    });

    it('should reject unknown origin', () => {
        const request = new Request('http://localhost:3000/api/test', {
            headers: { origin: 'https://malicious-site.com' },
        });
        expect(validateOrigin(request)).toBe(false);
    });

    it('should validate using referer when origin is missing', () => {
        const request = new Request('http://localhost:3000/api/test', {
            headers: { referer: 'http://localhost:3000/page' },
        });
        expect(validateOrigin(request)).toBe(true);
    });

    it('should reject invalid referer', () => {
        const request = new Request('http://localhost:3000/api/test', {
            headers: { referer: 'https://evil.com/page' },
        });
        expect(validateOrigin(request)).toBe(false);
    });

    // Note: Browsers always send origin in lowercase, so we don't test uppercase
});


describe('csrfProtection', () => {
    it('should return null for GET requests', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'GET',
        });
        expect(csrfProtection(request)).toBeNull();
    });

    it('should return null for valid POST request', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'POST',
            headers: {
                origin: 'http://localhost:3000',
                'content-type': 'application/json',
            },
        });
        expect(csrfProtection(request)).toBeNull();
    });

    it('should return null for Next.js server actions', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'POST',
            headers: {
                'next-action': 'true',
            },
        });
        expect(csrfProtection(request)).toBeNull();
    });

    it('should block POST with invalid origin', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'POST',
            headers: {
                origin: 'https://malicious-site.com',
                'content-type': 'application/json',
            },
        });
        const response = csrfProtection(request);
        expect(response).not.toBeNull();
        expect(response?.status).toBe(403);
    });

    it('should block PUT with invalid origin', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'PUT',
            headers: {
                origin: 'https://malicious-site.com',
                'content-type': 'application/json',
            },
        });
        const response = csrfProtection(request);
        expect(response).not.toBeNull();
        expect(response?.status).toBe(403);
    });

    it('should block DELETE with invalid origin', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'DELETE',
            headers: {
                origin: 'https://malicious-site.com',
            },
        });
        const response = csrfProtection(request);
        expect(response).not.toBeNull();
        expect(response?.status).toBe(403);
    });

    it('should block invalid content-type', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'POST',
            headers: {
                origin: 'http://localhost:3000',
                'content-type': 'text/plain',
            },
        });
        const response = csrfProtection(request);
        expect(response).not.toBeNull();
        expect(response?.status).toBe(400);
    });

    it('should accept multipart/form-data content-type', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'POST',
            headers: {
                origin: 'http://localhost:3000',
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
            },
        });
        expect(csrfProtection(request)).toBeNull();
    });

    it('should accept application/x-www-form-urlencoded', () => {
        const request = new Request('http://localhost:3000/api/test', {
            method: 'POST',
            headers: {
                origin: 'http://localhost:3000',
                'content-type': 'application/x-www-form-urlencoded',
            },
        });
        expect(csrfProtection(request)).toBeNull();
    });
});

describe('addCSRFHeaders', () => {
    it('should add X-Frame-Options header', () => {
        const response = new Response('test');
        const result = addCSRFHeaders(response);
        expect(result.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should add X-Content-Type-Options header', () => {
        const response = new Response('test');
        const result = addCSRFHeaders(response);
        expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should add Referrer-Policy header', () => {
        const response = new Response('test');
        const result = addCSRFHeaders(response);
        expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should return the same response object', () => {
        const response = new Response('test');
        const result = addCSRFHeaders(response);
        expect(result).toBe(response);
    });
});
