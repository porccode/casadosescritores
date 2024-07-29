"use client";

import { cn } from "@/lib/utils";

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Whether to apply a default top padding to account for fixed headers if applicable. */
    withHeader?: boolean;
}

/**
 * PageLayout - The root structure for pages.
 * Ensures that children (usually Sections) are laid out correctly.
 */
export function PageLayout({
    withHeader = false,
    className,
    children,
    ...props
}: PageLayoutProps) {
    return (
        <div
            className={cn(
                "flex flex-col min-h-screen",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
