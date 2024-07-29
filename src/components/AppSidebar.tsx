"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import DeleteAccountModal from "./DeleteAccountModal";
import MobileAppSidebarTabs from "@/components/navigation/MobileAppSidebarTabs";

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AppSidebarProps {
  title: string;
  items: SidebarItem[];
  basePath: string;
  backLink?: {
    href: string;
    label?: string;
  };
  userNickname?: string;
  hideDeleteButton?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isFixedOpen?: boolean;
}

export default function AppSidebar({
  title,
  items,
  basePath,
  backLink = { href: "/" },
  userNickname,
  hideDeleteButton = false,
  isMobileOpen = false,
  onMobileClose,
  isFixedOpen = false,
}: AppSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/" || href === basePath) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        userNickname={userNickname || ""}
      />

      {/* Sidebar - Floating Desktop & Mobile Drawer */}
      <aside
        onMouseEnter={() => !isFixedOpen && setIsHovered(true)}
        onMouseLeave={() => !isFixedOpen && setIsHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r border-border transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
          // Desktop Width
          isFixedOpen ? "lg:w-64" : (isHovered ? "lg:w-64" : "lg:w-[72px]"),
          // Mobile Visibility
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-4">
          {items.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center h-10 rounded-lg transition-colors duration-200 group relative",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {/* Icon Container - Fixed space to prevent jitter */}
                <div className="w-[48px] flex items-center justify-center shrink-0">
                  <div className={cn(
                    "transition-colors duration-200",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.icon}
                  </div>
                </div>

                {/* Label - Controlled width and opacity */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out flex items-center",
                  isFixedOpen || isHovered || isMobileOpen ? "w-40 opacity-100" : "w-0 opacity-0"
                )}>
                  <span className="font-medium truncate whitespace-nowrap">
                    {item.label}
                  </span>
                </div>

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <div className={cn(
                    "ml-auto pr-2 transition-opacity duration-300",
                    isFixedOpen || isHovered || isMobileOpen ? "opacity-100" : "opacity-0"
                  )}>
                    <Badge
                      variant={active ? "secondary" : "outline"}
                      className={cn(
                        "min-w-[1.25rem] h-5 flex items-center justify-center px-1 text-[10px]",
                        active && "bg-white/20 text-white border-transparent"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  </div>
                )}

                {/* Small badge dot removed by user request */}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!hideDeleteButton && (
          <div className={cn(
            "p-4 pt-2 border-t border-border shrink-0 mt-auto bg-muted/50",
            !isFixedOpen && !isHovered && !isMobileOpen && "hidden"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Excluir conta
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
    </>
  );
}
