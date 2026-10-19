import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSyncTarget, runStatsSync } from "@/lib/stats/sync";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

async function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return false;
  }

  const {
    data: { user },
  } = await createServerSupabaseClient().auth.getUser(token);

  if (!user) {
    return false;
  }

  const { data: profile } = await createServiceRoleSupabaseClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin";
}

export async function POST(request: NextRequest) {
  const rateLimitError = rateLimit(request, {
    key: "admin-stats-sync",
    limit: 10,
    windowMs: 60_000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  let isAdmin: boolean;

  try {
    isAdmin = await verifyAdmin(request);
  } catch (error) {
    // Keep configuration details in the server logs, not in the response.
    console.error("Admin verification failed:", error);
    return jsonError("Unable to verify admin access.", 500);
  }

  if (!isAdmin) {
    return jsonError("Unauthorized.", 401);
  }

  const body = (await request.json().catch(() => null)) as {
    target?: unknown;
  } | null;

  if (!isSyncTarget(body?.target)) {
    return jsonError("Invalid sync target.", 400);
  }

  // Only a verified admin reaches this point, so sync errors are shown.
  const result = await runStatsSync(body.target);

  return NextResponse.json(result, {
    status: result.success || result.partial_success ? 200 : 500,
  });
}
