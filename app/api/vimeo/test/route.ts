import { NextResponse } from 'next/server';

const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
const VIMEO_API_VERSION = process.env.NEXT_PUBLIC_VIMEO_API_VERSION || '3.4';

export async function GET() {
  try {
    if (!VIMEO_ACCESS_TOKEN) {
      return NextResponse.json(
        { 
          error: 'Vimeo access token not configured',
          hasToken: false 
        },
        { status: 500 }
      );
    }

    // Test authentication by fetching user info
    const response = await fetch('https://api.vimeo.com/me', {
      headers: {
        'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
        'Accept': `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: `Vimeo authentication failed: ${errorText}`,
          status: response.status,
          hasToken: true,
          tokenLength: VIMEO_ACCESS_TOKEN.length
        },
        { status: response.status }
      );
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Vimeo authentication successful',
      user: {
        name: userData.name,
        link: userData.link,
        account: userData.account
      },
      hasToken: true,
      tokenLength: VIMEO_ACCESS_TOKEN.length
    });

  } catch (error) {
    console.error('Vimeo test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        hasToken: !!VIMEO_ACCESS_TOKEN
      },
      { status: 500 }
    );
  }
}