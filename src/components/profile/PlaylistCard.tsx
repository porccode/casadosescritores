"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, MoreVertical, Pencil, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlaylistCardProps {
    id: string;
    name: string;
    description?: string | null;
    isPublic: boolean;
    coverUrl?: string | null;
    itemCount?: number;
    onClick?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
}

export default function PlaylistCard({
    id,
    name,
    description,
    isPublic,
    coverUrl,
    itemCount = 0,
    onClick,
    onDelete,
    onEdit
}: PlaylistCardProps) {
    const isFixed = name.toLowerCase() === "capítulos salvos" || name.toLowerCase() === "arquivados";

    return (
        <Card
            className="cursor-pointer hover:bg-accent"
            onClick={onClick}
        >
            <div className="flex items-center justify-between p-3">
                {/* Content */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground truncate">
                        {name}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                            {itemCount} {itemCount === 1 ? "item" : "itens"}
                        </Badge>
                        {isFixed && (
                            <Lock className="size-3.5 text-muted-foreground" />
                        )}
                    </div>
                </div>

                {/* Actions */}
                {!isFixed && (onEdit || onDelete) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground shrink-0"
                            >
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onEdit && (
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}>
                                    <Pencil className="size-4 mr-2" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    Excluir
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </Card>
    );
}
