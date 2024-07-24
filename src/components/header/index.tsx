"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Menu, User as UserIcon, Settings, LogOut, MessageSquare } from "lucide-react";
import { sanitizeText } from "@/lib/sanitize";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading-states";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { useAuth } from "@/components/providers/AuthProvider";

// Componentes modulares
import HeaderLogo from "./HeaderLogo";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";
import HeaderUserMenu from "./HeaderUserMenu";
import NotificationBell from "../notifications/NotificationBell";
import HeaderMobileMenu from "@/components/header/HeaderMobileMenu";

import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const { unreadMessagesCount, unreadNotificationsCount, unreadSuggestionsCount, isAdmin: realtimeIsAdmin } = useRealtime();
  const { user, loading: authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasPremiumBadge, setHasPremiumBadge] = useState(false);
  const [hasEliteBadge, setHasEliteBadge] = useState(false);


  useEffect(() => {
    let mounted = true;

    async function getProfile() {
      if (!user) return;

      try {
        setProfileLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("username, role, is_admin, avatar_url, first_name, last_name, has_premium_badge, has_elite_badge")
          .eq("id", user.id)
          .single() as any;

        if (data && mounted) {
          const dbUsername = data.username || user.user_metadata?.username || user.email?.split("@")[0] || "";
          setUsername(dbUsername);
          setFirstName(data.first_name || user.user_metadata?.first_name || "");
          setLastName(data.last_name || user.user_metadata?.last_name || "");
          setIsAdmin(data.role === "admin" || data.is_admin === true);
          setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture);
          setHasPremiumBadge(!!data.has_premium_badge);
          setHasEliteBadge(!!data.has_elite_badge);
        }

        // Auto-correct profile if missing or incomplete
        if ((error && error.code === "PGRST116") || (data && !data.username)) {
          console.log("Perfil ausente ou incompleto no Header. Tentando corrigir...");
          const meta = user.user_metadata;
          const baseUsername = meta.user_name || meta.email?.split("@")[0] || `user_${Math.random().toString(36).slice(2, 7)}`;
          const cleanUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "") + Math.floor(Math.random() * 1000);

          const profileData = {
            id: user.id,
            username: cleanUsername,
            email: user.email!,
            first_name: meta.full_name?.split(" ")[0] || meta.name?.split(" ")[0] || "Usuário",
            last_name: meta.full_name?.split(" ").slice(1).join(" ") || meta.name?.split(" ").slice(1).join(" ") || "",
            avatar_url: meta.avatar_url || meta.picture,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await (supabase as any).from("profiles").upsert(profileData);
          if (!upsertError && mounted) {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("Erro ao buscar perfil no Header:", error);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }

    if (user) {
      getProfile();
    } else {
      setUsername("");
      setFirstName("");
      setLastName("");
      setIsAdmin(false);
      setAvatarUrl("");
    }

    return () => {
      mounted = false;
    };
  }, [supabase, user]);

  const loading = authLoading || (user && profileLoading);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      await fetch("/api/auth/signout", { method: "POST", cache: "no-store" });
      setShowMobileMenu(false);
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-")) localStorage.removeItem(key);
      });
      window.location.href = "/";
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
      setShowMobileMenu(false);
    }
  };

  const fullName =
    firstName || lastName
      ? sanitizeText(`${firstName} ${lastName}`.trim())
      : sanitizeText(username) || "Usuário";

  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background transition-all duration-300",
      pathname === "/" ? "mb-2" : "mb-0",
      isAdminPage && "lg:pl-64"
    )}>
      <div className="relative w-full flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* ZONA ESQUERDA: Logo + Busca Persistente */}
        <div className="flex-1 flex items-center gap-3 justify-start min-w-0">
          <HeaderLogo />
          <HeaderSearch className="hidden md:flex" />
        </div>

        {/* ZONA CENTRAL: Menu de Navegação por Abas */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center justify-center h-full">
          <HeaderNav user={user} />
        </div>

        {/* ZONA DIREITA: Ações do Usuário */}
        <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
          {authLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 sm:gap-3">

              <ThemeToggle />
              {user ? (
                <>
                  <NotificationBell />
                  <HeaderUserMenu
                    user={{
                      ...user,
                      has_premium_badge: hasPremiumBadge,
                      has_elite_badge: hasEliteBadge,
                      unreadMessagesCount: unreadMessagesCount
                    } as any}
                    fullName={fullName}
                    username={username}
                    avatarUrl={avatarUrl}
                    isAdmin={isAdmin}
                    onSignOut={handleSignOut}
                  />
                </>
              ) : (
                <Button asChild variant="ghost" className="gap-2 px-3 rounded-full hover:bg-accent">
                  <Link href={`/login?redirectTo=${encodeURIComponent(pathname)}`}>
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium hidden sm:inline">Minha Conta</span>
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-full shrink-0 hover:bg-accent"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="h-5 w-5 text-foreground" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <HeaderMobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
        username={username}
        avatarUrl={avatarUrl}
        firstName={firstName}
        isAdmin={isAdmin}
        unreadCount={unreadNotificationsCount}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        onSignOut={handleSignOut}
        unreadMessagesCount={unreadMessagesCount}
        unreadSuggestionsCount={unreadSuggestionsCount}
      />


    </header>
  );
}
