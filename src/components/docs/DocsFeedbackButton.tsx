"use client";

import { Button } from "@/components/ui/button";

export function DocsFeedbackButton() {
    return (
        <Button size="sm" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>
            Enviar Feedback
        </Button>
    );
}
