"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    isLast?: boolean;
}

export default function AccordionSection({
    title,
    children,
    defaultOpen = false,
    isLast = false,
}: AccordionSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="lg:border-0">
            {/* Header - Clickable only on mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-0 lg:py-0 lg:mb-4 lg:cursor-default"
            >
                {/* Shadcn H3 typography */}
                <h2 className="scroll-m-20 text-lg lg:text-xl font-semibold tracking-tight text-[#212121]">
                    {title}
                </h2>

                {/* Toggle icon - Only visible on mobile */}
                <ChevronDown
                    size={20}
                    className={cn(
                        "text-muted-foreground lg:hidden shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Content - Always visible on desktop, collapsible on mobile */}
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    "lg:!max-h-none lg:!opacity-100 lg:block",
                    isOpen ? "max-h-[3000px] opacity-100 pb-0 lg:pb-0" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
                )}
            >
                {children}
            </div>
        </div>
    );
}
