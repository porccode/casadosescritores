// src/components/providers/SWRProvider.tsx
"use client";

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
    children: ReactNode;
}

export default function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig
            value={{
                // Cache global por 5 minutos
                dedupingInterval: 60000,
                // Não revalidar no foco para evitar requests desnecessários
                revalidateOnFocus: false,
                // Retry com backoff exponencial
                errorRetryInterval: 5000,
                errorRetryCount: 3,
                // Manter dados anteriores durante revalidação
                keepPreviousData: true,
                // Provider de cache em memória (padrão)
                provider: () => new Map(),
            }}
        >
            {children}
        </SWRConfig>
    );
}
