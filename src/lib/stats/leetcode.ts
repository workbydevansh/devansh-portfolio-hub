import "server-only";

import type { LeetCodeChartData } from "@/lib/stats/chart-data";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type LeetCodeDifficulty = "All" | "Easy" | "Medium" | "Hard";

type LeetCodeSubmissionStat = {
  difficulty: LeetCodeDifficulty;
  count: number;
  submissions: number;
};

type LeetCodeProfile = {
  ranking?: number | null;
};

type LeetCodeTagCount = { tagName: string; problemsSolved: number };

type LeetCodeMatchedUser = {
  username: string;
  profile?: LeetCodeProfile | null;
  submitStats?: {
    acSubmissionNum?: LeetCodeSubmissionStat[];
  } | null;
  tagProblemCounts?: Record<string, LeetCodeTagCount[] | null> | null;
};

type LeetCodeContestHistoryEntry = {
  attended: boolean;
  rating: number;
  contest: { title: string; startTime: number };
};

type LeetCodeContestRanking = {
  rating?: number | null;
  globalRanking?: number | null;
  attendedContestsCount?: number | null;
};

type LeetCodeGraphQlResponse = {
  data?: {
    matchedUser?: LeetCodeMatchedUser | null;
    userContestRanking?: LeetCodeContestRanking | null;
    userContestRankingHistory?: LeetCodeContestHistoryEntry[] | null;
    allQuestionsCount?: { difficulty: string; count: number }[] | null;
  };
  errors?: Array<{
    message?: string;
  }>;
};

type SyncLeetCodeResult = {
  success: true;
  platform: "leetcode";
  username: string;
  solved_count: number;
  last_updated: string;
};

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const LEETCODE_STATS_QUERY = `
  query userStats($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      profile {
        ranking
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      tagProblemCounts {
        advanced { tagName problemsSolved }
        intermediate { tagName problemsSolved }
        fundamental { tagName problemsSolved }
      }
    }
    userContestRankingHistory(username: $username) {
      attended
      rating
      contest {
        title
        startTime
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
      attendedContestsCount
    }
  }
`;


function buildChartData(
  data: NonNullable<LeetCodeGraphQlResponse["data"]>,
  matchedUser: LeetCodeMatchedUser,
): LeetCodeChartData {
  const totals = new Map(
    (data.allQuestionsCount ?? []).map((item) => [item.difficulty, item.count]),
  );
  const easy = totals.get("Easy");
  const medium = totals.get("Medium");
  const hard = totals.get("Hard");

  return {
    contestHistory: (data.userContestRankingHistory ?? [])
      .filter((entry) => entry.attended)
      .map((entry) => ({
        date: new Date(entry.contest.startTime * 1000).toISOString(),
        rating: Math.round(entry.rating),
        contest: entry.contest.title,
      })),
    questionTotals:
      easy !== undefined && medium !== undefined && hard !== undefined
        ? { easy, medium, hard }
        : null,
    topTags: Object.values(matchedUser.tagProblemCounts ?? {})
      .flatMap((group) => group ?? [])
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 8)
      .map((tag) => ({ label: tag.tagName, count: tag.problemsSolved })),
  };
}

function getSolvedCount(
  stats: LeetCodeSubmissionStat[] | undefined,
  difficulty: LeetCodeDifficulty,
) {
  return stats?.find((item) => item.difficulty === difficulty)?.count ?? 0;
}

async function fetchLeetCodeStats(username: string) {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Referer: `https://leetcode.com/${username}/`,
      "User-Agent": "devansh-portfolio-hub",
    },
    body: JSON.stringify({
      query: LEETCODE_STATS_QUERY,
      variables: { username },
    }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode request failed with status ${response.status}`);
  }

  const body = (await response.json()) as LeetCodeGraphQlResponse;

  if (body.errors?.length) {
    const message =
      body.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join("; ") || "LeetCode GraphQL request failed";

    throw new Error(message);
  }

  if (!body.data?.matchedUser) {
    throw new Error(`LeetCode user not found: ${username}`);
  }

  return body;
}

export async function syncLeetCodeStats(): Promise<SyncLeetCodeResult> {
  const username = process.env.LEETCODE_USERNAME?.trim();

  if (!username) {
    throw new Error("LEETCODE_USERNAME is not configured");
  }

  const response = await fetchLeetCodeStats(username);
  const matchedUser = response.data?.matchedUser;

  if (!matchedUser) {
    throw new Error(`LeetCode user not found: ${username}`);
  }

  const acSubmissionNum = matchedUser.submitStats?.acSubmissionNum ?? [];
  const solvedCount = getSolvedCount(acSubmissionNum, "All");
  const easySolved = getSolvedCount(acSubmissionNum, "Easy");
  const mediumSolved = getSolvedCount(acSubmissionNum, "Medium");
  const hardSolved = getSolvedCount(acSubmissionNum, "Hard");
  const contestRatingValue = response.data?.userContestRanking?.rating ?? null;
  const contestRating =
    typeof contestRatingValue === "number"
      ? Math.round(contestRatingValue)
      : null;
  const globalRanking =
    response.data?.userContestRanking?.globalRanking ??
    matchedUser.profile?.ranking ??
    null;
  const lastUpdated = new Date().toISOString();
  const rawJson: Json = {
    synced_at: lastUpdated,
    ...(response.data ? buildChartData(response.data, matchedUser) : {}),
  };

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("coding_stats").upsert(
    {
      platform: "leetcode",
      username: matchedUser.username,
      rating: contestRating,
      solved_count: solvedCount,
      easy_solved: easySolved,
      medium_solved: mediumSolved,
      hard_solved: hardSolved,
      global_ranking: globalRanking,
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
    platform: "leetcode",
    username: matchedUser.username,
    solved_count: solvedCount,
    last_updated: lastUpdated,
  };
}
