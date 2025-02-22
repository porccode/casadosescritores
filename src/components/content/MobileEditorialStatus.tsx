'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Calendar, Archive } from 'lucide-react';
import type { UseContentEditorReturn } from '@/types/content.types';

type EditorMode = 'create-work' | 'edit-work' | 'write-chapter';

interface MobileEditorialStatusProps {
    editor: UseContentEditorReturn;
    mode: EditorMode;
}

export default function MobileEditorialStatus({ editor, mode }: MobileEditorialStatusProps) {
    return (
        <div className="lg:hidden mt-12 space-y-6">
            <div className="flex justify-center">
                <Badge variant="secondary" className="px-5 h-10 bg-background shadow-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-6 rounded-2xl border border-border">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground/60 uppercase">Palavras</span>
                        <span className="text-primary font-bold">{editor.wordCount}</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground/60 uppercase">Caracteres</span>
                        <span className="text-primary font-bold">{editor.charCount}</span>
                    </div>
                </Badge>
            </div>
            {mode === 'write-chapter' && (
                <Card className="bg-background shadow-none border-border">
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Archive className="h-4 w-4 text-primary" />
                            Status Editorial
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Agendamento</span>
                                    </div>
                                    <Switch
                                        checked={editor.isSchedulingEnabled}
                                        onCheckedChange={editor.setIsSchedulingEnabled}
                                    />
                                </div>

                                {editor.isSchedulingEnabled && (
                                    <div className="space-y-3">
                                        <Input
                                            type="datetime-local"
                                            value={editor.publishedAt || ''}
                                            onChange={(e) => editor.setPublishedAt(e.target.value)}
                                            className="h-11 bg-muted/50 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
