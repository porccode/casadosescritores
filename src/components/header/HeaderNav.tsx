"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PenLine, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderNavProps {
  user?: any;
}

export default function HeaderNav({ user = null }: HeaderNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Página Inicial",
      exact: true,
    },
    {
      href: "/series",
      icon: Compass,
      label: "Séries",
      exact: false,
    },
    {
      href: "/comunidades",
      icon: Users,
      label: "Comunidades",
      exact: false,
    },
    {
      href: "/escrever",
      icon: PenLine,
      label: "Escrever",
      exact: false,
      requireUser: true,
    },
  ];

  return (
    <TooltipProvider>
      <nav className="flex items-center gap-1 lg:gap-2 h-full">
        {navItems.map((item) => {
          if (item.requireUser && !user) return null;

          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && (item.href !== "/" || pathname === "/");

          const IconComponent = item.icon;

          if (item.href === "/escrever") {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center justify-center w-auto px-4 lg:px-5 h-14 rounded-xl group transition-all duration-200 font-extrabold text-sm tracking-tight",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <span className="transition-transform group-hover:scale-105">
                  Escrever
                </span>
                
                {/* Linha inferior de aba ativa estilo Facebook */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-1 bg-primary rounded-t-full" />
                )}
              </Link>
            );
          }

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-center w-14 lg:w-20 h-14 rounded-xl group transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <IconComponent className={cn("h-5 w-5 lg:h-6 lg:w-6 transition-transform group-hover:scale-105", isActive && "stroke-[2.5px]")} />
                  
                  {/* Linha inferior de aba ativa estilo Facebook */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-1 bg-primary rounded-t-full" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10}>
                <p className="text-xs font-semibold">{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
