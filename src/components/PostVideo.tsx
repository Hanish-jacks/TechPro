import React, { useState, useRef, useEffect } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostVideoProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  className?: string;
  showNavigation?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export const PostVideo: React.FC<PostVideoProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  description,
  className,
  showNavigation = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Handle video autoplay when modal opens
  useEffect(() => {
    if (isModalOpen && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented:', error);
      });
    }
  }, [isModalOpen]);

  const handleOpenModal = () => {
    // Check if video URL is accessible
    if (!videoUrl) {
      console.error('No video URL provided');
      return;
    }
    
    // For large videos, show a loading state
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handlePrevious = () => {
    if (onPrevious && hasPrevious) {
      onPrevious();
    }
  };

  const handleNext = () => {
    if (onNext && hasNext) {
      onNext();
    }
  };

  return (
    <>
      {/* Feed View - Video Thumbnail */}
      <div
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all duration-200 hover:shadow-md",
          className
        )}
        onClick={handleOpenModal}
      >
        {/* Aspect Ratio Container */}
        <div className="relative aspect-video w-full">
          {/* Video Thumbnail - Show actual thumbnail or first frame */}
          {thumbnailUrl && thumbnailUrl !== videoUrl ? (
            // Show the actual thumbnail image
            <>
              {thumbnailLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-xs">Loading thumbnail...</p>
                  </div>
                </div>
              )}
              <img
                src={thumbnailUrl}
                alt={title || "Video thumbnail"}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                onLoad={() => setThumbnailLoading(false)}
                onError={() => {
                  setThumbnailLoading(false);
                  // If thumbnail fails, fall back to video frame
                  const imgElement = document.querySelector(`[data-video-thumb="${videoUrl}"]`) as HTMLImageElement;
                  if (imgElement) {
                    imgElement.style.display = 'none';
                    const videoElement = imgElement.nextElementSibling as HTMLVideoElement;
                    if (videoElement) {
                      videoElement.style.display = 'block';
                    }
                  }
                }}
                data-video-thumb={videoUrl}
              />
            </>
          ) : (
            // Fallback to video element showing first frame
            <video
              src={videoUrl}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              muted
              preload="metadata"
              onLoadedData={(e) => {
                // Ensure the video shows the first frame
                const video = e.target as HTMLVideoElement;
                video.currentTime = 0.1; // Skip to 0.1 seconds to avoid black frame
                setThumbnailLoading(false);
              }}
              onSeeked={(e) => {
                // When seeking is complete, pause the video to show the frame
                const video = e.target as HTMLVideoElement;
                video.pause();
              }}
              style={{ display: thumbnailUrl && thumbnailUrl !== videoUrl ? 'none' : 'block' }}
            />
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all duration-200 group-hover:bg-black/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:bg-white">
              <Play className="h-8 w-8 text-gray-800 ml-1" />
            </div>
          </div>
          
          {/* File Size Warning for Large Videos */}
          {videoUrl && videoUrl.includes('post-videos') && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Video Post
            </div>
          )}

          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/10" />
        </div>

        {/* Video Info (Optional) */}
        {(title || description) && (
          <div className="p-4">
            {title && (
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
        )}
      </div>

      {/* Full-Screen Modal Player */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 mx-4 w-full max-w-6xl">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute -top-12 right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30 hover:scale-110"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation Arrows */}
            {showNavigation && (
              <>
                {hasPrevious && (
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30 hover:scale-110"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                
                {hasNext && (
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30 hover:scale-110"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </>
            )}

            {/* Video Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading video...</p>
                  </div>
                </div>
              )}
              
              {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <p className="text-red-400 mb-2">Failed to load video</p>
                    <p className="text-sm text-gray-300">The video may be too large or unavailable</p>
                    <button 
                      onClick={() => {
                        setHasError(false);
                        setIsLoading(true);
                        if (videoRef.current) {
                          videoRef.current.load();
                        }
                      }}
                      className="mt-2 px-4 py-2 bg-white/20 rounded hover:bg-white/30 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              
              <video
                ref={videoRef}
                src={videoUrl}
                className="h-full w-full"
                controls
                autoPlay
                muted={false}
                playsInline
                preload="auto"
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Info in Modal */}
            {(title || description) && (
              <div className="mt-4 text-center text-white">
                {title && (
                  <h2 className="text-xl font-semibold mb-2">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-gray-300">{description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
