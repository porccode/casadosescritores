"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import NotificationItem from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { ContentListSkeleton } from "@/components/ui/loading-states";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import DesktopHeader from "@/components/navigation/DesktopHeader";

/**
 * NotificationsPage.
 *
 * ARCHITECTURE:
 * - High-authority notifications hub.
 * - Uses useNotifications hook for temporal grouping and orchestration.
 * - Logic: Separates Desktop/Mobile header contexts and manages infinite discovery.
 */

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [userId, setUserId] = useState<string>();
  const [authLoading, setAuthLoading] = useState(true);

  // 1. Auth Context
  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const fullPath = window.location.pathname + window.location.search;
        router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
        return;
      }
      setUserId(user.id);
      setAuthLoading(false);
    }
    checkUser();
  }, [router, supabase]);

  // 2. Logic Orchestration
  const {
    groupedNotifications,
    loading,
    loadingMore,
    markingAll,
    unreadCount,
    hasMore,
    fetchMore,
    markAsRead,
    markAllAsRead,
    notifications,
  } = useNotifications(userId);

  const renderSection = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <div>
        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {title}
          </span>
        </div>
        <div>
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
            />
          ))}
        </div>
      </div>
    );
  };

  const isInitialLoading = authLoading || (loading && notifications.length === 0);

  return (
    <div className="min-h-screen bg-background">
      <DesktopHeader pageTitle="Notificações" />

      <div className="max-w-2xl mx-auto border-x border-border min-h-screen bg-background">
        {/* Header Mobile Context */}
        <MobilePageHeader
          title="Notificações"
          onBack={() => router.back()}
          action={{
            label: "Marcar lidas",
            icon: <CheckCheck className="h-4 w-4" />,
            onClick: markAllAsRead,
            disabled: markingAll,
            show: unreadCount > 0,
          }}
        />

        {/* Header Desktop Context */}
        <header className="hidden md:flex sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-6 py-4 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Notificações
            </h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Marcar todas como lidas
            </Button>
          )}
        </header>

        {/* Content Flow */}
        <main className="pb-20">
          {isInitialLoading ? (
            <div className="p-6">
              <ContentListSkeleton count={8} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Nenhuma notificação</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Novas interações aparecerão aqui assim que acontecerem.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {renderSection("Recentes", groupedNotifications.new)}
              {renderSection("Hoje", groupedNotifications.today)}
              {renderSection("Esta semana", groupedNotifications.thisWeek)}
              {renderSection("Este mês", groupedNotifications.thisMonth)}
              {renderSection("Anteriores", groupedNotifications.older)}

              {/* Discovery Pagination */}
              {hasMore && (
                <div className="p-6 flex justify-center">
                  <LoadMoreButton
                    onClick={fetchMore}
                    loading={loadingMore}
                    label="Carregar mais"
                    loadingLabel="Carregando..."
                  />
                </div>
              )}

              {!hasMore && notifications.length > 0 && (
                <div className="py-10 flex items-center gap-4 px-6">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground shrink-0">
                    Você está em dia
                  </span>
                  <Separator className="flex-1" />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
