"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { showXPToast } from "@/lib/xp-toast";
import { XP_CONFIG } from "@/config/xp";

interface ReadingTrackerProps {
    chapterId: string;
    seriesId: string;
    userId: string | null;
}

export default function ReadingTracker({ chapterId, seriesId, userId }: ReadingTrackerProps) {
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const supabase = createBrowserClient();

    const MIN_TIME_SECONDS = 60; // 60 segundos de leitura mínima (1 minuto)
    const SCROLL_THRESHOLD = 0.9; // 90% do scroll

    const checkScroll = useCallback(() => {
        if (isCompleted) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage >= SCROLL_THRESHOLD) {
            setHasScrolledToEnd(true);
        }
    }, [isCompleted]);

    useEffect(() => {
        window.addEventListener("scroll", checkScroll);
        return () => window.removeEventListener("scroll", checkScroll);
    }, [checkScroll]);

    useEffect(() => {
        if (isCompleted || !userId) return;

        const timer = setInterval(() => {
            setTimeSpent((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isCompleted, userId]);

    useEffect(() => {
        async function completeReading() {
            if (hasScrolledToEnd && timeSpent >= MIN_TIME_SECONDS && !isCompleted && userId) {
                setIsCompleted(true);

                const { data, error } = await (supabase as any).rpc("complete_chapter_reading", {
                    p_chapter_id: chapterId,
                    p_series_id: seriesId
                });

                if (error) {
                    console.error("Error calling complete_chapter_reading:", error);
                    return;
                }

                const response = data as any;
                if (response?.success) {
                    const points = response.points_earned || 5;
                    showXPToast({
                        amount: points,
                        action: XP_CONFIG.READ_CHAPTER.action,
                        skipPersistence: true
                    });
                }
            }
        }

        completeReading();
    }, [hasScrolledToEnd, timeSpent, isCompleted, userId, chapterId, seriesId, supabase]);

    // Componente invisível - apenas tracker
    return null;
}
