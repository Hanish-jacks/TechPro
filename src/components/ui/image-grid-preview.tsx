import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ImageGridPreviewProps {
  images: string[];
  onRemove: (index: number) => void;
  onOpenViewer: (index: number) => void;
  className?: string;
}

export default function ImageGridPreview({ 
  images, 
  onRemove, 
  onOpenViewer, 
  className = "" 
}: ImageGridPreviewProps) {
  if (!images || images.length === 0) return null;

  const renderSingleImage = () => (
    <div className="relative w-full">
      <img
        src={images[0]}
        alt="Selected post image preview"
        loading="lazy"
        className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
        onClick={() => onOpenViewer(0)}
      />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute top-2 right-2 h-6 w-6 bg-black/50 hover:bg-black/70 text-white border-0"
        onClick={() => onRemove(0)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  const renderTwoImages = () => (
    <div className="grid grid-cols-2 gap-2">
      {images.map((imageUrl, index) => (
        <div key={index} className="relative">
          <img
            src={imageUrl}
            alt={`Selected post image preview ${index + 1}`}
            loading="lazy"
            className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onOpenViewer(index)}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 h-6 w-6 bg-black/50 hover:bg-black/70 text-white border-0"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );

  const renderThreeImages = () => (
    <div className="grid grid-cols-2 gap-2">
      {/* Large left image */}
      <div className="relative">
        <img
          src={images[0]}
          alt="Selected post image preview 1"
          loading="lazy"
          className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => onOpenViewer(0)}
        />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 h-6 w-6 bg-black/50 hover:bg-black/70 text-white border-0"
          onClick={() => onRemove(0)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      {/* Two stacked right images */}
      <div className="grid grid-rows-2 gap-2">
        {[1, 2].map((index) => (
          <div key={index} className="relative">
            <img
              src={images[index]}
              alt={`Selected post image preview ${index + 1}`}
              loading="lazy"
              className="rounded-lg w-full h-[calc(6rem-0.25rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => onOpenViewer(index)}
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={() => onRemove(index)}
            >
              <X className="h-2 w-2" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFourOrMoreImages = () => (
    <div className="grid grid-cols-2 gap-2">
      {/* Large left image */}
      <div className="relative">
        <img
          src={images[0]}
          alt="Selected post image preview 1"
          loading="lazy"
          className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => onOpenViewer(0)}
        />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 h-6 w-6 bg-black/50 hover:bg-black/70 text-white border-0"
          onClick={() => onRemove(0)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      {/* Right side with 2x2 grid */}
      <div className="grid grid-rows-2 gap-2">
        <div className="relative">
          <img
            src={images[1]}
            alt="Selected post image preview 2"
            loading="lazy"
            className="rounded-lg w-full h-[calc(6rem-0.25rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onOpenViewer(1)}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 text-white border-0"
            onClick={() => onRemove(1)}
          >
            <X className="h-2 w-2" />
          </Button>
        </div>
        <div className="relative">
          <img
            src={images[2]}
            alt="Selected post image preview 3"
            loading="lazy"
            className="rounded-lg w-full h-[calc(6rem-0.25rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onOpenViewer(2)}
          />
          {/* +X more overlay for 4+ images */}
          {images.length > 4 && (
            <div 
              className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
              onClick={() => onOpenViewer(3)}
            >
              <span className="text-white font-semibold text-sm">
                +{images.length - 3}
              </span>
            </div>
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 text-white border-0 z-10"
            onClick={() => onRemove(2)}
          >
            <X className="h-2 w-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderImages = () => {
    switch (images.length) {
      case 1:
        return renderSingleImage();
      case 2:
        return renderTwoImages();
      case 3:
        return renderThreeImages();
      default:
        return renderFourOrMoreImages();
    }
  };

  return (
    <div className={`${className}`}>
      {renderImages()}
    </div>
  );
}
