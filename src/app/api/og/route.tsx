import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Dynamic params
        const title = searchParams.get('title') || 'Casa dos Escritores';
        const type = searchParams.get('type') || 'Plataforma'; // 'Série', 'Capítulo', 'Perfil'
        const coverUrl = searchParams.get('cover'); // Background image
        const author = searchParams.get('author');
        
        // Fallback Background Color if no cover or cover fails
        const bgGradient = 'linear-gradient(to bottom right, #111115, #1d1c26)';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        backgroundImage: bgGradient,
                        backgroundColor: '#111115',
                        fontFamily: 'sans-serif',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Background Image with Dark Overlay - Only if coverUrl is present */}
                    {coverUrl && coverUrl.startsWith('http') && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                            <img
                                src={coverUrl}
                                alt="Background"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity: 0.5,
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundImage: 'linear-gradient(to top, rgba(17, 17, 21, 1) 5%, rgba(17, 17, 21, 0.4) 50%, rgba(17, 17, 21, 0.2) 100%)',
                                }}
                            />
                        </div>
                    )}

                    {/* Content Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '60px 80px',
                            width: '100%',
                            zIndex: 10,
                        }}
                    >
                        {/* Pill/Tag */}
                        {type && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 24px',
                                    backgroundColor: 'rgba(73, 78, 182, 0.3)', // Primary color with opacity
                                    border: '1px solid rgba(73, 78, 182, 0.5)',
                                    borderRadius: '100px',
                                    color: '#C7C9FF', // Light primary
                                    fontSize: 24,
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    marginBottom: '24px',
                                    alignSelf: 'flex-start',
                                }}
                            >
                                {type}
                            </div>
                        )}

                        {/* Title */}
                        <div
                            style={{
                                fontSize: title.length > 40 ? 64 : 84,
                                fontWeight: 800,
                                color: 'white',
                                lineHeight: 1.1,
                                marginBottom: author ? '20px' : '40px',
                                width: '100%',
                                wordWrap: 'break-word',
                                textShadow: '0 4px 30px rgba(0,0,0,0.9)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {title}
                        </div>

                        {/* Author */}
                        {author && (
                            <div
                                style={{
                                    fontSize: 36,
                                    color: '#D1D5DB', // gray-300
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: 400,
                                }}
                            >
                                por <span style={{ color: 'white', marginLeft: '12px', fontWeight: 700 }}>{author}</span>
                            </div>
                        )}

                        {/* Brand footer */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: '40px',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                paddingTop: '30px',
                                width: '100%',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ 
                                    width: 54, 
                                    height: 54, 
                                    backgroundColor: '#494EB6', 
                                    borderRadius: '14px', 
                                    marginRight: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: 28,
                                    fontWeight: 900
                                }}>
                                    CE
                                </div>
                                <div style={{ color: 'white', fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em' }}>
                                    Casa dos Escritores
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        console.log(`Failed to generate OG image`, e);
        return new Response(`Failed to generate the image`, { status: 500 });
    }
}
