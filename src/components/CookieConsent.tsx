"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Cookie } from "lucide-react";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verificar se o usuário já deu consentimento no passado
        const hasConsent = localStorage.getItem("cde_cookie_consent");
        if (!hasConsent) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cde_cookie_consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-safe border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
            <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Cookie className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold mb-1">Valorizamos sua privacidade</p>
                        <p className="text-muted-foreground leading-relaxed">
                            Utilizamos cookies essenciais para garantir que você tenha a melhor experiência na Casa dos Escritores, 
                            permitindo o login seguro e a proteção da sua conta. Ao continuar navegando, você concorda com a nossa{" "}
                            <Link href="/politica-de-privacidade" className="font-medium text-primary hover:underline">
                                Política de Privacidade
                            </Link>{" "}
                            e{" "}
                            <Link href="/terms" className="font-medium text-primary hover:underline">
                                Termos de Uso
                            </Link>.
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 w-full md:w-auto items-center gap-3">
                    <Button 
                        onClick={acceptCookies} 
                        className="w-full md:w-auto font-medium"
                    >
                        Entendi e Aceito
                    </Button>
                </div>
            </div>
        </div>
    );
}
