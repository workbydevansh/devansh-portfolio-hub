import "server-only";

import { createClient } from "@supabase/supabase-js";
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

type LeetCodeMatchedUser = {
  username: string;
  profile?: LeetCodeProfile | null;
  submitStats?: {
    acSubmissionNum?: LeetCodeSubmissionStat[];
  } | null;
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
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
      attendedContestsCount
    }
  }
`;

function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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
  const username = process.env.LEETCODE_USERNAME;

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
  const contestRating = response.data?.userContestRanking?.rating ?? null;
  const globalRanking =
    response.data?.userContestRanking?.globalRanking ??
    matchedUser.profile?.ranking ??
    null;
  const lastUpdated = new Date().toISOString();
  const rawJson: Json = {
    matched_user: matchedUser as Json,
    user_contest_ranking:
      (response.data?.userContestRanking as Json | undefined) ?? null,
    synced_at: lastUpdated,
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
