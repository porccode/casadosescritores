// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { hasRole, ROLES } from "@/hooks/useUserRole";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { PageLoading } from "@/components/ui/loading-states";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { stats, isLoading: statsLoading } = useAdminStats();
  const router = useRouter();

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { session } } = await createBrowserClient().auth.getSession();

        if (!session) {
          const fullPath = window.location.pathname + window.location.search;
          router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
          return;
        }

        const isAdmin = await hasRole(ROLES.ADMIN);
        if (!isAdmin) {
          router.push("/unauthorized");
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        router.push("/unauthorized");
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return <PageLoading message="Verificando permissões..." />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - Floating/Hover logic inside */}
      <AdminSidebar
        counts={stats}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 w-full overflow-x-hidden lg:pl-64">
        {/* Mobile Header Toolbar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center h-14 px-4 bg-background border-b border-border shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="hover:bg-accent -ml-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="ml-3 font-semibold text-sm text-foreground">
            Painel Administrativo
          </span>
        </div>

        <div className="content-wrapper py-6">
          <div className="mb-6 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <strong className="text-primary">Conformidade LGPD (Art. 37 da Lei nº 13.709/2018):</strong> Todas as ações administrativas (edição, exclusão e alteração de perfis) são registradas no log de auditoria inalterável.
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
