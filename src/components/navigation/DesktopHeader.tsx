"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateSlug, sanitizeSlug, formatTitle } from "@/lib/utils";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BreadcrumbStandard from './BreadcrumbStandard';
import { BackButton } from '@/components/ui/back-button';

interface DesktopHeaderProps {
    seriesTitle?: string;
    seriesId?: string;
    seriesSlug?: string;
    pageTitle: string;
    onBack?: () => void;
    actions?: React.ReactNode;
    breadcrumbExtra?: React.ReactNode;
}

export default function DesktopHeader({
    seriesTitle,
    seriesId,
    seriesSlug,
    pageTitle,
    onBack,
    actions,
    breadcrumbExtra
}: DesktopHeaderProps) {
    const router = useRouter();
    const handleBack = onBack || (() => router.back());

    const backHref = seriesSlug ? `/series/${seriesSlug}` : (seriesId ? `/series/${generateSlug(seriesTitle || '', seriesId)}` : undefined);

    return (
        <header className="hidden md:flex h-14 border-b bg-background sticky top-0 z-30">
        <div className="w-full max-w-[75rem] mx-auto h-full flex items-center justify-between px-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <BackButton
                        href={backHref}
                        onClick={onBack}
                    />

                    <BreadcrumbStandard
                        seriesTitle={seriesTitle}
                        seriesId={seriesId}
                        seriesSlug={seriesSlug}
                        pageTitle={pageTitle}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {actions}
                </div>
            </div>
        </header>
    );
}
