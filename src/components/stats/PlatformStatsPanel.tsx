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
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CodingStatsSummary } from "@/lib/supabase/types";
import { StatsCard } from "./StatsCard";
import { StatsLastUpdated } from "./StatsLastUpdated";

type PlatformStatsPanelProps = {
  platform: "Codeforces" | "LeetCode";
  stats?: CodingStatsSummary;
};

function getStatCards(
  platform: PlatformStatsPanelProps["platform"],
  stats: CodingStatsSummary,
) {
  const username = { label: "Username", value: stats.username, icon: UserRound };

  return platform === "Codeforces"
    ? [
        username,
        { label: "Rating", value: stats.rating, icon: Activity },
        { label: "Max Rating", value: stats.max_rating, icon: Trophy },
        { label: "Rank", value: stats.rank, icon: Hash },
        { label: "Max Rank", value: stats.max_rank, icon: Hash },
        { label: "Solved", value: stats.solved_count, icon: ListChecks },
        { label: "Contests", value: stats.contest_count, icon: BarChart3 },
      ]
    : [
        username,
        { label: "Solved", value: stats.solved_count, icon: ListChecks },
        { label: "Easy", value: stats.easy_solved, icon: Activity },
        { label: "Medium", value: stats.medium_solved, icon: Activity },
        { label: "Hard", value: stats.hard_solved, icon: Activity },
        { label: "Contest Rating", value: stats.rating, icon: Trophy },
        { label: "Global Ranking", value: stats.global_ranking, icon: Hash },
      ];
}

// Rendered on the server: no client-side JavaScript for the stats page.
export function PlatformStatsPanel({ platform, stats }: PlatformStatsPanelProps) {
  const PlatformIcon = platform === "Codeforces" ? Code2 : Braces;

  return (
    <section>
      <GlassCard className="h-full p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              <PlatformIcon size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{platform}</h2>
              <StatusBadge
                label={stats ? "Synced" : "Not synced"}
                variant={stats ? "success" : "neutral"}
              />
            </div>
          </div>
          {stats ? <StatsLastUpdated value={stats.last_updated} /> : null}
        </div>

        {stats ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {getStatCards(platform, stats).map(({ label, value, icon: Icon }) => (
              <StatsCard
                key={label}
                label={label}
                value={value}
                icon={<Icon size={18} />}
              />
            ))}
          </div>
        ) : (
          <>
            <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              Stats have not been synced yet.
            </p>
            <div className="mt-5">
              <StatsLastUpdated />
            </div>
          </>
        )}
      </GlassCard>
    </section>
  );
}
