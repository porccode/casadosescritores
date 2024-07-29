"use client";

import { cn } from "@/lib/utils";
import { Container } from "./Container";

type SectionSize = "xs" | "sm" | "md" | "lg";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    /** Vertical padding size. Defaults to "md" (48px / py-12). */
    size?: SectionSize;
    /** Whether to wrap content in a Container. */
    container?: boolean;
}

const sizeMap: Record<SectionSize, string> = {
    xs: "section-xs", // my-1 (0.25rem)
    sm: "section-sm", // my-2 (0.5rem)
    md: "section",    // my-4/6 (1rem/1.5rem)
    lg: "section-lg", // my-6/8 (1.5rem/2rem)
};

/**
 * Section - The only component allowed to handle vertical spacing between blocks.
 */
export function Section({
    size = "md",
    container = false,
    className,
    children,
    ...props
}: SectionProps) {
    const sectionClasses = cn(sizeMap[size], className);

    if (container) {
        return (
            <section className={sectionClasses} {...props}>
                <Container>{children}</Container>
            </section>
        );
    }

    return (
        <section className={sectionClasses} {...props}>
            {children}
        </section>
    );
}
