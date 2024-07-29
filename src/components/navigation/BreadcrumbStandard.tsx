"use client";

import React from 'react';
import Link from 'next/link';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { sanitizeSlug, cn, generateSlug } from '@/lib/utils';

interface BreadcrumbStandardProps {
    seriesTitle?: string;
    seriesId?: string;
    seriesSlug?: string;
    pageTitle: string;
    isMobile?: boolean;
    className?: string;
}

export default function BreadcrumbStandard({
    seriesTitle,
    seriesId,
    seriesSlug,
    pageTitle,
    isMobile = false,
    className
}: BreadcrumbStandardProps) {
    const isSeriesHubVisible = !!seriesId || seriesTitle === "Séries Hub";

    // Determine if we are on the series page itself
    const isOnSeriesPage = seriesTitle && seriesTitle === pageTitle;

    return (
        <Breadcrumb className={cn(isMobile ? "flex-1 min-w-0" : "hidden sm:block", className)}>
            <BreadcrumbList className={cn(isMobile && "flex-nowrap")}>
                <BreadcrumbItem className={cn(isMobile && "shrink-0")}>
                    <BreadcrumbLink asChild>
                        <Link href="/" className={cn(isMobile && "text-xs")}>Início</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className={cn(isMobile && "shrink-0")} />

                {/* Séries Hub - Always show if we have a series related context */}
                {isSeriesHubVisible && (
                    <>
                        <BreadcrumbItem className={cn(isMobile && "shrink-0")}>
                            <BreadcrumbLink asChild>
                                <Link href="/series" className={cn(isMobile && "text-xs")}>Séries Hub</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className={cn(isMobile && "shrink-0")} />
                    </>
                )}


                {/* Series Title (if on a chapter or sub-page) */}
                {seriesTitle && !isOnSeriesPage && (
                    <>
                        <BreadcrumbItem className={cn(isMobile && "min-w-0")}>
                            <BreadcrumbLink asChild>
                                <Link
                                    href={seriesSlug ? `/series/${seriesSlug}` : (seriesId ? `/series/${generateSlug(seriesTitle, seriesId)}` : `/series/${sanitizeSlug(seriesTitle)}`)}
                                    className={cn(
                                        "truncate block",
                                        isMobile ? "max-w-[80px] text-xs" : "max-w-[200px]"
                                    )}
                                >
                                    {seriesTitle}
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className={cn(isMobile && "shrink-0")} />
                    </>
                )}

                {/* Current Page */}
                <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className={cn(
                        "truncate block font-bold text-foreground",
                        isMobile ? "max-w-[120px] text-xs" : "max-w-[300px]"
                    )}>
                        {pageTitle}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}
