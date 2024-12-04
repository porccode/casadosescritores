"use client";

import React from "react";
import Link from "next/link";
import { Megaphone, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HomeAnnouncementHeroProps {
    announcement: {
        id: string;
        title: string;
        message: string;
        background_color?: string | null;
        text_color?: string | null;
        link_url?: string | null;
        link_label?: string | null;
        button_bg_color?: string | null;
        button_text_color?: string | null;
        end_date?: string | null;
    };
}

export default function HomeAnnouncementHero({ announcement }: HomeAnnouncementHeroProps) {
    // Verificar se expirou no cliente (caso o cache do servidor esteja levemente atrasado)
    const now = new Date();
    if (announcement.end_date && new Date(announcement.end_date) < now) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full overflow-hidden shadow-sm"
            style={{
                backgroundColor: announcement.background_color || "#494EB6",
                color: announcement.text_color || "#ffffff",
            }}
        >
            <div className="container-base py-6 sm:py-8 md:py-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                    <div className="flex-1 space-y-3 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 opacity-80 uppercase tracking-widest text-[10px] font-bold">
                            <Megaphone size={12} />
                            <span>Comunicado de Sistema</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
                            {announcement.title}
                        </h2>
                        <p className="text-sm sm:text-base opacity-90 max-w-2xl leading-relaxed">
                            {announcement.message}
                        </p>
                    </div>

                    {announcement.link_url && (
                        <div className="shrink-0">
                            <Button 
                                asChild
                                size="lg"
                                className="font-bold shadow-lg transition-transform hover:scale-105"
                                style={{
                                    backgroundColor: announcement.button_bg_color || "#ffffff",
                                    color: announcement.button_text_color || "#494EB6",
                                }}
                            >
                                <Link href={announcement.link_url} className="gap-2">
                                    {announcement.link_label || "Saiba Mais"}
                                    {announcement.link_url.startsWith('http') ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
