import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
    return (
        <div className="space-y-12 pb-20">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight">
                    Central de Ajuda & Documentação
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Explore nossos guias e tutoriais para dominar todas as ferramentas da Casa dos Escritores.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Começando */}
                <Card className="hover:border-primary/30 transition-all">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold border-b pb-2">Começando</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/docs/cadastro-e-perfil" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Cadastro e Gestão de Perfil
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/sistema-de-xp" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Como funciona o Sistema de XP
                                </Link>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Criação */}
                <Card className="hover:border-primary/30 transition-all">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold border-b pb-2">Criação de Conteúdo</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/docs/series-e-obras" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Guia de Séries e Obras
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/capitulos-e-edicao" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Usando o Editor e Revisão
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/escrita-assistida" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Escrita Assistida por IA
                                </Link>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Comunidade */}
                <Card className="hover:border-primary/30 transition-all">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold border-b pb-2">Comunidade e Viralização</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/docs/posts-e-interacao" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Feed Literário e Interação
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/busca-e-rankings" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Como subir nos Rankings
                                </Link>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Plataforma */}
                <Card className="hover:border-primary/30 transition-all">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold border-b pb-2">Regras e Políticas</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/docs/regras-de-uso" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Termos e Regras de Uso
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/regras-de-publicacao" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Diretrizes de Publicação
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/politica-de-privacidade" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Política de Privacidade (LGPD)
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/suporte-e-feedback" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Suporte e Enviar Feedback
                                </Link>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="p-10 rounded-xl border bg-muted/40 text-center space-y-4">
                <h2 className="text-2xl font-bold">Pronto para publicar sua primeira história?</h2>
                <p className="text-muted-foreground max-w-[600px] mx-auto">
                    A Casa dos Escritores é o lugar onde suas ideias ganham vida. Junte-se a milhares de outros autores agora mesmo.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Button size="lg" asChild>
                        <Link href="/escrever?action=new&type=series">Começar a Escrever</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/series">Explorar Obras</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
