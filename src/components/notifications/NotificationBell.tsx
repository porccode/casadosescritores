"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import {
  Bell,
  Check,
  User as UserIcon,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  BellOff,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import NotificationItem from "./NotificationItem";
import { NotificationPayload } from "@/types/notifications";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Notification extends Omit<NotificationPayload, 'related_id'> {
  id: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

export default function NotificationBell(): React.ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const { unreadNotificationsCount, unreadMessagesCount, unreadSuggestionsCount, isAdmin, refreshUnreadCounts } = useRealtime();
  const totalUnreadCount = unreadNotificationsCount + unreadMessagesCount + (isAdmin ? unreadSuggestionsCount : 0);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*, sender:profiles!actor_id(username, avatar_url)")
        .eq("target_user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const typedData = (data as unknown) as Notification[];
      setNotifications(typedData || []);
    } catch (error: unknown) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, unreadNotificationsCount]);

  const markAllAsRead = async () => {
    if (!userId) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    try {
      // Mark notifications as read
      await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("target_user_id", userId)
        .eq("is_read", false);

      // If admin, also mark suggestions as read
      if (isAdmin) {
        await (supabase as any).from("suggestions")
          .update({ is_read: true })
          .eq("is_read", false);
      }

      await refreshUnreadCounts();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      fetchNotifications();
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );

    try {
      await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      await refreshUnreadCounts();
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full bg-secondary">
        <Bell className="h-4 w-4 text-muted-foreground/50" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full bg-secondary hover:bg-accent transition-colors"
          aria-label="Notificações"
        >
          <Bell
            className={cn(
              "h-4 w-4 text-foreground",
              totalUnreadCount > 0 && "fill-foreground/10"
            )}
          />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-base font-semibold text-foreground">Notificações</h3>
          {unreadNotificationsCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 px-2 text-sm text-primary hover:text-primary"
            >
              <Check className="h-4 w-4 mr-1" />
              Marcar lidas
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-foreground">Nenhuma notificação recente</p>
              {unreadNotificationsCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2 px-6">
                  Você possui {unreadNotificationsCount} notificações antigas não lidas.
                </p>
              )}
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2 flex flex-col gap-1">
          {isAdmin && (unreadMessagesCount > 0 || unreadSuggestionsCount > 0) && (
            <Button
              variant="ghost"
              asChild
              className="w-full justify-center text-xs text-[#212121]/60 hover:bg-accent hover:text-[#212121]"
            >
              <Link href="/admin/inbox" onClick={() => setIsOpen(false)}>
                {unreadMessagesCount > 0 && `Chat Direto: ${unreadMessagesCount} un. `}
                {unreadSuggestionsCount > 0 && `Sugestões: ${unreadSuggestionsCount} un.`}
                <span className="ml-1 underline">Abrir Central</span>
              </Link>
            </Button>
          )}
          {!isAdmin && unreadMessagesCount > 0 && (
            <Button
              variant="ghost"
              asChild
              className="w-full justify-center text-xs text-[#212121]/60 hover:bg-accent hover:text-[#212121]"
            >
              <Link href="/messages" onClick={() => setIsOpen(false)}>
                Você tem {unreadMessagesCount} mensagem{unreadMessagesCount !== 1 ? 'ns' : ''} não lida{unreadMessagesCount !== 1 ? 's' : ''}
              </Link>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              asChild
              className="w-full justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Link href="/notifications" onClick={() => setIsOpen(false)}>
                Ver todas as notificações
              </Link>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
