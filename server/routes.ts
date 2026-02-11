import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { ensureTablesExist } from "./db";
import { insertFollowSchema } from "@shared/schema";
import crypto from "crypto";

function getSessionId(req: any): string {
  // Simple session ID from cookie or generate one
  if (!req.cookies?.sid) {
    const sid = crypto.randomUUID();
    req.res?.cookie("sid", sid, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
    return sid;
  }
  return req.cookies.sid;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Cookie parser middleware
  app.use((req: any, _res, next) => {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
        const [name, ...rest] = cookie.trim().split("=");
        req.cookies[name] = rest.join("=");
      });
    }
    next();
  });

  // Ensure tables exist, then seed
  try {
    await ensureTablesExist();
    await seedDatabase();
    console.log("Database ready.");
  } catch (error: any) {
    console.error("Database setup error:", error?.message || error);
  }

  // ── Landing Data ───────────────────────────────────────
  app.get("/api/landing", async (req: any, res) => {
    try {
      const sessionId = getSessionId(req);
      const data = await storage.getLandingData(sessionId);
      res.json(data);
    } catch (error) {
      console.error("Landing data error:", error);
      res.status(500).json({ message: "Failed to load landing data" });
    }
  });

  // ── Topic Detail ──────────────────────────────────────
  app.get("/api/topics/:slug", async (req: any, res) => {
    try {
      const topic = await storage.getTopicBySlug(req.params.slug);
      if (!topic) return res.status(404).json({ message: "Topic not found" });
      const detail = await storage.getTopicDetail(topic.id);
      res.json(detail);
    } catch (error) {
      res.status(500).json({ message: "Failed to load topic detail" });
    }
  });

  // ── Search ─────────────────────────────────────────────
  app.get("/api/search", async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json({ topics: [], regions: [], articles: [] });
      }
      const sessionId = getSessionId(req);
      const results = await storage.search(query.trim(), sessionId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // ── Follow / Unfollow ──────────────────────────────────
  app.get("/api/follows", async (req: any, res) => {
    try {
      const sessionId = getSessionId(req);
      const follows = await storage.getUserFollows(sessionId);
      res.json(follows);
    } catch (error) {
      res.status(500).json({ message: "Failed to load follows" });
    }
  });

  app.post("/api/follows", async (req: any, res) => {
    try {
      const parsed = insertFollowSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid follow data" });
      const sessionId = getSessionId(req);
      const follow = await storage.addFollow(sessionId, parsed.data.followType, parsed.data.targetId);
      res.json(follow);
    } catch (error) {
      res.status(500).json({ message: "Failed to add follow" });
    }
  });

  app.delete("/api/follows", async (req: any, res) => {
    try {
      const parsed = insertFollowSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid unfollow data" });
      const sessionId = getSessionId(req);
      await storage.removeFollow(sessionId, parsed.data.followType, parsed.data.targetId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove follow" });
    }
  });

  // ── Goals ──────────────────────────────────────────────
  app.get("/api/goals", async (req: any, res) => {
    try {
      const sessionId = getSessionId(req);
      const goals = await storage.getUserGoals(sessionId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to load goals" });
    }
  });

  app.post("/api/goals", async (req: any, res) => {
    try {
      const { goals } = req.body;
      if (!Array.isArray(goals)) return res.status(400).json({ message: "Goals must be an array" });
      const sessionId = getSessionId(req);
      const result = await storage.setUserGoals(sessionId, goals);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to save goals" });
    }
  });

  // ── Onboarding Data ───────────────────────────────────
  app.get("/api/onboarding", async (req: any, res) => {
    try {
      const sessionId = getSessionId(req);
      const data = await storage.getOnboardingData(sessionId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to load onboarding data" });
    }
  });

  // ── Suggestions ────────────────────────────────────────
  app.get("/api/suggestions", async (req: any, res) => {
    try {
      const sessionId = getSessionId(req);
      const suggestions = await storage.getSuggestedTopics(sessionId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to load suggestions" });
    }
  });

  return httpServer;
}
