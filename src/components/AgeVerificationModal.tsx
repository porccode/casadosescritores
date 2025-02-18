"use client";

import React, { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, ShieldAlert, Calendar, Info, Loader2 } from "lucide-react";
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

export function AgeVerificationModal() {
    const { needsVerification, submitBirthDate, loading: verificationLoading } = useAgeVerification();

    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
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

    // Calculate preview age using timezone-safe, validated parser
    const calculatedAge = useMemo(() => {
        if (!day || !month || !year) return null;
        const birthDateStr = `${year}-${month}-${day}`;
        const validation = parseAndValidateBirthDate(birthDateStr);
        if (!validation.valid || validation.year === undefined) return null;
        return calculateAgeFromParts(validation.year, validation.month!, validation.day!);
    }, [day, month, year]);

    if (verificationLoading || !needsVerification) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
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
            const res = await submitBirthDate(validation.formatted);
            if (res.isAdult) {
                toast.success("Idade confirmada com sucesso! Você tem acesso completo à plataforma.");
            } else {
                toast.info("Confirmação registrada. O conteúdo +18 foi restrito na sua conta.");
            }
            setTimeout(() => {
                window.location.reload();
            }, 400);
        } catch (err: any) {
            setErrorMessage(err.message || "Erro ao salvar data de nascimento.");
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent
                hideClose={true}
                className="sm:max-w-[460px]"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="text-center sm:text-center items-center">
                    <div className="mx-auto mb-2 h-12 w-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                        Confirmação de Idade
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-[340px] mx-auto">
                        Em conformidade com a LGPD e o ECA, precisamos da sua data de nascimento para ajustar a exibição de conteúdos da plataforma.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Seletor de Data */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground block">
                            Data de Nascimento
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {/* Dia */}
                            <Select value={day} onValueChange={setDay}>
                                <SelectTrigger className="h-10 text-xs">
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

                            {/* Mês */}
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="h-10 text-xs">
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

                            {/* Ano */}
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="h-10 text-xs">
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
                        <div className="animate-in fade-in duration-200">
                            {calculatedAge >= 18 ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-foreground">
                                                {calculatedAge} anos
                                            </span>
                                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] py-0">
                                                Maior de Idade
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                            Você terá acesso irrestrito a todas as obras da plataforma, incluindo conteúdos +18.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
                                    <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-foreground">
                                                {calculatedAge >= 0 ? `${calculatedAge} anos` : 'Menor de idade'}
                                            </span>
                                            <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] py-0">
                                                Menor de Idade
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                            O conteúdo classificado como +18 será automaticamente ocultado e restrito para sua segurança.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mensagem de Erro */}
                    {errorMessage && (
                        <Alert variant="destructive" className="py-2.5 px-3">
                            <AlertDescription className="text-xs">
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Nota LGPD e Aviso de Alterações */}
                    <div className="bg-muted/40 rounded-xl p-3 border border-border/50 text-[11px] text-muted-foreground space-y-1.5 leading-snug">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                            Regra de Segurança:
                        </div>
                        <p>
                            Sua data de nascimento não é exibida publicamente. Você poderá corrigi-la mais <strong className="text-foreground">1 vez</strong> no seu perfil caso cometa algum engano.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting || !day || !month || !year}
                        className="w-full h-10 text-sm font-semibold rounded-lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Confirmar Data de Nascimento"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
