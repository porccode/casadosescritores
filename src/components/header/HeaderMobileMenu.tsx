"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Compass, Bell, LogOut, PenLine, User, MessageSquare, LayoutDashboard, Users } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderMobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    username: string;
    avatarUrl: string | null;
    firstName: string;
    isAdmin: boolean;
    unreadCount: number;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onSearchSubmit: (e: React.FormEvent) => void;
    onSignOut: () => void;
    unreadMessagesCount: number;
    unreadSuggestionsCount: number;
}

export default function HeaderMobileMenu({
    isOpen,
    onClose,
    user,
    username,
    avatarUrl,
    firstName,
    isAdmin,
    unreadCount,
    searchTerm,
    onSearchChange,
    onSearchSubmit,
    onSignOut,
    unreadMessagesCount,
    unreadSuggestionsCount,
}: HeaderMobileMenuProps) {
    const pathname = usePathname();
    const initials = (firstName || username || "U").charAt(0).toUpperCase();
    const displayName = firstName || username;

    const isActive = (href: string) => {
        return pathname === href || (href !== "/" && pathname.startsWith(href));
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-72 p-0 flex flex-col">
                <SheetHeader className="sr-only">
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full">
                    {/* Profile Section */}
                    {user ? (
                        <div className="p-4 pt-8">
                            <Link
                                href={`/profile/${encodeURIComponent(username)}`}
                                onClick={onClose}
                                className="flex items-center gap-3 group"
                            >
                                <Avatar className="h-12 w-12 border-2 border-border">
                                    <AvatarImage src={avatarUrl || undefined} />
                                    <AvatarFallback className="text-sm font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-foreground truncate group-hover:underline">
                                        {displayName}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate">
                                        @{username}
                                    </span>
                                </div>
                            </Link>
                        </div>
                    ) : (
                        <div className="p-4 pt-8">
                            <Button asChild className="w-full gap-2">
                                <Link href={`/login?redirectTo=${encodeURIComponent(pathname)}`} onClick={onClose}>
                                    <User className="h-4 w-4" />
                                    Minha Conta
                                </Link>
                            </Button>
                        </div>
                    )}

                    <Separator />

                    {/* Navigation */}
                    <nav className="flex-1 p-2">
                        <div className="space-y-1">
                            <NavItem
                                href="/explorar"
                                icon={<Compass size={18} />}
                                label="Explorar"
                                onClose={onClose}
                                active={isActive("/explorar")}
                            />

                            <NavItem
                                href="/comunidades"
                                icon={<Users size={18} />}
                                label="Comunidades"
                                onClose={onClose}
                                active={isActive("/comunidades")}
                            />

                            {user && (
                                <>
                                    <NavItem
                                        href="/escrever"
                                        icon={<PenLine size={18} />}
                                        label="Escrever"
                                        onClose={onClose}
                                        active={isActive("/escrever")}
                                    />

                                    <NavItem
                                        href="/notifications"
                                        icon={<Bell size={18} />}
                                        label="Notificações"
                                        onClose={onClose}
                                        badge={unreadCount + unreadMessagesCount + (isAdmin ? unreadSuggestionsCount : 0)}
                                        active={isActive("/notifications")}
                                    />

                                    {isAdmin && (
                                        <NavItem
                                            href="/admin"
                                            icon={<LayoutDashboard size={18} />}
                                            label="Dashboard"
                                            onClose={onClose}
                                            active={isActive("/admin") && !isActive("/admin/inbox")}
                                        />
                                    )}

                                    <NavItem
                                        href={isAdmin ? "/admin/inbox" : "/messages"}
                                        icon={<MessageSquare size={18} />}
                                        label="Mensagens"
                                        onClose={onClose}
                                        badge={unreadMessagesCount + (isAdmin ? unreadSuggestionsCount : 0)}
                                        active={isActive(isAdmin ? "/admin/inbox" : "/messages")}
                                    />

                                    <NavItem
                                        href={`/profile/${encodeURIComponent(username)}`}
                                        icon={<User size={18} />}
                                        label="Meu Perfil"
                                        onClose={onClose}
                                        active={isActive(`/profile/${encodeURIComponent(username)}`)}
                                    />

                                    <Separator className="my-2" />

                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => { onSignOut(); onClose(); }}
                                    >
                                        <LogOut size={18} />
                                        <span>Sair</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </nav>

                    {/* Search at bottom */}
                    <div className="mt-auto p-4 border-t border-border flex gap-2 items-center">
                        <form onSubmit={onSearchSubmit} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="pl-9 h-10"
                                />
                            </div>
                        </form>
                        <ThemeToggle />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Sub-component for navigation items
function NavItem({
    href,
    icon,
    label,
    onClose,
    badge,
    active
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    onClose: () => void;
    badge?: number;
    active?: boolean;
}) {
    return (
        <Button
            variant="ghost"
            className={cn(
                "w-full justify-start gap-3 h-11 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
                active && "bg-accent"
            )}
            asChild
        >
            <Link href={href} onClick={onClose}>
                <span className="text-foreground">{icon}</span>
                <span className="flex-1 text-left font-medium">{label}</span>
                {badge !== undefined && badge > 0 && (
                    <span className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {badge > 99 ? "99+" : badge}
                    </span>
                )}
            </Link>
        </Button>
    );
}
