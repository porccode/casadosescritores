"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { PageLoading } from '@/components/ui/loading-states';
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from '@/lib/roles';

/**
 * EditorAuthGuard.
 * 
 * Logic: Ensures the user is authenticated and has permission to edit 
 * the specific content (author ownership or admin status).
 */

interface EditorAuthGuardProps {
    children: React.ReactNode;
    loadedAuthorId?: string | null;
    isLoading?: boolean;
}

export function EditorAuthGuard({ children, loadedAuthorId, isLoading }: EditorAuthGuardProps) {
    const supabase = createBrowserClient();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    const searchParams = new URLSearchParams(window.location.search).toString();
                    const fullRedirectPath = currentPath + (searchParams ? `?${searchParams}` : '');
                    router.replace('/login?redirectTo=' + encodeURIComponent(fullRedirectPath));
                }
                return;
            }

            setUserId(user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select(ADMIN_ACCESS_PROFILE_SELECT)
                .eq('id', user.id)
                .single();

            if (profile) {
                setIsAdmin(isAdminRole(profile));
            }
            setAuthLoading(false);
        }
        checkAuth();
    }, [supabase, router]);

    useEffect(() => {
        if (authLoading || isLoading || !userId || !loadedAuthorId) return;

        // Check ownership or admin status
        const isAuthorized = loadedAuthorId === userId || isAdmin;

        if (!isAuthorized) {
            console.error("[SECURITY] Unauthorized editor access attempt.", {
                user: userId,
                author: loadedAuthorId,
                isAdmin
            });
            router.replace('/unauthorized');
        }
    }, [authLoading, isLoading, userId, loadedAuthorId, isAdmin, router]);

    if (authLoading || isLoading) {
        return <PageLoading message="Verificando acesso..." />;
    }

    return <>{children}</>;
}
