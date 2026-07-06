import { certificatesSupabase } from '@/app/_services/certificatesSupabaseClient';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Uploads a file to Supabase storage bucket
 * @param file - The file to upload
 * @param bucket - The bucket name (default: 'myunilab')
 * @param folder - The folder path within the bucket (default: 'certificate-templates')
 * @param onProgress - Optional progress callback
 * @returns Promise with upload result
 */
export async function uploadFileToSupabase(
  file: File,
  bucket: string = 'myunilab',
  folder: string = 'certificate-templates',
  clerkUserId?: string,
): Promise<UploadResult> {
  try {
    const supabase = certificatesSupabase;

    // If we have a Clerk user ID, use it for filename generation
    // Otherwise, generate a unique filename without user context
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = clerkUserId 
      ? `${clerkUserId}_${timestamp}_${randomString}.${fileExtension}`
      : `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file - we'll handle RLS at the bucket level
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error details:', {
        message: error.message,
        fullError: error
      });
      return {
        success: false,
        error: error.message || 'Dosya yüklenirken hata oluştu'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Dosya yüklendi ancak URL alınamadı'
      };
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };

  } catch (error) {
    console.error('Upload service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
    };
  }
}

/**
 * Deletes a file from Supabase storage
 * @param filePath - The path of the file to delete
 * @param bucket - The bucket name (default: 'myunilab')
 * @returns Promise with deletion result
 */
export async function deleteFileFromSupabase(
  filePath: string,
  bucket: string = 'myunilab'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = certificatesSupabase;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message || 'Dosya silinirken hata oluştu'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
    };
  }
}

/**
 * Validates file before upload
 * @param file - The file to validate
 * @param maxSize - Maximum file size in MB (default: 10)
 * @param allowedTypes - Allowed MIME types (default: image types)
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSize: number = 10,
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize * 1024 * 1024) {
    return {
      isValid: false,
      error: `Dosya boyutu ${maxSize}MB'dan büyük olamaz`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Desteklenmeyen dosya formatı. PNG, JPG, SVG veya WebP formatında dosya yükleyin'
    };
  }

  return { isValid: true };
}
