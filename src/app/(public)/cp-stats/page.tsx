import { Activity, Code2, ListChecks, Trophy } from "lucide-react";
import { AnimatedPage } from "@/components/shared/AnimatedPage";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ActivityHeatmap } from "@/components/stats/ActivityHeatmap";
import { ChartCard } from "@/components/stats/ChartCard";
import { CountBarChart } from "@/components/stats/CountBarChart";
import { DifficultyRings } from "@/components/stats/DifficultyRings";
import { RatingHistoryChart } from "@/components/stats/RatingHistoryChart";
import { StatsCard } from "@/components/stats/StatsCard";
import { StatsLastUpdated } from "@/components/stats/StatsLastUpdated";
import {
  type RatingPoint,
  readCodeforcesChartData,
  readLeetCodeChartData,
} from "@/lib/stats/chart-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  type CodingStats,
  codingStatsSummaryColumns,
} from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getCodingStats(): Promise<CodingStats[]> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return [];
  }

  // raw_json now holds only compact, chart-ready history (a few KB).
  const { data } = await createServerSupabaseClient()
    .from("coding_stats")
    .select(`${codingStatsSummaryColumns}, raw_json`)
    .order("platform", { ascending: true });

  return (data ?? []) as CodingStats[];
}

function findPlatformStats(
  stats: CodingStats[],
  platform: "codeforces" | "leetcode",
) {
  return stats.find(
    (item) => item.platform.trim().toLowerCase().replace(/\s+/g, "") === platform,
  );
}

const sum = (...values: (number | null | undefined)[]) =>
  values.some((value) => typeof value === "number")
    ? values.reduce<number>((total, value) => total + (value ?? 0), 0)
    : null;

const capitalize = (value: string | null | undefined) =>
  value ? value[0].toUpperCase() + value.slice(1) : undefined;

function ratingTable(points: RatingPoint[]) {
  return {
    columns: ["Contest", "Rating"] as [string, string],
    rows: points
      .map((point): [string, number] => [
        `${formatDate(point.date)} · ${point.contest}`,
        point.rating,
      ])
      .reverse(),
  };
}

export default async function CpStatsPage() {
  const stats = await getCodingStats();
  const codeforces = findPlatformStats(stats, "codeforces");
  const leetcode = findPlatformStats(stats, "leetcode");
  const cf = readCodeforcesChartData(codeforces?.raw_json ?? null);
  const lc = readLeetCodeChartData(leetcode?.raw_json ?? null);
  const yearSubmissions = cf.dailySubmissions.reduce((total, day) => total + day.count, 0);

  return (
    <AnimatedPage>
      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Competitive Programming"
          title="CP Stats Dashboard"
          description="Codeforces and LeetCode progress, synced daily from both platforms."
        />

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Codeforces rating"
            value={codeforces?.rating}
            detail={
              codeforces
                ? `Peak ${codeforces.max_rating?.toLocaleString("en") ?? "—"} · ${capitalize(codeforces.rank) ?? "Unrated"}`
                : undefined
            }
            icon={<Code2 size={18} />}
          />
          <StatsCard
            label="LeetCode contest rating"
            value={leetcode?.rating}
            detail={
              leetcode?.global_ranking
                ? `Global rank ${leetcode.global_ranking.toLocaleString("en")}`
                : undefined
            }
            icon={<Trophy size={18} />}
          />
          <StatsCard
            label="Problems solved"
            value={sum(codeforces?.solved_count, leetcode?.solved_count)}
            detail={`${codeforces?.solved_count?.toLocaleString("en") ?? 0} Codeforces · ${leetcode?.solved_count?.toLocaleString("en") ?? 0} LeetCode`}
            icon={<ListChecks size={18} />}
          />
          <StatsCard
            label="Rated contests"
            value={sum(codeforces?.contest_count, lc.contestHistory.length || null)}
            detail={`${codeforces?.contest_count ?? 0} Codeforces · ${lc.contestHistory.length} LeetCode`}
            icon={<Activity size={18} />}
          />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Codeforces rating"
            description={`${cf.ratingHistory.length} rated contests · now ${codeforces?.rating?.toLocaleString("en") ?? "—"}, peak ${codeforces?.max_rating?.toLocaleString("en") ?? "—"}`}
            table={ratingTable(cf.ratingHistory)}
          >
            <RatingHistoryChart points={cf.ratingHistory} />
          </ChartCard>
          <ChartCard
            title="LeetCode contest rating"
            description={`${lc.contestHistory.length} contests · now ${leetcode?.rating?.toLocaleString("en") ?? "—"}`}
            table={ratingTable(lc.contestHistory)}
          >
            <RatingHistoryChart points={lc.contestHistory} />
          </ChartCard>
        </section>

        <ChartCard
          className="mt-4"
          title="Codeforces activity"
          description={`${yearSubmissions.toLocaleString("en")} submissions on ${cf.dailySubmissions.length} active days in the last year`}
          table={{
            columns: ["Day", "Submissions"],
            rows: [...cf.dailySubmissions]
              .reverse()
              .map((day): [string, number] => [formatDate(day.date), day.count]),
          }}
        >
          <ActivityHeatmap days={cf.dailySubmissions} />
        </ChartCard>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="LeetCode problems by difficulty"
            description="Solved out of every problem on LeetCode"
            table={{
              columns: ["Difficulty", "Solved / total"],
              rows: lc.questionTotals
                ? [
                    ["Easy", `${leetcode?.easy_solved ?? 0} / ${lc.questionTotals.easy}`],
                    ["Medium", `${leetcode?.medium_solved ?? 0} / ${lc.questionTotals.medium}`],
                    ["Hard", `${leetcode?.hard_solved ?? 0} / ${lc.questionTotals.hard}`],
                  ]
                : [],
            }}
          >
            <DifficultyRings
              solved={{
                easy: leetcode?.easy_solved ?? null,
                medium: leetcode?.medium_solved ?? null,
                hard: leetcode?.hard_solved ?? null,
              }}
              totals={lc.questionTotals}
            />
          </ChartCard>
          <ChartCard
            title="Codeforces problems by rating"
            description="Solved problems at each difficulty rating"
            table={{
              columns: ["Problem rating", "Solved"],
              rows: cf.solvedByRating.map((item): [string, number] => [item.label, item.count]),
            }}
          >
            <CountBarChart data={cf.solvedByRating} valueLabel="Solved" />
          </ChartCard>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="LeetCode top topics"
            description="Problems solved per topic"
            table={{
              columns: ["Topic", "Solved"],
              rows: lc.topTags.map((item): [string, number] => [item.label, item.count]),
            }}
          >
            <CountBarChart data={lc.topTags} valueLabel="Solved" orientation="horizontal" />
          </ChartCard>
          <ChartCard
            title="Codeforces top tags"
            description="Solved problems per tag (a problem can have several)"
            table={{
              columns: ["Tag", "Solved"],
              rows: cf.topTags.map((item): [string, number] => [item.label, item.count]),
            }}
          >
            <CountBarChart data={cf.topTags} valueLabel="Solved" orientation="horizontal" />
          </ChartCard>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-400">
          <span>
            Codeforces{" "}
            <a
              href={`https://codeforces.com/profile/${codeforces?.username ?? ""}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              {codeforces?.username ?? "—"}
            </a>
          </span>
          <span>
            LeetCode{" "}
            <a
              href={`https://leetcode.com/u/${leetcode?.username ?? ""}/`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              {leetcode?.username ?? "—"}
            </a>
          </span>
          <StatsLastUpdated value={codeforces?.last_updated ?? leetcode?.last_updated} />
        </div>
      </main>
    </AnimatedPage>
  );
}
