"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { NotificationPayload } from "@/types/notifications";

export interface Notification extends Omit<NotificationPayload, "related_id"> {
  id: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface GroupedNotifications {
  new: Notification[];
  today: Notification[];
  thisWeek: Notification[];
  thisMonth: Notification[];
  older: Notification[];
}

const NOTIFICATIONS_PER_PAGE = 30;

/**
 * useNotifications.
 * 
 * Logic: Manages fetching, temporal grouping, and marking-as-read for user notifications.
 * Implements standard pagination and real-time updates (can be added later).
 */
export function useNotifications(userId: string | undefined) {
  const supabase = createBrowserClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(async (isLoadMore = false) => {
    if (!userId) return;

    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      const from = isLoadMore ? notifications.length : 0;
      const to = from + NOTIFICATIONS_PER_PAGE - 1;

      const { data, error, count } = await (supabase as any)
        .from("notifications")
        .select("*, sender:profiles!actor_id(username, avatar_url)", { count: "exact" })
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (count !== null) setTotalCount(count);

      const newBatch = (data as unknown as Notification[]) || [];
      setNotifications(prev => isLoadMore ? [...prev, ...newBatch] : newBatch);
    } catch (err) {
      console.error("[useNotifications] Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, notifications.length, supabase]);

  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId, fetchNotifications]);

  const groupedNotifications = useMemo((): GroupedNotifications => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    const groups: GroupedNotifications = {
      new: [],
      today: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      if (!notification.is_read && date >= todayStart) {
        groups.new.push(notification);
      } else if (date >= todayStart) {
        groups.today.push(notification);
      } else if (date >= weekStart) {
        groups.thisWeek.push(notification);
      } else if (date >= monthStart) {
        groups.thisMonth.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    try {
      await (supabase as any).from("notifications").update({ is_read: true }).eq("id", notificationId);
    } catch (err) {
      console.error("[useNotifications] Mark as read error:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await (supabase as any).from("notifications").update({ is_read: true }).eq("target_user_id", userId).eq("is_read", false);
    } catch (err) {
      console.error("[useNotifications] Mark all as read error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasMore = notifications.length < totalCount;

  return {
    notifications,
    groupedNotifications,
    loading,
    loadingMore,
    markingAll,
    unreadCount,
    hasMore,
    fetchMore: () => fetchNotifications(true),
    markAsRead,
    markAllAsRead,
  };
}
