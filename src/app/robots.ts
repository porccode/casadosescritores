import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            // Regra 1: Motores Gerais + Busca IA em Tempo Real (ChatGPT Search, Perplexity)
            {
                userAgent: ['*', 'ChatGPT-User', 'PerplexityBot', 'Applebot-Extended'],
                allow: ['/', '/api/og'],
                disallow: ['/admin/', '/escrever/', '/api/', '/login', '/cadastro', '/nova-senha', '/messages', '/notifications'],
            },
            // Regra 2: Bloquear treinamento massivo de IA de terceiros sobre os textos dos autores
            {
                userAgent: ['GPTBot', 'Google-Extended', 'ClaudeBot', 'cohere-training'],
                disallow: '/', // Protege a propriedade intelectual literária da plataforma
            }
        ],
        sitemap: 'https://casadosescritores.com.br/sitemap.xml',
    };
}
