"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import type { Achievement } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export function AchievementTable({
  onMutate,
}: {
  onMutate: () => Promise<void>;
}) {
  return (
    <AdminTable<Achievement>
      table="achievements"
      noun="achievement"
      minWidthClassName="min-w-[860px]"
      deleteWarning="Related links and certificate attachments will be removed."
      onMutate={onMutate}
      orderBy={[
        { column: "display_order", ascending: true },
        { column: "achievement_date", ascending: false },
        { column: "created_at", ascending: false },
      ]}
      columns={[
        { header: "Title", cell: (achievement) => achievement.title },
        { header: "Category", cell: (achievement) => achievement.category ?? "General" },
        { header: "Organization", cell: (achievement) => achievement.organization ?? "Not added" },
        { header: "Rank / Result", cell: (achievement) => achievement.rank_or_result ?? "Not added" },
        { header: "Achievement Date", cell: (achievement) => formatDate(achievement.achievement_date) },
      ]}
    />
  );
}
