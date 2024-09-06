import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FirstChapterTypeModalProps {
    isOpen: boolean;
    onSelect: (type: 'prologue' | 'chapter_1') => void;
    onClose?: () => void;
}

export function FirstChapterTypeModal({ isOpen, onSelect, onClose }: FirstChapterTypeModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader className="text-center pb-2">
                    <DialogTitle className="text-xl font-bold">Como quer começar?</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={() => onSelect('prologue')}
                        variant="outline"
                        className="w-full h-12 text-sm font-semibold border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
                    >
                        Prólogo
                    </Button>

                    <Button
                        onClick={() => onSelect('chapter_1')}
                        className="w-full h-12 text-sm font-semibold"
                    >
                        Primeiro Capítulo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
