import { ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface ArticleRef {
  id: number;
  title: string;
  url: string | null;
  publishedAt: string;
  isRecent: boolean | null;
  source: {
    name: string;
    reliability: number | null;
  };
}

export function InlineCitation({ articles }: { articles: ArticleRef[] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {articles.map((article, i) => (
        <Tooltip key={article.id}>
          <TooltipTrigger asChild>
            <button className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors leading-none">
              {i + 1}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-xs">
              <p className="font-semibold">{article.source.name}</p>
              <p className="text-muted-foreground mt-0.5">{article.title}</p>
              <p className="text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </span>
  );
}

export function SourceList({ articles }: { articles: ArticleRef[] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="space-y-2">
      {articles.map((article) => (
        <div key={article.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-700">{article.source.name}</span>
              {article.isRecent && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-50 text-green-700 border-green-200">
                  Recent
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{article.title}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
            </p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
        </div>
      ))}
    </div>
  );
}

export function SourceDiversityIndicator({ sourceCount, totalSources }: { sourceCount: number; totalSources?: number }) {
  const level = sourceCount >= 6 ? "high" : sourceCount >= 3 ? "medium" : "low";
  const colors = {
    high: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-red-100 text-red-700 border-red-200",
  };
  const labels = {
    high: "Broad coverage",
    medium: "Moderate coverage",
    low: "Limited sources",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`text-[10px] ${colors[level]} cursor-help`}>
          {sourceCount} sources &middot; {labels[level]}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          This topic is covered by {sourceCount} distinct news sources
          {totalSources ? ` out of ${totalSources} tracked` : ""}.
          {level === "high" && " Multiple perspectives are well represented."}
          {level === "medium" && " Consider checking additional sources for a broader view."}
          {level === "low" && " Limited sourcing — verify claims with additional outlets."}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function RecencyBadge({ date }: { date: string }) {
  const hoursAgo = (Date.now() - new Date(date).getTime()) / (60 * 60 * 1000);
  if (hoursAgo > 24) return null;

  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
      {hoursAgo < 1 ? "Just now" : hoursAgo < 6 ? "Last few hours" : "Today"}
    </Badge>
  );
}
