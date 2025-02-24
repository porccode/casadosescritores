import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  extractIdFromSlug,
  formatDate,
  calculateReadingTime,
  createSummary,
} from '../utils';

describe('generateSlug', () => {
  it('should generate a slug from title and id', () => {
    expect(generateSlug('Hello World', '123')).toBe('hello-world-123');
  });

  it('should handle titles with accents', () => {
    expect(generateSlug('História de Amor', '456')).toBe('historia-de-amor-456');
  });

  it('should handle special characters', () => {
    expect(generateSlug('Test@#$%Content!', '789')).toBe('testcontent-789');
  });

  it('should handle empty title', () => {
    expect(generateSlug('', '123')).toBe('id-123');
  });

  it('should handle UUID as id', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(generateSlug('My Story', uuid)).toBe(`my-story-${uuid}`);
  });

  it('should limit slug length', () => {
    const longTitle = 'A'.repeat(100);
    const result = generateSlug(longTitle, '1');
    expect(result.length).toBeLessThanOrEqual(54); // 50 chars + '-' + id
  });
});

describe('extractIdFromSlug', () => {
  it('should extract numeric id from slug', () => {
    expect(extractIdFromSlug('hello-world-123')).toBe('123');
  });

  it('should return full UUID if slug is a UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(extractIdFromSlug(uuid)).toBe(uuid);
  });

  it('should extract UUID from slug', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(extractIdFromSlug(`my-story-${uuid}`)).toBe(uuid);
  });

  it('should return numeric id if slug is just a number', () => {
    expect(extractIdFromSlug('12345')).toBe('12345');
  });

  it('should handle null input', () => {
    expect(extractIdFromSlug(null)).toBeNull();
  });

  it('should handle empty string', () => {
    expect(extractIdFromSlug('')).toBeNull();
  });
});

describe('formatDate', () => {
  it('should format a valid date in Portuguese', () => {
    const result = formatDate('2025-01-15T10:30:00Z');
    expect(result).toContain('janeiro');
    expect(result).toContain('2025');
  });

  it('should return "Data desconhecida" for null', () => {
    expect(formatDate(null)).toBe('Data desconhecida');
  });

  it('should return "Data desconhecida" for undefined', () => {
    expect(formatDate(undefined)).toBe('Data desconhecida');
  });

  it('should return "Data inválida" for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('Data inválida');
  });
});

describe('calculateReadingTime', () => {
  it('should return 1 minute for short content', () => {
    expect(calculateReadingTime('<p>Hello world</p>')).toBe(1);
  });

  it('should calculate reading time for longer content', () => {
    const words = Array(600).fill('word').join(' ');
    const content = `<p>${words}</p>`;
    expect(calculateReadingTime(content)).toBe(3); // 600 words / 200 wpm
  });

  it('should strip HTML tags before counting', () => {
    const content = '<h1>Title</h1><p>Word1 <strong>Word2</strong> Word3</p>';
    expect(calculateReadingTime(content)).toBe(1);
  });

  it('should return 0 for empty content', () => {
    expect(calculateReadingTime('')).toBe(0);
  });
});

describe('createSummary', () => {
  it('should create a summary from HTML content', () => {
    const html = '<p>This is a test paragraph with some content.</p>';
    const result = createSummary(html, 20);
    expect(result).toBe('This is a test...');
  });

  it('should return full text if shorter than maxLength', () => {
    const html = '<p>Short text</p>';
    expect(createSummary(html, 150)).toBe('Short text');
  });

  it('should handle null input', () => {
    expect(createSummary(null)).toBe('');
  });

  it('should handle undefined input', () => {
    expect(createSummary(undefined)).toBe('');
  });

  it('should strip all HTML tags', () => {
    const html = '<h1>Title</h1><p><strong>Bold</strong> and <em>italic</em></p>';
    expect(createSummary(html, 50)).toBe('TitleBold and italic');
  });

  it('should use default maxLength of 150', () => {
    const longContent = '<p>' + 'A'.repeat(200) + '</p>';
    const result = createSummary(longContent);
    expect(result.length).toBeLessThanOrEqual(153); // 150 + '...'
  });
});
