"use client";

import React from "react";
import { ArrowLeft, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

interface MobilePageHeaderProps {
    title: string;
    onBack: () => void;
    action?: {
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        disabled?: boolean;
        show?: boolean;
    };
}

export default function MobilePageHeader({ title, onBack, action }: MobilePageHeaderProps) {
    return (
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4 md:hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BackButton onClick={onBack} />
                    <h1 className="text-lg font-bold text-foreground truncate max-w-[200px]">{title}</h1>
                </div>

                {action?.show && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className="text-primary hover:text-primary h-9"
                    >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                    </Button>
                )}
            </div>
        </header>
    );
}
