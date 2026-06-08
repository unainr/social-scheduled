"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// ─── icons (react-icons/fi) ───────────────────
import {
  FiLinkedin,
  FiInstagram,
  FiArrowLeft,
  FiArrowRight,
  FiZap,
  FiCheck,
  FiX,
  FiLoader,
} from "react-icons/fi";
import { useConnectAccount } from "../../hooks/use-connect-account";
import { useConnectedAccounts } from "../../hooks/use-get-account";
import { useDisconnectAccount } from "../../hooks/use-disconnect-account";

// ─────────────────────────────────────────────
// PLATFORM CONFIG
// ─────────────────────────────────────────────

const PLATFORMS = [
  {
    id: "linkedin" as const,
    label: "LinkedIn",
    description: "Share professional content, articles and grow your network",
    icon: FiLinkedin,
    color: "#0A66C2",
    glow: "rgba(10,102,194,0.15)",
    border: "rgba(10,102,194,0.25)",
    tag: "Professional",
  },
  {
    id: "instagram" as const,
    label: "Instagram",
    description: "Post images, reels and stories to your Instagram feed",
    icon: FiInstagram,
    color: "#E1306C",
    glow: "rgba(225,48,108,0.15)",
    border: "rgba(225,48,108,0.25)",
    tag: "Visual",
  },
];

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function AccountsConnected() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: accounts = [], isLoading } = useConnectedAccounts();
  const {
    mutate: connect,
    isPending: isConnecting,
    variables: connectingVar,
  } = useConnectAccount();
  const {
    mutate: disconnect,
    isPending: isDisconnecting,
    variables: disconnectingVar,
  } = useDisconnectAccount();

  // handle Zernio OAuth callback result
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "connected") {
      toast.success("Account connected successfully");
      router.replace("/dashboard/accounts");
    } else if (error === "connect_failed") {
      toast.error("Connection failed. Please try again.");
      router.replace("/dashboard/accounts");
    }
  }, [searchParams, router]);

  const getAccount = (platform: "linkedin" | "instagram") =>
    accounts.find((a) => a.platform === platform);

  const connectedCount = accounts.length;

  return (
    <>
      <div
        className="min-h-screen text-white"
        style={{
          background: "#080808",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── NOISE OVERLAY ── */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* ── HEADER ── */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(8,8,8,0.85)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(200,241,53,0.1)",
                border: "1px solid rgba(200,241,53,0.2)",
              }}
            >
              <FiZap size={13} color="#c8f135" />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Postly
            </span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 transition-colors"
            style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}
          >
            <FiArrowLeft size={12} />
            Dashboard
          </Link>
        </header>

        {/* ── MAIN ── */}
        <main className="max-w-xl mx-auto px-6 py-14 space-y-10">
          {/* heading block */}
          <div className="space-y-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.08em",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    connectedCount > 0 ? "#c8f135" : "rgba(255,255,255,0.2)",
                }}
              />
              {isLoading ? "Loading..." : `${connectedCount} of 2 connected`}
            </div>

            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Connect Accounts
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.38)",
                lineHeight: 1.6,
              }}
            >
              Link your social accounts to start publishing. Free plan includes
              2 accounts.
            </p>
          </div>

          {/* platform cards */}
          <div className="space-y-3">
            {PLATFORMS.map((platform) => {
              const connected = getAccount(platform.id);
              const Icon = platform.icon;
              const isThisConnecting =
                isConnecting && connectingVar?.platform === platform.id;
              const isThisDisconnecting =
                isDisconnecting &&
                disconnectingVar?.accountId === connected?.id;

              return (
                <div
                  key={platform.id}
                  className="relative rounded-2xl p-5 transition-all duration-300"
                  style={{
                    border: connected
                      ? `1px solid ${platform.border}`
                      : "1px solid rgba(255,255,255,0.06)",
                    background: connected
                      ? platform.glow
                      : "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* connected glow */}
                  {connected && (
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        boxShadow: `inset 0 0 40px ${platform.glow}`,
                      }}
                    />
                  )}

                  <div className="flex items-center gap-4">
                    {/* icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: connected
                          ? `${platform.color}20`
                          : "rgba(255,255,255,0.04)",
                        border: connected
                          ? `1px solid ${platform.border}`
                          : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <Icon
                        size={19}
                        color={
                          connected ? platform.color : "rgba(255,255,255,0.25)"
                        }
                      />
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {platform.label}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-md"
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: "0.06em",
                            background: "rgba(255,255,255,0.05)",
                            color: "rgba(255,255,255,0.25)",
                          }}
                        >
                          {platform.tag}
                        </span>
                      </div>

                      {connected ? (
                        <p
                          className="mt-0.5 truncate"
                          style={{ fontSize: 12, color: platform.color }}
                        >
                          @{connected.username ?? "connected"}
                        </p>
                      ) : (
                        <p
                          className="mt-0.5"
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.28)",
                          }}
                        >
                          {platform.description}
                        </p>
                      )}
                    </div>

                    {/* action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {connected ? (
                        <>
                          {/* connected badge */}
                          <div
                            className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{
                              background: `${platform.color}15`,
                              border: `1px solid ${platform.color}30`,
                            }}
                          >
                            <FiCheck size={10} color={platform.color} />
                            <span
                              style={{
                                fontSize: 11,
                                color: platform.color,
                                fontWeight: 500,
                              }}
                            >
                              Connected
                            </span>
                          </div>

                          {/* disconnect */}
                          <button
                            onClick={() =>
                              disconnect({ accountId: connected.id })
                            }
                            disabled={isThisDisconnecting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.3)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              background: "transparent",
                              cursor: isThisDisconnecting
                                ? "not-allowed"
                                : "pointer",
                              opacity: isThisDisconnecting ? 0.5 : 1,
                            }}
                          >
                            {isThisDisconnecting ? (
                              <FiLoader size={11} className="animate-spin" />
                            ) : (
                              <FiX size={11} />
                            )}
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => connect({ platform: platform.id })}
                          disabled={isThisConnecting || isLoading}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all"
                          style={{
                            fontSize: 13,
                            background: platform.color,
                            color: "#fff",
                            border: "none",
                            cursor:
                              isThisConnecting || isLoading
                                ? "not-allowed"
                                : "pointer",
                            opacity: isThisConnecting || isLoading ? 0.6 : 1,
                          }}
                        >
                          {isThisConnecting && (
                            <FiLoader size={12} className="animate-spin" />
                          )}
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* info note */}
          <div
            className="flex gap-3 p-4 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: "rgba(200,241,53,0.1)",
                border: "1px solid rgba(200,241,53,0.2)",
              }}
            >
              <span style={{ fontSize: 9, color: "#c8f135", fontWeight: 700 }}>
                i
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
                lineHeight: 1.6,
              }}
            >
              Connecting redirects you to each platform to authorize access. We
              never store your password — only a secure token from the platform.
            </p>
          </div>

          {/* CTA — only show when at least one account is connected */}
          {connectedCount > 0 && (
            <div
              className="flex items-center justify-between p-5 rounded-2xl"
              style={{
                background: "rgba(200,241,53,0.04)",
                border: "1px solid rgba(200,241,53,0.15)",
              }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>Ready to post</p>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 2,
                  }}
                >
                  {connectedCount === 2
                    ? "Both accounts connected"
                    : "1 account connected — add one more to post to both"}
                </p>
              </div>
              <Link
                href="/dashboard/schedule"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all"
                style={{
                  fontSize: 13,
                  background: "#c8f135",
                  color: "#080808",
                }}
              >
                Schedule
                <FiArrowRight size={13} />
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
