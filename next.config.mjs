/** @type {import('next').NextConfig} */
const nextConfig = {
    // Otimizações para Vercel
    reactStrictMode: true,
    poweredByHeader: false,

    // Redirects permanentes
    async redirects() {
        return [
            {
                source: '/signup',
                destination: '/login',
                permanent: true,
            },
        ];
    },

    // Cabeçalhos de segurança aprimorados
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://challenges.cloudflare.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com data:",
                            "img-src 'self' data: https: blob:",
                            "connect-src 'self' https://kkykesdoqdeagnuvlxao.supabase.co wss://kkykesdoqdeagnuvlxao.supabase.co https://www.google-analytics.com",
                            "frame-ancestors 'none'",
                            "form-action 'self'",
                            "base-uri 'self'",
                            "object-src 'none'",
                            "media-src 'self'",
                            "worker-src 'self' blob:",
                            "child-src 'self'",
                            "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://youtube.com",
                            "manifest-src 'self'"
                        ].join('; ')
                    }
                ]
            }
        ];
    },

    // Configuração segura para imagens externas - apenas domínios confiáveis
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "kkykesdoqdeagnuvlxao.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
        ],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 31536000, // 1 ano - Crítico para não estourar o limite de 5K transformações da Vercel
        dangerouslyAllowSVG: false,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    // Configurações de segurança adicionais
    serverExternalPackages: ['@supabase/supabase-js'],

    // Variáveis de ambiente serão carregadas do .env.local
    // NUNCA exponha credenciais sensíveis no código!

    // Otimizações de performance
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            'framer-motion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            'date-fns',
            'recharts',
        ],
    },

    transpilePackages: [
        "@tiptap/react",
        "@tiptap/core",
        "@tiptap/starter-kit",
        "@tiptap/extension-placeholder",
        "@tiptap/extension-link",
        "@tiptap/extension-image",
        "@tiptap/extension-youtube"
    ],

    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
};

export default nextConfig;