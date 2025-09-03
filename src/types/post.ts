export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  video_duration?: number | null;
  video_size?: number | null;
  pdf_url?: string | null;
  pdf_filename?: string | null;
  pdf_size?: number | null;
  pdf_pages?: number | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}