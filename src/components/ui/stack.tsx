"use client";

import { cn } from "@/lib/utils";

type GapSize = "xs" | "sm" | "md" | "lg" | "xl";

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Spacing between children. Defaults to "md" (24px). */
    gap?: GapSize;
    /** Center children horizontally. */
    center?: boolean;
}

const gapMap: Record<GapSize, string> = {
    xs: "gap-2",   // 8px
    sm: "gap-4",   // 16px
    md: "gap-6",   // 24px
    lg: "gap-8",   // 32px
    xl: "gap-12",  // 48px
};

/**
 * Stack - A vertical layout component using flexbox.
 * The primary way to organize content vertically in the Design System.
 *
 * @example
 * <Stack gap="md">
 *   <h1>Title</h1>
 *   <p>Description</p>
 *   <Button>Action</Button>
 * </Stack>
 */
export function Stack({
    gap = "md",
    center = false,
    className,
    children,
    ...props
}: StackProps) {
    return (
        <div
            className={cn(
                "flex flex-col",
                gapMap[gap],
                center && "items-center",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
