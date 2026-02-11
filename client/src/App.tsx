import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import TopicDeepDive from "@/pages/TopicDeepDive";
import BriefingPack from "@/pages/BriefingPack";
import SearchPage from "@/pages/SearchPage";
import Onboarding from "@/pages/Onboarding";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/topic/:slug" component={TopicDeepDive} />
      <Route path="/topic/:slug/briefing" component={BriefingPack} />
      <Route path="/search" component={SearchPage} />
      <Route path="/onboarding" component={Onboarding} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
