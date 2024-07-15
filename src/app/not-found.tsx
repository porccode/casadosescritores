import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-6">
            <div className="space-y-4 text-center">
                <p className="text-sm font-semibold text-muted-foreground">
                    Erro 404
                </p>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Página não encontrada
                </h1>
                <p className="max-w-[450px] mx-auto text-muted-foreground leading-relaxed">
                    A página ou história que você está procurando não existe ou foi movida temporariamente.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="default" size="lg">
                    <Link href="/">
                        Voltar para o Início
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/series">
                        Explorar Séries
                    </Link>
                </Button>
            </div>
        </div>
    );
}
