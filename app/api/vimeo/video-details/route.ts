import { NextRequest, NextResponse } from 'next/server';
import { toVimeoApiIdentifier, normalizeVimeoHash } from '@/app/lib/lms/vimeoUrl';

const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
const VIMEO_API_VERSION = process.env.NEXT_PUBLIC_VIMEO_API_VERSION || '3.4';

export async function POST(request: NextRequest) {
  try {
    if (!VIMEO_ACCESS_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Vimeo access token not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const rawId = String(body.vimeoId || '').trim();
    const vimeoHash = normalizeVimeoHash(body.vimeoHash, rawId.split(':')[0]);

    if (!rawId) {
      return NextResponse.json(
        { success: false, error: 'Vimeo ID is required' },
        { status: 400 }
      );
    }

    // Accept either "id", "id:hash", or separate vimeoHash
    const apiId = rawId.includes(':')
      ? rawId
      : toVimeoApiIdentifier(rawId, vimeoHash);

    // Get video details from Vimeo
    const videoResponse = await fetch(`https://api.vimeo.com/videos/${apiId}`, {
      headers: {
        'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
        'Accept': `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
      },
    });

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('Vimeo video details error:', errorText);
      return NextResponse.json(
        { success: false, error: `Failed to get video details: ${errorText}` },
        { status: videoResponse.status }
      );
    }

    const videoData = await videoResponse.json();

    // Extract useful information
    const embedUrl = videoData.player_embed_url;
    const thumbnailUrl = videoData.pictures?.sizes?.[videoData.pictures.sizes.length - 1]?.link;

    return NextResponse.json({
      success: true,
      vimeoId: rawId.includes(':') ? rawId.split(':')[0] : rawId,
      vimeoHash: vimeoHash || (rawId.includes(':') ? rawId.split(':')[1] : null),
      video: videoData,
      embedUrl,
      thumbnailUrl,
    });

  } catch (error) {
    console.error('Get video details error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
