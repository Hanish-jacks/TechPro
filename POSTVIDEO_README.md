# PostVideo Component - LinkedIn-Style Video Posts

A comprehensive React component for creating LinkedIn-style video posts with a modal video player, built with TypeScript, Tailwind CSS, and Radix UI primitives.

## Features

### Feed View
- **Static Preview**: Shows video thumbnail with play button overlay
- **LinkedIn Style**: Soft rounded card design with subtle shadows and borders
- **Aspect Ratio**: Maintains 16:9 aspect ratio for consistent layout
- **Hover Effects**: Darkens thumbnail and scales play button on hover
- **No Autoplay**: Videos don't autoplay in feed for better performance

### Modal Player
- **Full-Screen Experience**: Dark semi-transparent backdrop with centered video
- **HTML5 Controls**: Native video controls with autoplay when opened
- **Unmuted by Default**: Videos play with sound when modal opens
- **Keyboard Support**: ESC key closes the modal
- **Navigation**: Optional left/right arrows for multi-video posts
- **Responsive**: Works seamlessly on both desktop and mobile

## Components

### 1. PostVideo
The core video component that handles both feed view and modal player.

### 2. PostCard
A complete social media post component that includes the PostVideo component along with author info, engagement stats, and action buttons.

### 3. PostVideoDemo
A comprehensive demo page showcasing all features and usage patterns.

## Installation

The components use the following dependencies (already included in your project):
- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (for icons)
- Radix UI primitives

## Usage

### Basic PostVideo Component

```tsx
import { PostVideo } from './components/PostVideo';

function MyComponent() {
  return (
    <PostVideo
      videoUrl="https://example.com/video.mp4"
      thumbnailUrl="https://example.com/thumbnail.jpg"
      title="My Video Title"
      description="Video description here"
    />
  );
}
```

### PostVideo with Navigation

```tsx
import { PostVideo } from './components/PostVideo';

function VideoGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  return (
    <PostVideo
      videoUrl={videos[currentIndex].url}
      thumbnailUrl={videos[currentIndex].thumbnail}
      showNavigation={true}
      onPrevious={() => setCurrentIndex(prev => prev - 1)}
      onNext={() => setCurrentIndex(prev => prev + 1)}
      hasPrevious={currentIndex > 0}
      hasNext={currentIndex < videos.length - 1}
    />
  );
}
```

### Complete PostCard

```tsx
import { PostCard } from './components/PostCard';

function Feed() {
  const post = {
    author: {
      name: "John Doe",
      avatar: "https://example.com/avatar.jpg",
      title: "Software Engineer",
      company: "Tech Corp"
    },
    content: {
      title: "Check out this amazing video!",
      description: "This video shows our latest feature in action.",
      videoUrl: "https://example.com/video.mp4",
      thumbnailUrl: "https://example.com/thumbnail.jpg"
    },
    stats: {
      likes: 42,
      comments: 8,
      shares: 12
    },
    timestamp: "2 hours ago"
  };

  return <PostCard {...post} />;
}
```

## Props

### PostVideo Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `videoUrl` | `string` | **required** | URL of the video file |
| `thumbnailUrl` | `string` | `undefined` | URL of the thumbnail image (falls back to video) |
| `title` | `string` | `undefined` | Video title displayed below thumbnail |
| `description` | `string` | `undefined` | Video description displayed below thumbnail |
| `className` | `string` | `undefined` | Additional CSS classes |
| `showNavigation` | `boolean` | `false` | Show navigation arrows in modal |
| `onPrevious` | `() => void` | `undefined` | Callback for previous video |
| `onNext` | `() => void` | `undefined` | Callback for next video |
| `hasPrevious` | `boolean` | `false` | Whether previous video exists |
| `hasNext` | `boolean` | `false` | Whether next video exists |

### PostCard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `author` | `object` | **required** | Author information object |
| `content` | `object` | **required** | Post content including video |
| `stats` | `object` | **required** | Engagement statistics |
| `timestamp` | `string` | **required** | Time since post was created |
| `isLiked` | `boolean` | `false` | Whether user has liked the post |
| `isBookmarked` | `boolean` | `false` | Whether user has bookmarked the post |
| `className` | `string` | `undefined` | Additional CSS classes |

## Styling

The components use Tailwind CSS classes and follow your project's design system:

- **Colors**: Uses `bg-background`, `text-foreground`, `border-border`, etc.
- **Spacing**: Consistent spacing with Tailwind's spacing scale
- **Shadows**: Subtle shadows (`shadow-sm`, `shadow-md`) for depth
- **Transitions**: Smooth transitions for hover effects and animations
- **Responsive**: Mobile-first responsive design

## Accessibility

- **Keyboard Navigation**: ESC key closes modal
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Focus is trapped within the modal when open
- **High Contrast**: Good contrast ratios for text and interactive elements

## Performance Considerations

- **Lazy Loading**: Videos only load when modal is opened
- **Thumbnail Fallback**: Falls back to video element if thumbnail fails to load
- **Memory Management**: Video is paused and reset when modal closes
- **Body Scroll Lock**: Prevents background scrolling when modal is open

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Video Formats**: MP4, WebM, OGV (depends on browser support)

## Customization

### Modifying Styles

You can customize the appearance by passing additional classes:

```tsx
<PostVideo
  videoUrl="..."
  className="max-w-md mx-auto" // Custom width and centering
/>
```

### Custom Video Controls

The component uses native HTML5 video controls, but you can extend it with custom controls by modifying the video element in the modal.

### Theme Integration

The components automatically use your project's CSS custom properties for colors, making them theme-aware and easy to customize.

## Examples

See `PostVideoDemo.tsx` for comprehensive examples of:
- Basic video usage
- Video with navigation
- Complete social media posts
- Different video configurations

## Troubleshooting

### Video Not Playing
- Check that the video URL is accessible
- Ensure the video format is supported by the browser
- Check browser autoplay policies

### Thumbnail Not Loading
- The component will fall back to using the video element
- Check that the thumbnail URL is accessible
- Consider using a CDN for better performance

### Modal Not Opening
- Ensure the component is properly imported
- Check that all required props are provided
- Verify that the click handler is working

## Contributing

The components are built with extensibility in mind. You can:
- Add new video formats support
- Implement custom video controls
- Add analytics tracking
- Extend the navigation system

## License

This component is part of your project and follows the same license terms.
