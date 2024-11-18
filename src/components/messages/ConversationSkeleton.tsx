"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton animado para um item da lista de conversas.
 */
function ConversationItemSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-2.5 w-10 rounded" />
                </div>
                <Skeleton className="h-3 w-40 rounded" />
            </div>
        </div>
    );
}

/**
 * Skeleton para a lista de conversas completa (estado de carregamento inicial).
 */
export function ConversationListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="py-1">
            {Array.from({ length: count }).map((_, i) => (
                <ConversationItemSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton para a janela de mensagens (enquanto as mensagens carregam).
 */
export function MessageWindowSkeleton() {
    return (
        <div className="flex flex-col gap-3 px-4 py-6 max-w-2xl mx-auto w-full">
            {/* Mensagens recebidas */}
            <div className="flex justify-start mt-3">
                <Skeleton className="h-9 w-48 rounded-2xl rounded-tl-md" />
            </div>
            <div className="flex justify-start mt-0.5">
                <Skeleton className="h-9 w-64 rounded-2xl rounded-bl-md" />
            </div>

            {/* Mensagens enviadas */}
            <div className="flex justify-end mt-3">
                <Skeleton className="h-9 w-56 rounded-2xl rounded-tr-md" />
            </div>
            <div className="flex justify-end mt-0.5">
                <Skeleton className="h-9 w-36 rounded-2xl" />
            </div>
            <div className="flex justify-end mt-0.5">
                <Skeleton className="h-9 w-48 rounded-2xl rounded-br-md" />
            </div>

            {/* Mensagem recebida */}
            <div className="flex justify-start mt-3">
                <Skeleton className="h-9 w-52 rounded-2xl" />
            </div>

            {/* Enviadas */}
            <div className="flex justify-end mt-3">
                <Skeleton className="h-9 w-40 rounded-2xl" />
            </div>
        </div>
    );
}
