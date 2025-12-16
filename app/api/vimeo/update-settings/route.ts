import { NextRequest, NextResponse } from 'next/server';

const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
const VIMEO_API_VERSION = process.env.NEXT_PUBLIC_VIMEO_API_VERSION || '3.4';

export async function POST(request: NextRequest) {
  console.log('=== Vimeo Update Settings API Called ===');
  
  try {
    if (!VIMEO_ACCESS_TOKEN) {
      console.error('Vimeo access token not configured');
      return NextResponse.json(
        { success: false, error: 'Vimeo access token not configured' },
        { status: 500 }
      );
    }

    const { vimeoId } = await request.json();
    console.log('Updating settings for Vimeo ID:', vimeoId);

    if (!vimeoId) {
      return NextResponse.json(
        { success: false, error: 'Vimeo ID is required' },
        { status: 400 }
      );
    }

    // Update video settings on Vimeo
    console.log('Updating video settings on Vimeo...');
    const updateResponse = await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
      },
      body: JSON.stringify({
        privacy: {
          view: 'disable', // Hide from Vimeo - private on account but embeddable anywhere
          embed: 'whitelist', // Only allow embedding on specific domains
          download: false,
        },
        embed: {
          buttons: {
            like: false,
            watchlater: false,
            share: false,
            embed: false,
            hd: false,
            fullscreen: true,
            scaling: true,
          },
          logos: {
            vimeo: false, // Hide Vimeo logo
          },
          title: {
            name: 'hide', // Hide video title
            owner: 'hide', // Hide owner name
            portrait: 'hide', // Hide owner portrait
          },
          color: '#990000', // Custom player color
        },
        // Domain restrictions for embedding
        embed_domains: ['myunilab.net', 'www.myunilab.net'],
      }),
    });

    console.log('Vimeo update response status:', updateResponse.status);
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Vimeo update error:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        errorText
      });
      return NextResponse.json(
        { success: false, error: `Failed to update video settings: ${errorText}` },
        { status: updateResponse.status }
      );
    }

    console.log('Video settings updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Video settings updated successfully',
    });

  } catch (error) {
    console.error('Update video settings error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
