"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoverLightboxProps {
    src: string | undefined;
    alt: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * CoverLightbox
 *
 * Wraps any series cover element with a click-to-expand lightbox.
 * Uses Shadcn Dialog to display the cover full-screen with smooth animations.
 *
 * NOTE: Uses native <img> inside the lightbox intentionally:
 * - next/image with `fill` requires a parent with known computed dimensions,
 *   which is unreliable inside a Dialog overlay (height collapses).
 * - The image is already cached by the browser from the cover below,
 *   so no extra network or Vercel image optimization requests are made.
 *   This is safe for Vercel and Supabase free plans.
 */
export function CoverLightbox({ src, alt, children, className }: CoverLightboxProps) {
    const [open, setOpen] = useState(false);

    if (!src) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Clickable Trigger Wrapper */}
            <div
                className={cn("relative group cursor-zoom-in", className)}
                onClick={() => setOpen(true)}
                role="button"
                aria-label={`Ampliar capa: ${alt}`}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpen(true);
                    }
                }}
            >
                {children}

                {/* Zoom hint overlay — appears on hover */}
                <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-sm rounded-full p-2.5">
                        <ZoomIn className="h-5 w-5 text-white" />
                    </div>
                </div>
            </div>

            {/* Lightbox Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    hideClose
                    className="p-0 border-0 bg-transparent shadow-none w-auto max-w-none flex items-center justify-center"
                    onClick={() => setOpen(false)}
                >
                    {/* Close button */}
                    <DialogClose
                        className="absolute top-4 right-4 z-50 rounded-full bg-black/60 backdrop-blur-sm p-2 text-white hover:bg-black/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Fechar</span>
                    </DialogClose>

                    {/* Native img: already cached by browser, zero extra optimization cost */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt}
                        onClick={(e) => e.stopPropagation()}
                        className="block max-h-[88vh] max-w-[88vw] md:max-w-[55vw] lg:max-w-[38vw] w-auto h-auto rounded-2xl shadow-2xl ring-1 ring-white/10 object-contain"
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
