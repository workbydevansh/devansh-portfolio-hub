"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import type { Project } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export function ProjectTable() {
  return (
    <AdminTable<Project>
      table="projects"
      noun="project"
      minWidthClassName="min-w-[760px]"
      orderBy={[
        { column: "display_order", ascending: true },
        { column: "created_at", ascending: false },
      ]}
      columns={[
        { header: "Title", cell: (project) => project.title },
        { header: "Category", cell: (project) => project.category ?? "Project" },
        { header: "Featured", cell: (project) => (project.featured ? "Yes" : "No") },
        { header: "Display Order", cell: (project) => project.display_order ?? 0 },
        { header: "Created At", cell: (project) => formatDate(project.created_at) },
      ]}
    />
  );
}
