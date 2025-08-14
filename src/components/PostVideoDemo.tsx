import React, { useState } from 'react';
import { PostVideo } from './PostVideo';
import { PostCard } from './PostCard';

// Sample video data
const sampleVideos = [
  {
    id: 1,
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnailUrl: 'https://picsum.photos/1280/720?random=1',
    title: 'Product Demo Video',
    description: 'Watch our latest product in action! This video showcases all the amazing features that will revolutionize your workflow.',
  },
  {
    id: 2,
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    thumbnailUrl: 'https://picsum.photos/1280/720?random=2',
    title: 'Team Building Event',
    description: 'Highlights from our amazing team building retreat. Great memories and even better connections!',
  },
  {
    id: 3,
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
    thumbnailUrl: 'https://picsum.photos/1280/720?random=3',
    title: 'Company Culture',
    description: 'Discover what makes our company special. We believe in innovation, collaboration, and having fun while we work.',
  },
];

// Sample post data
const samplePosts = [
  {
    id: 1,
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://picsum.photos/100/100?random=10',
      title: 'Senior Product Manager',
      company: 'TechCorp Inc.',
    },
    content: {
      title: 'Exciting Product Launch! 🚀',
      description: 'We\'re thrilled to announce the launch of our revolutionary new platform. Watch the demo video to see it in action!',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnailUrl: 'https://picsum.photos/1280/720?random=1',
    },
    stats: {
      likes: 42,
      comments: 8,
      shares: 12,
    },
    timestamp: '2 hours ago',
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 2,
    author: {
      name: 'Mike Chen',
      avatar: 'https://picsum.photos/100/100?random=11',
      title: 'UX Designer',
      company: 'Design Studio',
    },
    content: {
      title: 'Behind the Scenes: Design Process',
      description: 'Ever wondered how we approach design challenges? Here\'s a peek into our creative process and methodology.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      thumbnailUrl: 'https://picsum.photos/1280/720?random=2',
    },
    stats: {
      likes: 28,
      comments: 15,
      shares: 6,
    },
    timestamp: '5 hours ago',
    isLiked: true,
    isBookmarked: true,
  },
];

export const PostVideoDemo: React.FC = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentVideoIndex((prev) => (prev > 0 ? prev - 1 : sampleVideos.length - 1));
  };

  const handleNext = () => {
    setCurrentVideoIndex((prev) => (prev < sampleVideos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">PostVideo Component Demo</h1>
          <p className="text-xl text-muted-foreground">
            LinkedIn-style video posts with modal player and social media features
          </p>
        </div>

        {/* Standalone Video Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Standalone Video Components</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Video */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Basic Video</h3>
              <PostVideo
                videoUrl={sampleVideos[0].videoUrl}
                thumbnailUrl={sampleVideos[0].thumbnailUrl}
                title={sampleVideos[0].title}
                description={sampleVideos[0].description}
              />
            </div>

            {/* Video with Navigation */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Video with Navigation</h3>
              <PostVideo
                videoUrl={sampleVideos[currentVideoIndex].videoUrl}
                thumbnailUrl={sampleVideos[currentVideoIndex].thumbnailUrl}
                title={sampleVideos[currentVideoIndex].title}
                description={sampleVideos[currentVideoIndex].description}
                showNavigation={true}
                onPrevious={handlePrevious}
                onNext={handleNext}
                hasPrevious={currentVideoIndex > 0}
                hasNext={currentVideoIndex < sampleVideos.length - 1}
              />
              <p className="text-sm text-muted-foreground text-center">
                Current: {currentVideoIndex + 1} of {sampleVideos.length}
              </p>
            </div>
          </div>
        </section>

        {/* Complete Post Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Complete Social Media Posts</h2>
          
          <div className="space-y-6">
            {samplePosts.map((post) => (
              <PostCard
                key={post.id}
                author={post.author}
                content={post.content}
                stats={post.stats}
                timestamp={post.timestamp}
                isLiked={post.isLiked}
                isBookmarked={post.isBookmarked}
              />
            ))}
          </div>
        </section>

        {/* Features List */}
        <section className="bg-muted/50 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Feed View</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Soft rounded card style with shadows</li>
                <li>• Centered translucent play button</li>
                <li>• 16:9 aspect ratio maintained</li>
                <li>• Hover effects (darken + scale)</li>
                <li>• No autoplay in feed</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Modal Player</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Dark semi-transparent backdrop</li>
                <li>• HTML5 video with controls</li>
                <li>• Autoplay when opened</li>
                <li>• Unmuted by default</li>
                <li>• ESC key support</li>
                <li>• Navigation arrows (optional)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
