"use client";

import React from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ContentTitleHeaderProps {
    title: string;
    setTitle?: (title: string) => void;
    author?: {
        username: string;
        id: string;
    };
    createdAt?: string | null;
    chapterNumber?: number;
    isEditable?: boolean;
    className?: string;
    placeholder?: string;
    error?: string;
}

export default function ContentTitleHeader({
    title,
    setTitle,
    author,
    createdAt,
    chapterNumber,
    isEditable = false,
    className,
    placeholder = "Título",
    error
}: ContentTitleHeaderProps) {
    const formatDate = (date: string | null) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className={cn("mb-6 space-y-1", className)}>
            {isEditable ? (
                <div className="flex flex-col gap-1 w-full">
                    <div className="relative w-full">
                        <Input
                            value={title}
                            onChange={(e) => setTitle?.(e.target.value)}
                            placeholder="Escreva aqui o título do seu capítulo"
                            className={cn(
                                "scroll-m-20 text-2xl md:text-4xl font-extrabold tracking-tight shadow-none focus-visible:ring-0 px-0 bg-transparent h-auto py-2 relative z-10",
                                error ? "border-b-2 border-destructive rounded-none focus-visible:border-destructive" : "border-none"
                            )}
                        />
                        {/* Fake inline placeholder for chapters */}
                        {/^Capítulo \d+ - $/.test(title) && (
                            <div 
                                className="absolute top-0 left-0 pointer-events-none z-0 px-0 py-2 scroll-m-20 text-2xl md:text-4xl font-extrabold tracking-tight w-full flex items-center"
                                aria-hidden="true"
                            >
                                <span className="opacity-0 whitespace-pre">{title}</span>
                                <span className="text-destructive animate-pulse opacity-80">DIGITE AQUI O NOME DO CAPÍTULO</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm font-medium text-destructive mt-1">
                            {error.replace('Título Inválido: ', '')}
                        </p>
                    )}
                </div>
            ) : (
                <>
                    <h1 className="scroll-m-20 text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
                        {title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {author && (
                            <Link
                                href={`/profile/${encodeURIComponent(author.username)}`}
                                className="font-medium text-foreground hover:underline"
                            >
                                {author.username}
                            </Link>
                        )}
                        {createdAt && (
                            <>
                                <span>·</span>
                                <span>{formatDate(createdAt)}</span>
                            </>
                        )}
                        {chapterNumber !== undefined && (
                            <>
                                <span>·</span>
                                <span>Cap. {chapterNumber}</span>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
