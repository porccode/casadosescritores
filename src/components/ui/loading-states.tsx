"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
export { Skeleton };
import { Container } from "@/components/layout/Container";
import { Separator } from "./separator";

/**
 * 1. SPINNERS
 */

interface LoadingSpinnerProps {
    /** Size variant */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** Optional loading message */
    message?: string;
    /** Whether to show as fullscreen overlay */
    fullScreen?: boolean;
    /** Additional CSS classes */
    className?: string;
}

const sizeMap = {
    xs: { spinner: "w-4 h-4", border: "border-2", text: "text-xs" },
    sm: { spinner: "w-6 h-6", border: "border-2", text: "text-sm" },
    md: { spinner: "w-10 h-10", border: "border-3", text: "text-base" },
    lg: { spinner: "w-14 h-14", border: "border-4", text: "text-lg" },
    xl: { spinner: "w-20 h-20", border: "border-4", text: "text-xl" },
};

export function LoadingSpinner({
    size = "md",
    message,
    fullScreen = false,
    className,
}: LoadingSpinnerProps) {
    const { spinner, border, text } = sizeMap[size];

    const spinnerElement = (
        <div className={cn("flex flex-col items-center gap-4", className)}>
            <div className="relative">
                <div
                    className={cn(
                        spinner,
                        border,
                        "rounded-full border-primary/10"
                    )}
                />
                <div
                    className={cn(
                        "absolute inset-0",
                        spinner,
                        border,
                        "rounded-full border-transparent border-t-primary animate-spin"
                    )}
                />
            </div>

            {message && (
                <div className="flex flex-col items-center gap-2">
                    <p className={cn("font-bold text-muted-foreground", text, "font-sans")}>{message}</p>
                    <div className="flex items-center gap-1">
                        <span
                            className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                    </div>
                </div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                {spinnerElement}
            </div>
        );
    }

    return spinnerElement;
}

/**
 * Inline button spinner - for use inside buttons
 */
export function ButtonSpinner({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin",
                className
            )}
        />
    );
}

/**
 * Page loading wrapper - centers content on the page
 */
export function PageLoading({
    message,
    className,
}: {
    message?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center min-h-[calc(100vh-64px)]",
                className
            )}
        >
            <LoadingSpinner size="lg" message={message} />
        </div>
    );
}

/**
 * 2. SKELETONS
 */

export function ReaderSkeleton() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background pb-12">
            <div className="w-full h-16 border-b flex items-center px-4 md:px-8">
                <Skeleton className="h-6 w-32" />
                <div className="ml-auto flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
            <Container className="max-w-3xl py-12">
                <div className="space-y-4 mb-8 text-center flex flex-col items-center">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-10 w-3/4 md:w-1/2" />
                    <div className="flex items-center gap-2 mt-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="space-y-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[98%]" />
                    <Skeleton className="h-4 w-[95%]" />
                    <Skeleton className="h-4 w-full" />
                    <div className="py-4"></div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[92%]" />
                    <Skeleton className="h-4 w-[96%]" />
                    <div className="py-4"></div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </Container>
        </div>
    );
}

export function SeriesSkeleton() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background">
            <div className="w-full h-16 border-b flex items-center px-4 md:px-12 bg-white">
                <Skeleton className="h-5 w-48" />
            </div>

            <div className="max-w-[75rem] mx-auto px-4 lg:px-0 mt-8 pb-12">
                <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8 mt-12">
                    <div className="hidden md:block w-56 lg:w-64 shrink-0">
                        <Skeleton className="w-full aspect-[2/3] rounded-xl" />
                    </div>
                    <div className="md:hidden w-full flex justify-center mb-6">
                        <Skeleton className="w-40 aspect-[2/3] rounded-xl" />
                    </div>

                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-10 w-3/4 md:w-1/2" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <div className="pt-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="pt-6 flex gap-3">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-10" />
                            <Skeleton className="h-10 w-10" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-start mt-12 gap-y-8">
                    <div className="w-full md:w-[calc(40%-1rem)] md:mr-4 space-y-4">
                        <Skeleton className="h-8 w-40 mb-4" />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                    <div className="w-full md:w-[60%] space-y-6">
                        <Skeleton className="h-8 w-32 mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-16 w-full rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ProfileSkeleton() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background pb-20">
            <div className="w-full h-16 border-b flex items-center px-4 md:px-12 bg-white mb-8">
                <Skeleton className="h-5 w-32" />
            </div>

            <Container>
                <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                    <Skeleton className="w-32 h-32 rounded-full shrink-0" />
                    <div className="space-y-4 flex-1 w-full">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                        <div className="flex gap-4 pt-2">
                            <Skeleton className="h-10 w-24 rounded-md" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex gap-4 mb-8 overflow-hidden">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden border">
                            <Skeleton className="w-full h-full" />
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    )
}

/**
 * Reusable skeleton for ContentCard
 */
export function ContentCardSkeleton({ variant = "compact" }: { variant?: "cover" | "compact" | "horizontal" }) {
    if (variant === "horizontal") {
        return (
            <div className="flex gap-4 p-4 rounded-xl border-none bg-muted/20 animate-pulse">
                <Skeleton className="w-24 md:w-32 aspect-[2/3] rounded-2xl shrink-0" />
                <div className="flex-1 py-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                </div>
            </div>
        )
    }

    if (variant === "cover") {
        return (
            <div className="space-y-3">
                <Skeleton className="w-full aspect-[2/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        )
    }

    // Default compact
    return (
        <div className="p-4 rounded-xl bg-muted/20 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-16" />
                </div>
            </div>
        </div>
    )
}

/**
 * Generic list skeleton for notifications, followers, etc.
 */
export function ContentListSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="w-full">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 items-center border-b last:border-none">
                    <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}
