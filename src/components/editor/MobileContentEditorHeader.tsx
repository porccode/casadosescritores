"use client";

import React from 'react';
import { ArrowLeft, Save, Send, RefreshCw, Loader2, Bookmark, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, generateSlug } from '@/lib/utils';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import MobileHeader from '@/components/navigation/MobileHeader';

interface MobileContentEditorHeaderProps {
    title: string;
    seriesTitle?: string;
    seriesId?: string;
    onBack: () => void;
    onSave?: () => void;
    isSaving?: boolean;
    action: 'edit' | 'create';
    type?: 'series' | 'chapter';
}

export default function MobileContentEditorHeader({
    title,
    seriesTitle,
    seriesId,
    onBack,
    onSave,
    isSaving = false,
    action,
    type
}: MobileContentEditorHeaderProps) {
    const isEditing = action === 'edit';
    const isSeries = type === 'series';

    const pageTitle = isEditing
        ? (isSeries ? 'Editar Série' : 'Editando')
        : (isSeries ? 'Nova Série' : 'Novo');

    const actions = onSave ? (
        <div className="flex items-center gap-1">
            <Button
                size="sm"
                variant="default"
                onClick={onSave}
                disabled={isSaving}
                className="h-8 px-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full uppercase tracking-wider shadow-sm flex items-center gap-2"
            >
                {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    isEditing ? <RefreshCw className="h-3 w-3" /> : <Send className="h-3 w-3" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
        </div>
    ) : undefined;

    return (
        <MobileHeader
            seriesTitle={seriesTitle}
            seriesId={seriesId}
            pageTitle={pageTitle}
            onBack={onBack}
            actions={actions}
        />
    );
}
