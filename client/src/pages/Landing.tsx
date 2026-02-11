import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Globe, TrendingUp, Search, ChevronRight, Zap, MapPin, Layers, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/news/Header";
import TopicCard from "@/components/news/TopicCard";
import { useLandingData, useFollows, useFollow, useUnfollow, useSuggestions } from "@/hooks/use-news";

export default function Landing() {
  const { data: landing, isLoading } = useLandingData();
  const { data: follows } = useFollows();
  const { data: suggestions } = useSuggestions();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"region" | "topic">("topic");

  const followedRegionIds = (follows || []).filter((f: any) => f.followType === "region").map((f: any) => f.targetId);
  const followedTopicIds = (follows || []).filter((f: any) => f.followType === "topic").map((f: any) => f.targetId);
  const hasFollows = followedRegionIds.length > 0 || followedTopicIds.length > 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function toggleRegionFollow(regionId: number) {
    if (followedRegionIds.includes(regionId)) {
      unfollow.mutate({ followType: "region", targetId: regionId });
    } else {
      follow.mutate({ followType: "region", targetId: regionId });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topicsByCategory = landing?.topicsByCategory || [];
  const topicsByRegion = landing?.topicsByRegion || [];

  // Separate followed from non-followed for personalized ordering
  const allTopics = topicsByCategory.flatMap((c: any) => c.topics);
  const followedTopics = allTopics.filter((t: any) => t.isFollowed);
  const unfollowedTopics = allTopics.filter((t: any) => !t.isFollowed);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <section className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-amber-600">Last 24 Hours</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Global News Briefing
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base max-w-lg">
                Decision-ready summaries with transparent sourcing. Click any topic for the full briefing.
              </p>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search topics, regions, keywords..."
                className="w-64 h-9 text-sm"
              />
              <Button type="submit" size="sm" variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* View toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as "region" | "topic")}>
            <TabsList className="mb-6">
              <TabsTrigger value="topic" className="text-xs sm:text-sm">
                <Layers className="w-3.5 h-3.5 mr-1.5" /> By Topic
              </TabsTrigger>
              <TabsTrigger value="region" className="text-xs sm:text-sm">
                <MapPin className="w-3.5 h-3.5 mr-1.5" /> By Region
              </TabsTrigger>
            </TabsList>

            {/* BY TOPIC */}
            <TabsContent value="topic">
              {/* Followed topics first */}
              {hasFollows && followedTopics.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Your Feed
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {followedTopics.map((topic: any) => (
                      <TopicCard key={topic.id} topic={topic} showFollowReason />
                    ))}
                  </div>
                </div>
              )}

              {/* All topics by category */}
              {topicsByCategory.map((group: any) => (
                <div key={group.category} className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    {group.category}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.topics.map((topic: any) => (
                      <TopicCard key={topic.id} topic={topic} showFollowReason={hasFollows} />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* BY REGION */}
            <TabsContent value="region">
              {/* Region chips for quick follow */}
              <div className="flex flex-wrap gap-2 mb-6">
                {topicsByRegion.map((group: any) => {
                  const isFollowed = followedRegionIds.includes(group.region.id);
                  return (
                    <Button
                      key={group.region.id}
                      variant={isFollowed ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleRegionFollow(group.region.id)}
                    >
                      {isFollowed ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Plus className="w-3 h-3 mr-1" />
                      )}
                      {group.region.name}
                    </Button>
                  );
                })}
              </div>

              {topicsByRegion.map((group: any) => (
                <div key={group.region.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        {group.region.name}
                      </h2>
                      <Badge variant="outline" className="text-[10px]">
                        {group.topics.length} topic{group.topics.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <Button
                      variant={followedRegionIds.includes(group.region.id) ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleRegionFollow(group.region.id)}
                    >
                      {followedRegionIds.includes(group.region.id) ? "Following" : "Follow Region"}
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.topics.map((topic: any) => (
                      <TopicCard key={topic.id} topic={topic} showFollowReason={hasFollows} />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <section className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                Suggested for You
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((topic: any) => (
                  <TopicCard key={topic.id} topic={topic} compact showFollowReason />
                ))}
              </div>
            </section>
          )}

          {/* Onboarding CTA */}
          {!hasFollows && (
            <section className="mt-8">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-1">Personalize your briefing</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tell us your goals and interests to get a curated news feed focused on what matters to your decisions.
                </p>
                <Link href="/onboarding">
                  <Button size="sm">
                    Get Started <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </Card>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
