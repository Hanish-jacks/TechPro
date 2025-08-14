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
          {/* Thumbnail Image */}
          <img
            src={thumbnailUrl || videoUrl}
            alt={title || "Video thumbnail"}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              // Fallback to video element for thumbnail if image fails
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          
          {/* Fallback Video Element for Thumbnail */}
          {!thumbnailUrl && (
            <video
              src={videoUrl}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              preload="metadata"
            />
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all duration-200 group-hover:bg-black/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:bg-white">
              <Play className="h-8 w-8 text-gray-800 ml-1" />
            </div>
          </div>

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
              <video
                ref={videoRef}
                src={videoUrl}
                className="h-full w-full"
                controls
                autoPlay
                muted={false}
                playsInline
                preload="auto"
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
