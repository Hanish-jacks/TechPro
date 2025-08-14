import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageGrid } from "./image-grid";
import { ImageViewer } from "./image-viewer";

// Sample images for demonstration
const sampleImages = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop",
];

export default function ImageGridDemo() {
  const [selectedCount, setSelectedCount] = useState(1);
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const openImageViewer = (images: string[], initialIndex: number = 0) => {
    setImageViewer({
      isOpen: true,
      images,
      initialIndex,
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      images: [],
      initialIndex: 0,
    });
  };

  const currentImages = sampleImages.slice(0, selectedCount);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Image Grid Layout Demo</h1>
        <p className="text-muted-foreground">
          Click the buttons below to see different grid layouts
        </p>
      </div>

      {/* Grid Layout Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Grid Layout Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center">
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <Button
                key={count}
                variant={selectedCount === count ? "default" : "outline"}
                onClick={() => setSelectedCount(count)}
              >
                {count} Image{count !== 1 ? 's' : ''}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            Grid Layout: {selectedCount} Image{selectedCount !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageGrid
            images={currentImages}
            onImageClick={(index) => openImageViewer(currentImages, index)}
          />
        </CardContent>
      </Card>

      {/* Layout Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">1 Image:</span>
              <span>Full width display</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">2 Images:</span>
              <span>Equal-width 2-column grid</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">3 Images:</span>
              <span>Large left + 2 stacked right</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">4+ Images:</span>
              <span>2×2 grid with "+X more" overlay</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full-Screen Viewer */}
      <ImageViewer
        images={imageViewer.images}
        initialIndex={imageViewer.initialIndex}
        isOpen={imageViewer.isOpen}
        onClose={closeImageViewer}
      />
    </div>
  );
}
