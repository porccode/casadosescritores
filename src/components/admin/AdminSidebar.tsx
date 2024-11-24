"use client";

import {
  LayoutDashboard,
  BookOpen,
  Users,
  Users2,
  Tags,
  MessageSquare,
  MessageSquareLock,
  Megaphone,
  Mail,
  Zap,
  Sparkles,
  Inbox as InboxIcon,
  Shield,
  Trash2,
  Component,
} from "lucide-react";
import AppSidebar, { SidebarItem } from "../AppSidebar";

interface AdminSidebarProps {
  counts?: {
    publications?: number;
    users?: number;
    comments?: number;
    suggestions?: number;
    messages?: number;
    announcements?: number;
    categories?: number;
  };
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ counts, isMobileOpen, onMobileClose }: AdminSidebarProps) {
  const menuItems: SidebarItem[] = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: "Publicações",
      href: "/admin/publications",
      icon: <BookOpen size={20} />,
      badge: counts?.publications,
    },
    {
      label: "Anúncios",
      href: "/admin/announcements",
      icon: <Megaphone size={20} />,
      badge: counts?.announcements,
    },
    {
      label: "Usuários",
      href: "/admin/users",
      icon: <Users size={20} />,
      badge: counts?.users,
    },
    {
      label: "Categorias",
      href: "/admin/categories",
      icon: <Tags size={20} />,
      badge: counts?.categories,
    },
    {
      label: "Inbox",
      href: "/admin/inbox",
      icon: <InboxIcon size={20} />,
      badge: (counts?.messages || 0) + (counts?.suggestions || 0),
    },
    {
      label: "Comentários",
      href: "/admin/comments",
      icon: <MessageSquare size={20} />,
      badge: counts?.comments,
    },
    {
      label: "Comunidades",
      href: "/admin/comunidades",
      icon: <Users2 size={20} />,
    },

    {
      label: "Auditoria",
      href: "/admin/audit",
      icon: <Shield size={20} />,
    },
    {
      label: "Deletados",
      href: "/admin/deleted",
      icon: <Trash2 size={20} />,
    },
    {
      label: "Componentes",
      href: "/admin/componentes",
      icon: <Component size={20} />,
    },
  ];

  return (
    <AppSidebar
      title="Admin"
      basePath="/admin"
      items={menuItems}
      hideDeleteButton={true}
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      isFixedOpen={true}
    />
  );
}

