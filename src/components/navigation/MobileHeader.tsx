"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateSlug, sanitizeSlug, formatTitle, cn } from '@/lib/utils';
import Link from 'next/link';
import BreadcrumbStandard from './BreadcrumbStandard';
import { BackButton } from '@/components/ui/back-button';

interface MobileHeaderProps {
    seriesTitle?: string;
    seriesId?: string;
    pageTitle: string; // Título atual (ex: Capítulo 1, Editando, Novo)
    backHref?: string;
    onBack?: () => void;
    actions?: React.ReactNode;
}

export default function MobileHeader({
    seriesTitle,
    seriesId,
    pageTitle,
    backHref,
    onBack,
    actions
}: MobileHeaderProps) {
    const handleBackClick = (e: React.MouseEvent) => {
        if (onBack) {
            e.preventDefault();
            onBack();
        }
    };

    const backButton = (
        <BackButton
            href={!onBack ? backHref : undefined}
            onClick={onBack}
            className="-ml-2 mr-1"
        />
    );

    return (
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg border-b border-border md:hidden">
            <div className="px-0 flex items-center justify-between h-14">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    {backButton}

                    <BreadcrumbStandard
                        isMobile
                        seriesTitle={seriesTitle}
                        seriesId={seriesId}
                        pageTitle={pageTitle}
                    />
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {actions}
                </div>
            </div>
        </header>
    );
}
