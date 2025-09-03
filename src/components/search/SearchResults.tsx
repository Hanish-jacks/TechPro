import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, MessageSquare, Hash, Filter } from "lucide-react";
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
  relevance?: number;
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState("all");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search-results", query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query.trim() || query.length < 2) {
        return [];
      }

      const results: SearchResult[] = [];

      try {
        // Use the optimized search function
        const { data: searchData, error: searchError } = await supabase
          .rpc('search_all', { search_term: query })
          .limit(50);

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
                relevance: item.relevance,
              });
            } else if (item.type === 'post') {
              results.push({
                id: item.id,
                type: "post",
                title: item.title,
                subtitle: item.subtitle,
                content: item.content,
                image: item.image_url,
                timestamp: item.created_at,
                user_id: item.user_id,
                username: item.username,
                relevance: item.relevance,
              });
            }
          });
        }
      } catch (error) {
        console.error("Search error:", error);
      }

      return results;
    },
    enabled: query.length >= 2,
  });

  const filteredResults = searchResults?.filter(result => {
    if (activeTab === "all") return true;
    return result.type === activeTab;
  }) || [];

  const profileResults = searchResults?.filter(r => r.type === "profile") || [];
  const postResults = searchResults?.filter(r => r.type === "post") || [];

  if (!query || query.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Search TechPro</h2>
            <p className="text-muted-foreground">
              Enter a search term to find profiles, posts, and topics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Search Results</h1>
          </div>
          <p className="text-muted-foreground">
            Results for "{query}" • {searchResults?.length || 0} items found
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({searchResults?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profiles ({profileResults.length})
            </TabsTrigger>
            <TabsTrigger value="post" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Posts ({postResults.length})
            </TabsTrigger>
            <TabsTrigger value="keyword" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Topics
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32" />
                        <div className="h-3 bg-muted rounded w-24" />
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or browse different categories.
              </p>
              <Button variant="outline" onClick={() => setSearchParams({})}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={result.id} className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar/Icon */}
                    <div className="flex-shrink-0">
                      {result.type === "profile" || result.type === "post" ? (
                        result.image ? (
                          <Avatar className="h-12 w-12">
                            <img src={result.image} alt={result.title} />
                          </Avatar>
                        ) : (
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {result.title.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Hash className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                            {result.title}
                          </h3>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {result.type === "profile" ? "Profile" : 
                             result.type === "post" ? "Post" : "Topic"}
                          </Badge>
                          {result.relevance && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(result.relevance * 100)}% match
                            </Badge>
                          )}
                        </div>
                      </div>

                      {result.content && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          {result.content}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {result.timestamp && (
                          <span>
                            {formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
                          </span>
                        )}
                        {result.type === "post" && result.username && (
                          <span>by @{result.username}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredResults.length > 0 && filteredResults.length >= 50 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Load More Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


