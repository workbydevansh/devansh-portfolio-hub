import "server-only";

import { getErrorMessage } from "@/lib/utils";
import { syncCodeforcesStats } from "./codeforces";
import { syncLeetCodeStats } from "./leetcode";

export type SyncTarget = "codeforces" | "leetcode" | "both";

const syncers = {
  codeforces: syncCodeforcesStats,
  leetcode: syncLeetCodeStats,
};

export function isSyncTarget(value: unknown): value is SyncTarget {
  return value === "codeforces" || value === "leetcode" || value === "both";
}

// Platforms sync side by side; one failing never hides the other's result.
export async function runStatsSync(target: SyncTarget) {
  const platforms =
    target === "both" ? (["codeforces", "leetcode"] as const) : [target];
  const settled = await Promise.allSettled(
    platforms.map((platform) => syncers[platform]()),
  );
  const results = settled.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          success: false as const,
          platform: platforms[index],
          error: getErrorMessage(result.reason, "Unknown sync error."),
        },
  );
  const successCount = results.filter((result) => result.success).length;

  return {
    success: successCount === results.length,
    partial_success: successCount > 0 && successCount < results.length,
    results,
    error:
      successCount === 0
        ? results.map((result) => ("error" in result ? result.error : "")).join(" ")
        : undefined,
  };
}
