import React from "react";

interface ImageGridProps {
  images: string[];
  onImageClick: (index: number) => void;
  className?: string;
}

export default function ImageGrid({ images, onImageClick, className = "" }: ImageGridProps) {
  if (!images || images.length === 0) return null;

  const renderSingleImage = () => (
    <div className="relative w-full">
      <img
        src={images[0]}
        alt="Post image"
        loading="lazy"
        className="rounded-lg w-full h-auto max-h-[500px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
        onClick={() => onImageClick(0)}
      />
    </div>
  );

  const renderTwoImages = () => (
    <div className="grid grid-cols-2 gap-1">
      {images.map((imageUrl, index) => (
        <div key={index} className="relative">
          <img
            src={imageUrl}
            alt={`Post image ${index + 1}`}
            loading="lazy"
            className="rounded-lg w-full h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onImageClick(index)}
          />
        </div>
      ))}
    </div>
  );

  const renderThreeImages = () => (
    <div className="grid grid-cols-2 gap-1">
      {/* Large left image */}
      <div className="relative">
        <img
          src={images[0]}
          alt="Post image 1"
          loading="lazy"
          className="rounded-lg w-full h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => onImageClick(0)}
        />
      </div>
      {/* Two stacked right images */}
      <div className="grid grid-rows-2 gap-1">
        <div className="relative">
          <img
            src={images[1]}
            alt="Post image 2"
            loading="lazy"
            className="rounded-lg w-full h-[calc(8rem-0.125rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onImageClick(1)}
          />
        </div>
        <div className="relative">
          <img
            src={images[2]}
            alt="Post image 3"
            loading="lazy"
            className="rounded-lg w-full h-[calc(8rem-0.125rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onImageClick(2)}
          />
        </div>
      </div>
    </div>
  );

  const renderFourOrMoreImages = () => (
    <div className="grid grid-cols-2 gap-1">
      {/* Large left image */}
      <div className="relative">
        <img
          src={images[0]}
          alt="Post image 1"
          loading="lazy"
          className="rounded-lg w-full h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => onImageClick(0)}
        />
      </div>
      {/* Right side with 2x2 grid */}
      <div className="grid grid-rows-2 gap-1">
        <div className="relative">
          <img
            src={images[1]}
            alt="Post image 2"
            loading="lazy"
            className="rounded-lg w-full h-[calc(8rem-0.125rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onImageClick(1)}
          />
        </div>
        <div className="relative">
          <img
            src={images[2]}
            alt="Post image 3"
            loading="lazy"
            className="rounded-lg w-full h-[calc(8rem-0.125rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onImageClick(2)}
          />
          {/* +X more overlay for 4+ images */}
          {images.length > 4 && (
            <div 
              className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
              onClick={() => onImageClick(3)}
            >
              <span className="text-white font-semibold text-lg">
                +{images.length - 3}
              </span>
            </div>
          )}
          {/* Hover overlay for exactly 4 images */}
          {images.length === 4 && (
            <div 
              className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors opacity-0 hover:opacity-100"
              onClick={() => onImageClick(3)}
            />
          )}
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
