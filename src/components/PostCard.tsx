import React from 'react';
import { Heart, MessageCircle, Share, Bookmark } from 'lucide-react';
import { PostVideo } from './PostVideo';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';

interface PostCardProps {
  author: {
    name: string;
    avatar: string;
    title: string;
    company: string;
  };
  content: {
    title?: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  timestamp: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  author,
  content,
  stats,
  timestamp,
  isLiked = false,
  isBookmarked = false,
  className,
}) => {
  const [liked, setLiked] = React.useState(isLiked);
  const [bookmarked, setBookmarked] = React.useState(isBookmarked);
  const [likeCount, setLikeCount] = React.useState(stats.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  return (
    <div className={cn(
      "bg-background border border-border rounded-xl p-6 space-y-4",
      className
    )}>
      {/* Author Header */}
      <div className="flex items-start space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <h3 className="font-semibold text-foreground text-sm">{author.name}</h3>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground text-sm">{timestamp}</span>
          </div>
          <p className="text-muted-foreground text-sm">{author.title}</p>
          <p className="text-muted-foreground text-sm">{author.company}</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="space-y-3">
        {content.title && (
          <h2 className="text-lg font-semibold text-foreground">{content.title}</h2>
        )}
        <p className="text-foreground">{content.description}</p>
      </div>

      {/* Video Component */}
      <PostVideo
        videoUrl={content.videoUrl}
        thumbnailUrl={content.thumbnailUrl}
        title={content.title}
        description={content.description}
        className="w-full"
      />

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>{likeCount} likes</span>
          <span>{stats.comments} comments</span>
          <span>{stats.shares} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "flex items-center space-x-2 text-muted-foreground hover:text-red-500",
            liked && "text-red-500"
          )}
        >
          <Heart className={cn("h-5 w-5", liked && "fill-current")} />
          <span>Like</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-muted-foreground hover:text-green-500"
        >
          <Share className="h-5 w-5" />
          <span>Share</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className={cn(
            "flex items-center space-x-2 text-muted-foreground hover:text-blue-500",
            bookmarked && "text-blue-500"
          )}
        >
          <Bookmark className={cn("h-5 w-5", bookmarked && "fill-current")} />
          <span>Save</span>
        </Button>
      </div>
    </div>
  );
};
