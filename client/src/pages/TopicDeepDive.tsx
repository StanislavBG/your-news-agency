import { useRoute, Link } from "wouter";
import {
  ArrowLeft, Users, Target, Clock, TrendingUp, AlertTriangle,
  Eye, FileText, ChevronRight, Plus, Check, Newspaper, Scale
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/news/Header";
import { InlineCitation, SourceList, SourceDiversityIndicator, RecencyBadge } from "@/components/news/SourceCitation";
import { ClaimWithCitation, ConflictingClaimsPanel } from "@/components/news/ConflictIndicator";
import { useTopicDetail, useFollow, useUnfollow, useFollows } from "@/hooks/use-news";
import { formatDistanceToNow, format } from "date-fns";

export default function TopicDeepDive() {
  const [, params] = useRoute("/topic/:slug");
  const slug = params?.slug || "";
  const { data: topic, isLoading } = useTopicDetail(slug);
  const { data: follows } = useFollows();
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const isFollowed = (follows || []).some(
    (f: any) => f.followType === "topic" && f.targetId === topic?.id
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Topic not found</h1>
          <Link href="/"><Button variant="ghost">Back to briefings</Button></Link>
        </div>
      </div>
    );
  }

  const whatHappened = topic.claims?.filter((c: any) => c.category === "what_happened") || [];
  const whoSaid = topic.claims?.filter((c: any) => c.category === "who_said") || [];
  const whatChanged = topic.claims?.filter((c: any) => c.category === "what_changed") || [];
  const likelyNext = topic.claims?.filter((c: any) => c.category === "likely_next") || [];
  const conflicting = topic.claims?.filter((c: any) => c.isConflicting && c.conflictingClaim) || [];
  const recentTimeline = topic.timelineEvents?.filter((e: any) => e.isRecent) || [];
  const pastTimeline = topic.timelineEvents?.filter((e: any) => !e.isRecent).sort((a: any, b: any) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Back nav */}
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-gray-500">
            <ArrowLeft className="w-4 h-4 mr-1" /> All Briefings
          </Button>
        </Link>

        {/* Topic Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {topic.category && (
              <Badge variant="secondary" className="text-xs">{topic.category}</Badge>
            )}
            {topic.regions?.map((r: any) => (
              <Badge key={r.id} variant="outline" className="text-xs text-gray-500">{r.name}</Badge>
            ))}
            <SourceDiversityIndicator sourceCount={topic.sourceCount} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
            {topic.title}
          </h1>
          <p className="text-gray-500 leading-relaxed">{topic.description}</p>

          {/* Core question */}
          {topic.coreQuestion && (
            <Card className="mt-4 p-4 bg-blue-50/60 border-blue-100">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Core Question</span>
                  <p className="text-sm text-blue-900 mt-0.5 leading-relaxed">{topic.coreQuestion}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant={isFollowed ? "secondary" : "default"}
              size="sm"
              onClick={() => {
                if (isFollowed) unfollowMutation.mutate({ followType: "topic", targetId: topic.id });
                else followMutation.mutate({ followType: "topic", targetId: topic.id });
              }}
            >
              {isFollowed ? <><Check className="w-4 h-4 mr-1" /> Following</> : <><Plus className="w-4 h-4 mr-1" /> Follow Topic</>}
            </Button>
            <Link href={`/topic/${slug}/briefing`}>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1" /> View Briefing Pack
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="viewpoints" className="text-xs sm:text-sm">Viewpoints</TabsTrigger>
            <TabsTrigger value="stakeholders" className="text-xs sm:text-sm">Stakeholders</TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs sm:text-sm">Scenarios</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
            <TabsTrigger value="sources" className="text-xs sm:text-sm">Sources</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* What Happened (24h) */}
            {whatHappened.length > 0 && (
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> What Happened (24h)
                </h2>
                <div className="space-y-1">
                  {whatHappened.map((claim: any) => (
                    <ClaimWithCitation key={claim.id} claim={claim} />
                  ))}
                </div>
              </Card>
            )}

            {/* What Changed */}
            {whatChanged.length > 0 && (
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">What Changed</h2>
                <div className="space-y-1">
                  {whatChanged.map((claim: any) => (
                    <ClaimWithCitation key={claim.id} claim={claim} />
                  ))}
                </div>
              </Card>
            )}

            {/* Conflicting Evidence */}
            {conflicting.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Where Sources Disagree
                </h2>
                {conflicting.map((claim: any) => (
                  <ConflictingClaimsPanel key={claim.id} claim={claim} />
                ))}
              </div>
            )}

            {/* Who Said What */}
            {whoSaid.length > 0 && (
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Statements</h2>
                <div className="space-y-1">
                  {whoSaid.map((claim: any) => (
                    <ClaimWithCitation key={claim.id} claim={claim} />
                  ))}
                </div>
              </Card>
            )}

            {/* Likely Next */}
            {likelyNext.length > 0 && (
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Likely Next Steps</h2>
                <div className="space-y-1">
                  {likelyNext.map((claim: any) => (
                    <ClaimWithCitation key={claim.id} claim={claim} />
                  ))}
                </div>
              </Card>
            )}

            {/* Briefing Pack CTA */}
            <Card className="p-5 bg-gradient-to-br from-gray-50 to-blue-50/50 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Full Briefing Pack</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Scenarios, stakeholder maps, signals to watch, and decision-ready analysis.
                  </p>
                </div>
                <Link href={`/topic/${slug}/briefing`}>
                  <Button size="sm">
                    Open <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          </TabsContent>

          {/* VIEWPOINTS TAB */}
          <TabsContent value="viewpoints" className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              The tool maps different perspectives without judging who is right. Each viewpoint is sourced.
            </p>
            {topic.viewpoints?.map((vp: any, i: number) => (
              <Card key={vp.id} className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                    ["bg-blue-600", "bg-red-600", "bg-emerald-600", "bg-purple-600"][i % 4]
                  }`}>
                    {vp.groupName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{vp.groupName}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{vp.position}</p>
                  </div>
                </div>

                <div className="ml-11 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Arguments</span>
                    <ul className="mt-1.5 space-y-1.5">
                      {(vp.arguments as string[]).map((arg: string, j: number) => (
                        <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-gray-300 mt-1">&#8226;</span>
                          {arg}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {vp.incentives && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Incentives</span>
                      <p className="text-sm text-gray-600 mt-0.5">{vp.incentives}</p>
                    </div>
                  )}

                  {vp.constraints && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Constraints</span>
                      <p className="text-sm text-gray-600 mt-0.5">{vp.constraints}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* STAKEHOLDERS TAB */}
          <TabsContent value="stakeholders" className="space-y-4">
            {topic.stakeholders?.map((sh: any) => (
              <Card key={sh.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{sh.name}</h3>
                    <Badge variant="outline" className="text-[10px] mt-1">{sh.role}</Badge>
                    {sh.description && (
                      <p className="text-sm text-gray-600 mt-2">{sh.description}</p>
                    )}
                  </div>
                  <Users className="w-5 h-5 text-gray-300 shrink-0" />
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* SCENARIOS TAB */}
          <TabsContent value="scenarios" className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Plausible outcomes based on current reporting. Each scenario is grounded in cited sources.
            </p>
            {topic.scenarios?.map((sc: any) => {
              const likelihoodColors: Record<string, string> = {
                high: "bg-red-100 text-red-700 border-red-200",
                medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
                low: "bg-green-100 text-green-700 border-green-200",
              };
              return (
                <Card key={sc.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-gray-900">{sc.title}</h3>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${likelihoodColors[sc.likelihood || "medium"]}`}>
                      {sc.likelihood} likelihood
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{sc.description}</p>
                  {sc.triggers && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Triggers</span>
                      <p className="text-sm text-gray-600 mt-0.5">{sc.triggers}</p>
                    </div>
                  )}
                  {sc.implications && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Implications</span>
                      <p className="text-sm text-gray-600 mt-0.5">{sc.implications}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          {/* TIMELINE TAB */}
          <TabsContent value="timeline">
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />

              {/* Recent events first */}
              {recentTimeline.length > 0 && (
                <div className="mb-6">
                  <Badge className="mb-3 bg-blue-100 text-blue-700 border-blue-200">Last 24 Hours</Badge>
                  {recentTimeline.map((event: any) => (
                    <div key={event.id} className="relative mb-4 pl-4">
                      <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                      <div className="text-xs text-blue-600 font-medium mb-0.5">
                        {formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })}
                      </div>
                      <p className="text-sm text-gray-700">{event.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Past events */}
              {pastTimeline.map((event: any) => (
                <div key={event.id} className="relative mb-4 pl-4">
                  <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full ring-4 ${
                    event.significance === "high"
                      ? "bg-gray-700 ring-gray-200"
                      : "bg-gray-300 ring-gray-100"
                  }`} />
                  <div className="text-xs text-gray-400 font-medium mb-0.5">
                    {format(new Date(event.eventDate), "MMM d, yyyy")}
                  </div>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* SOURCES TAB */}
          <TabsContent value="sources">
            <div className="mb-4 flex items-center gap-3">
              <SourceDiversityIndicator sourceCount={topic.sourceCount} />
              <span className="text-xs text-gray-400">
                {topic.articles?.length || 0} articles from {topic.sourceCount} sources
              </span>
            </div>
            <SourceList articles={topic.articles || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
