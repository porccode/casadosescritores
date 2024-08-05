import { NextResponse } from 'next/server';

export async function GET() {
    const content = `Contact: security@casadosescritores.com.br
Expires: 2026-12-31T23:59:59.000Z
Preferred-Languages: pt, en
Canonical: https://casadosescritores.com.br/.well-known/security.txt
Policy: https://casadosescritores.com.br/security-policy`;

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
