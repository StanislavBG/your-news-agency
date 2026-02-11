import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useLandingData() {
  return useQuery<any>({
    queryKey: ["/api/landing"],
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useTopicDetail(slug: string) {
  return useQuery<any>({
    queryKey: ["/api/topics", slug],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${slug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load topic");
      return res.json();
    },
    enabled: !!slug,
  });
}

export function useSearch(query: string) {
  return useQuery<any>({
    queryKey: ["/api/search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: query.trim().length > 0,
  });
}

export function useOnboardingData() {
  return useQuery<any>({
    queryKey: ["/api/onboarding"],
  });
}

export function useFollows() {
  return useQuery<any[]>({
    queryKey: ["/api/follows"],
  });
}

export function useFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ followType, targetId }: { followType: string; targetId: number }) => {
      const res = await apiRequest("POST", "/api/follows", { followType, targetId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
    },
  });
}

export function useUnfollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ followType, targetId }: { followType: string; targetId: number }) => {
      const res = await apiRequest("DELETE", "/api/follows", { followType, targetId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
    },
  });
}

export function useGoals() {
  return useQuery<any[]>({
    queryKey: ["/api/goals"],
  });
}

export function useSaveGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goals: string[]) => {
      const res = await apiRequest("POST", "/api/goals", { goals });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });
}

export function useSuggestions() {
  return useQuery<any[]>({
    queryKey: ["/api/suggestions"],
  });
}
