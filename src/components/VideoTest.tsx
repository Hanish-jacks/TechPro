import React, { useState } from 'react';
import { PostVideo } from './PostVideo';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export const VideoTest: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const clearVideo = () => {
    setSelectedVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Video Upload Test</h2>
          
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100"
              />
            </div>

            {selectedVideo && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedVideo.name} ({(selectedVideo.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <Button onClick={clearVideo} variant="outline" size="sm">
                  Clear Video
                </Button>
              </div>
            )}

            {videoPreview && (
              <div className="space-y-2">
                <h3 className="font-semibold">Video Preview:</h3>
                <PostVideo
                  videoUrl={videoPreview}
                  title="Test Video"
                  description="This is a test video upload"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sample Video (External URL)</h3>
          <PostVideo
            videoUrl="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
            title="Sample Video"
            description="This is a sample video from an external URL"
            className="w-full"
          />
        </CardContent>
      </Card>
    </div>
  );
};
