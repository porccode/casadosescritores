
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock do next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '/',
}));

// Mock do ResizeObserver (necessário para alguns componentes de UI)
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock do scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
