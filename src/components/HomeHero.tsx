"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/Section";

interface HomeHeroProps {
    isLoggedIn?: boolean;
}

export default function HomeHero({ isLoggedIn }: HomeHeroProps) {
    if (isLoggedIn) return null;

    return (
        <Section size="sm" container>
            <div className="rounded-xl border bg-card p-6 md:p-10 text-center flex flex-col items-center gap-4 shadow-sm">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground max-w-2xl">
                    O espaço para quem escreve e lê literatura independente
                </h1>

                <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
                    Publique suas séries, contos e livros em uma comunidade gratuita. Conecte-se com leitores e acompanhe suas métricas sem custos ou limites.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button asChild>
                        <Link href="/escrever">Começar a escrever</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/series">Explorar biblioteca</Link>
                    </Button>
                </div>
            </div>
        </Section>
    );
}

