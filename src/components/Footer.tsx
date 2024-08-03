"use client";

import Link from "next/link";
import SuggestionModal from "@/components/SuggestionModal";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Twitter, Send, MessageCircle, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileFooter from "@/components/layout/MobileFooter";

export default function Footer() {
    const pathname = usePathname();
    const isWritePage = pathname?.startsWith("/escrever") || pathname?.startsWith("/admin");
    const isAuthPage =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/signup" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password";

    const isHomePage = pathname === "/";
    const isSeriesPage = pathname?.startsWith("/series");
    const isChapterPage = pathname?.startsWith("/capitulo");
    const isAdminPage = pathname?.startsWith("/admin");

    const mtClass = isHomePage
        ? "mt-2"
        : isSeriesPage || isChapterPage
        ? "mt-12"
        : "mt-4";

    return (
        <footer
            className={cn(
                "footer-surface text-card-foreground border-t border-border transition-colors duration-300",
                mtClass,
                isAdminPage && "lg:pl-64"
            )}
        >
            {/* Mobile Footer */}
            <MobileFooter year={new Date().getFullYear()} />

            {/* Desktop Footer Content */}
            <div className="hidden md:block">
                <div className="content-wrapper px-0 py-12">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-12">

                        {/* Coluna 1: Marca */}
                        <div className="flex flex-col space-y-4">
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-bold mb-2 leading-tight text-foreground">
                                    Casa dos Escritores
                                </h2>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Uma comunidade vibrante para escritores e leitores.
                                    Publique suas histórias, descubra novos mundos e conecte-se.
                                </p>
                            </div>

                            {/* Redes Sociais */}
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <a
                                    href="https://x.com/casa_escritores"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                    aria-label="X (Twitter)"
                                >
                                    <Twitter size={18} />
                                </a>
                                <a
                                    href="https://www.facebook.com/casadosescritores.site"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                    aria-label="Facebook"
                                >
                                    <Facebook size={18} />
                                </a>
                                <a
                                    href="https://www.instagram.com/casadosescritoresbr/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                    aria-label="Instagram"
                                >
                                    <Instagram size={18} />
                                </a>
                                <a
                                    href="https://www.threads.com/@casadosescritoresbr"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                    aria-label="Threads"
                                >
                                    <AtSign size={18} />
                                </a>
                                <a
                                    href="https://t.me/+FrvBVge4LzM5NTMx"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                    aria-label="Telegram"
                                >
                                    <Send size={18} />
                                </a>
                                <a
                                    href="https://chat.whatsapp.com/Jy6VanawHRXLnRAYshuJgo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                    aria-label="WhatsApp"
                                >
                                    <MessageCircle size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Coluna 2: Explorar */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">Explorar</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="/series"
                                        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                                    >
                                        Todas as Séries
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/series/comunicados-oficiais"
                                        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                                    >
                                        Postagens Oficiais
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/docs"
                                        className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                                    >
                                        Central de Ajuda &amp; Documentação
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Coluna 3: Sugestões */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">Sugestões?</h3>
                            <p className="text-muted-foreground text-sm">
                                Sua opinião é fundamental para a evolução da plataforma.
                            </p>
                            <SuggestionModal />
                        </div>
                    </div>
                </div>

                {/* Barra inferior */}
                <div className="footer-surface-bottom border-t border-border">
                    <div className="content-wrapper px-0 py-6">
                        <div className="flex justify-between items-center gap-4 text-xs text-muted-foreground">
                            <p className="m-0">
                                &copy; {new Date().getFullYear()} Casa dos Escritores. Todos os direitos reservados.
                            </p>
                            <div className="flex items-center space-x-6">
                                <Link
                                    href="/docs/politica-de-privacidade"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Privacidade
                                </Link>
                                <Link
                                    href="/docs/regras-de-uso"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Termos de Uso
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
