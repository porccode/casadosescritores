"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export default function UnauthorizedPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (countdown === 0) {
            router.push("/");
        }
    }, [countdown, router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <Card className="border-destructive/50">
                    <CardContent className="pt-6">
                        <Alert variant="destructive">
                            <ShieldAlert className="h-5 w-5" />
                            <AlertTitle className="text-lg font-bold">
                                Área Restrita
                            </AlertTitle>
                            <AlertDescription className="mt-2">
                                Você não possui as permissões necessárias para acessar esta página.
                            </AlertDescription>
                        </Alert>

                        <p className="text-center text-sm text-muted-foreground mt-6">
                            Redirecionando para a página inicial em{" "}
                            <span className="font-bold text-primary">{countdown}</span>{" "}
                            {countdown === 1 ? "segundo" : "segundos"}...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
