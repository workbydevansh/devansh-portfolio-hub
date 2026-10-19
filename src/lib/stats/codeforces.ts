import "server-only";

import { type CodeforcesChartData, topCounts } from "@/lib/stats/chart-data";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type CodeforcesApiResponse<T> =
  | {
      status: "OK";
      result: T;
    }
  | {
      status: "FAILED";
      comment?: string;
    };

type CodeforcesUser = {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
};

type CodeforcesRatingChange = {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
};

type CodeforcesProblem = {
  contestId?: number;
  problemsetName?: string;
  index?: string;
  name?: string;
  type?: string;
  rating?: number;
  tags?: string[];
};

type CodeforcesSubmission = {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CodeforcesProblem;
  verdict?: string;
};

type SyncCodeforcesResult = {
  success: true;
  platform: "codeforces";
  username: string;
  solved_count: number;
  last_updated: string;
};

const CODEFORCES_API_BASE = "https://codeforces.com/api";

async function fetchCodeforces<T>(
  method: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${CODEFORCES_API_BASE}/${method}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "devansh-portfolio-hub",
    },
  });

  if (!response.ok) {
    throw new Error(`Codeforces request failed with status ${response.status}`);
  }

  const body = (await response.json()) as CodeforcesApiResponse<T>;

  if (body.status !== "OK") {
    throw new Error(body.comment ?? "Codeforces request failed");
  }

  return body.result;
}

function getProblemKey(problem: CodeforcesProblem) {
  return `${problem.contestId ?? "unknown"}:${problem.index ?? "unknown"}:${
    problem.name ?? "unknown"
  }`;
}

function getSolvedProblems(submissions: CodeforcesSubmission[]) {
  const solved = new Map<string, CodeforcesProblem>();

  for (const submission of submissions) {
    if (submission.verdict === "OK") {
      solved.set(getProblemKey(submission.problem), submission.problem);
    }
  }

  return [...solved.values()];
}

// Calendar days in India, where the activity happens, not UTC.
const indiaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

function buildChartData(
  ratingChanges: CodeforcesRatingChange[],
  submissions: CodeforcesSubmission[],
  solvedProblems: CodeforcesProblem[],
): CodeforcesChartData {
  const oneYearAgo = Date.now() / 1000 - 371 * 24 * 60 * 60;
  const dailySubmissions = topCounts(
    submissions
      .filter((submission) => submission.creationTimeSeconds >= oneYearAgo)
      .map((submission) =>
        indiaDate.format(submission.creationTimeSeconds * 1000),
      ),
    Infinity,
  );
  const solvedByRating = topCounts(
    solvedProblems.flatMap((problem) =>
      problem.rating ? [String(problem.rating)] : [],
    ),
    Infinity,
  );

  return {
    ratingHistory: ratingChanges.map((change) => ({
      date: new Date(change.ratingUpdateTimeSeconds * 1000).toISOString(),
      rating: change.newRating,
      contest: change.contestName,
    })),
    dailySubmissions: dailySubmissions
      .map(({ label, count }) => ({ date: label, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    solvedByRating: solvedByRating.sort(
      (a, b) => Number(a.label) - Number(b.label),
    ),
    topTags: topCounts(
      solvedProblems.flatMap((problem) => problem.tags ?? []),
      8,
    ),
  };
}


export async function syncCodeforcesStats(): Promise<SyncCodeforcesResult> {
  const handle = process.env.CODEFORCES_HANDLE?.trim() || "boyzzz";

  const [users, ratingChanges, submissions] = await Promise.all([
    fetchCodeforces<CodeforcesUser[]>("user.info", { handles: handle }),
    fetchCodeforces<CodeforcesRatingChange[]>("user.rating", { handle }),
    fetchCodeforces<CodeforcesSubmission[]>("user.status", { handle }),
  ]);

  const user = users[0];

  if (!user) {
    throw new Error(`Codeforces user not found: ${handle}`);
  }

  const solvedProblems = getSolvedProblems(submissions);
  const solvedCount = solvedProblems.length;
  const lastUpdated = new Date().toISOString();
  const rawJson: Json = {
    synced_at: lastUpdated,
    ...buildChartData(ratingChanges, submissions, solvedProblems),
  };

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("coding_stats").upsert(
    {
      platform: "codeforces",
      username: user.handle,
      rating: user.rating ?? null,
      max_rating: user.maxRating ?? null,
      rank: user.rank ?? null,
      max_rank: user.maxRank ?? null,
      solved_count: solvedCount,
      contest_count: ratingChanges.length,
      last_updated: lastUpdated,
      raw_json: rawJson,
    },
    { onConflict: "platform" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    platform: "codeforces",
    username: user.handle,
    solved_count: solvedCount,
    last_updated: lastUpdated,
  };
}
