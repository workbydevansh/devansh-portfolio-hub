import "server-only";

import { createClient } from "@supabase/supabase-js";
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
  const solvedProblems = new Map<string, CodeforcesProblem>();

  for (const submission of submissions) {
    if (submission.verdict !== "OK") {
      continue;
    }

    solvedProblems.set(getProblemKey(submission.problem), submission.problem);
  }

  return Array.from(solvedProblems.values());
}

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

export async function syncCodeforcesStats(): Promise<SyncCodeforcesResult> {
  const handle = process.env.CODEFORCES_HANDLE || "boyzzz";

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
  const lastUpdated = new Date().toISOString();
  const rawJson: Json = {
    user_info: user as Json,
    rating_changes: ratingChanges as Json,
    submissions: submissions as Json,
    solved_problems: solvedProblems as Json,
    synced_at: lastUpdated,
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
      solved_count: solvedProblems.length,
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
    solved_count: solvedProblems.length,
    last_updated: lastUpdated,
  };
}
