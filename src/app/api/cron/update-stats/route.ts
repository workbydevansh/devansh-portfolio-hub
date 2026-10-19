import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { runStatsSync } from "@/lib/stats/sync";

function secretsMatch(received: string, expected: string) {
  // Hashing first gives equal-length buffers, so the comparison takes the same
  // time no matter how much of the secret a guess gets right.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(received), digest(expected));
}

function getAuthorizationError(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured; rejecting cron request.");
  }

  if (
    !cronSecret ||
    !secretsMatch(
      request.headers.get("authorization") ?? "",
      `Bearer ${cronSecret}`,
    )
  ) {
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

// Runs daily from Vercel Cron using the schedule in vercel.json.
// Vercel triggers this route directly at /api/cron/update-stats and sends
// CRON_SECRET from the Vercel environment variables as a Bearer token.
export async function GET(request: NextRequest) {
  const rateLimitError = rateLimit(request, {
    key: "cron-update-stats",
    limit: 10,
    windowMs: 60_000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const authorizationError = getAuthorizationError(request);

  if (authorizationError) {
    return authorizationError;
  }

  const result = await runStatsSync("both");

  return NextResponse.json(result, {
    status: result.success ? 200 : result.partial_success ? 207 : 500,
  });
}
