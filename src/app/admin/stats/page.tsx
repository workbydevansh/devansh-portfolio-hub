"use client";

import { createClient } from "@supabase/supabase-js";
import { Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CodingStats } from "@/lib/supabase/types";

type SyncTarget = "codeforces" | "leetcode" | "both";

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function formatDate(date: string | null) {
  if (!date) {
    return "Not synced";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(date));
}

function platformLabel(platform: "codeforces" | "leetcode") {
  return platform === "codeforces" ? "Codeforces" : "LeetCode";
}

function findPlatformStats(
  stats: CodingStats[],
  platform: "codeforces" | "leetcode",
) {
  return stats.find(
    (item) =>
      item.platform.trim().toLowerCase().replace(/\s+/g, "") === platform,
  );
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<CodingStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingTarget, setSyncingTarget] = useState<SyncTarget | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadStats() {
    setError("");
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: loadError } = await supabase
        .from("coding_stats")
        .select("*")
        .order("platform", { ascending: true });

      if (loadError) {
        setError(loadError.message);
        return;
      }

      setStats((data ?? []) as CodingStats[]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load stats.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialStats() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: loadError } = await supabase
          .from("coding_stats")
          .select("*")
          .order("platform", { ascending: true });

        if (!isMounted) {
          return;
        }

        if (loadError) {
          setError(loadError.message);
          return;
        }

        setStats((data ?? []) as CodingStats[]);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load stats.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialStats();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSync(target: SyncTarget) {
    setMessage("");
    setError("");
    setSyncingTarget(target);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Admin session not found.");
        return;
      }

      const response = await fetch("/api/admin/stats/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        partial_success?: boolean;
        error?: string;
      };

      if (!response.ok && !result.partial_success) {
        setError(result.error ?? "Unable to sync stats.");
        return;
      }

      setMessage(
        result.partial_success
          ? "Stats sync completed with partial success."
          : "Stats synced successfully.",
      );
      await loadStats();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sync stats.",
      );
    } finally {
      setSyncingTarget(null);
    }
  }

  const codeforcesStats = findPlatformStats(stats, "codeforces");
  const leetCodeStats = findPlatformStats(stats, "leetcode");

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">Admin Stats</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          Coding Stats Sync
        </h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <SyncButton
          label="Sync Codeforces"
          target="codeforces"
          syncingTarget={syncingTarget}
          onSync={handleSync}
        />
        <SyncButton
          label="Sync LeetCode"
          target="leetcode"
          syncingTarget={syncingTarget}
          onSync={handleSync}
        />
        <SyncButton
          label="Sync Both"
          target="both"
          syncingTarget={syncingTarget}
          onSync={handleSync}
        />
      </div>

      {message ? (
        <p className="mb-5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mb-5 rounded-md border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-slate-300">Loading stats...</p>
        </GlassCard>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <StatsRow platform="codeforces" stats={codeforcesStats} />
          <StatsRow platform="leetcode" stats={leetCodeStats} />
        </div>
      )}
    </main>
  );
}

function SyncButton({
  label,
  target,
  syncingTarget,
  onSync,
}: {
  label: string;
  target: SyncTarget;
  syncingTarget: SyncTarget | null;
  onSync: (target: SyncTarget) => Promise<void>;
}) {
  const isSyncing = syncingTarget === target;

  return (
    <button
      type="button"
      disabled={Boolean(syncingTarget)}
      onClick={() => void onSync(target)}
      className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <RefreshCw className={isSyncing ? "animate-spin" : ""} size={16} />
      {isSyncing ? "Syncing..." : label}
    </button>
  );
}

function StatsRow({
  platform,
  stats,
}: {
  platform: "codeforces" | "leetcode";
  stats?: CodingStats;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <Activity size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-white">
            {platformLabel(platform)}
          </h2>
        </div>
        <StatusBadge
          label={stats ? "Synced" : "Not synced"}
          variant={stats ? "success" : "neutral"}
        />
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <StatItem label="Username" value={stats?.username ?? "Not synced"}/>
        <StatItem label="Solved Count" value={stats?.solved_count ?? null} />
        <StatItem label="Rating" value={stats?.rating ?? null} />
        <StatItem label="Last Updated" value={formatDate(stats?.last_updated ?? null)} />
      </dl>
    </GlassCard>
  );
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString("en") : value ?? "Not synced";

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className="mt-2 text-lg font-semibold text-white">{displayValue}</dd>
    </div>
  );
}
