import "./globals.css";
import { Geist } from 'next/font/google';
import Header from "@/components/header";
import Footer from "@/components/Footer";

import Providers from "@/components/Providers";
import Link from "next/link";
import { Metadata } from 'next';
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { Toaster } from "@/components/ui/sonner";
import AccessTracker from "@/components/AccessTracker";
import ScrollRestoration from "@/components/ScrollRestoration";
import { CookieConsent } from "@/components/CookieConsent";

/**
 * Font configuration using Next.js Fonts.
 * Uses Geist Variable for modern, readable typography across the platform.
 */
const geist = Geist({
    subsets: ['latin'],
    variable: '--font-geist',
    display: 'swap',
});

/**
 * Global Metadata Configuration (SEO).
 * Defines titles, descriptions, OpenGraph, and Twitter cards for the entire platform.
 * Adheres to SEO Best Practices and Generative Engine Optimization (GEO).
 */
export const metadata: Metadata = {
    title: {
        default: "Casa dos Escritores | Publique Histórias Grátis e Ilimitadas",
        template: "%s | Casa dos Escritores"
    },
    description: "A melhor plataforma para escritores independentes. Publique suas histórias, contos, fanfics e livros de forma 100% gratuita e ilimitada. Conecte-se com leitores e cresça na carreira literária.",
    keywords: [
        "publicar histórias grátis",
        "plataforma para escritores",
        "publicação ilimitada",
        "escritores independentes",
        "ler histórias online",
        "fanfics",
        "contos",
        "livros online",
        "autopublicação",
        "comunidade de escritores"
    ],
    authors: [{ name: "Casa dos Escritores" }],
    creator: "Casa dos Escritores",
    publisher: "Casa dos Escritores",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://casadosescritores.com.br'),
    openGraph: {
        title: "Casa dos Escritores | Publique Histórias Grátis e Ilimitadas",
        description: "Publique suas histórias, contos e livros de forma 100% gratuita e ilimitada. A comunidade ideal para escritores e leitores.",
        url: 'https://casadosescritores.com.br',
        siteName: 'Casa dos Escritores',
        images: [
            {
                url: 'https://casadosescritores.com.br/og-default-image.png',
                width: 1200,
                height: 630,
                alt: 'Casa dos Escritores - Plataforma Grátis para Autores',
            },
        ],
        locale: 'pt_BR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Casa dos Escritores | Publique Histórias Grátis e Ilimitadas',
        description: 'Publique suas histórias, contos e livros de forma 100% gratuita e ilimitada.',
        images: ['https://casadosescritores.com.br/og-default-image.png'],
        creator: '@casadosescritoresbr',
        site: '@casadosescritoresbr',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

/**
 * Static Schema.org Markup (JSON-LD).
 * Optimized for SEO to help search engines understand the site structure.
 * Includes WebSite and Organization types.
 */
const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "name": "Casa dos Escritores",
            "url": "https://casadosescritores.com.br/",
            "description": "Plataforma gratuita e ilimitada para publicação de histórias e livros online.",
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://casadosescritores.com.br/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
            }
        },
        {
            "@type": "Organization",
            "name": "Casa dos Escritores",
            "url": "https://casadosescritores.com.br/",
            "logo": {
                "@type": "ImageObject",
                "url": "https://casadosescritores.com.br/logo.png",
                "width": 512,
                "height": 512
            },
            "sameAs": [
                "https://www.instagram.com/casadosescritoresbr"
            ],
            "description": "Comunidade e plataforma para escritores publicarem suas séries gratuitamente."
        }
    ]
};

/**
 * Root Layout Component.
 * The absolute foundation of the application.
 * Responsibility: Handle fonts, global providers, shared UI (Header/Footer),
 * and SEO bridge between Next.js metadata and HTML structure.
 * 
 * Hierarchy:
 * 1. HTML/Body (Variables & Layout)
 * 2. Providers (Auth, Themes, QueryClient)
 * 3. Page Infrastructure (Header, Main, Footer)
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" className={`${geist.variable} font-sans`} suppressHydrationWarning>
            <head>
                {/* Favicons */}
                <link rel="icon" type="image/svg+xml" href="/favicon/vector.svg" />
                <link rel="icon" type="image/png" sizes="96x96" href="/favicon/favicon-96x96.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
                {/* PWA Manifest */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#494EB6" />
                {/* Schema Markup - Seguro: apenas dados estáticos */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
                />



            </head>
            <body suppressHydrationWarning>
                <Providers>
                    <AccessTracker />
                    <ScrollRestoration />
                    <AnnouncementBanner position="top" />
                    <Header />
                    <AnnouncementBanner position="mid" />
                    <main className="flex-1">{children}</main>
                    <Footer />
                </Providers>
                <CookieConsent />
                <Toaster closeButton position="bottom-right" expand={false} richColors />
            </body>
        </html>
    );
}
