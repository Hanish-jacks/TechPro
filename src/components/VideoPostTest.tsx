import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PostVideo } from './PostVideo';

export const VideoPostTest: React.FC = () => {
  const [testVideoUrl, setTestVideoUrl] = useState<string>('');

  const testVideos = [
    {
      name: 'Sample Video 1',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      description: 'A small sample video for testing'
    },
    {
      name: 'Sample Video 2', 
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      description: 'Big Buck Bunny sample video'
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Video Post Test Component</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Test video posts with these sample videos:
          </p>
          
          {testVideos.map((video, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <h4 className="font-medium">{video.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{video.description}</p>
              <Button 
                size="sm" 
                onClick={() => setTestVideoUrl(video.url)}
                variant={testVideoUrl === video.url ? "default" : "outline"}
              >
                {testVideoUrl === video.url ? "Selected" : "Test This Video"}
              </Button>
            </div>
          ))}
        </div>

        {testVideoUrl && (
          <div className="space-y-2">
            <h4 className="font-medium">Video Preview:</h4>
            <PostVideo
              videoUrl={testVideoUrl}
              title="Test Video"
              description="This is a test video post"
              className="w-full"
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
          <p><strong>Note:</strong> These are external sample videos. Your actual video posts will use videos uploaded to your Supabase storage.</p>
        </div>
      </CardContent>
    </Card>
  );
};
