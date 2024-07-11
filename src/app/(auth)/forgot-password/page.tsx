"use client";

import Link from "next/link";
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
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
 * Forgot Password Page.
 * 
 * ARCHITECTURE:
 * - Logic: Handled by `usePasswordRecovery` custom hook.
 * - Components: Uses atomic UI components from shadcn/ui.
 * 
 * FLOW:
 * 1. User enters email.
 * 2. `resetPasswordForEmail` is called via Supabase.
 * 3. Link points to `/reset-password`.
 */
export default function ForgotPasswordPage() {
    const {
        email, setEmail,
        error, loading, success,
        handleForgotPassword
    } = usePasswordRecovery();

    return (
        <div className="flex justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
            <Card className="max-w-md w-full border-border shadow-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
                    <CardDescription>
                        Enviaremos um link seguro para redefinir sua senha
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
                                Link de recuperação enviado! Verifique seu email para redefinir sua senha.
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleForgotPassword} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading || success}
                                required
                                placeholder="seu@email.com"
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
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Enviar link de recuperação
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
