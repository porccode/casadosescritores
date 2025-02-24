import { describe, it, expect, vi } from 'vitest';
import {
    escapeHtml,
    sanitizeHTML,
    sanitizeText,
    sanitizeComment,
    safeHighlightText,
    validateAndSanitizeForm,
} from '../sanitize';

// Mock security-logger to avoid side effects
vi.mock('../security-logger', () => ({
    logMaliciousInput: vi.fn(),
}));

describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
    });

    it('should escape ampersand', () => {
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape single quotes', () => {
        expect(escapeHtml("it's")).toBe('it&#39;s');
    });

    it('should handle null input', () => {
        expect(escapeHtml(null)).toBe('');
    });

    it('should handle undefined input', () => {
        expect(escapeHtml(undefined)).toBe('');
    });

    it('should handle empty string', () => {
        expect(escapeHtml('')).toBe('');
    });
});

describe('sanitizeText', () => {
    it('should remove angle brackets', () => {
        // sanitizeText removes < and > characters, not full HTML tags
        expect(sanitizeText('<p>Hello</p>')).toBe('pHello/p');
    });

    it('should trim whitespace', () => {
        expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('should limit text length', () => {
        const longText = 'a'.repeat(2000);
        expect(sanitizeText(longText, 100).length).toBeLessThanOrEqual(100);
    });

    it('should handle null input', () => {
        expect(sanitizeText(null)).toBe('');
    });

    it('should handle undefined input', () => {
        expect(sanitizeText(undefined)).toBe('');
    });

    it('should remove script tags and content', () => {
        expect(sanitizeText('<script>alert("xss")</script>Hello')).not.toContain('script');
    });
});

describe('sanitizeComment', () => {
    it('should remove dangerous HTML', () => {
        const result = sanitizeComment('<script>alert("xss")</script>Nice story!');
        expect(result).not.toContain('<script>');
        expect(result).toContain('Nice story!');
    });

    it('should handle null input', () => {
        expect(sanitizeComment(null)).toBe('');
    });

    it('should handle undefined input', () => {
        expect(sanitizeComment(undefined)).toBe('');
    });

    it('should preserve safe text content', () => {
        expect(sanitizeComment('Great chapter! Loved it.')).toBe('Great chapter! Loved it.');
    });
});

describe('sanitizeHTML', () => {
    it('should allow safe tags', () => {
        const html = '<p>Hello <strong>world</strong></p>';
        const result = sanitizeHTML(html);
        expect(result).toContain('<p>');
        expect(result).toContain('<strong>');
    });

    it('should remove script tags', () => {
        const html = '<p>Hello</p><script>alert("xss")</script>';
        const result = sanitizeHTML(html);
        expect(result).not.toContain('<script>');
    });

    it('should remove onclick attributes', () => {
        const html = '<p onclick="alert(1)">Click me</p>';
        const result = sanitizeHTML(html);
        expect(result).not.toContain('onclick');
    });

    it('should remove javascript: URLs', () => {
        const html = '<a href="javascript:alert(1)">Click</a>';
        const result = sanitizeHTML(html);
        expect(result).not.toContain('javascript:');
    });

    it('should handle non-string input', () => {
        expect(sanitizeHTML(null)).toBe(null);
        expect(sanitizeHTML(undefined)).toBe(undefined);
        expect(sanitizeHTML(123)).toBe(123);
    });

    it('should allow safe href attributes', () => {
        const html = '<a href="https://example.com">Link</a>';
        const result = sanitizeHTML(html);
        expect(result).toContain('href="https://example.com"');
    });
});

// Note: isValidURL, isValidEmail, and escapeAttribute are private functions
// They are tested indirectly through validateAndSanitizeForm and sanitizeHTML

describe('safeHighlightText', () => {
    it('should highlight matching text', () => {
        const result = safeHighlightText('Hello World', 'World');
        expect(result).toContain('<mark');
        expect(result).toContain('World');
    });

    it('should handle null text', () => {
        expect(safeHighlightText(null, 'query')).toBe('');
    });

    it('should handle null query', () => {
        expect(safeHighlightText('Hello', null)).toBe('Hello');
    });

    it('should handle empty query', () => {
        expect(safeHighlightText('Hello', '')).toBe('Hello');
    });

    it('should escape HTML in text before highlighting', () => {
        const result = safeHighlightText('<script>test</script>', 'test');
        expect(result).not.toContain('<script>');
    });
});

describe('validateAndSanitizeForm', () => {
    it('should validate required fields', () => {
        const result = validateAndSanitizeForm(
            { name: '' },
            { name: { type: 'text', required: true } }
        );
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should sanitize text fields', () => {
        const result = validateAndSanitizeForm(
            { name: '<script>test</script>John' },
            { name: { type: 'text', required: true } }
        );
        expect(result.sanitizedData.name).not.toContain('<script>');
    });

    it('should validate email format', () => {
        const result = validateAndSanitizeForm(
            { email: 'not-an-email' },
            { email: { type: 'email', required: true } }
        );
        expect(result.isValid).toBe(false);
    });

    it('should accept valid email', () => {
        const result = validateAndSanitizeForm(
            { email: 'user@example.com' },
            { email: { type: 'email', required: true } }
        );
        expect(result.isValid).toBe(true);
    });

    it('should validate URL format', () => {
        const result = validateAndSanitizeForm(
            { website: 'javascript:alert(1)' },
            { website: { type: 'url', required: true } }
        );
        expect(result.isValid).toBe(false);
    });

    it('should enforce maxLength', () => {
        const result = validateAndSanitizeForm(
            { bio: 'a'.repeat(1000) },
            { bio: { type: 'text', maxLength: 100 } }
        );
        expect(result.isValid).toBe(false);
    });

    it('should enforce minLength', () => {
        const result = validateAndSanitizeForm(
            { password: 'ab' },
            { password: { type: 'text', minLength: 8 } }
        );
        expect(result.isValid).toBe(false);
    });

    it('should use default value for missing optional field', () => {
        const result = validateAndSanitizeForm(
            {},
            { role: { type: 'text', default: 'user' } }
        );
        expect(result.sanitizedData.role).toBe('user');
    });
});
