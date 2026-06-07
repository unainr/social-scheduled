import { pgTable, text, timestamp, uuid, boolean, pgEnum } from "drizzle-orm/pg-core"

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "scheduled",
  "published",
  "failed",
])

export const platformEnum = pgEnum("platform", [
  "linkedin",
  "instagram",
])

// ─────────────────────────────────────────────
// CONNECTED ACCOUNTS
// ─────────────────────────────────────────────

export const connectedAccounts = pgTable("connected_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  platform: platformEnum("platform").notNull(),
  zernioAccountId: text("zernio_account_id").notNull(),
  username: text("username"),
  profileImage: text("profile_image"),
  isActive: boolean("is_active").default(true).notNull(),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
})

// ─────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  platforms: text("platforms").array().notNull(),
  mediaUrls: text("media_urls").array().default([]),
  mediaType: text("media_type"),
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  zernioPostId: text("zernio_post_id"),
  status: postStatusEnum("status").default("draft").notNull(),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ConnectedAccount = typeof connectedAccounts.$inferSelect
export type NewConnectedAccount = typeof connectedAccounts.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert