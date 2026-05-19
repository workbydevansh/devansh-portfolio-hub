import { NextRequest, NextResponse } from "next/server";
import { syncLeetCodeStats } from "@/lib/stats/leetcode";

function getAuthorizationError(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return null;
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

export async function GET(request: NextRequest) {
  const authorizationError = getAuthorizationError(request);

  if (authorizationError) {
    return authorizationError;
  }

  try {
    const result = await syncLeetCodeStats();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync LeetCode stats.",
      },
      { status: 500 },
    );
  }
}
