'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Play, Pause, Volume2, VolumeX, 
  Maximize, Minimize
} from 'lucide-react';

interface VimeoPlayerProps {
  vimeoId: string;
  vimeoHash?: string;
  title: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  responsive?: boolean;
  quality?: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

interface VimeoPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  quality: string;
  isLoading: boolean;
  error?: string;
}

// Vimeo Player Component with Enhanced Features
export const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  vimeoId,
  vimeoHash,
  title,
  width = 640,
  height = 360,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  responsive = true,
  quality = 'auto',
  onPlay,
  onPause,
  onEnded,
  onProgress,
  className = ''
}) => {
  const [playerState, setPlayerState] = useState<VimeoPlayerState>({
    isPlaying: false,
    isMuted: muted,
    isFullscreen: false,
    duration: 0,
    currentTime: 0,
    volume: 1,
    quality: quality,
    isLoading: true
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build Vimeo embed URL with parameters
  const buildEmbedUrl = () => {
    const baseUrl = `https://player.vimeo.com/video/${vimeoId}`;
    const params = new URLSearchParams({
      badge: '0',
      autopause: '0',
      player_id: '0',
      app_id: '58479',
      autoplay: autoplay ? '1' : '0',
      loop: loop ? '1' : '0',
      muted: muted ? '1' : '0',
      controls: controls ? '1' : '0',
      quality: quality,
      responsive: responsive ? '1' : '0'
    });

    if (vimeoHash) {
      params.set('h', vimeoHash);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  // Handle iframe messages from Vimeo player
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;

      try {
        const data = JSON.parse(event.data);
        
        switch (data.event) {
          case 'ready':
            setPlayerState(prev => ({ ...prev, isLoading: false }));
            break;
          case 'play':
            setPlayerState(prev => ({ ...prev, isPlaying: true }));
            onPlay?.();
            break;
          case 'pause':
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
            onPause?.();
            break;
          case 'ended':
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
            onEnded?.();
            break;
          case 'timeupdate':
            if (data.data) {
              setPlayerState(prev => ({ 
                ...prev, 
                currentTime: data.data.seconds || 0 
              }));
              onProgress?.(data.data.percent || 0);
            }
            break;
          case 'loaded':
            if (data.data) {
              setPlayerState(prev => ({ 
                ...prev, 
                duration: data.data.duration || 0 
              }));
            }
            break;
          case 'volumechange':
            if (data.data) {
              setPlayerState(prev => ({ 
                ...prev, 
                volume: data.data.volume || 0,
                isMuted: data.data.volume === 0
              }));
            }
            break;
          case 'error':
            setPlayerState(prev => ({ 
              ...prev, 
              error: 'Video yüklenirken bir hata oluştu',
              isLoading: false 
            }));
            break;
        }
      } catch (error) {
        console.error('Vimeo player message parsing error:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPlay, onPause, onEnded, onProgress]);

  // Post message to Vimeo player
  const postMessage = (method: string, value?: number | string) => {
    if (!iframeRef.current) return;
    
    const message = {
      method,
      value
    };
    
    iframeRef.current.contentWindow?.postMessage(JSON.stringify(message), 'https://player.vimeo.com');
  };

  // Player control methods
  const togglePlay = () => {
    postMessage(playerState.isPlaying ? 'pause' : 'play');
  };

  const toggleMute = () => {
    postMessage('setVolume', playerState.isMuted ? playerState.volume : 0);
  };

  const seekTo = (time: number) => {
    postMessage('setCurrentTime', time);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setPlayerState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen?.();
      setPlayerState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        isFullscreen: !!document.fullscreenElement 
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format time helper
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Error state
  if (playerState.error) {
    return (
      <div 
        className={`bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center ${className}`}
        style={{ 
          width: responsive ? '100%' : width, 
          height: responsive ? 'auto' : height,
          aspectRatio: responsive ? `${width}/${height}` : undefined
        }}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Play className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Video Yüklenemedi
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            {playerState.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      style={{ 
        width: responsive ? '100%' : width, 
        height: responsive ? 'auto' : height,
        aspectRatio: responsive ? `${width}/${height}` : undefined
      }}
    >
      {/* Loading State */}
      {playerState.isLoading && (
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-sm">Video yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Vimeo Iframe */}
      <iframe
        ref={iframeRef}
        src={buildEmbedUrl()}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
        style={{ display: playerState.isLoading ? 'none' : 'block' }}
      />

      {/* Custom Controls Overlay (Optional) */}
      {controls && !playerState.isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-neutral-300 transition-colors"
              aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
            >
              {playerState.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Progress Bar */}
            <div className="flex-1">
              <div className="relative">
                <div className="h-1 bg-white/30 rounded-full">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{ 
                      width: `${(playerState.currentTime / playerState.duration) * 100}%` 
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={playerState.duration}
                  value={playerState.currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="text-white text-sm font-mono">
              {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
            </div>

            {/* Volume Control */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-neutral-300 transition-colors"
              aria-label={playerState.isMuted ? 'Unmute' : 'Mute'}
            >
              {playerState.isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-neutral-300 transition-colors"
              aria-label={playerState.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {playerState.isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Video Title Overlay */}
      <div className="absolute top-4 left-4 right-4">
        <h3 className="text-white text-lg font-medium drop-shadow-lg">
          {title}
        </h3>
      </div>
    </div>
  );
};

// Simple Vimeo Player Component (Lightweight version)
export const SimpleVimeoPlayer: React.FC<{
  vimeoId: string;
  vimeoHash?: string;
  title: string;
  width?: number;
  height?: number;
  className?: string;
}> = ({
  vimeoId,
  vimeoHash,
  title,
  width = 640,
  height = 360,
  className = ''
}) => {
  const embedUrl = vimeoHash 
    ? `https://player.vimeo.com/video/${vimeoId}?h=${vimeoHash}&badge=0&autopause=0&quality_selector=1&player_id=0&app_id=58479`
    : `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&quality_selector=1&player_id=0&app_id=58479`;

  return (
    <div 
      className={`relative w-full ${className}`} 
      style={{ paddingBottom: `${(height / width) * 100}%` }}
    >
      <iframe
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
      />
    </div>
  );
};

// Video Thumbnail Component with Play Button
export const VimeoThumbnail: React.FC<{
  vimeoId: string;
  title: string;
  duration?: number;
  onClick: () => void;
  className?: string;
}> = ({
  vimeoId,
  title,
  duration,
  onClick,
  className = ''
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch Vimeo thumbnail
  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        // Use Vimeo's thumbnail API
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`);
        const data = await response.json();
        setThumbnailUrl(data.thumbnail_url);
      } catch (error) {
        console.error('Error fetching Vimeo thumbnail:', error);
        // Fallback to default Vimeo thumbnail URL pattern
        setThumbnailUrl(`https://vumbnail.com/${vimeoId}.jpg`);
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnail();
  }, [vimeoId]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`relative group cursor-pointer rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
    >
      {loading ? (
        <div className="w-full aspect-video bg-neutral-200 dark:bg-neutral-700 animate-pulse flex items-center justify-center">
          <Play className="w-12 h-12 text-neutral-400" />
        </div>
      ) : (
        <>
          <Image 
            src={thumbnailUrl} 
            alt={title}
            width={640}
            height={360}
            className="w-full aspect-video object-cover"
            priority
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-neutral-900 ml-1" />
            </div>
          </div>

          {/* Duration Badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(duration)}
            </div>
          )}

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <h4 className="text-white font-medium text-sm line-clamp-2">
              {title}
            </h4>
          </div>
        </>
      )}
    </div>
  );
};

export default VimeoPlayer;
