"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiTrash2,
} from "react-icons/fi";
import { useConnectedAccounts } from "@/modules/accounts/hooks/use-get-account";
import { ScheduleCalendar } from "../components/schedule-calendar";
import { ScheduleForm } from "../components/schedule-form";
import { useCancelScheduledPost } from "../hooks/use-cancel-scheduled-post";
import { useCreateScheduledPost } from "../hooks/use-create-scheduled-post";
import { useScheduledPosts } from "../hooks/use-get-scheduled-posts";
import type { ScheduledPost, ScheduleFormValues } from "../types";

const formatScheduleDate = (date: Date | string | null) => {
  if (!date) return "No date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

export const ScheduleView = () => {
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const { data: accounts = [], isLoading: isLoadingAccounts } =
    useConnectedAccounts();
  const { data: posts = [], isLoading: isLoadingPosts } = useScheduledPosts();
  const createPost = useCreateScheduledPost();
  const cancelPost = useCancelScheduledPost();

  const activePosts = useMemo(
    () => posts.filter((post) => post.status !== "failed"),
    [posts],
  );
  const failedPosts = posts.length - activePosts.length;

  const handleCreatePost = (values: ScheduleFormValues) => {
    createPost.mutate(values);
  };

  const handleCancelPost = () => {
    if (!selectedPost) return;

    cancelPost.mutate(
      { postId: selectedPost.id },
      {
        onSuccess: () => setSelectedPost(null),
      },
    );
  };

  const isLoading = isLoadingAccounts || isLoadingPosts;

  return (
    <div className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-7">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Link
              href="/dashboard/accounts"
              className="inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white"
            >
              <FiArrowLeft size={15} />
              Accounts
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Schedule Posts
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">
                Create scheduled posts for connected accounts and review the
                publishing calendar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="text-xs text-white/35">Accounts</p>
              <p className="mt-1 text-xl font-bold">{accounts.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="text-xs text-white/35">Scheduled</p>
              <p className="mt-1 text-xl font-bold">{activePosts.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="text-xs text-white/35">Needs review</p>
              <p className="mt-1 text-xl font-bold">{failedPosts}</p>
            </div>
          </div>
        </header>

        {accounts.length === 0 && !isLoadingAccounts && (
          <div className="flex items-start gap-3 rounded-lg border border-[#c8f135]/20 bg-[#c8f135]/8 p-4 text-sm text-white/75">
            <FiAlertCircle className="mt-0.5 shrink-0 text-[#c8f135]" />
            <div>
              <p className="font-semibold text-white">Connect an account</p>
              <p className="mt-1 text-white/45">
                Scheduling unlocks after at least one LinkedIn or Instagram
                account is connected.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c8f135]/10 text-[#c8f135]">
                  <FiCalendar size={16} />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Create post</h2>
                  <p className="text-xs text-white/35">Queue future content</p>
                </div>
              </div>
              <ScheduleForm
                accounts={accounts}
                isSubmitting={createPost.isPending}
                onSubmit={handleCreatePost}
              />
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-base font-semibold">Selected post</h2>
              {selectedPost ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-white/35">
                      Platforms
                    </p>
                    <p className="mt-1 text-sm capitalize text-white/78">
                      {selectedPost.platforms.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-white/35">
                      Scheduled
                    </p>
                    <p className="mt-1 text-sm text-white/78">
                      {formatScheduleDate(selectedPost.scheduledFor)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-white/35">
                      Content
                    </p>
                    <p className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/25 p-3 text-sm leading-6 text-white/72">
                      {selectedPost.content}
                    </p>
                  </div>
                  {selectedPost.failureReason && (
                    <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                      {selectedPost.failureReason}
                    </div>
                  )}
                  {selectedPost.status !== "failed" && (
                    <button
                      type="button"
                      onClick={handleCancelPost}
                      disabled={cancelPost.isPending}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 text-sm font-semibold text-red-100 transition-colors hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiTrash2 size={15} />
                      {cancelPost.isPending ? "Canceling..." : "Cancel post"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-white/40">
                  Select an item on the calendar to inspect its content,
                  platform, status, and schedule time.
                </p>
              )}
            </section>
          </aside>

          <main className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Calendar</h2>
                <p className="mt-1 text-xs text-white/35">
                  Month, week, day, and agenda views
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45">
                <FiCheckCircle className="text-[#c8f135]" />
                {isLoading ? "Loading schedule" : `${posts.length} total posts`}
              </div>
            </div>
            <ScheduleCalendar posts={posts} onSelectPost={setSelectedPost} />
          </main>
        </div>
      </div>
    </div>
  );
};
