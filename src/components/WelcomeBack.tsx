"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, X, Sparkles, BookOpen, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WelcomeBack() {
    const searchParams = useSearchParams();
    const [show, setShow] = useState(false);
    const [name, setName] = useState("");

    useEffect(() => {
        if (searchParams.get("ref") === "welcome_back") {
            setName(searchParams.get("name") || "");

            const timer = setTimeout(() => {
                setShow(true);
            }, 1000);

            if (window.history.replaceState) {
                const url = new URL(window.location.href);
                url.searchParams.delete("ref");
                url.searchParams.delete("name");
                window.history.replaceState({}, "", url.toString());
            }

            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-background rounded-xl max-w-md w-full overflow-hidden border border-primary/10"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary to-primary-foreground/0 opacity-10" />

                        <div className="p-8 pt-12 text-center">
                            <div className="w-20 h-20 bg-gradient-to-tr from-primary to-primary/60 rounded-xl flex items-center justify-center mx-auto mb-6 rotate-3">
                                <PartyPopper className="text-primary-foreground" size={40} />
                            </div>

                            <div className="space-y-2 mb-8 text-center">
                                <h2 className="text-2xl font-bold tracking-tight border-none pb-0">
                                    É muito bom ter você de volta{name ? `, ${name}` : ""}! ✍️
                                </h2>
                                <p className="text-muted-foreground text-sm leading-relaxed px-2">
                                    A comunidade sentiu sua falta. Para celebrar seu retorno, creditamos{" "}
                                    <span className="font-semibold text-primary">25 pontos de presente</span>{" "}
                                    na sua conta!
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6 px-4">
                                <div className="p-4 bg-muted/40 rounded-2xl border border-border">
                                    <BookOpen className="text-primary/60 mx-auto mb-1.5" size={16} />
                                    <span className="text-xs font-medium text-muted-foreground">Histórias</span>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-2xl border border-border">
                                    <Sparkles className="text-amber-500/60 mx-auto mb-1.5" size={16} />
                                    <span className="text-xs font-medium text-muted-foreground">Inspiração</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => setShow(false)}
                                className="w-full font-semibold"
                                size="lg"
                            >
                                Vamos lá!
                            </Button>

                            <p className="mt-4 text-[10px] text-gray-400 font-medium tracking-wider">
                                <Heart size={10} className="inline mb-0.5 text-red-400" /> Com carinho, equipe Casa dos Escritores
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShow(false)}
                            className="absolute top-3 right-3 h-8 w-8 rounded-full text-muted-foreground"
                            aria-label="Fechar"
                        >
                            <X size={16} />
                        </Button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
