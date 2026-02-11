import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Vote, TrendingUp, Briefcase, Check, ChevronRight, ArrowLeft, Globe, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/news/Header";
import { useRegions, useTopics, useFollow, useSaveGoals, useFollows } from "@/hooks/use-news";

const GOALS = [
  { id: "vote", label: "Vote & Participate", description: "Understand tradeoffs, stakes, and what changes if X happens", icon: Vote },
  { id: "invest", label: "Invest & Allocate", description: "Track scenarios, triggers, and downside risks for allocation decisions", icon: TrendingUp },
  { id: "advocate", label: "Advocate & Prepare", description: "Anticipate stakeholder moves, timelines, and likely next steps", icon: Briefcase },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);

  const { data: regions } = useRegions();
  const { data: topics } = useTopics();
  const { data: follows } = useFollows();
  const followMutation = useFollow();
  const saveGoals = useSaveGoals();

  function toggleGoal(id: string) {
    setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  }
  function toggleRegion(id: number) {
    setSelectedRegions(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }
  function toggleTopic(id: number) {
    setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  async function handleFinish() {
    // Save goals
    if (selectedGoals.length > 0) {
      await saveGoals.mutateAsync(selectedGoals);
    }
    // Save follows
    for (const regionId of selectedRegions) {
      await followMutation.mutateAsync({ followType: "region", targetId: regionId });
    }
    for (const topicId of selectedTopics) {
      await followMutation.mutateAsync({ followType: "topic", targetId: topicId });
    }
    setLocation("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-gray-900" : "bg-gray-200"}`} />
          ))}
        </div>

        {/* Step 0: Goals */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">What do you want to achieve?</h1>
            <p className="text-gray-500 mb-6">This helps us frame news around your decision-making needs. Pick one or more.</p>

            <div className="space-y-3">
              {GOALS.map(goal => {
                const selected = selectedGoals.includes(goal.id);
                const Icon = goal.icon;
                return (
                  <Card
                    key={goal.id}
                    className={`p-4 cursor-pointer transition-all ${selected ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "hover:border-gray-300"}`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{goal.label}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
                      </div>
                      {selected && <Check className="w-5 h-5 text-gray-900" />}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <Link href="/">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Skip</Button>
              </Link>
              <Button onClick={() => setStep(1)}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Regions */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Which regions matter to you?</h1>
            <p className="text-gray-500 mb-6">Select the areas you want to track. You can change this anytime.</p>

            <div className="grid gap-2 sm:grid-cols-2">
              {(regions || []).map((region: any) => {
                const selected = selectedRegions.includes(region.id);
                return (
                  <Card
                    key={region.id}
                    className={`p-3 cursor-pointer transition-all ${selected ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "hover:border-gray-300"}`}
                    onClick={() => toggleRegion(region.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className={`w-4 h-4 ${selected ? "text-gray-900" : "text-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900">{region.name}</h3>
                        <p className="text-[10px] text-gray-500 truncate">{region.description}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-gray-900 shrink-0" />}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Skip</Button>
                <Button onClick={() => setStep(2)}>
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Topics */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pick a few topics to start</h1>
            <p className="text-gray-500 mb-6">Follow topics to build your personalized briefing feed.</p>

            <div className="space-y-2">
              {(topics || []).map((topic: any) => {
                const selected = selectedTopics.includes(topic.id);
                return (
                  <Card
                    key={topic.id}
                    className={`p-4 cursor-pointer transition-all ${selected ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "hover:border-gray-300"}`}
                    onClick={() => toggleTopic(topic.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${selected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900">{topic.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {topic.category && (
                            <Badge variant="secondary" className="text-[10px]">{topic.category}</Badge>
                          )}
                          {topic.regions?.slice(0, 2).map((r: any) => (
                            <Badge key={r.id} variant="outline" className="text-[10px]">{r.name}</Badge>
                          ))}
                          <span className="text-[10px] text-gray-400">{topic.articleCount} articles</span>
                        </div>
                        {topic.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{topic.description}</p>
                        )}
                      </div>
                      {selected && <Check className="w-5 h-5 text-gray-900 shrink-0" />}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                <Link href="/">
                  <Button variant="ghost" size="sm">Skip</Button>
                </Link>
                <Button onClick={handleFinish} disabled={saveGoals.isPending || followMutation.isPending}>
                  {saveGoals.isPending || followMutation.isPending ? "Saving..." : "Start Reading"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
