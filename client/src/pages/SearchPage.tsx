import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, Globe, Newspaper, Layers, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/news/Header";
import TopicCard from "@/components/news/TopicCard";
import { useSearch, useFollow } from "@/hooks/use-news";
import { formatDistanceToNow } from "date-fns";

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const { data: results, isLoading } = useSearch(searchTerm);
  const follow = useFollow();

  useEffect(() => {
    const p = new URLSearchParams(location.split("?")[1] || "");
    const q = p.get("q") || "";
    if (q !== searchTerm) {
      setQuery(q);
      setSearchTerm(q);
    }
  }, [location]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
      setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const hasResults = results && (results.topics?.length > 0 || results.regions?.length > 0 || results.articles?.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search topics, regions, keywords..."
            className="h-11 text-base"
          />
          <Button type="submit" size="lg">
            <SearchIcon className="w-4 h-4 mr-2" /> Search
          </Button>
        </form>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        )}

        {!isLoading && searchTerm && !hasResults && (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">No results for "{searchTerm}"</h2>
            <p className="text-sm text-gray-500">Try a different search term or browse topics from the landing page.</p>
          </div>
        )}

        {!isLoading && hasResults && (
          <div className="space-y-8">
            {/* Topics */}
            {results.topics?.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Topics ({results.topics.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.topics.map((topic: any) => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>
              </section>
            )}

            {/* Regions */}
            {results.regions?.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Regions ({results.regions.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {results.regions.map((region: any) => (
                    <Card key={region.id} className="p-4 flex items-center justify-between gap-4 min-w-[200px]">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{region.name}</h3>
                        {region.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{region.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 shrink-0"
                        onClick={() => follow.mutate({ followType: "region", targetId: region.id })}
                      >
                        Follow
                      </Button>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Articles */}
            {results.articles?.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Newspaper className="w-4 h-4" /> Articles ({results.articles.length})
                </h2>
                <div className="space-y-2">
                  {results.articles.map((article: any) => (
                    <Card key={article.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-600">{article.source?.name}</span>
                            {article.isRecent && (
                              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Recent</Badge>
                            )}
                          </div>
                          <h3 className="text-sm font-medium text-gray-900">{article.title}</h3>
                          {article.summary && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
                          )}
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
