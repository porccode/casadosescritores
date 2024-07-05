import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mocks do Next.js
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
    redirect: vi.fn(),
}));

// Mocks do Browser API
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
