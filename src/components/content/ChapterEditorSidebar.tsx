'use client';

import React, { RefObject } from 'react';
import Sidebar from '@/components/tiptap/Sidebar';
import WritingResources from '@/components/tiptap/WritingResources';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { UseContentEditorReturn } from '@/types/content.types';

interface ChapterEditorSidebarProps {
    tiptapEditor: any;
    selectionTrigger: number;
    contentEditor: UseContentEditorReturn;
    hasMounted: boolean;
    imageInputRef: RefObject<HTMLInputElement | null>;
    onInfoBlockInsert: () => void;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onVideoInsert: () => void;
}

export default function ChapterEditorSidebar({
    tiptapEditor,
    selectionTrigger,
    contentEditor,
    hasMounted,
    imageInputRef,
    onInfoBlockInsert,
    onImageChange,
    onVideoInsert,
}: ChapterEditorSidebarProps) {
    
    // Timezone-safe local parser
    const parseLocalISOString = (isoString: string): Date => {
        if (!isoString) return new Date();
        if (isoString.includes('Z') || isoString.includes('+') || (isoString.includes('-') && isoString.split('-').length > 3)) {
            return new Date(isoString);
        }
        try {
            const [datePart, timePart] = isoString.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);
            return new Date(year, month - 1, day, hours, minutes);
        } catch (e) {
            return new Date(isoString);
        }
    };

    const getLocalISOString = (date: Date) => {
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    const publishedDate = parseLocalISOString(contentEditor.publishedAt);
    
    // Format a time string like "HH:mm" from publishedDate
    const pad = (n: number) => n.toString().padStart(2, '0');
    const currentTimeString = `${pad(publishedDate.getHours())}:${pad(publishedDate.getMinutes())}`;

    const handleTimeChange = (time: string) => {
        if (!time) return;
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(publishedDate);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        contentEditor.setPublishedAt(getLocalISOString(newDate));
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const newDate = new Date(date);
            // Preservar as horas/minutos atuais
            newDate.setHours(publishedDate.getHours());
            newDate.setMinutes(publishedDate.getMinutes());
            newDate.setSeconds(0);
            newDate.setMilliseconds(0);
            contentEditor.setPublishedAt(getLocalISOString(newDate));
        }
    };

    return (
        <aside className="hidden lg:flex flex-col gap-6 sticky top-24 pb-20">
            <Sidebar
                editor={tiptapEditor}
                onInfoBlockInsert={onInfoBlockInsert}
                onImageUpload={() => imageInputRef.current?.click()}
                onVideoInsert={onVideoInsert}
            />

            <WritingResources
                wordCount={contentEditor.wordCount}
                charCount={contentEditor.charCount}
                readingTime={Math.ceil(contentEditor.wordCount / 200)}
            />

            <input
                type="file"
                className="hidden"
                ref={imageInputRef}
                accept="image/*"
                onChange={onImageChange}
            />

            {/* Agendar Publicação Card - Premium & Minimalist */}
            <Card className="shadow-none bg-background border border-border rounded-xl">
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="text-sm font-semibold text-foreground">Agendar Publicação</h4>
                            <p className="text-xs text-muted-foreground">Defina uma data futura para lançar.</p>
                        </div>
                        <Switch
                            checked={contentEditor.isSchedulingEnabled}
                            onCheckedChange={contentEditor.setIsSchedulingEnabled}
                        />
                    </div>

                    {contentEditor.isSchedulingEnabled && (
                        <div className="space-y-4 pt-3 border-t border-border animate-in fade-in-50 duration-200">
                            {hasMounted && (
                                <div className="space-y-3.5">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data de Publicação</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-10 text-xs hover:bg-muted/50 transition-colors rounded-lg",
                                                        !contentEditor.publishedAt && "text-muted-foreground"
                                                    )}
                                                >
                                                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    {contentEditor.publishedAt ? format(publishedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={publishedDate}
                                                    onSelect={handleDateSelect}
                                                    initialFocus
                                                    disabled={{ before: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })() }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Horário de Lançamento</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                                            <Input 
                                                type="time" 
                                                value={currentTimeString}
                                                onChange={(e) => handleTimeChange(e.target.value)}
                                                className="h-10 text-xs bg-background border-border rounded-lg pl-9 focus-visible:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {contentEditor.publishedAt && (
                                <div className="flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 uppercase tracking-widest rounded-lg border border-emerald-500/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span>AGENDADO: {format(publishedDate, "dd/MM 'ÀS' HH:mm")}</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Nota do Autor Card - Premium & Minimalist */}
            <Card className="shadow-none bg-background border border-border rounded-xl">
                <CardContent className="p-4 space-y-3">
                    <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold text-foreground">Nota do Autor</h4>
                        <p className="text-xs text-muted-foreground">Um recado para seus leitores no final do capítulo.</p>
                    </div>
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Escreva sua nota do autor..."
                            className="min-h-[100px] text-xs resize-none bg-background border-border rounded-lg focus-visible:ring-primary/20"
                            value={contentEditor.authorNote}
                            onChange={(e) => contentEditor.setAuthorNote(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
}
