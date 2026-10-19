"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Notice, primaryButtonClassName } from "@/components/admin/FormFields";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  codingStatsSummaryColumns,
  type CodingStatsSummary,
} from "@/lib/supabase/types";
import { useSupabaseQuery } from "@/lib/supabase/useSupabaseQuery";
import { formatDateTime, getErrorMessage } from "@/lib/utils";

type Platform = "codeforces" | "leetcode";
type SyncTarget = Platform | "both";

const platformLabels: Record<Platform, string> = {
  codeforces: "Codeforces",
  leetcode: "LeetCode",
};

function loadStats() {
  return getSupabaseBrowserClient()
    .from("coding_stats")
    .select(codingStatsSummaryColumns)
    .order("platform", { ascending: true });
}

export default function AdminStatsPage() {
  const [syncingTarget, setSyncingTarget] = useState<SyncTarget | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    data: stats,
    error: loadError,
    isLoading,
    reload,
  } = useSupabaseQuery(
    loadStats,
    [] as CodingStatsSummary[],
    "Unable to load stats.",
  );

  async function handleSync(target: SyncTarget) {
    setMessage("");
    setError("");
    setSyncingTarget(target);

    try {
      const {
        data: { session },
      } = await getSupabaseBrowserClient().auth.getSession();

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
        partial_success?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Unable to sync stats.");
        return;
      }

      setMessage(
        result.partial_success
          ? "Stats sync completed with partial success."
          : "Stats synced successfully.",
      );
      reload();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to sync stats."));
    } finally {
      setSyncingTarget(null);
    }
  }

  const findStats = (platform: Platform) =>
    stats.find(
      (item) =>
        item.platform.trim().toLowerCase().replace(/\s+/g, "") === platform,
    );

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">Admin Stats</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          Coding Stats Sync
        </h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {(
          [
            ["codeforces", "Sync Codeforces"],
            ["leetcode", "Sync LeetCode"],
            ["both", "Sync Both"],
          ] as const
        ).map(([target, label]) => (
          <button
            key={target}
            type="button"
            disabled={Boolean(syncingTarget)}
            onClick={() => void handleSync(target)}
            className={primaryButtonClassName}
          >
            <RefreshCw
              className={syncingTarget === target ? "animate-spin" : ""}
              size={16}
            />
            {syncingTarget === target ? "Syncing..." : label}
          </button>
        ))}
      </div>

      <Notice tone="success" message={message} className="mb-5" />
      <Notice tone="error" message={error || loadError} className="mb-5" />

      {isLoading ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-zinc-300">Loading stats...</p>
        </GlassCard>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <StatsRow platform="codeforces" stats={findStats("codeforces")} />
          <StatsRow platform="leetcode" stats={findStats("leetcode")} />
        </div>
      )}
    </main>
  );
}

function StatsRow({
  platform,
  stats,
}: {
  platform: Platform;
  stats?: CodingStatsSummary;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <Activity size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-white">
            {platformLabels[platform]}
          </h2>
        </div>
        <StatusBadge
          label={stats ? "Synced" : "Not synced"}
          variant={stats ? "success" : "neutral"}
        />
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <StatItem label="Username" value={stats?.username ?? null} />
        <StatItem label="Solved Count" value={stats?.solved_count ?? null} />
        <StatItem label="Rating" value={stats?.rating ?? null} />
        <StatItem
          label="Last Updated"
          value={formatDateTime(stats?.last_updated, "Not synced")}
        />
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
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd className="mt-2 text-lg font-semibold text-white">
        {typeof value === "number"
          ? value.toLocaleString("en")
          : (value ?? "Not synced")}
      </dd>
    </div>
  );
}
