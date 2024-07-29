"use client";

import { cn } from "@/lib/utils";

type StackSpacing = 4 | 8 | 12 | 16 | 0;

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Vertical (col) or horizontal (row) flow. Defaults to "col". */
    direction?: "col" | "row";
    /** Spacing between items. Follows the mandatory scale: 4, 8, 12, 16. Defaults to 4. */
    gap?: StackSpacing;
}

const gapMap: Record<StackSpacing, string> = {
    0: "gap-0",
    4: "gap-4",
    8: "gap-8",
    12: "gap-12",
    16: "gap-16",
};

/**
 * Stack - Handles internal flow and spacing between components.
 */
export function Stack({
    direction = "col",
    gap = 4,
    className,
    children,
    ...props
}: StackProps) {
    return (
        <div
            className={cn(
                "flex",
                direction === "col" ? "flex-col" : "flex-row",
                gapMap[gap],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
