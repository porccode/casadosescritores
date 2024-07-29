"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface SidebarItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
}

interface MobileAppSidebarTabsProps {
    items: SidebarItem[];
    isActive: (href: string) => boolean;
}

export default function MobileAppSidebarTabs({
    items,
    isActive,
}: MobileAppSidebarTabsProps) {
    return (
        <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border overflow-x-auto scrollbar-hide">
            <nav className="flex items-center px-4 h-14 space-x-2 min-w-max">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                            isActive(item.href)
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-secondary text-secondary-foreground border border-border hover:bg-accent"
                        )}
                    >
                        <span>{item.icon}</span>
                        <span className={cn(isActive(item.href) && "text-primary-foreground")}>
                            {item.label}
                        </span>
                        {item.badge !== undefined && item.badge > 0 && (
                            <Badge
                                variant={isActive(item.href) ? "secondary" : "outline"}
                                className={cn(
                                    "ml-1 min-w-[1.25rem] h-5 flex items-center justify-center px-1 text-[10px]",
                                    isActive(item.href) && "bg-white/20 text-white border-transparent"
                                )}
                            >
                                {item.badge}
                            </Badge>
                        )}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
