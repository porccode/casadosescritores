"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { getMediaUrl, cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface UserAvatarProps {
    /** URL da imagem do avatar */
    src?: string | null;
    /** Texto alternativo para acessibilidade */
    alt?: string;
    /** Tamanho do avatar em pixels */
    size?: number;
    /** Classes CSS adicionais */
    className?: string;
}

/**
 * Componente de avatar de usuário com fallback para inicial
 * Exibe a imagem do usuário ou um placeholder com a primeira letra do nome
 */
export default function UserAvatar({
    src,
    alt,
    size = 32,
    className = "",
}: UserAvatarProps): React.ReactElement {
    const initials = alt
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sizeClass = size <= 24 ? "h-6 w-6" : size <= 32 ? "h-8 w-8" : size <= 40 ? "h-10 w-10" : "h-12 w-12";

    return (
        <div className="relative inline-block">
            <Avatar className={cn(sizeClass, className)}>
                {src ? (
                    <OptimizedImage
                        src={getMediaUrl(src, 'avatars')}
                        alt={alt || ""}
                        fill
                        sizes={`${size}px`}
                        className="object-cover"
                        onError={() => { }} // Fallback to AvatarFallback will happen if hasError is true in OptimizedImage (though we might need to sync states)
                    />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {initials || <User className="h-4 w-4" />}
                </AvatarFallback>
            </Avatar>

        </div>
    );
}
