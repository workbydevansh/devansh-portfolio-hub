"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Braces,
  Code2,
  Hash,
  ListChecks,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CodingStats, Json } from "@/lib/supabase/types";
import { StatsCard } from "./StatsCard";
import { StatsLastUpdated } from "./StatsLastUpdated";

type PlatformStatsPanelProps = {
  platform: "Codeforces" | "LeetCode";
  stats?: CodingStats;
};

type JsonRecord = { [key: string]: Json | undefined };

type ChartPoint = {
  name: string;
  value: number;
};

function isRecord(value: Json | undefined): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getString(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function getNestedRecordValue(
  source: Json | null,
  path: string[],
  key: string,
) {
  let current: Json | undefined = source ?? undefined;

  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  if (!isRecord(current)) {
    return null;
  }

  return current[key];
}

function getLeetCodeContestRating(rawJson: Json | null) {
  const rootRating = isRecord(rawJson)
    ? getNumber(rawJson.contest_rating) ?? getNumber(rawJson.contestRating)
    : null;

  return (
    rootRating ??
    getNumber(getNestedRecordValue(rawJson, ["contest"], "rating")) ??
    getNumber(getNestedRecordValue(rawJson, ["contest"], "contestRating")) ??
    getNumber(getNestedRecordValue(rawJson, ["user_contest_ranking"], "rating")) ??
    getNumber(getNestedRecordValue(rawJson, ["userContestRanking"], "rating"))
  );
}

function getLeetCodeGlobalRanking(stats?: CodingStats) {
  if (!stats) {
    return null;
  }

  if (stats.global_ranking !== null) {
    return stats.global_ranking;
  }

  return isRecord(stats.raw_json)
    ? getNumber(stats.raw_json.global_ranking) ??
        getNumber(stats.raw_json.globalRanking) ??
        getNumber(getNestedRecordValue(stats.raw_json, ["profile"], "ranking"))
    : null;
}

function getChartSource(rawJson: Json | null) {
  if (!isRecord(rawJson)) {
    return null;
  }

  const possibleKeys = [
    "chart",
    "chartData",
    "rating_history",
    "ratingHistory",
    "contest_history",
    "contestHistory",
    "history",
  ];

  return possibleKeys
    .map((key) => rawJson[key])
    .find((value): value is Json[] => Array.isArray(value)) ?? null;
}

function getChartData(rawJson: Json | null): ChartPoint[] {
  const source = getChartSource(rawJson);

  if (!source) {
    return [];
  }

  return source
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const value =
        getNumber(item.value) ??
        getNumber(item.rating) ??
        getNumber(item.newRating) ??
        getNumber(item.solved) ??
        getNumber(item.solved_count);

      if (value === null) {
        return null;
      }

      const name =
        getString(item.name) ??
        getString(item.label) ??
        getString(item.date) ??
        getString(item.contestName) ??
        `#${index + 1}`;

      return { name, value };
    })
    .filter((item): item is ChartPoint => Boolean(item));
}

function panelIcon(platform: PlatformStatsPanelProps["platform"]) {
  return platform === "Codeforces" ? (
    <Code2 size={20} />
  ) : (
    <Braces size={20} />
  );
}

export function PlatformStatsPanel({ platform, stats }: PlatformStatsPanelProps) {
  const chartData = getChartData(stats?.raw_json ?? null);

  if (!stats) {
    return (
      <GlassCard className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              {panelIcon(platform)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{platform}</h2>
              <StatusBadge label="Not synced" variant="neutral" />
            </div>
          </div>
        </div>
        <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Stats have not been synced yet.
        </p>
        <div className="mt-5">
          <StatsLastUpdated />
        </div>
      </GlassCard>
    );
  }

  const leetCodeContestRating =
    platform === "LeetCode"
      ? stats.rating ?? getLeetCodeContestRating(stats.raw_json)
      : null;
  const leetCodeGlobalRanking =
    platform === "LeetCode" ? getLeetCodeGlobalRanking(stats) : null;

  return (
    <motion.section whileHover={{ scale: 1.005 }} transition={{ duration: 0.2 }}>
      <GlassCard className="h-full p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              {panelIcon(platform)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{platform}</h2>
              <StatusBadge label="Synced" variant="success" />
            </div>
          </div>
          <StatsLastUpdated value={stats.last_updated} />
        </div>

        {platform === "Codeforces" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard label="Username" value={stats.username} icon={<UserRound size={18} />} />
            <StatsCard label="Rating" value={stats.rating} icon={<Activity size={18} />} />
            <StatsCard label="Max Rating" value={stats.max_rating} icon={<Trophy size={18} />} />
            <StatsCard label="Rank" value={stats.rank} icon={<Hash size={18} />} />
            <StatsCard label="Max Rank" value={stats.max_rank} icon={<Hash size={18} />} />
            <StatsCard label="Solved" value={stats.solved_count} icon={<ListChecks size={18} />} />
            <StatsCard label="Contests" value={stats.contest_count} icon={<BarChart3 size={18} />} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard label="Username" value={stats.username} icon={<UserRound size={18} />} />
            <StatsCard label="Solved" value={stats.solved_count} icon={<ListChecks size={18} />} />
            <StatsCard label="Easy" value={stats.easy_solved} icon={<Activity size={18} />} />
            <StatsCard label="Medium" value={stats.medium_solved} icon={<Activity size={18} />} />
            <StatsCard label="Hard" value={stats.hard_solved} icon={<Activity size={18} />} />
            <StatsCard label="Contest Rating" value={leetCodeContestRating} icon={<Trophy size={18} />} />
            <StatsCard label="Global Ranking" value={leetCodeGlobalRanking} icon={<Hash size={18} />} />
          </div>
        )}

        {chartData.length ? (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-4 text-sm font-semibold text-white">
              Stored stats trend
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.94)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: 8,
                      color: "#f8fafc",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#67e8f9"
                    fill="rgba(103, 232, 249, 0.18)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </GlassCard>
    </motion.section>
  );
}
