"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, BookOpen, ExternalLink, Archive, Loader2, ArchiveX, Calendar, Trash2, Pin, PinOff, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SeriesStatusBadge from "@/components/SeriesStatusBadge";
import { formatTitle } from "@/lib/utils";

interface ProfileItemCardProps {
    title: string;
    href: string;
    coverUrl?: string | null;
    subtitle?: string;
    metadata?: {
        views?: number;
        publishedAt?: string;
        chapterCount?: number;
    };
    status?: {
        isCompleted?: boolean;
        isArchived?: boolean;
        isDraft?: boolean;
        isAbandoned?: boolean;
        isPinned?: boolean;
    };
    actions: {
        isOwnContent?: boolean;
        onEdit?: () => void;
        onArchive?: () => void;
        onUnarchive?: () => void;
        onRemove?: () => void;
        onPin?: () => void;
        onUnpin?: () => void;
        isArchiving?: boolean;
        isUnarchiving?: boolean;
        isRemoving?: boolean;
        isPinning?: boolean;
    };
}

export default function ProfileItemCard({
    title,
    href,
    coverUrl,
    subtitle,
    metadata,
    status,
    actions
}: ProfileItemCardProps) {
    const formattedDate = metadata?.publishedAt
        ? new Date(metadata.publishedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        : null;

    return (
        <div className="flex items-center gap-3 py-3 px-3 hover:bg-accent/50 rounded-lg group transition-colors">
            {/* Cover */}
            <Link
                href={href}
                target="_blank"
                className="relative w-14 h-[84px] shrink-0 rounded-sm overflow-hidden bg-muted border shadow-sm"
            >
                {coverUrl ? (
                    <Image src={coverUrl} alt={title} fill sizes="56px" className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/30">
                        <BookOpen className="size-5" />
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                    <Link
                        href={href}
                        target="_blank"
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                        {formatTitle(title)}
                    </Link>
                    {subtitle && (
                        <span className="text-[11px] text-muted-foreground/60 font-medium">
                            • {subtitle}
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                    {metadata?.chapterCount !== undefined && (
                        <span>{metadata.chapterCount} {metadata.chapterCount === 1 ? "capítulo" : "capítulos"}</span>
                    )}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {(status?.isCompleted !== undefined || status?.isDraft) && (
                        <SeriesStatusBadge 
                            isCompleted={status.isCompleted} 
                            isDraft={status.isDraft} 
                            size="sm" 
                            className="h-5 px-2 text-[10px] font-bold uppercase tracking-tight"
                        />
                    )}
                    {status?.isArchived && (
                        <Badge 
                            variant="secondary" 
                            className="bg-muted text-muted-foreground/80 h-5 px-2 text-[10px] font-bold uppercase tracking-tight border-transparent"
                        >
                            Arquivado
                        </Badge>
                    )}
                    {status?.isAbandoned && (
                        <Badge 
                            variant="secondary" 
                            className="bg-amber-500/10 text-amber-600 h-5 px-2 text-[10px] font-bold uppercase tracking-tight border-amber-500/20"
                        >
                            Abandonada
                        </Badge>
                    )}
                    {status?.isPinned && (
                        <Badge 
                            variant="secondary" 
                            className="bg-primary/10 text-primary h-5 px-2 text-[10px] font-bold uppercase tracking-tight border-primary/20 flex items-center gap-1"
                        >
                            <Pin className="size-2.5 fill-current" />
                            Fixado
                        </Badge>
                    )}
                </div>
            </div>

            {/* Desktop Meta Stats */}
            <div className="hidden sm:flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground min-w-[80px]">
                {formattedDate && (
                    <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formattedDate}
                    </span>
                )}
                {/* Removed Views */}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" asChild>
                    <Link href={href} target="_blank" title="Visualizar">
                        <ExternalLink className="size-4" />
                    </Link>
                </Button>

                {actions.isOwnContent && (
                    <>
                        {/* Pin/Unpin Action */}
                        {!status?.isArchived && !status?.isDraft && (
                            status?.isPinned ? (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="size-8 text-primary hover:text-primary/80" 
                                    onClick={actions.onUnpin} 
                                    disabled={actions.isPinning} 
                                    title="Desafixar"
                                >
                                    {actions.isPinning ? <Loader2 className="size-4 animate-spin" /> : <PinOff className="size-4" />}
                                </Button>
                            ) : (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="size-8 text-muted-foreground hover:text-primary" 
                                            disabled={actions.isPinning} 
                                            title="Fixar no Perfil"
                                        >
                                            <Pin className="size-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <Pin className="size-5 text-primary" />
                                                Fixar Obra no Perfil
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Deseja colocar esta obra em destaque no seu perfil? 
                                                Ela aparecerá no topo da sua lista de séries e poderá ser exibida no seu card de destaque lateral.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Agora não</AlertDialogCancel>
                                            <AlertDialogAction onClick={actions.onPin}>
                                                Sim, fixar agora
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )
                        )}

                        {actions.onEdit && (
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" onClick={actions.onEdit} title="Editar">
                                <Pencil className="size-4" />
                            </Button>
                        )}
                        {actions.onArchive && (
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-warning" onClick={actions.onArchive} disabled={actions.isArchiving} title="Arquivar">
                                {actions.isArchiving ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
                            </Button>
                        )}
                        {actions.onUnarchive && (
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" onClick={actions.onUnarchive} disabled={actions.isUnarchiving} title="Desarquivar">
                                {actions.isUnarchiving ? <Loader2 className="size-4 animate-spin" /> : <ArchiveX className="size-4" />}
                            </Button>
                        )}
                        {actions.onRemove && (
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={actions.onRemove} disabled={actions.isRemoving} title="Remover">
                                {actions.isRemoving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
