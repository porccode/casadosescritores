"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

/**
 * EditorAlerts.
 * 
 * Logic: Standardized rendering of error and success notifications 
 * within the writing environment.
 */

interface EditorAlertsProps {
    error: string | null;
    success: string | null;
    onClearError: () => void;
}

export function EditorAlerts({ error, success, onClearError }: EditorAlertsProps) {
    if (!error && !success) return null;

    return (
        <div className="mx-auto w-full content-wrapper mt-4 px-4 sticky top-20 z-10">
            {error && (
                <Alert variant="destructive" className="shadow-lg border-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between font-medium">
                        {error}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClearError}
                            className="h-6 w-6 hover:bg-transparent"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="border-green-200 bg-green-50 shadow-md border-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 font-bold">
                        {success}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
