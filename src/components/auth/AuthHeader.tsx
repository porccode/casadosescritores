"use client";

interface AuthHeaderProps {
    isSignUp: boolean;
}

/**
 * AuthHeader Component.
 * 
 * Responsável por exibir o título e subtítulo dinâmicos da página de autenticação,
 * alternando entre os estados de "Login" e "Cadastro".
 */
export function AuthHeader({ isSignUp }: AuthHeaderProps) {
    return (
        <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
                {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-muted-foreground">
                {isSignUp
                    ? "Comece a publicar suas histórias hoje mesmo."
                    : "Entre com seu e-mail ou usuário para continuar."}
            </p>
        </div>
    );
}
