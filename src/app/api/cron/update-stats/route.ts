import { NextRequest, NextResponse } from "next/server";
import { syncCodeforcesStats } from "@/lib/stats/codeforces";
import { syncLeetCodeStats } from "@/lib/stats/leetcode";

type PlatformSyncResult =
  | {
      success: true;
      platform: "codeforces" | "leetcode";
      username: string;
      solved_count: number;
      last_updated: string;
    }
  | {
      success: false;
      platform: "codeforces" | "leetcode";
      error: string;
    };

function getAuthorizationError(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "CRON_SECRET is not configured.",
      },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  return null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown sync error.";
}

async function runPlatformSyncs(): Promise<PlatformSyncResult[]> {
  const [codeforces, leetcode] = await Promise.allSettled([
    syncCodeforcesStats(),
    syncLeetCodeStats(),
  ]);

  return [
    codeforces.status === "fulfilled"
      ? codeforces.value
      : {
          success: false,
          platform: "codeforces",
          error: errorMessage(codeforces.reason),
        },
    leetcode.status === "fulfilled"
      ? leetcode.value
      : {
          success: false,
          platform: "leetcode",
          error: errorMessage(leetcode.reason),
        },
  ];
}

// Runs daily from Vercel Cron using the schedule in vercel.json.
// Vercel triggers this route directly at /api/cron/update-stats.
// Set CRON_SECRET in Vercel environment variables and send it as a Bearer token.
export async function GET(request: NextRequest) {
  const authorizationError = getAuthorizationError(request);

  if (authorizationError) {
    return authorizationError;
  }

  const results = await runPlatformSyncs();
  const successCount = results.filter((result) => result.success).length;
  const hasPartialSuccess = successCount > 0 && successCount < results.length;
  const allSucceeded = successCount === results.length;

  return NextResponse.json(
    {
      success: allSucceeded,
      partial_success: hasPartialSuccess,
      results,
    },
    {
      status: allSucceeded ? 200 : hasPartialSuccess ? 207 : 500,
    },
  );
}
