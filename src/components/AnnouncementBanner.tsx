"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Database } from "@/types/database.types";
import { X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

interface AnnouncementBannerProps {
  /** "top" = Barra Superior (acima do Header) | "mid" = Barra de Destaque (entre Header e Main) */
  position: "top" | "mid";
}

export default function AnnouncementBanner({ position }: AnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const supabase = createBrowserClient();
  const pathname = usePathname();

  useEffect(() => {
    // Não exibir na área admin
    if (pathname?.startsWith("/admin")) {
      setAnnouncement(null);
      return;
    }

    const fetchAnnouncement = async () => {
      const now = new Date().toISOString();

      // "top" = type 'short', "mid" = type 'long'
      const targetType = position === "top" ? "short" : "long";

      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .eq("type", targetType)
        .lte("start_date", now)
        .order("created_at", { ascending: false });

      if (data && (data as any[]).length > 0) {
        const active = (data as any[]).find(
          (a) => !a.end_date || new Date(a.end_date).toISOString() > now
        );
        setAnnouncement(active ?? null);
      } else {
        setAnnouncement(null);
      }
    };

    fetchAnnouncement();
  }, [pathname, position]);

  if (!announcement) return null;

  // ── Barra Superior (slim, acima do header) ─────────────────────────────────
  if (position === "top") {
    return (
      <div
        className="relative z-50 w-full px-3 py-1.5 text-center text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-1 duration-300"
        style={{
          backgroundColor: announcement.background_color || "#494EB6",
          color: announcement.text_color || "#ffffff",
        }}
      >
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="font-bold">{announcement.title}</span>
          {announcement.message && (
            <>
              <span className="opacity-40 hidden sm:inline">·</span>
              <span className="opacity-90 hidden sm:inline text-xs">{announcement.message}</span>
            </>
          )}
          {announcement.link_url && (
            <Link
              href={announcement.link_url}
              className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold transition-opacity hover:opacity-80 shrink-0"
              style={{
                backgroundColor: announcement.button_bg_color || "#ffffff",
                color: announcement.button_text_color || "#494EB6",
              }}
            >
              {announcement.link_label || "Saiba Mais"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Barra de Destaque (banner encorpado, entre Header e Main) ───────────────
  return (
    <div
      className="w-full animate-in fade-in slide-in-from-top-2 duration-300"
      style={{
        backgroundColor: announcement.background_color || "#494EB6",
        color: announcement.text_color || "#ffffff",
      }}
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <p className="text-base sm:text-lg font-bold leading-tight">{announcement.title}</p>
            {announcement.message && (
              <p className="text-sm opacity-90 leading-relaxed">{announcement.message}</p>
            )}
          </div>
          {announcement.link_url && (
            <Link
              href={announcement.link_url}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold shadow-md transition-all hover:opacity-90 hover:scale-105 shrink-0"
              style={{
                backgroundColor: announcement.button_bg_color || "#ffffff",
                color: announcement.button_text_color || "#494EB6",
              }}
            >
              {announcement.link_label || "Saiba Mais"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
