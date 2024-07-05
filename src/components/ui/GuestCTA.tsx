"use client";

import React from "react";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface GuestCTAProps {
    title?: string;
    description?: string;
}

export function GuestCTA({
    title = "Conteúdo Restrito",
    description = "Faça login ou crie uma conta gratuita para continuar lendo e interagindo com a comunidade."
}: GuestCTAProps) {
    const pathname = usePathname();
    const redirectTo = encodeURIComponent(pathname);

    return (
        <Card className="w-full rounded-lg border border-border shadow-none overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Lock size={32} />
                </div>

                <div className="space-y-4 w-full max-w-md">
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
                    <Button asChild className="w-full sm:flex-1 font-bold h-11 rounded-md" size="lg">
                        <Link href={`/login?redirectTo=${redirectTo}`}>
                            Entrar agora
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:flex-1 font-bold h-11 rounded-md border-border hover:bg-muted" size="lg">
                        <Link href={`/login?signup=true&redirectTo=${redirectTo}`}>
                            Criar conta grátis
                        </Link>
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Junte-se a milhares de escritores e leitores
                </p>
            </CardContent>
        </Card>
    );
}
