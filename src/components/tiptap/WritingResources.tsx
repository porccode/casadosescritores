'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface WritingResourcesProps {
    wordCount: number
    charCount: number
    readingTime: number
}

export default function WritingResources({
    wordCount,
    charCount,
    readingTime,
}: WritingResourcesProps) {
    return (
        <Card className="bg-background border border-border">
            <CardContent className="p-3 space-y-4">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider px-1">
                    <span>Total de Palavras</span>
                    <span className="text-foreground">{wordCount}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider px-1">
                    <span>Total de Caracteres</span>
                    <span className="text-foreground">{charCount}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider px-1">
                    <span>Tempo de Leitura</span>
                    <span className="text-foreground">{readingTime} min</span>
                </div>
            </CardContent>
        </Card>
    )
}
