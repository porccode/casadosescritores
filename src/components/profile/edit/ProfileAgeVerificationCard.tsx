"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, ShieldAlert, Calendar, Loader2, Info, Lock, Globe } from "lucide-react";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { parseAndValidateBirthDate } from "@/lib/age-verification";
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

export function ProfileAgeVerificationCard() {
    const {
        birthDate,
        ageVerified,
        changeCount,
        isAdult,
        isMinor,
        canChange,
        isBirthDatePublic,
        submitBirthDate,
        togglePrivacy,
        loading
    } = useAgeVerification();

    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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

    const formattedBirthDate = useMemo(() => {
        if (!birthDate) return "Não informada";
        const parts = birthDate.split("-");
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return birthDate;
    }, [birthDate]);

    const handleOpenEdit = () => {
        if (birthDate) {
            const parts = birthDate.split("-");
            if (parts.length === 3) {
                setYear(parts[0]);
                setMonth(parts[1]);
                setDay(parts[2]);
            }
        }
        setIsEditing(true);
    };

    const handleSaveDate = async () => {
        if (!day || !month || !year) {
            toast.error("Por favor, selecione o dia, mês e ano.");
            return;
        }

        const birthDateStr = `${year}-${month}-${day}`;
        const validation = parseAndValidateBirthDate(birthDateStr);
        if (!validation.valid || !validation.formatted) {
            toast.error(validation.error || "Data de nascimento inválida.");
            return;
        }

        setSubmitting(true);
        try {
            await submitBirthDate(validation.formatted);
            toast.success("Data de nascimento atualizada com sucesso!");
            setIsEditing(false);
        } catch (err: any) {
            toast.error(err.message || "Erro ao atualizar data de nascimento.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePrivacy = async (checked: boolean) => {
        try {
            await togglePrivacy(checked);
            toast.success(checked ? "Idade visível no perfil público." : "Idade tornada privada (somente você vê).");
        } catch (err) {
            toast.error("Falha ao salvar preferência de privacidade.");
        }
    };

    if (loading) {
        return (
            <Card className="border-border/60">
                <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    const remainingChanges = Math.max(0, 2 - changeCount);

    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Verificação de Idade (LGPD)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {isAdult && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs py-0.5 font-semibold">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Maior de Idade
                            </Badge>
                        )}
                        {isMinor && (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs py-0.5 font-semibold">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Menor de Idade
                            </Badge>
                        )}
                    </div>
                </div>
                <CardDescription className="text-xs leading-relaxed">
                    Sua data de nascimento determina o acesso a conteúdos sensíveis (+18) e garante conformidade legal.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
                {/* Registrada */}
                <div className="bg-muted/40 rounded-xl p-3 border border-border/50 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-muted-foreground block">Data de Nascimento Registrada</span>
                        <span className="text-sm font-bold text-foreground">{formattedBirthDate}</span>
                    </div>
                    {canChange && !isEditing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenEdit}
                            className="text-xs h-8"
                        >
                            Alterar Data de Nascimento
                        </Button>
                    )}
                </div>

                {/* Form de edição (Única alteração permitida) */}
                {isEditing && canChange && (
                    <div className="space-y-3 p-4 bg-muted/20 border border-primary/20 rounded-xl animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground block">Nova Data de Nascimento</label>
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                Alteração Única Permitida
                            </span>
                        </div>
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

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={submitting}
                                className="h-8 text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveDate}
                                disabled={submitting || !day || !month || !year}
                                className="h-8 text-xs font-semibold"
                            >
                                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar Data"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Opção de Privacidade (Estilo Facebook) */}
                <div className="bg-muted/30 rounded-xl p-3.5 border border-border/50 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 text-left">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            {isBirthDatePublic ? <Globe className="h-3.5 w-3.5 text-primary" /> : <Lock className="h-3.5 w-3.5 text-amber-500" />}
                            Exibir Maioridade no Perfil Público
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                            {isBirthDatePublic
                                ? "Visitantes podem ver o selo de maioridade no seu perfil."
                                : "Apenas você e a administração conseguem ver o selo no seu perfil."}
                        </p>
                    </div>
                    <Switch
                        checked={isBirthDatePublic}
                        onCheckedChange={handleTogglePrivacy}
                    />
                </div>

                {/* Status de alterações */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {canChange ? (
                        <>
                            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>Você possui 1 alteração disponível para a data de nascimento.</span>
                        </>
                    ) : (
                        <>
                            <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span className="text-amber-600 dark:text-amber-400">Data de nascimento alterada. Limite de 1 alteração atingido.</span>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
