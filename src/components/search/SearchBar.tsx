import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, User, MessageSquare, Hash, Users } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface SearchResult {
  id: string;
  type: "profile" | "post" | "keyword";
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  timestamp?: string;
  user_id?: string;
  username?: string;
}

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        return [];
      }

      const query = searchQuery.trim();
      const results: SearchResult[] = [];

      try {
        // Use the optimized search function
        const { data: searchData, error: searchError } = await supabase
          .rpc('search_all', { query: query })
          .limit(10);

        if (!searchError && searchData) {
          searchData.forEach((item: any) => {
            if (item.type === 'profile') {
              results.push({
                id: item.id,
                type: "profile",
                title: item.title || "Unknown User",
                subtitle: item.subtitle,
                image: item.image_url,
                timestamp: item.created_at,
                user_id: item.user_id,
                username: item.username,
              });
            } else if (item.type === 'post') {
              const content = item.content && item.content.length > 100 
                ? item.content.substring(0, 100) + "..." 
                : item.content;
              
              results.push({
                id: item.id,
                type: "post",
                title: content || item.title,
                subtitle: item.subtitle,
                content: item.content,
                image: item.image_url,
                timestamp: item.created_at,
                user_id: item.user_id,
                username: item.username,
              });
            }
          });
        }

        // Add keyword suggestions if we have few results
        if (results.length < 5) {
          const techKeywords = [
            "react", "typescript", "javascript", "python", "java", "nodejs",
            "vue", "angular", "svelte", "nextjs", "nuxt", "gatsby",
            "docker", "kubernetes", "aws", "azure", "gcp", "firebase",
            "mongodb", "postgresql", "mysql", "redis", "graphql", "rest",
            "machine learning", "ai", "data science", "blockchain", "web3",
            "cybersecurity", "devops", "ci/cd", "testing", "agile", "scrum"
          ];

          const matchingKeywords = techKeywords.filter(keyword => 
            keyword.toLowerCase().includes(query.toLowerCase())
          );

          matchingKeywords.slice(0, 3).forEach((keyword) => {
            results.push({
              id: `keyword-${keyword}`,
              type: "keyword",
              title: keyword,
              subtitle: "Popular topic",
            });
          });
        }

      } catch (error) {
        console.error("Search error:", error);
        
        // Fallback to simple search if the function fails
        try {
          // Simple profile search
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, created_at")
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(3);

          if (!profilesError && profiles) {
            profiles.forEach((profile) => {
              results.push({
                id: profile.id,
                type: "profile",
                title: profile.full_name || profile.username || "Unknown User",
                subtitle: `@${profile.username}`,
                image: profile.avatar_url,
                timestamp: profile.created_at,
                user_id: profile.id,
                username: profile.username,
              });
            });
          }

          // Simple post search
          const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select(`
              id, 
              content, 
              created_at, 
              user_id,
              profiles!inner(username, full_name, avatar_url)
            `)
            .or(`content.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .limit(3);

          if (!postsError && posts) {
            posts.forEach((post) => {
              const profile = post.profiles;
              const content = post.content.length > 100 
                ? post.content.substring(0, 100) + "..." 
                : post.content;
              
              results.push({
                id: post.id,
                type: "post",
                title: content,
                subtitle: `by ${profile.full_name || profile.username || "Unknown User"}`,
                content: post.content,
                image: profile.avatar_url,
                timestamp: post.created_at,
                user_id: post.user_id,
                username: profile.username,
              });
            });
          }
        } catch (fallbackError) {
          console.error("Fallback search error:", fallbackError);
        }
      }

      return results;
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setSearchQuery("");

    switch (result.type) {
      case "profile":
        // Navigate to profile page
        if (result.username) {
          navigate(`/profile/${result.username}`);
        }
        break;
      case "post":
        // Navigate to post or scroll to post in feed
        console.log("Navigate to post:", result.id);
        // You could implement a scroll-to-post functionality here
        break;
      case "keyword":
        // Navigate to search results page with the keyword
        navigate(`/search?q=${encodeURIComponent(result.title)}`);
        break;
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "profile":
        return <User className="h-4 w-4" />;
      case "post":
        return <MessageSquare className="h-4 w-4" />;
      case "keyword":
        return <Hash className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "profile":
        return "Profile";
      case "post":
        return "Post";
      case "keyword":
        return "Topic";
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search profiles, posts...
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput
            placeholder="Search profiles, posts, or topics..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery.length < 2 ? (
                "Type at least 2 characters to search..."
              ) : isLoading ? (
                "Searching..."
              ) : (
                "No results found."
              )}
            </CommandEmpty>

            {searchResults && searchResults.length > 0 && (
              <>
                {searchResults.some(r => r.type === "profile") && (
                  <CommandGroup heading="Profiles">
                    {searchResults
                      .filter(r => r.type === "profile")
                      .map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 p-3"
                        >
                          <div className="flex items-center gap-2">
                            {result.image ? (
                              <Avatar className="h-8 w-8">
                                <img src={result.image} alt={result.title} />
                              </Avatar>
                            ) : (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {result.title.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">{result.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="ml-auto">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {searchResults.some(r => r.type === "post") && (
                  <>
                    {searchResults.some(r => r.type === "profile") && <CommandSeparator />}
                    <CommandGroup heading="Posts">
                      {searchResults
                        .filter(r => r.type === "post")
                        .map((result) => (
                          <CommandItem
                            key={result.id}
                            onSelect={() => handleSelect(result)}
                            className="flex items-start gap-3 p-3"
                          >
                            <div className="flex items-start gap-2 flex-1">
                              {result.image ? (
                                <Avatar className="h-8 w-8 mt-1">
                                  <img src={result.image} alt={result.subtitle} />
                                </Avatar>
                              ) : (
                                <Avatar className="h-8 w-8 mt-1">
                                  <AvatarFallback>
                                    {result.subtitle?.slice(0, 2).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm line-clamp-2">{result.title}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {result.subtitle}
                                  </span>
                                  {result.timestamp && (
                                    <span className="text-xs text-muted-foreground">
                                      • {formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {getTypeLabel(result.type)}
                            </Badge>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </>
                )}

                                 {searchResults.some(r => r.type === "keyword") && (
                   <>
                     {(searchResults.some(r => r.type === "profile") || searchResults.some(r => r.type === "post")) && <CommandSeparator />}
                     <CommandGroup heading="Topics">
                       {searchResults
                         .filter(r => r.type === "keyword")
                         .map((result) => (
                           <CommandItem
                             key={result.id}
                             onSelect={() => handleSelect(result)}
                             className="flex items-center gap-3 p-3"
                           >
                             <div className="flex items-center gap-2">
                               <Hash className="h-4 w-4 text-primary" />
                               <div className="flex flex-col">
                                 <span className="font-medium capitalize">{result.title}</span>
                                 <span className="text-xs text-muted-foreground">
                                   {result.subtitle}
                                 </span>
                               </div>
                             </div>
                             <Badge variant="outline" className="ml-auto">
                               {getTypeLabel(result.type)}
                             </Badge>
                           </CommandItem>
                         ))}
                     </CommandGroup>
                   </>
                 )}

                 {/* View all results */}
                 <CommandSeparator />
                 <CommandGroup>
                   <CommandItem
                     onSelect={() => {
                       setOpen(false);
                       navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                     }}
                     className="flex items-center gap-3 p-3 text-primary"
                   >
                     <Search className="h-4 w-4" />
                     <span className="font-medium">View all results for "{searchQuery}"</span>
                   </CommandItem>
                 </CommandGroup>
               </>
             )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
