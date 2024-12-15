import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { NextRequest } from 'next/server';

// Mocks
vi.mock("@/lib/supabase-server", () => ({
    createServerSupabaseClient: vi.fn()
}));

vi.mock("@/lib/supabase-admin", () => ({
    createAdminSupabaseClient: vi.fn()
}));

vi.mock("@/lib/security-logger", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/security-logger")>();
    return {
        ...actual,
        logSecurityEvent: vi.fn(),
        logAdminAction: vi.fn(),
        logPrivilegeEscalation: vi.fn(),
    };
});

describe('Admin Update User API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockRequest = (body: any) => {
        return new NextRequest('http://localhost:3000/api/admin/update-user', {
            method: 'POST',
            headers: {
                'origin': 'http://localhost:3000',
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    };

    it('should promote a user to admin and sync is_admin flag', async () => {
        // Mock Admin session
        const mockAuthSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
            },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ 
                            data: { role: 'admin', is_admin: true }, 
                            error: null 
                        })
                    })
                })
            })
        };
        (createServerSupabaseClient as any).mockResolvedValue(mockAuthSupabase);

        // Mock Admin client for updates
        const mockUpdateAuth = vi.fn().mockResolvedValue({ error: null });
        const mockUpdateProfile = vi.fn().mockResolvedValue({ error: null });

        const mockAdminSupabase = {
            auth: {
                admin: {
                    updateUserById: mockUpdateAuth
                }
            },
            from: vi.fn().mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: mockUpdateProfile
                })
            })
        };
        (createAdminSupabaseClient as any).mockReturnValue(mockAdminSupabase);

        const request = createMockRequest({
            userId: 'target-user-id',
            email: 'new@example.com',
            username: 'newname',
            role: 'admin'
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);

        // Verify profile update includes both role and is_admin
        expect(mockAdminSupabase.from).toHaveBeenCalledWith('profiles');
        const updateCall = mockAdminSupabase.from('profiles').update as any;
        expect(updateCall).toHaveBeenCalledWith(expect.objectContaining({
            role: 'admin',
            is_admin: true
        }));
    });

    it('should demote an admin to user and sync is_admin flag', async () => {
        const mockAuthSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
            },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ 
                            data: { role: 'admin', is_admin: true }, 
                            error: null 
                        })
                    })
                })
            })
        };
        (createServerSupabaseClient as any).mockResolvedValue(mockAuthSupabase);

        const mockUpdateProfile = vi.fn().mockResolvedValue({ error: null });
        const mockAdminSupabase = {
            auth: {
                admin: {
                    updateUserById: vi.fn().mockResolvedValue({ error: null })
                }
            },
            from: vi.fn().mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: mockUpdateProfile
                })
            })
        };
        (createAdminSupabaseClient as any).mockReturnValue(mockAdminSupabase);

        const request = createMockRequest({
            userId: 'target-user-id',
            email: 'user@example.com',
            username: 'regularuser',
            role: 'user'
        });

        const response = await POST(request);
        expect(response.status).toBe(200);

        // Verify profile update includes both role and is_admin=false
        const updateCall = mockAdminSupabase.from('profiles').update as any;
        expect(updateCall).toHaveBeenCalledWith(expect.objectContaining({
            role: 'user',
            is_admin: false
        }));
    });

    it('should fail if role is invalid', async () => {
        const mockAuthSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
            },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { role: 'admin', is_admin: true }, error: null })
                    })
                })
            })
        };
        (createServerSupabaseClient as any).mockResolvedValue(mockAuthSupabase);

        const request = createMockRequest({
            userId: 'target-user-id',
            role: 'super-hacker-role'
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('Role inválido');
    });
});
