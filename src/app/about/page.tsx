import React from "react";
import { Users, Rocket, Heart, Globe } from "lucide-react";
import { LegalPageHeader } from "@/components/layout/LegalPageHeader";
import { LegalContainer } from "@/components/layout/LegalContainer";
import { PageLayout } from "@/components/layout/PageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sobre Nós | Casa dos Escritores",
    description: "Conectando corações e mentes através da arte da escrita. Conheça nossa missão, nossa comunidade de autores independentes e nossa visão de futuro.",
    alternates: {
        canonical: "https://casadosescritores.com.br/about",
    },
};

export default function AboutPage() {
    return (
        <PageLayout>
            <LegalPageHeader
                title="Sobre Nós"
                description="Conectando corações e mentes através da arte da escrita."
            />

            <LegalContainer asCard={false}>
                <div className="grid gap-8 md:grid-cols-2 not-prose">
                    <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
                        <Rocket className="h-10 w-10 text-primary" />
                        <h2 className="text-2xl font-bold">Nossa Missão</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Nossa meta é levar para as pessoas uma forma interessante e grátis de publicarem suas histórias, conversarem e trocarem experiências literárias. Queremos democratizar o acesso à publicação e dar voz a novos talentos.
                        </p>
                    </div>

                    <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
                        <Users className="h-10 w-10 text-primary" />
                        <h2 className="text-2xl font-bold">A Comunidade</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            A Casa dos Escritores é mais do que uma plataforma; é um lar para quem ama as palavras. Aqui, autores e leitores se encontram em um ambiente de apoio mútuo e crescimento constante.
                        </p>
                    </div>

                    <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
                        <Heart className="h-10 w-10 text-primary" />
                        <h2 className="text-2xl font-bold">Valores</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Acreditamos na originalidade, no respeito e na paixão. Valorizamos o trabalho árduo dos escritores e a curiosidade infinita dos leitores, mantendo sempre a transparência e a segurança de todos.
                        </p>
                    </div>

                    <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
                        <Globe className="h-10 w-10 text-primary" />
                        <h2 className="text-2xl font-bold">O Futuro</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Estamos em constante evolução, buscando novas tecnologias e ferramentas que tornem a experiência literária online cada vez mais rica, imersiva e acessível a todos.
                        </p>
                    </div>
                </div>

                <div className="text-center pt-12 border-t border-border mt-12">
                    <p className="text-sm text-muted-foreground italic">
                        "Cada palavra escrita é um passo em direção a um novo mundo."
                    </p>
                </div>
            </LegalContainer>
        </PageLayout>
    );
}
