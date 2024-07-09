"use client";

import { toast as sonnerToast } from "sonner";
import React from "react";

/**
 * Toast wrapper with consistent API to sonner
 * Replaces react-toastify while maintaining compatibility
 */

export interface ToastOptions {
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
    duration?: number;
    description?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
    onClick?: () => void; // Legacy support
}

export type ToastId = string | number;

export const toast = {
    success: (message: string, options?: ToastOptions): ToastId => {
        return sonnerToast.success(message, {
            duration: options?.duration || 4000,
            description: options?.description,
            position: options?.position,
            action: options?.action || (options?.onClick ? { label: "Ver", onClick: options.onClick } : undefined),
        });
    },

    error: (message: string, options?: ToastOptions): ToastId => {
        return sonnerToast.error(message, {
            duration: options?.duration || 4000,
            description: options?.description,
            position: options?.position,
            action: options?.action || (options?.onClick ? { label: "Ver", onClick: options.onClick } : undefined),
        });
    },

    info: (message: string, options?: ToastOptions): ToastId => {
        return sonnerToast.info(message, {
            duration: options?.duration || 4000,
            description: options?.description,
            position: options?.position,
            action: options?.action || (options?.onClick ? { label: "Ver", onClick: options.onClick } : undefined),
        });
    },

    warning: (message: string, options?: ToastOptions): ToastId => {
        return sonnerToast.warning(message, {
            duration: options?.duration || 4000,
            description: options?.description,
            position: options?.position,
            action: options?.action || (options?.onClick ? { label: "Ver", onClick: options.onClick } : undefined),
        });
    },

    // Custom toast
    custom: (content: React.ReactNode, options?: ToastOptions): ToastId => {
        return sonnerToast(content, {
            duration: options?.duration || 4000,
            position: options?.position,
        });
    },

    // Dismiss a specific toast or all toasts
    dismiss: (toastId?: ToastId): void => {
        if (toastId) {
            sonnerToast.dismiss(toastId);
        } else {
            sonnerToast.dismiss();
        }
    },

    // Update an existing toast (Sonner uses toast() for updates if id matches)
    update: (toastId: ToastId, options: any): void => {
        // Sonner doesn't have a direct .update but calling toast again with same id works
        // However, the common usage in this project seems to be simple toasts
        console.warn("toast.update is called but sonner update logic might need manual mapping if used extensively.");
    },

    // Promise-based toast
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: (data: T) => string;
            error: (error: any) => string;
        },
        options?: ToastOptions
    ): Promise<T> => {
        return sonnerToast.promise(promise, {
            loading: messages.loading,
            success: messages.success,
            error: messages.error,
            duration: options?.duration || 4000,
            position: options?.position,
        }) as unknown as Promise<T>;
    },
};
