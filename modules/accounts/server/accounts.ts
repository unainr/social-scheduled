import { clerkMiddleware, getAuth } from "@clerk/hono";
import { zValidator } from "@hono/zod-validator";
import { ZernioApiError } from "@zernio/node";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { connectedAccounts } from "@/drizzle/schema";
import { zernio } from "@/lib/zernio";

type ZernioProfileResponse = {
  data?: {
    profile?: {
      _id?: string;
    };
  };
  profile?: {
    _id?: string;
  };
};

type ZernioProfilesResponse = {
  data?: {
    profiles?: Array<{
      _id?: string;
      name?: string;
    }>;
  };
  profiles?: Array<{
    _id?: string;
    name?: string;
  }>;
};

type ZernioConnectUrlResponse = {
  data?: {
    authUrl?: string;
  };
  authUrl?: string;
};

// ─────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────

const connectSchema = z.object({
  platform: z.enum(["linkedin", "instagram"]),
});

const disconnectSchema = z.object({
  accountId: z.string().uuid(),
});

const isSupportedPlatform = (
  platform: string,
): platform is "linkedin" | "instagram" =>
  platform === "linkedin" || platform === "instagram";

// ─────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────

const requireAuth = createMiddleware<{
  Variables: { userId: string };
}>(async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ message: "Unauthorized" }, 401);
  c.set("userId", auth.userId);
  await next();
});

// ─────────────────────────────────────────────
// HELPER — get or create Zernio profile
//
// Zernio requires a profileId for every connect URL.
// Each user gets one profile — created on first connect,
// reused for all subsequent platform connections.
// ─────────────────────────────────────────────

async function getOrCreateZernioProfile(userId: string): Promise<string> {
  const profileName = `user_${userId}`;

  const [existing] = await db
    .select({
      zernioProfileId: connectedAccounts.zernioProfileId,
    })
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId))
    .limit(1);

  if (existing?.zernioProfileId) {
    return existing.zernioProfileId;
  }

  try {
    const createData = (await zernio.profiles.createProfile({
      body: {
        name: profileName,
        description: "User profile",
      },
    })) as ZernioProfileResponse;

    const profileId = createData.data?.profile?._id ?? createData.profile?._id;
    if (!profileId) {
      throw new Error("Zernio profile creation did not return a profile ID");
    }

    return profileId;
  } catch (err) {
    try {
      const profilesData = (await zernio.profiles.listProfiles({
        query: { includeOverLimit: true },
      })) as ZernioProfilesResponse;
      const matchingProfile = (
        profilesData.data?.profiles ??
        profilesData.profiles ??
        []
      ).find((profile) => profile.name === profileName);

      if (matchingProfile?._id) {
        return matchingProfile._id;
      }
    } catch (listErr) {
      console.error("Zernio list profiles fallback failed:", listErr);
    }

    console.error("Zernio create profile failed:", err);
    throw err;
  }
}

// ─────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────

const app = new Hono()
  .use(
    "*",
    clerkMiddleware({
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    }),
  )

  // GET /accounts — fetch all active connected accounts
  .get("/", requireAuth, async (c) => {
    const userId = c.get("userId");

    const accounts = await db
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.userId, userId),
          eq(connectedAccounts.isActive, true),
        ),
      );

    return c.json({ success: true, data: accounts });
  })

  // POST /accounts/connect — generate Zernio OAuth URL
  //
  // 1. Get or create a Zernio profile for this user
  // 2. Embed profileId in redirectUrl so callback can read it
  // 3. Call getConnectUrl once — return authUrl to frontend
  // 4. Frontend does window.location.href = url
  .post(
    "/connect",
    requireAuth,
    zValidator("json", connectSchema),
    async (c) => {
      const userId = c.get("userId");
      const { platform } = c.req.valid("json");

      try {
        const profileId = await getOrCreateZernioProfile(userId);

        // embed profileId in callback URL so we can save it on return
        const redirectUrl = new URL(
          "/api/accounts/callback",
          process.env.NEXT_PUBLIC_APP_URL,
        );
        redirectUrl.searchParams.set("profileId", profileId);

        // authUrl — correct return key per Zernio docs
        const connectData = (await zernio.connect.getConnectUrl({
          path: { platform },
          query: {
            profileId,
            redirect_url: redirectUrl.toString(),
          },
        })) as ZernioConnectUrlResponse;

        const authUrl = connectData.data?.authUrl ?? connectData.authUrl;
        if (!authUrl) {
          return c.json(
            { success: false, message: "Zernio did not return a connect URL" },
            502,
          );
        }

        return c.json({ success: true, data: { url: authUrl } }, 201);
      } catch (err) {
        console.error("Zernio connect URL generation failed:", err);

        if (err instanceof ZernioApiError) {
          const status = err.isAuthError() ? 401 : 502;

          return c.json(
            {
              success: false,
              message: "Unable to start account connection",
              details: err.message,
            },
            status,
          );
        }

        return c.json(
          { success: false, message: "Unable to start account connection" },
          502,
        );
      }
    },
  )

  // GET /accounts/callback — Zernio redirects here after OAuth
  //
  // Zernio appends: accountId, platform, username, profileImage
  // We also get back our profileId from the redirectUrl we set above
  .get("/callback", requireAuth, async (c) => {
    const userId = c.get("userId");

    const {
      accountId,
      connected,
      platform,
      username,
      profileImage,
      profileId,
    } = c.req.query();
    const callbackPlatform = platform ?? connected;

    if (
      !accountId ||
      !callbackPlatform ||
      !profileId ||
      !isSupportedPlatform(callbackPlatform)
    ) {
      return c.redirect("/dashboard/accounts?error=connect_failed");
    }

    const [existing] = await db
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.userId, userId),
          eq(connectedAccounts.platform, callbackPlatform),
        ),
      );

    if (existing) {
      // re-connecting same platform — update record
      await db
        .update(connectedAccounts)
        .set({
          zernioProfileId: profileId,
          zernioAccountId: accountId,
          username: username ?? existing.username,
          profileImage: profileImage ?? existing.profileImage,
          isActive: true,
        })
        .where(eq(connectedAccounts.id, existing.id));
    } else {
      // first time connecting this platform
      await db.insert(connectedAccounts).values({
        userId,
        platform: callbackPlatform,
        zernioProfileId: profileId,
        zernioAccountId: accountId,
        username: username ?? null,
        profileImage: profileImage ?? null,
      });
    }

    return c.redirect("/dashboard/accounts?success=connected");
  })

  // POST /accounts/disconnect — soft delete (isActive = false)
  .post(
    "/disconnect",
    requireAuth,
    zValidator("json", disconnectSchema),
    async (c) => {
      const userId = c.get("userId");
      const { accountId } = c.req.valid("json");

      await db
        .update(connectedAccounts)
        .set({ isActive: false })
        .where(
          and(
            eq(connectedAccounts.id, accountId),
            eq(connectedAccounts.userId, userId),
          ),
        );

      return c.json({ success: true });
    },
  );

export default app;
