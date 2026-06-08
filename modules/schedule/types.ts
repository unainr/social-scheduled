import type { Post } from "@/drizzle/schema";

export type SchedulePlatform = "linkedin" | "instagram";

export type ScheduledPost = Omit<
  Post,
  "connectedAt" | "createdAt" | "publishedAt" | "scheduledFor" | "updatedAt"
> & {
  createdAt: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  updatedAt: string;
};

export type ScheduleFormValues = {
  content: string;
  platforms: SchedulePlatform[];
  scheduledFor: string;
  mediaUrls: string[];
};
