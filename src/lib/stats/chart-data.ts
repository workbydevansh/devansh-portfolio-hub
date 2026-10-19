import type { Json } from "@/lib/supabase/types";

// The compact, chart-ready history each stats sync stores in raw_json.

export type RatingPoint = { date: string; rating: number; contest: string };
export type DailyCount = { date: string; count: number };
export type LabeledCount = { label: string; count: number };

export type CodeforcesChartData = {
  ratingHistory: RatingPoint[];
  dailySubmissions: DailyCount[];
  solvedByRating: LabeledCount[];
  topTags: LabeledCount[];
};

export type LeetCodeChartData = {
  contestHistory: RatingPoint[];
  questionTotals: { easy: number; medium: number; hard: number } | null;
  topTags: LabeledCount[];
};

export function topCounts(values: string[], limit: number): LabeledCount[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

type JsonObject = { [key: string]: Json | undefined };

const isObject = (value: Json | undefined): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// raw_json is written by our own sync, but it is still read defensively so an
// older or malformed row renders as "no data" instead of breaking the page.
function readList<T>(
  raw: Json | null,
  key: string,
  parse: (item: JsonObject) => T | null,
): T[] {
  const value = isObject(raw ?? undefined) ? (raw as JsonObject)[key] : undefined;

  return Array.isArray(value)
    ? value.flatMap((item) => {
        const parsed = isObject(item) ? parse(item) : null;
        return parsed ? [parsed] : [];
      })
    : [];
}

const ratingPoint = (item: JsonObject): RatingPoint | null =>
  typeof item.date === "string" && typeof item.rating === "number"
    ? {
        date: item.date,
        rating: item.rating,
        contest: typeof item.contest === "string" ? item.contest : "",
      }
    : null;

const dailyCount = (item: JsonObject): DailyCount | null =>
  typeof item.date === "string" && typeof item.count === "number"
    ? { date: item.date, count: item.count }
    : null;

const labeledCount = (item: JsonObject): LabeledCount | null =>
  typeof item.label === "string" && typeof item.count === "number"
    ? { label: item.label, count: item.count }
    : null;

export function readCodeforcesChartData(raw: Json | null): CodeforcesChartData {
  return {
    ratingHistory: readList(raw, "ratingHistory", ratingPoint),
    dailySubmissions: readList(raw, "dailySubmissions", dailyCount),
    solvedByRating: readList(raw, "solvedByRating", labeledCount),
    topTags: readList(raw, "topTags", labeledCount),
  };
}

export function readLeetCodeChartData(raw: Json | null): LeetCodeChartData {
  const totals = isObject(raw ?? undefined)
    ? (raw as JsonObject).questionTotals
    : undefined;

  return {
    contestHistory: readList(raw, "contestHistory", ratingPoint),
    questionTotals:
      isObject(totals) &&
      typeof totals.easy === "number" &&
      typeof totals.medium === "number" &&
      typeof totals.hard === "number"
        ? { easy: totals.easy, medium: totals.medium, hard: totals.hard }
        : null,
    topTags: readList(raw, "topTags", labeledCount),
  };
}
