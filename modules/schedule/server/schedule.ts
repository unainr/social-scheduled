import { clerkMiddleware, getAuth } from "@clerk/hono";
import { zValidator } from "@hono/zod-validator";
import { ZernioApiError } from "@zernio/node";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { connectedAccounts, posts } from "@/drizzle/schema";
import { zernio } from "@/lib/zernio";

const platformSchema = z.enum(["linkedin", "instagram"]);

const createPostSchema = z.object({
  content: z.string().trim().min(1, "Post content is required").max(2200),
  platforms: z.array(platformSchema).min(1, "Select at least one platform"),
  scheduledFor: z.string().datetime(),
  mediaUrls: z.array(z.string().url()).default([]),
});

const deletePostSchema = z.object({
  postId: z.string().uuid(),
});

type ZernioPostResponse = {
  data?: {
    post?: {
      _id?: string;
    };
  };
  post?: {
    _id?: string;
  };
};

const requireAuth = createMiddleware<{
  Variables: { userId: string };
}>(async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ message: "Unauthorized" }, 401);
  c.set("userId", auth.userId);
  await next();
});

const app = new Hono()
  .use(
    "*",
    clerkMiddleware({
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    }),
  )

  .get("/", requireAuth, async (c) => {
    const userId = c.get("userId");

    const scheduledPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.scheduledFor), desc(posts.createdAt));

    return c.json({ success: true, data: scheduledPosts });
  })

  .post("/", requireAuth, zValidator("json", createPostSchema), async (c) => {
    const userId = c.get("userId");
    const { content, platforms, scheduledFor, mediaUrls } = c.req.valid("json");
    const scheduledDate = new Date(scheduledFor);

    if (scheduledDate.getTime() <= Date.now()) {
      return c.json(
        { success: false, message: "Schedule time must be in the future" },
        400,
      );
    }

    const accounts = await db
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.userId, userId),
          eq(connectedAccounts.isActive, true),
        ),
      );

    const selectedAccounts = platforms.map((platform) =>
      accounts.find((account) => account.platform === platform),
    );
    const missingPlatform = platforms.find(
      (_platform, index) => !selectedAccounts[index],
    );

    if (missingPlatform) {
      return c.json(
        {
          success: false,
          message: `Connect ${missingPlatform} before scheduling to it`,
        },
        400,
      );
    }

    const [createdPost] = await db
      .insert(posts)
      .values({
        userId,
        content,
        platforms,
        mediaUrls,
        scheduledFor: scheduledDate,
        status: "scheduled",
      })
      .returning();

    try {
      const zernioPost = (await zernio.posts.createPost({
        body: {
          content,
          mediaItems: mediaUrls.map((url) => ({ url })),
          platforms: selectedAccounts.map((account) => ({
            platform: account!.platform,
            accountId: account!.zernioAccountId,
          })),
          scheduledFor: scheduledDate.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })) as ZernioPostResponse;

      const zernioPostId = zernioPost.data?.post?._id ?? zernioPost.post?._id;

      if (zernioPostId) {
        const [updatedPost] = await db
          .update(posts)
          .set({ zernioPostId, failureReason: null })
          .where(eq(posts.id, createdPost.id))
          .returning();

        return c.json({ success: true, data: updatedPost }, 201);
      }

      return c.json({ success: true, data: createdPost }, 201);
    } catch (err) {
      const failureReason =
        err instanceof ZernioApiError
          ? err.message
          : "Zernio could not schedule this post";

      const [failedPost] = await db
        .update(posts)
        .set({ status: "failed", failureReason })
        .where(eq(posts.id, createdPost.id))
        .returning();

      console.error("Zernio schedule post failed:", err);

      return c.json(
        {
          success: false,
          message: "Post was saved, but Zernio could not schedule it",
          data: failedPost,
        },
        502,
      );
    }
  })

  .post(
    "/delete",
    requireAuth,
    zValidator("json", deletePostSchema),
    async (c) => {
      const userId = c.get("userId");
      const { postId } = c.req.valid("json");

      const [deletedPost] = await db
        .update(posts)
        .set({ status: "failed", failureReason: "Canceled by user" })
        .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
        .returning();

      if (!deletedPost) {
        return c.json({ success: false, message: "Post not found" }, 404);
      }

      return c.json({ success: true, data: deletedPost });
    },
  );

export default app;
