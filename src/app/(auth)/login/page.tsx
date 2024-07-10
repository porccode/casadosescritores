"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AuthSidebar } from "@/components/auth/AuthSidebar";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthStatusMessages } from "@/components/auth/AuthStatusMessages";
import { useAuthForm } from "@/hooks/useAuthForm";

/**
 * Authentication Page (Login / SignUp).
 *
 * ARCHITECTURE:
 * - Logic: Handled by the custom `useAuthForm` hook to separate state from UI.
 * - Layout: Split into a visual sidebar (AuthSidebar) and a functional form area.
 * - Components: Uses atomic components (AuthHeader, AuthStatusMessages) for modularity.
 *
 * SECURITY:
 * - Uses Supabase Auth for secure session management.
 * - Implements CSRF protection via safe callback redirects.
 */
export default function LoginPage() {
    const {
        isSignUp,
        identifier,
        setIdentifier,
        password,
        setPassword,
        showPassword,
        setShowPassword,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        error,
        loading,
        setLoading,
        success,
        handleSubmit,
        toggleMode,
        redirectTo,
        supabase,
        setError
    } = useAuthForm();

    useEffect(() => {
        const clearSession = async () => {
            if (redirectTo) return;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await supabase.auth.signOut();
                    await fetch('/api/auth/signout', { method: 'POST' });
                    localStorage.clear();
                }
            } catch (e) {
                console.error("Erro ao limpar sessão anterior:", e);
            }
        };
        clearSession();
    }, [redirectTo, supabase.auth]);

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
            {/* Visual Sidebar */}
            <AuthSidebar />

            {/* Form Section */}
            <div className="flex flex-col justify-center items-center px-6 py-12 lg:p-12 bg-background">
                <div className="w-full max-w-[380px] space-y-6">

                    {/* Mobile-only branding */}
                    <div className="flex lg:hidden items-center justify-center gap-2 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <BookOpen className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="text-base font-bold tracking-tight">Casa dos Escritores</span>
                    </div>

                    {/* Header: Title and Subtitle */}
                    <AuthHeader isSignUp={isSignUp} />

                    {/* Feedback Messages (Success/Error) */}
                    <AuthStatusMessages error={error} success={success} isSignUp={isSignUp} />

                    {/* Auth Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4">
                            {isSignUp && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Nome</Label>
                                        <Input
                                            id="firstName"
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            disabled={loading}
                                            required={isSignUp}
                                            placeholder="João"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Sobrenome</Label>
                                        <Input
                                            id="lastName"
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            disabled={loading}
                                            required={isSignUp}
                                            placeholder="Silva"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="identifier">
                                    {isSignUp ? "E-mail" : "E-mail ou usuário"}
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="identifier"
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        disabled={loading}
                                        required
                                        className="pl-9"
                                        placeholder="seu@email.com"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    {!isSignUp && (
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                            tabIndex={-1}
                                        >
                                            Esqueceu a senha?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        required
                                        minLength={isSignUp ? 6 : undefined}
                                        className="pl-9 pr-10"
                                        placeholder="••••••••"
                                        autoComplete={isSignUp ? "new-password" : "current-password"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors outline-none"
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isSignUp ? "Criar minha conta" : "Entrar na plataforma"}
                                    <ArrowRight size={16} />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
                        </div>
                    </div>

                    <SocialLoginButtons
                        loading={loading}
                        onLoadingChange={setLoading}
                        onError={setError}
                    />

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">
                            {isSignUp ? "Já tem uma conta?" : "Ainda não tem conta?"}
                        </span>{" "}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="font-semibold text-primary hover:underline underline-offset-4"
                        >
                            {isSignUp ? "Fazer login" : "Criar uma conta"}
                        </button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Ao continuar, você concorda com nossos{" "}
                        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                            Termos de Serviço
                        </Link>{" "}
                        e{" "}
                        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                            Política de Privacidade
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
