"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    href?: string;
    label?: string;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

/**
 * Botão de voltar padronizado para toda a aplicação
 * Usa o padrão Shadcn/UI Button com variant="ghost"
 */
export function BackButton({ href, label, className }: BackButtonProps) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className={cn(
                "h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors flex-shrink-0",
                className
            )}
            title={label || "Voltar"}
        >
            <ArrowLeft className="h-5 w-5" />
        </Button>
    );
}

export default BackButton;
