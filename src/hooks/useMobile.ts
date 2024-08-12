"use client";

import { useState, useEffect } from "react";

/**
 * Hook centralizado para detecção de dispositivos móveis.
 * Padrão Shadcn/UI: 768px (md) é o divisor comum.
 */
export function useMobile(breakpoint: number = 768) {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Inicializar
        checkMobile();

        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, [breakpoint]);

    return isMobile;
}
