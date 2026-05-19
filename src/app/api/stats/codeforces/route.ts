import { NextRequest, NextResponse } from "next/server";
import { syncCodeforcesStats } from "@/lib/stats/codeforces";

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

export async function GET(request: NextRequest) {
  const authorizationError = getAuthorizationError(request);

  if (authorizationError) {
    return authorizationError;
  }

  try {
    const result = await syncCodeforcesStats();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync Codeforces stats.",
      },
      { status: 500 },
    );
  }
}
