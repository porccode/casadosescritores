"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ScrollRestoration
 * 
 * Garante que toda troca de rota inicie com o scroll no topo da página.
 * O Next.js App Router não faz isso automaticamente em todos os cenários
 * (ex: navegação por histórico, troca de rota com estado preservado).
 */
export default function ScrollRestoration() {
    const pathname = usePathname();

    useEffect(() => {
        // Executa após o render, garantindo que o conteúdo já foi montado
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);

    return null;
}
