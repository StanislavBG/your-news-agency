import { Link } from "wouter";
import { Clock, Newspaper, ArrowRight, Eye, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SourceDiversityIndicator } from "./SourceCitation";
import { formatDistanceToNow } from "date-fns";
import { useFollow, useUnfollow } from "@/hooks/use-news";

interface TopicCardProps {
  topic: any;
  compact?: boolean;
  showFollowReason?: boolean;
}

export default function TopicCard({ topic, compact = false, showFollowReason = false }: TopicCardProps) {
  const follow = useFollow();
  const unfollow = useUnfollow();

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (topic.isFollowed) {
      unfollow.mutate({ followType: "topic", targetId: topic.id });
    } else {
      follow.mutate({ followType: "topic", targetId: topic.id });
    }
  };

  return (
    <Link href={`/topic/${topic.slug}`}>
      <Card className={`group relative overflow-hidden border border-gray-200/80 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white ${compact ? "p-4" : "p-6"}`}>
        {/* Follow reason */}
        {showFollowReason && topic.followReason && (
          <div className="flex items-center gap-1.5 mb-3">
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">{topic.followReason}</span>
          </div>
        )}

        {/* Category + Regions */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {topic.category && (
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-100">
              {topic.category}
            </Badge>
          )}
          {topic.regions?.slice(0, 2).map((r: any) => (
            <Badge key={r.id} variant="outline" className="text-xs px-2 py-0.5 text-gray-600 border-gray-300">
              {r.name}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug ${compact ? "text-base" : "text-lg"}`}>
          {topic.title}
        </h3>

        {/* Description */}
        {!compact && topic.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {topic.description}
          </p>
        )}

        {/* Meta row + Follow */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            <SourceDiversityIndicator sourceCount={topic.sourceCount} />
            {topic.latestUpdate && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(topic.latestUpdate), { addSuffix: true })}
              </span>
            )}
            {topic.articleCount > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Newspaper className="w-3.5 h-3.5" />
                {topic.articleCount} articles
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={topic.isFollowed ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={handleFollowToggle}
                >
                  {topic.isFollowed ? (
                    <><Check className="w-3.5 h-3.5 mr-1" />Following</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5 mr-1" />Follow</>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {topic.isFollowed ? "Unfollow this topic" : "Follow to see updates in your feed"}
              </TooltipContent>
            </Tooltip>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
