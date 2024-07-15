"use client";

import { ReactNode } from "react";
import { ConfirmProvider } from "./ConfirmModal";
import SWRProvider from "./providers/SWRProvider";
import RealtimeProvider from "./providers/RealtimeProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { ThemeProvider } from "next-themes";
import { AgeVerificationModal } from "./AgeVerificationModal";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper de Providers client-side
 * Centraliza todos os context providers necessários
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <AgeVerificationModal />
        <SWRProvider>
          <RealtimeProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </RealtimeProvider>
        </SWRProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
