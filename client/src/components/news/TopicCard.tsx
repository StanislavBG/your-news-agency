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
      <Card className={`group relative overflow-hidden border border-gray-200/80 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer ${compact ? "p-4" : "p-5"}`}>
        {/* Follow reason */}
        {showFollowReason && topic.followReason && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <Eye className="w-3 h-3 text-blue-500" />
            <span className="text-[11px] text-blue-600 font-medium">{topic.followReason}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Category + Regions */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {topic.category && (
                <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0 h-5">
                  {topic.category}
                </Badge>
              )}
              {topic.regions?.slice(0, 2).map((r: any) => (
                <Badge key={r.id} variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-gray-500">
                  {r.name}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h3 className={`font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug ${compact ? "text-sm" : "text-base"}`}>
              {topic.title}
            </h3>

            {/* Description */}
            {!compact && topic.description && (
              <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                {topic.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <SourceDiversityIndicator sourceCount={topic.sourceCount} />
              {topic.latestUpdate && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {formatDistanceToNow(new Date(topic.latestUpdate), { addSuffix: true })}
                </span>
              )}
              {topic.articleCount > 0 && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Newspaper className="w-3 h-3" />
                  {topic.articleCount} articles
                </span>
              )}
            </div>
          </div>

          {/* Follow button + Arrow */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={topic.isFollowed ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleFollowToggle}
                >
                  {topic.isFollowed ? (
                    <><Check className="w-3 h-3 mr-1" />Following</>
                  ) : (
                    <><Plus className="w-3 h-3 mr-1" />Follow</>
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
