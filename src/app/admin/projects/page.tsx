import Link from "next/link";
import { ProjectTable } from "@/components/admin/projects/ProjectTable";

export default function AdminProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-300">Admin Projects</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">
            Manage Projects
          </h1>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25"
        >
          New Project
        </Link>
      </div>

      <ProjectTable />
    </main>
  );
}
