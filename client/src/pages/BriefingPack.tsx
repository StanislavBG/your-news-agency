import { useRoute, Link } from "wouter";
import {
  ArrowLeft, Target, TrendingUp, Users, Scale, Clock,
  Compass, Eye as EyeIcon, AlertTriangle, FileText, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/news/Header";
import { InlineCitation, SourceDiversityIndicator } from "@/components/news/SourceCitation";
import { ClaimWithCitation, ConflictingClaimsPanel } from "@/components/news/ConflictIndicator";
import { useTopicBriefing } from "@/hooks/use-news";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";

function BriefingSection({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider group-hover:text-gray-900">
            {title}
          </h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

export default function BriefingPack() {
  const [, params] = useRoute("/topic/:slug/briefing");
  const slug = params?.slug || "";
  const { data: topic, isLoading, isError, refetch } = useTopicBriefing(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl mb-4" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to load briefing</h1>
          <p className="text-sm text-gray-500 mb-6">Could not connect to the server. Please try again.</p>
          <div className="flex gap-2 justify-center">
            <Link href="/"><Button variant="ghost">Back to briefings</Button></Link>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Briefing not found</h1>
          <Link href="/"><Button variant="ghost">Back to briefings</Button></Link>
        </div>
      </div>
    );
  }

  const whatHappened = topic.claims?.filter((c: any) => c.category === "what_happened") || [];
  const whatChanged = topic.claims?.filter((c: any) => c.category === "what_changed") || [];
  const whoSaid = topic.claims?.filter((c: any) => c.category === "who_said") || [];
  const likelyNext = topic.claims?.filter((c: any) => c.category === "likely_next") || [];
  const conflicting = topic.claims?.filter((c: any) => c.isConflicting && c.conflictingClaim) || [];
  const recentTimeline = topic.timelineEvents?.filter((e: any) => e.isRecent) || [];
  const pastTimeline = topic.timelineEvents?.filter((e: any) => !e.isRecent)
    .sort((a: any, b: any) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Navigation */}
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/topic/${slug}`}>
            <Button variant="ghost" size="sm" className="-ml-2 text-gray-500">
              <ArrowLeft className="w-4 h-4 mr-1" /> Topic Overview
            </Button>
          </Link>
        </div>

        {/* Briefing Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-gray-700" />
            <Badge variant="secondary" className="text-xs font-medium">Briefing Pack</Badge>
            <SourceDiversityIndicator sourceCount={topic.sourceCount} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1">
            {topic.title}
          </h1>
          <p className="text-sm text-gray-500">
            Decision-ready analysis with statement-level sourcing
          </p>
        </div>

        {/* Briefing Content */}
        <Card className="p-0 overflow-hidden divide-y-0">
          <div className="px-5 sm:px-6">

            {/* 1. What Happened (24h Update) */}
            <BriefingSection icon={TrendingUp} title="What Happened (24h Update)">
              {whatHappened.length > 0 ? (
                <div className="space-y-1">
                  {whatHappened.map((claim: any) => (
                    <ClaimWithCitation key={claim.id} claim={claim} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No major developments in the last 24 hours.</p>
              )}
              {whatChanged.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Key Changes</span>
                  <div className="space-y-1 mt-1">
                    {whatChanged.map((claim: any) => (
                      <ClaimWithCitation key={claim.id} claim={claim} />
                    ))}
                  </div>
                </div>
              )}
            </BriefingSection>

            {/* 2. Core Question */}
            {topic.coreQuestion && (
              <BriefingSection icon={Target} title="Core Question">
                <p className="text-sm text-gray-700 leading-relaxed bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                  {topic.coreQuestion}
                </p>
              </BriefingSection>
            )}

            {/* 3. Viewpoints & Arguments */}
            <BriefingSection icon={Scale} title="Viewpoints & Arguments">
              <p className="text-xs text-gray-400 mb-4">
                All sides presented without editorial judgment. The tool maps perspectives, not verdicts.
              </p>
              <div className="space-y-4">
                {topic.viewpoints?.map((vp: any, i: number) => (
                  <div key={vp.id} className={`p-4 rounded-lg border-l-4 bg-gray-50 ${
                    ["border-l-blue-500", "border-l-red-500", "border-l-emerald-500", "border-l-purple-500"][i % 4]
                  }`}>
                    <h3 className="font-semibold text-gray-900 text-sm">{vp.groupName}</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-2">{vp.position}</p>
                    <ul className="space-y-1">
                      {(vp.arguments as string[]).slice(0, 3).map((arg: string, j: number) => (
                        <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-gray-300 mt-px">&#8226;</span> {arg}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-4 mt-2">
                      {vp.incentives && (
                        <div className="flex-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Incentives</span>
                          <p className="text-xs text-gray-500 mt-0.5">{vp.incentives}</p>
                        </div>
                      )}
                      {vp.constraints && (
                        <div className="flex-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Constraints</span>
                          <p className="text-xs text-gray-500 mt-0.5">{vp.constraints}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </BriefingSection>

            {/* 4. Conflicting Evidence */}
            {conflicting.length > 0 && (
              <BriefingSection icon={AlertTriangle} title="Where Sources Disagree">
                {conflicting.map((claim: any) => (
                  <ConflictingClaimsPanel key={claim.id} claim={claim} />
                ))}
              </BriefingSection>
            )}

            {/* 5. Stakeholder Map */}
            <BriefingSection icon={Users} title="Stakeholder Map">
              <div className="grid gap-3 sm:grid-cols-2">
                {topic.stakeholders?.map((sh: any) => (
                  <div key={sh.id} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-900">{sh.name}</h4>
                    <span className="text-[10px] text-gray-500 font-medium uppercase">{sh.role}</span>
                    {sh.description && (
                      <p className="text-xs text-gray-500 mt-1">{sh.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </BriefingSection>

            {/* 6. Timeline */}
            <BriefingSection icon={Clock} title="Timeline">
              <div className="relative pl-5">
                <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />

                {recentTimeline.map((event: any) => (
                  <div key={event.id} className="relative mb-3 pl-4">
                    <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
                    <div className="text-[10px] text-blue-600 font-medium">
                      {formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })}
                    </div>
                    <p className="text-xs text-gray-700">{event.description}</p>
                  </div>
                ))}

                {recentTimeline.length > 0 && pastTimeline.length > 0 && (
                  <div className="relative mb-3 pl-4">
                    <span className="text-[10px] text-gray-300 uppercase tracking-wider font-medium">Earlier</span>
                  </div>
                )}

                {pastTimeline.slice(0, 5).map((event: any) => (
                  <div key={event.id} className="relative mb-3 pl-4">
                    <div className={`absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full ring-2 ${
                      event.significance === "high" ? "bg-gray-600 ring-gray-200" : "bg-gray-300 ring-gray-100"
                    }`} />
                    <div className="text-[10px] text-gray-400 font-medium">
                      {format(new Date(event.eventDate), "MMM d, yyyy")}
                    </div>
                    <p className="text-xs text-gray-600">{event.description}</p>
                  </div>
                ))}
              </div>
            </BriefingSection>

            {/* 7. Scenarios */}
            <BriefingSection icon={Compass} title="Scenarios">
              <div className="space-y-3">
                {topic.scenarios?.map((sc: any) => {
                  const colors: Record<string, string> = {
                    high: "border-l-red-400 bg-red-50/30",
                    medium: "border-l-yellow-400 bg-yellow-50/30",
                    low: "border-l-green-400 bg-green-50/30",
                  };
                  return (
                    <div key={sc.id} className={`p-4 rounded-lg border-l-4 ${colors[sc.likelihood || "medium"]}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900">{sc.title}</h4>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {sc.likelihood} likelihood
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed mb-2">{sc.description}</p>
                      {sc.triggers && (
                        <div className="mb-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Triggers:</span>
                          <span className="text-xs text-gray-500 ml-1">{sc.triggers}</span>
                        </div>
                      )}
                      {sc.implications && (
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">So what:</span>
                          <span className="text-xs text-gray-500 ml-1">{sc.implications}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </BriefingSection>

            {/* 8. What to Watch Next */}
            <BriefingSection icon={EyeIcon} title="What to Watch Next">
              {topic.watchSignals && topic.watchSignals.length > 0 ? (
                <div className="space-y-3">
                  {topic.watchSignals.map((signal: any) => (
                    <div key={signal.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 font-medium">{signal.signal}</p>
                      {signal.implication && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">Why it matters:</span> {signal.implication}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No specific signals identified yet.</p>
              )}
            </BriefingSection>

          </div>
        </Card>

        {/* Source footer */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sources</span>
            <SourceDiversityIndicator sourceCount={topic.sourceCount} />
          </div>
          <div className="flex flex-wrap gap-2">
            {topic.articles?.map((a: any) => (
              <Badge key={a.id} variant="outline" className="text-[10px] text-gray-500">
                {a.source.name}
              </Badge>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
