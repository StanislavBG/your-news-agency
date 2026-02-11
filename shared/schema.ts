import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Regions ──────────────────────────────────────────────
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
});

export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;

// ── Topics ───────────────────────────────────────────────
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  coreQuestion: text("core_question"),
  category: varchar("category", { length: 100 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

// ── Topic ↔ Region join ──────────────────────────────────
export const topicRegions = pgTable("topic_regions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  regionId: integer("region_id").notNull(),
});

// ── Sources ──────────────────────────────────────────────
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: text("url"),
  reliability: real("reliability"), // 0-1 scale
});

export type Source = typeof sources.$inferSelect;
export type InsertSource = typeof sources.$inferInsert;

// ── Articles ─────────────────────────────────────────────
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  topicId: integer("topic_id").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  summary: text("summary"),
  publishedAt: timestamp("published_at").notNull(),
  isRecent: boolean("is_recent").default(true),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// ── Claims ───────────────────────────────────────────────
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  statement: text("statement").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // what_happened, who_said, what_changed, likely_next, background
  articleIds: jsonb("article_ids").$type<number[]>().notNull(), // references to articles
  isConflicting: boolean("is_conflicting").default(false),
  conflictingClaimId: integer("conflicting_claim_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = typeof claims.$inferInsert;

// ── Viewpoints ───────────────────────────────────────────
export const viewpoints = pgTable("viewpoints", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  groupName: varchar("group_name", { length: 200 }).notNull(),
  position: text("position").notNull(),
  arguments: jsonb("arguments").$type<string[]>().notNull(),
  incentives: text("incentives"),
  constraints: text("constraints"),
  articleIds: jsonb("article_ids").$type<number[]>().notNull(),
});

export type Viewpoint = typeof viewpoints.$inferSelect;
export type InsertViewpoint = typeof viewpoints.$inferInsert;

// ── Scenarios ────────────────────────────────────────────
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  likelihood: varchar("likelihood", { length: 50 }), // high, medium, low
  triggers: text("triggers"),
  implications: text("implications"),
  articleIds: jsonb("article_ids").$type<number[]>().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

// ── Timeline Events ──────────────────────────────────────
export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  eventDate: timestamp("event_date").notNull(),
  description: text("description").notNull(),
  significance: varchar("significance", { length: 50 }), // high, medium, low
  isRecent: boolean("is_recent").default(false),
  articleId: integer("article_id"),
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;

// ── Stakeholders ─────────────────────────────────────────
export const stakeholders = pgTable("stakeholders", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 200 }).notNull(),
  description: text("description"),
  articleIds: jsonb("article_ids").$type<number[]>().notNull(),
});

export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = typeof stakeholders.$inferInsert;

// ── User Follows ─────────────────────────────────────────
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  followType: varchar("follow_type", { length: 20 }).notNull(), // 'topic' | 'region'
  targetId: integer("target_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

// ── User Goals ───────────────────────────────────────────
export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  goal: varchar("goal", { length: 50 }).notNull(), // 'vote' | 'invest' | 'advocate'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = typeof userGoals.$inferInsert;

// ── Watch Signals ────────────────────────────────────────
export const watchSignals = pgTable("watch_signals", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  signal: text("signal").notNull(),
  implication: text("implication"),
  scenarioId: integer("scenario_id"),
  articleIds: jsonb("article_ids").$type<number[]>().notNull(),
});

export type WatchSignal = typeof watchSignals.$inferSelect;
export type InsertWatchSignal = typeof watchSignals.$inferInsert;

// ── Zod schemas for inserts ──────────────────────────────
export const insertRegionSchema = createInsertSchema(regions).omit({ id: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSourceSchema = createInsertSchema(sources).omit({ id: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true });
export const insertFollowSchema = z.object({
  followType: z.enum(["topic", "region"]),
  targetId: z.number(),
});
export const insertGoalSchema = z.object({
  goal: z.enum(["vote", "invest", "advocate"]),
});

// Keep old greeting table for backward compatibility
export const greetings = pgTable("greetings", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
});
export const insertGreetingSchema = createInsertSchema(greetings).pick({ message: true });
export type Greeting = typeof greetings.$inferSelect;
export type InsertGreeting = z.infer<typeof insertGreetingSchema>;
