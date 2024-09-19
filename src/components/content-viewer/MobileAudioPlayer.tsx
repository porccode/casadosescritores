"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileAudioPlayerProps {
    content: string;
    title: string;
    className?: string;
}

export default function MobileAudioPlayer({ content, title, className }: MobileAudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(1);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const synthRef = useRef<SpeechSynthesis | null>(null);
    const isInterruptedRef = useRef(false);

    const extractTextFromJson = (contentStr: string) => {
        if (!contentStr) return "";
        try {
            // Se for JSON do Tiptap
            if (contentStr.startsWith('{') || contentStr.startsWith('[')) {
                const json = JSON.parse(contentStr);
                const extract = (node: any): string => {
                    if (!node) return '';
                    if (node.text) return node.text;
                    if (node.content && Array.isArray(node.content)) {
                        return node.content.map(extract).join(' ');
                    }
                    return '';
                };
                return extract(json).replace(/\s+/g, ' ').trim();
            }

            // Fallback para HTML
            if (typeof document === 'undefined') return contentStr.replace(/<[^>]*>/g, ' ');
            const tmp = document.createElement("DIV");
            tmp.innerHTML = contentStr;
            return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, ' ').trim();
        } catch (e) {
            return contentStr.replace(/<[^>]*>/g, ' ');
        }
    };

    const cleanContent = extractTextFromJson(content);

    const splitContent = (text: string) => {
        if (!text) return [];
        const sentences = text.split(/([.!?]+)/g).filter(Boolean);
        const parts: string[] = [];
        let currentPart = "";

        for (let i = 0; i < sentences.length; i++) {
            const s = sentences[i];
            if ((currentPart + s).length < 200) {
                currentPart += s;
            } else {
                if (currentPart.trim()) parts.push(currentPart.trim());
                currentPart = s;
            }
        }
        if (currentPart.trim()) parts.push(currentPart.trim());
        return parts;
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                const ptVoices = availableVoices.filter(voice => voice.lang.includes('pt'));
                setVoices(ptVoices);
                if (ptVoices.length > 0 && !selectedVoice) {
                    const preferred = ptVoices.find(v => v.name.includes('Google') || v.name.includes('Premium')) || ptVoices[0];
                    setSelectedVoice(preferred.name);
                }
            };
            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
        return () => {
            if (synthRef.current) {
                isInterruptedRef.current = true;
                synthRef.current.cancel();
            }
        };
    }, [selectedVoice]);

    const handlePlay = () => {
        if (!synthRef.current || !cleanContent) return;
        if (isPaused) {
            synthRef.current.resume();
            setIsPaused(false);
            setIsPlaying(true);
            return;
        }
        isInterruptedRef.current = false;
        synthRef.current.cancel();
        const parts = splitContent(cleanContent);
        if (parts.length === 0) return;
        let currentPartIndex = 0;

        const speakPart = (index: number) => {
            if (!synthRef.current || index >= parts.length || isInterruptedRef.current) {
                if (!isInterruptedRef.current && index >= parts.length) {
                    setIsPlaying(false);
                    setIsPaused(false);
                    setProgress(100);
                }
                return;
            }
            const textToSpeak = parts[index];
            if (!textToSpeak.trim()) {
                speakPart(index + 1);
                return;
            }
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            if (selectedVoice) {
                const voice = voices.find(v => v.name === selectedVoice);
                if (voice) utterance.voice = voice;
            }
            utterance.lang = 'pt-BR';
            utterance.rate = rate;
            utterance.volume = 1;
            utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); };
            utterance.onend = () => { if (!isInterruptedRef.current) { currentPartIndex++; speakPart(currentPartIndex); } };
            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    const charIndex = event.charIndex;
                    const previousPartsLength = parts.slice(0, index).reduce((acc, p) => acc + p.length, 0);
                    const totalChars = cleanContent.length;
                    setProgress(((previousPartsLength + charIndex) / totalChars) * 100);
                }
            };
            setTimeout(() => { if (!isInterruptedRef.current) synthRef.current?.speak(utterance); }, 10);
        };
        speakPart(0);
    };

    const handlePause = () => {
        if (synthRef.current && isPlaying) {
            synthRef.current.pause();
            setIsPaused(true);
            setIsPlaying(false);
        }
    };

    const handleStop = () => {
        if (synthRef.current) {
            isInterruptedRef.current = true;
            synthRef.current.cancel();
            setIsPlaying(false);
            setIsPaused(false);
            setProgress(0);
        }
    };

    const handleRateChange = (newRate: string) => {
        const val = parseFloat(newRate);
        setRate(val);
        if (isPlaying || isPaused) {
            handleStop();
            setTimeout(() => handlePlay(), 150);
        }
    };

    const handleTogglePlay = () => {
        if (isPlaying) {
            handlePause();
        } else {
            handlePlay();
        }
    };

    return (
        <Card className={cn("px-3 py-2 border-none bg-[#F3F3F3] overflow-hidden relative shadow-none", className)}>
            {/* Progress bar */}
            <div
                className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
            />

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <Button
                        size="icon"
                        variant={isPlaying ? "secondary" : "default"}
                        className="h-8 w-8 rounded-full shrink-0"
                        onClick={handleTogglePlay}
                        disabled={!cleanContent}
                    >
                        {isPlaying ? (
                            <Pause size={14} fill="currentColor" />
                        ) : (
                            <Play size={14} fill="currentColor" />
                        )}
                    </Button>

                    {/* Label */}
                    <span className="text-sm font-medium text-[#212121]">Ouça</span>
                </div>

                {/* Speed selector */}
                <Select value={rate.toString()} onValueChange={handleRateChange}>
                    <SelectTrigger className="w-16 h-7 text-xs border-none bg-[#F5F5F5] hover:bg-accent text-[#212121]">
                        <SelectValue placeholder="1x" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0.75">0.75x</SelectItem>
                        <SelectItem value="1">1.0x</SelectItem>
                        <SelectItem value="1.25">1.25x</SelectItem>
                        <SelectItem value="1.5">1.5x</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </Card>
    );
}
