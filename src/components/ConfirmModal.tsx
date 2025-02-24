"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalType = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm deve ser usado dentro de um ConfirmProvider");
  }
  return context;
}

interface ModalState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    options: { title: "", message: "" },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    modalState.resolve?.(true);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    modalState.resolve?.(false);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const { options, isOpen } = modalState;

  const Icon = options.type === "danger" ? Trash2 : options.type === "warning" ? AlertTriangle : Info;
  const iconColor = options.type === "danger" ? "text-destructive" : "text-primary";
  const iconBg = options.type === "danger" ? "bg-destructive/10" : "bg-primary/10";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="sm:text-center">
            <div className="flex items-center justify-center mb-2">
              <div className={cn("p-3 rounded-full", iconBg)}>
                <Icon size={28} className={iconColor} />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-lg font-bold">
              {options.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm whitespace-pre-line">
              {options.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:space-x-0">
            <AlertDialogCancel
              onClick={handleCancel}
              className="flex-1 mt-0"
            >
              {options.cancelText || "Cancelar"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                "flex-1",
                options.type === "danger" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
              )}
            >
              {options.confirmText || "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
