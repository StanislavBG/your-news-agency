import { db } from "./db";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";
import {
  regions, topics, topicRegions, sources, articles, claims,
  viewpoints, scenarios, timelineEvents, stakeholders, watchSignals,
  userFollows, userGoals, greetings,
  type Region, type Topic, type Source, type Article, type Claim,
  type Viewpoint, type Scenario, type TimelineEvent, type Stakeholder,
  type WatchSignal, type UserFollow, type UserGoal,
  type Greeting, type InsertGreeting,
} from "@shared/schema";

// ── Rich response types ──────────────────────────────────
export interface ArticleWithSource extends Article {
  source: Source;
}

export interface ClaimWithArticles extends Claim {
  articles: ArticleWithSource[];
  conflictingClaim?: ClaimWithArticles;
}

export interface TopicSummary extends Topic {
  regions: Region[];
  articleCount: number;
  sourceCount: number;
  recentClaimsCount: number;
  latestUpdate: Date | null;
  isFollowed?: boolean;
  followReason?: string;
}

export interface TopicDetail extends Topic {
  regions: Region[];
  articles: ArticleWithSource[];
  claims: ClaimWithArticles[];
  viewpoints: Viewpoint[];
  scenarios: Scenario[];
  timelineEvents: TimelineEvent[];
  stakeholders: Stakeholder[];
  watchSignals: WatchSignal[];
  sourceCount: number;
  sourceDiversity: number; // 0-1 scale
}

export interface LandingData {
  topicsByRegion: { region: Region; topics: TopicSummary[] }[];
  topicsByCategory: { category: string; topics: TopicSummary[] }[];
  recentUpdates: { topic: TopicSummary; claim: Claim }[];
}

export interface OnboardingData {
  regions: Region[];
  topics: TopicSummary[];
}

export interface SearchResult {
  topics: TopicSummary[];
  regions: Region[];
  articles: ArticleWithSource[];
}

// ── Storage class ────────────────────────────────────────
export class DatabaseStorage {
  // Greetings (backward compat)
  async getGreetings(): Promise<Greeting[]> {
    return await db.select().from(greetings);
  }
  async createGreeting(g: InsertGreeting): Promise<Greeting> {
    const [row] = await db.insert(greetings).values(g).returning();
    return row;
  }

  // ── Regions ────────────────────────────────────────────
  async getRegions(): Promise<Region[]> {
    return await db.select().from(regions);
  }

  async getRegionBySlug(slug: string): Promise<Region | undefined> {
    const [row] = await db.select().from(regions).where(eq(regions.slug, slug));
    return row;
  }

  // ── Sources ────────────────────────────────────────────
  async getSources(): Promise<Source[]> {
    return await db.select().from(sources);
  }

  async getSourceById(id: number): Promise<Source | undefined> {
    const [row] = await db.select().from(sources).where(eq(sources.id, id));
    return row;
  }

  // ── Articles ───────────────────────────────────────────
  async getArticlesForTopic(topicId: number): Promise<ArticleWithSource[]> {
    const allArticles = await db.select().from(articles).where(eq(articles.topicId, topicId)).orderBy(desc(articles.publishedAt));
    const allSources = await db.select().from(sources);
    const sourceMap = new Map(allSources.map(s => [s.id, s]));
    return allArticles.map(a => ({ ...a, source: sourceMap.get(a.sourceId)! }));
  }

  async getArticleWithSource(id: number): Promise<ArticleWithSource | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    if (!article) return undefined;
    const [source] = await db.select().from(sources).where(eq(sources.id, article.sourceId));
    return { ...article, source };
  }

  // ── Claims ─────────────────────────────────────────────
  async getClaimsForTopic(topicId: number): Promise<ClaimWithArticles[]> {
    const allClaims = await db.select().from(claims).where(eq(claims.topicId, topicId));
    const allArticles = await db.select().from(articles).where(eq(articles.topicId, topicId));
    const allSources = await db.select().from(sources);
    const sourceMap = new Map(allSources.map(s => [s.id, s]));
    const articleMap = new Map(allArticles.map(a => [a.id, { ...a, source: sourceMap.get(a.sourceId)! }]));
    const claimMap = new Map(allClaims.map(c => [c.id, c]));

    return allClaims.map(c => {
      const claimArticles = (c.articleIds as number[]).map(id => articleMap.get(id)).filter(Boolean) as ArticleWithSource[];
      const result: ClaimWithArticles = { ...c, articles: claimArticles };

      if (c.isConflicting && c.conflictingClaimId) {
        const conflicting = claimMap.get(c.conflictingClaimId);
        if (conflicting) {
          const conflictArticles = (conflicting.articleIds as number[]).map(id => articleMap.get(id)).filter(Boolean) as ArticleWithSource[];
          result.conflictingClaim = { ...conflicting, articles: conflictArticles };
        }
      }
      return result;
    });
  }

  // ── Topics ─────────────────────────────────────────────
  async getTopics(): Promise<Topic[]> {
    return await db.select().from(topics).orderBy(desc(topics.updatedAt));
  }

  async getTopicBySlug(slug: string): Promise<Topic | undefined> {
    const [row] = await db.select().from(topics).where(eq(topics.slug, slug));
    return row;
  }

  async getTopicById(id: number): Promise<Topic | undefined> {
    const [row] = await db.select().from(topics).where(eq(topics.id, id));
    return row;
  }

  async getRegionsForTopic(topicId: number): Promise<Region[]> {
    const joins = await db.select().from(topicRegions).where(eq(topicRegions.topicId, topicId));
    const regionIds = joins.map(j => j.regionId);
    if (regionIds.length === 0) return [];
    const allRegions = await db.select().from(regions);
    return allRegions.filter(r => regionIds.includes(r.id));
  }

  async getTopicsForRegion(regionId: number): Promise<Topic[]> {
    const joins = await db.select().from(topicRegions).where(eq(topicRegions.regionId, regionId));
    const topicIds = joins.map(j => j.topicId);
    if (topicIds.length === 0) return [];
    const allTopics = await db.select().from(topics).orderBy(desc(topics.updatedAt));
    return allTopics.filter(t => topicIds.includes(t.id));
  }

  async getTopicSummary(topic: Topic, sessionId?: string): Promise<TopicSummary> {
    const topicRegionsList = await this.getRegionsForTopic(topic.id);
    const topicArticles = await db.select().from(articles).where(eq(articles.topicId, topic.id));
    const topicClaims = await db.select().from(claims).where(eq(claims.topicId, topic.id));

    const sourceIds = new Set(topicArticles.map(a => a.sourceId));
    const recentClaims = topicClaims.filter(c => {
      const age = Date.now() - new Date(c.createdAt).getTime();
      return age < 24 * 60 * 60 * 1000;
    });
    const latest = topicArticles.length > 0
      ? topicArticles.reduce((a, b) => new Date(a.publishedAt) > new Date(b.publishedAt) ? a : b).publishedAt
      : null;

    let isFollowed = false;
    let followReason: string | undefined;
    if (sessionId) {
      const follows = await db.select().from(userFollows).where(
        and(eq(userFollows.sessionId, sessionId), eq(userFollows.followType, "topic"), eq(userFollows.targetId, topic.id))
      );
      isFollowed = follows.length > 0;
      if (isFollowed) followReason = "You follow this topic";

      if (!isFollowed) {
        // Check if user follows a region that contains this topic
        const userRegionFollows = await db.select().from(userFollows).where(
          and(eq(userFollows.sessionId, sessionId), eq(userFollows.followType, "region"))
        );
        for (const rf of userRegionFollows) {
          if (topicRegionsList.some(r => r.id === rf.targetId)) {
            followReason = `Related to ${topicRegionsList.find(r => r.id === rf.targetId)?.name} (region you follow)`;
            break;
          }
        }
      }
    }

    return {
      ...topic,
      regions: topicRegionsList,
      articleCount: topicArticles.length,
      sourceCount: sourceIds.size,
      recentClaimsCount: recentClaims.length,
      latestUpdate: latest,
      isFollowed,
      followReason,
    };
  }

  async getTopicDetail(topicId: number): Promise<TopicDetail | undefined> {
    const topic = await this.getTopicById(topicId);
    if (!topic) return undefined;

    const [
      topicRegionsList,
      topicArticles,
      topicClaims,
      topicViewpoints,
      topicScenarios,
      topicTimeline,
      topicStakeholders,
      topicSignals,
    ] = await Promise.all([
      this.getRegionsForTopic(topicId),
      this.getArticlesForTopic(topicId),
      this.getClaimsForTopic(topicId),
      db.select().from(viewpoints).where(eq(viewpoints.topicId, topicId)),
      db.select().from(scenarios).where(eq(scenarios.topicId, topicId)),
      db.select().from(timelineEvents).where(eq(timelineEvents.topicId, topicId)),
      db.select().from(stakeholders).where(eq(stakeholders.topicId, topicId)),
      db.select().from(watchSignals).where(eq(watchSignals.topicId, topicId)),
    ]);

    const sourceIds = new Set(topicArticles.map(a => a.source.id));
    const allSources = await db.select().from(sources);
    const sourceDiversity = sourceIds.size / Math.max(allSources.length, 1);

    return {
      ...topic,
      regions: topicRegionsList,
      articles: topicArticles,
      claims: topicClaims,
      viewpoints: topicViewpoints,
      scenarios: topicScenarios,
      timelineEvents: topicTimeline,
      stakeholders: topicStakeholders,
      watchSignals: topicSignals,
      sourceCount: sourceIds.size,
      sourceDiversity,
    };
  }

  // ── Landing Data ───────────────────────────────────────
  async getLandingData(sessionId?: string): Promise<LandingData> {
    const allTopics = await this.getTopics();
    const allRegions = await this.getRegions();
    const allJoins = await db.select().from(topicRegions);

    const topicSummaries = await Promise.all(
      allTopics.map(t => this.getTopicSummary(t, sessionId))
    );

    // Group by region
    const topicsByRegion = allRegions.map(region => {
      const regionTopicIds = allJoins
        .filter(j => j.regionId === region.id)
        .map(j => j.topicId);
      return {
        region,
        topics: topicSummaries.filter(t => regionTopicIds.includes(t.id)),
      };
    }).filter(g => g.topics.length > 0);

    // Group by category
    const categories = Array.from(new Set(allTopics.map(t => t.category).filter(Boolean)));
    const topicsByCategory = categories.map(category => ({
      category: category!,
      topics: topicSummaries.filter(t => t.category === category),
    })).filter(g => g.topics.length > 0);

    // Recent updates (claims from last 24h)
    const allClaims = await db.select().from(claims);
    const recentClaims = allClaims
      .filter(c => {
        const age = Date.now() - new Date(c.createdAt).getTime();
        return age < 24 * 60 * 60 * 1000;
      })
      .slice(0, 10);
    const recentUpdates = recentClaims
      .map(c => {
        const topicSummary = topicSummaries.find(t => t.id === c.topicId);
        if (!topicSummary) return null;
        return { topic: topicSummary, claim: c };
      })
      .filter(Boolean) as { topic: TopicSummary; claim: Claim }[];

    return { topicsByRegion, topicsByCategory, recentUpdates };
  }

  // ── Onboarding Data ─────────────────────────────────────
  async getOnboardingData(sessionId?: string): Promise<OnboardingData> {
    const [allRegions, allTopics] = await Promise.all([
      this.getRegions(),
      this.getTopics(),
    ]);
    const topicSummaries = await Promise.all(
      allTopics.map(t => this.getTopicSummary(t, sessionId))
    );
    return { regions: allRegions, topics: topicSummaries };
  }

  // ── Search ─────────────────────────────────────────────
  async search(query: string, sessionId?: string): Promise<SearchResult> {
    // Split query into individual words and create a pattern for each,
    // so "Crypto Laws in US" matches any field containing any of those words
    const words = query.split(/\s+/).filter(w => w.length > 0);
    const patterns = words.map(w => `%${w}%`);

    // Build OR conditions: each word against each searchable field
    const topicConditions = patterns.flatMap(p => [
      ilike(topics.title, p), ilike(topics.description, p), ilike(topics.category, p),
    ]);
    const matchedTopics = await db.select().from(topics).where(or(...topicConditions));
    const topicSummaries = await Promise.all(
      matchedTopics.map(t => this.getTopicSummary(t, sessionId))
    );

    // Search regions
    const regionConditions = patterns.flatMap(p => [
      ilike(regions.name, p), ilike(regions.description, p),
    ]);
    const matchedRegions = await db.select().from(regions).where(or(...regionConditions));

    // Search articles
    const articleConditions = patterns.flatMap(p => [
      ilike(articles.title, p), ilike(articles.summary, p),
    ]);
    const matchedArticles = await db.select().from(articles).where(or(...articleConditions));
    const allSources = await db.select().from(sources);
    const sourceMap = new Map(allSources.map(s => [s.id, s]));
    const articlesWithSources = matchedArticles.map(a => ({
      ...a,
      source: sourceMap.get(a.sourceId)!,
    }));

    return {
      topics: topicSummaries,
      regions: matchedRegions,
      articles: articlesWithSources,
    };
  }

  // ── User Follows ───────────────────────────────────────
  async getUserFollows(sessionId: string): Promise<UserFollow[]> {
    return await db.select().from(userFollows).where(eq(userFollows.sessionId, sessionId));
  }

  async addFollow(sessionId: string, followType: string, targetId: number): Promise<UserFollow> {
    // Check if already following
    const existing = await db.select().from(userFollows).where(
      and(eq(userFollows.sessionId, sessionId), eq(userFollows.followType, followType), eq(userFollows.targetId, targetId))
    );
    if (existing.length > 0) return existing[0];

    const [follow] = await db.insert(userFollows).values({ sessionId, followType, targetId }).returning();
    return follow;
  }

  async removeFollow(sessionId: string, followType: string, targetId: number): Promise<void> {
    await db.delete(userFollows).where(
      and(eq(userFollows.sessionId, sessionId), eq(userFollows.followType, followType), eq(userFollows.targetId, targetId))
    );
  }

  // ── User Goals ─────────────────────────────────────────
  async getUserGoals(sessionId: string): Promise<UserGoal[]> {
    return await db.select().from(userGoals).where(eq(userGoals.sessionId, sessionId));
  }

  async setUserGoals(sessionId: string, goals: string[]): Promise<UserGoal[]> {
    await db.delete(userGoals).where(eq(userGoals.sessionId, sessionId));
    if (goals.length === 0) return [];
    const rows = await db.insert(userGoals).values(goals.map(goal => ({ sessionId, goal }))).returning();
    return rows;
  }

  // ── Suggestions ────────────────────────────────────────
  async getSuggestedTopics(sessionId: string): Promise<TopicSummary[]> {
    const follows = await this.getUserFollows(sessionId);
    const followedTopicIds = follows.filter(f => f.followType === "topic").map(f => f.targetId);
    const followedRegionIds = follows.filter(f => f.followType === "region").map(f => f.targetId);

    const allTopics = await this.getTopics();
    const notFollowed = allTopics.filter(t => !followedTopicIds.includes(t.id));

    // Prioritize topics in followed regions
    const allJoins = await db.select().from(topicRegions);
    const scored = notFollowed.map(t => {
      const topicRegionIds = allJoins.filter(j => j.topicId === t.id).map(j => j.regionId);
      const regionOverlap = topicRegionIds.filter(r => followedRegionIds.includes(r)).length;
      return { topic: t, score: regionOverlap };
    });
    scored.sort((a, b) => b.score - a.score);

    return Promise.all(scored.slice(0, 5).map(s => this.getTopicSummary(s.topic, sessionId)));
  }
}

export const storage = new DatabaseStorage();
