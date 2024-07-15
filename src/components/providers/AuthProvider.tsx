"use client";

import { useState, useEffect, createContext, useContext, useCallback, useMemo, ReactNode } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "@/lib/toast";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    userId: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userId: null,
    loading: true,
    isAuthenticated: false,
    refreshAuth: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createBrowserClient();

    const refreshAuth = useCallback(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.warn("Erro ao buscar sessão (limpando cache de cookies):", error.message);
                if (
                    error.message.includes("Refresh Token") ||
                    error.message.includes("refresh_token") ||
                    error.message.includes("invalid_grant") ||
                    error.message.includes("not found") ||
                    (error as any).status === 400
                ) {
                    await supabase.auth.signOut().catch(() => {});
                }
                setUser(null);
                return;
            }

            setUser(session?.user ?? null);
            
            // Verificação de Obras Abandonadas (1x por sessão)
            if (session?.user && typeof window !== "undefined") {
                if (!sessionStorage.getItem("abandoned_checked")) {
                    sessionStorage.setItem("abandoned_checked", "true");
                    
                    // Buscar séries do usuário
                    const { data: userSeries } = await supabase
                        .from('series')
                        .select('id, title, updated_at, is_archived, is_completed')
                        .eq('author_id', session.user.id)
                        .eq('is_archived', false)
                        .eq('is_completed', false);
                        
                    if (userSeries && (userSeries as any[]).length > 0) {
                        for (const s of (userSeries as any[])) {
                            if (!s.updated_at) continue;
                            const diffDays = (new Date().getTime() - new Date(s.updated_at).getTime()) / (1000 * 60 * 60 * 24);
                            
                            if (diffDays > 15) {
                                // Verificar se tem capítulos
                                const { count } = await supabase
                                    .from('chapters')
                                    .select('*', { count: 'exact', head: true })
                                    .eq('series_id', s.id);
                                    
                                if (count && count > 0) {
                                    // Achou pelo menos uma abandonada -> dispara o toast e para o loop
                                    setTimeout(() => {
                                        toast.warning("Obra Abandonada Detectada!", {
                                            description: `Sua obra "${s.title}" está há mais de 15 dias sem novos capítulos. Seus leitores estão esperando!`,
                                            duration: 8000
                                        });
                                    }, 2000); // pequeno delay para não conflitar com outros toasts de login
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error("Erro ao buscar autenticação:", error);
            if (
                error?.message?.includes("Refresh Token") ||
                error?.message?.includes("refresh_token") ||
                error?.message?.includes("invalid_grant") ||
                error?.message?.includes("not found") ||
                error?.status === 400
            ) {
                await supabase.auth.signOut().catch(() => {});
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        // Buscar sessão inicial
        refreshAuth();

        // Escutar mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, refreshAuth]);

    const contextValue = useMemo(() => ({
        user,
        userId: user?.id ?? null,
        loading,
        isAuthenticated: !!user,
        refreshAuth,
    }), [user, loading, refreshAuth]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}


/**
 * Hook para acessar o estado de autenticação global.
 * Evita múltiplas chamadas a supabase.auth.getSession() nos componentes.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
