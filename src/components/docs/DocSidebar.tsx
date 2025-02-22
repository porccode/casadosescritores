"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ChevronRight
} from "lucide-react";

export const DOCS_MENU = [
    {
        title: "Começando",
        items: [
            { title: "Introdução", href: "/docs" },
            { title: "Cadastro e Perfil", href: "/docs/cadastro-e-perfil" },
            { title: "Sistema de XP", href: "/docs/sistema-de-xp" },
        ],
    },
    {
        title: "Criação de Conteúdo",
        items: [
            { title: "Séries e Obras", href: "/docs/series-e-obras" },
            { title: "Capítulos e Edição", href: "/docs/capitulos-e-edicao" },
            { title: "Escrita Assistida (IA)", href: "/docs/escrita-assistida" },
        ],
    },
    {
        title: "Comunidade",
        items: [
            { title: "Feed e Interação", href: "/docs/posts-e-interacao" },
            { title: "Comentários", href: "/docs/comentarios" },
            { title: "Busca e Rankings", href: "/docs/busca-e-rankings" },
        ],
    },
    {
        title: "Plataforma",
        items: [
            { title: "Mensagens e Chat", href: "/docs/notificacoes-e-chat" },
            { title: "Segurança e Regras", href: "/docs/seguranca-e-regras" },
            { title: "Suporte e Feedback", href: "/docs/suporte-e-feedback" },
        ],
    },
];

export function DocSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-full h-full py-6 pr-4">
            <ScrollArea className="h-full">
                <div className="space-y-8">
                    {DOCS_MENU.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                            <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                {section.title}
                            </h4>
                            <nav className="grid grid-flow-row auto-rows-max gap-1">
                                {section.items.map((item, itemIdx) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={itemIdx}
                                            href={item.href}
                                            className={cn(
                                                "group flex w-full items-center rounded-md border border-transparent px-3 py-2 text-sm transition-all",
                                                isActive
                                                    ? "bg-muted text-foreground font-semibold"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            {item.title}
                                            {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
