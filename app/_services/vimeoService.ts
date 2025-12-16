import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Types for Vimeo API responses
export interface VimeoVideo {
  uri: string;
  name: string;
  description?: string;
  duration: number;
  width: number;
  height: number;
  status: string;
  embed: {
    html: string;
    badges: {
      hdr: boolean;
      live: {
        streaming: boolean;
        archived: boolean;
      };
      staff_pick: {
        normal: boolean;
        best_of_the_month: boolean;
        best_of_the_year: boolean;
        premiere: boolean;
      };
      vod: boolean;
      weekend_challenge: boolean;
    };
  };
  pictures: {
    base_link: string;
    uri: string;
    active: boolean;
    type: string;
    sizes: Array<{
      width: number;
      height: number;
      link: string;
      link_with_play_button?: string;
    }>;
    resource_key: string;
    default_picture: boolean;
  };
  player_embed_url: string;
  link: string;
}

export interface VimeoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface VimeoUploadResult {
  success: boolean;
  video?: VimeoVideo;
  vimeoId?: string;
  error?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

export interface DatabaseVideoRecord {
  id?: string;
  lesson_id: string;
  title: string;
  vimeo_id?: string;
  video_url?: string;
  vimeo_embed_url?: string;
  vimeo_hash?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  width: number;
  height: number;
  description?: string;
  order_index: number;
}

class VimeoService {
  private readonly baseUrl = 'https://api.vimeo.com';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;

  constructor() {
    this.clientId = process.env.VIMEO_CLIENT_ID || '';
    this.clientSecret = process.env.VIMEO_CLIENT_SECRET || '';
    this.accessToken = process.env.VIMEO_ACCESS_TOKEN || '';
    this.apiVersion = process.env.NEXT_PUBLIC_VIMEO_API_VERSION || '3.4';

    if (!this.accessToken) {
      console.warn('Vimeo access token not found in environment variables');
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.vimeo.*+json;version=' + this.apiVersion,
    };
  }

  /**
   * Upload a video file to Vimeo
   * @param file - The video file to upload
   * @param title - The video title
   * @param description - The video description (optional)
   * @param onProgress - Progress callback function (optional)
   * @returns Promise with upload result
   */
  async uploadVideo(
    file: File,
    title: string,
    description?: string,
    onProgress?: (progress: VimeoUploadProgress) => void
  ): Promise<VimeoUploadResult> {
    try {
      // Step 1: Create the video on Vimeo
      const createResponse = await fetch(`${this.baseUrl}/me/videos`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: title,
          description: description || '',
          upload: {
            approach: 'tus',
            size: file.size,
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

      if (!createResponse.ok) {
        const errorData = await createResponse.text();
        throw new Error(`Failed to create video on Vimeo: ${errorData}`);
      }

      const createData = await createResponse.json();
      const uploadLink = createData.upload?.upload_link;
      const videoUri = createData.uri;
      const vimeoId = videoUri.split('/').pop();

      if (!uploadLink) {
        throw new Error('No upload link received from Vimeo');
      }

      // Step 2: Upload the actual file using TUS protocol
      await this.uploadFileWithTus(file, uploadLink, onProgress);

      // Step 3: Wait for video processing and get video details
      const videoDetails = await this.waitForVideoProcessing(videoUri);

      if (!videoDetails) {
        throw new Error('Failed to get video details after upload');
      }

      // Extract useful information
      const embedUrl = videoDetails.player_embed_url;
      const thumbnailUrl = this.getHighestQualityThumbnail(videoDetails.pictures);

      return {
        success: true,
        video: videoDetails,
        vimeoId,
        embedUrl,
        thumbnailUrl,
      };
    } catch (error) {
      console.error('Vimeo upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  /**
   * Upload file using TUS protocol (resumable uploads)
   */
  private async uploadFileWithTus(
    file: File,
    uploadUrl: string,
    onProgress?: (progress: VimeoUploadProgress) => void
  ): Promise<void> {
    const chunkSize = 1024 * 1024; // 1MB chunks
    let uploadedBytes = 0;

    while (uploadedBytes < file.size) {
      const chunk = file.slice(uploadedBytes, uploadedBytes + chunkSize);

      const response = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': uploadedBytes.toString(),
          'Tus-Resumable': '1.0.0',
        },
        body: chunk,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      uploadedBytes += chunk.size;

      // Call progress callback
      if (onProgress) {
        onProgress({
          loaded: uploadedBytes,
          total: file.size,
          percentage: Math.round((uploadedBytes / file.size) * 100),
        });
      }
    }
  }

  /**
   * Wait for video processing to complete and return video details
   */
  private async waitForVideoProcessing(videoUri: string, maxAttempts = 30): Promise<VimeoVideo | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${videoUri}`, {
          headers: this.getHeaders(),
        });

        if (response.ok) {
          const videoData: VimeoVideo = await response.json();
          
          // Check if video is available (not still processing)
          if (videoData.status === 'available') {
            return videoData;
          }
        }

        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error checking video status:', error);
      }
    }

    return null;
  }

  /**
   * Get video details by Vimeo ID
   */
  async getVideoById(vimeoId: string): Promise<VimeoVideo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/${vimeoId}`, {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Error fetching video details:', error);
      return null;
    }
  }

  /**
   * Delete a video from Vimeo
   */
  async deleteVideo(vimeoId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/${vimeoId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }

  /**
   * Update video privacy and embed settings
   */
  async updateVideoSettings(vimeoId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/${vimeoId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
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

      return response.ok;
    } catch (error) {
      console.error('Error updating video settings:', error);
      return false;
    }
  }

  /**
   * Update video information on Vimeo
   */
  async updateVideo(vimeoId: string, title?: string, description?: string): Promise<boolean> {
    try {
      const body: Record<string, unknown> = {};
      if (title) body.name = title;
      if (description) body.description = description;

      // Also update privacy and embed settings
      body.privacy = {
        view: 'disable', // Hide from Vimeo - private on account but embeddable anywhere
        embed: 'whitelist', // Only allow embedding on specific domains
        download: false,
      };
      body.embed = {
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
          vimeo: false,
        },
        title: {
          name: 'hide',
          owner: 'hide',
          portrait: 'hide',
        },
        color: '#990000',
      };
      body.embed_domains = ['myunilab.net', 'www.myunilab.net'];

      const response = await fetch(`${this.baseUrl}/videos/${vimeoId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating video:', error);
      return false;
    }
  }

  /**
   * Extract highest quality thumbnail from Vimeo pictures
   */
  private getHighestQualityThumbnail(pictures: VimeoVideo['pictures']): string {
    if (!pictures?.sizes?.length) return '';
    
    // Sort by width (descending) and return the largest
    const sortedSizes = pictures.sizes.sort((a, b) => b.width - a.width);
    return sortedSizes[0]?.link || pictures.base_link || '';
  }

  /**
   * Save video information to database
   */
  async saveVideoToDatabase(
    lessonId: string,
    title: string,
    vimeoData: VimeoVideo,
    orderIndex: number = 0,
    description?: string
  ): Promise<{ success: boolean; video?: DatabaseVideoRecord; error?: string }> {
    try {
      const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2!,
      });

      const vimeoId = vimeoData.uri.split('/').pop();
      const thumbnailUrl = this.getHighestQualityThumbnail(vimeoData.pictures);

      const videoRecord: Omit<DatabaseVideoRecord, 'id'> = {
        lesson_id: lessonId,
        title,
        vimeo_id: vimeoId,
        video_url: vimeoData.link,
        vimeo_embed_url: vimeoData.player_embed_url,
        vimeo_hash: vimeoId, // Using Vimeo ID as hash
        thumbnail_url: thumbnailUrl,
        duration_seconds: vimeoData.duration,
        width: vimeoData.width || 640,
        height: vimeoData.height || 360,
        description: description || vimeoData.description,
        order_index: orderIndex,
      };

      const { data, error } = await supabase
        .from('myuni_videos')
        .insert([videoRecord])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        video: data,
      };
    } catch (error) {
      console.error('Error saving video to database:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database save failed',
      };
    }
  }

  /**
   * Upload video and save to database in one operation
   */
  async uploadAndSaveVideo(
    file: File,
    lessonId: string,
    title: string,
    description?: string,
    orderIndex: number = 0,
    onProgress?: (progress: VimeoUploadProgress) => void
  ): Promise<{ success: boolean; video?: DatabaseVideoRecord; error?: string }> {
    try {
      // Step 1: Upload to Vimeo
      const uploadResult = await this.uploadVideo(file, title, description, onProgress);
      
      if (!uploadResult.success || !uploadResult.video) {
        return {
          success: false,
          error: uploadResult.error || 'Vimeo upload failed',
        };
      }

      // Step 2: Save to database
      const dbResult = await this.saveVideoToDatabase(
        lessonId,
        title,
        uploadResult.video,
        orderIndex,
        description
      );

      return dbResult;
    } catch (error) {
      console.error('Error in uploadAndSaveVideo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload and save failed',
      };
    }
  }

  /**
   * Get embed URL for a video
   */
  getEmbedUrl(vimeoId: string): string {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  /**
   * Validate video file before upload
   */
  validateVideoFile(
    file: File,
    maxSizeMB: number = 1000, // 1GB default
    allowedTypes: string[] = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
  ): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return {
        isValid: false,
        error: `Video boyutu ${maxSizeMB}MB'dan büyük olamaz`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Desteklenmeyen video formatı. MP4, MOV, AVI veya WebM formatında video yükleyin',
      };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const vimeoService = new VimeoService();
export default vimeoService;