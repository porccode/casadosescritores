'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    MessageCircle,
    MoreHorizontal,
    Share2,
    Edit3,
    Trash2,
    BookOpen,
    ExternalLink,
    Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, formatDateTime, generateSlug } from '@/lib/utils';
import SeriesStatusBadge from '@/components/SeriesStatusBadge';

interface WorkManagerCardProps {
    id: string;
    title: string;
    type: 'story' | 'series';
    coverUrl?: string | null;
    chapterCount: number;
    createdAt: string;
    updatedAt: string;
    views: number;
    comments: number;
    isPublished?: boolean;
    isCompleted?: boolean;
    isOwnProfile?: boolean;
    onContinueWriting: () => void;
    onEditDetails: () => void;
    onDelete: () => void;
    onShare: () => void;
}

export function WorkManagerCard(props: WorkManagerCardProps) {
    const { type, id, title } = props;
    const viewUrl = type === 'story'
        ? `/capitulo/${generateSlug(title, id)}`
        : `/series/${generateSlug(title, id)}`;

    return (
        <Card className="overflow-hidden bg-background border hover:bg-accent transition-colors group">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-3 gap-4">
                <WorkCover coverUrl={props.coverUrl} title={props.title} />

                <div className="flex-1 flex flex-col justify-center min-w-0 space-y-2">
                    <div className="space-y-0.5 min-w-0">
                        <Link
                            href={viewUrl}
                            className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate block whitespace-nowrap"
                            title={title}
                        >
                            {title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                            <span>{props.chapterCount} {props.chapterCount === 1 ? 'capítulo publicado' : 'capítulos publicados'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Atualizado há {formatDistanceToNow(new Date(props.updatedAt))}
                        </p>
                    </div>

                    <WorkStats
                        views={props.views}
                        comments={props.comments}
                        createdAt={props.createdAt}
                        isPublished={props.isPublished}
                        isCompleted={props.isCompleted}
                    />
                </div>

                <WorkActions
                    isOwnProfile={props.isOwnProfile}
                    viewUrl={viewUrl}
                    onContinueWriting={props.onContinueWriting}
                    onEditDetails={props.onEditDetails}
                    onDelete={props.onDelete}
                    onShare={props.onShare}
                />
            </div>
        </Card>
    );
}

function WorkCover({ coverUrl, title }: { coverUrl?: string | null, title: string }) {
    return (
        <div className="relative w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-md overflow-hidden bg-muted border self-center sm:self-auto shadow-sm">
            {coverUrl ? (
                <Image
                    src={coverUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/30">
                    <BookOpen size={32} />
                </div>
            )}
        </div>
    );
}

function WorkStats({
    views,
    comments,
    createdAt,
    isPublished = true,
    isCompleted = false
}: {
    views: number;
    comments: number;
    createdAt: string;
    isPublished?: boolean;
    isCompleted?: boolean;
}) {
    return (
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground pt-1">
            {/* Removed Views */}
            <div className="flex items-center gap-1.5" title="Comentários">
                <MessageCircle size={14} className="text-muted-foreground/70" />
                <span className="text-xs font-medium tabular-nums">{comments}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground/60 border-l pl-4" title="Data de criação">
                <div className="flex items-center gap-1.5">
                    <Clock size={13} />
                    <span className="text-xs">{formatDateTime(createdAt)}</span>
                </div>

                <div className="flex items-center gap-2">
                    {!isPublished && (
                        <Badge variant="warning" className="px-1.5 py-0 text-[9px] font-bold h-4">
                            Rascunho
                        </Badge>
                    )}
                    {isCompleted !== undefined && isPublished && (
                        <SeriesStatusBadge isCompleted={isCompleted} size="sm" />
                    )}
                </div>
            </div>
        </div>
    );
}

function WorkActions({
    isOwnProfile,
    viewUrl,
    onContinueWriting,
    onEditDetails,
    onDelete,
    onShare
}: {
    isOwnProfile?: boolean;
    viewUrl: string;
    onContinueWriting: () => void;
    onEditDetails: () => void;
    onDelete: () => void;
    onShare: () => void;
}) {
    return (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 sm:pt-0">
            {isOwnProfile && (
                <Button
                    variant="default"
                    size="sm"
                    className="h-9 px-6 font-bold text-xs shadow-sm"
                    onClick={onContinueWriting}
                >
                    Continuar escrevendo
                </Button>
            )}

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-muted-foreground hover:text-primary hover:border-primary font-medium text-xs px-3 transition-colors"
                    onClick={onShare}
                >
                    <Share2 size={14} />
                    Compartilhar
                </Button>

                {isOwnProfile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                            >
                                <MoreHorizontal size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={viewUrl} target="_blank" className="flex items-center cursor-pointer">
                                    <ExternalLink size={14} className="mr-2" />
                                    Visualizar
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onEditDetails} className="cursor-pointer">
                                <Edit3 size={14} className="mr-2" />
                                Editar Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer"
                            >
                                <Trash2 size={14} className="mr-2" />
                                Excluir Série
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
