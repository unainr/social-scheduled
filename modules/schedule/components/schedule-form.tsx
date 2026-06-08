"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { FiClock, FiImage, FiSend } from "react-icons/fi";
import type { ConnectedAccount } from "@/drizzle/schema";
import type { ScheduleFormValues, SchedulePlatform } from "../types";

const PLATFORMS: Array<{ id: SchedulePlatform; label: string }> = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
];

type ScheduleFormProps = {
  accounts: ConnectedAccount[];
  isSubmitting: boolean;
  onSubmit: (values: ScheduleFormValues) => void;
};

export const ScheduleForm = ({
  accounts,
  isSubmitting,
  onSubmit,
}: ScheduleFormProps) => {
  const [content, setContent] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [platforms, setPlatforms] = useState<SchedulePlatform[]>([]);
  const [mediaUrlsText, setMediaUrlsText] = useState("");

  const connectedPlatforms = useMemo(
    () => new Set(accounts.map((account) => account.platform)),
    [accounts],
  );

  const togglePlatform = (platform: SchedulePlatform) => {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((value) => value !== platform)
        : [...current, platform],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const mediaUrls = mediaUrlsText
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    onSubmit({
      content,
      platforms,
      scheduledFor: new Date(scheduledFor).toISOString(),
      mediaUrls,
    });

    setContent("");
    setScheduledFor("");
    setPlatforms([]);
    setMediaUrlsText("");
  };

  const canSubmit =
    content.trim().length > 0 &&
    scheduledFor.length > 0 &&
    platforms.length > 0 &&
    !isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">
          Platforms
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((platform) => {
            const isConnected = connectedPlatforms.has(platform.id);
            const isSelected = platforms.includes(platform.id);

            return (
              <button
                key={platform.id}
                type="button"
                disabled={!isConnected}
                onClick={() => togglePlatform(platform.id)}
                className="h-11 rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35"
                style={{
                  borderColor: isSelected
                    ? "rgba(200,241,53,0.75)"
                    : "rgba(255,255,255,0.1)",
                  background: isSelected
                    ? "rgba(200,241,53,0.12)"
                    : "rgba(255,255,255,0.03)",
                  color: isSelected ? "#c8f135" : "rgba(255,255,255,0.72)",
                }}
              >
                {platform.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="post-content"
          className="text-xs font-medium uppercase tracking-[0.12em] text-white/45"
        >
          Content
        </label>
        <textarea
          id="post-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={6}
          maxLength={2200}
          className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#c8f135]/70"
          placeholder="Write the post..."
        />
        <div className="text-right text-xs text-white/30">
          {content.length}/2200
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="scheduled-for"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-white/45"
        >
          <FiClock size={13} />
          Date and time
        </label>
        <input
          id="scheduled-for"
          type="datetime-local"
          value={scheduledFor}
          onChange={(event) => setScheduledFor(event.target.value)}
          className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition-colors focus:border-[#c8f135]/70"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="media-urls"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-white/45"
        >
          <FiImage size={13} />
          Media URLs
        </label>
        <textarea
          id="media-urls"
          value={mediaUrlsText}
          onChange={(event) => setMediaUrlsText(event.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#c8f135]/70"
          placeholder="One image or video URL per line"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c8f135] px-4 text-sm font-semibold text-black transition-colors hover:bg-[#d7ff4e] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FiSend size={15} />
        {isSubmitting ? "Scheduling..." : "Schedule post"}
      </button>
    </form>
  );
};
