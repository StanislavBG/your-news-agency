import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

/**
 * Ensures all required tables exist in the database.
 * Uses CREATE TABLE IF NOT EXISTS so it's safe to call on every startup.
 */
export async function ensureTablesExist() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "greetings" (
        "id" SERIAL PRIMARY KEY,
        "message" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "regions" (
        "id" SERIAL PRIMARY KEY,
        "slug" VARCHAR(100) NOT NULL UNIQUE,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT
      );

      CREATE TABLE IF NOT EXISTS "topics" (
        "id" SERIAL PRIMARY KEY,
        "slug" VARCHAR(200) NOT NULL UNIQUE,
        "title" VARCHAR(500) NOT NULL,
        "description" TEXT,
        "core_question" TEXT,
        "category" VARCHAR(100),
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "topic_regions" (
        "id" SERIAL PRIMARY KEY,
        "topic_id" INTEGER NOT NULL,
        "region_id" INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "sources" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "url" TEXT,
        "reliability" REAL
      );

      CREATE TABLE IF NOT EXISTS "articles" (
        "id" SERIAL PRIMARY KEY,
        "source_id" INTEGER NOT NULL,
        "topic_id" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "url" TEXT,
        "summary" TEXT,
        "published_at" TIMESTAMP NOT NULL,
        "is_recent" BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS "claims" (
        "id" SERIAL PRIMARY KEY,
        "topic_id" INTEGER NOT NULL,
        "statement" TEXT NOT NULL,
        "category" VARCHAR(50) NOT NULL,
        "article_ids" JSONB NOT NULL,
        "is_conflicting" BOOLEAN DEFAULT FALSE,
        "conflicting_claim_id" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "viewpoints" (
        "id" SERIAL PRIMARY KEY,
        "topic_id" INTEGER NOT NULL,
        "group_name" VARCHAR(200) NOT NULL,
        "position" TEXT NOT NULL,
        "arguments" JSONB NOT NULL,
        "incentives" TEXT,
        "constraints" TEXT,
        "article_ids" JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "scenarios" (
        "id" SERIAL PRIMARY KEY,
        "topic_id" INTEGER NOT NULL,
        "title" VARCHAR(300) NOT NULL,
        "description" TEXT NOT NULL,
        "likelihood" VARCHAR(50),
        "triggers" TEXT,
        "implications" TEXT,
        "article_ids" JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "timeline_events" (
        "id" SERIAL PRIMARY KEY,
        "topic_id" INTEGER NOT NULL,
        "event_date" TIMESTAMP NOT NULL,
        "description" TEXT NOT NULL,
        "significance" VARCHAR(50),
        "is_recent" BOOLEAN DEFAULT FALSE,
        "article_id" INTEGER
      );

      CREATE TABLE IF NOT EXISTS "stakeholders" (
        "id" SERIAL PRIMARY KEY,
        "topic_id" INTEGER NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "role" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "article_ids" JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "user_follows" (
        "id" SERIAL PRIMARY KEY,
        "session_id" VARCHAR(100) NOT NULL,
        "follow_type" VARCHAR(20) NOT NULL,
        "target_id" INTEGER NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "user_goals" (
        "id" SERIAL PRIMARY KEY,
        "session_id" VARCHAR(100) NOT NULL,
        "goal" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "watch_signals" (
        "id" SERIAL PRIMARY KEY,
        "topic_id" INTEGER NOT NULL,
        "signal" TEXT NOT NULL,
        "implication" TEXT,
        "scenario_id" INTEGER,
        "article_ids" JSONB NOT NULL
      );
    `);
    console.log("Database tables verified/created.");
  } finally {
    client.release();
  }
}
