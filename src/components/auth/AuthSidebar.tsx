"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

const quotes = [
    {
        text: "A história cresce enquanto é contada.",
        author: "J.R.R. Tolkien",
        work: "A Sociedade do Anel",
        initials: "JT",
    },
    {
        text: "Um escritor só escreve um livro. O problema é descobrir qual é esse livro.",
        author: "Alberto Moravia",
        work: "Ensaios",
        initials: "AM",
    },
    {
        text: "Escrever é uma maneira de falar sem ser interrompido.",
        author: "Jules Renard",
        work: "Journal",
        initials: "JR",
    },
    {
        text: "Não existe uma amiga tão fiel quanto um livro.",
        author: "Ernest Hemingway",
        work: "Correspondências",
        initials: "EH",
    },
    {
        text: "A imaginação é o começo da criação. Você imagina o que deseja, deseja o que imagina e, por fim, cria o que deseja.",
        author: "George Bernard Shaw",
        work: "Back to Methuselah",
        initials: "GS",
    },
    {
        text: "O escritor só precisa de uma mesa, uma cadeira e uma profunda inquietação.",
        author: "Clarice Lispector",
        work: "A Paixão Segundo G.H.",
        initials: "CL",
    },
    {
        text: "Toda a minha vida sempre soube que haveria de ser escritor. A dúvida era saber se conseguiria.",
        author: "Gabriel García Márquez",
        work: "Viver Para Contá-la",
        initials: "GM",
    },
    {
        text: "Um livro deve ser o machado para o mar gelado que há dentro de nós.",
        author: "Franz Kafka",
        work: "Cartas a Oskar Pollak",
        initials: "FK",
    },
];

/**
 * AuthSidebar Component.
 *
 * Exibe frases rotativas de grandes escritores com transição suave.
 * Usa avatares com iniciais para evitar imagens quebradas.
 */
export function AuthSidebar() {
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            // Fade out
            setVisible(false);

            setTimeout(() => {
                setCurrent((prev) => (prev + 1) % quotes.length);
                // Fade in
                setVisible(true);
            }, 500);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    const quote = quotes[current];

    return (
        <div className="hidden lg:flex relative flex-col justify-between p-12 bg-primary text-primary-foreground overflow-hidden">
            {/* Background decorative blobs */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-white/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

            {/* Quote content — vertically centered */}
            <div className="relative z-10 flex flex-col justify-center flex-1">
                <div
                    className="space-y-8 transition-opacity duration-500"
                    style={{ opacity: visible ? 1 : 0 }}
                >
                    {/* Quote icon */}
                    <Quote className="w-10 h-10 text-primary-foreground/25" />

                    {/* Quote text */}
                    <blockquote className="text-2xl font-medium leading-snug tracking-tight font-serif italic text-primary-foreground/95">
                        &ldquo;{quote.text}&rdquo;
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                        {/* Avatar with initials */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 border border-primary-foreground/25 text-sm font-bold text-primary-foreground select-none">
                            {quote.initials}
                        </div>
                        <div>
                            <p className="font-semibold text-base text-primary-foreground">
                                {quote.author}
                            </p>
                            <p className="text-sm text-primary-foreground/55 mt-0.5 italic">
                                {quote.work}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress dots */}
            <div className="relative z-10 flex items-center gap-1.5 mt-12">
                {quotes.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setVisible(false);
                            setTimeout(() => {
                                setCurrent(i);
                                setVisible(true);
                            }, 400);
                        }}
                        aria-label={`Ver frase ${i + 1}`}
                        className="h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
                        style={{
                            width: i === current ? "2rem" : "0.375rem",
                            backgroundColor:
                                i === current
                                    ? "hsl(var(--primary-foreground) / 0.9)"
                                    : "hsl(var(--primary-foreground) / 0.3)",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
