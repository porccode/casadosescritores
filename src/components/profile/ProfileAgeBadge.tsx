"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    ShieldCheck,
    ShieldAlert,
    Edit3,
    Globe,
    Lock,
    Loader2,
    Calendar
} from "lucide-react";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { parseAndValidateBirthDate, calculateAgeFromParts } from "@/lib/age-verification";
import { toast } from "@/lib/toast";

const MONTHS = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
];

function formatBirthDate(birthDateStr?: string | null): string | null {
    if (!birthDateStr) return null;
    const parts = birthDateStr.split("-");
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

    const monthNames = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    if (m < 0 || m > 11) return null;
    return `${d} de ${monthNames[m]} de ${y}`;
}

interface ProfileAgeBadgeProps {
    profile: {
        id: string;
        birth_date?: string | null;
        age_verified?: boolean | null;
        birth_date_change_count?: number | null;
        is_birth_date_public?: boolean | null;
    };
    isOwnProfile: boolean;
}

export function ProfileAgeBadge({ profile, isOwnProfile }: ProfileAgeBadgeProps) {
    const {
        birthDate: ownBirthDate,
        isAdult: ownIsAdult,
        isMinor: ownIsMinor,
        canChange,
        changeCount,
        isBirthDatePublic,
        submitBirthDate,
        togglePrivacy,
    } = useAgeVerification();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [isPublicState, setIsPublicState] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const currentYear = new Date().getFullYear();

    const years = useMemo(() => {
        const result: string[] = [];
        for (let y = currentYear; y >= currentYear - 100; y--) {
            result.push(y.toString());
        }
        return result;
    }, [currentYear]);

    const days = useMemo(() => {
        const result: string[] = [];
        for (let d = 1; d <= 31; d++) {
            result.push(d < 10 ? `0${d}` : d.toString());
        }
        return result;
    }, []);

    const targetDate = ownBirthDate || profile.birth_date;
    const formattedBirthDate = useMemo(() => formatBirthDate(targetDate), [targetDate]);

    // Open Modal initialized with current birthdate parts if available
    const handleOpenDialog = () => {
        if (targetDate) {
            const parts = targetDate.split("-");
            if (parts.length === 3) {
                setYear(parts[0]);
                setMonth(parts[1]);
                setDay(parts[2]);
            }
        }
        setIsPublicState(isBirthDatePublic);
        setErrorMessage(null);
        setIsDialogOpen(true);
    };

    // Age preview calculation
    const calculatedAge = useMemo(() => {
        if (!day || !month || !year) return null;
        const birthDateStr = `${year}-${month}-${day}`;
        const validation = parseAndValidateBirthDate(birthDateStr);
        if (!validation.valid || validation.year === undefined) return null;
        return calculateAgeFromParts(validation.year, validation.month!, validation.day!);
    }, [day, month, year]);

    const handleSubmitChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!day || !month || !year) {
            setErrorMessage("Por favor, selecione o dia, mês e ano de nascimento.");
            return;
        }

        const birthDateStr = `${year}-${month}-${day}`;
        const validation = parseAndValidateBirthDate(birthDateStr);
        if (!validation.valid || !validation.formatted) {
            setErrorMessage(validation.error || "Data de nascimento inválida.");
            return;
        }

        setSubmitting(true);
        try {
            await submitBirthDate(validation.formatted, isPublicState);
            toast.success("Data de nascimento atualizada com sucesso!");
            setIsDialogOpen(false);
        } catch (err: any) {
            setErrorMessage(err.message || "Erro ao salvar a data de nascimento.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePrivacyQuick = async () => {
        try {
            const nextState = !isBirthDatePublic;
            await togglePrivacy(nextState);
            toast.success(nextState ? "Data de nascimento visível no perfil público." : "Data de nascimento privada (oculta para visitantes).");
        } catch (err) {
            toast.error("Erro ao alterar privacidade.");
        }
    };

    // --- VISITOR VIEW (Not own profile) ---
    if (!isOwnProfile) {
        // If private, don't show to visitors (like Facebook)
        if (profile.is_birth_date_public === false) {
            return null;
        }

        const visitorBirthDateFormatted = formatBirthDate(profile.birth_date);

        return (
            <div className="flex flex-col items-center justify-center gap-1.5 pt-2 text-center">
                <div className="flex items-center justify-center gap-2">
                    {profile.age_verified === true && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] py-0.5 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            Maior de idade
                        </Badge>
                    )}

                    {profile.age_verified === false && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] py-0.5 font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                            Menor de idade
                        </Badge>
                    )}
                </div>

                {visitorBirthDateFormatted && (
                    <span className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Nascido(a) em {visitorBirthDateFormatted}</span>
                    </span>
                )}
            </div>
        );
    }

    // --- OWNER VIEW (Own Profile) ---
    const remainingChanges = Math.max(0, 2 - changeCount);

    return (
        <div className="flex flex-col items-center gap-2 pt-2 text-center w-full">
            {/* Status Badge + Indicador de Privacidade */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {ownIsAdult && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs py-0.5 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Maior de idade
                    </Badge>
                )}
                {ownIsMinor && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs py-0.5 font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                        Menor de idade
                    </Badge>
                )}

                {/* Privacy Badge (Estilo Facebook) */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTogglePrivacyQuick}
                    title={isBirthDatePublic ? "Data de nascimento visível no perfil público. Clique para tornar privada." : "Data de nascimento privada. Clique para tornar pública."}
                    className="h-6 px-2 text-[10px] text-muted-foreground gap-1 border border-border/50 hover:bg-muted/50 rounded-full"
                >
                    {isBirthDatePublic ? (
                        <>
                            <Globe className="w-3 h-3 text-primary" />
                            <span>Público</span>
                        </>
                    ) : (
                        <>
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span>Privado</span>
                        </>
                    )}
                </Button>
            </div>

            {/* Exibição da Data de Nascimento se Pública */}
            {formattedBirthDate && isBirthDatePublic && (
                <span className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Nascido(a) em {formattedBirthDate}</span>
                </span>
            )}

            {/* Ação: Alterar Data (para quem ainda possui 1 alteração disponível). Depois de alterado, o link SUME por completo */}
            {canChange ? (
                <Button
                    variant="link"
                    size="sm"
                    onClick={handleOpenDialog}
                    className="h-auto p-0 text-xs text-primary font-semibold hover:underline flex items-center gap-1 mt-0.5"
                >
                    <Edit3 className="w-3 h-3" />
                    Alterar data de nascimento
                </Button>
            ) : null}

            {/* Dialog de Alteração de Data (Única alteração permitida) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader className="text-center sm:text-center items-center">
                        <div className="mx-auto mb-2 h-12 w-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                            Alterar Data de Nascimento
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
                            Esta é a sua <strong className="text-foreground">única alteração permitida</strong>. Certifique-se de selecionar a data correta.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitChange} className="space-y-4 pt-2">
                        {/* Seletor de Data */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground block">
                                Data de Nascimento
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <Select value={day} onValueChange={setDay}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Dia" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        {days.map((d) => (
                                            <SelectItem key={d} value={d} className="text-xs">
                                                {d}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Mês" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m.value} value={m.value} className="text-xs">
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Ano" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y} className="text-xs">
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Preview da verificação */}
                        {calculatedAge !== null && (
                            <div className="bg-muted/40 border border-border rounded-xl p-3 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Status calculado:</span>
                                <span className="font-bold text-foreground">
                                    {calculatedAge >= 18 ? "Maior de idade (18+)" : "Menor de idade (-18)"}
                                </span>
                            </div>
                        )}

                        {/* Toggle de Privacidade Estilo Facebook */}
                        <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <div className="space-y-0.5 text-left">
                                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        {isPublicState ? <Globe className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                        Exibir Data de Nascimento no Perfil
                                    </span>
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        {isPublicState
                                            ? "Outros usuários poderão ver sua data de nascimento no perfil."
                                            : "Apenas você e os administradores verão sua data de nascimento."}
                                    </p>
                                </div>
                                <Switch
                                    checked={isPublicState}
                                    onCheckedChange={setIsPublicState}
                                />
                            </div>
                        </div>

                        {/* Mensagem de Erro */}
                        {errorMessage && (
                            <Alert variant="destructive" className="py-2 px-3">
                                <AlertDescription className="text-xs">
                                    {errorMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={submitting}
                                className="h-9 text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || !day || !month || !year}
                                className="h-9 text-xs font-semibold"
                            >
                                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : "Confirmar Alteração Final"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
