"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createBrowserClient } from "@/lib/supabase-browser";

interface AgeVerificationState {
    birthDate: string | null;
    ageVerified: boolean | null;
    changeCount: number;
    loading: boolean;
    needsVerification: boolean;
    isMinor: boolean;
    isAdult: boolean;
    canChange: boolean;
    isBirthDatePublic: boolean;
}

export function useAgeVerification() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Lazy initialization from localStorage for 0ms frame-0 instant evaluation
    const [state, setState] = useState<AgeVerificationState>(() => {
        let cachedStatus: string | null = null;
        if (typeof window !== "undefined") {
            try {
                cachedStatus = localStorage.getItem("age_verified_status");
            } catch (e) { }
        }

        const isMinor = cachedStatus === "minor";
        const isAdult = cachedStatus === "adult";

        return {
            birthDate: null,
            ageVerified: cachedStatus ? (isAdult ? true : isMinor ? false : null) : null,
            changeCount: 0,
            loading: true,
            needsVerification: false,
            isMinor,
            isAdult,
            canChange: true,
            isBirthDatePublic: true,
        };
    });

    const supabase = useMemo(() => createBrowserClient(), []);

    const fetchVerificationStatus = useCallback(async () => {
        if (!user || !isAuthenticated) {
            if (typeof window !== "undefined") {
                try { localStorage.removeItem("age_verified_status"); } catch (e) { }
            }
            setState({
                birthDate: null,
                ageVerified: null,
                changeCount: 0,
                loading: false,
                needsVerification: false,
                isMinor: false,
                isAdult: false,
                canChange: true,
                isBirthDatePublic: true,
            });
            return;
        }

        try {
            let profile: any = null;

            const res1 = await supabase
                .from("profiles" as any)
                .select("birth_date, age_verified, birth_date_change_count, is_birth_date_public")
                .eq("id", user.id)
                .single();

            if (res1.error) {
                const res2 = await supabase
                    .from("profiles" as any)
                    .select("birth_date, age_verified")
                    .eq("id", user.id)
                    .single();

                profile = res2.data;
            } else {
                profile = res1.data;
            }

            if (!profile) {
                setState((prev) => ({ ...prev, loading: false }));
                return;
            }

            const birthDate = profile.birth_date || null;
            const ageVerified = profile.age_verified ?? null;
            const changeCount = Number(profile.birth_date_change_count ?? 0);
            const isBirthDatePublic = profile.is_birth_date_public !== false;

            const needsVerification = !birthDate || birthDate === "";
            const isMinor = ageVerified === false;
            const isAdult = ageVerified === true;
            const canChange = changeCount < 1;

            // Cache in localStorage for 0ms frame-0 instant evaluation on next page loads
            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem(
                        "age_verified_status",
                        isAdult ? "adult" : isMinor ? "minor" : "pending"
                    );
                } catch (e) { }
            }

            setState({
                birthDate,
                ageVerified,
                changeCount,
                loading: false,
                needsVerification,
                isMinor,
                isAdult,
                canChange,
                isBirthDatePublic,
            });
        } catch (err) {
            console.error("Erro ao carregar dados de verificação de idade:", err);
            setState((prev) => ({ ...prev, loading: false }));
        }
    }, [user, isAuthenticated, supabase]);

    useEffect(() => {
        if (!authLoading) {
            fetchVerificationStatus();
        }
    }, [authLoading, fetchVerificationStatus]);

    const submitBirthDate = async (birthDate?: string, isPublic?: boolean) => {
        try {
            const payload: any = {};
            if (birthDate) payload.birth_date = birthDate;
            if (typeof isPublic === "boolean") payload.is_public = isPublic;

            const res = await fetch("/api/profile/age-verification", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro ao atualizar data de nascimento");
            }

            if (data.profile) {
                const updatedBirthDate = data.profile.birth_date ?? state.birthDate;
                const updatedAgeVerified = typeof data.isAdult === "boolean" ? data.isAdult : state.ageVerified;
                const remaining = typeof data.remainingChanges === "number" ? data.remainingChanges : (1 - state.changeCount);
                const updatedChangeCount = 1 - remaining;
                const updatedIsPublic = typeof data.profile.is_birth_date_public === "boolean"
                    ? data.profile.is_birth_date_public
                    : (typeof isPublic === "boolean" ? isPublic : state.isBirthDatePublic);

                const isMinor = updatedAgeVerified === false;
                const isAdult = updatedAgeVerified === true;

                if (typeof window !== "undefined") {
                    try {
                        localStorage.setItem(
                            "age_verified_status",
                            isAdult ? "adult" : isMinor ? "minor" : "pending"
                        );
                    } catch (e) { }
                }

                setState({
                    birthDate: updatedBirthDate,
                    ageVerified: updatedAgeVerified,
                    changeCount: updatedChangeCount,
                    loading: false,
                    needsVerification: false,
                    isMinor,
                    isAdult,
                    canChange: updatedChangeCount < 1,
                    isBirthDatePublic: updatedIsPublic,
                });
            }

            await fetchVerificationStatus();
            return data;
        } catch (err: any) {
            throw err;
        }
    };

    const togglePrivacy = async (isPublic: boolean) => {
        return submitBirthDate(undefined, isPublic);
    };

    return {
        ...state,
        refetch: fetchVerificationStatus,
        submitBirthDate,
        togglePrivacy,
    };
}
