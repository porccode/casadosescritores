"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { Lock, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePasswordRecovery } from "@/hooks/usePasswordRecovery";

/**
 * ResetPasswordContent Component.
 * 
 * Handles the actual password reset form and session initialization.
 * Uses `usePasswordRecovery` for state and Supabase logic.
 */
function ResetPasswordContent() {
    const {
        password, setPassword,
        confirmPassword, setConfirmPassword,
        error, loading, success,
        tokenError, initializing,
        handleResetPassword,
        initializeResetSession
    } = usePasswordRecovery();

    useEffect(() => {
        initializeResetSession();
    }, [initializeResetSession]);

    if (initializing) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Verificando link de recuperação...</p>
                </div>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="flex justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
                <Card className="max-w-md w-full border-border shadow-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Link Inválido</CardTitle>
                        <CardDescription>
                            Este link de redefinição de senha é inválido ou expirou.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Para redefinir sua senha, solicite um novo link na página de recuperação.
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col gap-3">
                            <Button asChild className="w-full h-11">
                                <Link href="/forgot-password">
                                    Solicitar novo link
                                </Link>
                            </Button>

                            <Button variant="ghost" asChild className="w-full h-11">
                                <Link href="/login">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Voltar para o login
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
            <Card className="max-w-md w-full border-border shadow-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
                    <CardDescription>
                        Crie uma nova senha segura para sua conta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-6 border-green-500 bg-green-500/10 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Senha redefinida com sucesso! Redirecionando para o login...
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading || success}
                                required
                                minLength={6}
                                placeholder="Mínimo de 6 caracteres"
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading || success}
                                required
                                minLength={6}
                                placeholder="Confirme sua senha"
                                className="h-11"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || success}
                            className="w-full h-11 font-semibold"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Redefinindo...
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Redefinir Senha
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6">
                        <Button variant="ghost" asChild className="w-full h-11">
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar para o login
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * ResetPasswordPage.
 * 
 * Main entry point with Suspense boundary for searchParams.
 */
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
