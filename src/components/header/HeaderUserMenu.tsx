"use client";

import Link from "next/link";
import { User as UserIcon, Settings, LogOut, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

interface HeaderUserMenuProps {
  user: User;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  onSignOut: () => void;
}

export default function HeaderUserMenu({
  user,
  fullName,
  username,
  avatarUrl,
  isAdmin,
  onSignOut,
}: HeaderUserMenuProps) {
  if (!user) return null;

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl || undefined} alt={fullName} />
            <AvatarFallback>
              {initials || <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">
              @{username}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="hover:bg-accent focus:bg-accent cursor-pointer">
            <Link href={`/profile/${encodeURIComponent(username)}`} className="flex items-center text-foreground">
              <UserIcon className="mr-2 h-4 w-4 text-foreground" />
              Meu Perfil
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="hover:bg-accent focus:bg-accent cursor-pointer">
            <Link href="/messages" className="text-foreground">
              <MessageSquare className="mr-2 h-4 w-4 text-foreground" />
              Mensagens
              {(user as any).unreadMessagesCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">
                  {(user as any).unreadMessagesCount}
                </span>
              )}
            </Link>
          </DropdownMenuItem>

          {isAdmin && (
            <DropdownMenuItem asChild className="hover:bg-accent focus:bg-accent cursor-pointer">
              <Link href="/admin" className="text-foreground">
                <Settings className="mr-2 h-4 w-4 text-foreground" />
                Dashboard
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSignOut} className="hover:bg-accent focus:bg-accent cursor-pointer text-foreground">
          <LogOut className="mr-2 h-4 w-4 text-foreground" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
