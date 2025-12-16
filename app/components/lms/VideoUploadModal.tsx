'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Video, Link, FileVideo } from 'lucide-react';

interface VideoUploadProps {
  lessonId: string;
  onVideoUploaded: (video: VideoRecord) => void;
  onClose: () => void;
  orderIndex?: number;
}

interface VideoRecord {
  id: string;
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

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
}

// Simple file validation function
const validateVideoFile = (
  file: File,
  maxSizeMB: number = 2048, // 2GB default
  allowedTypes: string[] = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
): { isValid: boolean; error?: string } => {
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
};

// Vimeo link validation function
const validateVimeoLink = (url: string): { isValid: boolean; vimeoId?: string; error?: string } => {
  if (!url.trim()) {
    return {
      isValid: false,
      error: 'Vimeo linki giriniz',
    };
  }

  // Vimeo URL patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/, // https://vimeo.com/123456789
    /player\.vimeo\.com\/video\/(\d+)/, // https://player.vimeo.com/video/123456789
    /vimeo\.com\/channels\/[^\/]+\/(\d+)/, // https://vimeo.com/channels/channelname/123456789
    /vimeo\.com\/groups\/[^\/]+\/videos\/(\d+)/, // https://vimeo.com/groups/groupname/videos/123456789
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        isValid: true,
        vimeoId: match[1],
      };
    }
  }

  return {
    isValid: false,
    error: 'Geçerli bir Vimeo linki giriniz (örn: https://vimeo.com/123456789)',
  };
};

export default function VideoUploadModal({ 
  lessonId, 
  onVideoUploaded, 
  onClose, 
  orderIndex = 0 
}: VideoUploadProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [vimeoLink, setVimeoLink] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: validation.error || 'Geçersiz dosya',
      });
      return;
    }

    setSelectedFile(file);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension for default title
    
    // Create preview URL for video
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Reset upload state
    setUploadState({
      status: 'idle',
      progress: 0,
      message: '',
    });
  };

  // Handle file drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Validate file
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: validation.error || 'Geçersiz dosya',
      });
      return;
    }

    setSelectedFile(file);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension for default title
    
    // Create preview URL for video
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Reset upload state
    setUploadState({
      status: 'idle',
      progress: 0,
      message: '',
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setVideoTitle('');
    setVideoDescription('');
    setUploadState({
      status: 'idle',
      progress: 0,
      message: '',
    });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Vimeo link submission
  const handleVimeoLinkSubmit = async () => {
    if (!vimeoLink.trim() || !videoTitle.trim()) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: 'Lütfen Vimeo linki ve video başlığı girin',
      });
      return;
    }

    // Validate Vimeo link
    const validation = validateVimeoLink(vimeoLink);
    if (!validation.isValid) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: validation.error || 'Geçersiz Vimeo linki',
      });
      return;
    }

    try {
      setUploadState({
        status: 'processing',
        progress: 50,
        message: 'Vimeo video detayları alınıyor...',
      });

      // Get video details from Vimeo
      const videoDetailsResponse = await fetch('/api/vimeo/video-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vimeoId: validation.vimeoId,
        }),
      });

      if (!videoDetailsResponse.ok) {
        const errorData = await videoDetailsResponse.json();
        throw new Error(errorData.error || 'Failed to get video details');
      }

      await videoDetailsResponse.json();

      setUploadState({
        status: 'processing',
        progress: 90,
        message: 'Video veritabanına kaydediliyor...',
      });

      // Save to database via our API
      const dbResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          title: videoTitle,
          description: videoDescription,
          vimeoId: validation.vimeoId,
          orderIndex,
        }),
      });

      if (!dbResponse.ok) {
        throw new Error(`Database save failed: ${dbResponse.status} ${dbResponse.statusText}`);
      }

      const dbResult = await dbResponse.json();

      if (!dbResult.success) {
        throw new Error(dbResult.error || 'Database save failed');
      }

      setUploadState({
        status: 'success',
        progress: 100,
        message: 'Video başarıyla eklendi!',
      });

      // Notify parent component
      onVideoUploaded(dbResult.video);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error adding Vimeo link:', error);
      
      let errorMessage = 'Bilinmeyen bir hata oluştu';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
        } else if (error.message.includes('Failed to get video details')) {
          errorMessage = 'Vimeo video detayları alınamadı. Linkin doğru olduğundan emin olun.';
        } else if (error.message.includes('Database save failed')) {
          errorMessage = 'Video kaydedilemedi. Lütfen tekrar deneyin.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadState({
        status: 'error',
        progress: 0,
        message: errorMessage,
      });
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !videoTitle.trim()) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: 'Lütfen dosya seçin ve video başlığı girin',
      });
      return;
    }

    try {
      setUploadState({
        status: 'uploading',
        progress: 0,
        message: 'Video Vimeo\'ya yükleniyor...',
      });

      // Step 1: Get upload URL from Vimeo
      const uploadUrlResponse = await fetch('/api/vimeo/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoTitle,
          description: videoDescription,
          size: selectedFile.size,
        }),
      });

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const uploadUrlData = await uploadUrlResponse.json();
      const { vimeoId, uploadUrl } = uploadUrlData;

      console.log('Upload URL data:', { vimeoId, uploadUrl });

      setUploadState(prev => ({
        ...prev,
        progress: 10,
        message: 'Upload URL alındı, dosya yükleniyor...',
      }));

      // Step 2: Upload directly to Vimeo with progress tracking
      const uploadResponse = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadState(prev => ({
              ...prev,
              progress: Math.min(10 + (percentComplete * 0.8), 90), // 10-90% range
              message: `Video yükleniyor... ${percentComplete}%`,
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Upload completed successfully - update progress to 100%
            setUploadState(prev => ({
              ...prev,
              progress: 100,
              message: 'Video yükleme tamamlandı!',
            }));
            
            // Create a Response-like object
            const response = new Response(JSON.stringify({
              success: true,
              vimeoId,
              videoUri: uploadUrlData.videoUri,
            }), {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({
                'content-type': 'application/json'
              })
            });
            resolve(response);
          } else {
            // Log detailed error information
            console.error('Upload failed:', {
              status: xhr.status,
              statusText: xhr.statusText,
              responseText: xhr.responseText,
              responseHeaders: xhr.getAllResponseHeaders()
            });
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed: Network error'));
        });

        // Use FormData for Vimeo upload (required format)
        const formData = new FormData();
        formData.append('file_data', selectedFile, selectedFile.name);
        
        xhr.open('POST', uploadUrl);
        // Don't set Content-Type, let browser set it with boundary for FormData
        xhr.send(formData);
      });

      // Check if response is ok and content type
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload response error:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          errorText
        });
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // Check content type before parsing JSON
      const contentType = uploadResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await uploadResponse.text();
        console.error('Non-JSON response:', {
          contentType,
          responseText
        });
        throw new Error('Server returned non-JSON response. Check server logs.');
      }

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Vimeo upload failed');
      }

      setUploadState({
        status: 'processing',
        progress: 90,
        message: 'Video detayları alınıyor...',
      });

      // Step 3: Get video details from Vimeo
      const videoDetailsResponse = await fetch('/api/vimeo/video-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vimeoId: uploadResult.vimeoId,
        }),
      });

      if (!videoDetailsResponse.ok) {
        const errorData = await videoDetailsResponse.json();
        throw new Error(errorData.error || 'Failed to get video details');
      }

      await videoDetailsResponse.json();

      setUploadState({
        status: 'processing',
        progress: 95,
        message: 'Video veritabanına kaydediliyor...',
      });

      // Step 4: Save to database via our API
      const dbResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          title: videoTitle,
          description: videoDescription,
          vimeoId: uploadResult.vimeoId,
          orderIndex,
        }),
      });

      // Check if response is ok and content type
      if (!dbResponse.ok) {
        const errorText = await dbResponse.text();
        console.error('Database response error:', {
          status: dbResponse.status,
          statusText: dbResponse.statusText,
          errorText
        });
        throw new Error(`Database save failed: ${dbResponse.status} ${dbResponse.statusText}`);
      }

      // Check content type before parsing JSON
      const dbContentType = dbResponse.headers.get('content-type');
      if (!dbContentType || !dbContentType.includes('application/json')) {
        const responseText = await dbResponse.text();
        console.error('Non-JSON response from database API:', {
          contentType: dbContentType,
          responseText
        });
        throw new Error('Database API returned non-JSON response. Check server logs.');
      }

      const dbResult = await dbResponse.json();

      if (!dbResult.success) {
        throw new Error(dbResult.error || 'Database save failed');
      }

      setUploadState({
        status: 'success',
        progress: 100,
        message: 'Video başarıyla yüklendi!',
      });

      // Notify parent component
      onVideoUploaded(dbResult.video);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('=== Upload Error in VideoUploadModal ===');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('Full error object:', error);
      
      let errorMessage = 'Bilinmeyen bir hata oluştu';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
        } else if (error.message.includes('non-JSON response')) {
          errorMessage = 'Sunucu yanıt hatası. Lütfen tekrar deneyin.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
        } else if (error.message.includes('Failed to get upload URL')) {
          errorMessage = 'Vimeo bağlantı hatası. Lütfen tekrar deneyin.';
        } else if (error.message.includes('Failed to get video details')) {
          errorMessage = 'Video detayları alınamadı. Lütfen tekrar deneyin.';
        } else if (error.message.includes('412')) {
          errorMessage = 'Video yükleme protokol hatası. Lütfen tekrar deneyin.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Video formatı desteklenmiyor. MP4, MOV, AVI veya WebM formatında video yükleyin.';
        } else if (error.message.includes('Upload failed')) {
          errorMessage = 'Video yükleme hatası. Dosya boyutunu kontrol edin.';
        } else {
          errorMessage = error.message;
        }
      } else {
        console.error('Non-Error object caught:', error);
        errorMessage = `Beklenmeyen hata: ${String(error)}`;
      }
      
      setUploadState({
        status: 'error',
        progress: 0,
        message: errorMessage,
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop - Light overlay for subtle darkening */}
      <div 
        className="absolute inset-0 bg-black/20 transition-opacity duration-200 ease-out z-[10000]"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[10001]">
        {/* Modal with animation */}
        <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-200 ease-out scale-100 opacity-100 border border-neutral-200 dark:border-neutral-700 pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Video Ekle
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
              >
                <FileVideo className="w-4 h-4 mr-2" />
                Dosya Yükle
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'link'
                    ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
              >
                <Link className="w-4 h-4 mr-2" />
                Link Ekle
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Upload Tab Content */}
            {activeTab === 'upload' && (
              <>
                {/* File Upload Area */}
                {!selectedFile ? (
                  <div
                    className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-md p-8 text-center hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors duration-200 cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-md flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      Video dosyası seçin
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                      Dosyayı buraya sürükleyip bırakın veya tıklayarak seçin
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors duration-200">
                      <Upload className="w-4 h-4 mr-2" />
                      Dosya Seç
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">
                      MP4, MOV, AVI, WebM • Maksimum: 2GB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  /* Selected File Preview */
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      {/* Video Preview */}
                      <div className="flex-shrink-0">
                        {previewUrl && (
                          <div className="relative">
                            <video
                              src={previewUrl}
                              className="w-24 h-16 object-cover rounded border border-neutral-200 dark:border-neutral-700"
                              controls={false}
                              muted
                            />
                            <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                              <div className="w-6 h-6 bg-white/90 rounded flex items-center justify-center">
                                <Video className="w-3 h-3 text-red-600" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <button
                            onClick={removeFile}
                            className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                            disabled={uploadState.status === 'uploading'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Upload Progress */}
                        {(uploadState.status === 'uploading' || uploadState.status === 'processing' || uploadState.status === 'success') && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                {uploadState.message}
                              </span>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                uploadState.status === 'success' 
                                  ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' 
                                  : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {uploadState.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded transition-all duration-500 ease-out ${
                                  uploadState.status === 'success' 
                                    ? 'bg-green-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${uploadState.progress}%` }}
                              ></div>
                            </div>
                            {uploadState.status === 'uploading' && (
                              <div className="flex items-center mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                Lütfen bu pencereyi kapatmayın...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Link Tab Content */}
            {activeTab === 'link' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-md p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                      <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Mevcut Vimeo Video Linki
                      </h3>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Zaten Vimeo&apos;da yüklü olan videolarınızın linkini buraya yapıştırın
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Vimeo Linki *
                  </label>
                  <input
                    type="url"
                    value={vimeoLink}
                    onChange={(e) => setVimeoLink(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-neutral-400 dark:placeholder-neutral-500"
                    placeholder="https://vimeo.com/123456789"
                    disabled={uploadState.status === 'processing'}
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Desteklenen formatlar: vimeo.com/123456789, player.vimeo.com/video/123456789
                  </p>
                </div>
              </div>
            )}

            {/* Video Details Form - Show for both tabs */}
            {(selectedFile || activeTab === 'link') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Video Başlığı *
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-neutral-400 dark:placeholder-neutral-500"
                    placeholder="Video başlığını girin..."
                    disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Video Açıklaması
                  </label>
                  <textarea
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-neutral-400 dark:placeholder-neutral-500 resize-none"
                    placeholder="Video açıklaması (opsiyonel)..."
                    disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
                  />
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadState.message && uploadState.status !== 'uploading' && (
              <div className={`flex items-center space-x-3 p-3 rounded-md border ${
                uploadState.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50'
                  : uploadState.status === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
              }`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center ${
                  uploadState.status === 'error'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : uploadState.status === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {uploadState.status === 'error' && <AlertCircle className="w-4 h-4" />}
                  {uploadState.status === 'success' && <CheckCircle className="w-4 h-4" />}
                </div>
                <p className="text-sm">{uploadState.message}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors text-sm font-medium"
              disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
            >
              İptal
            </button>
            <button
              onClick={activeTab === 'upload' ? handleUpload : handleVimeoLinkSubmit}
              disabled={
                uploadState.status === 'uploading' || 
                uploadState.status === 'processing' ||
                !videoTitle.trim() ||
                (activeTab === 'upload' && !selectedFile) ||
                (activeTab === 'link' && !vimeoLink.trim())
              }
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
            >
              {(uploadState.status === 'uploading' || uploadState.status === 'processing') ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{activeTab === 'upload' ? 'Yükleniyor...' : 'İşleniyor...'}</span>
                </>
              ) : (
                <>
                  {activeTab === 'upload' ? (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Videoyu Yükle</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      <span>Linki Ekle</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}