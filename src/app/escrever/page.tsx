"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import UniversalContentEditor from "@/components/content/UniversalContentEditor";

function WriteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Detect parameters - if any exist, go to editor
    const action = searchParams.get("action");
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const seriesId = searchParams.get("seriesId");

    const hasParams = action || type || id || seriesId;

    // If no parameters, redirect to create new work
    useEffect(() => {
        if (!hasParams) {
            router.replace("/escrever?type=series");
        }
    }, [hasParams, router]);

    // Show loading while redirecting or render editor
    if (!hasParams) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <PenLine className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Preparando editor...</span>
                </div>
            </div>
        );
    }

    return <UniversalContentEditor />;
}

export default function WritePage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <PenLine className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Preparando editor...</span>
                </div>
            </div>
        }>
            <WriteContent />
        </Suspense>
    );
}

