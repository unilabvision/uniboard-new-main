import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL2!,
  process.env.SUPABASE_SERVICE_ROLE_KEY2!
);

// Vimeo API configuration
const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
const VIMEO_API_VERSION = process.env.NEXT_PUBLIC_VIMEO_API_VERSION || '3.4';

interface VimeoVideoResponse {
  uri: string;
  name: string;
  description?: string;
  duration: number;
  width: number;
  height: number;
  status: string;
  player_embed_url: string;
  link: string;
  pictures: {
    base_link: string;
    sizes: Array<{
      width: number;
      height: number;
      link: string;
    }>;
  };
}

// GET: Fetch video details from Vimeo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vimeoId = searchParams.get('vimeoId');

    if (!vimeoId) {
      return NextResponse.json(
        { error: 'Vimeo ID is required' },
        { status: 400 }
      );
    }

    if (!VIMEO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Vimeo access token not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
      headers: {
        'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
        'Accept': `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vimeo API error: ${response.statusText}`);
    }

    const videoData: VimeoVideoResponse = await response.json();

    return NextResponse.json({
      success: true,
      video: videoData,
    });
  } catch (error) {
    console.error('Error fetching video from Vimeo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// POST: Create video record in database after Vimeo upload
export async function POST(request: NextRequest) {
  console.log('=== Videos API POST Called ===');
  
  try {
    console.log('Parsing request body...');
    const body = await request.json();
    const { 
      lessonId, 
      title, 
      description, 
      vimeoId, 
      orderIndex = 0 
    } = body;

    console.log('Request data:', {
      lessonId,
      title,
      hasDescription: !!description,
      vimeoId,
      orderIndex
    });

    if (!lessonId || !title || !vimeoId) {
      console.error('Missing required fields:', { lessonId, title, vimeoId });
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: lessonId, title, vimeoId' 
        },
        { status: 400 }
      );
    }

    console.log('Fetching video details from Vimeo...');
    // Fetch video details from Vimeo
    const vimeoResponse = await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
      headers: {
        'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
        'Accept': `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
      },
    });

    console.log('Vimeo response status:', vimeoResponse.status);

    if (!vimeoResponse.ok) {
      console.error('Vimeo API error:', {
        status: vimeoResponse.status,
        statusText: vimeoResponse.statusText
      });
      return NextResponse.json(
        { 
          success: false,
          error: `Failed to fetch video details from Vimeo: ${vimeoResponse.status} ${vimeoResponse.statusText}` 
        },
        { status: vimeoResponse.status }
      );
    }

    const vimeoData: VimeoVideoResponse = await vimeoResponse.json();
    console.log('Vimeo data received:', {
      name: vimeoData.name,
      duration: vimeoData.duration,
      hasPictures: !!vimeoData.pictures
    });

    // Extract thumbnail URL (highest quality)
    const thumbnailUrl = vimeoData.pictures?.sizes?.length 
      ? vimeoData.pictures.sizes.sort((a, b) => b.width - a.width)[0].link
      : vimeoData.pictures?.base_link || '';

    console.log('Creating video record in database...');
    // Create video record in database
    const videoRecord = {
      lesson_id: lessonId,
      title,
      vimeo_id: vimeoId,
      video_url: vimeoData.link,
      vimeo_embed_url: vimeoData.player_embed_url,
      vimeo_hash: vimeoId,
      thumbnail_url: thumbnailUrl,
      duration_seconds: vimeoData.duration,
      width: vimeoData.width || 640,
      height: vimeoData.height || 360,
      description: description || vimeoData.description || '',
      order_index: orderIndex,
    };

    console.log('Video record to insert:', {
      lesson_id: videoRecord.lesson_id,
      title: videoRecord.title,
      vimeo_id: videoRecord.vimeo_id
    });

    const { data, error } = await supabase
      .from('myuni_videos')
      .insert([videoRecord])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: `Database error: ${error.message}` 
        },
        { status: 500 }
      );
    }

    console.log('Video record created successfully:', data?.id);

    return NextResponse.json({
      success: true,
      video: data,
    });
  } catch (error) {
    console.error('=== Videos API Error ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred while saving video' 
      },
      { status: 500 }
    );
  }
}

// PUT: Update video information
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, title, description, vimeoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Update in database
    const updateData: Record<string, string | undefined> = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('myuni_videos')
      .update(updateData)
      .eq('id', videoId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update on Vimeo if we have credentials and vimeoId
    if (vimeoId && VIMEO_ACCESS_TOKEN && (title || description !== undefined)) {
      const vimeoUpdateData: Record<string, string> = {};
      if (title) vimeoUpdateData.name = title;
      if (description !== undefined) vimeoUpdateData.description = description;

      await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
        },
        body: JSON.stringify(vimeoUpdateData),
      });
    }

    return NextResponse.json({
      success: true,
      video: data,
    });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete video from database and optionally from Vimeo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const vimeoId = searchParams.get('vimeoId');
    const deleteFromVimeo = searchParams.get('deleteFromVimeo') === 'true';

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Delete from database
    const { error } = await supabase
      .from('myuni_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      throw error;
    }

    // Delete from Vimeo if requested and we have credentials
    if (deleteFromVimeo && vimeoId && VIMEO_ACCESS_TOKEN) {
      await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
          'Accept': `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}