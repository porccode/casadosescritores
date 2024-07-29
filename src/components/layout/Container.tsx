"use client";

import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Use the semantic container-base class. Defaults to true. */
    base?: boolean;
}

/**
 * Container - Handles width and horizontal padding.
 * Follows the principle: No vertical spacing here.
 */
export function Container({
    base = true,
    className,
    children,
    ...props
}: ContainerProps) {
    return (
        <div
            className={cn(
                base && "container-base",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
