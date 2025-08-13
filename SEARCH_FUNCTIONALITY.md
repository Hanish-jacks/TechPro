# Search Functionality

## Overview
A comprehensive search system that allows logged-in users to search across profiles, posts, and keywords. The search functionality includes both a quick search bar and a dedicated search results page.

## Features

### 🔍 **Quick Search Bar**
- **Global Search**: Accessible from the main dashboard header
- **Keyboard Shortcut**: Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to open
- **Real-time Results**: Shows results as you type (minimum 2 characters)
- **Categorized Results**: Profiles, Posts, and Topics are clearly separated
- **Quick Actions**: Click on any result to navigate or view details

### 📄 **Search Results Page**
- **Dedicated URL**: `/search?q=query` for sharing and bookmarking
- **Filtered Views**: Tabs to filter by Profiles, Posts, or Topics
- **Relevance Scoring**: Results ranked by relevance to search query
- **Rich Results**: Shows avatars, timestamps, and content previews
- **Load More**: Pagination for large result sets

### 🎯 **Search Capabilities**

#### **Profile Search**
- Search by username or full name
- Partial matching (e.g., "john" matches "john_doe")
- Shows profile avatars and usernames
- Direct navigation to profiles (future enhancement)

#### **Post Search**
- Search through post content
- Shows post previews with author information
- Timestamps and engagement metrics
- Full-text search with relevance scoring

#### **Keyword/Topic Search**
- Predefined tech keywords and topics
- Popular programming languages and frameworks
- Technology trends and concepts
- Navigate to topic-specific results

## Technical Implementation

### **Database Optimization**
- **Full-text Search Indexes**: GIN indexes on username, full_name, and content
- **Trigram Indexes**: For partial matching and fuzzy search
- **Custom Search Function**: `search_all()` function for optimized queries
- **Relevance Scoring**: Uses PostgreSQL similarity functions

### **Frontend Components**

#### **SearchBar Component** (`src/components/search/SearchBar.tsx`)
- Command palette interface using Radix UI
- Real-time search with React Query caching
- Keyboard navigation support
- Fallback search for compatibility

#### **SearchResults Component** (`src/components/search/SearchResults.tsx`)
- Dedicated search results page
- Tabbed interface for filtering
- Responsive design with loading states
- URL-based state management

### **Database Schema**

#### **Search Indexes**
```sql
-- Full-text search indexes
CREATE INDEX idx_profiles_username_gin ON profiles USING gin(to_tsvector('english', username));
CREATE INDEX idx_profiles_full_name_gin ON profiles USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_posts_content_gin ON posts USING gin(to_tsvector('english', content));

-- Trigram indexes for partial matching
CREATE INDEX idx_profiles_username_trgm ON profiles USING gin(username gin_trgm_ops);
CREATE INDEX idx_profiles_full_name_trgm ON profiles USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_posts_content_trgm ON posts USING gin(content gin_trgm_ops);
```

#### **Search Function**
```sql
CREATE OR REPLACE FUNCTION search_all(query text)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  subtitle text,
  content text,
  image_url text,
  created_at timestamptz,
  user_id uuid,
  username text,
  relevance float
)
```

## Usage

### **Quick Search**
1. Click the search bar in the header or press `⌘K`
2. Type your search query (minimum 2 characters)
3. Browse results by category
4. Click on a result or "View all results"

### **Search Results Page**
1. Navigate to `/search?q=your-query`
2. Use tabs to filter by type (All, Profiles, Posts, Topics)
3. Click on results to view details
4. Use "Load More" for additional results

### **Keyboard Navigation**
- `⌘K` / `Ctrl+K`: Open search
- `↑` / `↓`: Navigate results
- `Enter`: Select result
- `Escape`: Close search

## Search Query Examples

### **Profile Searches**
- `john` - Find users with "john" in username or name
- `developer` - Find users with "developer" in their name
- `@username` - Search for specific usernames

### **Post Searches**
- `react` - Find posts about React
- `tutorial` - Find tutorial posts
- `bug` - Find posts about bugs or issues

### **Topic Searches**
- `typescript` - Technology topics
- `machine learning` - AI/ML related content
- `docker` - DevOps topics

## Performance Features

### **Caching**
- React Query caching for 30 seconds
- Optimistic updates for better UX
- Background refetching

### **Optimization**
- Debounced search input
- Minimum character limit (2 chars)
- Result limiting (10 quick results, 50 full results)
- Database indexes for fast queries

### **Fallback**
- Graceful degradation if search function fails
- Simple ILIKE queries as backup
- Error handling with user feedback

## Security

### **Row Level Security**
- Search respects RLS policies
- Users can only search public content
- Profile search limited to authenticated users

### **Input Sanitization**
- Query parameter encoding
- SQL injection prevention
- XSS protection

## Future Enhancements

### **Advanced Search**
- Boolean operators (AND, OR, NOT)
- Phrase search with quotes
- Wildcard search with asterisks
- Date range filtering

### **Search Analytics**
- Search query analytics
- Popular search terms
- Search result click tracking
- Search performance metrics

### **Personalization**
- Search history
- Personalized results based on user activity
- Search suggestions
- Auto-complete functionality

### **Integration**
- Search within comments
- Search by hashtags
- Search by location (if added)
- Search by post type (text, image, video)

## Troubleshooting

### **Common Issues**

#### **No Search Results**
- Check if query is at least 2 characters
- Verify database indexes are created
- Check RLS policies for authenticated users
- Review search function permissions

#### **Slow Search Performance**
- Ensure database indexes are properly created
- Check for large datasets without pagination
- Monitor database query performance
- Consider adding more specific indexes

#### **Search Function Errors**
- Verify `pg_trgm` extension is installed
- Check function permissions for authenticated users
- Review database migration execution
- Test fallback search functionality

## Migration Notes

The search functionality requires the following migration:
- `20250115000000_add_search_indexes.sql`

Run this migration in your Supabase SQL editor to enable the search features.


