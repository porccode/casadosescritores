import { NextResponse } from 'next/server';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC'; // Fallback to beta key (might be rate limited)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const offset = searchParams.get('offset') || '0';
    const limit = searchParams.get('limit') || '20';

    try {
        let url = '';
        if (q) {
            url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&rating=g&lang=pt`;
        } else {
            url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Giphy API Error (${response.status}):`, errorText);
            throw new Error(`Giphy API responded with ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Giphy API Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch GIFs' }, { status: 500 });
    }
}
