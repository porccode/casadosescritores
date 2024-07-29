"use client";

import React from "react";
import Link from "next/link";
import { Instagram, Twitter, Facebook, Send, MessageCircle, AtSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import SuggestionModal from "@/components/SuggestionModal";

interface MobileFooterProps {
    year: number;
}

export default function MobileFooter({ year }: MobileFooterProps) {
    return (
        <div className="md:hidden border-t border-border">
            {/* Links Rápidos */}
            <div className="px-4 py-4">
                <div className="flex flex-wrap justify-center items-center">
                    <Link
                        href="/series"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Todas as Séries
                    </Link>
                    <span className="text-muted-foreground/30 mx-2 text-xs">•</span>
                    <Link
                        href="/series/comunicados-oficiais"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Postagens Oficiais
                    </Link>
                    <span className="text-muted-foreground/30 mx-2 text-xs">•</span>
                    <Link
                        href="/docs"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Ajuda e Documentação
                    </Link>
                </div>
            </div>

            <Separator />

            {/* Sugestão */}
            <div className="px-4 py-6">
                <div className="space-y-3">
                    <h4 className="text-base font-semibold tracking-tight text-foreground">
                        Envie sua sugestão
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Sua opinião ajuda a melhorar a plataforma.
                    </p>
                    <SuggestionModal />
                </div>
            </div>

            <Separator />

            {/* Social & Copyright */}
            <div className="footer-surface-bottom px-4 py-5">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                            <a href="https://x.com/casa_escritores" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                                <Twitter size={18} />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                            <a href="https://www.facebook.com/casadosescritores.site" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <Facebook size={18} />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                            <a href="https://www.instagram.com/casadosescritoresbr/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <Instagram size={18} />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                            <a href="https://www.threads.com/@casadosescritoresbr" target="_blank" rel="noopener noreferrer" aria-label="Threads">
                                <AtSign size={18} />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                            <a href="https://t.me/+FrvBVge4LzM5NTMx" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                                <Send size={18} />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                            <a href="https://chat.whatsapp.com/Jy6VanawHRXLnRAYshuJgo" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                <MessageCircle size={18} />
                            </a>
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        &copy; {year} Casa dos Escritores. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
