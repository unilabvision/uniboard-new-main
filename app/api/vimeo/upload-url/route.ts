import { NextRequest, NextResponse } from 'next/server';

const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
const VIMEO_API_VERSION = process.env.NEXT_PUBLIC_VIMEO_API_VERSION || '3.4';

export async function POST(request: NextRequest) {
  console.log('=== Vimeo Upload URL API Called ===');
  
  try {
    if (!VIMEO_ACCESS_TOKEN) {
      console.error('Vimeo access token not configured');
      return NextResponse.json(
        { success: false, error: 'Vimeo access token not configured' },
        { status: 500 }
      );
    }

    console.log('Parsing request body...');
    const { title, description, size } = await request.json();
    console.log('Request data:', { title, description, size });

    if (!title || !size) {
      return NextResponse.json(
        { success: false, error: 'Title and size are required' },
        { status: 400 }
      );
    }

    // Create video on Vimeo and get upload URL
    console.log('Creating video on Vimeo...');
    const createResponse = await fetch('https://api.vimeo.com/me/videos', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
      },
      body: JSON.stringify({
        name: title,
        description: description || '',
        upload: {
          approach: 'post', // Use POST for simpler uploads
          size: size,
        },
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

    console.log('Vimeo create response status:', createResponse.status);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Vimeo create error:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        errorText
      });
      return NextResponse.json(
        { success: false, error: `Failed to create video: ${errorText}` },
        { status: createResponse.status }
      );
    }

    const createData = await createResponse.json();
    console.log('Vimeo create data:', {
      uri: createData.uri,
      hasUpload: !!createData.upload,
      uploadApproach: createData.upload?.approach,
      uploadLink: createData.upload?.upload_link,
      uploadLinkSecure: createData.upload?.upload_link_secure
    });
    
    const uploadUrl = createData.upload?.upload_link_secure || createData.upload?.upload_link;
    const vimeoId = createData.uri.split('/').pop();

    if (!uploadUrl) {
      console.error('No upload URL in response:', createData);
      return NextResponse.json(
        { success: false, error: 'No upload URL received from Vimeo' },
        { status: 500 }
      );
    }

    console.log('Upload URL received successfully:', { vimeoId, uploadUrl });
    
    return NextResponse.json({
      success: true,
      vimeoId,
      uploadUrl,
      videoUri: createData.uri,
    });

  } catch (error) {
    console.error('Get upload URL error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
