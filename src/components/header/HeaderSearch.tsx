"use client";

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, BookOpen, User as UserIcon, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, getMediaUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface SuggestionItem {
    id: string;
    title?: string;
    name?: string;
    username?: string;
    slug?: string;
    cover_url?: string;
    avatar_url?: string;
    cover_color?: string;
    avatar_color?: string;
    genre?: string;
    author_username?: string;
    bio?: string;
}

interface SuggestionsData {
    series: SuggestionItem[];
    profiles: SuggestionItem[];
    communities: SuggestionItem[];
}

interface HeaderSearchProps {
    className?: string;
}

export default function HeaderSearch({ className }: HeaderSearchProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce search input to fetch suggestions
    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (trimmed.length < 2) {
            setSuggestions(null);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                    setIsOpen(true);
                    setActiveIndex(-1);
                }
            } catch (err) {
                console.error("Error loading search suggestions:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = searchTerm.trim();
        if (trimmed) {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
            setIsOpen(false);
            setSearchTerm("");
        }
    };

    // Flatten suggestions for keyboard navigation
    const getFlattenedItems = (): { type: string; item: SuggestionItem; href: string }[] => {
        if (!suggestions) return [];
        const flat: { type: string; item: SuggestionItem; href: string }[] = [];

        suggestions.series.forEach(s => flat.push({
            type: "series",
            item: s,
            href: `/series/${s.slug}`
        }));

        suggestions.profiles.forEach(p => flat.push({
            type: "profile",
            item: p,
            href: `/profile/${p.username}`
        }));

        suggestions.communities.forEach(c => flat.push({
            type: "community",
            item: c,
            href: `/comunidades/${c.slug}`
        }));

        return flat;
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const flatItems = getFlattenedItems();
        if (flatItems.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex(prev => (prev + 1 < flatItems.length ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex(prev => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            const selected = flatItems[activeIndex];
            router.push(selected.href);
            setIsOpen(false);
            setSearchTerm("");
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const flatItems = getFlattenedItems();
    const hasSuggestions = flatItems.length > 0;

    return (
        <div ref={containerRef} className={cn("relative w-40 sm:w-48 lg:w-60", className)}>
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (searchTerm.trim().length >= 2) setIsOpen(true);
                    }}
                    className="h-9 pl-9 pr-8 w-full bg-secondary hover:bg-accent focus:bg-background rounded-full border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-foreground transition-all placeholder:text-muted-foreground"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </form>

            {/* Suggestions Dropdown */}
            {isOpen && (hasSuggestions || isLoading) && (
                <div className="absolute top-full left-0 mt-2 w-[320px] bg-background/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs font-medium gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Buscando sugestões...</span>
                        </div>
                    ) : (
                        <div className="max-h-[360px] overflow-y-auto">
                            {/* Séries */}
                            {suggestions && suggestions.series.length > 0 && (
                                <div className="mb-2">
                                    <div className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border-b border-border/40 mb-1">
                                        <BookOpen size={10} />
                                        <span>Séries</span>
                                    </div>
                                    {suggestions.series.map((item, index) => {
                                        const overallIndex = index;
                                        const isActive = overallIndex === activeIndex;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    router.push(`/series/${item.slug}`);
                                                    setIsOpen(false);
                                                    setSearchTerm("");
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-primary/5",
                                                    isActive && "bg-primary/5 border-l-2 border-primary pl-2.5"
                                                )}
                                            >
                                                <div className="relative w-8 h-11 shrink-0 rounded bg-muted overflow-hidden border border-border/40">
                                                    {item.cover_url ? (
                                                        <OptimizedImage
                                                            src={getMediaUrl(item.cover_url, 'covers')}
                                                            alt={item.title || ""}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary/30 text-[10px] font-bold">
                                                            {item.title ? item.title.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate leading-tight">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                        {item.genre} • por @{item.author_username}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Escritores */}
                            {suggestions && suggestions.profiles.length > 0 && (
                                <div className="mb-2">
                                    <div className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border-b border-border/40 mb-1">
                                        <UserIcon size={10} />
                                        <span>Escritores</span>
                                    </div>
                                    {suggestions.profiles.map((item, index) => {
                                        const overallIndex = (suggestions?.series.length || 0) + index;
                                        const isActive = overallIndex === activeIndex;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    router.push(`/profile/${item.username}`);
                                                    setIsOpen(false);
                                                    setSearchTerm("");
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-1.5 cursor-pointer transition-colors hover:bg-primary/5",
                                                    isActive && "bg-primary/5 border-l-2 border-primary pl-2.5"
                                                )}
                                            >
                                                <Avatar className="h-7 w-7 border border-border/40 shrink-0">
                                                    <AvatarImage src={getMediaUrl(item.avatar_url, 'avatars')} />
                                                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                                        {item.username ? item.username.substring(0, 2).toUpperCase() : "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        @{item.username}
                                                    </p>
                                                    {item.bio && (
                                                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                            {item.bio}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Comunidades */}
                            {suggestions && suggestions.communities.length > 0 && (
                                <div className="mb-1">
                                    <div className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border-b border-border/40 mb-1">
                                        <MessageSquare size={10} />
                                        <span>Comunidades</span>
                                    </div>
                                    {suggestions.communities.map((item, index) => {
                                        const overallIndex = (suggestions?.series.length || 0) + (suggestions?.profiles.length || 0) + index;
                                        const isActive = overallIndex === activeIndex;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    router.push(`/comunidades/${item.slug}`);
                                                    setIsOpen(false);
                                                    setSearchTerm("");
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-1.5 cursor-pointer transition-colors hover:bg-primary/5",
                                                    isActive && "bg-primary/5 border-l-2 border-primary pl-2.5"
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-sm border border-background/25 shrink-0 text-white",
                                                    item.avatar_color || "bg-primary"
                                                )}>
                                                    {(item.name || "?").charAt(0).toUpperCase()}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
