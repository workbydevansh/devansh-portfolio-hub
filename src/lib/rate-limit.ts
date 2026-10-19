import "server-only";

import { NextRequest, NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const maxTrackedClients = 5000;

function getClientIp(request: NextRequest) {
  // Vercel sets these headers itself and overwrites client-supplied values.
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function pruneBuckets(now: number) {
  for (const [bucketKey, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(bucketKey);
    }
  }

  while (buckets.size >= maxTrackedClients) {
    const oldestKey = buckets.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    buckets.delete(oldestKey);
  }
}

// Best-effort fixed-window limiter. Counts live in this server instance's
// memory, so it slows down abuse from a single client but is not a global
// guarantee across every Vercel instance.
export function rateLimit(request: NextRequest, options: RateLimitOptions) {
  const now = Date.now();
  const bucketKey = `${options.key}:${getClientIp(request)}`;
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= maxTrackedClients) {
      pruneBuckets(now);
    }

    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  bucket.count += 1;

  if (bucket.count <= options.limit) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)),
      },
    },
  );
}
