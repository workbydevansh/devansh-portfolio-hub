import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { syncCodeforcesStats } from "@/lib/stats/codeforces";
import { syncLeetCodeStats } from "@/lib/stats/leetcode";

type SyncTarget = "codeforces" | "leetcode" | "both";

function createAnonSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return false;
  }

  const anonSupabase = createAnonSupabaseClient();
  const {
    data: { user },
  } = await anonSupabase.auth.getUser(token);

  if (!user) {
    return false;
  }

  const serviceSupabase = createServiceRoleSupabaseClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown sync error.";
}

async function runSync(target: SyncTarget) {
  if (target === "codeforces") {
    return [await syncCodeforcesStats()];
  }

  if (target === "leetcode") {
    return [await syncLeetCodeStats()];
  }

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

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { target?: SyncTarget };
    const target = body.target;

    if (
      target !== "codeforces" &&
      target !== "leetcode" &&
      target !== "both"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid sync target.",
        },
        { status: 400 },
      );
    }

    const results = await runSync(target);
    const successCount = results.filter((result) => result.success).length;

    return NextResponse.json(
      {
        success: successCount === results.length,
        partial_success: successCount > 0 && successCount < results.length,
        results,
      },
      { status: successCount > 0 ? 200 : 500 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error),
      },
      { status: 500 },
    );
  }
}
