"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import { createBrowserClient } from "@/lib/supabase-browser";

const MAX_CHARS = 2000;

interface MentionSuggestion {
    username: string;
    avatar_url: string | null;
}

interface CommentFormProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitting: boolean;
    username: string;
    userAvatar?: string | null;
    placeholder?: string;
    autoFocus?: boolean;
    onCancel?: () => void;
    submitLabel?: string;
    compact?: boolean;
}

export default function CommentForm({
    value,
    onChange,
    onSubmit,
    submitting,
    username,
    userAvatar,
    placeholder = "Escreva um comentário...",
    autoFocus = false,
    onCancel,
    submitLabel = "Comentar",
    compact = false,
}: CommentFormProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(autoFocus);
    const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStart, setMentionStart] = useState<number>(-1);
    const [activeIndex, setActiveIndex] = useState(0);
    const supabase = createBrowserClient();

    const showActions = isFocused || !!value.trim() || !!onCancel;
    const charsLeft = MAX_CHARS - value.length;
    const isOverLimit = charsLeft < 0;
    const isNearLimit = charsLeft <= 100 && !isOverLimit;

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.max(24, textarea.scrollHeight)}px`;
        }
    }, [value]);

    // Detect @mention trigger from caret position
    const detectMention = useCallback((text: string, caretPos: number) => {
        // Walk backwards from caret to find an '@' not preceded by a word char
        const slice = text.slice(0, caretPos);
        const match = slice.match(/@([a-zA-Z0-9_]*)$/);
        if (match) {
            const query = match[1];
            const start = caretPos - match[0].length;
            return { query, start };
        }
        return null;
    }, []);

    // Fetch mentions from Supabase (debounced)
    useEffect(() => {
        if (mentionQuery === null) {
            setMentionSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            let query = supabase
                .from("profiles")
                .select("username, avatar_url");

            if (mentionQuery.length > 0) {
                query = query.ilike("username", `${mentionQuery}%`);
            }

            const { data } = await query
                .neq("username", username) // don't suggest self
                .limit(5);

            setMentionSuggestions(data ?? []);
            setActiveIndex(0);
        }, 180);

        return () => clearTimeout(timer);
    }, [mentionQuery, supabase, username]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= MAX_CHARS + 50) {
            onChange(newValue);
        }

        const caretPos = e.target.selectionStart ?? newValue.length;
        const detected = detectMention(newValue, caretPos);
        if (detected) {
            setMentionQuery(detected.query ?? "");
            setMentionStart(detected.start);
        } else {
            setMentionQuery(null);
            setMentionStart(-1);
        }
    }, [onChange, detectMention]);

    const insertMention = useCallback((suggestion: MentionSuggestion) => {
        const before = value.slice(0, mentionStart);
        const after = value.slice(textareaRef.current?.selectionStart ?? value.length);
        const inserted = `@${suggestion.username} `;
        const newValue = before + inserted + after;
        onChange(newValue);
        setMentionQuery(null);
        setMentionStart(-1);
        setMentionSuggestions([]);

        // Restore focus and move caret after inserted text
        requestAnimationFrame(() => {
            const ta = textareaRef.current;
            if (ta) {
                ta.focus();
                const pos = before.length + inserted.length;
                ta.setSelectionRange(pos, pos);
            }
        });
    }, [value, mentionStart, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.stopPropagation();

        // Navigate/select mention dropdown with keyboard
        if (mentionSuggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, mentionSuggestions.length - 1));
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(mentionSuggestions[activeIndex]);
                return;
            }
            if (e.key === "Escape") {
                setMentionQuery(null);
                setMentionSuggestions([]);
                return;
            }
        }

        // Ctrl+Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (!submitting && value.trim() && !isOverLimit) {
                onSubmit(e as unknown as React.FormEvent);
            }
        }
    }, [mentionSuggestions, activeIndex, insertMention, onSubmit, submitting, value, isOverLimit]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setMentionQuery(null);
                setMentionSuggestions([]);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    return (
        <div className="flex gap-4 w-full">
            {!compact && (
                <UserAvatar
                    src={userAvatar}
                    alt={username}
                    size={32}
                    className="h-8 w-8 shrink-0 border border-border"
                />
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (submitting || !value.trim() || isOverLimit) return;
                    onSubmit(e);
                }}
                className="flex flex-col flex-1 min-w-0"
            >
                {/* Textarea + mention dropdown wrapper */}
                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                            if (!value.trim() && !onCancel) setIsFocused(false);
                        }}
                        placeholder={placeholder}
                        disabled={submitting}
                        autoFocus={autoFocus}
                        rows={1}
                        className={cn(
                            "w-full resize-none overflow-hidden transition-colors min-h-[44px]",
                            compact ? "text-xs" : "text-sm text-base"
                        )}
                        required
                    />

                    {/* Mention autocomplete dropdown */}
                    {mentionSuggestions.length > 0 && (
                        <div
                            ref={dropdownRef}
                            className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
                        >
                            {mentionSuggestions.map((s, i) => (
                                <button
                                    key={s.username}
                                    type="button"
                                    className={cn(
                                        "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                                        i === activeIndex
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-muted"
                                    )}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // prevent textarea blur
                                        insertMention(s);
                                    }}
                                    onMouseEnter={() => setActiveIndex(i)}
                                >
                                    <UserAvatar
                                        src={s.avatar_url}
                                        alt={s.username}
                                        size={24}
                                        className="h-6 w-6 shrink-0 border border-border"
                                    />
                                    <span className="font-medium">@{s.username}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {showActions && (
                    <div className="flex justify-between items-center gap-2 mt-3">
                        {/* Contador de caracteres */}
                        <span className={cn(
                            "text-xs tabular-nums transition-colors",
                            isOverLimit
                                ? "text-destructive font-medium"
                                : isNearLimit
                                    ? "text-warning"
                                    : "text-muted-foreground opacity-0",
                            (isNearLimit || isOverLimit) && "opacity-100"
                        )}>
                            {isOverLimit ? `-${Math.abs(charsLeft)}` : charsLeft}
                        </span>

                        <div className="flex items-center gap-2">
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onCancel}
                                    disabled={submitting}
                                    className="rounded-full text-muted-foreground"
                                >
                                    Cancelar
                                </Button>
                            )}
                            <Button
                                type="submit"
                                size="sm"
                                disabled={submitting || !value.trim() || isOverLimit}
                                className="rounded-full px-5"
                                title="Enviar (Ctrl+Enter)"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-1.5">
                                        <RefreshCw size={13} className="animate-spin" />
                                        Enviando...
                                    </span>
                                ) : submitLabel}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
