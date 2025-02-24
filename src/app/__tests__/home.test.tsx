
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Page from '../page';

vi.mock('next/dynamic', () => ({
    default: (importer: () => Promise<any>) => {
        let ResolvedComp: any = null;
        const promise = importer();
        if (promise && typeof promise.then === 'function') {
            promise.then((mod: any) => {
                ResolvedComp = mod.default || mod;
            });
        }
        return function DynamicComponent(props: any) {
            return ResolvedComp ? <ResolvedComp {...props} /> : null;
        };
    }
}));

// Mock dos componentes filhos complexos
vi.mock('@/components/RankedSeriesList', () => ({
    __esModule: true,
    default: () => <div data-testid="ranked-series">Ranked Series</div>
}));

vi.mock('@/components/RecentContentList', () => ({
    __esModule: true,
    default: () => <div data-testid="recent-content">Recent Content</div>
}));

vi.mock('@/components/MostCommentedList', () => ({
    __esModule: true,
    default: () => <div data-testid="most-commented">Most Commented</div>
}));

vi.mock('@/components/UserRankingList', () => ({
    __esModule: true,
    default: () => <div data-testid="user-ranking">User Ranking</div>
}));

vi.mock('@/components/WelcomeBack', () => ({
    __esModule: true,
    default: () => <div data-testid="welcome-back">Welcome Back</div>
}));

function createQueryResult(data: unknown = [], error: unknown = null) {
    const promiseResult = Promise.resolve({ data, error });

    const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        neq: vi.fn(() => query),
        gt: vi.fn(() => query),
        is: vi.fn(() => query),
        not: vi.fn(() => query),
        lte: vi.fn(() => query),
        order: vi.fn(() => query),
        limit: vi.fn(() => query),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        then: promiseResult.then.bind(promiseResult),
    };

    return query;
}

// Mock do Supabase-server
vi.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient: () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
        from: vi.fn(() => createQueryResult()),
    }),
}));

// Mock do Supabase-admin
vi.mock('@/lib/supabase-admin', () => ({
    createAdminSupabaseClient: () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
        from: vi.fn(() => createQueryResult()),
    }),
}));

describe('Home Page', () => {
    it('should render the main sections successfully', async () => {
        const Result = await Page();
        render(Result);

        expect(screen.getByTestId('welcome-back')).toBeInTheDocument();
        expect(screen.getAllByTestId('ranked-series').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('recent-content').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('most-commented').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('user-ranking').length).toBeGreaterThan(0);
    });
});
